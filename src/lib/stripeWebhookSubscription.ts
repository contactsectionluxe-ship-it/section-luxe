import type Stripe from 'stripe';
import type { SupabaseClient } from '@supabase/supabase-js';
import { stripeServer } from '@/lib/stripe';
import {
  persistSellerFromCheckoutSubscription,
  persistSellerSubscriptionState,
  subscriptionTierFromStripeSubscription,
} from '@/lib/stripeSellerSync';

/**
 * Résout le vendeur lié à un abonnement Stripe (metadata → id abonnement → id client).
 * Évite les désynchronisations si une seule des colonnes Supabase est correcte.
 */
export async function resolveSellerIdForSubscription(
  sub: Stripe.Subscription,
  supabase: SupabaseClient,
): Promise<string | undefined> {
  const fromMeta = sub.metadata?.seller_id?.trim();
  if (fromMeta) return fromMeta;

  const { data: bySub } = await supabase
    .from('sellers')
    .select('id')
    .eq('stripe_subscription_id', sub.id)
    .maybeSingle();
  if (bySub?.id) return bySub.id as string;

  const cust = sub.customer;
  const customerId = typeof cust === 'string' ? cust : cust?.id;
  if (!customerId) return undefined;

  const { data: byCustomer } = await supabase
    .from('sellers')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle();
  return (byCustomer?.id as string | undefined) || undefined;
}

export async function handleCheckoutSessionSubscriptionCompleted(
  session: Stripe.Checkout.Session,
  supabase: SupabaseClient,
): Promise<void> {
  if (session.mode !== 'subscription') return;
  if (session.status !== 'complete') return;
  if (session.metadata?.purpose !== 'seller_subscription') return;

  const sellerId = session.metadata?.seller_id || session.client_reference_id;
  if (!sellerId) return;

  const customerRaw = session.customer;
  const customerId = typeof customerRaw === 'string' ? customerRaw : customerRaw?.id;
  const subRaw = session.subscription;
  if (!customerId || !subRaw || !stripeServer) return;

  const sub =
    typeof subRaw === 'string' ? await stripeServer.subscriptions.retrieve(subRaw) : subRaw;

  await persistSellerFromCheckoutSubscription(supabase, sellerId, customerId, sub.id, sub);
}

export async function handleCustomerSubscriptionUpdated(
  sub: Stripe.Subscription,
  supabase: SupabaseClient,
): Promise<void> {
  const sellerId = await resolveSellerIdForSubscription(sub, supabase);
  if (!sellerId) return;

  const cust = sub.customer;
  const customerId = typeof cust === 'string' ? cust : cust.id;
  const tier = subscriptionTierFromStripeSubscription(sub);
  await persistSellerSubscriptionState(supabase, sellerId, {
    stripeCustomerId: customerId,
    stripeSubscriptionId: tier === 'start' ? null : sub.id,
    subscriptionTier: tier,
  });
}

export async function handleCustomerSubscriptionDeleted(
  sub: Stripe.Subscription,
  supabase: SupabaseClient,
): Promise<void> {
  const sellerId = await resolveSellerIdForSubscription(sub, supabase);
  if (!sellerId) return;

  const { data: row } = await supabase
    .from('sellers')
    .select('stripe_customer_id')
    .eq('id', sellerId)
    .maybeSingle();

  const cust = sub.customer;
  const customerFromSub = typeof cust === 'string' ? cust : cust.id;
  const customerId =
    customerFromSub || (row as { stripe_customer_id?: string | null })?.stripe_customer_id || null;

  await persistSellerSubscriptionState(supabase, sellerId, {
    stripeCustomerId: customerId,
    stripeSubscriptionId: null,
    subscriptionTier: 'start',
  });
}
