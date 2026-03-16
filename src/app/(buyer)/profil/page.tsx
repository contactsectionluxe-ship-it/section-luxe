'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, AlertTriangle, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { updateUserProfile, signOut } from '@/lib/supabase/auth';

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 500,
  marginBottom: 8,
  color: '#333',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: 48,
  padding: '0 16px',
  fontSize: 15,
  border: '1px solid #d2d2d7',
  borderRadius: 12,
  boxSizing: 'border-box',
  outline: 'none',
};

export default function ProfilPage() {
  const router = useRouter();
  const { user, seller, isSeller, loading: authLoading, refreshUser } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletePhrase, setDeletePhrase] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/connexion');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!authLoading && user && isSeller && seller) {
      router.replace('/vendeur/profil');
    }
  }, [authLoading, user, isSeller, seller, router]);

  useEffect(() => {
    if (user) {
      const parts = (user.displayName || '').trim().split(/\s+/);
      setFirstName(parts[0] || '');
      setLastName(parts.slice(1).join(' ') || '');
      setPhone(user.phone ?? '');
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return;
    const fn = firstName.trim();
    const ln = lastName.trim();
    if (!fn || !ln) {
      setError('Le prénom et le nom sont obligatoires.');
      return;
    }
    setError('');
    setSuccess(false);
    setSaving(true);
    try {
      await updateUserProfile(user.uid, {
        displayName: `${fn} ${ln}`.trim(),
        phone: phone.trim() || null,
      });
      await refreshUser();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      const raw =
        (err && typeof err === 'object' && 'message' in err && (err as { message?: unknown }).message) ||
        (typeof err === 'string' ? err : '');
      const msg = typeof raw === 'string' ? raw : raw != null ? String(raw) : '';
      if (msg) console.error('Error updating profile:', msg, err);
      else console.error('Error updating profile (object):', err);
      setError(msg || 'Une erreur est survenue. Réessayez.');
    } finally {
      setSaving(false);
    }
  };

  const deleteAccountValid = deletePhrase.trim().toLowerCase() === 'supprimer mon compte';

  const handleDeleteAccount = async () => {
    if (!deleteAccountValid || !user) return;
    setDeleting(true);
    setDeleteError('');
    try {
      const { getSession } = await import('@/lib/supabase/auth');
      const session = await getSession();
      if (!session?.access_token) throw new Error('Session expirée');
      const res = await fetch('/api/delete-account', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { error?: string }).error || 'Échec de la suppression');
      await signOut();
      router.push('/');
      router.refresh();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Impossible de supprimer le compte.');
    } finally {
      setDeleting(false);
    }
  };

  if (authLoading || !user) return null;
  if (isSeller && seller) return null;

  return (
    <div style={{ paddingTop: 'var(--header-height)', minHeight: '100vh' }}>
      <div className="mon-profil-page-inner" style={{ maxWidth: 520, margin: '0 auto', padding: '30px 24px 80px' }}>
        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <h1 style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: 28, fontWeight: 500, marginBottom: 8 }}>
            Mon profil
          </h1>
          <p style={{ fontSize: 14, color: '#888' }}>Modifier les informations du profil</p>
        </div>

        <form onSubmit={handleSubmit} style={{ backgroundColor: '#fff', borderRadius: 18, padding: '32px 28px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
          {error && (
            <div style={{ marginBottom: 20, padding: 14, backgroundColor: '#fef2f2', color: '#dc2626', fontSize: 13, borderRadius: 10 }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{ marginBottom: 20, padding: 14, backgroundColor: '#f0fdf4', color: '#16a34a', fontSize: 13, borderRadius: 10 }}>
              Profil mis à jour. Les changements sont synchronisés.
            </div>
          )}

          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Prénom <span style={{ color: '#1d1d1f' }}>*</span></label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  style={inputStyle}
                  placeholder="Prénom"
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Nom <span style={{ color: '#1d1d1f' }}>*</span></label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  style={inputStyle}
                  placeholder="Nom"
                />
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 28 }}>
            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle}>Email</label>
              <div style={{ ...inputStyle, display: 'flex', alignItems: 'center', gap: 8, color: '#86868b', backgroundColor: '#f5f5f7' }}>
                <Mail size={16} />
                <span>{user.email}</span>
              </div>
              <p style={{ fontSize: 11, color: '#86868b', marginTop: 4 }}>
                L&apos;email ne peut pas être modifié ici.{' '}
                <Link href="/contact" style={{ color: '#1d1d1f', fontWeight: 500, textDecoration: 'underline' }}>Contact</Link>
              </p>
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle}>Téléphone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={inputStyle}
                placeholder="06 12 34 56 78"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            style={{
              width: '100%',
              height: 50,
              backgroundColor: '#1d1d1f',
              color: '#fff',
              fontSize: 15,
              fontWeight: 500,
              border: 'none',
              borderRadius: 980,
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </button>
        </form>

        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #e5e5e7' }}>
          <button
            type="button"
            onClick={() => { setDeletePhrase(''); setDeleteError(''); setDeleteModalOpen(true); }}
            style={{
              width: '100%',
              padding: '14px 20px',
              fontSize: 14,
              color: '#dc2626',
              background: 'transparent',
              border: '1px solid #fecaca',
              borderRadius: 12,
              cursor: 'pointer',
            }}
          >
            Supprimer mon compte
          </button>
        </div>
      </div>

      {deleteModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
          onClick={(e) => e.target === e.currentTarget && !deleting && setDeleteModalOpen(false)}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 16,
              maxWidth: 420,
              width: '100%',
              padding: 24,
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 600, color: '#1d1d1f' }}>Supprimer mon compte</h2>
              <button
                type="button"
                onClick={() => !deleting && setDeleteModalOpen(false)}
                style={{ padding: 8, border: 'none', background: 'none', cursor: 'pointer', color: '#86868b' }}
                aria-label="Fermer"
              >
                <X size={22} />
              </button>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                padding: '14px 16px',
                backgroundColor: '#fef3c7',
                borderRadius: 10,
                marginBottom: 24,
              }}
            >
              <AlertTriangle size={20} color="#b45309" style={{ flexShrink: 0, marginTop: 2 }} />
              <p style={{ fontSize: 14, color: '#92400e', margin: 0, lineHeight: 1.5 }}>
                Cette action est irréversible. Toutes vos données seront supprimées.
              </p>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ ...labelStyle, marginBottom: 6 }}>
                Tapez « supprimer mon compte » pour confirmer
              </label>
              <input
                type="text"
                value={deletePhrase}
                onChange={(e) => setDeletePhrase(e.target.value)}
                placeholder="supprimer mon compte"
                style={inputStyle}
                disabled={deleting}
              />
            </div>

            {deleteError && (
              <div style={{ marginBottom: 16, padding: 12, backgroundColor: '#fef2f2', color: '#dc2626', fontSize: 13, borderRadius: 10 }}>
                {deleteError}
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => !deleting && setDeleteModalOpen(false)}
                disabled={deleting}
                style={{
                  padding: '12px 20px',
                  fontSize: 14,
                  color: '#1d1d1f',
                  background: '#f5f5f7',
                  border: 'none',
                  borderRadius: 10,
                  cursor: deleting ? 'not-allowed' : 'pointer',
                }}
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={!deleteAccountValid || deleting}
                style={{
                  padding: '12px 20px',
                  fontSize: 14,
                  fontWeight: 500,
                  color: '#fff',
                  background: deleteAccountValid && !deleting ? '#dc2626' : '#d2d2d7',
                  border: 'none',
                  borderRadius: 10,
                  cursor: deleteAccountValid && !deleting ? 'pointer' : 'not-allowed',
                }}
              >
                {deleting ? 'Suppression...' : 'Supprimer définitivement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
