-- Les conversations doivent rester quand une annonce catalogue est supprimée (DELETE sur listings).
-- Sans cette FK en ON DELETE SET NULL, les lignes conversations (et messages en cascade) disparaissent.
-- Réexécutable : corrige aussi un schéma encore en NOT NULL + CASCADE.

ALTER TABLE public.conversations
  ALTER COLUMN listing_id DROP NOT NULL;

ALTER TABLE public.conversations
  DROP CONSTRAINT IF EXISTS conversations_listing_id_fkey;

ALTER TABLE public.conversations
  ADD CONSTRAINT conversations_listing_id_fkey
  FOREIGN KEY (listing_id)
  REFERENCES public.listings(id)
  ON DELETE SET NULL;
