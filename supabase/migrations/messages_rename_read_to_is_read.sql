-- La colonne "read" peut être ambiguë côté API / sérialisation ; renommer en is_read.
-- Met à jour la RPC mark_conversation_messages_read en conséquence.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'messages'
      AND column_name = 'read'
  ) THEN
    ALTER TABLE public.messages RENAME COLUMN read TO is_read;
  END IF;
END $$;

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

  PERFORM set_config('row_security', 'off', true);

  UPDATE public.messages m
  SET is_read = true
  WHERE m.conversation_id = p_conversation_id
    AND m.sender_id IS DISTINCT FROM v_uid
    AND m.is_read = false;
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_conversation_messages_read(UUID) TO authenticated;
