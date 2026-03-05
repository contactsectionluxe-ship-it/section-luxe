-- Titre de l'annonce au moment de la suppression (pour affichage dans Mes ventes)
ALTER TABLE public.listing_deletions
  ADD COLUMN IF NOT EXISTS listing_title TEXT;
