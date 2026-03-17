-- =============================================================================
-- Listing deletions : table + colonnes pour "Mes ventes" (Article vendu / réservé)
-- À exécuter une fois dans Supabase → SQL Editor
-- =============================================================================

-- 1. Table principale
CREATE TABLE IF NOT EXISTS public.listing_deletions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL,
  seller_id UUID NOT NULL,
  reason TEXT NOT NULL,
  deleted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Colonnes optionnelles (montant + titre pour affichage Mes ventes)
ALTER TABLE public.listing_deletions
  ADD COLUMN IF NOT EXISTS amount_cents INT;

ALTER TABLE public.listing_deletions
  ADD COLUMN IF NOT EXISTS listing_title TEXT;

COMMENT ON COLUMN public.listing_deletions.amount_cents IS 'Prix de l''annonce en centimes au moment de la suppression (pour raison vendu/réservé)';
COMMENT ON COLUMN public.listing_deletions.listing_title IS 'Titre de l''annonce au moment de la suppression (affichage Mes ventes)';

-- 3. Index pour les requêtes par vendeur et date
CREATE INDEX IF NOT EXISTS idx_listing_deletions_seller_deleted
  ON public.listing_deletions (seller_id, deleted_at);

-- 4. RLS
ALTER TABLE public.listing_deletions ENABLE ROW LEVEL SECURITY;

-- Supprimer les policies si elles existent (pour ré-exécution propre)
DROP POLICY IF EXISTS "Vendeurs peuvent insérer leurs propres suppressions" ON public.listing_deletions;
DROP POLICY IF EXISTS "Vendeurs peuvent lire leurs propres suppressions" ON public.listing_deletions;

-- 5. Policies
CREATE POLICY "Vendeurs peuvent insérer leurs propres suppressions"
  ON public.listing_deletions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Vendeurs peuvent lire leurs propres suppressions"
  ON public.listing_deletions FOR SELECT
  TO authenticated
  USING (auth.uid() = seller_id);
