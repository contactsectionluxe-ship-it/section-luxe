import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripeServer } from '@/lib/stripe';
import { getSupabaseServer } from '@/lib/supabase/server';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

/**
 * Webhook Stripe : paiement réussi → l'annonce en cours de création est activée ou désactivée
 * selon la sélection du client lors de la création (metadata.publish_after_payment).
 * Body brut pour la signature (request.text()).
 */
export async function POST(request: NextRequest) {
  if (!webhookSecret?.startsWith('whsec_')) {
    return NextResponse.json(
      { error: 'Webhook Stripe non configuré' },
      { status: 503 }
    );
  }

  const body = await request.text();
  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json(
      { error: 'Signature manquante' },
      { status: 400 }
    );
  }

  if (!stripeServer) {
    return NextResponse.json(
      { error: 'Stripe non configuré' },
      { status: 503 }
    );
  }

  let event: Stripe.Event;
  try {
    event = stripeServer.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Signature invalide';
    console.error('[webhooks/stripe]', message);
    return NextResponse.json(
      { error: 'Signature invalide' },
      { status: 400 }
    );
  }

  if (event.type !== 'checkout.session.completed') {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  if (session.payment_status !== 'paid') {
    return NextResponse.json({ received: true });
  }

  const listingId = session.client_reference_id ?? session.metadata?.listingId;
  if (!listingId || typeof listingId !== 'string') {
    return NextResponse.json({ received: true });
  }

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json(
      { error: 'Service indisponible' },
      { status: 503 }
    );
  }

  const { data: listing, error: fetchError } = await supabase
    .from('listings')
    .select('id')
    .eq('id', listingId)
    .single();

  if (fetchError || !listing) {
    return NextResponse.json({ received: true });
  }

  const raw = session.metadata?.publish_after_payment ?? session.metadata?.publishAfterPayment ?? 'true';
  const publishAfterPayment = raw === 'false' || raw === '0' ? false : true;
  const { error: updateError } = await supabase
    .from('listings')
    .update({ is_active: publishAfterPayment, updated_at: new Date().toISOString() })
    .eq('id', listingId);

  if (updateError) {
    return NextResponse.json(
      { error: 'Erreur lors de l\'activation' },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
