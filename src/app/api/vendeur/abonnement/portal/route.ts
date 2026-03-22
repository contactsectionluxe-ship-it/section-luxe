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

  const { data: seller, error } = await supabase
    .from('sellers')
    .select('stripe_customer_id')
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

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

  const portal = await stripeServer.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${baseUrl}/vendeur/abonnement`,
  });

  if (!portal.url) {
    return NextResponse.json({ error: 'Impossible d’ouvrir le portail' }, { status: 500 });
  }

  return NextResponse.json({ url: portal.url });
}
