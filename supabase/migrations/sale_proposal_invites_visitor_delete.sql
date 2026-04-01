-- Permet au propriétaire de la proposition de supprimer les lignes d’invitation
-- (nécessaire pour updateVisitorSaleProposalWithInvites : delete puis insert).
-- Sans cette politique, le DELETE sous RLS ne supprime aucune ligne et l’insert suivant viole la PK.

DROP POLICY IF EXISTS "sale_proposal_invites_visitor_delete" ON public.sale_proposal_invited_sellers;
CREATE POLICY "sale_proposal_invites_visitor_delete" ON public.sale_proposal_invited_sellers
  FOR DELETE
  USING (public.sale_proposal_visitor_is_owner(proposal_id, auth.uid()));
