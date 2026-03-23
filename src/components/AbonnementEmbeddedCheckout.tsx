'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { loadStripe, type StripeEmbeddedCheckout } from '@stripe/stripe-js';
import { getSession } from '@/lib/supabase/auth';
import { useAuth } from '@/hooks/useAuth';

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';

type Props = {
  tier: 'plus' | 'pro';
  onDismiss: () => void;
  /** Remplace la grille des formules : pas de séparateur au-dessus (même zone visuelle). */
  replacementLayout?: boolean;
};

/** Checkout Stripe intégré (Embedded) pour souscription vendeur Plus / Pro. */
export function AbonnementEmbeddedCheckout({ tier, onDismiss, replacementLayout }: Props) {
  const { refreshUser } = useAuth();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const checkoutRef = useRef<StripeEmbeddedCheckout | null>(null);
  const onDismissRef = useRef(onDismiss);
  const mountId = useId().replace(/:/g, '');

  onDismissRef.current = onDismiss;

  const stripePromise = useMemo(() => {
    if (!publishableKey.startsWith('pk_')) return null;
    return loadStripe(publishableKey);
  }, []);

  useEffect(() => {
    if (!stripePromise) {
      setError('Clé publique Stripe manquante (NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY).');
      setLoadingSession(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoadingSession(true);
      setError(null);
      setClientSecret(null);
      try {
        const [session, stripe] = await Promise.all([getSession(), stripePromise]);
        if (cancelled) return;
        if (!session?.access_token) {
          setError('Session expirée. Reconnectez-vous.');
          setLoadingSession(false);
          return;
        }
        if (!stripe) {
          setError('Paiement indisponible (Stripe).');
          setLoadingSession(false);
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
          clientSecret?: string;
          upgraded?: boolean;
          tier?: string;
          error?: string;
        };

        if (cancelled) return;

        if (r.ok && data.upgraded && data.tier) {
          await refreshUser();
          onDismissRef.current();
          return;
        }
        if (r.ok && data.clientSecret) {
          setClientSecret(data.clientSecret);
          return;
        }
        setError(typeof data.error === 'string' ? data.error : 'Impossible de préparer le paiement.');
      } catch {
        if (!cancelled) setError('Erreur réseau. Réessayez dans un instant.');
      } finally {
        if (!cancelled) setLoadingSession(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tier, stripePromise, refreshUser]);

  useEffect(() => {
    if (!clientSecret || !stripePromise) return;

    const elId = `embedded-checkout-abonnement-${mountId}`;
    let destroyed = false;
    checkoutRef.current?.destroy();
    checkoutRef.current = null;

    (async () => {
      const stripe = await stripePromise;
      if (!stripe || destroyed) return;
      try {
        const checkout = await stripe.initEmbeddedCheckout({ clientSecret });
        if (destroyed) {
          checkout.destroy();
          return;
        }
        checkoutRef.current = checkout;
        checkout.mount(`#${elId}`);
      } catch (e) {
        console.error('[embedded checkout]', e);
        if (!destroyed) {
          setError('Impossible d’afficher le formulaire de paiement Stripe.');
        }
      }
    })();

    return () => {
      destroyed = true;
      checkoutRef.current?.destroy();
      checkoutRef.current = null;
    };
  }, [clientSecret, stripePromise, mountId]);

  const mountElId = `embedded-checkout-abonnement-${mountId}`;

  return (
    <div
      className="abonnement-embedded-checkout-wrap"
      aria-busy={loadingSession}
      style={
        replacementLayout
          ? { marginTop: 0, paddingTop: 0, borderTop: 'none' }
          : {
              marginTop: 28,
              paddingTop: 28,
              borderTop: '1px solid #e5e5e7',
            }
      }
    >
      <div className="abonnement-embedded-checkout-body" style={{ position: 'relative' }}>
        <div className="abonnement-embedded-checkout-back-row">
          <button
            type="button"
            onClick={() => {
              checkoutRef.current?.destroy();
              checkoutRef.current = null;
              onDismiss();
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
              color: '#666',
              margin: 0,
              padding: 0,
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            <ArrowLeft size={16} aria-hidden />
            Revenir aux abonnements
          </button>
        </div>

        {loadingSession ? (
          <span
            style={{
              position: 'absolute',
              width: '1px',
              height: '1px',
              padding: 0,
              margin: '-1px',
              overflow: 'hidden',
              clipPath: 'inset(50%)',
              whiteSpace: 'nowrap',
              border: 0,
            }}
          >
            Préparation du paiement
          </span>
        ) : (
          <div
            className="abonnement-shell abonnement-embedded-checkout-shell"
            style={{ padding: 20, overflow: 'hidden', width: '100%', boxSizing: 'border-box' }}
          >
            {error ? (
              <p role="alert" style={{ margin: 0, fontSize: 15, color: '#991b1b', fontFamily: 'var(--font-inter), var(--font-sans)' }}>
                {error}
              </p>
            ) : clientSecret ? (
              <div id={mountElId} style={{ minHeight: 480, width: '100%', maxWidth: '100%' }} />
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
