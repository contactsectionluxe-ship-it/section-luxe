import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripeServer } from '@/lib/stripe';
import { getSupabaseServer } from '@/lib/supabase/server';
import {
  handleCheckoutSessionSubscriptionCompleted,
  handleCustomerSubscriptionDeleted,
  handleCustomerSubscriptionUpdated,
} from '@/lib/stripeWebhookSubscription';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

/**
 * Webhook Stripe :
 * - checkout.session.completed (mode payment) : activation annonce dépôt
 * - checkout.session.completed (mode subscription) : abonnement vendeur Plus/Pro
 * - customer.subscription.updated / deleted : synchro formule
 */
export async function POST(request: NextRequest) {
  if (!webhookSecret?.startsWith('whsec_')) {
    return NextResponse.json({ error: 'Webhook Stripe non configuré' }, { status: 503 });
  }

  const body = await request.text();
  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Signature manquante' }, { status: 400 });
  }

  if (!stripeServer) {
    return NextResponse.json({ error: 'Stripe non configuré' }, { status: 503 });
  }

  let event: Stripe.Event;
  try {
    event = stripeServer.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Signature invalide';
    console.error('[webhooks/stripe]', message);
    return NextResponse.json({ error: 'Signature invalide' }, { status: 400 });
  }

  const supabase = getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: 'Service indisponible' }, { status: 503 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === 'subscription') {
          await handleCheckoutSessionSubscriptionCompleted(session, supabase);
          break;
        }
        if (session.mode === 'payment') {
          await handleCheckoutSessionPaymentCompleted(session, supabase);
        }
        break;
      }
      case 'customer.subscription.updated':
        await handleCustomerSubscriptionUpdated(event.data.object as Stripe.Subscription, supabase);
        break;
      case 'customer.subscription.deleted':
        await handleCustomerSubscriptionDeleted(event.data.object as Stripe.Subscription, supabase);
        break;
      default:
        break;
    }
  } catch (e) {
    console.error('[webhooks/stripe] handler', event.type, e);
    return NextResponse.json({ error: 'Erreur traitement webhook' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutSessionPaymentCompleted(
  session: Stripe.Checkout.Session,
  supabase: ReturnType<typeof getSupabaseServer>,
): Promise<void> {
  if (!supabase) return;
  if (session.payment_status !== 'paid') return;

  const listingId = session.client_reference_id ?? session.metadata?.listingId;
  if (!listingId || typeof listingId !== 'string') {
    return;
  }

  const { data: listing, error: fetchError } = await supabase
    .from('listings')
    .select('id')
    .eq('id', listingId)
    .single();

  if (fetchError || !listing) {
    return;
  }

  const raw = session.metadata?.publish_after_payment ?? session.metadata?.publishAfterPayment ?? 'true';
  const publishAfterPayment = raw === 'false' || raw === '0' ? false : true;
  const { error: updateError } = await supabase
    .from('listings')
    .update({ is_active: publishAfterPayment, updated_at: new Date().toISOString() })
    .eq('id', listingId);

  if (updateError) {
    throw new Error(updateError.message);
  }
}
