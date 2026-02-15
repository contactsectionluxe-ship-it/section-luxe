-- Passer genre en tableau TEXT[] pour permettre Femme + Homme (ou les deux)
-- Exécuter dans Supabase → SQL Editor (une seule fois)

-- 1. Supprimer l'ancienne contrainte (obligatoire avant de changer le type)
ALTER TABLE public.listings DROP CONSTRAINT IF EXISTS listings_genre_check;

-- 2. Convertir la colonne TEXT en TEXT[] (conserve les valeurs existantes)
ALTER TABLE public.listings
  ALTER COLUMN genre TYPE TEXT[] USING (
    CASE WHEN genre IS NULL THEN NULL ELSE ARRAY[genre] END
  );

-- 3. Nouvelle contrainte : tableau vide/null ou uniquement 'homme' et/ou 'femme'
ALTER TABLE public.listings
  ADD CONSTRAINT listings_genre_check
  CHECK (genre IS NULL OR genre <@ ARRAY['homme', 'femme']::text[]);
