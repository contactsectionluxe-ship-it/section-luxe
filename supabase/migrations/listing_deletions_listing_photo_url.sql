-- Photo principale au moment de la suppression (affichage grille type catalogue, Mes ventes).
ALTER TABLE public.listing_deletions
  ADD COLUMN IF NOT EXISTS listing_photo_url TEXT;

COMMENT ON COLUMN public.listing_deletions.listing_photo_url IS 'URL de la 1re photo au moment de la suppression (Mes ventes, popups vendu/réservé)';
