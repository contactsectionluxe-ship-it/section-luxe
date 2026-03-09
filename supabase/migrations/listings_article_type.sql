-- Type de produit (ex. sneakers, sac_main, tshirt_polo) pour filtrage catalogue
-- Exécuter dans Supabase → SQL Editor

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS article_type TEXT;

COMMENT ON COLUMN public.listings.article_type IS 'Type d''article (value du formulaire Déposer une annonce): ex. sneakers, sac_main, tshirt_polo, colliers.';
