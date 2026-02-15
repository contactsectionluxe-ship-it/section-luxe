'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, Trash2, Upload } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { PageLoader } from '@/components/ui';
import { getListing, updateListing } from '@/lib/supabase/listings';
import { uploadListingPhotos } from '@/lib/supabase/storage';
import { CATEGORIES } from '@/lib/utils';
import { MAX_FILE_SIZE_BYTES } from '@/lib/file-validation';
import { BRANDS_BY_CATEGORY, COLORS, COLORS_BY_CATEGORY, CONDITIONS, MATIERES_BY_CATEGORY, MATERIALS, MODELS_BY_CATEGORY_BRAND } from '@/lib/constants';
import { Listing, ListingCategory } from '@/types';

/** Contenu inclus : chaque clé (box, certificat, facture) présente dans packaging = Oui */
const CONTENU_INCLUS_OPTIONS = [
  { value: 'box', label: 'Boîte' },
  { value: 'certificat', label: 'Certificat' },
  { value: 'facture', label: 'Facture' },
];

const STEP_TITLES = ['Caractéristiques', 'Photos', 'Description & détails', 'Prix'];

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

const selectStyle = (disabled?: boolean): React.CSSProperties => ({
  ...inputStyle,
  paddingRight: 40,
  cursor: disabled ? 'not-allowed' : 'pointer',
  opacity: disabled ? 0.7 : 1,
  appearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2386868b' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 14px center',
});

