'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, FileText, Upload, X } from 'lucide-react';
import { useDropzone, type FileRejection } from 'react-dropzone';
import { signUpSeller, upgradeToSeller } from '@/lib/supabase/auth';
import { useAuth } from '@/hooks/useAuth';
import { fetchSiretSuggestions, type SiretSuggestion } from '@/lib/siret';
import { AddressAutocomplete } from '@/components/ui/AddressAutocomplete';
import { CguCgvCheckbox } from '@/components/ui';

function FileUploadField({
  label,
  file,
  onFileChange,
  hint,
  required,
}: {
  label: string;
  file: File | null;
  onFileChange: (file: File | null) => void;
  hint: string;
  required?: boolean;
}) {
  const [rejectMessage, setRejectMessage] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const isImage = file.type.startsWith('image/');
    if (isImage) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreviewUrl(null);
  }, [file]);

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
      setRejectMessage('Votre fichier : format non accepté. Utilisez JPEG, PNG ou PDF.');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    accept: { 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'], 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
  });

  const isImageFile = file?.type.startsWith('image/');

  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 8, color: '#333' }}>
        {label}
        {required && <span style={{ color: '#1d1d1f' }}> *</span>}
      </label>
      {file ? (
        <div
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: 200,
            borderRadius: 12,
            overflow: 'hidden',
            border: '1px solid #e8e8e8',
            backgroundColor: '#fafafa',
          }}
        >
          {isImageFile && previewUrl ? (
            <div style={{ aspectRatio: 1, position: 'relative' }}>
              <img
                src={previewUrl}
                alt="Aperçu"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
              <button
                type="button"
                onClick={() => onFileChange(null)}
                aria-label="Supprimer le document"
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  border: 'none',
                  backgroundColor: 'rgba(0,0,0,0.6)',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={18} />
              </button>
            </div>
          ) : (
            <div
              style={{
                padding: 24,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                minHeight: 140,
              }}
            >
              <FileText size={40} color="#86868b" />
              <span style={{ fontSize: 13, color: '#1d1d1f', textAlign: 'center', wordBreak: 'break-all', paddingLeft: 8, paddingRight: 8 }}>{file.name}</span>
              <button
                type="button"
                onClick={() => onFileChange(null)}
                style={{
                  marginTop: 4,
                  padding: '8px 16px',
                  fontSize: 13,
                  border: '1px solid #d2d2d7',
                  borderRadius: 8,
                  backgroundColor: '#fff',
                  cursor: 'pointer',
                  color: '#1d1d1f',
                }}
              >
                Supprimer
              </button>
            </div>
          )}
          {isImageFile && (
            <p style={{ fontSize: 12, color: '#666', padding: '8px 10px', margin: 0, borderTop: '1px solid #e8e8e8' }}>{file.name}</p>
          )}
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
          <p style={{ fontSize: 11, color: '#999', marginTop: 4 }}>5 Mo max. JPEG, PNG ou PDF.</p>
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
  const searchParams = useSearchParams();
  const { user, isSeller, seller, loading: authLoading, refreshUser } = useAuth();
  const fromProfil = searchParams.get('from') === 'profil';
  const isUpgrade = Boolean(user && fromProfil && !isSeller);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [acceptCguCgv, setAcceptCguCgv] = useState(false);
  const [cguCgvError, setCguCgvError] = useState('');

  // Rediriger si déjà vendeur
  useEffect(() => {
    if (!authLoading && user && isSeller && seller) {
      router.replace('/vendeur/profil');
    }
  }, [authLoading, user, isSeller, seller, router]);

  // Préremplir depuis le profil visiteur (Devenir vendeur depuis Mon profil)
  useEffect(() => {
    if (!user || !fromProfil) return;
    const parts = (user.displayName || '').trim().split(/\s+/);
    setFirstName(parts[0] || '');
    setLastName(parts.slice(1).join(' ') || '');
    setEmail(user.email ?? '');
    setPhone(user.phone ?? '');
  }, [user, fromProfil]);

  // Remonter le formulaire en haut à chaque changement d'étape
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  // Remonter en haut pour voir le message d'erreur
  useEffect(() => {
    if (error) window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [error]);
  const [emailNotificationSent, setEmailNotificationSent] = useState(false);
  const [emailErrorDetail, setEmailErrorDetail] = useState('');

  const [companyName, setCompanyName] = useState('');
  const [siret, setSiret] = useState('');
  const [siretLoading, setSiretLoading] = useState(false);
  const [siretSuggestions, setSiretSuggestions] = useState<SiretSuggestion[]>([]);
  const siretFetchRef = useRef<string | null>(null);
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postcode, setPostcode] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [idCardFront, setIdCardFront] = useState<File | null>(null);
  const [idCardBack, setIdCardBack] = useState<File | null>(null);
  const [idRectoType, setIdRectoType] = useState<'passeport' | 'cni_recto' | null>(null);
  const [kbis, setKbis] = useState<File | null>(null);

  // Suggestions sociétés pendant la saisie du SIRET (dès 9 chiffres)
  useEffect(() => {
    const digits = siret.replace(/\D/g, '');
    if (digits.length < 9) {
      setSiretSuggestions([]);
      return;
    }
    if (siretFetchRef.current === digits) return;
    const t = setTimeout(async () => {
      siretFetchRef.current = digits;
      setSiretLoading(true);
      setSiretSuggestions([]);
      try {
        const list = await fetchSiretSuggestions(digits);
        setSiretSuggestions(list);
      } finally {
        setSiretLoading(false);
      }
    }, 200);
    return () => clearTimeout(t);
  }, [siret]);

  const validateStep1 = () => {
    if (!companyName || !siret || !address || !firstName?.trim() || !lastName?.trim() || !email || !phone) {
      setError('Veuillez remplir tous les champs');
      return false;
    }
    const emailTrimmed = email.trim();
    if (!emailTrimmed.includes('@') || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      setError('L\'email professionnel doit avoir un format valide');
      return false;
    }
    if (!isUpgrade) {
      if (password !== confirmPassword) {
        setError('Les mots de passe ne correspondent pas');
        return false;
      }
      if (password.length < 8) {
        setError('Le mot de passe doit contenir au moins 8 caractères');
        return false;
      }
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
    setCguCgvError('');
    if (step === 2 && !acceptCguCgv) {
      setCguCgvError('Veuillez accepter les CGU et les CGV pour soumettre votre demande.');
      return;
    }
    if (!idRectoType) {
      setError('Veuillez indiquer le type de justificatif d\'identité (Passeport ou CNI).');
      return;
    }
    if (!kbis) {
      setError('Veuillez télécharger un document dans Extrait KBIS de moins de 3 mois.');
      return;
    }
    if (idRectoType === 'passeport') {
      if (!idCardFront) {
        setError('Veuillez déposer un document dans Justificatif d\'identité : Passeport.');
        return;
      }
    } else {
      if (!idCardFront) {
        setError('Veuillez déposer un document dans Justificatif d\'identité : CNI recto.');
        return;
      }
      if (!idCardBack) {
        setError('Veuillez déposer un document dans Justificatif d\'identité : CNI verso.');
        return;
      }
    }

    setLoading(true);

    try {
      const siretDigits = siret.replace(/\D/g, '');
      const resCheck = await fetch(
        `/api/check-seller-availability?email=${encodeURIComponent(email.trim())}&siret=${encodeURIComponent(siretDigits)}`
      );
      if (resCheck.ok) {
        const { emailTaken, siretTaken } = await resCheck.json();
        if (emailTaken) {
          setError('Cet email est déjà utilisé par un compte vendeur.');
          setLoading(false);
          return;
        }
        if (siretTaken) {
          setError('Ce SIRET est déjà utilisé par un compte vendeur.');
          setLoading(false);
          return;
        }
      }

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
        const detail = data?.detail ? ` — ${data.detail}` : '';
        throw new Error((data?.error || `Upload échoué (${resUpload.status})`) + detail);
      }
      const { idCardFrontUrl, idCardBackUrl, kbisUrl } = await resUpload.json();

      const displayNameVal = `${firstName.trim()} ${lastName.trim()}`.trim();
      if (isUpgrade && user?.uid) {
        await upgradeToSeller(user.uid, {
          companyName,
          siret,
          address,
          city: city.trim(),
          postcode: postcode.trim(),
          phone,
          description,
          idCardFrontUrl,
          idCardBackUrl,
          idRectoType,
          kbisUrl,
          displayName: displayNameVal,
        });
        await fetch('/api/cgu-cgv-acceptance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.uid, context: 'inscription_vendeur' }),
        });
        await refreshUser();
      } else {
        const seller = await signUpSeller(email, password, {
          companyName,
          siret,
          address,
          city: city.trim(),
          postcode: postcode.trim(),
          phone,
          description,
          idCardFrontUrl,
          idCardBackUrl,
          idRectoType,
          kbisUrl,
          displayName: displayNameVal,
        });
        await fetch('/api/cgu-cgv-acceptance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: seller.uid, context: 'inscription_vendeur' }),
        });
      }

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
      let emailSent = false;
      let emailErrorDetail = '';
      try {
        const resEmail = await fetch('/api/devenir-vendeur-email', {
          method: 'POST',
          body: formDataEmail,
        });
        emailSent = resEmail.ok;
        if (!resEmail.ok) {
          const data = await resEmail.json().catch(() => ({}));
          emailErrorDetail = data?.detail || data?.error || '';
          console.error('Envoi email échoué:', data);
        }
      } catch (emailErr) {
        console.error('Envoi email:', emailErr);
      }
      setEmailErrorDetail(emailErrorDetail);

      setSuccess(true);
      setEmailNotificationSent(emailSent);
    } catch (err: unknown) {
      const raw =
        (err && typeof err === 'object' && 'message' in err && (err as { message?: unknown }).message) ||
        (err && typeof err === 'object' && 'error_description' in err && (err as { error_description?: unknown }).error_description) ||
        (err && typeof err === 'object' && 'details' in err && (err as { details?: unknown }).details) ||
        (err && typeof err === 'object' && 'msg' in err && (err as { msg?: unknown }).msg) ||
        (typeof err === 'string' ? err : '');
      const msg = typeof raw === 'string' ? raw : raw != null ? String(raw) : '';
      if (msg) console.error('Registration error:', msg, err);
      else console.error('Registration error (object):', err);
      if (msg.includes('row-level security') || msg.includes('policy')) {
        setError('Configuration Supabase : vérifiez les politiques RLS et que la confirmation email est désactivée (Auth → Providers → Email).');
      } else if (msg.includes('Bucket') || msg.includes('storage') || msg.includes('documents')) {
        setError('Stockage : créez le bucket "documents" dans Supabase (Storage) et exécutez supabase/storage-policies.sql.');
      } else if (msg.includes('already registered') || msg.includes('already exists') || msg.includes('User already registered')) {
        setError('Cet email est déjà utilisé. Connectez-vous ou utilisez un autre email.');
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

  if (authLoading || (user && isSeller)) return null;
  if (success) {
    return (
      <div style={{ paddingTop: 'var(--header-height)', minHeight: '100vh', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingLeft: 24, paddingRight: 24, paddingBottom: 24, backgroundColor: '#fbfbfb' }}>
        <div className="inscription-vendeur-page-inner" style={{ width: '100%', maxWidth: 450, paddingTop: 60, paddingBottom: 60, textAlign: 'center' }}>
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
          <div
            style={{
              marginBottom: 28,
              borderRadius: 16,
              overflow: 'hidden',
              border: '1px solid #e8e6e3',
              backgroundColor: '#fafaf9',
              boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ padding: '20px 24px' }}>
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#86868b',
                  marginBottom: 6,
                }}
              >
                Statut de votre demande
              </p>
              <p
                style={{
                  fontSize: 18,
                  fontWeight: 500,
                  color: '#1d1d1f',
                  letterSpacing: '-0.02em',
                }}
              >
                En cours d&apos;étude
              </p>
              <div
                style={{
                  marginTop: 12,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: '#e8e6e3',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: '40%',
                    height: '100%',
                    backgroundColor: '#1d1d1f',
                    borderRadius: 2,
                  }}
                />
              </div>
              <p style={{ fontSize: 12, color: '#86868b', marginTop: 10 }}>
                Notre équipe examine vos documents sous 48 à 72 h.
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
            <Link
              href="/vendeur/profil"
              style={{
                display: 'inline-block',
                padding: '14px 28px',
                backgroundColor: '#1d1d1f',
                color: '#fff',
                fontSize: 15,
                fontWeight: 500,
                borderRadius: 980,
                textDecoration: 'none',
              }}
            >
              Accéder à mon espace vendeur
            </Link>
            <Link
              href="/"
              style={{
                display: 'inline-block',
                padding: '14px 28px',
                backgroundColor: 'transparent',
                color: '#1d1d1f',
                fontSize: 15,
                fontWeight: 500,
                borderRadius: 980,
                border: '1px solid #d2d2d7',
                textDecoration: 'none',
              }}
            >
              Retour à l&apos;accueil
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: 'var(--header-height)', minHeight: '100vh', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingLeft: 24, paddingRight: 24, paddingBottom: 24, backgroundColor: '#fbfbfb' }}>
      <div className="inscription-vendeur-page-inner" style={{ width: '100%', maxWidth: 520, paddingTop: 30, paddingBottom: 80 }}>
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
            <span className="inscription-vendeur-subtitle-desktop">Rejoignez Section Luxe en tant que vendeur professionnel</span>
            <span className="inscription-vendeur-subtitle-mobile">Rejoignez Section Luxe</span>
          </p>
        </div>

        <div className="inscription-vendeur-steps-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div
              className="inscription-vendeur-step-circle"
              style={{ width: 40, height: 40, borderRadius: 980, backgroundColor: '#1d1d1f', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 600, flexShrink: 0 }}
            >
              1
            </div>
            <div
              className="inscription-vendeur-steps-connector"
              style={{ width: 56, height: 2, backgroundColor: step >= 2 ? '#1d1d1f' : '#d2d2d7', margin: '0 10px', borderRadius: 1 }}
            />
            <div
              className="inscription-vendeur-step-circle"
              style={{ width: 40, height: 40, borderRadius: 980, backgroundColor: step >= 2 ? '#1d1d1f' : '#d2d2d7', color: step >= 2 ? '#fff' : '#86868b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 600, flexShrink: 0 }}
            >
              2
            </div>
          </div>
        </div>

        <div className="inscription-vendeur-form-box" style={{ backgroundColor: '#fff', padding: '32px 28px', borderRadius: 18, boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
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
                    Nom de l&apos;entreprise <span style={{ color: '#1d1d1f' }}>*</span>
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
                    Siret <span style={{ color: '#1d1d1f' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={siret}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, '').slice(0, 14);
                      setSiret(v);
                      if (v.length < 9) setSiretSuggestions([]);
                    }}
                    placeholder="123 456 789 00012"
                    required
                    style={inputStyle}
                    inputMode="numeric"
                    maxLength={14}
                  />
                  {!siretLoading && siretSuggestions.length > 0 && (() => {
                    const digits = siret.replace(/\D/g, '');
                    const oneProposition = digits.length === 14;
                    const toShow = oneProposition ? siretSuggestions.slice(0, 1) : siretSuggestions;
                    return (
                    <div
                      style={{
                        marginTop: 6,
                        border: '1px solid #d2d2d7',
                        borderRadius: 12,
                        backgroundColor: '#fff',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                        overflow: 'hidden',
                        ...(oneProposition ? {} : { maxHeight: 192, overflowY: 'auto' as const }),
                      }}
                    >
                      {toShow.map((sug, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            if (sug.companyName) setCompanyName(sug.companyName);
                            if (sug.address) setAddress(sug.address);
                            if (sug.siret) setSiret(sug.siret);
                            setSiretSuggestions([]);
                          }}
                          style={{
                            display: 'block',
                            width: '100%',
                            padding: '12px 14px',
                            textAlign: 'left',
                            border: 'none',
                            borderBottom: i < toShow.length - 1 ? '1px solid #e8e8ed' : 'none',
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
                          {sug.companyName || sug.address || 'Entreprise'}
                          {sug.siret && (
                            <span style={{ display: 'block', fontSize: 12, color: '#86868b', marginTop: 2 }}>
                              SIRET {sug.siret}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                    );
                  })()}
                </div>

                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 8, color: '#333' }}>
                    Adresse <span style={{ color: '#1d1d1f' }}>*</span>
                  </label>
                  <AddressAutocomplete
                    value={address}
                    onChange={setAddress}
                    onSuggestionSelect={(_addr, c, p) => { setCity(c); setPostcode(p); }}
                    placeholder="25 avenue des Champs-Élysées, 75008 Paris"
                    required
                  />
                </div>

                <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 8, color: '#333' }}>
                      Prénom <span style={{ color: '#1d1d1f' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Prénom"
                      required
                      style={inputStyle}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 8, color: '#333' }}>
                      Nom <span style={{ color: '#1d1d1f' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Nom"
                      required
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 8, color: '#333' }}>
                    Email professionnel <span style={{ color: '#1d1d1f' }}>*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contact@boutique.com"
                    required
                    pattern="[^\s@]+@[^\s@]+\.[^\s@]+"
                    title="Indiquez un email avec un @ (ex. contact@entreprise.com)"
                    style={{ ...inputStyle, ...(isUpgrade && { backgroundColor: '#f5f5f7', color: '#6e6e73' }) }}
                    readOnly={isUpgrade}
                  />
                </div>

                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 8, color: '#333' }}>
                    Téléphone <span style={{ color: '#1d1d1f' }}>*</span>
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

                {!isUpgrade && (
                  <>
                    <div style={{ marginBottom: 18 }}>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 8, color: '#333' }}>
                        Mot de passe <span style={{ color: '#1d1d1f' }}>*</span>
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
                  </>
                )}

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
                  <strong>Formats acceptés : JPEG, PNG, PDF. (5 Mo max)</strong>
                </div>

                <FileUploadField
                  label="Extrait KBIS de moins de 3 mois"
                  file={kbis}
                  onFileChange={setKbis}
                  hint="Obligatoire. Document officiel prouvant l'existence de votre entreprise"
                  required
                />

                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 14, fontWeight: 500, color: '#1d1d1f', marginBottom: 10 }}>
                    Type de justificatif d&apos;identité
                  </p>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, color: '#1d1d1f' }}>
                      <input
                        type="radio"
                        name="idRectoType"
                        checked={idRectoType === 'passeport'}
                        onChange={() => setIdRectoType('passeport')}
                        style={{ width: 18, height: 18, accentColor: '#1d1d1f' }}
                      />
                      Passeport
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, color: '#1d1d1f' }}>
                      <input
                        type="radio"
                        name="idRectoType"
                        checked={idRectoType === 'cni_recto'}
                        onChange={() => setIdRectoType('cni_recto')}
                        style={{ width: 18, height: 18, accentColor: '#1d1d1f' }}
                      />
                      CNI
                    </label>
                  </div>
                </div>

                <FileUploadField
                  label={idRectoType === 'cni_recto' ? 'Justificatif d\'identité : CNI recto' : idRectoType === 'passeport' ? 'Justificatif d\'identité : Passeport' : 'Justificatif d\'identité : CNI recto'}
                  file={idCardFront}
                  onFileChange={setIdCardFront}
                  hint={idRectoType === 'passeport' ? 'Obligatoire. Photo ou scan du passeport' : 'Obligatoire. Photo ou scan de la carte d\'identité (recto)'}
                  required
                />

                {idRectoType === 'cni_recto' && (
                  <FileUploadField
                    label="Justificatif d'identité : CNI verso"
                    file={idCardBack}
                    onFileChange={setIdCardBack}
                    hint="Obligatoire. Photo ou scan de la carte d'identité (verso)"
                    required
                  />
                )}

                <CguCgvCheckbox
                  id="inscription-vendeur-cgu-cgv"
                  checked={acceptCguCgv}
                  onChange={(v) => { setAcceptCguCgv(v); setCguCgvError(''); }}
                  error={cguCgvError}
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
              Connexion
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
