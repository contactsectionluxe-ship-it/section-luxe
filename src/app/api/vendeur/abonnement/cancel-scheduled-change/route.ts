import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getAuthUserFromBearer } from '@/lib/api/getAuthUserFromBearer';
import { getSupabaseServer } from '@/lib/supabase/server';
import { stripeServer, isStripeSellerSubscriptionsConfigured } from '@/lib/stripe';

function subscriptionScheduleIdForRelease(sub: Stripe.Subscription): string | null {
  if (!sub.schedule) return null;
  return typeof sub.schedule === 'string' ? sub.schedule : sub.schedule.id;
}

function customerIdFromSubscription(sub: Stripe.Subscription): string | null {
  const c = sub.customer;
  if (typeof c === 'string') return c;
  if (c && typeof c === 'object' && 'id' in c && typeof c.id === 'string') return c.id;
  return null;
}

async function resolveActiveScheduleId(
  sub: Stripe.Subscription,
  subId: string,
): Promise<string | null> {
  const direct = subscriptionScheduleIdForRelease(sub);
  if (direct) return direct;

  const customerId = customerIdFromSubscription(sub);
  if (!customerId || !stripeServer) return null;

  const list = await stripeServer.subscriptionSchedules.list({
    customer: customerId,
    limit: 100,
  });

  const match = list.data.find((s) => {
    const sid =
      typeof s.subscription === 'string' ? s.subscription : s.subscription?.id ?? null;
    if (sid !== subId) return false;
    return s.status === 'active' || s.status === 'not_started';
  });

  return match?.id ?? null;
}

async function voidOpenOrDraftInvoice(invoiceId: string): Promise<boolean> {
  if (!stripeServer) return false;
  const invoice = await stripeServer.invoices.retrieve(invoiceId);
  if (invoice.status === 'open' || invoice.status === 'draft') {
    await stripeServer.invoices.voidInvoice(invoiceId);
    return true;
  }
  return false;
}

/**
 * Annule un changement d’abonnement en attente :
 * - calendrier Stripe (subscription schedule) → release
 * - sinon mise à jour en attente liée à une facture → void invoice
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
    .select('stripe_subscription_id')
    .eq('id', auth.user.id)
    .maybeSingle();

  if (error || !row) {
    return NextResponse.json({ error: 'Vendeur introuvable' }, { status: 404 });
  }

  const subId = (row as { stripe_subscription_id: string | null }).stripe_subscription_id;
  if (!subId?.startsWith('sub_')) {
    return NextResponse.json({ error: 'Aucun abonnement Stripe' }, { status: 400 });
  }

  try {
    const sub = await stripeServer.subscriptions.retrieve(subId, {
      expand: ['schedule', 'latest_invoice'],
    });

    let didSomething = false;

    const scheduleId = await resolveActiveScheduleId(sub, subId);
    if (scheduleId) {
      await stripeServer.subscriptionSchedules.release(scheduleId);
      didSomething = true;
    } else if (sub.pending_update) {
      const inv = sub.latest_invoice;
      let invId: string | null = null;
      if (typeof inv === 'string') {
        invId = inv;
      } else if (inv && typeof inv === 'object' && 'id' in inv) {
        invId = inv.id;
      }
      if (invId) {
        didSomething = await voidOpenOrDraftInvoice(invId);
      }
      if (!didSomething) {
        const openList = await stripeServer.invoices.list({
          subscription: subId,
          status: 'open',
          limit: 5,
        });
        for (const invRow of openList.data) {
          if (await voidOpenOrDraftInvoice(invRow.id)) {
            didSomething = true;
            break;
          }
        }
      }
      if (!didSomething) {
        const draftList = await stripeServer.invoices.list({
          subscription: subId,
          status: 'draft',
          limit: 5,
        });
        for (const invRow of draftList.data) {
          if (await voidOpenOrDraftInvoice(invRow.id)) {
            didSomething = true;
            break;
          }
        }
      }
    }

    if (!didSomething) {
      return NextResponse.json(
        { error: 'Aucun changement en attente à annuler.' },
        { status: 400 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.warn('[abonnement/cancel-scheduled-change]', e);
    const message = e instanceof Error ? e.message : 'Erreur Stripe';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
