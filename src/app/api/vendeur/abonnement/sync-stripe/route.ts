import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getAuthUserFromBearer } from '@/lib/api/getAuthUserFromBearer';
import { getSupabaseServer } from '@/lib/supabase/server';
import { stripeServer, isStripeSellerSubscriptionsConfigured } from '@/lib/stripe';
import {
  persistSellerSubscriptionState,
  subscriptionTierFromStripeSubscription,
} from '@/lib/stripeSellerSync';
import type { SubscriptionTier } from '@/lib/subscription';

function isStripeResourceMissing(e: unknown): boolean {
  return (
    typeof e === 'object' &&
    e !== null &&
    'code' in e &&
    (e as Stripe.StripeRawError).code === 'resource_missing'
  );
}

/**
 * Réaligne la fiche vendeur Supabase sur l’état réel Stripe (abonnement résilié, etc.).
 * Utile si les webhooks n’ont pas été reçus (localhost, secret incorrect, événement manquant).
 */
export async function POST(request: NextRequest) {
  if (!isStripeSellerSubscriptionsConfigured() || !stripeServer) {
    return NextResponse.json({ error: 'Stripe non configuré' }, { status: 503 });
  }

  const auth = await getAuthUserFromBearer(request);
  if (!auth) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: 'Service indisponible' }, { status: 503 });
  }

  const { data: row, error } = await supabase
    .from('sellers')
    .select('stripe_customer_id, stripe_subscription_id')
    .eq('id', auth.user.id)
    .maybeSingle();

  if (error || !row) {
    return NextResponse.json({ error: 'Vendeur introuvable' }, { status: 404 });
  }

  const stripeCustomerId = (row as { stripe_customer_id: string | null }).stripe_customer_id;
  const storedSubId = (row as { stripe_subscription_id: string | null }).stripe_subscription_id;

  const customerId =
    typeof stripeCustomerId === 'string' && stripeCustomerId.startsWith('cus_')
      ? stripeCustomerId
      : null;

  let tier: SubscriptionTier = 'start';
  let subscriptionId: string | null = null;

  try {
    if (storedSubId?.startsWith('sub_')) {
      try {
        const sub = await stripeServer.subscriptions.retrieve(storedSubId);
        tier = subscriptionTierFromStripeSubscription(sub);
        subscriptionId = tier === 'start' ? null : sub.id;
      } catch (e) {
        if (isStripeResourceMissing(e)) {
          tier = 'start';
          subscriptionId = null;
        } else {
          throw e;
        }
      }
    }

    if (tier === 'start' && customerId) {
      const list = await stripeServer.subscriptions.list({
        customer: customerId,
        status: 'all',
        limit: 20,
      });
      const paying = list.data.find((s) =>
        ['active', 'trialing', 'past_due'].includes(s.status),
      );
      if (paying) {
        const t = subscriptionTierFromStripeSubscription(paying);
        if (t !== 'start') {
          tier = t;
          subscriptionId = paying.id;
        }
      }
    }

    await persistSellerSubscriptionState(supabase, auth.user.id, {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      subscriptionTier: tier,
    });

    return NextResponse.json({ ok: true, tier } as const);
  } catch (e) {
    console.warn('[abonnement/sync-stripe]', e);
    const message = e instanceof Error ? e.message : 'Erreur Stripe';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
