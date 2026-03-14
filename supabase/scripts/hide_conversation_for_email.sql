-- Masquer pour contact.sectionluxe@gmail.com UNIQUEMENT la conversation où le VENDEUR est "Section Luxe".
-- (contact.sectionluxe@gmail.com = acheteur dans cette conversation, Section Luxe = vendeur)
-- À exécuter une seule fois dans le SQL Editor Supabase (Dashboard > SQL Editor).

DO $$
DECLARE
  v_user_id UUID;
  v_conv_id UUID;
BEGIN
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'contact.sectionluxe@gmail.com'
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Aucun utilisateur trouvé pour contact.sectionluxe@gmail.com';
  END IF;

  -- Uniquement les conversations où : le vendeur est "Section Luxe" ET l'acheteur est contact.sectionluxe@gmail.com
  FOR v_conv_id IN
    SELECT c.id
    FROM public.conversations c
    WHERE c.buyer_id = v_user_id
      AND c.seller_name ILIKE '%Section Luxe%'
      AND c.deleted_by_buyer_at IS NULL
  LOOP
    UPDATE public.conversations
    SET deleted_by_buyer_at = NOW(), buyer_cleared_at = NOW()
    WHERE id = v_conv_id;
    RAISE NOTICE 'Conversation % (vendeur Section Luxe) masquée pour contact.sectionluxe@gmail.com', v_conv_id;
  END LOOP;
END $$;
