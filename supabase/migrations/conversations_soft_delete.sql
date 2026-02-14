-- Suppression côté utilisateur uniquement : masquer la conversation pour celui qui supprime, pas pour l'autre.
-- Réexécutable.

-- Colonnes "supprimé par l'acheteur" / "par le vendeur" (NULL = encore visible pour ce côté)
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS deleted_by_buyer_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by_seller_at TIMESTAMPTZ;
-- "Effacer l'historique" côté utilisateur : n'afficher que les messages après cette date pour ce participant
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS buyer_cleared_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS seller_cleared_at TIMESTAMPTZ;

-- Backfill : pour les conversations déjà "supprimées", remplir *_cleared_at si manquant
UPDATE public.conversations SET buyer_cleared_at = deleted_by_buyer_at WHERE deleted_by_buyer_at IS NOT NULL AND buyer_cleared_at IS NULL;
UPDATE public.conversations SET seller_cleared_at = deleted_by_seller_at WHERE deleted_by_seller_at IS NOT NULL AND seller_cleared_at IS NULL;

-- Ne plus autoriser le DELETE pour les participants (on fait un UPDATE à la place)
DROP POLICY IF EXISTS "Participants can delete conversations" ON public.conversations;

-- Voir une conversation seulement si on est participant ET qu'on ne l'a pas "supprimée" de son côté
DROP POLICY IF EXISTS "Participants can view conversations" ON public.conversations;
CREATE POLICY "Participants can view conversations" ON public.conversations
  FOR SELECT
  USING (
    (buyer_id = auth.uid() AND deleted_by_buyer_at IS NULL)
    OR (seller_id = auth.uid() AND deleted_by_seller_at IS NULL)
  );

-- UPDATE : autoriser les participants à modifier (ex. deleted_by_buyer_at / deleted_by_seller_at)
-- WITH CHECK (true) évite le 403 sur la "nouvelle ligne" après UPDATE (sinon RLS peut la rejeter)
DROP POLICY IF EXISTS "Participants can update conversations" ON public.conversations;
CREATE POLICY "Participants can update conversations" ON public.conversations
  FOR UPDATE
  USING (buyer_id = auth.uid() OR seller_id = auth.uid())
  WITH CHECK (true);

-- RPC : obtenir ou créer une conversation (réaffiche pour l'acheteur si il l'avait supprimée)
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
  RETURN QUERY
  INSERT INTO public.conversations (listing_id, listing_title, listing_photo, buyer_id, buyer_name, seller_id, seller_name, last_message, unread_buyer, unread_seller)
  VALUES (p_listing_id, p_listing_title, COALESCE(p_listing_photo, ''), p_buyer_id, p_buyer_name, p_seller_id, p_seller_name, '', 0, 0)
  ON CONFLICT (listing_id, buyer_id) DO UPDATE SET
    deleted_by_buyer_at = NULL,
    listing_title = EXCLUDED.listing_title,
    listing_photo = EXCLUDED.listing_photo,
    buyer_name = EXCLUDED.buyer_name,
    seller_name = EXCLUDED.seller_name
  RETURNING *;
END;
$$;

-- RPC : masquer la conversation pour l'appelant uniquement (contourne RLS sur UPDATE)
CREATE OR REPLACE FUNCTION public.hide_conversation_for_me(p_conversation_id UUID, p_is_buyer BOOLEAN)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_updated INTEGER;
BEGIN
  IF p_is_buyer THEN
    UPDATE public.conversations
    SET deleted_by_buyer_at = NOW(), buyer_cleared_at = NOW()
    WHERE id = p_conversation_id AND buyer_id = v_uid;
  ELSE
    UPDATE public.conversations
    SET deleted_by_seller_at = NOW(), seller_cleared_at = NOW()
    WHERE id = p_conversation_id AND seller_id = v_uid;
  END IF;
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  IF v_updated = 0 THEN
    RAISE EXCEPTION 'Conversation introuvable ou accès refusé';
  END IF;
END;
$$;

-- Quand un message est envoyé, réafficher la conversation pour le destinataire (s'il l'avait masquée)
CREATE OR REPLACE FUNCTION public.unhide_conversation_for_recipient_on_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.conversations c
  SET
    deleted_by_buyer_at = CASE WHEN c.seller_id = NEW.sender_id THEN NULL ELSE c.deleted_by_buyer_at END,
    deleted_by_seller_at = CASE WHEN c.buyer_id = NEW.sender_id THEN NULL ELSE c.deleted_by_seller_at END
  WHERE c.id = NEW.conversation_id;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trigger_unhide_conversation_on_message ON public.messages;
CREATE TRIGGER trigger_unhide_conversation_on_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE PROCEDURE public.unhide_conversation_for_recipient_on_message();

-- RPC : récupérer les messages d'une conversation (optionnel : seulement après p_since pour "historique effacé")
CREATE OR REPLACE FUNCTION public.get_messages_for_conversation(
  p_conversation_id UUID,
  p_since_timestamptz TIMESTAMPTZ DEFAULT NULL,
  p_limit INTEGER DEFAULT 50
)
RETURNS SETOF public.messages
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = p_conversation_id AND (c.buyer_id = v_uid OR c.seller_id = v_uid)
  ) THEN
    RAISE EXCEPTION 'Conversation introuvable ou accès refusé';
  END IF;
  RETURN QUERY
  SELECT m.* FROM public.messages m
  WHERE m.conversation_id = p_conversation_id
    AND (p_since_timestamptz IS NULL OR m.created_at > p_since_timestamptz)
  ORDER BY m.created_at ASC
  LIMIT p_limit;
END;
$$;
