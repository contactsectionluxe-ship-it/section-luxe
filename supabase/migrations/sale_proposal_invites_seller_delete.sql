-- Le vendeur peut supprimer uniquement sa ligne d’invitation (retire la proposition de son Sourcing,
-- sans toucher aux autres vendeurs ni à la proposition côté acheteur).

DROP POLICY IF EXISTS "sale_proposal_invites_seller_delete" ON public.sale_proposal_invited_sellers;
CREATE POLICY "sale_proposal_invites_seller_delete" ON public.sale_proposal_invited_sellers
  FOR DELETE
  USING (seller_id = auth.uid());
