-- Garder les lignes de conversation quand une annonce catalogue est supprimée (DELETE sur listings).
-- Avant : ON DELETE CASCADE supprimait la conversation et tous les messages.
-- Après : listing_id passe à NULL ; listing_title / listing_photo sur conversations restent pour l’affichage.
-- Prérequis : conversations.listing_id doit accepter NULL (déjà le cas après sale_proposals_and_conversations.sql).

ALTER TABLE public.conversations
  DROP CONSTRAINT IF EXISTS conversations_listing_id_fkey;

ALTER TABLE public.conversations
  ADD CONSTRAINT conversations_listing_id_fkey
  FOREIGN KEY (listing_id)
  REFERENCES public.listings(id)
  ON DELETE SET NULL;
