import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromBearer } from '@/lib/api/getAuthUserFromBearer';
import { getSupabaseServer } from '@/lib/supabase/server';
import {
  stripeServer,
  isStripePublishableKeyConfigured,
  isStripeSellerSubscriptionsConfigured,
} from '@/lib/stripe';
import {
  paidTierFromStripePriceId,
  persistSellerSubscriptionState,
  stripePriceIdForPaidTier,
  subscriptionFirstPriceId,
  subscriptionTierFromStripeSubscription,
} from '@/lib/stripeSellerSync';

type SellerRow = {
  id: string;
  status: string;
  subscription_tier: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  email: string;
};

/**
 * Checkout intégré (Embedded) : session `ui_mode: embedded` + `client_secret` pour Stripe.js,
 * ou mise à jour d’abonnement existant sans nouveau Checkout.
 * Body: { tier: "plus" | "pro" }
 * Retourne { clientSecret, tier } | { ok: true, upgraded: true, tier }.
 */
export async function POST(request: NextRequest) {
  if (
    !isStripeSellerSubscriptionsConfigured() ||
    !stripeServer ||
    !isStripePublishableKeyConfigured()
  ) {
    return NextResponse.json({ error: 'Abonnements Stripe non configurés' }, { status: 503 });
  }

  const auth = await getAuthUserFromBearer(request);
  if (!auth) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  let body: { tier?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }

  const tier = body.tier === 'plus' || body.tier === 'pro' ? body.tier : null;
  if (!tier) {
    return NextResponse.json({ error: 'tier requis : plus ou pro' }, { status: 400 });
  }

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: 'Service indisponible' }, { status: 503 });
  }

  const { data: seller, error: se } = await supabase
    .from('sellers')
    .select('id, status, subscription_tier, stripe_customer_id, stripe_subscription_id, email')
    .eq('id', auth.user.id)
    .maybeSingle();

  if (se || !seller) {
    return NextResponse.json({ error: 'Fiche vendeur introuvable' }, { status: 404 });
  }

  const row = seller as SellerRow;
  if (row.status !== 'approved') {
    return NextResponse.json({ error: 'Compte vendeur non validé' }, { status: 403 });
  }

  const newPriceId = stripePriceIdForPaidTier(tier);
  if (!newPriceId.startsWith('price_')) {
    return NextResponse.json({ error: 'Prix Stripe invalide (env)' }, { status: 500 });
  }

  if (row.stripe_subscription_id) {
    try {
      const existing = await stripeServer.subscriptions.retrieve(row.stripe_subscription_id);
      if (existing.status === 'active' || existing.status === 'trialing' || existing.status === 'past_due') {
        const currentPaid = paidTierFromStripePriceId(subscriptionFirstPriceId(existing));
        if (currentPaid === tier) {
          return NextResponse.json({ error: 'Vous êtes déjà sur cette formule.' }, { status: 400 });
        }
        const itemId = existing.items.data[0]?.id;
        if (!itemId) {
          throw new Error('Abonnement sans ligne de prix');
        }
        const updated = await stripeServer.subscriptions.update(existing.id, {
          items: [{ id: itemId, price: newPriceId }],
          proration_behavior: 'create_prorations',
          metadata: { seller_id: row.id },
        });
        const nextTier = subscriptionTierFromStripeSubscription(updated);
        const cust = updated.customer;
        const customerId = typeof cust === 'string' ? cust : cust.id;
        await persistSellerSubscriptionState(supabase, row.id, {
          stripeCustomerId: customerId,
          stripeSubscriptionId: updated.id,
          subscriptionTier: nextTier,
        });
        return NextResponse.json({ ok: true, upgraded: true, tier: nextTier });
      }
    } catch (e) {
      console.warn('[abonnement/checkout] mise à jour abonnement existant impossible, nouveau Checkout', e);
    }
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

  const session = await stripeServer.checkout.sessions.create({
    ui_mode: 'embedded',
    mode: 'subscription',
    customer: row.stripe_customer_id || undefined,
    customer_email: row.stripe_customer_id ? undefined : row.email,
    line_items: [{ price: newPriceId, quantity: 1 }],
    return_url: `${baseUrl}/vendeur/abonnement?session_id={CHECKOUT_SESSION_ID}`,
    client_reference_id: row.id,
    metadata: {
      seller_id: row.id,
      tier,
      purpose: 'seller_subscription',
    },
    subscription_data: {
      metadata: {
        seller_id: row.id,
        tier,
      },
    },
    allow_promotion_codes: true,
  });

  if (!session.client_secret) {
    return NextResponse.json({ error: 'Impossible de créer la session Stripe (client_secret manquant)' }, { status: 500 });
  }

  return NextResponse.json({ clientSecret: session.client_secret, tier });
}
