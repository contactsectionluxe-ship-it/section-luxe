-- Codes OTP changement d’e-mail (visiteur) — accès uniquement via API service_role
CREATE TABLE IF NOT EXISTS public.email_change_otp (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS email_change_otp_user_idx ON public.email_change_otp (user_id);

-- Après vérification du code : autorise l’étape « nouvelle adresse » (TTL court)
CREATE TABLE IF NOT EXISTS public.email_change_verified (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  verified_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);

ALTER TABLE public.email_change_otp ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_change_verified ENABLE ROW LEVEL SECURITY;

CREATE POLICY "email_change_otp_block" ON public.email_change_otp FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY "email_change_verified_block" ON public.email_change_verified FOR ALL USING (false) WITH CHECK (false);
