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

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role_id INTEGER NOT NULL REFERENCES roles(id),
    blocked BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reports (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category_id INTEGER NOT NULL REFERENCES categories(id),
    latitude REAL,
    longitude REAL,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status_id INTEGER NOT NULL REFERENCES report_statuses(id),
    priority TEXT DEFAULT 'medium',
    address TEXT,
    photo TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_reports_priority CHECK (priority IN ('low', 'medium', 'high'))
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    report_id INTEGER REFERENCES reports(id) ON DELETE CASCADE,
    changed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed Rollen
INSERT INTO roles (name, description)
VALUES
    ('citizen', 'Bürgerinnen und Bürger: Meldungen erstellen und eigene Meldungen einsehen'),
    ('caseworker', 'Sachbearbeitung: Meldungen prüfen, bearbeiten und Status ändern'),
    ('admin', 'Administration: Benutzerkonten und System verwalten')
ON CONFLICT (name) DO UPDATE
SET description = EXCLUDED.description;

-- Seed Kategorien
INSERT INTO categories (name, description)
VALUES
    ('Straßenschäden', 'Schlaglöcher, Risse und beschädigte Fahrbahnen'),
    ('Beleuchtung', 'Defekte Straßenlampen und schlechte Beleuchtung'),
    ('Müll', 'Illegale Ablagerungen, überfüllte Mülleimer, Sauberkeit'),
    ('Sonstiges', 'Weitere Infrastrukturprobleme')
ON CONFLICT (name) DO UPDATE
SET description = EXCLUDED.description;

-- Seed Report-Status
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

CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_category_id ON reports(category_id);
CREATE INDEX IF NOT EXISTS idx_reports_status_id ON reports(status_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_report_id ON audit_logs(report_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_changed_by ON audit_logs(changed_by);
