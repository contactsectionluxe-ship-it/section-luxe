'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, FileText, Camera, Image as ImageIcon, AlertTriangle, X, CheckCircle, Clock, XCircle, BadgeCheck } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { EmailChangeModal } from '@/components/profile/EmailChangeModal';
import { formatDate } from '@/lib/utils';
import { updateUserProfile, updateSellerProfile, signOut } from '@/lib/supabase/auth';
import { AddressAutocomplete } from '@/components/ui/AddressAutocomplete';
import { ACCEPT_IMAGES, validateImageFile } from '@/lib/file-validation';

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

export default function ProfilVendeurPage() {
  const router = useRouter();
  const { user, seller, isSeller, loading: authLoading, refreshUser } = useAuth();
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postcode, setPostcode] = useState('');
  const [description, setDescription] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null); // aperçu local avant envoi
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  /** Après un upload réussi, ne pas écraser avatarUrl avec seller (refreshUser peut renvoyer l’ancienne valeur). */
  const skipNextAvatarSyncRef = useRef(false);
  /** Cache buster pour forcer l’affichage de la nouvelle photo après upload (même URL Supabase). */
  const avatarDisplayKeyRef = useRef<number | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteCompanyName, setDeleteCompanyName] = useState('');
  const [deletePhrase, setDeletePhrase] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    if (!authLoading && (!user || !seller)) {
      router.push('/connexion');
      return;
    }
    if (!authLoading && user && (seller?.status === 'rejected' || seller?.status === 'banned')) {
      router.replace('/profil');
      return;
    }
    if (seller && user) {
      const parts = (user.displayName || '').trim().split(/\s+/);
      setFirstName(parts[0] || '');
      setLastName(parts.slice(1).join(' ') || '');
      setCompanyName(seller.companyName);
      setPhone(seller.phone);
      setAddress(seller.address);
      setCity(seller.city ?? '');
      setPostcode(seller.postcode ?? '');
      setDescription(seller.description);
      if (skipNextAvatarSyncRef.current) {
        skipNextAvatarSyncRef.current = false;
      } else {
        setAvatarUrl(prev => seller.avatarUrl ?? prev ?? null);
        if (seller.avatarUrl) avatarDisplayKeyRef.current = Date.now();
      }
      setLoading(false);
    }
  }, [authLoading, user, seller, router]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.uid) return;
    setError('');
    const preview = URL.createObjectURL(file);
    setAvatarPreview(preview);
    setAvatarUploading(true);
    try {
      const { getSession } = await import('@/lib/supabase/auth');
      const session = await getSession();
      if (!session?.access_token) throw new Error('Session expirée');
      const formData = new FormData();
      formData.set('avatar', file);
      const res = await fetch('/api/upload-seller-avatar', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error || res.statusText);
      }
      const { url } = (await res.json()) as { url: string };
      await updateSellerProfile(user.uid, { avatarUrl: url });
      URL.revokeObjectURL(preview);
      setAvatarPreview(null);
      skipNextAvatarSyncRef.current = true;
      avatarDisplayKeyRef.current = Date.now();
      setAvatarUrl(url);
      await refreshUser();
    } catch (err) {
      URL.revokeObjectURL(preview);
      setAvatarPreview(null);
      setError(err instanceof Error ? err.message : 'Échec de l\'upload de la photo.');
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return;
    const fn = firstName.trim();
    const ln = lastName.trim();
    if (!fn || !ln) {
      setError('Le prénom et le nom sont obligatoires.');
      return;
    }
    if (!companyName.trim()) {
      setError('Le nom de l\'entreprise est obligatoire.');
      return;
    }
    if (!phone.trim()) {
      setError('Le téléphone est obligatoire.');
      return;
    }
    if (!address.trim()) {
      setError('L\'adresse est obligatoire.');
      return;
    }
    setError('');
    setSuccess(false);
    setSaving(true);
    try {
      await updateUserProfile(user.uid, { displayName: `${fn} ${ln}`.trim() });
      await updateSellerProfile(user.uid, {
        companyName: companyName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        city: city.trim(),
        postcode: postcode.trim(),
        description: description.trim(),
      });
      await refreshUser();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Une erreur est survenue. Réessayez.');
    } finally {
      setSaving(false);
    }
  };

  const openDeleteModal = () => {
    setDeleteCompanyName('');
    setDeletePhrase('');
    setDeleteError('');
    setDeleteModalOpen(true);
  };

  const deleteAccountValid =
    seller &&
    deleteCompanyName.trim().toLowerCase() === seller.companyName.trim().toLowerCase() &&
    deletePhrase.trim().toLowerCase() === 'supprimer mon compte';

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

  if (authLoading || loading) {
    return (
      <div style={{ paddingTop: 'var(--header-height)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#888' }}>Chargement...</p>
      </div>
    );
  }

  if (!isSeller || !seller) return null;

  return (
    <div style={{ paddingTop: 'var(--header-height)', minHeight: '100vh' }}>
      <div className="mon-profil-page-inner" style={{ maxWidth: 520, margin: '0 auto', padding: '30px 24px 80px' }}>
        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <h1 style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: 28, fontWeight: 500, marginBottom: 8 }}>
            Mon profil
          </h1>
          <p style={{ fontSize: 14, color: '#888' }}>Modifier les informations du profil</p>
        </div>

        <form onSubmit={handleSubmit} style={{ position: 'relative', backgroundColor: '#fff', borderRadius: 18, padding: '32px 28px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
          {seller.status === 'approved' && (
            <div style={{ position: 'absolute', top: 20, left: 28, zIndex: 1 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', backgroundColor: '#dcfce7', color: '#166534', fontSize: 13, fontWeight: 600, borderRadius: 8 }}>
                <CheckCircle size={14} /> Validé
              </span>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 }}>
            <input
              ref={fileInputRef}
              id="avatar-upload"
              type="file"
              accept={ACCEPT_IMAGES}
              onChange={handleAvatarChange}
              style={{ position: 'absolute', width: 1, height: 1, opacity: 0, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}
              disabled={avatarUploading}
              aria-label="Choisir une photo de profil"
            />
            <label
              htmlFor="avatar-upload"
              style={{
                position: 'relative',
                width: 100,
                height: 100,
                borderRadius: '50%',
                overflow: 'hidden',
                border: '2px solid #e5e5e7',
                background: avatarUrl ? undefined : '#f5f5f7',
                cursor: avatarUploading ? 'not-allowed' : 'pointer',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: avatarUploading ? 'none' : 'auto',
              }}
            >
              {(avatarPreview || avatarUrl) ? (
                <img
                  src={avatarPreview ?? (avatarUrl ? `${avatarUrl}${avatarDisplayKeyRef.current ? `?t=${avatarDisplayKeyRef.current}` : ''}` : '')}
                  alt="Photo de profil"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <ImageIcon size={36} color="#86868b" style={{ margin: 'auto' }} />
              )}
              {avatarUploading && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: '#fff', fontSize: 12 }}>...</span>
                </div>
              )}
            </label>
            <span style={{ marginTop: 10, fontSize: 13, color: '#666' }}>
              {avatarUploading ? 'Envoi en cours...' : 'Cliquez pour ajouter ou modifier la photo'}
            </span>

            {seller?.status === 'pending' && (
              <div
                style={{
                  marginTop: 20,
                  padding: 16,
                  borderRadius: 12,
                  border: '1px solid #fde68a',
                  backgroundColor: '#fffbeb',
                  width: '100%',
                  boxSizing: 'border-box',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: 10,
                }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', backgroundColor: '#fef3c7', color: '#92400e', fontSize: 13, fontWeight: 600, borderRadius: 8 }}>
                  <Clock size={14} /> En attente
                </span>
                <p style={{ fontSize: 14, color: '#92400e', margin: 0, lineHeight: 1.45, fontWeight: 500 }}>
                  Demande en cours d&apos;étude
                </p>
                <p style={{ fontSize: 13, color: '#a16207', margin: 0, lineHeight: 1.5, textAlign: 'justify' }}>
                  Notre équipe examine vos documents. Vous ne pouvez pas encore publier d&apos;annonces.
                </p>
              </div>
            )}
          </div>

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

          {seller.status === 'suspended' && (
            <div
              style={{
                marginBottom: 20,
                padding: 16,
                borderRadius: 12,
                border: '1px solid #fdba74',
                backgroundColor: '#fff7ed',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', backgroundColor: '#ffedd5', color: '#c2410c', fontSize: 13, fontWeight: 600, borderRadius: 8 }}>
                  <AlertTriangle size={14} /> Compte suspendu
                </span>
                {seller.suspendedUntil && (
                  <span style={{ fontSize: 13, fontWeight: 400, color: '#c2410c' }}>
                    jusqu'au {formatDate(seller.suspendedUntil)}
                  </span>
                )}
              </div>
              <p style={{ fontSize: 14, color: '#c2410c', margin: 0, lineHeight: 1.45, fontWeight: 400 }}>
                Votre compte vendeur est temporairement suspendu. Vous ne pouvez pas déposer de nouvelles annonces.
              </p>
              <p style={{ fontSize: 13, color: '#9a3412', margin: 0, marginTop: 8, lineHeight: 1.5 }}>
                Contactez-nous pour plus d&apos;informations.
              </p>
            </div>
          )}
          <div style={{ marginBottom: 28 }}>
            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle}>Nom de l&apos;entreprise <span style={{ color: '#1d1d1f' }}>*</span></label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
                style={inputStyle}
                placeholder="Raison sociale"
              />
            </div>

            {seller.siret && (
              <div style={{ marginBottom: 18 }}>
                <label style={labelStyle}>SIRET</label>
                <div style={{ ...inputStyle, display: 'flex', alignItems: 'center', color: '#86868b', backgroundColor: '#f5f5f7' }}>
                  {seller.siret}
                </div>
                <p style={{ fontSize: 11, color: '#86868b', marginTop: 4 }}>
                  Le SIRET ne peut pas être modifié ici.{' '}
                  <Link href="/contact" style={{ color: '#1d1d1f', fontWeight: 500, textDecoration: 'underline' }}>Contact</Link>
                </p>
              </div>
            )}

            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle}>Adresse <span style={{ color: '#1d1d1f' }}>*</span></label>
              <AddressAutocomplete
                value={address}
                onChange={setAddress}
                onSuggestionSelect={(_addr, c, p) => { setCity(c); setPostcode(p); }}
                required
                placeholder="25 avenue des Champs-Élysées, 75008 Paris"
              />
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
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

            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle}>Email professionnel</label>
              <div style={{ ...inputStyle, display: 'flex', alignItems: 'center', gap: 8, color: '#86868b', backgroundColor: '#f5f5f7' }}>
                <Mail size={16} />
                <span>{user?.email ?? seller.email}</span>
              </div>
              <div style={{ marginTop: 2, marginBottom: 0, textAlign: 'right' }}>
                <button
                  type="button"
                  onClick={() => setEmailModalOpen(true)}
                  style={{
                    fontSize: 13,
                    color: '#1d1d1f',
                    fontWeight: 500,
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  Modifier l’email
                </button>
              </div>
            </div>

            <div style={{ marginBottom: 18, marginTop: -24 }}>
              <label style={labelStyle}>Téléphone <span style={{ color: '#1d1d1f' }}>*</span></label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                style={inputStyle}
                placeholder="01 23 45 67 89"
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>Description de l&apos;activité</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                style={{
                  width: '100%',
                  padding: 14,
                  fontSize: 15,
                  border: '1px solid #d2d2d7',
                  borderRadius: 12,
                  boxSizing: 'border-box',
                  resize: 'vertical',
                  outline: 'none',
                }}
                placeholder="Présentez votre activité..."
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

        <div style={{ marginTop: 12 }}>
          <button
            type="button"
            onClick={openDeleteModal}
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

      <EmailChangeModal
        open={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        currentEmail={user?.email ?? seller.email}
        refreshUser={refreshUser}
      />

      {deleteModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)' }} onClick={() => !deleting && setDeleteModalOpen(false)} />
          <div style={{ position: 'relative', width: '100%', maxWidth: 420, maxHeight: '90vh', overflow: 'auto', backgroundColor: '#fff', borderRadius: 18, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: 24 }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginBottom: 16, paddingRight: 36 }}>
                <h2 style={{ flex: 1, minWidth: 0, fontFamily: 'var(--font-inter), var(--font-sans)', fontSize: 19, fontWeight: 600, margin: 0, color: '#0a0a0a', textAlign: 'center', paddingBottom: 16, borderBottom: '1px solid #e5e5e7' }}>Supprimer mon compte</h2>
                <button type="button" onClick={() => !deleting && setDeleteModalOpen(false)} style={{ position: 'absolute', right: 0, top: -6, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: '#f5f5f7', borderRadius: 10, cursor: 'pointer' }} aria-label="Fermer">
                  <X size={20} />
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px', backgroundColor: '#fef3c7', borderRadius: 10, marginBottom: 24 }}>
                <AlertTriangle size={20} color="#b45309" style={{ flexShrink: 0, marginTop: 2 }} />
                <p style={{ fontSize: 14, color: '#92400e', margin: 0, lineHeight: 1.5, textAlign: 'justify' }}>
                  Avant de supprimer votre compte, assurez-vous d'avoir téléchargé toutes les données dont vous pourriez avoir besoin. Cette action est irréversible.
                </p>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 6, color: '#555' }}>
                  Recopiez le nom de votre entreprise : <strong>{seller?.companyName}</strong>
                </label>
                <input
                  type="text"
                  value={deleteCompanyName}
                  onChange={(e) => setDeleteCompanyName(e.target.value)}
                  placeholder="Nom de l'entreprise"
                  style={{ width: '100%', height: 44, padding: '0 12px', fontSize: 14, border: '1px solid #d2d2d7', borderRadius: 10, boxSizing: 'border-box', outline: 'none' }}
                  disabled={deleting}
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 6, color: '#555' }}>
                  Tapez « supprimer mon compte » pour confirmer
                </label>
                <input
                  type="text"
                  value={deletePhrase}
                  onChange={(e) => setDeletePhrase(e.target.value)}
                  placeholder="supprimer mon compte"
                  style={{ width: '100%', height: 44, padding: '0 12px', fontSize: 14, border: '1px solid #d2d2d7', borderRadius: 10, boxSizing: 'border-box', outline: 'none' }}
                  disabled={deleting}
                />
              </div>

              {deleteError && (
                <p style={{ fontSize: 13, color: '#dc2626', marginBottom: 16 }}>{deleteError}</p>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <button
                  type="button"
                  onClick={() => !deleting && setDeleteModalOpen(false)}
                  disabled={deleting}
                  style={{ width: '100%', height: 48, padding: '0 20px', fontSize: 15, fontWeight: 500, color: '#1d1d1f', background: '#f5f5f7', border: 'none', borderRadius: 10, cursor: deleting ? 'not-allowed' : 'pointer' }}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={!deleteAccountValid || deleting}
                  style={{ width: '100%', height: 48, padding: '0 20px', fontSize: 15, fontWeight: 500, color: '#fff', background: deleteAccountValid && !deleting ? '#dc2626' : '#d2d2d7', border: 'none', borderRadius: 10, cursor: deleteAccountValid && !deleting ? 'pointer' : 'not-allowed' }}
                >
                  {deleting ? 'Suppression...' : 'Supprimer définitivement'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
