-- Numéro d'annonce : 10K2001, 10K2002, ... 10K9999, puis 11K1001, etc.
-- À exécuter dans Supabase SQL Editor

ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS listing_number TEXT UNIQUE;

-- Optionnel : attribuer des numéros aux annonces existantes (à exécuter une fois si besoin)
-- DO $$
-- DECLARE
--   r RECORD;
--   n INT := 2000;
-- BEGIN
--   FOR r IN (SELECT id FROM public.listings ORDER BY created_at) LOOP
--     n := n + 1;
--     IF n > 9999 THEN
--       n := 1001;
--     END IF;
--     UPDATE public.listings SET listing_number = '10K' || n WHERE id = r.id;
--   END LOOP;
-- END $$;
