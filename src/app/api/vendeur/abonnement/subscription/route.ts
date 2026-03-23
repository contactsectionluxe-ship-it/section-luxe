import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getAuthUserFromBearer } from '@/lib/api/getAuthUserFromBearer';
import { getSupabaseServer } from '@/lib/supabase/server';
import { stripeServer, isStripeSellerSubscriptionsConfigured } from '@/lib/stripe';
import { normalizeSubscriptionTier } from '@/lib/subscription';
import {
  paidTierFromStripePriceId,
  subscriptionTierFromStripeSubscription,
} from '@/lib/stripeSellerSync';

/** Périodes : sur l’item (API récente) ou à la racine de l’abonnement (legacy). */
function periodBounds(sub: Stripe.Subscription): { start: number | null; end: number | null } {
  const item0 = sub.items.data[0];
  const s = sub as Stripe.Subscription & { current_period_start?: number; current_period_end?: number };
  return {
    start: item0?.current_period_start ?? s.current_period_start ?? null,
    end: item0?.current_period_end ?? s.current_period_end ?? null,
  };
}

function tierFromPendingUpdate(pu: Stripe.Subscription.PendingUpdate): 'plus' | 'pro' | null {
  const items = pu.subscription_items;
  if (!items?.length) return null;
  const first = items[0];
  const pid = typeof first.price === 'string' ? first.price : first.price?.id;
  return paidTierFromStripePriceId(pid);
}

function priceIdFromSchedulePhaseItem(item: {
  price: string | Stripe.Price | Stripe.DeletedPrice;
}): string | undefined {
  const p = item.price;
  if (typeof p === 'string') return p;
  return p && 'id' in p ? p.id : undefined;
}

/**
 * Annulation en fin de période : Stripe renvoie en général `cancel_at_period_end`,
 * mais on complète avec `cancel_at === fin de période` (abonnement actif jusqu’à cette date,
 * sans nouveau prélèvement après).
 */
function isSubscriptionCanceledAtPeriodEnd(
  sub: Stripe.Subscription,
  periodEnd: number | null,
): boolean {
  if (sub.cancel_at_period_end) return true;
  const pe = typeof periodEnd === 'number' && periodEnd > 0 ? periodEnd : null;
  const ca = typeof sub.cancel_at === 'number' && sub.cancel_at > 0 ? sub.cancel_at : null;
  if (pe == null || ca == null) return false;
  /** Tolérance 1 s : fin de période sur l’item vs `cancel_at` à la racine peuvent différer légèrement. */
  return ca === pe || Math.abs(ca - pe) <= 1;
}

/**
 * Détails abonnement Stripe (période en cours + changement programmé : portail / calendrier).
 */
