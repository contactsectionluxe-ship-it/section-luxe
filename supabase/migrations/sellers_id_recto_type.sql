-- Type de justificatif d'identité recto envoyé par le vendeur : Passeport ou CNI recto
-- À exécuter dans Supabase : SQL Editor → Run

ALTER TABLE public.sellers
  ADD COLUMN IF NOT EXISTS id_recto_type TEXT
  CHECK (id_recto_type IS NULL OR id_recto_type IN ('passeport', 'cni_recto'));

COMMENT ON COLUMN public.sellers.id_recto_type IS 'Type du document recto : passeport ou cni_recto';
