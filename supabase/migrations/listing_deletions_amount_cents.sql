-- Montant (prix) pour les suppressions "Article vendu" (optionnel)
-- À exécuter dans Supabase → SQL Editor après listing_deletions.sql

ALTER TABLE public.listing_deletions
  ADD COLUMN IF NOT EXISTS amount_cents INT;

COMMENT ON COLUMN public.listing_deletions.amount_cents IS 'Prix de l''annonce en centimes au moment de la suppression (pour raison vendu)';
