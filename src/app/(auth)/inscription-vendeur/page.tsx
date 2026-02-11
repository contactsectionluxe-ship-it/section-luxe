'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle, Upload, X } from 'lucide-react';
import { useDropzone, type FileRejection } from 'react-dropzone';
import { signUpSeller } from '@/lib/supabase/auth';
import { fetchCompanyBySiret, type CompanyInfo } from '@/lib/siret';

function FileUploadField({
  label,
  file,
  onFileChange,
  hint,
}: {
  label: string;
  file: File | null;
  onFileChange: (file: File | null) => void;
  hint: string;
}) {
  const [rejectMessage, setRejectMessage] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setRejectMessage(null);
    if (acceptedFiles[0]) {
      onFileChange(acceptedFiles[0]);
    }
  }, [onFileChange]);

  const onDropRejected = useCallback((fileRejections: FileRejection[]) => {
    const first = fileRejections[0];
    if (!first) return;
    const isTooLarge = first.errors.some((e) => e.code === 'file-too-large');
    if (isTooLarge) {
      setRejectMessage('Votre fichier dépasse 5 Mo. Choisissez un fichier plus léger.');
    } else {
      setRejectMessage('Votre fichier : format non accepté. Utilisez JPEG, PNG, WebP ou PDF.');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    accept: { 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'], 'image/webp': ['.webp'], 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
  });

  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 8, color: '#333' }}>
        {label}
      </label>
      {file ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 14px',
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
          }}
        >
          <span style={{ fontSize: 13, color: '#166534', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
          <button
            type="button"
            onClick={() => onFileChange(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#166534', flexShrink: 0, marginLeft: 8 }}
          >
            <X size={18} />
          </button>
        </div>
      ) : (
        <div
          {...getRootProps()}
          style={{
            padding: 24,
            border: isDragActive ? '2px dashed #000' : '2px dashed #ddd',
            backgroundColor: isDragActive ? '#fafafa' : '#fff',
            textAlign: 'center',
            cursor: 'pointer',
          }}
        >
          <input {...getInputProps()} />
          <Upload size={24} style={{ margin: '0 auto 8px', color: '#888' }} />
          <p style={{ fontSize: 13, color: '#666' }}>
            Glissez-déposez ou cliquez
          </p>
        </div>
      )}
      {rejectMessage && (
        <p style={{ fontSize: 12, color: '#b91c1c', marginTop: 6, backgroundColor: '#fef2f2', padding: '8px 10px', borderRadius: 8 }}>
          {rejectMessage}
        </p>
      )}
      <p style={{ fontSize: 11, color: '#999', marginTop: 6 }}>{hint}</p>
    </div>
  );
}

