BEGIN;

-- Entfernt alte Freitext-Spalten nach erfolgreicher Normalisierung.
-- Sicher (idempotent), falls Spalten bereits entfernt wurden.

ALTER TABLE users DROP COLUMN IF EXISTS role;
ALTER TABLE reports DROP COLUMN IF EXISTS category;
ALTER TABLE reports DROP COLUMN IF EXISTS status;

COMMIT;
