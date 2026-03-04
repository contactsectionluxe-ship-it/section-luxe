-- Preuve d'acceptation des CGU/CGV : date, heure, version, id utilisateur, contexte
-- À exécuter dans Supabase → SQL Editor

CREATE TABLE IF NOT EXISTS public.cgu_cgv_acceptances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  cgu_cgv_version TEXT NOT NULL,
  context TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS cgu_cgv_acceptances_user_id_idx ON public.cgu_cgv_acceptances(user_id);
CREATE INDEX IF NOT EXISTS cgu_cgv_acceptances_accepted_at_idx ON public.cgu_cgv_acceptances(accepted_at DESC);

-- RLS : seules les insertions via service_role (API) sont autorisées ; les utilisateurs ne voient pas la table
ALTER TABLE public.cgu_cgv_acceptances ENABLE ROW LEVEL SECURITY;

-- Aucune policy pour les utilisateurs : l'API utilise le service_role qui contourne la RLS
-- Si besoin de permettre à un user de lire ses propres acceptances plus tard :
-- CREATE POLICY "User can read own acceptances" ON public.cgu_cgv_acceptances FOR SELECT USING (user_id = auth.uid());
