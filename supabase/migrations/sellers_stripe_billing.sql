-- Facturation Stripe (abonnements Plus / Pro)
ALTER TABLE public.sellers
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text;

CREATE INDEX IF NOT EXISTS sellers_stripe_customer_id_idx ON public.sellers (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS sellers_stripe_subscription_id_idx ON public.sellers (stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

COMMENT ON COLUMN public.sellers.stripe_customer_id IS 'Stripe Customer id (cus_...)';
COMMENT ON COLUMN public.sellers.stripe_subscription_id IS 'Stripe Subscription id (sub_...) si abonnement actif';