export default function SellerRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [companyName, setCompanyName] = useState('');
  const [siret, setSiret] = useState('');
  const [siretLoading, setSiretLoading] = useState(false);
  const [siretSuggestion, setSiretSuggestion] = useState<CompanyInfo | null>(null);
  const siretFetchRef = useRef<string | null>(null);
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [idCardFront, setIdCardFront] = useState<File | null>(null);
  const [idCardBack, setIdCardBack] = useState<File | null>(null);
  const [kbis, setKbis] = useState<File | null>(null);

  // Recherche entreprise quand le SIRET complet (14 chiffres) → affiche un menu déroulant (suggestion)
  useEffect(() => {
    const digits = siret.replace(/\D/g, '');
    if (digits.length !== 14) {
      setSiretSuggestion(null);
      return;
    }
    if (siretFetchRef.current === digits) return;
    const t = setTimeout(async () => {
      siretFetchRef.current = digits;
      setSiretLoading(true);
      setSiretSuggestion(null);
      try {
        const info = await fetchCompanyBySiret(digits);
        if (info && (info.companyName || info.address)) {
          setSiretSuggestion(info);
        }
      } finally {
        setSiretLoading(false);
      }
    }, 600);
    return () => clearTimeout(t);
  }, [siret]);

  const validateStep1 = () => {
    if (!companyName || !siret || !address || !email || !phone || !description) {
      setError('Veuillez remplir tous les champs');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return false;
    }
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    setError('');
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!idCardFront || !kbis) {
      setError('Veuillez télécharger le KBIS et le justificatif d\'identité recto.');
      return;
    }

    setLoading(true);

    try {
      const formUpload = new FormData();
      formUpload.set('fileRecto', idCardFront);
      formUpload.set('fileKbis', kbis);
      if (idCardBack) formUpload.set('fileVerso', idCardBack);

      const resUpload = await fetch('/api/upload-seller-documents', {
        method: 'POST',
        body: formUpload,
      });
      if (!resUpload.ok) {
        const data = await resUpload.json().catch(() => ({}));
        throw new Error(data?.error || `Upload échoué (${resUpload.status})`);
      }
      const { idCardFrontUrl, idCardBackUrl, kbisUrl } = await resUpload.json();

      await signUpSeller(email, password, {
        companyName,
        siret,
        address,
        phone,
        description,
        idCardFrontUrl,
        idCardBackUrl,
        kbisUrl,
      });

      const formDataEmail = new FormData();
      formDataEmail.set('companyName', companyName);
      formDataEmail.set('siret', siret);
      formDataEmail.set('address', address);
      formDataEmail.set('email', email);
      formDataEmail.set('phone', phone);
      formDataEmail.set('description', description);
      if (idCardFront) formDataEmail.set('fileRecto', idCardFront);
      if (idCardBack) formDataEmail.set('fileVerso', idCardBack);
      formDataEmail.set('fileKbis', kbis);
      try {
        const resEmail = await fetch('/api/devenir-vendeur-email', {
          method: 'POST',
          body: formDataEmail,
        });
        if (!resEmail.ok) {
          console.error('Envoi email échoué:', await resEmail.text());
        }
      } catch (emailErr) {
        console.error('Envoi email:', emailErr);
      }

      setSuccess(true);
    } catch (err: any) {
      console.error('Registration error:', err);
      const msg = err?.message || err?.error_description || '';
      if (msg.includes('row-level security') || msg.includes('policy')) {
        setError('Configuration Supabase : vérifiez les politiques RLS et que la confirmation email est désactivée (Auth → Providers → Email).');
      } else if (msg.includes('Bucket') || msg.includes('storage') || msg.includes('documents')) {
        setError('Stockage : créez le bucket "documents" dans Supabase (Storage) et exécutez supabase/storage-policies.sql.');
      } else if (msg) {
        setError(`Erreur : ${msg}`);
      } else {
        setError('Une erreur est survenue. Veuillez réessayer.');
      }
    } finally {
      setLoading(false);
    }
  };

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

  if (success) {
    return (
      <main style={{ paddingTop: 89, minHeight: '100vh', backgroundColor: '#fafafa' }}>
        <div style={{ maxWidth: 450, margin: '0 auto', padding: '60px 20px', textAlign: 'center' }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              backgroundColor: '#dcfce7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
            }}
          >
            <CheckCircle size={32} color="#16a34a" />
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-playfair), Georgia, serif',
              fontSize: 26,
              fontWeight: 500,
              marginBottom: 16,
            }}
          >
            Demande envoyée !
          </h1>
          <p style={{ fontSize: 14, color: '#666', lineHeight: 1.6, marginBottom: 24 }}>
            Votre demande d&apos;inscription vendeur a été soumise. Notre équipe va examiner vos
            documents et vous recevrez une réponse dans les plus brefs délais.
          </p>
          <div style={{ padding: 16, backgroundColor: '#fef3c7', marginBottom: 24, borderRadius: 12 }}>
            <p style={{ fontSize: 13, fontWeight: 500 }}>Statut de votre demande :</p>
            <p style={{ fontSize: 14, color: '#b45309', fontWeight: 600, marginTop: 4 }}>
              En cours d&apos;étude
            </p>
          </div>
          <Link
            href="/"
            style={{
              display: 'inline-block',
              padding: '14px 28px',
              backgroundColor: '#1d1d1f',
              color: '#fff',
              fontSize: 15,
              fontWeight: 500,
              borderRadius: 980,
            }}
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main style={{ paddingTop: 89, minHeight: '100vh', backgroundColor: '#fbfbfb' }}>
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '0 24px 80px' }}>
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
            Devenir vendeur
          </h1>
          <p style={{ fontSize: 15, color: '#6e6e73' }}>
            Rejoignez Section Luxe en tant que vendeur professionnel
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28 }}>
          <div style={{ width: 40, height: 40, borderRadius: 980, backgroundColor: '#1d1d1f', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 600 }}>1</div>
          <div style={{ width: 56, height: 2, backgroundColor: step >= 2 ? '#1d1d1f' : '#d2d2d7', margin: '0 10px', borderRadius: 1 }} />
          <div style={{ width: 40, height: 40, borderRadius: 980, backgroundColor: step >= 2 ? '#1d1d1f' : '#d2d2d7', color: step >= 2 ? '#fff' : '#86868b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 600 }}>2</div>
        </div>

        <div style={{ backgroundColor: '#fff', padding: '32px 28px', borderRadius: 18, boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
          {error && (
            <div style={{ padding: 14, backgroundColor: '#fef2f2', color: '#dc2626', fontSize: 13, marginBottom: 20 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {step === 1 ? (
              <>
                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 8, color: '#333' }}>
                    Nom de l&apos;entreprise
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Ma boutique"
                    required
                    style={inputStyle}
                  />
                </div>

                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 8, color: '#333' }}>
                    SIRET
                  </label>
                  <input
                    type="text"
                    value={siret}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, '').slice(0, 14);
                      setSiret(v);
                      if (v.length !== 14) setSiretSuggestion(null);
                    }}
                    placeholder="123 456 789 00012"
                    required
                    style={inputStyle}
                    inputMode="numeric"
                    maxLength={14}
                  />
                  {siretSuggestion && !siretLoading && (
                    <div
                      style={{
                        marginTop: 6,
                        border: '1px solid #d2d2d7',
                        borderRadius: 12,
                        backgroundColor: '#fff',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                        overflow: 'hidden',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          if (siretSuggestion.companyName) setCompanyName(siretSuggestion.companyName);
                          if (siretSuggestion.address) setAddress(siretSuggestion.address);
                          setSiretSuggestion(null);
                        }}
                        style={{
                          display: 'block',
                          width: '100%',
                          padding: '12px 14px',
                          textAlign: 'left',
                          border: 'none',
                          background: 'none',
                          cursor: 'pointer',
                          fontSize: 14,
                          fontWeight: 500,
                          color: '#1d1d1f',
                          transition: 'background-color 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f5f5f7';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        {siretSuggestion.companyName || siretSuggestion.address || 'Entreprise'}
                      </button>
                    </div>
                  )}
                </div>

                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 8, color: '#333' }}>
                    Adresse
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="123 Avenue des Champs-Élysées, 75008 Paris"
                    required
                    style={inputStyle}
                  />
                </div>

                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 8, color: '#333' }}>
                    Email professionnel
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contact@boutique.com"
                    required
                    style={inputStyle}
                  />
                </div>

                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 8, color: '#333' }}>
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01 23 45 67 89"
                    required
                    style={inputStyle}
                  />
                </div>

                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 8, color: '#333' }}>
                    Description de votre activité
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Décrivez votre entreprise et votre activité..."
                    required
                    style={{
                      width: '100%',
                      minHeight: 100,
                      padding: 14,
                      fontSize: 15,
                      border: '1px solid #d2d2d7',
                      borderRadius: 12,
                      boxSizing: 'border-box',
                      resize: 'vertical',
                      outline: 'none',
                    }}
                  />
                </div>

                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 8, color: '#333' }}>
                    Mot de passe
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      style={{ ...inputStyle, paddingRight: 48 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
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
                      {showPassword ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                      )}
                    </button>
                  </div>
                  <p style={{ fontSize: 11, color: '#999', marginTop: 6 }}>Minimum 8 caractères</p>
                </div>

                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 8, color: '#333' }}>
                    Confirmer le mot de passe
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      style={{ ...inputStyle, paddingRight: 48 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      aria-label={showConfirmPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
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
                      {showConfirmPassword ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleNextStep}
                  style={{
                    width: '100%',
                    height: 50,
                    backgroundColor: '#1d1d1f',
                    color: '#fff',
                    fontSize: 15,
                    fontWeight: 500,
                    border: 'none',
                    borderRadius: 980,
                    cursor: 'pointer',
                  }}
                >
                  Continuer
                </button>
              </>
            ) : (
              <>
                <div style={{ padding: 14, backgroundColor: '#f0f9ff', marginBottom: 24, fontSize: 13, color: '#0369a1', lineHeight: 1.5 }}>
                  Pour valider votre compte, nous avons besoin de vérifier votre identité et
                  l&apos;existence légale de votre entreprise.
                  <br />
                  <strong>Formats acceptés : JPEG, PNG, WebP, PDF. (5 Mo max)</strong>
                </div>

                <FileUploadField
                  label="Extrait KBIS de moins de 3 mois"
                  file={kbis}
                  onFileChange={setKbis}
                  hint="Document officiel prouvant l'existence de votre entreprise"
                />

                <FileUploadField
                  label="Justificatif d'identité recto : CNI ou Passeport"
                  file={idCardFront}
                  onFileChange={setIdCardFront}
                  hint="Photo ou scan de la carte d'identité ou du passeport (recto)"
                />

                <FileUploadField
                  label="Justificatif d'identité verso : CNI"
                  file={idCardBack}
                  onFileChange={setIdCardBack}
                  hint="Photo ou scan de la carte d'identité (verso)"
                />

                <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    style={{
                      flex: 1,
                      height: 50,
                      backgroundColor: '#fff',
                      color: '#1d1d1f',
                      fontSize: 15,
                      fontWeight: 500,
                      border: '1.5px solid #d2d2d7',
                      borderRadius: 980,
                      cursor: 'pointer',
                    }}
                  >
                    Retour
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      flex: 1,
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
                    {loading ? 'Envoi en cours...' : 'Soumettre ma demande'}
                  </button>
                </div>
              </>
            )}
          </form>
        </div>

        <div style={{ marginTop: 28, textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: '#6e6e73' }}>
            Déjà inscrit ?{' '}
            <Link href="/connexion" style={{ color: '#0066cc', fontWeight: 500 }}>
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
