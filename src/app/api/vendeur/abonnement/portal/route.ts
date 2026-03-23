import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromBearer } from '@/lib/api/getAuthUserFromBearer';
import { getSupabaseServer } from '@/lib/supabase/server';
import { stripeServer, isStripeSellerSubscriptionsConfigured } from '@/lib/stripe';

/**
 * Portail client Stripe (modifier moyen de paiement, résilier, etc.).
 * Nécessite d’avoir déjà un client Stripe (après au moins un Checkout).
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

  let body: { subscriptionUpdate?: boolean; subscriptionCancel?: boolean } = {};
  try {
    const text = await request.text();
    if (text) body = JSON.parse(text) as { subscriptionUpdate?: boolean; subscriptionCancel?: boolean };
  } catch {
    // POST sans corps : portail classique
  }

  const { data: seller, error } = await supabase
    .from('sellers')
    .select('stripe_customer_id, stripe_subscription_id')
    .eq('id', auth.user.id)
    .maybeSingle();

  if (error || !seller) {
    return NextResponse.json({ error: 'Vendeur introuvable' }, { status: 404 });
  }

  const customerId = (seller as { stripe_customer_id: string | null }).stripe_customer_id;
  if (!customerId?.startsWith('cus_')) {
    return NextResponse.json(
      { error: 'Aucun compte de facturation Stripe. Souscrivez d’abord à une offre payante.' },
      { status: 400 },
    );
  }

  const subscriptionId = (seller as { stripe_subscription_id: string | null }).stripe_subscription_id;
  const hasSub = typeof subscriptionId === 'string' && subscriptionId.startsWith('sub_');

  if (body.subscriptionCancel === true && !hasSub) {
    return NextResponse.json(
      { error: 'Aucun abonnement Stripe actif à résilier.' },
      { status: 400 },
    );
  }

  const wantsSubscriptionCancelFlow = body.subscriptionCancel === true && hasSub;
  const wantsSubscriptionUpdateFlow =
    !wantsSubscriptionCancelFlow &&
    body.subscriptionUpdate === true &&
    hasSub;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

  const flowData = wantsSubscriptionCancelFlow
    ? ({
        type: 'subscription_cancel' as const,
        subscription_cancel: { subscription: subscriptionId },
      } as const)
    : wantsSubscriptionUpdateFlow
      ? ({
          type: 'subscription_update' as const,
          subscription_update: { subscription: subscriptionId },
        } as const)
      : null;

  const portal = await stripeServer.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${baseUrl}/vendeur/abonnement`,
    ...(flowData ? { flow_data: flowData } : {}),
  });

  if (!portal.url) {
    return NextResponse.json({ error: 'Impossible d’ouvrir le portail' }, { status: 500 });
  }

  return NextResponse.json({ url: portal.url });
}
