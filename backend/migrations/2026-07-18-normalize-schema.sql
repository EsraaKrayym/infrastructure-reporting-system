BEGIN;

-- =========================================
-- 1) Lookup-Tabellen anlegen
-- =========================================
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS report_statuses (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL,
    is_final BOOLEAN NOT NULL DEFAULT false
);

-- Seeds (idempotent)
INSERT INTO roles (name, description)
VALUES
    ('citizen', 'Bürgerinnen und Bürger: Meldungen erstellen und eigene Meldungen einsehen'),
    ('caseworker', 'Sachbearbeitung: Meldungen prüfen, bearbeiten und Status ändern'),
    ('admin', 'Administration: Benutzerkonten und System verwalten')
ON CONFLICT (name) DO UPDATE
SET description = EXCLUDED.description;

INSERT INTO categories (name, description)
VALUES
    ('Straßenschäden', 'Schlaglöcher, Risse und beschädigte Fahrbahnen'),
    ('Beleuchtung', 'Defekte Straßenlampen und schlechte Beleuchtung'),
    ('Müll', 'Illegale Ablagerungen, überfüllte Mülleimer, Sauberkeit'),
    ('Sonstiges', 'Weitere Infrastrukturprobleme')
ON CONFLICT (name) DO UPDATE
SET description = EXCLUDED.description;

INSERT INTO report_statuses (name, description, is_final)
VALUES
    ('Neu', 'Neu eingegangene Meldung', false),
    ('In Prüfung', 'Meldung wird geprüft', false),
    ('In Bearbeitung', 'Meldung wird bearbeitet', false),
    ('Erledigt', 'Meldung wurde abgeschlossen', true),
    ('Abgelehnt', 'Meldung wurde abgelehnt', true)
ON CONFLICT (name) DO UPDATE
SET description = EXCLUDED.description,
    is_final = EXCLUDED.is_final;

-- =========================================
-- 2) users auf role_id umstellen
-- =========================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS role_id INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS blocked BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Aus altem Freitext role -> role_id befüllen (falls role-Spalte existiert)
DO $$
DECLARE has_role_column BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'users'
          AND column_name = 'role'
    ) INTO has_role_column;

    IF has_role_column THEN
        UPDATE users u
        SET role_id = r.id
        FROM roles r
        WHERE u.role_id IS NULL
          AND LOWER(COALESCE(u.role, 'citizen')) = LOWER(r.name);
    END IF;
END $$;

-- Fallback für alle nicht gemappten Rollen
UPDATE users
SET role_id = (SELECT id FROM roles WHERE name = 'citizen')
WHERE role_id IS NULL;

-- FK users.role_id -> roles.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_users_role_id'
    ) THEN
        ALTER TABLE users
            ADD CONSTRAINT fk_users_role_id
            FOREIGN KEY (role_id) REFERENCES roles(id);
    END IF;
END $$;

ALTER TABLE users ALTER COLUMN role_id SET NOT NULL;

-- =========================================
-- 3) reports auf category_id/status_id umstellen
-- =========================================
ALTER TABLE reports ADD COLUMN IF NOT EXISTS category_id INTEGER;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS status_id INTEGER;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium';
ALTER TABLE reports ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS photo TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- category_id aus alter category-Spalte befüllen (falls vorhanden)
DO $$
DECLARE has_category_column BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'reports'
          AND column_name = 'category'
    ) INTO has_category_column;

    IF has_category_column THEN
        UPDATE reports rp
        SET category_id = c.id
        FROM categories c
        WHERE rp.category_id IS NULL
          AND LOWER(c.name) = LOWER(
              CASE
                  WHEN LOWER(COALESCE(rp.category, '')) = 'road_damage' THEN 'Straßenschäden'
                  WHEN LOWER(COALESCE(rp.category, '')) = 'street_light' THEN 'Beleuchtung'
                  WHEN LOWER(COALESCE(rp.category, '')) = 'waste' THEN 'Müll'
                  WHEN LOWER(COALESCE(rp.category, '')) = 'other' THEN 'Sonstiges'
                  WHEN LOWER(COALESCE(rp.category, '')) = 'müll & sauberkeit' THEN 'Müll'
                  WHEN COALESCE(rp.category, '') = '' THEN 'Sonstiges'
                  ELSE rp.category
              END
          );
    END IF;