export async function GET(request: NextRequest) {
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
    .select('stripe_subscription_id, subscription_tier')
    .eq('id', auth.user.id)
    .maybeSingle();

  if (error || !row) {
    return NextResponse.json({ error: 'Vendeur introuvable' }, { status: 404 });
  }

  const subId = (row as { stripe_subscription_id: string | null }).stripe_subscription_id;
  const dbTier = normalizeSubscriptionTier(
    (row as { subscription_tier?: string | null }).subscription_tier,
  );

  if (!subId?.startsWith('sub_')) {
    return NextResponse.json({ tier: null, periodStart: null });
  }

  try {
    const sub = await stripeServer.subscriptions.retrieve(subId, {
      expand: ['items.data.price', 'schedule'],
    });

    let tier = subscriptionTierFromStripeSubscription(sub);
    // Ne pas réécrire « start » Stripe avec la base si l’abonnement est déjà terminé côté Stripe
    // (annulation / webhook en retard) — sinon l’UI affiche encore Plus/Pro à tort.
    if (
      tier === 'start' &&
      (dbTier === 'plus' || dbTier === 'pro') &&
      (sub.status === 'active' || sub.status === 'trialing' || sub.status === 'past_due')
    ) {
      tier = dbTier;
    }
    if (tier !== 'plus' && tier !== 'pro') {
      return NextResponse.json({ tier: null, periodStart: null });
    }

    const { start: periodStart, end: periodEnd } = periodBounds(sub);
    const cancelAtPeriodEnd = isSubscriptionCanceledAtPeriodEnd(sub, periodEnd);

    let scheduledTier: 'plus' | 'pro' | undefined;
    let scheduledEffectiveDate: number | undefined;

    // 1) Mise à jour en attente (portail : « service mis à jour le … » en fin de période)
    if (sub.pending_update?.subscription_items?.length) {
      const st = tierFromPendingUpdate(sub.pending_update);
      if (st && typeof periodEnd === 'number' && periodEnd > 0) {
        scheduledTier = st;
        scheduledEffectiveDate = periodEnd;
      }
    }

    // 2) Calendrier d’abonnement (phases) — ex. changement au prochain cycle
    // Si annulation en fin de période, l’abonnement ne repart pas : ne pas lire une « phase suivante » trompeuse.
    if (scheduledEffectiveDate == null && sub.schedule && !cancelAtPeriodEnd) {
      let sched: Stripe.SubscriptionSchedule | null = null;
      if (typeof sub.schedule === 'string') {
        sched = await stripeServer.subscriptionSchedules.retrieve(sub.schedule, {
          expand: ['phases.items.price'],
        });
      } else {
        sched = sub.schedule;
      }
      if (sched?.phases?.length) {
        const now = Math.floor(Date.now() / 1000);
        const cp = sched.current_phase;
        let nextPhase: Stripe.SubscriptionSchedule.Phase | undefined;
        if (cp) {
          nextPhase = sched.phases.find((p) => p.start_date === cp.end_date);
        }
        if (!nextPhase) {
          const future = sched.phases
            .filter((p) => p.start_date > now)
            .sort((a, b) => a.start_date - b.start_date);
          nextPhase = future[0];
        }
        if (nextPhase?.items?.length) {
          const pid = priceIdFromSchedulePhaseItem(nextPhase.items[0]);
          const st = paidTierFromStripePriceId(pid);
          if (st && typeof nextPhase.start_date === 'number' && nextPhase.start_date > 0) {
            scheduledTier = st;
            scheduledEffectiveDate = nextPhase.start_date;
          }
        }
      }
    }

    const body: {
      tier: 'plus' | 'pro';
      periodStart: number | null;
      periodEnd: number | null;
      scheduledTier?: 'plus' | 'pro';
      scheduledEffectiveDate?: number;
    } = {
      tier,
      periodStart: typeof periodStart === 'number' && periodStart > 0 ? periodStart : null,
      periodEnd: typeof periodEnd === 'number' && periodEnd > 0 ? periodEnd : null,
    };

    // N’exposer une formule « programmée » que si elle diffère de la formule actuelle (sinon
    // « Pro à partir du … » reprend la prochaine période Pro et prête à confusion après annulation).
    if (
      scheduledTier &&
      scheduledEffectiveDate != null &&
      scheduledTier !== tier
    ) {
      body.scheduledTier = scheduledTier;
      body.scheduledEffectiveDate = scheduledEffectiveDate;
    }

    const changeInProgressRaw =
      sub.pending_update != null ||
      (scheduledTier != null &&
        scheduledEffectiveDate != null &&
        scheduledTier !== tier);
    /** Annulation en fin de période : ne pas mélanger avec un « changement » côté UI. */
    const changeInProgress = cancelAtPeriodEnd ? false : changeInProgressRaw;

    const bodyOut = {
      ...body,
      changeInProgress,
      cancelAtPeriodEnd,
    };

    const hasPeriodEndForCancel =
      cancelAtPeriodEnd &&
      typeof body.periodEnd === 'number' &&
      body.periodEnd > 0;

    if (
      body.periodStart == null &&
      body.scheduledEffectiveDate == null &&
      !changeInProgress &&
      !hasPeriodEndForCancel
    ) {
      return NextResponse.json({ tier: null, periodStart: null });
    }

    return NextResponse.json(bodyOut);
  } catch (e) {
    console.warn('[abonnement/subscription]', e);
    return NextResponse.json({ error: 'Impossible de lire l’abonnement' }, { status: 502 });
  }
}
