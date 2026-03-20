'use client';

import { useEffect, useState } from 'react';
import { Mail, ChevronLeft, Check } from 'lucide-react';
import { getSession } from '@/lib/supabase/auth';

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

const EMAIL_OTP_RESEND_COOLDOWN_SEC = 300;

export type EmailChangeModalProps = {
  open: boolean;
  onClose: () => void;
  /** E-mail du compte (Auth), affiché pour l’envoi du code */
  currentEmail: string;
  refreshUser: () => Promise<void>;
};

export function EmailChangeModal({ open, onClose, currentEmail, refreshUser }: EmailChangeModalProps) {
  const [emailStep, setEmailStep] = useState<1 | 2 | 3>(1);
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [emailOtpCode, setEmailOtpCode] = useState('');
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [showEmailPassword, setShowEmailPassword] = useState(false);
  const [emailOtpResendSecondsLeft, setEmailOtpResendSecondsLeft] = useState(0);

  useEffect(() => {
    if (!open) {
      setEmailStep(1);
      setNewEmail('');
      setEmailPassword('');
      setEmailOtpCode('');
      setEmailError('');
      setEmailSuccess(false);
      setShowEmailPassword(false);
      setEmailOtpResendSecondsLeft(0);
    }
  }, [open]);

  useEffect(() => {
    if (emailOtpResendSecondsLeft <= 0) return;
    const id = window.setInterval(() => {
      setEmailOtpResendSecondsLeft((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [emailOtpResendSecondsLeft]);

  const handleClose = () => {
    if (emailSaving) return;
    onClose();
  };

  const goEmailStepBack = () => {
    if (emailSaving) return;
    setEmailError('');
    if (emailStep === 2) {
      setEmailStep(1);
      setEmailOtpCode('');
      setEmailOtpResendSecondsLeft(0);
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
      setEmailOtpResendSecondsLeft(EMAIL_OTP_RESEND_COOLDOWN_SEC);
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

  if (!open) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div
        style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)' }}
        onClick={() => handleClose()}
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
                onClick={() => handleClose()}
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
                    <span>{currentEmail}</span>
                  </div>
                </div>
                <div>
                  <label style={reportFieldLabelStyle}>Mot de passe *</label>
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
                  onClick={() => handleClose()}
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
                <p style={{ fontSize: 12, fontWeight: 400, color: '#86868b', lineHeight: 1.5, marginBottom: 12, marginTop: 0 }}>
                  Saisissez le code à 6 chiffres reçu sur votre adresse e-mail actuelle (valide 5 min). *
                </p>
                <p style={{ fontSize: 13, color: '#86868b', marginBottom: 10, marginTop: 0, lineHeight: 1.5 }}>
                  Envoyé à : <span style={{ color: '#1d1d1f', fontWeight: 500 }}>{currentEmail}</span>
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
                  if (emailOtpResendSecondsLeft > 0 || emailSaving) return;
                  setEmailError('');
                  handleSendEmailCode();
                }}
                disabled={emailSaving || emailOtpResendSecondsLeft > 0}
                style={{
                  display: 'block',
                  width: '100%',
                  marginBottom: 16,
                  padding: 0,
                  border: 'none',
                  background: 'none',
                  fontSize: 13,
                  color: emailOtpResendSecondsLeft > 0 || emailSaving ? '#86868b' : '#1d1d1f',
                  fontWeight: 600,
                  cursor: emailSaving || emailOtpResendSecondsLeft > 0 ? 'not-allowed' : 'pointer',
                  textAlign: 'center',
                  textDecoration: emailOtpResendSecondsLeft > 0 || emailSaving ? 'none' : 'underline',
                }}
              >
                {emailOtpResendSecondsLeft > 0
                  ? `Renvoyer le code (${emailOtpResendSecondsLeft} s)`
                  : 'Renvoyer le code'}
              </button>
              <div style={{ display: 'flex', flexDirection: 'row', gap: 12, alignItems: 'stretch' }}>
                <button
                  type="button"
                  onClick={() => handleClose()}
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
                <p style={{ fontSize: 12, fontWeight: 400, color: '#86868b', lineHeight: 1.5, marginBottom: 12, marginTop: 0 }}>
                  Indiquez votre nouvelle adresse e-mail.
                </p>
                <label style={reportFieldLabelStyle}>Nouvelle adresse e-mail *</label>
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
                  onClick={() => handleClose()}
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
  );
}
