-- PostgreSQL: WebAuthn / biometric columns on users
ALTER TABLE users ADD COLUMN IF NOT EXISTS biometric_enrolled BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS biometric_data JSONB NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS webauthn_challenge VARCHAR(128) NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS webauthn_challenge_expires TIMESTAMPTZ NULL;
