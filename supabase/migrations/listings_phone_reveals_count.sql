-- Compteur d'affichages du numéro de téléphone (clic sur "N° téléphone") par annonce
-- Exécuter dans Supabase → SQL Editor

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS phone_reveals_count INTEGER NOT NULL DEFAULT 0;

-- Incrémenter le compteur (appelé quand un visiteur affiche le numéro)
CREATE OR REPLACE FUNCTION increment_phone_reveals(p_listing_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.listings
  SET phone_reveals_count = COALESCE(phone_reveals_count, 0) + 1
  WHERE id = p_listing_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Tout le monde peut incrémenter (visiteur anonyme ou connecté)
GRANT EXECUTE ON FUNCTION increment_phone_reveals(UUID) TO anon;
GRANT EXECUTE ON FUNCTION increment_phone_reveals(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_phone_reveals(UUID) TO service_role;
