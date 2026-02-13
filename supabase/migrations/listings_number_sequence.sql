-- Numéro d'annonce unique à vie (jamais réutilisé même si annonce supprimée)
-- À exécuter dans Supabase SQL Editor

-- Séquence : 1, 2, 3, ... (jamais réutilisée)
CREATE SEQUENCE IF NOT EXISTS public.listing_number_seq START 1;

-- Fonction : convertit la valeur séquence en format 10K2001, 10K2002, ... 10K9999, puis 11K1001, etc.
CREATE OR REPLACE FUNCTION public.get_next_listing_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n BIGINT;
  prefix INT;
  num INT;
BEGIN
  n := nextval('public.listing_number_seq');
  IF n <= 7999 THEN
    RETURN '10K' || (2000 + n)::TEXT;
  ELSE
    prefix := 11 + ((n - 8000) / 8999)::INT;
    num := 1001 + ((n - 8000) % 8999)::INT;
    RETURN prefix::TEXT || 'K' || num::TEXT;
  END IF;
END;
$$;

-- Autoriser les utilisateurs authentifiés à appeler la fonction
GRANT EXECUTE ON FUNCTION public.get_next_listing_number() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_next_listing_number() TO service_role;
