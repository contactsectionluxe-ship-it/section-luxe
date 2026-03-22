import type { SupabaseClient } from '@supabase/supabase-js';
import type Stripe from 'stripe';
import type { SubscriptionTier } from '@/lib/subscription';
import {
  STRIPE_PRICE_SUBSCRIPTION_PLUS,
  STRIPE_PRICE_SUBSCRIPTION_PRO,
} from '@/lib/stripe';
import { enforceActiveListingsCapForSeller } from '@/lib/sellerListingCap';

export function paidTierFromStripePriceId(priceId: string | undefined): 'plus' | 'pro' | null {
  if (!priceId) return null;
  if (priceId === STRIPE_PRICE_SUBSCRIPTION_PLUS) return 'plus';
  if (priceId === STRIPE_PRICE_SUBSCRIPTION_PRO) return 'pro';
  return null;
}

export function stripePriceIdForPaidTier(tier: 'plus' | 'pro'): string {
  return tier === 'plus' ? STRIPE_PRICE_SUBSCRIPTION_PLUS : STRIPE_PRICE_SUBSCRIPTION_PRO;
}

export function subscriptionFirstPriceId(sub: Stripe.Subscription): string | undefined {
  const p = sub.items.data[0]?.price;
  if (!p) return undefined;
  return typeof p === 'string' ? p : p.id;
}

/** Déduit la formule Supabase à partir d’un abonnement Stripe. */
export function subscriptionTierFromStripeSubscription(sub: Stripe.Subscription): SubscriptionTier {
  const pid = subscriptionFirstPriceId(sub);
  const paid = paidTierFromStripePriceId(pid);
  const s = sub.status;
  if (paid && (s === 'active' || s === 'trialing' || s === 'past_due')) {
    return paid;
  }
  return 'start';
}

export async function persistSellerSubscriptionState(
  supabase: SupabaseClient,
  sellerId: string,
  input: {
    stripeCustomerId: string | null;
    stripeSubscriptionId: string | null;
    subscriptionTier: SubscriptionTier;
  },
): Promise<void> {
  const { error } = await supabase
    .from('sellers')
    .update({
      stripe_customer_id: input.stripeCustomerId,
      stripe_subscription_id: input.subscriptionTier === 'start' ? null : input.stripeSubscriptionId,
      subscription_tier: input.subscriptionTier,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sellerId);
  if (error) throw new Error(`persistSellerSubscriptionState: ${error.message}`);

  await enforceActiveListingsCapForSeller(supabase, sellerId, input.subscriptionTier);
}

/** Après Checkout ou webhook : enregistre client + abonnement + tier payant. */
export async function persistSellerFromCheckoutSubscription(
  supabase: SupabaseClient,
  sellerId: string,
  customerId: string,
  subscriptionId: string,
  sub: Stripe.Subscription,
): Promise<void> {
  const tier = subscriptionTierFromStripeSubscription(sub);
  await persistSellerSubscriptionState(supabase, sellerId, {
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId,
    subscriptionTier: tier,
  });
}
