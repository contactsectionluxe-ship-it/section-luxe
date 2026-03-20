'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const pageWrap: React.CSSProperties = {
  paddingTop: 'var(--header-height)',
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 24,
  background: 'linear-gradient(180deg, #fafafa 0%, #f5f5f7 100%)',
};

const cardStyle: React.CSSProperties = {
  backgroundColor: '#fff',
  borderRadius: 20,
  boxShadow: '0 4px 24px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)',
  padding: '48px 40px',
  maxWidth: 420,
  width: '100%',
  textAlign: 'center',
};

function SuccessPageFallback() {
  return (
    <div style={pageWrap}>
      <div style={cardStyle}>
        <Loader2 size={28} className="animate-spin" style={{ color: '#1d1d1f', marginBottom: 16 }} />
        <p style={{ fontSize: 15, color: '#6e6e73' }}>Chargement...</p>
      </div>
    </div>
  );
}

/**
 * Page de retour après paiement Stripe réussi.
 * Affiche un succès et redirige vers Mes annonces.
 */
function NewListingSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const { user, seller, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (authLoading || !user || !seller) return;
    if (!sessionId) {
      setStatus('error');
      return;
    }

    const timer = setTimeout(() => {
      setStatus('ok');
    }, 600);

    return () => clearTimeout(timer);
  }, [authLoading, user, seller, sessionId]);

  useEffect(() => {
    if (status !== 'ok') return;
    const t = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(t);
          router.replace('/vendeur');
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [status, router]);

  if (authLoading || !user || !seller) {
    return (
      <div style={pageWrap}>
        <div style={cardStyle}>
          <Loader2 size={28} className="animate-spin" style={{ color: '#1d1d1f', marginBottom: 16 }} />
          <p style={{ fontSize: 15, color: '#6e6e73' }}>Chargement...</p>
        </div>
      </div>
    );
  }

  if (!sessionId) {
    return (
      <div style={pageWrap}>
        <div style={cardStyle}>
          <p style={{ fontSize: 16, color: '#dc2626', marginBottom: 20 }}>Session de paiement invalide.</p>
          <Link
            href="/vendeur"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 15,
              color: '#1d1d1f',
              textDecoration: 'none',
              fontWeight: 500,
            }}
          >
            Retour à Mes annonces <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  if (status === 'loading') {
    return (
      <div style={pageWrap}>
        <div style={cardStyle}>
          <Loader2 size={32} className="animate-spin" style={{ color: '#1d1d1f', marginBottom: 20 }} />
          <h2 style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: 20, fontWeight: 500, color: '#1d1d1f', marginBottom: 8 }}>
            Paiement enregistré
          </h2>
          <p style={{ fontSize: 15, color: '#6e6e73' }}>Publication de votre annonce en cours...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={pageWrap}>
      <div style={cardStyle}>
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            backgroundColor: 'rgba(22, 163, 74, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
          }}
        >
          <CheckCircle size={40} style={{ color: '#16a34a' }} />
        </div>
        <h1
          style={{
            fontFamily: 'var(--font-playfair), Georgia, serif',
            fontSize: 26,
            fontWeight: 500,
            letterSpacing: '-0.02em',
            color: '#1d1d1f',
            marginBottom: 12,
          }}
        >
          Paiement réussi
        </h1>
        <p
          style={{
            fontSize: 16,
            lineHeight: 1.5,
            color: '#6e6e73',
            marginBottom: 28,
          }}
        >
          Votre annonce est en cours de publication. Vous serez redirigé vers vos annonces
          {countdown > 0 && (
            <span style={{ display: 'block', marginTop: 8, fontSize: 14, color: '#86868b' }}>
              Redirection dans {countdown} seconde{countdown > 1 ? 's' : ''}…
            </span>
          )}
        </p>
        <Link
          href="/vendeur"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            width: '100%',
            maxWidth: 280,
            margin: '0 auto',
            padding: '14px 24px',
            backgroundColor: '#1d1d1f',
            color: '#fff',
            fontSize: 15,
            fontWeight: 500,
            borderRadius: 12,
            textDecoration: 'none',
            transition: 'opacity 0.2s',
          }}
          className="hover:opacity-90"
        >
          Aller à Mes annonces <ArrowRight size={18} />
        </Link>
      </div>
    </div>
  );
}

export default function NewListingSuccessPage() {
  return (
    <Suspense fallback={<SuccessPageFallback />}>
      <NewListingSuccessContent />
    </Suspense>
  );
}