export default function EditListingPage() {
  const router = useRouter();
  const params = useParams();
  const listingId = params.id as string;
  const { user, seller, isApprovedSeller, loading: authLoading } = useAuth();

  const [listing, setListing] = useState<Listing | null>(null);
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
  const [description, setDescription] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [widthCm, setWidthCm] = useState('');
  const [year, setYear] = useState('');
  const [packaging, setPackaging] = useState<string[]>([]);
  const [contenuInclusTouched, setContenuInclusTouched] = useState<Record<string, boolean>>({ box: false, certificat: false, facture: false });
  const [price, setPrice] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [newPhotos, setNewPhotos] = useState<File[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hoveredExistingIndex, setHoveredExistingIndex] = useState<number | null>(null);
  const [hoveredNewIndex, setHoveredNewIndex] = useState<number | null>(null);
  const [newPhotoPreviews, setNewPhotoPreviews] = useState<string[]>([]);
  const [step, setStep] = useState(1);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  const brandOptions = category && BRANDS_BY_CATEGORY[category] ? BRANDS_BY_CATEGORY[category].map((b) => ({ value: b, label: b })) : [];
  const brandForModels = brand === 'Autre' ? customBrand.trim() : brand;
  const modelOptions = category && brandForModels ? (MODELS_BY_CATEGORY_BRAND[category]?.[brandForModels] ?? []) : [];
  const materialOptions = category ? (MATIERES_BY_CATEGORY[category] ?? MATERIALS) : [];
  const colorOptions = category ? (COLORS_BY_CATEGORY[category] ?? COLORS) : [];

  const totalPhotosCount = existingPhotos.length + newPhotos.length;
  const maxPhotos = 9;
  const maxSize = MAX_FILE_SIZE_BYTES;

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const remaining = maxPhotos - totalPhotosCount;
      const toAdd = acceptedFiles.slice(0, remaining);
      setNewPhotos((prev) => [...prev, ...toAdd]);
    },
    [totalPhotosCount]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'], 'image/webp': ['.webp'] },
    maxFiles: maxPhotos - totalPhotosCount,
    maxSize,
    disabled: totalPhotosCount >= maxPhotos,
  });

  useEffect(() => {
    const urls = newPhotos.map((file) => URL.createObjectURL(file));
    setNewPhotoPreviews(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [newPhotos]);

  const handleRemoveNewPhoto = (index: number) => {
    setNewPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    async function loadListing() {
      try {
        const data = await getListing(listingId);
        if (!data) {
          router.push('/vendeur');
          return;
        }

        // Check ownership
        if (data.sellerId !== user?.uid) {
          router.push('/vendeur');
          return;
        }

        setListing(data);
        setCategory(data.category);
        setCustomCategory('');
        const brandsForCat = data.category && BRANDS_BY_CATEGORY[data.category] ? BRANDS_BY_CATEGORY[data.category] : [];
        if (data.brand && brandsForCat.includes(data.brand)) {
          setBrand(data.brand);
          setCustomBrand('');
        } else if (data.brand) {
          setBrand('Autre');
          setCustomBrand(data.brand);
        } else {
          setBrand('');
          setCustomBrand('');
        }
        const modelsForBrand = data.category && (data.brand || '')
          ? (MODELS_BY_CATEGORY_BRAND[data.category]?.[data.brand || ''] ?? [])
          : [];
        if (data.model && modelsForBrand.includes(data.model)) {
          setModel(data.model);
          setCustomModel('');
        } else if (data.model && modelsForBrand.length > 0) {
          setModel('Autre');
          setCustomModel(data.model);
        } else {
          setModel('');
          setCustomModel(data.model || '');
        }
        setCondition(data.condition || '');
        const matOpts = data.category ? (MATIERES_BY_CATEGORY[data.category] ?? MATERIALS) : [];
        const matValues = matOpts.map((o: { value: string }) => o.value);
        if (data.material && matValues.includes(data.material)) {
          setMaterial(data.material);
          setCustomMaterial('');
        } else if (data.material) {
          setMaterial('other');
          setCustomMaterial(data.material);
        } else {
          setMaterial('');
          setCustomMaterial('');
        }
        const colOpts = data.category ? (COLORS_BY_CATEGORY[data.category] ?? COLORS) : [];
        const colValues = colOpts.map((o: { value: string }) => o.value);
        if (data.color && colValues.includes(data.color)) {
          setColor(data.color);
          setCustomColor('');
        } else if (data.color) {
          setColor('other');
          setCustomColor(data.color);
        } else {
          setColor('');
          setCustomColor('');
        }
        setDescription(data.description || '');
        setHeightCm(data.heightCm != null ? String(data.heightCm) : '');
        setWidthCm(data.widthCm != null ? String(data.widthCm) : '');
        setYear(data.year != null ? String(data.year) : '');
        setPackaging(Array.isArray(data.packaging) ? data.packaging : []);
        setContenuInclusTouched({ box: true, certificat: true, facture: true });
        setPrice(data.price.toString());
        setIsActive(data.isActive);
        setExistingPhotos(data.photos || []);
      } catch (error) {
        console.error('Error loading listing:', error);
        router.push('/vendeur');
      } finally {
        setLoading(false);
      }
    }

    if (user && isApprovedSeller) {
      loadListing();
    } else if (!authLoading && !isApprovedSeller) {
      router.push('/vendeur');
    }
  }, [listingId, user, isApprovedSeller, authLoading, router]);

  if (authLoading || loading) {
    return <PageLoader />;
  }

  if (!listing) {
    return null;
  }

  const handleRemoveExistingPhoto = (index: number) => {
    setExistingPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const setContenuInclus = (key: string, included: boolean) => {
    setContenuInclusTouched((prev) => ({ ...prev, [key]: true }));
    setPackaging((prev) =>
      included ? (prev.includes(key) ? prev : [...prev, key]) : prev.filter((p) => p !== key)
    );
  };

  const validateStep1 = () => {
    if (!category) {
      setError('Sélectionnez une catégorie');
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
    if (modelOptions.length > 0 && !model) {
      setError('Sélectionnez le modèle');
      return false;
    }
    if (!condition) {
      setError("Sélectionnez l'état");
      return false;
    }
    setError('');
    return true;
  };

  const validateStep2 = () => {
    if (existingPhotos.length === 0 && newPhotos.length === 0) {
      setError('Veuillez ajouter au moins une photo');
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
    setError('');

    if (!category) {
      setError('Sélectionnez une catégorie');
      return;
    }
    if (!brand.trim()) {
      setError('Sélectionnez la marque');
      return;
    }
    if (brand === 'Autre' && !customBrand.trim()) {
      setError('Précisez la marque');
      return;
    }
    if (modelOptions.length > 0 && !model) {
      setError('Sélectionnez le modèle');
      return;
    }
    if (!condition) {
      setError("Sélectionnez l'état");
      return;
    }
    if (existingPhotos.length === 0 && newPhotos.length === 0) {
      setError('Veuillez ajouter au moins une photo');
      return;
    }
    const allContenuAnswered = CONTENU_INCLUS_OPTIONS.every((opt) => contenuInclusTouched[opt.value]);
    if (!allContenuAnswered) {
      setError('Veuillez indiquer le contenu inclus pour la boîte, le certificat et la facture (Oui ou Non pour chaque).');
      return;
    }

    const priceNum = parseFloat(price.replace(',', '.'));
    if (isNaN(priceNum) || priceNum <= 0) {
      setError('Veuillez entrer un prix valide');
      return;
    }

    setSaving(true);

    try {
      let allPhotos = [...existingPhotos];
      if (newPhotos.length > 0) {
        const newPhotoUrls = await uploadListingPhotos(user!.uid, listingId, newPhotos, existingPhotos.length);
        allPhotos = [...allPhotos, ...newPhotoUrls];
      }

      const categoryLabel = category === 'autre' ? customCategory.trim() : (CATEGORIES.find((c) => c.value === category)?.label || category);
      const brandToSave = brand === 'Autre' ? customBrand.trim() : brand.trim();
      const modelToSave = modelOptions.length > 0 ? (model === 'Autre' ? customModel.trim() : model) || null : customModel.trim() || null;
      const title = modelToSave ? `${brandToSave} - ${modelToSave}` : `${brandToSave} - ${categoryLabel}`;

      await updateListing(listingId, {
        title,
        description: description.trim() || '',
        price: priceNum,
        category: (category === 'autre' ? customCategory.trim() : category) as ListingCategory,
        photos: allPhotos,
        isActive,
        brand: brandToSave || null,
        model: modelToSave || null,
        condition: condition || null,
        material: material === 'other' ? customMaterial.trim() || null : material || null,
        color: color === 'other' ? customColor.trim() || null : color || null,
        heightCm: heightCm ? parseFloat(heightCm.replace(',', '.')) : null,
        widthCm: widthCm ? parseFloat(widthCm.replace(',', '.')) : null,
        year: year ? parseInt(year, 10) : null,
        packaging: packaging.length ? packaging : null,
      });

      router.push('/vendeur');
    } catch (err: unknown) {
      console.error('Error updating listing:', err);
      setError('Une erreur est survenue lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ paddingTop: 'var(--header-height)', minHeight: '100vh', backgroundColor: '#fbfbfb' }}>
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '0.5cm 24px 80px' }}>
        <Link
          href="/vendeur"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#6e6e73', marginBottom: 20, textDecoration: 'none' }}
          className="hover:opacity-80"
        >
          <ArrowLeft size={18} />
          Retour au tableau de bord
        </Link>

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
            Modifier l&apos;annonce
          </h1>
          <p style={{ fontSize: 15, color: '#6e6e73' }}>
            Modifiez les informations de votre annonce
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{ backgroundColor: '#fff', padding: '32px 28px', borderRadius: 18, boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}
        >
          {error && (
            <div style={{ padding: 14, backgroundColor: '#fef2f2', color: '#dc2626', fontSize: 13, marginBottom: 20 }}>
              {error}
            </div>
          )}

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
                  <div style={{ width: 56, height: 2, backgroundColor: step > s ? '#1d1d1f' : '#d2d2d7', margin: '0 10px', borderRadius: 1 }} />
                )}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
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
                  const v = e.target.value as ListingCategory | 'autre';
                  setCategory(v);
                  if (v !== 'autre') setCustomCategory('');
                  setBrand('');
                  setCustomBrand('');
                  setModel('');
                  setCustomModel('');
                  setMaterial('');
                  setColor('');
                }}
                required
                style={selectStyle()}
              >
                <option value="">Sélectionnez une catégorie</option>
                {CATEGORIES.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            {category === 'autre' && (
              <div style={{ marginBottom: 18 }}>
                <label style={labelStyle}>Catégorie personnalisée <span style={{ color: '#1d1d1f' }}>*</span></label>
                <input type="text" value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} placeholder="Indiquez la catégorie" style={inputStyle} />
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
                }}
                required
                disabled={!category}
                style={selectStyle(!category)}
              >
                <option value="">{category ? 'Sélectionnez la marque' : "Sélectionnez d'abord une catégorie"}</option>
                {brandOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            {brand === 'Autre' && (
              <div style={{ marginBottom: 18 }}>
                <label style={labelStyle}>Marque personnalisée <span style={{ color: '#1d1d1f' }}>*</span></label>
                <input type="text" value={customBrand} onChange={(e) => setCustomBrand(e.target.value)} placeholder="Indiquez la marque" style={inputStyle} />
              </div>
            )}
            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle}>Modèle <span style={{ color: '#1d1d1f' }}>*</span></label>
              {modelOptions.length > 0 ? (
                <>
                  <select
                    value={model}
                    onChange={(e) => { setModel(e.target.value); if (e.target.value !== 'Autre') setCustomModel(''); }}
                    required
                    style={selectStyle()}
                  >
                    <option value="">Sélectionnez le modèle</option>
                    {modelOptions.map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                  {model === 'Autre' && (
                    <input type="text" value={customModel} onChange={(e) => setCustomModel(e.target.value)} placeholder="Indiquez le modèle" style={{ ...inputStyle, marginTop: 10 }} />
                  )}
                </>
              ) : (
                <input type="text" value={customModel} onChange={(e) => setCustomModel(e.target.value)} placeholder="Indiquez le modèle (ex. Birkin 30, Submariner)" style={inputStyle} />
              )}
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle}>État <span style={{ color: '#1d1d1f' }}>*</span></label>
              <select value={condition} onChange={(e) => setCondition(e.target.value)} required style={selectStyle()}>
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
                onChange={(e) => { setMaterial(e.target.value); if (e.target.value !== 'other') setCustomMaterial(''); }}
                disabled={!category}
                style={selectStyle(!category)}
              >
                <option value="">{category ? 'Sélectionnez la matière' : "Sélectionnez d'abord une catégorie"}</option>
                {materialOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            {material === 'other' && (
              <div style={{ marginBottom: 18 }}>
                <label style={labelStyle}>Matière personnalisée</label>
                <input type="text" value={customMaterial} onChange={(e) => setCustomMaterial(e.target.value)} placeholder="Indiquez la matière" style={inputStyle} />
              </div>
            )}
            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle}>Couleur</label>
              <select value={color} onChange={(e) => { setColor(e.target.value); if (e.target.value !== 'other') setCustomColor(''); }} disabled={!category} style={selectStyle(!category)}>
                <option value="">{category ? 'Sélectionnez la couleur' : "Sélectionnez d'abord une catégorie"}</option>
                {colorOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            {color === 'other' && (
              <div style={{ marginBottom: 18 }}>
                <label style={labelStyle}>Couleur personnalisée</label>
                <input type="text" value={customColor} onChange={(e) => setCustomColor(e.target.value)} placeholder="Indiquez la couleur" style={inputStyle} />
              </div>
            )}
                <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                  <button type="button" onClick={handleNext} style={{ width: '100%', height: 50, backgroundColor: '#1d1d1f', color: '#fff', fontSize: 15, fontWeight: 500, border: 'none', borderRadius: 980, cursor: 'pointer' }}>
                    Continuer
                  </button>
                </div>
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
              <label style={labelStyle}>Photos <span style={{ color: '#1d1d1f' }}>*</span></label>
              <p style={{ fontSize: 12, color: '#86868b', marginBottom: 12 }}>
                La première photo sera l&apos;image principale. Insérez ou supprimez des photos.
              </p>

              {totalPhotosCount < maxPhotos && (
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
                    cursor: totalPhotosCount >= maxPhotos ? 'not-allowed' : 'pointer',
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
                      Maximum {maxPhotos} photos — {Math.round(maxSize / 1024 / 1024)} Mo max
                    </span>
                  </div>
                </div>
              )}

              {(existingPhotos.length > 0 || newPhotos.length > 0) && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                    gap: 12,
                    marginTop: totalPhotosCount < maxPhotos ? 16 : 0,
                  }}
                >
                  {existingPhotos.map((photo, index) => (
                    <div
                      key={`existing-${index}`}
                      style={{
                        position: 'relative',
                        aspectRatio: 1,
                        borderRadius: 12,
                        overflow: 'hidden',
                        border: '1px solid #e8e8e8',
                        backgroundColor: '#fafafa',
                      }}
                      onMouseEnter={() => setHoveredExistingIndex(index)}
                      onMouseLeave={() => setHoveredExistingIndex(null)}
                    >
                      <img
                        src={photo}
                        alt={`Photo ${index + 1}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveExistingPhoto(index)}
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'rgba(0,0,0,0.6)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          opacity: hoveredExistingIndex === index ? 1 : 0,
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
                  {newPhotoPreviews.map((url, index) => (
                    <div
                      key={`new-${index}`}
                      style={{
                        position: 'relative',
                        aspectRatio: 1,
                        borderRadius: 12,
                        overflow: 'hidden',
                        border: '1px solid #e8e8e8',
                        backgroundColor: '#fafafa',
                      }}
                      onMouseEnter={() => setHoveredNewIndex(index)}
                      onMouseLeave={() => setHoveredNewIndex(null)}
                    >
                      <img
                        src={url}
                        alt={`Nouvelle photo ${index + 1}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveNewPhoto(index)}
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'rgba(0,0,0,0.6)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          opacity: hoveredNewIndex === index ? 1 : 0,
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
                  <button type="button" onClick={handleBack} style={{ flex: 1, height: 50, fontSize: 15, fontWeight: 500, border: '1px solid #d2d2d7', borderRadius: 980, cursor: 'pointer', backgroundColor: '#fff', color: '#1d1d1f' }}>
                    Retour
                  </button>
                  <button type="button" onClick={handleNext} style={{ flex: 1, height: 50, backgroundColor: '#1d1d1f', color: '#fff', fontSize: 15, fontWeight: 500, border: 'none', borderRadius: 980, cursor: 'pointer' }}>
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
                placeholder="Décrivez votre produit..."
                rows={4}
                style={{
                  width: '100%',
                  padding: 14,
                  fontSize: 15,
                  lineHeight: 1.5,
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
                <input type="text" inputMode="decimal" value={widthCm} onChange={(e) => setWidthCm(e.target.value)} placeholder="Ex: 35" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Hauteur (cm)</label>
                <input type="text" inputMode="decimal" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} placeholder="Ex: 25" style={inputStyle} />
              </div>
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle}>Année</label>
              <input type="number" value={year} onChange={(e) => setYear(e.target.value)} placeholder="Ex: 2020" min={1900} max={new Date().getFullYear() + 1} style={inputStyle} />
            </div>
            <div style={{ marginBottom: 18 }}>
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
                <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                  <button type="button" onClick={handleBack} style={{ flex: 1, height: 50, fontSize: 15, fontWeight: 500, border: '1px solid #d2d2d7', borderRadius: 980, cursor: 'pointer', backgroundColor: '#fff', color: '#1d1d1f' }}>
                    Retour
                  </button>
                  <button type="button" onClick={handleNext} style={{ flex: 1, height: 50, backgroundColor: '#1d1d1f', color: '#fff', fontSize: 15, fontWeight: 500, border: 'none', borderRadius: 980, cursor: 'pointer' }}>
                    Continuer
                  </button>
                </div>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                >
            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle}>Prix (€) <span style={{ color: '#1d1d1f' }}>*</span></label>
              <input type="text" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Ex: 5000" style={inputStyle} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <input type="checkbox" id="isActive" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} style={{ width: 20, height: 20, accentColor: '#1d1d1f' }} />
              <label htmlFor="isActive" style={{ fontSize: 14, color: '#333' }}>Annonce active (visible dans le catalogue)</label>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="button" onClick={handleBack} style={{ flex: 1, height: 50, fontSize: 15, fontWeight: 500, border: '1px solid #d2d2d7', borderRadius: 980, cursor: 'pointer', backgroundColor: '#fff', color: '#1d1d1f' }}>
                Retour
              </button>
              <button type="submit" disabled={saving} style={{ flex: 1, height: 50, backgroundColor: '#1d1d1f', color: '#fff', fontSize: 15, fontWeight: 500, border: 'none', borderRadius: 980, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
              </button>
            </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
