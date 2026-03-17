'use client';

import { useState } from 'react';
import Link from 'next/link';
import { requestPasswordReset } from '@/lib/supabase/auth';

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: 48,
  padding: '0 16px',
  fontSize: 15,
  border: '1px solid #d2d2d7',
  borderRadius: 12,
  backgroundColor: '#fff',
  boxSizing: 'border-box',
  outline: 'none',
};

export default function MotDePasseOubliePage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const redirectTo = `${origin}/reinitialiser-mot-de-passe`;
      await requestPasswordReset(email.trim(), redirectTo);
      setSuccess(true);
    } catch (err) {
      console.error('Password reset request error:', err);
      const msg = err instanceof Error ? err.message : 'Une erreur est survenue.';
      if (msg.includes('email') || msg.includes('not found')) {
        setError('Aucun compte associé à cet email.');
      } else {
        setError(msg || 'Impossible d\'envoyer l\'email. Réessayez plus tard.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ paddingTop: 'var(--header-height)', minHeight: '100vh', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingLeft: 24, paddingRight: 24, paddingBottom: 24 }}>
      <div className="mot-de-passe-oublie-page-inner" style={{ width: '100%', maxWidth: 420, paddingTop: 30, boxSizing: 'border-box' }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <h1 style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: 28, fontWeight: 500, marginBottom: 8, color: '#1d1d1f', letterSpacing: '-0.02em' }}>
            Mot de passe oublié
          </h1>
          <p style={{ fontSize: 15, color: '#6e6e73' }}>
            {success ? 'Vérifiez votre boîte mail' : 'Réinitialisation de votre mot de passe'}
          </p>
        </div>

        <div className="mot-de-passe-oublie-form-box" style={{ backgroundColor: '#fff', padding: 36, borderRadius: 18, boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
          {success ? (
            <div>
              <div style={{ padding: 14, backgroundColor: '#f0fdf4', color: '#16a34a', fontSize: 14, marginBottom: 20, borderRadius: 12 }}>
                Un email vous a été envoyé. Cliquez sur le lien pour choisir un nouveau mot de passe.
              </div>
              <p style={{ fontSize: 13, color: '#6e6e73', marginBottom: 20 }}>
                Vous n&apos;avez pas reçu l&apos;email ? Vérifiez les spams ou renvoyez l&apos;email.
              </p>
              <Link
                href="/mot-de-passe-oublie"
                style={{ display: 'block', textAlign: 'center', fontSize: 14, color: '#1d1d1f', fontWeight: 500 }}
                onClick={(e) => { e.preventDefault(); setSuccess(false); }}
              >
                Renvoyer l&apos;email
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && (
                <div style={{ padding: 14, backgroundColor: '#fef2f2', color: '#dc2626', fontSize: 14, marginBottom: 20, borderRadius: 12 }}>
                  {error}
                </div>
              )}

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 8, color: '#1d1d1f' }}>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  required
                  style={inputStyle}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  height: 50,
                  backgroundColor: '#1d1d1f',
                  color: '#fff',
                  fontSize: 15,
                  fontWeight: 500,
                  border: 'none',
                  borderRadius: 980,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? 'Envoi en cours...' : 'Envoyer le lien'}
              </button>
            </form>
          )}
        </div>

        <div style={{ marginTop: 28, textAlign: 'center' }}>
          <Link href="/connexion" style={{ fontSize: 14, color: '#0066cc', fontWeight: 500 }}>Retour à la connexion</Link>
        </div>
      </div>
    </div>
  );
}
