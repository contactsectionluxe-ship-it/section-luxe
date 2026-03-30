-- Propositions de vente (visiteurs) + conversations liées (sans annonce catalogue)
-- Réexécutable : IF NOT EXISTS / DROP IF EXISTS ciblés

CREATE TABLE IF NOT EXISTS public.sale_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL,
  genre TEXT[] DEFAULT '{}',
  article_type TEXT,
  brand TEXT,
  model TEXT,
  condition TEXT,
  material TEXT,
  color TEXT,
  size TEXT,
  height_cm INTEGER,
  width_cm INTEGER,
  year INTEGER,
  packaging TEXT[],
  wish_price_cents INTEGER NOT NULL,
  locations JSONB NOT NULL DEFAULT '[]'::jsonb,
  photo_urls TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sale_proposal_invited_sellers (
  proposal_id UUID NOT NULL REFERENCES public.sale_proposals(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  estimated_price_cents INTEGER,
  seller_note TEXT,
  updated_at TIMESTAMPTZ,
  PRIMARY KEY (proposal_id, seller_id)
);

CREATE INDEX IF NOT EXISTS idx_sale_proposals_visitor_id ON public.sale_proposals(visitor_id);
CREATE INDEX IF NOT EXISTS idx_sale_proposal_invited_seller_id ON public.sale_proposal_invited_sellers(seller_id);

-- Évite la récursion infinie RLS : les politiques ne doivent pas se lire mutuellement via EXISTS sous RLS.
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

ALTER TABLE public.sale_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_proposal_invited_sellers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sale_proposals_visitor_all" ON public.sale_proposals;
CREATE POLICY "sale_proposals_visitor_all" ON public.sale_proposals
  FOR ALL
  USING (visitor_id = auth.uid())
  WITH CHECK (visitor_id = auth.uid());

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

DROP POLICY IF EXISTS "sale_proposal_invites_seller_select" ON public.sale_proposal_invited_sellers;
CREATE POLICY "sale_proposal_invites_seller_select" ON public.sale_proposal_invited_sellers
  FOR SELECT
  USING (seller_id = auth.uid());

DROP POLICY IF EXISTS "sale_proposal_invites_seller_update" ON public.sale_proposal_invited_sellers;
CREATE POLICY "sale_proposal_invites_seller_update" ON public.sale_proposal_invited_sellers
  FOR UPDATE
  USING (seller_id = auth.uid())
  WITH CHECK (seller_id = auth.uid());

-- Conversations : annonce optionnelle, lien proposition
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS sale_proposal_id UUID REFERENCES public.sale_proposals(id) ON DELETE CASCADE;

ALTER TABLE public.conversations ALTER COLUMN listing_id DROP NOT NULL;

ALTER TABLE public.conversations DROP CONSTRAINT IF EXISTS conversations_listing_id_buyer_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS conversations_listing_buyer_unique
  ON public.conversations(listing_id, buyer_id)
  WHERE listing_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS conversations_proposal_buyer_seller_unique
  ON public.conversations(sale_proposal_id, buyer_id, seller_id)
  WHERE sale_proposal_id IS NOT NULL;

-- RPC annonces (listing_id toujours non NULL ici)
CREATE OR REPLACE FUNCTION public.get_or_create_conversation(
  p_listing_id UUID,
  p_listing_title TEXT,
  p_listing_photo TEXT,
  p_buyer_id UUID,
  p_buyer_name TEXT,
  p_seller_id UUID,
  p_seller_name TEXT
)
RETURNS SETOF public.conversations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_buyer_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Seul l''acheteur peut appeler cette fonction';
  END IF;
  UPDATE public.conversations
  SET deleted_by_buyer_at = NULL,
      listing_title = p_listing_title,
      listing_photo = COALESCE(p_listing_photo, ''),
      buyer_name = p_buyer_name,
      seller_name = p_seller_name
  WHERE listing_id = p_listing_id AND buyer_id = p_buyer_id;
  IF FOUND THEN
    RETURN QUERY SELECT * FROM public.conversations WHERE listing_id = p_listing_id AND buyer_id = p_buyer_id LIMIT 1;
    RETURN;
  END IF;
  BEGIN
    RETURN QUERY
    INSERT INTO public.conversations (listing_id, sale_proposal_id, listing_title, listing_photo, buyer_id, buyer_name, seller_id, seller_name, last_message, unread_buyer, unread_seller)
    VALUES (p_listing_id, NULL, p_listing_title, COALESCE(p_listing_photo, ''), p_buyer_id, p_buyer_name, p_seller_id, p_seller_name, '', 0, 0)
    RETURNING *;
  EXCEPTION WHEN unique_violation THEN
    UPDATE public.conversations
    SET deleted_by_buyer_at = NULL,
        listing_title = p_listing_title,
        listing_photo = COALESCE(p_listing_photo, ''),
        buyer_name = p_buyer_name,
        seller_name = p_seller_name
    WHERE listing_id = p_listing_id AND buyer_id = p_buyer_id;
    RETURN QUERY SELECT * FROM public.conversations WHERE listing_id = p_listing_id AND buyer_id = p_buyer_id LIMIT 1;
  END;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_or_create_proposal_conversation(
  p_proposal_id UUID,
  p_listing_title TEXT,
  p_listing_photo TEXT,
  p_buyer_id UUID,
  p_buyer_name TEXT,
  p_seller_id UUID,
  p_seller_name TEXT
)
RETURNS SETOF public.conversations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS DISTINCT FROM p_buyer_id AND auth.uid() IS DISTINCT FROM p_seller_id THEN
    RAISE EXCEPTION 'Non autorisé';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.sale_proposals sp
    WHERE sp.id = p_proposal_id AND sp.visitor_id = p_buyer_id
  ) THEN
    RAISE EXCEPTION 'Proposition introuvable';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.sale_proposal_invited_sellers i
    WHERE i.proposal_id = p_proposal_id AND i.seller_id = p_seller_id
  ) THEN
    RAISE EXCEPTION 'Vendeur non invité sur cette proposition';
  END IF;

  UPDATE public.conversations
  SET deleted_by_buyer_at = NULL,
      deleted_by_seller_at = NULL,
      listing_title = p_listing_title,
      listing_photo = COALESCE(p_listing_photo, ''),
      buyer_name = p_buyer_name,
      seller_name = p_seller_name
  WHERE sale_proposal_id = p_proposal_id AND buyer_id = p_buyer_id AND seller_id = p_seller_id;
  IF FOUND THEN
    RETURN QUERY SELECT * FROM public.conversations
      WHERE sale_proposal_id = p_proposal_id AND buyer_id = p_buyer_id AND seller_id = p_seller_id LIMIT 1;
    RETURN;
  END IF;

  BEGIN
    RETURN QUERY
    INSERT INTO public.conversations (listing_id, sale_proposal_id, listing_title, listing_photo, buyer_id, buyer_name, seller_id, seller_name, last_message, unread_buyer, unread_seller)
    VALUES (NULL, p_proposal_id, p_listing_title, COALESCE(p_listing_photo, ''), p_buyer_id, p_buyer_name, p_seller_id, p_seller_name, '', 0, 0)
    RETURNING *;
  EXCEPTION WHEN unique_violation THEN
    UPDATE public.conversations
    SET deleted_by_buyer_at = NULL,
        deleted_by_seller_at = NULL,
        listing_title = p_listing_title,
        listing_photo = COALESCE(p_listing_photo, ''),
        buyer_name = p_buyer_name,
        seller_name = p_seller_name
    WHERE sale_proposal_id = p_proposal_id AND buyer_id = p_buyer_id AND seller_id = p_seller_id;
    RETURN QUERY SELECT * FROM public.conversations
      WHERE sale_proposal_id = p_proposal_id AND buyer_id = p_buyer_id AND seller_id = p_seller_id LIMIT 1;
  END;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_or_create_proposal_conversation(UUID, TEXT, TEXT, UUID, TEXT, UUID, TEXT) TO authenticated;
