'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NewsletterDesinscriptionPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
        setMessage({ type: 'error', text: (data as { error?: string }).error || 'Une erreur est survenue.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Une erreur est survenue.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ paddingTop: 'var(--header-height)', minHeight: '100vh', padding: 40 }}>
      <div style={{ maxWidth: 400, margin: '0 auto' }}>
        <h1 style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: 24, fontWeight: 500, marginBottom: 8, color: '#1d1d1f' }}>
          Désinscription newsletter
        </h1>
        <p style={{ fontSize: 14, color: '#6e6e73', marginBottom: 24 }}>
          Saisissez votre adresse email pour ne plus recevoir les actualités Section Luxe.
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Votre email"
            required
            style={{
              width: '100%',
              padding: '12px 14px',
              fontSize: 14,
              border: '1px solid #d2d2d7',
              borderRadius: 10,
              marginBottom: 12,
              boxSizing: 'border-box',
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px 20px',
              fontSize: 14,
              fontWeight: 500,
              color: '#fff',
              backgroundColor: '#1d1d1f',
              border: 'none',
              borderRadius: 10,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Envoi...' : 'Me désinscrire'}
          </button>
        </form>
        {message && (
          <p style={{ marginTop: 16, fontSize: 14, color: message.type === 'success' ? '#166534' : '#dc2626' }}>
            {message.text}
          </p>
        )}
        <p style={{ marginTop: 24, fontSize: 13, color: '#86868b' }}>
          <Link href="/" style={{ color: '#1d1d1f', textDecoration: 'underline' }}>Retour à l&apos;accueil</Link>
        </p>
      </div>
    </div>
  );
}
