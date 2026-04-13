'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { pickApiErrorBodyMessage } from '@/lib/user-facing-error';

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: 50,
  padding: '0 16px',
  fontSize: 15,
  border: '1px solid #d2d2d7',
  borderRadius: 12,
  boxSizing: 'border-box',
  outline: 'none',
};

function NewsletterDesinscriptionInner() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const q = searchParams.get('email')?.trim();
    if (q) setEmail(q);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;
    setMessage(null);
    setLoading(true);
    try {
      const res = await fetch('/api/newsletter/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setEmail('');
        setMessage({ type: 'success', text: 'Vous avez bien été désinscrit de notre newsletter.' });
      } else {
        setMessage({ type: 'error', text: pickApiErrorBodyMessage(data, 'Une erreur est survenue.') });
      }
    } catch {
      setMessage({ type: 'error', text: 'Une erreur est survenue.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        paddingTop: 'var(--header-height)',
        minHeight: '100vh',
        backgroundColor: '#fff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <div
        className="contact-page-inner"
        style={{ width: '100%', maxWidth: 460, margin: 0, padding: '30px 24px 80px', boxSizing: 'border-box' }}
      >
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
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
            Désinscription
          </h1>
          <p style={{ fontSize: 14, color: '#6e6e73', lineHeight: 1.55, margin: 0 }}>
            Saisissez votre adresse email pour ne plus recevoir les actualités Section Luxe.
          </p>
        </div>

        <div
          style={{
            backgroundColor: '#fff',
            padding: '32px 28px',
            borderRadius: 18,
            boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
            marginTop: '-1mm',
          }}
        >
          <form onSubmit={handleSubmit}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Votre email"
              required
              autoComplete="email"
              aria-label="Adresse e-mail à désinscrire"
              style={{ ...inputStyle, marginBottom: 16 }}
            />
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                height: 50,
                padding: '0 20px',
                fontSize: 15,
                fontWeight: 500,
                color: '#fff',
                backgroundColor: '#1d1d1f',
                border: 'none',
                borderRadius: 12,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Envoi…' : 'Me désinscrire'}
            </button>
          </form>
          {message && (
            <p
              style={{
                marginTop: 16,
                fontSize: 14,
                color: message.type === 'success' ? '#166534' : '#dc2626',
              }}
            >
              {message.text}
            </p>
          )}
        </div>

        <p style={{ textAlign: 'center', marginTop: 28, fontSize: 15, color: '#6e6e73' }}>
          <Link href="/" style={{ color: '#1d1d1f', fontWeight: 500 }}>
            Retour à l&apos;accueil
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function NewsletterDesinscriptionPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            paddingTop: 'var(--header-height)',
            minHeight: '100vh',
            backgroundColor: '#fff',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <div style={{ width: '100%', maxWidth: 460, padding: '30px 24px 80px', boxSizing: 'border-box' }}>
            <div style={{ textAlign: 'center', marginBottom: 36 }}>
              <div className="catalogue-skeleton" style={{ height: 36, width: 220, margin: '0 auto 12px', borderRadius: 6 }} />
              <div className="catalogue-skeleton" style={{ height: 18, width: 280, margin: '0 auto', borderRadius: 4 }} />
            </div>
            <div className="catalogue-skeleton" style={{ height: 180, width: '100%', borderRadius: 18 }} />
          </div>
        </div>
      }
    >
      <NewsletterDesinscriptionInner />
    </Suspense>
  );
}