END $$;

-- Restliche category_id als Sonstiges
UPDATE reports
SET category_id = (SELECT id FROM categories WHERE name = 'Sonstiges')
WHERE category_id IS NULL;

-- status_id aus alter status-Spalte befüllen (falls vorhanden)
DO $$
DECLARE has_status_column BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'reports'
          AND column_name = 'status'
    ) INTO has_status_column;

    IF has_status_column THEN
        UPDATE reports rp
        SET status_id = s.id
        FROM report_statuses s
        WHERE rp.status_id IS NULL
          AND LOWER(s.name) = LOWER(
              CASE
                  WHEN LOWER(COALESCE(rp.status, '')) IN ('new', 'neu', 'open', 'pending') THEN 'Neu'
                  WHEN LOWER(COALESCE(rp.status, '')) IN ('in_review', 'in prüfung') THEN 'In Prüfung'
                  WHEN LOWER(COALESCE(rp.status, '')) IN ('in progress', 'in_progress', 'in bearbeitung') THEN 'In Bearbeitung'
                  WHEN LOWER(COALESCE(rp.status, '')) IN ('repaired', 'done', 'fixed', 'completed', 'erledigt') THEN 'Erledigt'
                  WHEN LOWER(COALESCE(rp.status, '')) IN ('abgelehnt', 'rejected', 'declined') THEN 'Abgelehnt'
                  WHEN COALESCE(rp.status, '') = '' THEN 'Neu'
                  ELSE rp.status
              END
          );
    END IF;
END $$;

-- Restliche status_id als Neu
UPDATE reports
SET status_id = (SELECT id FROM report_statuses WHERE name = 'Neu')
WHERE status_id IS NULL;

-- Priorität normalisieren
UPDATE reports
SET priority = CASE
    WHEN LOWER(COALESCE(priority, '')) IN ('low', 'niedrig') THEN 'low'
    WHEN LOWER(COALESCE(priority, '')) IN ('high', 'hoch', 'gefährlich') THEN 'high'
    ELSE 'medium'
END;

-- FKs für reports
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_reports_category_id'
    ) THEN
        ALTER TABLE reports
            ADD CONSTRAINT fk_reports_category_id
            FOREIGN KEY (category_id) REFERENCES categories(id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_reports_status_id'
    ) THEN
        ALTER TABLE reports
            ADD CONSTRAINT fk_reports_status_id
            FOREIGN KEY (status_id) REFERENCES report_statuses(id);
    END IF;
END $$;

-- Not-Null nur setzen, wenn aktuell möglich
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM reports WHERE category_id IS NULL) THEN
        ALTER TABLE reports ALTER COLUMN category_id SET NOT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM reports WHERE status_id IS NULL) THEN
        ALTER TABLE reports ALTER COLUMN status_id SET NOT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM reports WHERE user_id IS NULL) THEN
        ALTER TABLE reports ALTER COLUMN user_id SET NOT NULL;
    END IF;
END $$;

-- Priority-Check-Constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_reports_priority'
    ) THEN
        ALTER TABLE reports
            ADD CONSTRAINT chk_reports_priority
            CHECK (priority IN ('low', 'medium', 'high'));
    END IF;
END $$;

-- =========================================
-- 4) audit_logs erweitern
-- =========================================
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS old_value TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS new_value TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- =========================================
-- 5) Indizes
-- =========================================
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_category_id ON reports(category_id);
CREATE INDEX IF NOT EXISTS idx_reports_status_id ON reports(status_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_report_id ON audit_logs(report_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_changed_by ON audit_logs(changed_by);

COMMIT;
