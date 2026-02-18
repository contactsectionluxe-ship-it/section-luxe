'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Euro, Trash2, Upload } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { PageLoader } from '@/components/ui';
import { createListing, updateListing } from '@/lib/supabase/listings';
import { ensureInvoiceForListing } from '@/lib/supabase/invoices';
import { uploadListingPhotos } from '@/lib/supabase/storage';
import { CATEGORIES } from '@/lib/utils';
import { MAX_FILE_SIZE_BYTES } from '@/lib/file-validation';
import { BRANDS_BY_CATEGORY_AND_GENRE, CLOTHING_SIZES, COLORS, COLORS_BY_CATEGORY, CONDITIONS, getShoeSizesForGenre, MATIERES_BY_CATEGORY, MATERIALS, MODELS_BY_CATEGORY_BRAND_AND_GENRE } from '@/lib/constants';
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

const DRAFT_KEY_NEW = 'luxe-annonce-nouvelle-draft';

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

  // Restaurer le brouillon de description au chargement (nouvelle annonce)
  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem(DRAFT_KEY_NEW) : null;
      if (raw) {
        const o = JSON.parse(raw) as { description?: string };
        if (o?.description != null && typeof o.description === 'string') setDescription(o.description);
      }
    } catch {
      // ignore
    }
  }, []);

  // Étape 1
  const [category, setCategory] = useState<ListingCategory | '' | 'autre'>('');
  const [genre, setGenre] = useState<('homme' | 'femme')[]>([]);
  const [customCategory, setCustomCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [customBrand, setCustomBrand] = useState('');
  const [marqueSearchQuery, setMarqueSearchQuery] = useState('');
  const [model, setModel] = useState('');
  const [customModel, setCustomModel] = useState('');
  const [modeleSearchQuery, setModeleSearchQuery] = useState('');
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [marqueOpen, setMarqueOpen] = useState(false);
  const [modeleOpen, setModeleOpen] = useState(false);
  const [conditionOpen, setConditionOpen] = useState(false);
  const [materialOpen, setMaterialOpen] = useState(false);
  const categoryListRef = useRef<HTMLDivElement>(null);
  const marqueListRef = useRef<HTMLDivElement>(null);
  const modeleListRef = useRef<HTMLDivElement>(null);
  const conditionListRef = useRef<HTMLDivElement>(null);
  const materialListRef = useRef<HTMLDivElement>(null);
  const colorListRef = useRef<HTMLDivElement>(null);
  const sizeListRef = useRef<HTMLDivElement>(null);
  const [condition, setCondition] = useState('');
  const [material, setMaterial] = useState('');
  const [materialSearchQuery, setMaterialSearchQuery] = useState('');
  const [customMaterial, setCustomMaterial] = useState('');
  const [color, setColor] = useState('');
  const [colorSearchQuery, setColorSearchQuery] = useState('');
  const [colorOpen, setColorOpen] = useState(false);
  const [customColor, setCustomColor] = useState('');
  const [size, setSize] = useState('');
  const [sizeSearchQuery, setSizeSearchQuery] = useState('');
  const [sizeOpen, setSizeOpen] = useState(false);

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
  const draftTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [heightCm, setHeightCm] = useState('');
  const [widthCm, setWidthCm] = useState('');
  const [year, setYear] = useState('');
  const [contenuInclus, setContenuInclusState] = useState<Record<string, true | false | null>>({ box: null, certificat: null, facture: null });

  // Sauvegarder la description en brouillon (localStorage) quand elle change
  useEffect(() => {
    if (draftTimeoutRef.current) clearTimeout(draftTimeoutRef.current);
    draftTimeoutRef.current = setTimeout(() => {
      try {
        if (typeof window !== 'undefined') {
          if (description.trim()) {
            localStorage.setItem(DRAFT_KEY_NEW, JSON.stringify({ description }));
          } else {
            localStorage.removeItem(DRAFT_KEY_NEW);
          }
        }
      } catch {
        // ignore
      }
      draftTimeoutRef.current = null;
    }, 400);
    return () => {
      if (draftTimeoutRef.current) clearTimeout(draftTimeoutRef.current);
    };
  }, [description]);

  // Étape 4
  const [price, setPrice] = useState('');
  const [isActive, setIsActive] = useState(true);

  const categoryOptions = CATEGORIES;
  // Marques filtrées par catégorie et genre (Homme / Femme)
  const brandOptions = (() => {
    if (!category || genre.length === 0) return [];
    const byGenre = BRANDS_BY_CATEGORY_AND_GENRE[category];
    if (!byGenre) return [];
    const set = new Set<string>();
    if (genre.includes('femme')) byGenre.femme.forEach((b) => set.add(b));
    if (genre.includes('homme')) byGenre.homme.forEach((b) => set.add(b));
    return [...set].filter((b) => b !== 'Autre').sort((a, b) => a.localeCompare(b, 'fr')).map((b) => ({ value: b, label: b }));
  })();

  // Modèles selon catégorie, marque et genre (Homme / Femme) — marque = sélection ou texte saisi
  const brandForModels = brand || marqueSearchQuery.trim();
  const modelOptions = (() => {
    if (!category || category === 'autre' || !brandForModels || genre.length === 0) return [];
    const byBrand = MODELS_BY_CATEGORY_BRAND_AND_GENRE[category]?.[brandForModels];
    if (!byBrand) return []; // Marque sans modèles prédéfinis → champ libre
    const set = new Set<string>();
    if (genre.includes('femme')) byBrand.femme.forEach((m) => set.add(m));
    if (genre.includes('homme')) byBrand.homme.forEach((m) => set.add(m));
    if (category === 'sacs') {
      set.add('Sac');
      set.add('Pochette');
    }
    return [...set].filter((m) => m !== 'Autre').sort((a, b) => a.localeCompare(b, 'fr'));
  })();

  // Matières selon catégorie (sans "Autre" : saisie libre dans le champ comme marque/modèle)
  const materialOptions = category ? (MATIERES_BY_CATEGORY[category] ?? MATERIALS).filter((o) => o.value !== 'other') : [];

  // Couleurs selon catégorie (sans "Autre" : saisie libre dans le champ)
  const colorOptions = category ? (COLORS_BY_CATEGORY[category] ?? COLORS).filter((o) => o.value !== 'other') : [];

  if (authLoading) return <PageLoader />;
  if (!isApprovedSeller) {
    router.push('/vendeur');
    return null;
  }

  const validateStep1 = () => {
    if (genre.length === 0) {
      setError('Sélectionner au moins un genre (Femme et/ou Homme)');
      return false;
    }
    if (!category) {
      setError('Sélectionner une catégorie');
      return false;
    }
    if (category === 'autre' && !customCategory.trim()) {
      setError('Précisez la catégorie');
      return false;
    }
    const hasBrand = !!(brand || marqueSearchQuery.trim());
    if (!hasBrand) {
      setError('Rechercher ou préciser la marque');
      return false;
    }
if (modelOptions.length > 0) {
      const modelOrTyped = model || modeleSearchQuery.trim();
      if (!modelOrTyped) {
        setError('Sélectionner ou saisir le modèle');
        return false;
      }
    } else if (category && category !== 'autre' && brandForModels) {
      if (!customModel.trim()) {
        setError('Précisez le modèle');
        return false;
      }
    }
    if (!condition) {
      setError('Sélectionner l\'état');
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
      const brandToSave = (brand.trim() || marqueSearchQuery.trim()).trim();
      const modelToSave = modelOptions.length > 0 ? (model || modeleSearchQuery.trim() || null) : (customModel.trim() || null);
      const materialToSave = (material || materialSearchQuery.trim() || null) || null;
      const colorToSave = (color || colorSearchQuery.trim() || null) || null;
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
        genre: genre.length > 0 ? genre : null,
        photos: [],
        brand: brandToSave || null,
        model: modelToSave || null,
        condition: condition || null,
        material: materialToSave,
        color: colorToSave,
        heightCm: heightCm ? parseFloat(heightCm.replace(',', '.')) : null,
        widthCm: widthCm ? parseFloat(widthCm.replace(',', '.')) : null,
        year: year ? parseInt(year, 10) : null,
        packaging: CONTENU_INCLUS_OPTIONS.filter((o) => contenuInclus[o.value] === true).map((o) => o.value).length ? CONTENU_INCLUS_OPTIONS.filter((o) => contenuInclus[o.value] === true).map((o) => o.value) : null,
        size: (category === 'chaussures' || category === 'vetements') ? (size || sizeSearchQuery.trim() || null) : null,
        isActive,
      });

      let photoUrls: string[] = [];
      if (photos.length > 0) {
        photoUrls = await uploadListingPhotos(user!.uid, listingId, photos);
        if (photoUrls.length > 0) {
          await updateListing(listingId, { photos: photoUrls });
        }
      }

      if (isActive) {
        try {
          await ensureInvoiceForListing(listingId);
        } catch (e) {
          console.error('Création facture après dépôt annonce', e);
        }
      }

      try {
        if (typeof window !== 'undefined') localStorage.removeItem(DRAFT_KEY_NEW);
      } catch {
        // ignore
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
    setContenuInclusState((prev) => {
      const current = prev[key];
      if (included) return { ...prev, [key]: current === true ? null : true };
      return { ...prev, [key]: current === false ? null : false };
    });
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
    fontSize: 14,
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
            Créez une nouvelle annonce pour la publier
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

        <style dangerouslySetInnerHTML={{ __html: '.listing-dropdown-list button:hover { background: #e8e8ed !important; }' }} />
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
                <div style={{ marginBottom: 18, position: 'relative' }}>
                  <label style={labelStyle}>Catégorie <span style={{ color: '#1d1d1f' }}>*</span></label>
                  <button
                    type="button"
                    onClick={() => setCategoryOpen((o) => !o)}
                    onBlur={() => setTimeout(() => setCategoryOpen(false), 200)}
                    style={{
                      ...inputStyle,
                      textAlign: 'left',
                      cursor: 'pointer',
                      color: category ? '#1d1d1f' : '#86868b',
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2386868b' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 14px center',
                      paddingRight: 40,
                    }}
                  >
                    {category ? (categoryOptions.find((o) => o.value === category)?.label ?? category) : 'Sélectionner une catégorie'}
                  </button>
                  {categoryOpen && (
                    <div
                      ref={categoryListRef}
                      className="listing-dropdown-list"
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        marginTop: 4,
                        maxHeight: 'calc(228px - 3mm)',
                        overflowY: 'auto',
                        backgroundColor: '#fff',
                        border: '1px solid #d2d2d7',
                        borderRadius: 10,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        zIndex: 10,
                      }}
                    >
                      {categoryOptions.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setCategory(opt.value as ListingCategory | 'autre');
                            if (opt.value !== 'autre') setCustomCategory('');
                            setBrand('');
                            setCustomBrand('');
                            setMarqueSearchQuery('');
                            setModel('');
                            setCustomModel('');
                            setModeleSearchQuery('');
                            setMaterial('');
                            setCustomMaterial('');
                            setMaterialSearchQuery('');
                            setColor('');
                            setColorSearchQuery('');
                            setCustomColor('');
                            setCategoryOpen(false);
                          }}
                          style={{
                            display: 'block',
                            width: '100%',
                            padding: '6px 12px',
                            textAlign: 'left',
                            fontSize: 15,
                            color: '#1d1d1f',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ marginBottom: 18 }}>
                  <label style={labelStyle}>Genre <span style={{ color: '#1d1d1f' }}>*</span></label>
                  <div style={{ display: 'flex', width: '100%', gap: 0, border: '1px solid #d2d2d7', borderRadius: 10, overflow: 'hidden' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setGenre(genre.includes('femme') ? genre.filter((g) => g !== 'femme') : [...genre, 'femme']);
                        setBrand(''); setCustomBrand(''); setMarqueSearchQuery(''); setModel(''); setCustomModel(''); setModeleSearchQuery('');
                      }}
                      style={{
                        flex: 1,
                        padding: '10px 20px',
                        fontSize: 14,
                        fontWeight: 500,
                        border: 'none',
                        cursor: 'pointer',
backgroundColor: genre.includes('femme') ? '#1d1d1f' : '#fff',
                          color: genre.includes('femme') ? '#fff' : '#6e6e73',
                      }}
                    >
                      Femme
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setGenre(genre.includes('homme') ? genre.filter((g) => g !== 'homme') : [...genre, 'homme']);
                        setBrand(''); setCustomBrand(''); setMarqueSearchQuery(''); setModel(''); setCustomModel(''); setModeleSearchQuery('');
                      }}
                      style={{
                        flex: 1,
                        padding: '10px 20px',
                        fontSize: 14,
                        fontWeight: 500,
                        border: 'none',
                        borderLeft: '1px solid #d2d2d7',
                        cursor: 'pointer',
backgroundColor: genre.includes('homme') ? '#1d1d1f' : '#fff',
                          color: genre.includes('homme') ? '#fff' : '#6e6e73',
                      }}
                    >
                      Homme
                    </button>
                  </div>
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
                <div style={{ marginBottom: 18, position: 'relative' }}>
                  <label style={labelStyle}>Marque <span style={{ color: '#1d1d1f' }}>*</span></label>
                  <input
                    type="text"
                    value={marqueSearchQuery}
                    onChange={(e) => {
                      setMarqueSearchQuery(e.target.value);
                      if (brand && e.target.value !== brand) setBrand('');
                      setMarqueOpen(true);
                    }}
                    onFocus={() => { if (category && genre.length > 0) setMarqueOpen(true); }}
                    onBlur={() => setTimeout(() => setMarqueOpen(false), 200)}
                    placeholder={!category || genre.length === 0 ? (genre.length === 0 ? 'Sélectionner d\'abord Femme et/ou Homme' : 'Sélectionner une catégorie') : 'Rechercher ou préciser la marque...'}
                    disabled={!category || genre.length === 0}
                    style={{
                      ...inputStyle,
                      cursor: category && genre.length > 0 ? 'text' : 'not-allowed',
                      opacity: category && genre.length > 0 ? 1 : 0.7,
                    }}
                  />
                  {category && genre.length > 0 && marqueOpen && brandOptions.filter((opt) => !marqueSearchQuery.trim() || opt.label.toLowerCase().includes(marqueSearchQuery.trim().toLowerCase())).length > 0 && (
                    <div
                      ref={marqueListRef}
                      className="listing-dropdown-list"
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        marginTop: 4,
                        maxHeight: 'calc(228px - 5mm)',
                        overflowY: 'auto',
                        backgroundColor: '#fff',
                        border: '1px solid #d2d2d7',
                        borderRadius: 10,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        zIndex: 10,
                      }}
                    >
                      {brandOptions
                        .filter((opt) => !marqueSearchQuery.trim() || opt.label.toLowerCase().includes(marqueSearchQuery.trim().toLowerCase()))
                        .map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              setBrand(opt.value);
                              setMarqueSearchQuery(opt.label);
                              setModel('');
                              setCustomModel('');
                              setModeleSearchQuery('');
                              setMaterial('');
                              setCustomMaterial('');
                              setMaterialSearchQuery('');
                              setMarqueOpen(false);
                            }}
                            style={{
                              display: 'block',
                              width: '100%',
                              padding: '6px 12px',
                              textAlign: 'left',
                              fontSize: 15,
                              color: '#1d1d1f',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                            }}
                          >
                            {opt.label}
                          </button>
                        ))}
                    </div>
                  )}
                  </div>
                <div style={{ marginBottom: 18, position: 'relative' }}>
                  <label style={labelStyle}>Modèle <span style={{ color: '#1d1d1f' }}>*</span></label>
                  {modelOptions.length > 0 ? (
                    <>
                      <input
                        type="text"
                        value={modeleSearchQuery}
                        onChange={(e) => {
                          setModeleSearchQuery(e.target.value);
                          if (model && e.target.value !== model) setModel('');
                          setModeleOpen(true);
                        }}
                        onFocus={() => setModeleOpen(true)}
                        onBlur={() => setTimeout(() => setModeleOpen(false), 200)}
                        placeholder="Rechercher ou préciser le modèle..."
                        style={inputStyle}
                      />
                      {modeleOpen && modelOptions.filter((name) => !modeleSearchQuery.trim() || name.toLowerCase().includes(modeleSearchQuery.trim().toLowerCase())).length > 0 && (
                        <div
                          ref={modeleListRef}
                          className="listing-dropdown-list"
                          style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            marginTop: 4,
                            maxHeight: 'calc(228px - 5mm)',
                            overflowY: 'auto',
                            backgroundColor: '#fff',
                            border: '1px solid #d2d2d7',
                            borderRadius: 10,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            zIndex: 10,
                          }}
                        >
                          {modelOptions
                            .filter((name) => !modeleSearchQuery.trim() || name.toLowerCase().includes(modeleSearchQuery.trim().toLowerCase()))
                            .map((name) => (
                              <button
                                key={name}
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => {
                                  setModel(name);
                                  setModeleSearchQuery(name);
                                  setMaterial('');
                                  setCustomMaterial('');
                                  setMaterialSearchQuery('');
                                  setModeleOpen(false);
                                }}
                                style={{
                                  display: 'block',
                                  width: '100%',
                                  padding: '6px 12px',
                                  textAlign: 'left',
                                  fontSize: 15,
                                  color: '#1d1d1f',
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                }}
                              >
                                {name}
                              </button>
                            ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <input
                      type="text"
                      value={customModel}
                      onChange={(e) => setCustomModel(e.target.value)}
                      placeholder="Précisez le modèle"
                      style={inputStyle}
                    />
                  )}
                </div>
                {(category === 'chaussures' || category === 'vetements') && (
                  <div style={{ marginBottom: 18, position: 'relative' }}>
                    <label style={labelStyle}>{category === 'chaussures' ? 'Pointure' : 'Taille'}</label>
                    <input
                      type="text"
                      value={sizeSearchQuery}
                      onChange={(e) => {
                        setSizeSearchQuery(e.target.value);
                        if (size && e.target.value !== size) setSize('');
                        setSizeOpen(true);
                      }}
                      onFocus={() => setSizeOpen(true)}
                      onBlur={() => setTimeout(() => setSizeOpen(false), 200)}
                      placeholder={category === 'chaussures' ? 'Rechercher ou préciser la pointure…' : 'Rechercher ou préciser la taille…'}
                      style={inputStyle}
                    />
                    {sizeOpen && (() => {
                      const options = category === 'chaussures' ? getShoeSizesForGenre(genre) : [...CLOTHING_SIZES];
                      const filtered = options.filter((o) => !sizeSearchQuery.trim() || o.toLowerCase().includes(sizeSearchQuery.trim().toLowerCase()));
                      if (filtered.length === 0) return null;
                      return (
                        <div
                          ref={sizeListRef}
                          className="listing-dropdown-list"
                          style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            marginTop: 4,
                            maxHeight: 'calc(228px - 5mm)',
                            overflowY: 'auto',
                            backgroundColor: '#fff',
                            border: '1px solid #d2d2d7',
                            borderRadius: 10,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            zIndex: 10,
                          }}
                        >
                          {filtered.map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                setSize(opt);
                                setSizeSearchQuery(opt);
                                setSizeOpen(false);
                              }}
                              style={{
                                display: 'block',
                                width: '100%',
                                padding: '6px 12px',
                                textAlign: 'left',
                                fontSize: 15,
                                color: '#1d1d1f',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                              }}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                )}
                <div style={{ marginBottom: 18, position: 'relative' }}>
                  <label style={labelStyle}>État <span style={{ color: '#1d1d1f' }}>*</span></label>
                  <button
                    type="button"
                    onClick={() => setConditionOpen((o) => !o)}
                    onBlur={() => setTimeout(() => setConditionOpen(false), 200)}
                    style={{
                      ...inputStyle,
                      textAlign: 'left',
                      cursor: 'pointer',
                      color: condition ? '#1d1d1f' : '#86868b',
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2386868b' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 14px center',
                      paddingRight: 40,
                    }}
                  >
                    {condition ? (CONDITIONS.find((o) => o.value === condition)?.label ?? condition) : "Sélectionner l'état"}
                  </button>
                  {conditionOpen && (
                    <div
                      ref={conditionListRef}
                      className="listing-dropdown-list"
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        marginTop: 4,
                        maxHeight: 'calc(228px - 3mm)',
                        overflowY: 'auto',
                        backgroundColor: '#fff',
                        border: '1px solid #d2d2d7',
                        borderRadius: 10,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        zIndex: 10,
                      }}
                    >
                      {CONDITIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setCondition(opt.value);
                            setConditionOpen(false);
                          }}
                          style={{
                            display: 'block',
                            width: '100%',
                            padding: '6px 12px',
                            textAlign: 'left',
                            fontSize: 15,
                            color: '#1d1d1f',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ marginBottom: 18, position: 'relative' }}>
                  <label style={labelStyle}>Matière</label>
                  {category ? (
                    <>
                      <input
                        type="text"
                        value={materialSearchQuery}
                        onChange={(e) => {
                          setMaterialSearchQuery(e.target.value);
                          if (material && e.target.value !== (materialOptions.find((o) => o.value === material)?.label ?? '')) setMaterial('');
                          setMaterialOpen(true);
                        }}
                        onFocus={() => setMaterialOpen(true)}
                        onBlur={() => setTimeout(() => setMaterialOpen(false), 200)}
                        placeholder="Rechercher ou préciser la matière…"
                        style={inputStyle}
                      />
                      {materialOpen && materialOptions.filter((opt) => !materialSearchQuery.trim() || opt.label.toLowerCase().includes(materialSearchQuery.trim().toLowerCase())).length > 0 && (
                        <div
                          ref={materialListRef}
                          className="listing-dropdown-list"
                          style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            marginTop: 4,
                            maxHeight: 'calc(228px - 5mm)',
                            overflowY: 'auto',
                            backgroundColor: '#fff',
                            border: '1px solid #d2d2d7',
                            borderRadius: 10,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            zIndex: 10,
                          }}
                        >
                          {materialOptions
                            .filter((opt) => !materialSearchQuery.trim() || opt.label.toLowerCase().includes(materialSearchQuery.trim().toLowerCase()))
                            .map((opt) => (
                              <button
                                key={opt.value}
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => {
                                  setMaterial(opt.value);
                                  setMaterialSearchQuery(opt.label);
                                  setMaterialOpen(false);
                                }}
                                style={{
                                  display: 'block',
                                  width: '100%',
                                  padding: '6px 12px',
                                  textAlign: 'left',
                                  fontSize: 15,
                                  color: '#1d1d1f',
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                }}
                              >
                                {opt.label}
                              </button>
                            ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <input
                      type="text"
                      readOnly
                      value=""
                      placeholder="Sélectionner d'abord une catégorie"
                      style={{ ...inputStyle, cursor: 'not-allowed', opacity: 0.7 }}
                    />
                  )}
                </div>
                <div style={{ marginBottom: 24, position: 'relative' }}>
                  <label style={labelStyle}>Couleur</label>
                  {category ? (
                    <>
                      <input
                        type="text"
                        value={colorSearchQuery}
                        onChange={(e) => {
                          setColorSearchQuery(e.target.value);
                          if (color && e.target.value !== (colorOptions.find((o) => o.value === color)?.label ?? '')) setColor('');
                          setColorOpen(true);
                        }}
                        onFocus={() => setColorOpen(true)}
                        onBlur={() => setTimeout(() => setColorOpen(false), 200)}
                        placeholder="Rechercher ou préciser la couleur…"
                        style={inputStyle}
                      />
                      {colorOpen && colorOptions.filter((opt) => !colorSearchQuery.trim() || opt.label.toLowerCase().includes(colorSearchQuery.trim().toLowerCase())).length > 0 && (
                        <div
                          ref={colorListRef}
                          className="listing-dropdown-list"
                          style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            marginTop: 4,
                            maxHeight: 'calc(228px - 5mm)',
                            overflowY: 'auto',
                            backgroundColor: '#fff',
                            border: '1px solid #d2d2d7',
                            borderRadius: 10,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            zIndex: 10,
                          }}
                        >
                          {colorOptions
                            .filter((opt) => !colorSearchQuery.trim() || opt.label.toLowerCase().includes(colorSearchQuery.trim().toLowerCase()))
                            .map((opt) => (
                              <button
                                key={opt.value}
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => {
                                  setColor(opt.value);
                                  setColorSearchQuery(opt.label);
                                  setColorOpen(false);
                                }}
                                style={{
                                  display: 'block',
                                  width: '100%',
                                  padding: '6px 12px',
                                  textAlign: 'left',
                                  fontSize: 15,
                                  color: '#1d1d1f',
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                }}
                              >
                                {opt.label}
                              </button>
                            ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <input
                      type="text"
                      readOnly
                      value=""
                      placeholder="Sélectionner d'abord une catégorie"
                      style={{ ...inputStyle, cursor: 'not-allowed', opacity: 0.7 }}
                    />
                  )}
                </div>
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
                    <label style={labelStyle}>Longueur</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={widthCm}
                        onChange={(e) => setWidthCm(e.target.value)}
                        placeholder="Ex: 35"
                        style={{ ...inputStyle, paddingRight: 44 }}
                      />
                      <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#86868b', fontSize: 15, lineHeight: 1 }}>cm</span>
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Hauteur</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={heightCm}
                        onChange={(e) => setHeightCm(e.target.value)}
                        placeholder="Ex: 25"
                        style={{ ...inputStyle, paddingRight: 44 }}
                      />
                      <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#86868b', fontSize: 15, lineHeight: 1 }}>cm</span>
                    </div>
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
                  <label style={labelStyle}>Contenu inclus :</label>
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
                              backgroundColor: contenuInclus[opt.value] === true ? '#1d1d1f' : '#fff',
                              color: contenuInclus[opt.value] === true ? '#fff' : '#6e6e73',
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
                              backgroundColor: contenuInclus[opt.value] === false ? '#1d1d1f' : '#fff',
                              color: contenuInclus[opt.value] === false ? '#fff' : '#6e6e73',
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
