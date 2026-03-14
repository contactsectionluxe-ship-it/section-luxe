-- Réafficher toutes les conversations pour contact.sectionluxe@gmail.com
-- (annule le masquage : remet deleted_by_*_at et *_cleared_at à NULL pour ce compte)
-- À exécuter dans le SQL Editor Supabase (Dashboard > SQL Editor).

DO $$
DECLARE
  v_user_id UUID;
  v_updated INTEGER;
BEGIN
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'contact.sectionluxe@gmail.com'
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Aucun utilisateur trouvé pour contact.sectionluxe@gmail.com';
  END IF;

  -- Réafficher côté acheteur (conversations où il est buyer_id)
  UPDATE public.conversations
  SET deleted_by_buyer_at = NULL,
      buyer_cleared_at = NULL
  WHERE buyer_id = v_user_id
    AND (deleted_by_buyer_at IS NOT NULL OR buyer_cleared_at IS NOT NULL);

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RAISE NOTICE 'Conversations réaffichées (côté acheteur) : %', v_updated;

  -- Réafficher côté vendeur (conversations où il est seller_id)
  UPDATE public.conversations
  SET deleted_by_seller_at = NULL,
      seller_cleared_at = NULL
  WHERE seller_id = v_user_id
    AND (deleted_by_seller_at IS NOT NULL OR seller_cleared_at IS NOT NULL);

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RAISE NOTICE 'Conversations réaffichées (côté vendeur) : %', v_updated;
END $$;
