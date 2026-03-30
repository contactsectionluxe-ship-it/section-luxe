-- Corrige : infinite recursion detected in policy for relation "sale_proposal_invited_sellers"
-- Les politiques sur sale_proposals et sale_proposal_invited_sellers se référençaient en boucle (EXISTS sous RLS).
-- À exécuter une fois dans Supabase → SQL si vous avez déjà appliqué sale_proposals_and_conversations.sql sans les fonctions ci-dessous.

CREATE OR REPLACE FUNCTION public.sale_proposal_visitor_is_owner(p_proposal_id uuid, p_uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.sale_proposals sp
    WHERE sp.id = p_proposal_id AND sp.visitor_id = p_uid
  );
$$;

CREATE OR REPLACE FUNCTION public.sale_proposal_seller_is_invited(p_proposal_id uuid, p_seller_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.sale_proposal_invited_sellers i
    WHERE i.proposal_id = p_proposal_id AND i.seller_id = p_seller_id
  );
$$;

GRANT EXECUTE ON FUNCTION public.sale_proposal_visitor_is_owner(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sale_proposal_seller_is_invited(uuid, uuid) TO authenticated;

DROP POLICY IF EXISTS "sale_proposals_seller_invited_select" ON public.sale_proposals;
CREATE POLICY "sale_proposals_seller_invited_select" ON public.sale_proposals
  FOR SELECT
  USING (public.sale_proposal_seller_is_invited(sale_proposals.id, auth.uid()));

DROP POLICY IF EXISTS "sale_proposal_invites_visitor_select" ON public.sale_proposal_invited_sellers;
CREATE POLICY "sale_proposal_invites_visitor_select" ON public.sale_proposal_invited_sellers
  FOR SELECT
  USING (public.sale_proposal_visitor_is_owner(proposal_id, auth.uid()));

DROP POLICY IF EXISTS "sale_proposal_invites_visitor_insert" ON public.sale_proposal_invited_sellers;
CREATE POLICY "sale_proposal_invites_visitor_insert" ON public.sale_proposal_invited_sellers
  FOR INSERT
  WITH CHECK (public.sale_proposal_visitor_is_owner(proposal_id, auth.uid()));
