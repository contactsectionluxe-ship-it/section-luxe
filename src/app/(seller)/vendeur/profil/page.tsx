'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, FileText, Camera } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/lib/utils';
import { updateUserProfile, updateSellerProfile } from '@/lib/supabase/auth';
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

  useEffect(() => {
    if (!authLoading && (!user || !seller)) {
      router.push('/connexion');
    } else if (seller && user) {
      const parts = (user.displayName || '').trim().split(/\s+/);
      setFirstName(parts[0] || '');
      setLastName(parts.slice(1).join(' ') || '');
      setCompanyName(seller.companyName);
      setPhone(seller.phone);
      setAddress(seller.address);
      setCity(seller.city ?? '');
      setPostcode(seller.postcode ?? '');
      setDescription(seller.description);
      setAvatarUrl(prev => seller.avatarUrl ?? prev ?? null);
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

  if (authLoading || loading) {
    return (
      <div style={{ paddingTop: 'var(--header-height)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#888' }}>Chargement...</p>
      </div>
    );
  }

  if (!isSeller || !seller) return null;

  return (
    <div style={{ paddingTop: 'var(--header-height)', minHeight: '100vh', backgroundColor: '#fbfbfb' }}>
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '32px 24px 80px' }}>
        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <h1 style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: 28, fontWeight: 500, marginBottom: 8 }}>
            Mon profil
          </h1>
          <p style={{ fontSize: 14, color: '#888' }}>Modifier les informations du profil</p>
        </div>

        <form onSubmit={handleSubmit} style={{ backgroundColor: '#fff', borderRadius: 18, padding: '32px 28px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 }}>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPT_IMAGES}
              onChange={handleAvatarChange}
              style={{ display: 'none' }}
              disabled={avatarUploading}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarUploading}
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
              }}
            >
              {(avatarPreview || avatarUrl) ? (
                <img
                  src={avatarPreview ?? avatarUrl ?? ''}
                  alt="Photo de profil"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <Camera size={36} color="#86868b" style={{ margin: 'auto' }} />
              )}
              {avatarUploading && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: '#fff', fontSize: 12 }}>...</span>
                </div>
              )}
            </button>
            <span style={{ marginTop: 10, fontSize: 13, color: '#666' }}>
              {avatarUploading ? 'Envoi en cours...' : 'Cliquez pour ajouter ou modifier la photo'}
            </span>
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

          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Prénom <span style={{ color: '#dc2626' }}>*</span></label>
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
                <label style={labelStyle}>Nom <span style={{ color: '#dc2626' }}>*</span></label>
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
              <label style={labelStyle}>Nom de l&apos;entreprise</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
                style={inputStyle}
                placeholder="Raison sociale"
              />
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle}>Email professionnel</label>
              <div style={{ ...inputStyle, display: 'flex', alignItems: 'center', gap: 8, color: '#86868b', backgroundColor: '#f5f5f7' }}>
                <Mail size={16} />
                <span>{seller.email}</span>
              </div>
              <p style={{ fontSize: 11, color: '#86868b', marginTop: 4 }}>L&apos;email ne peut pas être modifié ici.</p>
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle}>Téléphone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                style={inputStyle}
                placeholder="+33 1 23 45 67 89"
              />
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle}>Adresse <span style={{ color: '#dc2626' }}>*</span></label>
              <AddressAutocomplete
                value={address}
                onChange={setAddress}
                onSuggestionSelect={(_addr, c, p) => { setCity(c); setPostcode(p); }}
                required
                placeholder="25 avenue des Champs-Élysées, 75008 Paris"
              />
            </div>

            {seller.siret && (
              <div style={{ marginBottom: 18 }}>
                <label style={labelStyle}>SIRET</label>
                <div style={{ ...inputStyle, display: 'flex', alignItems: 'center', color: '#86868b', backgroundColor: '#f5f5f7' }}>
                  {seller.siret}
                </div>
                <p style={{ fontSize: 11, color: '#86868b', marginTop: 4 }}>Le SIRET ne peut pas être modifié.</p>
              </div>
            )}

            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>Description de l&apos;activité</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
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

          <div style={{ borderTop: '1px solid #eee', paddingTop: 24, marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <FileText size={20} color="#666" />
              <h2 style={{ fontSize: 18, fontWeight: 600, color: '#1d1d1f' }}>Statut</h2>
            </div>
            <p style={{ fontSize: 13, color: '#1d1d1f', marginBottom: 4 }}>
              {seller.status === 'approved' && '✓ Validé'}
              {seller.status === 'pending' && '⏳ En attente'}
              {seller.status === 'rejected' && '✗ Refusé'}
            </p>
            <p style={{ fontSize: 12, color: '#86868b' }}>Inscription le {formatDate(seller.createdAt)}</p>
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
      </div>
    </div>
  );
}
