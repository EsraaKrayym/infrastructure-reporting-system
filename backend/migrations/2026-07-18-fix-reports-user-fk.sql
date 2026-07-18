BEGIN;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_reports_user_id'
    ) THEN
        ALTER TABLE reports
            ADD CONSTRAINT fk_reports_user_id
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Optional: nur setzen, wenn keine NULLs vorhanden sind
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM reports WHERE user_id IS NULL) THEN
        ALTER TABLE reports ALTER COLUMN user_id SET NOT NULL;
    END IF;
END $$;

COMMIT;
