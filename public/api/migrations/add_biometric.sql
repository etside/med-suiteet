-- WebAuthn / biometric columns (MySQL 8+)
-- mysql -u user -p your_db < public/api/migrations/add_biometric.sql

ALTER TABLE users ADD COLUMN biometric_enrolled TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN biometric_data JSON NULL;
ALTER TABLE users ADD COLUMN webauthn_challenge VARCHAR(128) NULL;
ALTER TABLE users ADD COLUMN webauthn_challenge_expires DATETIME NULL;
