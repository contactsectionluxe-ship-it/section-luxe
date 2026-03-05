-- Historique des suppressions d'annonces (raison pour statistiques "Mes ventes")
-- À exécuter dans Supabase → SQL Editor

CREATE TABLE IF NOT EXISTS public.listing_deletions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL,
  seller_id UUID NOT NULL,
  reason TEXT NOT NULL,
  deleted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_listing_deletions_seller_deleted
  ON public.listing_deletions (seller_id, deleted_at);

ALTER TABLE public.listing_deletions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendeurs peuvent insérer leurs propres suppressions"
  ON public.listing_deletions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Vendeurs peuvent lire leurs propres suppressions"
  ON public.listing_deletions FOR SELECT
  TO authenticated
  USING (auth.uid() = seller_id);
