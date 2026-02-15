-- Autoriser NULL pour genre (si la colonne a déjà été créée avec CHECK strict)
-- Exécuter dans Supabase → SQL Editor si vous avez l'erreur "violates check constraint"

DO $$
DECLARE
  conname text;
BEGIN
  FOR conname IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
    JOIN pg_class t ON t.oid = c.conrelid
    WHERE t.relname = 'listings' AND a.attname = 'genre' AND c.contype = 'c'
  LOOP
    EXECUTE format('ALTER TABLE public.listings DROP CONSTRAINT IF EXISTS %I', conname);
  END LOOP;
  ALTER TABLE public.listings
    ADD CONSTRAINT listings_genre_check CHECK (genre IS NULL OR genre IN ('homme', 'femme'));
EXCEPTION
  WHEN duplicate_object THEN NULL; -- contrainte déjà existante
END $$;
