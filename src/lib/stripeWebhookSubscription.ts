import type Stripe from 'stripe';
import type { SupabaseClient } from '@supabase/supabase-js';
import { stripeServer } from '@/lib/stripe';
import {
  persistSellerFromCheckoutSubscription,
  persistSellerSubscriptionState,
  subscriptionTierFromStripeSubscription,
} from '@/lib/stripeSellerSync';

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
  let sellerId = sub.metadata?.seller_id as string | undefined;
  if (!sellerId) {
    const { data } = await supabase
      .from('sellers')
      .select('id')
      .eq('stripe_subscription_id', sub.id)
      .maybeSingle();
    sellerId = data?.id as string | undefined;
  }
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
  const { data: row } = await supabase
    .from('sellers')
    .select('id, stripe_customer_id')
    .eq('stripe_subscription_id', sub.id)
    .maybeSingle();

  const sellerId = (row?.id as string | undefined) || (sub.metadata?.seller_id as string | undefined);
  if (!sellerId) return;

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
