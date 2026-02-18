'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSession, updatePassword } from '@/lib/supabase/auth';

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

export default function ReinitialiserMotDePassePage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function checkSession() {
      // Donner au client Supabase le temps de traiter le hash (tokens dans l'URL)
      let session = await getSession();
      if (!session && typeof window !== 'undefined' && window.location.hash) {
        await new Promise((r) => setTimeout(r, 300));
        session = await getSession();
      }
      if (cancelled) return;
      setHasRecoverySession(!!session);
      setReady(true);
    }
    checkSession();
    return () => { cancelled = true; };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Les deux mots de passe ne correspondent pas.');
      return;
    }
    setLoading(true);
    try {
      await updatePassword(password);
      setSuccess(true);
      setTimeout(() => router.push('/connexion'), 2000);
    } catch (err) {
      console.error('Update password error:', err);
      const msg = err instanceof Error ? err.message : String(err ?? '');
      const lower = msg.toLowerCase();
      if (lower.includes('same') || lower.includes('identical') || (lower.includes('different') && lower.includes('password'))) {
        setError('Le nouveau mot de passe doit être différent de l\'ancien.');
      } else {
        setError(msg || 'Une erreur est survenue. Réessayez.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!ready) {
    return (
      <div style={{ paddingTop: 220, minHeight: '100vh', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '0 24px 24px', backgroundColor: '#fbfbfb' }}>
        <div style={{ width: '100%', maxWidth: 420, textAlign: 'center', paddingTop: 88 }}>
          <p style={{ color: '#6e6e73' }}>Chargement...</p>
        </div>
      </div>
    );
  }

  if (!hasRecoverySession) {
    return (
      <div style={{ paddingTop: 220, minHeight: '100vh', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '0 24px 24px', backgroundColor: '#fbfbfb' }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          <div style={{ height: 88, marginBottom: 0 }} aria-hidden />
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <h1 style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: 28, fontWeight: 500, marginBottom: 8, color: '#1d1d1f' }}>Lien invalide ou expiré</h1>
            <p style={{ fontSize: 15, color: '#6e6e73', marginBottom: 24 }}>Ce lien de réinitialisation n&apos;est plus valable. Demandez un nouveau lien depuis la page « Mot de passe oublié ».</p>
            <Link href="/mot-de-passe-oublie" style={{ fontSize: 15, color: '#1d1d1f', fontWeight: 500 }}>Mot de passe oublié</Link>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div style={{ paddingTop: 220, minHeight: '100vh', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '0 24px 24px', backgroundColor: '#fbfbfb' }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          <div style={{ height: 88, marginBottom: 0 }} aria-hidden />
          <div style={{ backgroundColor: '#fff', padding: 36, borderRadius: 18, boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
            <div style={{ padding: 14, backgroundColor: '#f0fdf4', color: '#16a34a', fontSize: 14, borderRadius: 12 }}>
              Mot de passe mis à jour. Redirection vers la connexion...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: 220, minHeight: '100vh', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '0 24px 24px', backgroundColor: '#fbfbfb' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ height: 88, marginBottom: 0 }} aria-hidden />
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <h1 style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: 28, fontWeight: 500, marginBottom: 8, color: '#1d1d1f', letterSpacing: '-0.02em' }}>
            Nouveau mot de passe
          </h1>
          <p style={{ fontSize: 15, color: '#6e6e73' }}>Choisissez un mot de passe d&apos;au moins 8 caractères</p>
        </div>

        <div style={{ backgroundColor: '#fff', padding: 36, borderRadius: 18, boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{ padding: 14, backgroundColor: '#fef2f2', color: '#dc2626', fontSize: 14, marginBottom: 20, borderRadius: 12 }}>
                {error}
              </div>
            )}

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 8, color: '#1d1d1f' }}>Nouveau mot de passe <span style={{ color: '#1d1d1f' }}>*</span></label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={8}
                  style={{ ...inputStyle, paddingRight: 48 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Masquer' : 'Afficher'}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    padding: 4,
                    color: '#86868b',
                  }}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                  )}
                </button>
              </div>
              <p style={{ fontSize: 12, color: '#86868b', marginTop: 6 }}>Minimum 8 caractères</p>
            </div>

            <div style={{ marginBottom: 28 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 8, color: '#1d1d1f' }}>Confirmer le mot de passe <span style={{ color: '#1d1d1f' }}>*</span></label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={8}
                  style={{ ...inputStyle, paddingRight: 48 }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  aria-label={showConfirmPassword ? 'Masquer' : 'Afficher'}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    padding: 4,
                    color: '#86868b',
                  }}
                >
                  {showConfirmPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                  )}
                </button>
              </div>
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
              {loading ? 'Enregistrement...' : 'Enregistrer le mot de passe'}
            </button>
          </form>
        </div>

        <div style={{ marginTop: 28, textAlign: 'center' }}>
          <Link href="/connexion" style={{ fontSize: 14, color: '#0066cc', fontWeight: 500 }}>Retour à la connexion</Link>
        </div>
      </div>
    </div>
  );
}
