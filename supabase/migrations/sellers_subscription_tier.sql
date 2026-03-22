-- Formule annonces vendeur : start (50), plus (200), pro (800). Défaut = start (gratuit).
ALTER TABLE public.sellers
  ADD COLUMN IF NOT EXISTS subscription_tier text DEFAULT 'start';

UPDATE public.sellers SET subscription_tier = 'start' WHERE subscription_tier IS NULL;

ALTER TABLE public.sellers
  ALTER COLUMN subscription_tier SET DEFAULT 'start',
  ALTER COLUMN subscription_tier SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sellers_subscription_tier_check'
  ) THEN
    ALTER TABLE public.sellers
      ADD CONSTRAINT sellers_subscription_tier_check
      CHECK (subscription_tier IN ('start', 'plus', 'pro'));
  END IF;
END$$;

COMMENT ON COLUMN public.sellers.subscription_tier IS 'start | plus | pro — limite annonces actives';
