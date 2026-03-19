'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, AlertTriangle, X, ChevronLeft, Check } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { updateUserProfile, signOut, getSession } from '@/lib/supabase/auth';

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

/** Même présentation que la page inscription */
const inscriptionFieldLabelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 14,
  fontWeight: 500,
  marginBottom: 8,
  color: '#1d1d1f',
};

const inscriptionInputStyle: React.CSSProperties = {
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

/** Champs comme le popup « Signaler cette annonce » (étape 2) */
const reportFieldLabelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 400,
  marginBottom: 4,
  color: '#1d1d1f',
};

const reportInputStyle: React.CSSProperties = {
  width: '100%',
  height: 42,
  padding: '0 12px',
  fontSize: 14,
  border: '1px solid #d2d2d7',
  borderRadius: 10,
  boxSizing: 'border-box',
  outline: 'none',
  backgroundColor: '#fff',
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
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailStep, setEmailStep] = useState<1 | 2 | 3>(1);
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [emailOtpCode, setEmailOtpCode] = useState('');
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [showEmailPassword, setShowEmailPassword] = useState(false);

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

  const openEmailModal = () => {
    setEmailStep(1);
    setNewEmail('');
    setEmailPassword('');
    setEmailOtpCode('');
    setEmailError('');
    setEmailSuccess(false);
    setShowEmailPassword(false);
    setEmailModalOpen(true);
  };

  const closeEmailModal = () => {
    if (emailSaving) return;
    setEmailModalOpen(false);
    setEmailStep(1);
    setEmailPassword('');
    setEmailOtpCode('');
    setNewEmail('');
    setEmailError('');
    setEmailSuccess(false);
  };

  const goEmailStepBack = () => {
    if (emailSaving) return;
    setEmailError('');
    if (emailStep === 2) {
      setEmailStep(1);
      setEmailOtpCode('');
    } else if (emailStep === 3) {
      setEmailStep(2);
      setNewEmail('');
    }
  };

  const postEmailChangeApi = async (path: string, body: Record<string, string>) => {
    const session = await getSession();
    if (!session?.access_token) throw new Error('Session expirée. Reconnectez-vous.');
    const res = await fetch(path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error((data as { error?: string }).error || 'Une erreur est survenue.');
  };

  const handleSendEmailCode = async () => {
    setEmailError('');
    setEmailSaving(true);
    try {
      await postEmailChangeApi('/api/email-change/send-code', { password: emailPassword });
      setEmailStep(2);
      setEmailOtpCode('');
    } catch (err: unknown) {
      setEmailError(err instanceof Error ? err.message : 'Impossible d’envoyer le code.');
    } finally {
      setEmailSaving(false);
    }
  };

  const handleVerifyEmailCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');
    setEmailSaving(true);
    try {
      await postEmailChangeApi('/api/email-change/verify-code', { code: emailOtpCode });
      setEmailStep(3);
      setNewEmail('');
    } catch (err: unknown) {
      setEmailError(err instanceof Error ? err.message : 'Code invalide.');
    } finally {
      setEmailSaving(false);
    }
  };

  const handleConfirmNewEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');
    const trimmed = newEmail.trim().toLowerCase();
    if (!trimmed) {
      setEmailError('Saisissez la nouvelle adresse e-mail.');
      return;
    }
    setEmailSaving(true);
    try {
      await postEmailChangeApi('/api/email-change/confirm', { newEmail: trimmed });
      const { supabase: sb } = await import('@/lib/supabase/client');
      if (sb) await sb.auth.refreshSession();
      await refreshUser();
      setEmailSuccess(true);
    } catch (err: unknown) {
      setEmailError(err instanceof Error ? err.message : 'Impossible de confirmer.');
    } finally {
      setEmailSaving(false);
    }
  };

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
            <div style={{ marginBottom: 0 }}>
              <label style={labelStyle}>E-mail</label>
              <div style={{ ...inputStyle, display: 'flex', alignItems: 'center', gap: 8, color: '#86868b', backgroundColor: '#f5f5f7' }}>
                <Mail size={16} />
                <span>{user.email}</span>
              </div>
              <div style={{ marginTop: 8, marginBottom: 0, textAlign: 'right' }}>
                <button
                  type="button"
                  onClick={openEmailModal}
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
                  Modifier l’adresse
                </button>
              </div>
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

          <p style={{ fontSize: 14, color: '#6e6e73', marginTop: 24, textAlign: 'center' }}>
            Vous êtes un professionnel ?{' '}
            <Link href="/inscription-vendeur?from=profil" style={{ color: '#0066cc', fontWeight: 500 }}>Devenir vendeur</Link>
          </p>
        </form>

        <div style={{ marginTop: 12 }}>
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

      {emailModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div
            style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)' }}
            onClick={() => closeEmailModal()}
          />
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: 420,
              maxHeight: '90vh',
              overflow: 'auto',
              backgroundColor: '#fff',
              borderRadius: 18,
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: 24 }}>
              <div
                className={`changer-email-modal-title-row${(emailStep === 2 || emailStep === 3) && !emailSuccess ? ' changer-email-modal-title-row--back' : ''}`}
                style={{ position: 'relative', marginBottom: 16 }}
              >
                {(emailStep === 2 || emailStep === 3) && !emailSuccess && (
                  <button
                    type="button"
                    onClick={goEmailStepBack}
                    disabled={emailSaving}
                    className="changer-email-modal-back"
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: 36,
                      height: 36,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: 'none',
                      background: 'none',
                      cursor: emailSaving ? 'not-allowed' : 'pointer',
                      color: '#1d1d1f',
                    }}
                    aria-label="Revenir à l’étape précédente"
                  >
                    <ChevronLeft size={24} strokeWidth={2.5} />
                  </button>
                )}
                <h2
                  style={{
                    fontFamily: 'var(--font-inter), var(--font-sans)',
                    fontSize: 19,
                    fontWeight: 600,
                    margin: 0,
                    color: '#0a0a0a',
                    textAlign: 'center',
                    paddingBottom: 16,
                    borderBottom: '1px solid #e5e5e7',
                  }}
                >
                  Changer d’adresse e-mail
                </h2>
              </div>

              {emailError && (
                <p style={{ fontSize: 13, color: '#dc2626', marginBottom: 16, textAlign: 'center' }}>{emailError}</p>
              )}

              {!emailSuccess && (
                <div
                  className="changer-email-steps-row"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28 }}
                >
                  {[1, 2, 3].map((s, i) => (
                    <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
                      <div
                        className="changer-email-step-circle"
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 980,
                          backgroundColor: emailStep >= s ? '#1d1d1f' : '#d2d2d7',
                          color: emailStep >= s ? '#fff' : '#86868b',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 15,
                          fontWeight: 600,
                          flexShrink: 0,
                        }}
                      >
                        {emailStep > s ? <Check size={18} strokeWidth={2.5} /> : s}
                      </div>
                      {i < 2 && (
                        <div
                          className="changer-email-steps-connector"
                          style={{
                            width: 56,
                            height: 2,
                            backgroundColor: emailStep > s ? '#1d1d1f' : '#d2d2d7',
                            margin: '0 10px',
                            borderRadius: 1,
                          }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {emailSuccess ? (
                <>
                  <p style={{ fontSize: 14, color: '#16a34a', marginBottom: 20, textAlign: 'center', lineHeight: 1.5 }}>
                    Votre adresse e-mail a été mise à jour.
                  </p>
                  <button
                    type="button"
                    onClick={() => closeEmailModal()}
                    style={{
                      width: '100%',
                      height: 48,
                      backgroundColor: '#1d1d1f',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 10,
                      fontSize: 15,
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    Fermer
                  </button>
                </>
              ) : emailStep === 1 ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendEmailCode();
                  }}
                >
                  <div style={{ marginBottom: 18 }}>
                    <p style={{ fontSize: 12, fontWeight: 400, color: '#86868b', lineHeight: 1.5, marginBottom: 12, marginTop: 0 }}>
                      Pour modifier votre e-mail, merci de confirmer votre mot de passe. Un code vous sera envoyé par e-mail.
                    </p>
                    <div style={{ marginBottom: 10 }}>
                      <label style={reportFieldLabelStyle}>E-mail actuel</label>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          minHeight: 42,
                          padding: '0 12px',
                          fontSize: 14,
                          color: '#86868b',
                          backgroundColor: '#f5f5f7',
                          borderRadius: 10,
                          border: '1px solid #e5e5e7',
                        }}
                      >
                        <Mail size={16} />
                        <span>{user.email}</span>
                      </div>
                    </div>
                    <div>
                      <label style={reportFieldLabelStyle}>
                        Mot de passe *
                      </label>
                      <div style={{ position: 'relative' }}>
                      <input
                        type={showEmailPassword ? 'text' : 'password'}
                        value={emailPassword}
                        onChange={(e) => setEmailPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                        disabled={emailSaving}
                        placeholder="••••••••"
                        style={{ ...reportInputStyle, paddingRight: 48 }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowEmailPassword((v) => !v)}
                        aria-label={showEmailPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
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
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {showEmailPassword ? (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                        ) : (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                        )}
                      </button>
                    </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'row', gap: 12, alignItems: 'stretch' }}>
                    <button
                      type="button"
                      onClick={() => closeEmailModal()}
                      disabled={emailSaving}
                      style={{
                        flex: 1,
                        minWidth: 0,
                        height: 48,
                        backgroundColor: '#fff',
                        color: '#1d1d1f',
                        border: '1px solid #d2d2d7',
                        borderRadius: 10,
                        fontSize: 14,
                        fontWeight: 500,
                        cursor: emailSaving ? 'not-allowed' : 'pointer',
                        fontFamily: 'inherit',
                      }}
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={emailSaving}
                      style={{
                        flex: 1,
                        minWidth: 0,
                        height: 48,
                        backgroundColor: '#1d1d1f',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 10,
                        fontSize: 15,
                        fontWeight: 500,
                        cursor: emailSaving ? 'not-allowed' : 'pointer',
                        opacity: emailSaving ? 0.7 : 1,
                      }}
                    >
                      {emailSaving ? 'Envoi...' : 'Envoyer le code'}
                    </button>
                  </div>
                </form>
              ) : emailStep === 2 ? (
                <form onSubmit={handleVerifyEmailCode}>
                  <div style={{ marginBottom: 18 }}>
                    <p style={{ fontSize: 15, fontWeight: 600, color: '#1d1d1f', marginBottom: 10 }}>
                      Saisissez le code à 6 chiffres reçu sur votre adresse e-mail actuelle (valide 5 min). *
                    </p>
                    <p style={{ fontSize: 13, color: '#86868b', marginBottom: 10, marginTop: 0, lineHeight: 1.5 }}>
                      Envoyé à : <span style={{ color: '#1d1d1f', fontWeight: 500 }}>{user.email}</span>
                    </p>
                    <label style={reportFieldLabelStyle}>Code *</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      value={emailOtpCode}
                      onChange={(e) => setEmailOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      required
                      disabled={emailSaving}
                      style={reportInputStyle}
                      placeholder="000000"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEmailError('');
                      handleSendEmailCode();
                    }}
                    disabled={emailSaving}
                    style={{
                      display: 'block',
                      width: '100%',
                      marginBottom: 16,
                      padding: 0,
                      border: 'none',
                      background: 'none',
                      fontSize: 13,
                      color: '#1d1d1f',
                      fontWeight: 600,
                      cursor: emailSaving ? 'not-allowed' : 'pointer',
                      textAlign: 'center',
                      textDecoration: 'underline',
                    }}
                  >
                    Renvoyer le code
                  </button>
                  <div style={{ display: 'flex', flexDirection: 'row', gap: 12, alignItems: 'stretch' }}>
                    <button
                      type="button"
                      onClick={() => closeEmailModal()}
                      disabled={emailSaving}
                      style={{
                        flex: 1,
                        minWidth: 0,
                        height: 48,
                        backgroundColor: '#fff',
                        color: '#1d1d1f',
                        border: '1px solid #d2d2d7',
                        borderRadius: 10,
                        fontSize: 14,
                        fontWeight: 500,
                        cursor: emailSaving ? 'not-allowed' : 'pointer',
                        fontFamily: 'inherit',
                      }}
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={emailSaving || emailOtpCode.length !== 6}
                      style={{
                        flex: 1,
                        minWidth: 0,
                        height: 48,
                        backgroundColor: '#1d1d1f',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 10,
                        fontSize: 15,
                        fontWeight: 500,
                        cursor: emailSaving || emailOtpCode.length !== 6 ? 'not-allowed' : 'pointer',
                        opacity: emailSaving || emailOtpCode.length !== 6 ? 0.7 : 1,
                      }}
                    >
                      {emailSaving ? 'Vérification...' : 'Continuer'}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleConfirmNewEmail}>
                  <div style={{ marginBottom: 18 }}>
                    <p style={{ fontSize: 15, fontWeight: 600, color: '#1d1d1f', marginBottom: 10 }}>
                      Indiquez votre nouvelle adresse e-mail. *
                    </p>
                    <label style={reportFieldLabelStyle}>Email *</label>
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      required
                      autoComplete="email"
                      disabled={emailSaving}
                      style={reportInputStyle}
                      placeholder="votre@email.com"
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'row', gap: 12, alignItems: 'stretch' }}>
                    <button
                      type="button"
                      onClick={() => closeEmailModal()}
                      disabled={emailSaving}
                      style={{
                        flex: 1,
                        minWidth: 0,
                        height: 48,
                        backgroundColor: '#fff',
                        color: '#1d1d1f',
                        border: '1px solid #d2d2d7',
                        borderRadius: 10,
                        fontSize: 14,
                        fontWeight: 500,
                        cursor: emailSaving ? 'not-allowed' : 'pointer',
                        fontFamily: 'inherit',
                      }}
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={emailSaving}
                      style={{
                        flex: 1,
                        minWidth: 0,
                        height: 48,
                        backgroundColor: '#1d1d1f',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 10,
                        fontSize: 15,
                        fontWeight: 500,
                        cursor: emailSaving ? 'not-allowed' : 'pointer',
                        opacity: emailSaving ? 0.7 : 1,
                      }}
                    >
                      {emailSaving ? 'Enregistrement...' : 'Confirmer'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

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
