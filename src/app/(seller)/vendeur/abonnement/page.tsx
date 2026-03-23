'use client';

import {
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { useRouter, useSearchParams, type ReadonlyURLSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Check, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { normalizeSubscriptionTier } from '@/lib/subscription';
import { getSession } from '@/lib/supabase/auth';

type PlanFeatureLine = string | { readonly text: string; readonly tone: 'red' };

const plans: readonly {
  id: string;
  name: string;
  price: string;
  priceDetail: string;
  description: string;
  features: readonly PlanFeatureLine[];
}[] = [
  {
    id: 'start',
    name: 'Start',
    price: 'Gratuit',
    priceDetail: '',
    description: "Idéal pour démarrer, jusqu'à 50 annonces publiées simultanément.",
    features: [
      '50 annonces simultanées',
      'Messagerie incluse',
      'Suivi likes, messages et appels',
      'Tableau de bord ventes',
      'Support par mail',
      { text: 'Badge vendeur', tone: 'red' },
    ],
  },
  {
    id: 'plus',
    name: 'Plus',
    price: '99 €',
    priceDetail: 'HT/mois',
    description: "Pour les vendeurs réguliers, jusqu'à 200 annonces publiées simultanément.",
    features: [
      '200 annonces simultanées',
      'Messagerie incluse',
      'Suivi likes, messages et appels',
      'Tableau de bord ventes',
      'Support prioritaire',
      'Badge vendeur',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '325 €',
    priceDetail: 'HT/mois',
    description: "Pour les boutiques établies, jusqu'à 800 annonces publiées simultanément.",
    features: [
      '800 annonces simultanées',
      'Messagerie incluse',
      'Suivi likes, messages et appels',
      'Tableau de bord ventes',
      'Support dédié',
      'Badge vendeur',
    ],
  },
];

function abonnementPathPreservingLimit(sp: ReadonlyURLSearchParams): string {
  const q = new URLSearchParams();
  if (sp.get('limite') === '1') q.set('limite', '1');
  if (sp.get('depassement') === '1') q.set('depassement', '1');
  const s = q.toString();
  return s ? `/vendeur/abonnement?${s}` : '/vendeur/abonnement';
}

function formatSubscriptionDateFr(periodStartUnix: number): string {
  const d = new Date(periodStartUnix * 1000);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

type SubscriptionActuelState = {
  tier: 'plus' | 'pro';
  periodStart: number | null;
  periodEnd: number | null;
  scheduledTier?: 'plus' | 'pro';
  scheduledEffectiveDate?: number;
  changeInProgress?: boolean;
  cancelAtPeriodEnd?: boolean;
};

/** Texte sous le bouton (Plus/Pro actuel) ; `null` si rien à afficher (pas de bloc vide). */
function paidPlanCtaDetailContent(
  sub: SubscriptionActuelState,
  plan: { readonly id: string; readonly name: string },
  allPlans: typeof plans,
): ReactNode | null {
  if (plan.id !== 'plus' && plan.id !== 'pro') return null;
  if (sub.tier !== plan.id) return null;

  if (sub.cancelAtPeriodEnd && sub.periodEnd != null) {
    return <>Annulation de l’abonnement le {formatSubscriptionDateFr(sub.periodEnd)}</>;
  }
  if (sub.changeInProgress) {
    return (
      <>
        Abonnement{' '}
        {sub.scheduledTier
          ? allPlans.find((p) => p.id === sub.scheduledTier)?.name ?? sub.scheduledTier
          : plan.name}{' '}
        à partir du{' '}
        {formatSubscriptionDateFr(sub.scheduledEffectiveDate ?? sub.periodEnd ?? sub.periodStart!)}
      </>
    );
  }
  if (sub.periodEnd != null) {
    return <>Prochaine prélèvement le {formatSubscriptionDateFr(sub.periodEnd)}</>;
  }
  return null;
}

function AbonnementVendeurContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, seller, loading: authLoading, refreshUser } = useAuth();
  const [ready, setReady] = useState(false);
  const [subscriptionsEnabled, setSubscriptionsEnabled] = useState<boolean | null>(null);
  /** Portail Stripe : seul le bouton dont la clé correspond est grisé / « Chargement ». */
  const [portalLoadingKey, setPortalLoadingKey] = useState<string | null>(null);
  const [flowMessage, setFlowMessage] = useState<{ kind: 'error'; text: string } | null>(null);
  /** Pendant la création de la session Stripe avant redirection. */
  const [checkoutLoadingTier, setCheckoutLoadingTier] = useState<'plus' | 'pro' | null>(null);
  /** Tier confirmé par l’API après paiement / sync, tant que le contexte auth n’a pas encore la même valeur. */
  const [checkoutSyncedTier, setCheckoutSyncedTier] = useState<'plus' | 'pro' | null>(null);
  const verifyStartedFor = useRef<string | null>(null);
  /** Une fois par visite : réaligne Supabase sur Stripe (webhooks manqués, résiliation hors sync). */
  const stripeSupabaseSyncOnceRef = useRef(false);
  const [cancelChangeLoading, setCancelChangeLoading] = useState(false);
  /** Détail sous « Actuel » : période en cours + éventuel changement programmé (Stripe). */
  const [subscriptionActuel, setSubscriptionActuel] = useState<{
    tier: 'plus' | 'pro';
    periodStart: number | null;
    periodEnd: number | null;
    scheduledTier?: 'plus' | 'pro';
    scheduledEffectiveDate?: number;
    changeInProgress?: boolean;
    cancelAtPeriodEnd?: boolean;
  } | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || !seller)) {
      router.push('/connexion');
      return;
    }
    if (!authLoading && user && (seller?.status === 'rejected' || seller?.status === 'banned')) {
      router.replace('/profil');
      return;
    }
    if (!authLoading) setReady(true);
  }, [authLoading, user, seller, router]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch('/api/vendeur/abonnement/config');
        const j = (await r.json()) as { subscriptionsEnabled?: boolean; publishableKeyConfigured?: boolean };
        if (!cancelled) {
          setSubscriptionsEnabled(Boolean(j.subscriptionsEnabled && j.publishableKeyConfigured));
        }
      } catch {
        if (!cancelled) setSubscriptionsEnabled(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (subscriptionsEnabled !== true || !seller || !ready) return;
    if (!seller.stripeCustomerRegistered && !seller.stripeSubscriptionId?.startsWith('sub_')) return;
    if (stripeSupabaseSyncOnceRef.current) return;

    let cancelled = false;
    (async () => {
      try {
        const session = await getSession();
        if (!session?.access_token || cancelled) return;
        stripeSupabaseSyncOnceRef.current = true;
        const r = await fetch('/api/vendeur/abonnement/sync-stripe', {
          method: 'POST',
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (cancelled || !r.ok) return;
        await refreshUser();
        router.refresh();
      } catch {
        /* silencieux : la page reste utilisable */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [subscriptionsEnabled, seller, ready, refreshUser, router]);

  /** Ancien lien ?tier=plus|pro : nettoyage de l’URL (paiement = même onglet, page Stripe). */
  useEffect(() => {
    if (subscriptionsEnabled !== true) return;
    const t = searchParams.get('tier');
    if (t === 'plus' || t === 'pro') {
      setFlowMessage(null);
      router.replace(abonnementPathPreservingLimit(searchParams));
    }
  }, [subscriptionsEnabled, searchParams, router]);

  /** Lecture Stripe : libellé « Abonnement … à partir du … » sous le bouton Actuel (Plus/Pro). */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!seller?.stripeSubscriptionId || subscriptionsEnabled !== true) {
        setSubscriptionActuel(null);
        return;
      }
      const t = normalizeSubscriptionTier(seller.subscriptionTier);
      if (t !== 'plus' && t !== 'pro') {
        setSubscriptionActuel(null);
        return;
      }
      try {
        const session = await getSession();
        if (!session?.access_token) {
          setSubscriptionActuel(null);
          return;
        }
        const r = await fetch('/api/vendeur/abonnement/subscription', {
          headers: { Authorization: `Bearer ${session.access_token}` },
          cache: 'no-store',
        });
        const j = (await r.json().catch(() => ({}))) as {
          tier?: string | null;
          periodStart?: number | null;
          periodEnd?: number | null;
          scheduledTier?: string | null;
          scheduledEffectiveDate?: number | null;
          changeInProgress?: boolean;
          cancelAtPeriodEnd?: boolean;
        };
        if (cancelled) return;
        if (!r.ok) {
          setSubscriptionActuel(null);
          return;
        }
        if (j.tier !== 'plus' && j.tier !== 'pro') {
          setSubscriptionActuel(null);
          return;
        }
        const hasScheduled =
          (j.scheduledTier === 'plus' || j.scheduledTier === 'pro') &&
          typeof j.scheduledEffectiveDate === 'number' &&
          j.scheduledEffectiveDate > 0;
        const hasPeriod = typeof j.periodStart === 'number' && j.periodStart > 0;
        const hasPeriodEnd = typeof j.periodEnd === 'number' && j.periodEnd > 0;
        const cancelAtPeriodEnd = Boolean(j.cancelAtPeriodEnd);
        const changeInProgress = Boolean(j.changeInProgress);
        const keepSubscriptionDetail =
          hasScheduled ||
          hasPeriod ||
          hasPeriodEnd ||
          changeInProgress ||
          (cancelAtPeriodEnd && hasPeriodEnd);
        if (!keepSubscriptionDetail) {
          setSubscriptionActuel(null);
          return;
        }
        setSubscriptionActuel({
          tier: j.tier as 'plus' | 'pro',
          periodStart: hasPeriod ? (j.periodStart ?? null) : null,
          periodEnd: hasPeriodEnd ? (j.periodEnd ?? null) : null,
          scheduledTier: hasScheduled ? (j.scheduledTier as 'plus' | 'pro') : undefined,
          scheduledEffectiveDate: hasScheduled ? j.scheduledEffectiveDate! : undefined,
          changeInProgress,
          cancelAtPeriodEnd,
        });
      } catch {
        if (!cancelled) setSubscriptionActuel(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [seller, subscriptionsEnabled]);

  /** Retour Stripe « Annuler » : enlever ?canceled=1 de l’URL (sans bannière). */
  useEffect(() => {
    if (searchParams.get('canceled') !== '1') return;
    router.replace(abonnementPathPreservingLimit(searchParams));
  }, [searchParams, router]);

  useEffect(() => {
    if (!checkoutSyncedTier || !seller) return;
    if (normalizeSubscriptionTier(seller.subscriptionTier) === checkoutSyncedTier) {
      setCheckoutSyncedTier(null);
    }
  }, [seller, checkoutSyncedTier]);

  const clearStripeQueryAndRefreshPath = useCallback(() => {
    router.replace(abonnementPathPreservingLimit(searchParams));
  }, [router, searchParams]);

  useEffect(() => {
    const sessionId = searchParams.get('session_id')?.trim();
    if (!sessionId || !seller || authLoading) return;
    if (verifyStartedFor.current === sessionId) return;
    verifyStartedFor.current = sessionId;

    (async () => {
      const session = await getSession();
      if (!session?.access_token) {
        clearStripeQueryAndRefreshPath();
        return;
      }
      try {
        const r = await fetch(
          `/api/vendeur/abonnement/verify-session?session_id=${encodeURIComponent(sessionId)}`,
          { headers: { Authorization: `Bearer ${session.access_token}` } },
        );
        const j = (await r.json().catch(() => ({}))) as { ok?: boolean; tier?: string; error?: string };
        if (r.ok) {
          const t = normalizeSubscriptionTier(j.tier);
          if (t === 'plus' || t === 'pro') setCheckoutSyncedTier(t);
          await refreshUser();
          router.refresh();
        } else {
          setFlowMessage({ kind: 'error', text: j.error || 'Impossible de finaliser l’abonnement.' });
        }
      } catch {
        setFlowMessage({ kind: 'error', text: 'Erreur réseau lors de la synchronisation.' });
      } finally {
        clearStripeQueryAndRefreshPath();
      }
    })();
  }, [searchParams, seller, authLoading, refreshUser, clearStripeQueryAndRefreshPath, router]);

  const openHostedStripeCheckout = useCallback(
    async (tier: 'plus' | 'pro') => {
      setFlowMessage(null);
      setCheckoutLoadingTier(tier);
      try {
        const session = await getSession();
        if (!session?.access_token) {
          router.push('/connexion');
          return;
        }
        const r = await fetch('/api/vendeur/abonnement/checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ tier }),
        });
        const data = (await r.json().catch(() => ({}))) as {
          url?: string;
          upgraded?: boolean;
          tier?: string;
          error?: string;
        };
        if (r.ok && data.upgraded && data.tier) {
          const t = normalizeSubscriptionTier(data.tier);
          if (t === 'plus' || t === 'pro') setCheckoutSyncedTier(t);
          await refreshUser();
          router.refresh();
          return;
        }
        if (r.ok && typeof data.url === 'string' && data.url) {
          window.location.assign(data.url);
          return;
        }
        setFlowMessage({
          kind: 'error',
          text: typeof data.error === 'string' ? data.error : 'Impossible d’ouvrir le paiement.',
        });
      } catch {
        setFlowMessage({ kind: 'error', text: 'Erreur réseau.' });
      } finally {
        setCheckoutLoadingTier(null);
      }
    },
    [router, refreshUser],
  );

  const stripeReady = subscriptionsEnabled === true;

  const openBillingPortal = async (
    source: 'manage' | 'startPlan',
    opts?: {
      subscriptionUpdate?: boolean;
      subscriptionCancel?: boolean;
      /** Ne pas utiliser l’état « Gérer le portail » (ex. après annulation de changement). */
      skipLoading?: boolean;
      /** Clé du bouton cliqué (chargement / gris uniquement sur ce bouton). */
      loadingKey?: string;
    },
  ) => {
    /** Durée min. pour que le bouton gris (chargement) soit visible après le clic. */
    const MIN_LOADING_MS = 450;
    const loadingStartedAt = Date.now();
    setFlowMessage(null);
    if (!opts?.skipLoading && opts?.loadingKey) setPortalLoadingKey(opts.loadingKey);
    try {
      const session = await getSession();
      if (!session?.access_token) {
        router.push('/connexion');
        return;
      }
      const portalBody: Record<string, boolean> = {};
      if (opts?.subscriptionUpdate) portalBody.subscriptionUpdate = true;
      if (opts?.subscriptionCancel) portalBody.subscriptionCancel = true;

      const r = await fetch('/api/vendeur/abonnement/portal', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(portalBody),
      });
      const data = (await r.json().catch(() => ({}))) as { url?: string; error?: string };
      if (r.ok && data.url) {
        /** Même onglet que le Checkout : après confirmation Stripe, `return_url` ramène sur Mon abonnement. */
        if (source === 'manage' || source === 'startPlan') {
          window.location.assign(data.url);
        }
        return;
      }
      setFlowMessage({
        kind: 'error',
        text: typeof data.error === 'string' ? data.error : 'Portail de facturation indisponible.',
      });
    } catch {
      setFlowMessage({ kind: 'error', text: 'Erreur réseau.' });
    } finally {
      const endLoading = () => {
        if (!opts?.skipLoading) setPortalLoadingKey(null);
      };
      const elapsed = Date.now() - loadingStartedAt;
      const delay = Math.max(0, MIN_LOADING_MS - elapsed);
      if (delay > 0) {
        setTimeout(endLoading, delay);
      } else {
        endLoading();
      }
    }
  };

  const handleCancelScheduledChange = async () => {
    setCancelChangeLoading(true);
    setFlowMessage(null);
    try {
      const session = await getSession();
      if (!session?.access_token) {
        router.push('/connexion');
        return;
      }
      const r = await fetch('/api/vendeur/abonnement/cancel-scheduled-change', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = (await r.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!r.ok) {
        setFlowMessage({
          kind: 'error',
          text: typeof data.error === 'string' ? data.error : 'Impossible d’annuler le changement.',
        });
        return;
      }
      await refreshUser();
      router.refresh();
      await openBillingPortal('manage', { skipLoading: true });
    } catch {
      setFlowMessage({ kind: 'error', text: 'Erreur réseau.' });
    } finally {
      setCancelChangeLoading(false);
    }
  };

  if (authLoading || !ready) {
    return (
      <div style={{ paddingTop: 'var(--header-height)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontSize: 15, color: '#6e6e73' }}>Chargement...</p>
      </div>
    );
  }

  if (!user || !seller) return null;

  const subTier = checkoutSyncedTier ?? normalizeSubscriptionTier(seller.subscriptionTier);
  /** Carte encadrée : Plus + « Populaire » par défaut ; si abonné Plus ou Pro → encadrer cette formule + « Actuel ». */
  const featuredPlanId = subTier === 'plus' || subTier === 'pro' ? subTier : 'plus';
  const featuredBadgeLabel = subTier === 'plus' || subTier === 'pro' ? 'Actuel' : 'Populaire';
  const showLimitBanner = searchParams.get('limite') === '1' || searchParams.get('depassement') === '1';
  /** Portail Stripe : client connu + formule Plus/Pro + abonnement enregistré côté Stripe */
  const showPortal =
    stripeReady &&
    seller.stripeCustomerRegistered &&
    (subTier === 'plus' || subTier === 'pro') &&
    Boolean(seller.stripeSubscriptionId);

  /** Colonne Start : portail facturation uniquement si l’utilisateur est réellement en Start (pas encore en cours de résiliation Plus/Pro). */
  const showBillingPortalOnStart =
    stripeReady && seller.stripeCustomerRegistered && subTier === 'start';

  /** Abonnement Stripe encore présent (ex. résiliation en fin de période) : « Gérer » ; sinon « Actuel » sur la carte gratuite. */
  const startHasOngoingStripeSubscription = Boolean(
    seller.stripeSubscriptionId?.startsWith('sub_'),
  );

  /** Plus ↔ Pro : ouvrir le portail Stripe (modifier l’abonnement), pas le Checkout / mise à jour API silencieuse. */
  const shouldOpenPortalForPaidPlanSwitch = (planId: string) =>
    showPortal && (planId === 'plus' || planId === 'pro') && planId !== subTier;

  const paidPlanForSubTier = plans.find((p) => p.id === subTier);
  const rowHasCtaMeta =
    subscriptionActuel != null &&
    paidPlanForSubTier != null &&
    (subTier === 'plus' || subTier === 'pro') &&
    paidPlanCtaDetailContent(subscriptionActuel, paidPlanForSubTier, plans) != null;

  const alertBase: CSSProperties = {
    marginBottom: 20,
    padding: '14px 16px',
    borderRadius: 12,
    fontSize: 14,
    lineHeight: 1.5,
    fontFamily: 'var(--font-inter), var(--font-sans)',
  };

  return (
    <div
      className="abonnement-page-bg"
      style={{ paddingTop: 'var(--header-height)', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
    >
      <div className="abonnement-page-inner">
        <div>
          <div className="abonnement-page-title-block" style={{ textAlign: 'left', marginBottom: 36 }}>
            <h1
              style={{
                fontFamily: 'var(--font-playfair), Georgia, serif',
                fontSize: 28,
                fontWeight: 500,
                marginBottom: 8,
                color: '#1d1d1f',
                letterSpacing: '-0.02em',
              }}
            >
              Mon abonnement
            </h1>
            <p style={{ fontSize: 15, color: '#6e6e73', fontFamily: 'var(--font-inter), var(--font-sans)' }}>
              L’offre adaptée à la taille de votre activité.
            </p>
          </div>

        <div className="abonnement-shell">
          {showLimitBanner ? (
            <div
              role="alert"
              style={{
                ...alertBase,
                backgroundColor: '#fff7ed',
                border: '1px solid #fed7aa',
                color: '#9a3412',
              }}
            >
              Vous avez atteint le nombre maximal d&apos;annonces actives pour votre formule. Passez à une offre supérieure
              ci-dessous ou désactivez des annonces dans « Mes annonces ».
            </div>
          ) : null}

          {flowMessage ? (
            <div
              role="alert"
              style={{
                ...alertBase,
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#991b1b',
              }}
            >
              {flowMessage.text}
            </div>
          ) : null}

          {subscriptionsEnabled === false ? (
            <div
              style={{
                ...alertBase,
                backgroundColor: '#f5f5f7',
                border: '1px solid #e5e5ea',
                color: '#424245',
              }}
            >
              Le paiement en ligne des abonnements n’est pas encore configuré sur ce serveur. Pour Plus ou Pro,{' '}
              <Link href="/contact" style={{ color: '#1d1d1f', fontWeight: 600 }}>
                contactez-nous
              </Link>
              .
            </div>
          ) : null}

          <div
            className={`abonnement-plans-row${rowHasCtaMeta ? ' abonnement-plans-row--has-cta-meta' : ''}`}
          >
            {plans.map((plan) => {
              const isFeatured = plan.id === featuredPlanId;
              const ctaDetail =
                subscriptionActuel &&
                plan.id === subTier &&
                subscriptionActuel.tier === plan.id &&
                (plan.id === 'plus' || plan.id === 'pro')
                  ? paidPlanCtaDetailContent(subscriptionActuel, plan, plans)
                  : null;
              return (
              <div
                key={plan.id}
                className={`abonnement-plan-card${isFeatured ? ' abonnement-plan-card--featured' : ''}`}
              >
                <div className="abonnement-plan-header">
                  <h2 className="abonnement-plan-name">{plan.name}</h2>
                  {isFeatured ? (
                    <span className="abonnement-plan-badge">{featuredBadgeLabel}</span>
                  ) : (
                    <span className="abonnement-plan-badge abonnement-plan-badge--placeholder" aria-hidden="true">
                      Populaire
                    </span>
                  )}
                </div>

                <div className="abonnement-plan-price-block">
                  <span className="abonnement-plan-price">{plan.price}</span>
                  {plan.priceDetail ? <span className="abonnement-plan-price-suffix">{plan.priceDetail}</span> : null}
                </div>

                <p className="abonnement-plan-desc">{plan.description}</p>

                <ul className="abonnement-plan-features">
                  {plan.features.map((f) => {
                    const label = typeof f === 'string' ? f : f.text;
                    const red = typeof f !== 'string' && f.tone === 'red';
                    return (
                      <li key={label}>
                        <span
                          className={`abonnement-plan-check-wrap${red ? ' abonnement-plan-check-wrap--red' : ''}`}
                          aria-hidden="true"
                        >
                          {red ? <X size={14} strokeWidth={2.5} /> : <Check size={14} strokeWidth={2.5} />}
                        </span>
                        <span>{label}</span>
                      </li>
                    );
                  })}
                </ul>

                <div className="abonnement-plan-cta">
                  <div className="abonnement-plan-cta-btn-row">
                    {plan.id === subTier ? (
                      subscriptionActuel?.changeInProgress ? (
                        <button
                          type="button"
                          className={`abonnement-plan-cta-btn abonnement-plan-cta-btn--outline${
                            cancelChangeLoading ? ' abonnement-plan-cta-btn--primary-busy' : ''
                          }`}
                          disabled={cancelChangeLoading}
                          aria-busy={cancelChangeLoading}
                          onClick={() => void handleCancelScheduledChange()}
                        >
                          {cancelChangeLoading ? 'Chargement' : 'Annuler le changement'}
                        </button>
                      ) : showPortal && (plan.id === 'plus' || plan.id === 'pro') ? (
                        <button
                          type="button"
                          className={`abonnement-plan-cta-btn abonnement-plan-cta-btn--muted${
                            portalLoadingKey === `gerer-${plan.id}` ? ' abonnement-plan-cta-btn--muted-busy' : ''
                          }`}
                          disabled={
                            cancelChangeLoading || portalLoadingKey === `gerer-${plan.id}`
                          }
                          aria-busy={portalLoadingKey === `gerer-${plan.id}`}
                          onClick={() =>
                            void openBillingPortal('manage', { loadingKey: `gerer-${plan.id}` })
                          }
                        >
                          {portalLoadingKey === `gerer-${plan.id}` ? 'Chargement' : 'Gérer mon abonnement'}
                        </button>
                      ) : plan.id === 'start' &&
                        subTier === 'start' &&
                        showBillingPortalOnStart &&
                        startHasOngoingStripeSubscription ? (
                        <button
                          type="button"
                          className={`abonnement-plan-cta-btn abonnement-plan-cta-btn--primary${
                            portalLoadingKey === 'gerer-start' ? ' abonnement-plan-cta-btn--primary-busy' : ''
                          }`}
                          disabled={cancelChangeLoading || portalLoadingKey === 'gerer-start'}
                          aria-busy={portalLoadingKey === 'gerer-start'}
                          onClick={() => void openBillingPortal('manage', { loadingKey: 'gerer-start' })}
                        >
                          {portalLoadingKey === 'gerer-start' ? 'Chargement' : 'Gérer mon abonnement'}
                        </button>
                      ) : (
                        <div className="abonnement-plan-cta-btn abonnement-plan-cta-btn--muted">Actuel</div>
                      )
                    ) : plan.id === 'start' ? (
                      subscriptionsEnabled === null ? (
                        <div className="abonnement-plan-cta-btn abonnement-plan-cta-btn--muted">…</div>
                      ) : stripeReady && seller.stripeCustomerRegistered ? (
                        <button
                          type="button"
                          className={`abonnement-plan-cta-btn abonnement-plan-cta-btn--primary${
                            portalLoadingKey === 'start-free' ? ' abonnement-plan-cta-btn--primary-busy' : ''
                          }`}
                          disabled={cancelChangeLoading || portalLoadingKey === 'start-free'}
                          aria-busy={portalLoadingKey === 'start-free'}
                          onClick={() =>
                            void openBillingPortal(
                              /** Annulation déjà lancée : portail « gérer » (pas le flux résilier à nouveau). */
                              subscriptionActuel?.cancelAtPeriodEnd ? 'manage' : 'startPlan',
                              subscriptionActuel?.cancelAtPeriodEnd
                                ? { loadingKey: 'start-free' }
                                : {
                                    subscriptionCancel: true,
                                    loadingKey: 'start-free',
                                  },
                            )
                          }
                        >
                          {portalLoadingKey === 'start-free' ? 'Chargement' : 'Passer à gratuit'}
                        </button>
                      ) : (
                        <Link href="/contact" className="abonnement-plan-cta-btn abonnement-plan-cta-btn--primary">
                          Passer à gratuit
                        </Link>
                      )
                    ) : stripeReady ? (
                      <button
                        type="button"
                        className={`abonnement-plan-cta-btn abonnement-plan-cta-btn--primary${
                          (shouldOpenPortalForPaidPlanSwitch(plan.id) &&
                            portalLoadingKey === `switch-${plan.id}`) ||
                          checkoutLoadingTier === plan.id
                            ? ' abonnement-plan-cta-btn--primary-busy'
                            : ''
                        }`}
                        disabled={
                          cancelChangeLoading ||
                          checkoutLoadingTier === plan.id ||
                          portalLoadingKey === `switch-${plan.id}`
                        }
                        aria-busy={
                          shouldOpenPortalForPaidPlanSwitch(plan.id)
                            ? portalLoadingKey === `switch-${plan.id}`
                            : checkoutLoadingTier === plan.id
                        }
                        onClick={() => {
                          if (shouldOpenPortalForPaidPlanSwitch(plan.id)) {
                            void openBillingPortal('manage', {
                              subscriptionUpdate: true,
                              loadingKey: `switch-${plan.id}`,
                            });
                            return;
                          }
                          void openHostedStripeCheckout(plan.id as 'plus' | 'pro');
                        }}
                      >
                        {(shouldOpenPortalForPaidPlanSwitch(plan.id) &&
                          portalLoadingKey === `switch-${plan.id}`) ||
                        checkoutLoadingTier === plan.id
                          ? 'Chargement'
                          : plan.id === 'plus'
                            ? 'Passer à Plus'
                            : 'Passer à Pro'}
                      </button>
                    ) : subscriptionsEnabled === null ? (
                      <div className="abonnement-plan-cta-btn abonnement-plan-cta-btn--muted">…</div>
                    ) : (
                      <Link href="/contact" className="abonnement-plan-cta-btn abonnement-plan-cta-btn--primary">
                        Nous contacter
                      </Link>
                    )}
                  </div>
                  {rowHasCtaMeta ? (
                    <div className="abonnement-plan-cta-meta" aria-hidden={ctaDetail == null}>
                      {ctaDetail != null ? (
                        <p className="abonnement-plan-actuel-detail">{ctaDetail}</p>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            );
            })}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}

export default function AbonnementVendeurPage() {
  return (
    <Suspense
      fallback={
        <div style={{ paddingTop: 'var(--header-height)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ fontSize: 15, color: '#6e6e73' }}>Chargement...</p>
        </div>
      }
    >
      <AbonnementVendeurContent />
    </Suspense>
  );
}
