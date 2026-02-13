-- Toutes les colonnes optionnelles de la table sellers (ville, code postal, photo de profil)
-- À exécuter une seule fois dans Supabase : SQL Editor → Coller → Run
-- Ensuite, dans src/lib/supabase/auth.ts, décommenter les 3 lignes dans updateSellerProfile
-- (avatar_url, city, postcode) et dans signUpSeller réajouter city/postcode dans l'insert.

ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS city TEXT DEFAULT '';
ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS postcode TEXT DEFAULT '';
ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT NULL;
