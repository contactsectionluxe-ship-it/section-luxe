'use client';

import { Suspense, useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { useRouter, useSearchParams, type ReadonlyURLSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Check, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { normalizeSubscriptionTier } from '@/lib/subscription';
import { getSession } from '@/lib/supabase/auth';
import { AbonnementEmbeddedCheckout } from '@/components/AbonnementEmbeddedCheckout';

type PlanFeatureLine = string | { readonly text: string; readonly tone: 'red' };

const plans: readonly {
  id: string;
  name: string;
  price: string;
  priceDetail: string;
  description: string;
  features: readonly PlanFeatureLine[];
  highlight: boolean;
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
    highlight: false,
  },
  {
    id: 'plus',
    name: 'Plus',
    price: '99 €',
    priceDetail: 'HT hors TVA / mois',
    description: "Pour les vendeurs réguliers, jusqu'à 200 annonces publiées simultanément.",
    features: [
      '200 annonces simultanées',
      'Messagerie incluse',
      'Suivi likes, messages et appels',
      'Tableau de bord ventes',
      'Support prioritaire',
      'Badge vendeur',
    ],
    highlight: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '325 €',
    priceDetail: 'HT hors TVA / mois',
    description: "Pour les boutiques établies, jusqu'à 800 annonces publiées simultanément.",
    features: [
      '800 annonces simultanées',
      'Messagerie incluse',
      'Suivi likes, messages et appels',
      'Tableau de bord ventes',
      'Support dédié',
      'Badge vendeur',
    ],
    highlight: false,
  },
];

function abonnementPathPreservingLimit(sp: ReadonlyURLSearchParams): string {
  const q = new URLSearchParams();
  if (sp.get('limite') === '1') q.set('limite', '1');
  if (sp.get('depassement') === '1') q.set('depassement', '1');
  const s = q.toString();
  return s ? `/vendeur/abonnement?${s}` : '/vendeur/abonnement';
}

function AbonnementVendeurContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, seller, loading: authLoading, refreshUser } = useAuth();
  const [ready, setReady] = useState(false);
  const [subscriptionsEnabled, setSubscriptionsEnabled] = useState<boolean | null>(null);
  const [managePortalLoading, setManagePortalLoading] = useState(false);
  const [startPlanPortalLoading, setStartPlanPortalLoading] = useState(false);
  const [flowMessage, setFlowMessage] = useState<{ kind: 'canceled' | 'error'; text?: string } | null>(null);
  const [embeddedCheckoutTier, setEmbeddedCheckoutTier] = useState<'plus' | 'pro' | null>(null);
  /** idle → zone paiement (checkout monté dès le clic pour l’API en parallèle). */
  const [checkoutPhase, setCheckoutPhase] = useState<'idle' | 'payment'>('idle');
  const verifyStartedFor = useRef<string | null>(null);

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

  /** Lien avec ?tier=plus|pro (ex. ancienne page paiement) → ouvre le checkout sous les cartes. */
  useEffect(() => {
    if (subscriptionsEnabled !== true) return;
    const t = searchParams.get('tier');
    if (t === 'plus' || t === 'pro') {
      setEmbeddedCheckoutTier(t);
      setCheckoutPhase('payment');
      setFlowMessage(null);
      router.replace(abonnementPathPreservingLimit(searchParams));
    }
  }, [subscriptionsEnabled, searchParams, router]);

  useEffect(() => {
    if (searchParams.get('canceled') === '1') {
      setFlowMessage({ kind: 'canceled' });
    }
  }, [searchParams]);

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
        if (r.ok) {
          await refreshUser();
        } else {
          const j = (await r.json().catch(() => ({}))) as { error?: string };
          setFlowMessage({ kind: 'error', text: j.error || 'Impossible de finaliser l’abonnement.' });
        }
      } catch {
        setFlowMessage({ kind: 'error', text: 'Erreur réseau lors de la synchronisation.' });
      } finally {
        clearStripeQueryAndRefreshPath();
      }
    })();
  }, [searchParams, seller, authLoading, refreshUser, clearStripeQueryAndRefreshPath]);

  const openEmbeddedCheckout = useCallback((tier: 'plus' | 'pro') => {
    setFlowMessage(null);
    setCheckoutPhase('payment');
    setEmbeddedCheckoutTier(tier);
  }, []);

  const stripeReady = subscriptionsEnabled === true;
  const checkoutPaymentVisible = checkoutPhase === 'payment' && Boolean(embeddedCheckoutTier && stripeReady);
  const checkoutPrefetchActive = Boolean(embeddedCheckoutTier && stripeReady);

  const openBillingPortal = async (source: 'manage' | 'startPlan') => {
    setFlowMessage(null);
    if (source === 'manage') setManagePortalLoading(true);
    else setStartPlanPortalLoading(true);
    try {
      const session = await getSession();
      if (!session?.access_token) {
        router.push('/connexion');
        return;
      }
      const r = await fetch('/api/vendeur/abonnement/portal', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = (await r.json().catch(() => ({}))) as { url?: string; error?: string };
      if (r.ok && data.url) {
        if (source === 'manage') {
          window.open(data.url, '_blank', 'noopener,noreferrer');
        } else {
          window.location.href = data.url;
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
      if (source === 'manage') setManagePortalLoading(false);
      else setStartPlanPortalLoading(false);
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

  const subTier = normalizeSubscriptionTier(seller.subscriptionTier);
  const showLimitBanner = searchParams.get('limite') === '1' || searchParams.get('depassement') === '1';
  /** Portail Stripe : client connu + formule Plus/Pro + abonnement enregistré côté Stripe */
  const showPortal =
    stripeReady &&
    seller.stripeCustomerRegistered &&
    (subTier === 'plus' || subTier === 'pro') &&
    Boolean(seller.stripeSubscriptionId);

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
      <div className="abonnement-page-inner" style={{ width: '100%', maxWidth: 1200, margin: '0 auto', padding: '30px calc(20px + 1cm - 0.5mm) 60px', boxSizing: 'border-box' }}>
        <div>
          <div className="abonnement-page-title-block" style={{ textAlign: 'left', marginBottom: 32 }}>
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

          {flowMessage?.kind === 'canceled' ? (
            <div
              role="status"
              style={{
                ...alertBase,
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                color: '#475569',
              }}
            >
              Paiement annulé. Vous pouvez choisir une formule quand vous le souhaitez.
            </div>
          ) : null}

          {flowMessage?.kind === 'error' && flowMessage.text ? (
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

          {showPortal ? (
            <div className="abonnement-billing-portal">
              <button
                type="button"
                className="abonnement-plan-cta-btn abonnement-plan-cta-btn--outline"
                disabled={managePortalLoading}
                aria-busy={managePortalLoading}
                onClick={() => void openBillingPortal('manage')}
              >
                Gérer mon abonnement
              </button>
            </div>
          ) : null}
          <div
            className={`abonnement-checkout-slot${checkoutPaymentVisible ? ' abonnement-checkout-slot--payment' : ''}`}
          >
            <div className="abonnement-checkout-slot-plans" aria-hidden={checkoutPaymentVisible}>
              <div className="abonnement-plans-row">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`abonnement-plan-card${plan.highlight ? ' abonnement-plan-card--featured' : ''}`}
              >
                <div className="abonnement-plan-header">
                  <h2 className="abonnement-plan-name">{plan.name}</h2>
                  {plan.highlight ? (
                    <span className="abonnement-plan-badge">Populaire</span>
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
                  {plan.id === subTier ? (
                    <div className="abonnement-plan-cta-btn abonnement-plan-cta-btn--muted">Actuel</div>
                  ) : plan.id === 'start' ? (
                    subscriptionsEnabled === null ? (
                      <div className="abonnement-plan-cta-btn abonnement-plan-cta-btn--muted">…</div>
                    ) : stripeReady && seller.stripeCustomerRegistered ? (
                      <button
                        type="button"
                        className="abonnement-plan-cta-btn abonnement-plan-cta-btn--primary"
                        disabled={startPlanPortalLoading}
                        onClick={() => void openBillingPortal('startPlan')}
                      >
                        {startPlanPortalLoading ? 'Ouverture…' : 'Passer à gratuit'}
                      </button>
                    ) : (
                      <Link href="/contact" className="abonnement-plan-cta-btn abonnement-plan-cta-btn--primary">
                        Passer à gratuit
                      </Link>
                    )
                  ) : stripeReady ? (
                    <button
                      type="button"
                      className="abonnement-plan-cta-btn abonnement-plan-cta-btn--primary"
                      onClick={() => openEmbeddedCheckout(plan.id as 'plus' | 'pro')}
                    >
                      {plan.id === 'plus' ? 'Passer à Plus' : 'Passer à Pro'}
                    </button>
                  ) : subscriptionsEnabled === null ? (
                    <div className="abonnement-plan-cta-btn abonnement-plan-cta-btn--muted">…</div>
                  ) : (
                    <Link href="/contact" className="abonnement-plan-cta-btn abonnement-plan-cta-btn--primary">
                      Nous contacter
                    </Link>
                  )}
                </div>
              </div>
            ))}
              </div>
            </div>

            {checkoutPrefetchActive && embeddedCheckoutTier ? (
              <div className="abonnement-checkout-slot-payment" aria-hidden={!checkoutPaymentVisible}>
                <AbonnementEmbeddedCheckout
                  key={embeddedCheckoutTier}
                  tier={embeddedCheckoutTier}
                  replacementLayout
                  onDismiss={() => {
                    setEmbeddedCheckoutTier(null);
                    setCheckoutPhase('idle');
                  }}
                />
              </div>
            ) : null}
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
