-- Limite 1 appel (révélation du numéro) par utilisateur/visiteur par annonce
-- Exécuter dans Supabase → SQL Editor après listings_phone_reveals_count.sql

-- Table pour savoir qui a déjà révélé le numéro pour quelle annonce
CREATE TABLE IF NOT EXISTS public.listing_phone_reveals (
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  revealer_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (listing_id, revealer_id)
);

-- Index pour les requêtes par revealer_id si besoin
CREATE INDEX IF NOT EXISTS idx_listing_phone_reveals_revealer_id ON public.listing_phone_reveals(revealer_id);

-- RLS : pas d'accès direct nécessaire depuis l'app (la RPC fait tout)
ALTER TABLE public.listing_phone_reveals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Aucun accès direct" ON public.listing_phone_reveals FOR ALL USING (false);

-- Nouvelle fonction : n'incrémente que si (listing_id, revealer_id) n'existe pas encore
-- revealer_id = auth.uid() pour un utilisateur connecté, sinon p_visitor_id (id visiteur anonyme)
CREATE OR REPLACE FUNCTION public.increment_phone_reveals(p_listing_id UUID, p_visitor_id TEXT DEFAULT NULL)
RETURNS VOID AS $$
DECLARE
  v_revealer_id TEXT;
  v_row_count INT;
BEGIN
  -- Utilisateur connecté : auth.uid() ; sinon visiteur anonyme : p_visitor_id
  v_revealer_id := COALESCE(trim(auth.uid()::TEXT), trim(p_visitor_id));
  IF v_revealer_id IS NULL OR v_revealer_id = '' THEN
    RETURN;
  END IF;

  INSERT INTO public.listing_phone_reveals (listing_id, revealer_id)
  VALUES (p_listing_id, v_revealer_id)
  ON CONFLICT (listing_id, revealer_id) DO NOTHING;

  GET DIAGNOSTICS v_row_count = ROW_COUNT;
  IF v_row_count = 1 THEN
    UPDATE public.listings
    SET phone_reveals_count = COALESCE(phone_reveals_count, 0) + 1
    WHERE id = p_listing_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.increment_phone_reveals(UUID, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.increment_phone_reveals(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_phone_reveals(UUID, TEXT) TO service_role;

NOTIFY pgrst, 'reload schema';
