'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { loadStripe, type StripeEmbeddedCheckout } from '@stripe/stripe-js';
import { useAuth } from '@/hooks/useAuth';
import { getSession } from '@/lib/supabase/auth';

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';

function tierLabel(t: string): string {
  if (t === 'plus') return 'Plus';
  if (t === 'pro') return 'Pro';
  return t;
}

function AbonnementPaiementContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, seller, loading: authLoading, refreshUser } = useAuth();
  const [ready, setReady] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const checkoutRef = useRef<StripeEmbeddedCheckout | null>(null);

  const tierParam = searchParams.get('tier') === 'plus' || searchParams.get('tier') === 'pro' ? searchParams.get('tier') : null;

  const stripePromise = useMemo(() => {
    if (!publishableKey.startsWith('pk_')) return null;
    return loadStripe(publishableKey);
  }, []);

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
    if (!ready || !user || !seller || !tierParam) return;
    if (!stripePromise) {
      setError('Clé publique Stripe manquante (NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY).');
      setLoadingSession(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoadingSession(true);
      setError(null);
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
          body: JSON.stringify({ tier: tierParam }),
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
          router.replace('/vendeur/abonnement');
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
  }, [ready, user, seller, tierParam, router, refreshUser, stripePromise]);

  useEffect(() => {
    if (!tierParam && ready && !authLoading) {
      router.replace('/vendeur/abonnement');
    }
  }, [tierParam, ready, authLoading, router]);

  useEffect(() => {
    if (!clientSecret || !stripePromise) return;

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
        checkout.mount('#embedded-checkout-abonnement');
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
  }, [clientSecret, stripePromise]);

  if (authLoading || !ready) {
    return (
      <div style={{ paddingTop: 'var(--header-height)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontSize: 15, color: '#6e6e73' }}>Chargement...</p>
      </div>
    );
  }

  if (!user || !seller || !tierParam) return null;

  return (
    <div
      className="abonnement-page-bg"
      style={{ paddingTop: 'var(--header-height)', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
    >
      <div
        className="abonnement-page-inner"
        style={{ width: '100%', maxWidth: 720, margin: '0 auto', padding: '30px calc(20px + 1cm - 0.5mm) 60px', boxSizing: 'border-box' }}
      >
        <div style={{ marginBottom: 24 }}>
          <Link href="/vendeur/abonnement" style={{ fontSize: 14, color: '#424245', fontFamily: 'var(--font-inter), var(--font-sans)' }}>
            ← Retour aux formules
          </Link>
        </div>
        <h1
          style={{
            fontFamily: 'var(--font-playfair), Georgia, serif',
            fontSize: 26,
            fontWeight: 500,
            marginBottom: 8,
            color: '#1d1d1f',
            letterSpacing: '-0.02em',
          }}
        >
          Paiement sécurisé · {tierLabel(tierParam)}
        </h1>
        <p style={{ fontSize: 15, color: '#6e6e73', marginBottom: 24, fontFamily: 'var(--font-inter), var(--font-sans)', lineHeight: 1.5 }}>
          Le formulaire ci-dessous est fourni par Stripe (Checkout intégré). Après validation, vous serez renvoyé vers Mon abonnement pour
          finaliser la synchronisation.
        </p>

        <div className="abonnement-shell" style={{ padding: 20, overflow: 'hidden' }}>
          {loadingSession ? (
            <p style={{ margin: 0, fontSize: 15, color: '#6e6e73', fontFamily: 'var(--font-inter), var(--font-sans)' }}>Préparation du paiement…</p>
          ) : error ? (
            <p role="alert" style={{ margin: 0, fontSize: 15, color: '#991b1b', fontFamily: 'var(--font-inter), var(--font-sans)' }}>
              {error}
            </p>
          ) : clientSecret ? (
            <div
              id="embedded-checkout-abonnement"
              style={{ minHeight: 480, width: '100%' }}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function AbonnementPaiementPage() {
  return (
    <Suspense
      fallback={
        <div style={{ paddingTop: 'var(--header-height)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ fontSize: 15, color: '#6e6e73' }}>Chargement...</p>
        </div>
      }
    >
      <AbonnementPaiementContent />
    </Suspense>
  );
}
