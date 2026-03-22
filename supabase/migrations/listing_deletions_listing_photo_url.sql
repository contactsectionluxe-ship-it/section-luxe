-- Optionnel / hérité : l’app n’enregistre plus d’URL photo (fichiers supprimés après vente pour le stockage).
ALTER TABLE public.listing_deletions
  ADD COLUMN IF NOT EXISTS listing_photo_url TEXT;

COMMENT ON COLUMN public.listing_deletions.listing_photo_url IS 'Legacy : non utilisé par l’app (Mes ventes sans vignette).';
