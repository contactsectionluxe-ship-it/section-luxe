-- Champ Genre (Homme / Femme) pour les annonces
-- Exécuter dans Supabase → SQL Editor

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS genre TEXT;

-- Contrainte : valeur optionnelle, mais si renseignée doit être 'homme' ou 'femme'
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'listings_genre_check'
  ) THEN
    ALTER TABLE public.listings
      ADD CONSTRAINT listings_genre_check CHECK (genre IS NULL OR genre IN ('homme', 'femme'));
  END IF;
END $$;
