-- Ajouter ville et code postal pour les vendeurs
-- À exécuter dans Supabase : SQL Editor → Coller ce script → Run

ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS city TEXT DEFAULT '';
ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS postcode TEXT DEFAULT '';

-- Après exécution : dans src/lib/supabase/auth.ts, décommenter les lignes
-- "if (data.city ...)" et "if (data.postcode ...)" dans updateSellerProfile,
-- et réajouter dans signUpSeller .insert() : city: sellerData.city ?? '', postcode: sellerData.postcode ?? '',
