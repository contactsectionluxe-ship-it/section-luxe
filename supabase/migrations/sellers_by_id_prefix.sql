-- Recherche vendeurs par préfixe UUID (8 premiers caractères hex) pour les URLs /catalogue/vendeur/{slug}-{prefix}
CREATE OR REPLACE FUNCTION public.sellers_by_id_prefix(p_prefix text)
RETURNS TABLE (id uuid, company_name text)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT s.id, s.company_name
  FROM public.sellers s
  WHERE s.id::text LIKE p_prefix || '%';
$$;

GRANT EXECUTE ON FUNCTION public.sellers_by_id_prefix(text) TO anon, authenticated;
