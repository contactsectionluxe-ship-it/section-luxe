'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Euro, Trash2, Upload } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { PageLoader } from '@/components/ui';
import { createListing, updateListing } from '@/lib/supabase/listings';
import { uploadListingPhotos } from '@/lib/supabase/storage';
import { CATEGORIES } from '@/lib/utils';
import { MAX_FILE_SIZE_BYTES } from '@/lib/file-validation';
import { BRANDS_BY_CATEGORY, COLORS, COLORS_BY_CATEGORY, CONDITIONS, MATIERES_BY_CATEGORY, MATERIALS, MODELS_BY_CATEGORY_BRAND } from '@/lib/constants';
import { ListingCategory } from '@/types';

const ETAT_OPTIONS = [
  { value: 'new', label: 'Neuf' },
  { value: 'very_good', label: 'Très bon état' },
  { value: 'good', label: 'Bon état' },
  { value: 'correct', label: 'Correct' },
];

/** Contenu inclus : chaque clé (box, certificat, facture) présente dans packaging = Oui */
const CONTENU_INCLUS_OPTIONS = [
  { value: 'box', label: 'Boîte' },
  { value: 'certificat', label: 'Certificat' },
  { value: 'facture', label: 'Facture' },
];

const STEP_TITLES = ['Caractéristiques', 'Photos', 'Description & détails', 'Prix'];

