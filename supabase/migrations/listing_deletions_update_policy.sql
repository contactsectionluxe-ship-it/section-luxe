-- Permettre aux vendeurs de mettre à jour leurs propres enregistrements (ex. passer "réservé" en "vendu")
DROP POLICY IF EXISTS "Vendeurs peuvent mettre à jour leurs propres suppressions" ON public.listing_deletions;
CREATE POLICY "Vendeurs peuvent mettre à jour leurs propres suppressions"
  ON public.listing_deletions FOR UPDATE
  TO authenticated
  USING (auth.uid() = seller_id)
  WITH CHECK (auth.uid() = seller_id);
