-- Journal des choix de cookies (preuve côté serveur). Insertion uniquement via service_role (API route).
-- Exécuter dans Supabase → SQL Editor si vous n’utilisez pas la CLI de migration.

CREATE TABLE IF NOT EXISTS consent_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  policy_version smallint NOT NULL,
  analytics_granted boolean NOT NULL,
  marketing_granted boolean NOT NULL,
  source text NOT NULL CHECK (source IN ('accept_all', 'reject_all', 'customize')),
  user_agent text,
  locale text
);

CREATE INDEX IF NOT EXISTS consent_logs_created_at_idx ON consent_logs (created_at DESC);

ALTER TABLE consent_logs ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE consent_logs IS 'Traces des consentements cookies (RGPD) — écriture serveur uniquement.';