export default function NewListingPage() {
  const router = useRouter();
  const { user, seller, isApprovedSeller, loading: authLoading } = useAuth();
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Remonter le formulaire en haut à chaque changement d'étape
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  // Étape 1
  const [category, setCategory] = useState<ListingCategory | '' | 'autre'>('');
  const [customCategory, setCustomCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [customBrand, setCustomBrand] = useState('');
  const [model, setModel] = useState('');
  const [customModel, setCustomModel] = useState('');
  const [condition, setCondition] = useState('');
  const [material, setMaterial] = useState('');
  const [customMaterial, setCustomMaterial] = useState('');
  const [color, setColor] = useState('');
  const [customColor, setCustomColor] = useState('');

  // Étape 2
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [hoveredPhotoIndex, setHoveredPhotoIndex] = useState<number | null>(null);

  const maxPhotos = 9;
  const onDropPhotos = useCallback(
    (acceptedFiles: File[]) => {
      const remaining = maxPhotos - photos.length;
      const toAdd = acceptedFiles.slice(0, remaining);
      setPhotos((prev) => [...prev, ...toAdd]);
    },
    [photos.length]
  );
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onDropPhotos,
    accept: { 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'], 'image/webp': ['.webp'] },
    maxFiles: maxPhotos - photos.length,
    maxSize: MAX_FILE_SIZE_BYTES,
    disabled: photos.length >= maxPhotos,
  });
  useEffect(() => {
    const urls = photos.map((file) => URL.createObjectURL(file));
    setPhotoPreviews(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [photos]);
  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  // Étape 3
  const [description, setDescription] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [widthCm, setWidthCm] = useState('');
  const [year, setYear] = useState('');
  const [packaging, setPackaging] = useState<string[]>([]);
  const [contenuInclusTouched, setContenuInclusTouched] = useState<Record<string, boolean>>({ box: false, certificat: false, facture: false });

  // Étape 4
  const [price, setPrice] = useState('');
  const [isActive, setIsActive] = useState(true);

  const categoryOptions = CATEGORIES;
  // Marques filtrées par catégorie (affichées seulement après choix de la catégorie)
  const brandOptions =
    category && BRANDS_BY_CATEGORY[category]
      ? BRANDS_BY_CATEGORY[category].map((b) => ({ value: b, label: b }))
      : [];

  // Modèles selon catégorie et marque (vide si marque "Autre" ou non renseignée)
  const brandForModels = brand === 'Autre' ? customBrand.trim() : brand;
  const modelOptions =
    category && category !== 'autre' && brandForModels
      ? (MODELS_BY_CATEGORY_BRAND[category]?.[brandForModels] ?? [])
      : [];

  // Matières selon catégorie (puis marque/modèle pris en compte via la catégorie)
  const materialOptions = category ? (MATIERES_BY_CATEGORY[category] ?? MATERIALS) : [];

  // Couleurs selon catégorie (et matière implicite : liste adaptée sacs/montres/bijoux/etc.)
  const colorOptions = category ? (COLORS_BY_CATEGORY[category] ?? COLORS) : [];

  if (authLoading) return <PageLoader />;
  if (!isApprovedSeller) {
    router.push('/vendeur');
    return null;
  }

  const validateStep1 = () => {
    if (!category) {
      setError('Sélectionnez une catégorie');
      return false;
    }
    if (category === 'autre' && !customCategory.trim()) {
      setError('Précisez la catégorie');
      return false;
    }
    if (!brand.trim()) {
      setError('Sélectionnez la marque');
      return false;
    }
    if (brand === 'Autre' && !customBrand.trim()) {
      setError('Précisez la marque');
      return false;
    }
    if (modelOptions.length > 0) {
      if (!model) {
        setError('Sélectionnez le modèle');
        return false;
      }
      if (model === 'Autre' && !customModel.trim()) {
        setError('Précisez le modèle');
        return false;
      }
    } else if (category && category !== 'autre' && brandForModels) {
      if (!customModel.trim()) {
        setError('Indiquez le modèle');
        return false;
      }
    }
    if (!condition) {
      setError('Sélectionnez l\'état');
      return false;
    }
    // Matière, couleur : optionnels
    setError('');
    return true;
  };

  const validateStep2 = () => {
    if (photos.length < 1) {
      setError('Ajoutez au moins une photo (minimum 1, maximum 9)');
      return false;
    }
    setError('');
    return true;
  };

  const validateStep3 = () => {
    const allContenuAnswered = CONTENU_INCLUS_OPTIONS.every((opt) => contenuInclusTouched[opt.value]);
    if (!allContenuAnswered) {
      setError('Veuillez indiquer le contenu inclus pour la boîte, le certificat et la facture (Oui ou Non pour chaque).');
      return false;
    }
    setError('');
    return true;
  };

  const validateStep4 = () => {
    const priceNum = parseFloat(price.replace(',', '.'));
    if (isNaN(priceNum) || priceNum <= 0) {
      setError('Entrez un prix valide');
      return false;
    }
    setError('');
    return true;
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    if (step === 3 && !validateStep3()) return;
    setError('');
    setStep((s) => Math.min(s + 1, 4));
  };

  const handleBack = () => {
    setError('');
    setStep((s) => Math.max(s - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep4()) return;

    setLoading(true);
    setError('');

    try {
      const categoryLabel = category === 'autre' ? customCategory.trim() : (CATEGORIES.find((c) => c.value === category)?.label || category);
      const brandToSave = brand === 'Autre' ? customBrand.trim() : brand.trim();
      const modelToSave =
        modelOptions.length > 0
          ? (model === 'Autre' ? customModel.trim() : model) || null
          : customModel.trim() || null;
      const title = modelToSave ? `${brandToSave} - ${modelToSave}` : `${brandToSave} - ${categoryLabel}`;
      const priceNum = parseFloat(price.replace(',', '.'));

      // Créer l'annonce d'abord (sans photos) pour obtenir un id existant en base
      const listingId = await createListing({
        sellerId: user!.uid,
        sellerName: seller!.companyName,
        title,
        description: description.trim() || '',
        price: priceNum,
        category: (category === 'autre' ? customCategory.trim() : category) as ListingCategory,
        photos: [],
        brand: brandToSave || null,
        model: modelToSave || null,
        condition: condition || null,
        material: material === 'other' ? customMaterial.trim() || null : material || null,
        color: color === 'other' ? customColor.trim() || null : color || null,
        heightCm: heightCm ? parseFloat(heightCm.replace(',', '.')) : null,
        widthCm: widthCm ? parseFloat(widthCm.replace(',', '.')) : null,
        year: year ? parseInt(year, 10) : null,
        packaging: packaging.length ? packaging : null,
        isActive,
      });

      let photoUrls: string[] = [];
      if (photos.length > 0) {
        photoUrls = await uploadListingPhotos(user!.uid, listingId, photos);
        if (photoUrls.length > 0) {
          await updateListing(listingId, { photos: photoUrls });
        }
      }

      router.push('/vendeur');
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : typeof (err as { message?: string })?.message === 'string'
            ? (err as { message: string }).message
            : 'Une erreur est survenue';
      if (process.env.NODE_ENV === 'development' && err instanceof Error) {
        console.error('[createListing]', message, err);
      }
      setError(
        message.includes('Storage') || message.includes('upload')
          ? `Erreur lors de l'upload des photos. Vérifiez que le bucket "listings" existe et que les politiques Storage sont appliquées (voir supabase/storage-policies.sql). Détail : ${message}`
          : message
      );
    } finally {
      setLoading(false);
    }
  };

  const setContenuInclus = (key: string, included: boolean) => {
    setContenuInclusTouched((prev) => ({ ...prev, [key]: true }));
    setPackaging((prev) =>
      included ? (prev.includes(key) ? prev : [...prev, key]) : prev.filter((p) => p !== key)
    );
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

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 13,
    fontWeight: 500,
    marginBottom: 8,
    color: '#333',
  };

  return (
    <div style={{ paddingTop: 'var(--header-height)', minHeight: '100vh', backgroundColor: '#fbfbfb' }}>
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '0.5cm 24px 80px' }}>
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
            Déposer une annonce
          </h1>
          <p style={{ fontSize: 15, color: '#6e6e73' }}>
            Créez une nouvelle annonce pour votre article de luxe
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28 }}>
          {[1, 2, 3, 4].map((s, i) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 980,
                  backgroundColor: step >= s ? '#1d1d1f' : '#d2d2d7',
                  color: step >= s ? '#fff' : '#86868b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 15,
                  fontWeight: 600,
                }}
              >
                {step > s ? <Check size={18} /> : s}
              </div>
              {i < 3 && (
                <div
                  style={{
                    width: 56,
                    height: 2,
                    backgroundColor: step > s ? '#1d1d1f' : '#d2d2d7',
                    margin: '0 10px',
                    borderRadius: 1,
                  }}
                />
              )}
            </div>
          ))}
        </div>

        <div style={{ backgroundColor: '#fff', padding: '32px 28px', borderRadius: 18, boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
          {error && (
            <div style={{ padding: 14, backgroundColor: '#fef2f2', color: '#dc2626', fontSize: 13, marginBottom: 20 }}>
              {error}
            </div>
          )}

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                <div style={{ marginBottom: 18 }}>
                  <label style={labelStyle}>Catégorie <span style={{ color: '#1d1d1f' }}>*</span></label>
                  <select
                    value={category}
                    onChange={(e) => {
                    setCategory(e.target.value as ListingCategory | 'autre');
                    if (e.target.value !== 'autre') setCustomCategory('');
                    setBrand('');
                    setCustomBrand('');
                    setModel('');
                    setCustomModel('');
                    setMaterial('');
                    setCustomMaterial('');
                    setColor('');
                    setCustomColor('');
                  }}
                    required
                    style={{ ...inputStyle, paddingRight: 40, cursor: 'pointer', appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2386868b' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center' }}
                  >
                    <option value="">Sélectionnez une catégorie</option>
                    {categoryOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                {category === 'autre' && (
                  <div style={{ marginBottom: 18 }}>
                    <label style={labelStyle}>Catégorie personnalisée <span style={{ color: '#1d1d1f' }}>*</span></label>
                    <input
                      type="text"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      placeholder="Indiquez la catégorie"
                      style={inputStyle}
                    />
                  </div>
                )}
                <div style={{ marginBottom: 18 }}>
                  <label style={labelStyle}>Marque <span style={{ color: '#1d1d1f' }}>*</span></label>
                  <select
                    value={brand}
                    onChange={(e) => {
                      setBrand(e.target.value);
                      if (e.target.value !== 'Autre') setCustomBrand('');
                      setModel('');
                      setCustomModel('');
                      setMaterial('');
                      setCustomMaterial('');
                    }}
                    required
                    disabled={!category}
                    style={{
                      ...inputStyle,
                      paddingRight: 40,
                      cursor: category ? 'pointer' : 'not-allowed',
                      opacity: category ? 1 : 0.7,
                      appearance: 'none',
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2386868b' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 14px center',
                    }}
                  >
                    <option value="">
                      {category ? 'Sélectionnez la marque' : 'Sélectionnez d\'abord une catégorie'}
                    </option>
                    {brandOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                {brand === 'Autre' && (
                  <div style={{ marginBottom: 18 }}>
                    <label style={labelStyle}>Marque personnalisée <span style={{ color: '#1d1d1f' }}>*</span></label>
                    <input
                      type="text"
                      value={customBrand}
                      onChange={(e) => setCustomBrand(e.target.value)}
                      placeholder="Indiquez la marque"
                      style={inputStyle}
                    />
                  </div>
                )}
                <div style={{ marginBottom: 18 }}>
                  <label style={labelStyle}>Modèle <span style={{ color: '#1d1d1f' }}>*</span></label>
                  {modelOptions.length > 0 ? (
                    <>
                      <select
                        value={model}
                        onChange={(e) => {
                          setModel(e.target.value);
                          if (e.target.value !== 'Autre') setCustomModel('');
                          setMaterial('');
                          setCustomMaterial('');
                        }}
                        required
                        style={{ ...inputStyle, paddingRight: 40, cursor: 'pointer', appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2386868b' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center' }}
                      >
                        <option value="">Sélectionnez le modèle</option>
                        {modelOptions.map((name) => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                      </select>
                      {model === 'Autre' && (
                        <input
                          type="text"
                          value={customModel}
                          onChange={(e) => setCustomModel(e.target.value)}
                          placeholder="Indiquez le modèle"
                          style={{ ...inputStyle, marginTop: 10 }}
                        />
                      )}
                    </>
                  ) : (
                    <input
                      type="text"
                      value={customModel}
                      onChange={(e) => setCustomModel(e.target.value)}
                      placeholder="Indiquez le modèle (ex. Birkin 30, Submariner)"
                      style={inputStyle}
                    />
                  )}
                </div>
                <div style={{ marginBottom: 18 }}>
                  <label style={labelStyle}>État <span style={{ color: '#1d1d1f' }}>*</span></label>
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
                    required
                    style={{ ...inputStyle, paddingRight: 40, cursor: 'pointer', appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2386868b' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center' }}
                  >
                    <option value="">Sélectionnez l&apos;état</option>
                    {CONDITIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div style={{ marginBottom: 18 }}>
                  <label style={labelStyle}>Matière</label>
                  <select
                    value={material}
                    onChange={(e) => {
                      setMaterial(e.target.value);
                      if (e.target.value !== 'other') setCustomMaterial('');
                    }}
                    disabled={!category}
                    style={{
                      ...inputStyle,
                      paddingRight: 40,
                      cursor: category ? 'pointer' : 'not-allowed',
                      opacity: category ? 1 : 0.7,
                      appearance: 'none',
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2386868b' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 14px center',
                    }}
                  >
                    <option value="">
                      {category ? 'Sélectionnez la matière' : 'Sélectionnez d\'abord une catégorie'}
                    </option>
                    {materialOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                {material === 'other' && (
                  <div style={{ marginBottom: 18 }}>
                    <label style={labelStyle}>Matière personnalisée</label>
                    <input
                      type="text"
                      value={customMaterial}
                      onChange={(e) => setCustomMaterial(e.target.value)}
                      placeholder="Indiquez la matière"
                      style={inputStyle}
                    />
                  </div>
                )}
                <div style={{ marginBottom: color === 'other' ? 18 : 24 }}>
                  <label style={labelStyle}>Couleur</label>
                  <select
                    value={color}
                    onChange={(e) => { setColor(e.target.value); if (e.target.value !== 'other') setCustomColor(''); }}
                    disabled={!category}
                    style={{
                      ...inputStyle,
                      paddingRight: 40,
                      cursor: category ? 'pointer' : 'not-allowed',
                      opacity: category ? 1 : 0.7,
                      appearance: 'none',
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2386868b' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 14px center',
                    }}
                  >
                    <option value="">
                      {category ? 'Sélectionnez la couleur' : 'Sélectionnez d\'abord une catégorie'}
                    </option>
                    {colorOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                {color === 'other' && (
                  <div style={{ marginBottom: 24 }}>
                    <label style={labelStyle}>Couleur personnalisée</label>
                    <input
                      type="text"
                      value={customColor}
                      onChange={(e) => setCustomColor(e.target.value)}
                      placeholder="Indiquez la couleur"
                      style={inputStyle}
                    />
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleNext}
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
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                <div style={{ marginBottom: 18 }}>
                  <label style={labelStyle}>Photos (minimum 1, maximum 9) <span style={{ color: '#1d1d1f' }}>*</span></label>
                  <p style={{ fontSize: 12, color: '#86868b', marginBottom: 12 }}>
                    La première photo sera l&apos;image principale. Insérez ou supprimez des photos.
                  </p>

                  {photos.length < maxPhotos && (
                    <div
                      {...getRootProps()}
                      style={{
                        border: '1px dashed #d2d2d7',
                        borderRadius: 12,
                        padding: 24,
                        minHeight: 140,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        cursor: photos.length >= maxPhotos ? 'not-allowed' : 'pointer',
                        backgroundColor: isDragActive ? '#f5f5f7' : 'transparent',
                        borderColor: isDragActive ? '#1d1d1f' : '#d2d2d7',
                        transition: 'background-color 0.2s, border-color 0.2s',
                      }}
                    >
                      <input {...getInputProps()} />
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                        <Upload size={32} style={{ color: '#86868b' }} />
                        <span style={{ fontSize: 14, color: '#6e6e73' }}>
                          {isDragActive ? 'Déposez ici' : 'Glissez-déposez ou cliquez pour insérer une photo'}
                        </span>
                        <span style={{ fontSize: 12, color: '#86868b' }}>
                          Maximum {maxPhotos} photos — {Math.round(MAX_FILE_SIZE_BYTES / 1024 / 1024)} Mo max
                        </span>
                      </div>
                    </div>
                  )}

                  {photos.length > 0 && (
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                        gap: 12,
                        marginTop: photos.length < maxPhotos ? 16 : 0,
                      }}
                    >
                      {photoPreviews.map((url, index) => (
                        <div
                          key={index}
                          style={{
                            position: 'relative',
                            aspectRatio: 1,
                            borderRadius: 12,
                            overflow: 'hidden',
                            border: '1px solid #e8e8e8',
                            backgroundColor: '#fafafa',
                          }}
                          onMouseEnter={() => setHoveredPhotoIndex(index)}
                          onMouseLeave={() => setHoveredPhotoIndex(null)}
                        >
                          <img
                            src={url}
                            alt={`Photo ${index + 1}`}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(index)}
                            style={{
                              position: 'absolute',
                              inset: 0,
                              background: 'rgba(0,0,0,0.6)',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 6,
                              opacity: hoveredPhotoIndex === index ? 1 : 0,
                              transition: 'opacity 0.2s',
                              color: '#fff',
                              fontSize: 11,
                              fontWeight: 500,
                              border: 'none',
                              cursor: 'pointer',
                            }}
                          >
                            <Trash2 size={22} />
                            <span>Supprimer</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                  <button
                    type="button"
                    onClick={handleBack}
                    style={{
                      flex: 1,
                      height: 50,
                      fontSize: 15,
                      fontWeight: 500,
                      border: '1px solid #d2d2d7',
                      borderRadius: 980,
                      cursor: 'pointer',
                      backgroundColor: '#fff',
                      color: '#1d1d1f',
                    }}
                  >
                    Retour
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={photos.length < 1}
                    style={{
                      flex: 1,
                      height: 50,
                      backgroundColor: '#1d1d1f',
                      color: '#fff',
                      fontSize: 15,
                      fontWeight: 500,
                      border: 'none',
                      borderRadius: 980,
                      cursor: photos.length < 1 ? 'not-allowed' : 'pointer',
                      opacity: photos.length < 1 ? 0.6 : 1,
                    }}
                  >
                    Continuer
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                <div style={{ marginBottom: 18 }}>
                  <label style={labelStyle}>Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Décrivez votre produit en précisant : état, caractéristiques, éventuelles imperfections, taille et dimensions."
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
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 18 }}>
                  <div>
                    <label style={labelStyle}>Longueur (cm)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={widthCm}
                      onChange={(e) => setWidthCm(e.target.value)}
                      placeholder="Ex: 35"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Hauteur (cm)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={heightCm}
                      onChange={(e) => setHeightCm(e.target.value)}
                      placeholder="Ex: 25"
                      style={inputStyle}
                    />
                  </div>
                </div>
                <div style={{ marginBottom: 18 }}>
                  <label style={labelStyle}>Année</label>
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    placeholder="Ex: 2020"
                    min={1900}
                    max={new Date().getFullYear() + 1}
                    style={inputStyle}
                  />
                </div>
                <div style={{ marginBottom: 24 }}>
                  <label style={labelStyle}>Contenu inclus <span style={{ color: '#c00', fontWeight: 600 }}>*</span></label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {CONTENU_INCLUS_OPTIONS.map((opt) => (
                      <div key={opt.value} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                        <span style={{ fontSize: 15, color: '#1d1d1f' }}>{opt.label}</span>
                        <div style={{ display: 'flex', gap: 0, border: '1px solid #d2d2d7', borderRadius: 10, overflow: 'hidden' }}>
                          <button
                            type="button"
                            onClick={() => setContenuInclus(opt.value, true)}
                            style={{
                              padding: '10px 20px',
                              fontSize: 14,
                              fontWeight: 500,
                              border: 'none',
                              cursor: 'pointer',
                              backgroundColor: packaging.includes(opt.value) ? '#1d1d1f' : '#fff',
                              color: packaging.includes(opt.value) ? '#fff' : '#6e6e73',
                            }}
                          >
                            Oui
                          </button>
                          <button
                            type="button"
                            onClick={() => setContenuInclus(opt.value, false)}
                            style={{
                              padding: '10px 20px',
                              fontSize: 14,
                              fontWeight: 500,
                              border: 'none',
                              borderLeft: '1px solid #d2d2d7',
                              cursor: 'pointer',
                              backgroundColor: !packaging.includes(opt.value) ? '#1d1d1f' : '#fff',
                              color: !packaging.includes(opt.value) ? '#fff' : '#6e6e73',
                            }}
                          >
                            Non
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    type="button"
                    onClick={handleBack}
                    style={{
                      flex: 1,
                      height: 50,
                      fontSize: 15,
                      fontWeight: 500,
                      border: '1px solid #d2d2d7',
                      borderRadius: 980,
                      cursor: 'pointer',
                      backgroundColor: '#fff',
                      color: '#1d1d1f',
                    }}
                  >
                    Retour
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    style={{
                      flex: 1,
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
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.form
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                onSubmit={handleSubmit}
              >
                <div style={{ marginBottom: 24 }}>
                  <label style={labelStyle}>Prix <span style={{ color: '#1d1d1f' }}>*</span></label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="Ex: 5000"
                      required
                      style={{ ...inputStyle, paddingRight: 44 }}
                    />
                    <span
                      style={{
                        position: 'absolute',
                        right: 14,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        pointerEvents: 'none',
                        color: '#86868b',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <Euro size={17} strokeWidth={2} />
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                  <input
                    type="checkbox"
                    id="isActiveNew"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    style={{ width: 20, height: 20, accentColor: '#1d1d1f' }}
                  />
                  <label htmlFor="isActiveNew" style={{ fontSize: 14, color: '#333' }}>
                    Annonce active (visible dans le catalogue)
                  </label>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    type="button"
                    onClick={handleBack}
                    style={{
                      flex: 1,
                      height: 50,
                      fontSize: 15,
                      fontWeight: 500,
                      border: '1px solid #d2d2d7',
                      borderRadius: 980,
                      cursor: 'pointer',
                      backgroundColor: '#fff',
                      color: '#1d1d1f',
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
                    {loading ? 'Publication...' : "Publier l'annonce"}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
