-- Permettre aux vendeurs de supprimer leurs propres enregistrements (pour "supprimer une vente" dans Mes ventes)
DROP POLICY IF EXISTS "Vendeurs peuvent supprimer leurs propres suppressions" ON public.listing_deletions;
CREATE POLICY "Vendeurs peuvent supprimer leurs propres suppressions"
  ON public.listing_deletions FOR DELETE
  TO authenticated
  USING (auth.uid() = seller_id);
