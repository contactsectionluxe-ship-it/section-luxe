import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromBearer } from '@/lib/api/getAuthUserFromBearer';
import { getSupabaseServer } from '@/lib/supabase/server';
import { stripeServer, isStripeSellerSubscriptionsConfigured } from '@/lib/stripe';
import {
  persistSellerFromCheckoutSubscription,
  subscriptionTierFromStripeSubscription,
} from '@/lib/stripeSellerSync';

/**
 * Après retour Stripe Checkout : synchronise immédiatement le vendeur (en complément du webhook).
 * GET ?session_id=cs_...
 */
export async function GET(request: NextRequest) {
  if (!isStripeSellerSubscriptionsConfigured() || !stripeServer) {
    return NextResponse.json({ error: 'Stripe non configuré' }, { status: 503 });
  }

  const auth = await getAuthUserFromBearer(request);
  if (!auth) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const sessionId = request.nextUrl.searchParams.get('session_id')?.trim();
  if (!sessionId) {
    return NextResponse.json({ error: 'session_id requis' }, { status: 400 });
  }

  const session = await stripeServer.checkout.sessions.retrieve(sessionId, {
    expand: ['subscription'],
  });

  if (session.mode !== 'subscription') {
    return NextResponse.json({ error: 'Session invalide' }, { status: 400 });
  }

  if (session.metadata?.purpose !== 'seller_subscription') {
    return NextResponse.json({ error: 'Session non liée à un abonnement vendeur' }, { status: 400 });
  }

  const sellerId = session.metadata?.seller_id || session.client_reference_id;
  if (!sellerId || sellerId !== auth.user.id) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: 'Service indisponible' }, { status: 503 });
  }

  const rawSub = session.subscription;
  if (!rawSub) {
    return NextResponse.json({ error: 'Abonnement introuvable' }, { status: 400 });
  }

  const sub =
    typeof rawSub === 'string' ? await stripeServer.subscriptions.retrieve(rawSub) : rawSub;

  const cust = session.customer;
  const customerId = typeof cust === 'string' ? cust : cust?.id;
  if (!customerId) {
    return NextResponse.json({ error: 'Client Stripe introuvable' }, { status: 400 });
  }

  await persistSellerFromCheckoutSubscription(supabase, sellerId, customerId, sub.id, sub);

  const tier = subscriptionTierFromStripeSubscription(sub);
  return NextResponse.json({ ok: true, tier });
}
