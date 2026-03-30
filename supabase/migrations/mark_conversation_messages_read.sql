-- Quand un participant ouvre la conversation, marquer comme lus les messages de l’autre
-- (read = true sur les lignes dont l’expéditeur n’est pas le lecteur).
-- Utilisé pour les accusés de lecture sous les messages envoyés (simple / double coche).

CREATE OR REPLACE FUNCTION public.mark_conversation_messages_read(p_conversation_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = p_conversation_id AND (c.buyer_id = v_uid OR c.seller_id = v_uid)
  ) THEN
    RAISE EXCEPTION 'Conversation introuvable ou accès refusé';
  END IF;

  UPDATE public.messages m
  SET read = true
  WHERE m.conversation_id = p_conversation_id
    AND m.sender_id IS DISTINCT FROM v_uid
    AND m.read = false;
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_conversation_messages_read(UUID) TO authenticated;
