'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, Info, Trash2, Upload } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { PageLoader, CguCgvCheckbox } from '@/components/ui';
import { getListing, updateListing } from '@/lib/supabase/listings';
import { ensureInvoiceForListing } from '@/lib/supabase/invoices';
import { uploadListingPhotos } from '@/lib/supabase/storage';
import { CATEGORIES } from '@/lib/utils';
import { MAX_FILE_SIZE_BYTES } from '@/lib/file-validation';
import { BRANDS_BY_CATEGORY, BRANDS_BY_CATEGORY_AND_GENRE, CHAUSSURES_MODELES_FEMME_ONLY, CHAUSSURES_MODELES_HOMME_ONLY, CLOTHING_SIZES, COLORS, COLORS_BY_CATEGORY, CONDITIONS, getAccessoiresTypesForGenre, getArticleTypeLabelsForCategory, getBijouxTypesForGenre, getChaussuresTypesForGenre, getJeanSizesForGenre, modelMatchesArticleType, getPantSizesForGenre, getSacsTypesForGenre, getShoeSizesForGenre, getVetementsTypesForGenre, MATIERES_BY_CATEGORY, MATERIALS, MODELE_EXCLU_QUAND_IDENTIQUE_CATEGORIE, MODELE_VETEMENTS_GENERIQUES_EXCLUS, MODELS_BY_CATEGORY_BRAND, MODELS_BY_CATEGORY_BRAND_AND_GENRE, MONTRES_MODELES_FEMME_ONLY, MONTRES_MODELES_HOMME_ONLY, SACS_MODELES_FEMME_ONLY, SACS_MODELES_HOMME_ONLY, BIJOUX_MODELES_FEMME_ONLY, BIJOUX_MODELES_HOMME_ONLY, VETEMENTS_MODELES_FEMME_ONLY, VETEMENTS_MODELES_HOMME_ONLY, VETEMENTS_MODELES_TOUJOURS_PROPOSES, VETEMENTS_MARQUES_UNIQUEMENT_MODELES_MARQUE } from '@/lib/constants';
import { Listing, ListingCategory } from '@/types';

/** Contenu inclus : chaque clé (box, certificat, facture) présente dans packaging = Oui */
const CONTENU_INCLUS_OPTIONS = [
  { value: 'box', label: 'Boîte' },
  { value: 'certificat', label: 'Certificat' },
  { value: 'facture', label: 'Facture' },
];

const ETAT_DEFINITIONS: { title: string; text: string }[] = [
  { title: 'Neuf', text: 'Article jamais porté en parfait état. Aucun signe d\'utilisation.' },
  { title: 'Très bon état', text: 'Article peu porté et soigneusement conservé. Peut présenter de très légers signes d\'usage à peine perceptibles.' },
  { title: 'Bon état', text: 'Article porté et bien entretenu. Peut présenter des traces d\'usage visibles liées à une utilisation normale.' },
  { title: 'État correct', text: 'Article régulièrement porté. Présente des signes d\'usure visibles liés à l\'usage, sans défaut majeur ni détérioration importante.' },
];

const STEP_TITLES = ['Caractéristiques', 'Photos', 'Description & détails', 'Prix'];

const DRAFT_KEY_EDIT_PREFIX = 'luxe-annonce-edit-draft-';

type EditListingDraft = {
  step?: number;
  category?: string;
  genre?: ('homme' | 'femme')[];
  articleType?: string;
  customCategory?: string;
  brand?: string;
  customBrand?: string;
  marqueSearchQuery?: string;
  model?: string;
  customModel?: string;
  modeleSearchQuery?: string;
  condition?: string;
  material?: string;
  materialSearchQuery?: string;
  customMaterial?: string;
  color?: string;
  colorSearchQuery?: string;
  customColor?: string;
  size?: string;
  sizeSearchQuery?: string;
  description?: string;
  heightCm?: string;
  widthCm?: string;
  year?: string;
  contenuInclus?: Record<string, true | false | null>;
  price?: string;
  isActive?: boolean;
  acceptCguCgv?: boolean;
  existingPhotos?: string[];
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
  const [genre, setGenre] = useState<('homme' | 'femme')[]>([]);
  const [articleType, setArticleType] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [customBrand, setCustomBrand] = useState('');
  const [marqueSearchQuery, setMarqueSearchQuery] = useState('');
  const [model, setModel] = useState('');
  const [customModel, setCustomModel] = useState('');
  const [modeleSearchQuery, setModeleSearchQuery] = useState('');
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [typeOpen, setTypeOpen] = useState(false);
  const [marqueOpen, setMarqueOpen] = useState(false);
  const [modeleOpen, setModeleOpen] = useState(false);
  const [conditionOpen, setConditionOpen] = useState(false);
  const [etatInfoClicked, setEtatInfoClicked] = useState(false);
  const [etatInfoHover, setEtatInfoHover] = useState(false);
  const categoryListRef = useRef<HTMLDivElement>(null);
  const typeListRef = useRef<HTMLDivElement>(null);
  const marqueListRef = useRef<HTMLDivElement>(null);
  const modeleListRef = useRef<HTMLDivElement>(null);
  const conditionListRef = useRef<HTMLDivElement>(null);
  const etatInfoRef = useRef<HTMLDivElement>(null);
  const materialListRef = useRef<HTMLDivElement>(null);
  const colorListRef = useRef<HTMLDivElement>(null);
  const sizeListRef = useRef<HTMLDivElement>(null);
  const [condition, setCondition] = useState('');
  const [material, setMaterial] = useState('');
  const [materialSearchQuery, setMaterialSearchQuery] = useState('');
  const [materialOpen, setMaterialOpen] = useState(false);
  const [customMaterial, setCustomMaterial] = useState('');
  const [color, setColor] = useState('');
  const [colorSearchQuery, setColorSearchQuery] = useState('');
  const [colorOpen, setColorOpen] = useState(false);
  const [customColor, setCustomColor] = useState('');
  const [size, setSize] = useState('');
  const [sizeSearchQuery, setSizeSearchQuery] = useState('');
  const [sizeOpen, setSizeOpen] = useState(false);
  const [description, setDescription] = useState('');
  const draftTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [heightCm, setHeightCm] = useState('');
  const [widthCm, setWidthCm] = useState('');
  const [year, setYear] = useState('');
  const [contenuInclus, setContenuInclusState] = useState<Record<string, true | false | null>>({ box: null, certificat: null, facture: null });
  const [price, setPrice] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [newPhotos, setNewPhotos] = useState<File[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [acceptCguCgv, setAcceptCguCgv] = useState(false);
  const [cguCgvError, setCguCgvError] = useState('');
  const [hoveredExistingIndex, setHoveredExistingIndex] = useState<number | null>(null);
  const [hoveredNewIndex, setHoveredNewIndex] = useState<number | null>(null);
  const [newPhotoPreviews, setNewPhotoPreviews] = useState<string[]>([]);
  const [step, setStep] = useState(1);

  // Refs pour avoir toujours la dernière valeur des photos à l'enregistrement (évite état périmé)
  const existingPhotosRef = useRef<string[]>([]);
  const newPhotosRef = useRef<File[]>([]);
  existingPhotosRef.current = existingPhotos;
  newPhotosRef.current = newPhotos;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  const brandOptions = (() => {
    if (!category || genre.length === 0) return [];
    const byGenre = BRANDS_BY_CATEGORY_AND_GENRE[category];
    if (!byGenre) return [];
    const set = new Set<string>();
    if (genre.includes('femme')) byGenre.femme.forEach((b) => set.add(b));
    if (genre.includes('homme')) byGenre.homme.forEach((b) => set.add(b));
    const list = [...set].filter((b) => b !== 'Autre').sort((a, b) => a.localeCompare(b, 'fr'));
    if (brand && !list.includes(brand)) list.unshift(brand);
    return list.map((b) => ({ value: b, label: b }));
  })();
  const brandForModels = brand || marqueSearchQuery.trim();
  const hasTypeCategory = category === 'vetements' || category === 'sacs' || category === 'bijoux' || category === 'chaussures' || category === 'accessoires';
  const modelOptions = (() => {
    if (!category || category === 'autre' || genre.length === 0) return [];
    if (hasTypeCategory && (!articleType || !brandForModels)) return [];
    const set = new Set<string>();
    if (category === 'vetements' && !VETEMENTS_MARQUES_UNIQUEMENT_MODELES_MARQUE.has(brandForModels || '')) {
      VETEMENTS_MODELES_TOUJOURS_PROPOSES.forEach(({ name, genre: modelGenre }) => {
        if (modelGenre === 'both') set.add(name);
        else if (modelGenre === 'femme' && genre.includes('femme')) set.add(name);
        else if (modelGenre === 'homme' && genre.includes('homme')) set.add(name);
      });
    }
    if (brandForModels) {
      const byBrand = MODELS_BY_CATEGORY_BRAND_AND_GENRE[category]?.[brandForModels];
      if (byBrand) {
        const allowModel = (m: string) => {
          if (genre.includes('femme') && genre.includes('homme')) return true;
          const onlyFemme = genre.includes('femme') && !genre.includes('homme');
          const onlyHomme = genre.includes('homme') && !genre.includes('femme');
          if (category === 'vetements') {
            if (onlyHomme && VETEMENTS_MODELES_FEMME_ONLY.includes(m)) return false;
            if (onlyFemme && VETEMENTS_MODELES_HOMME_ONLY.includes(m)) return false;
            return true;
          }
          if (category === 'chaussures') {
            if (onlyHomme && CHAUSSURES_MODELES_FEMME_ONLY.includes(m)) return false;
            if (onlyFemme && CHAUSSURES_MODELES_HOMME_ONLY.includes(m)) return false;
            return true;
          }
          if (category === 'sacs') {
            if (onlyHomme && SACS_MODELES_FEMME_ONLY.includes(m)) return false;
            if (onlyFemme && SACS_MODELES_HOMME_ONLY.includes(m)) return false;
            return true;
          }
          if (category === 'bijoux') {
            if (onlyHomme && BIJOUX_MODELES_FEMME_ONLY.includes(m)) return false;
            if (onlyFemme && BIJOUX_MODELES_HOMME_ONLY.includes(m)) return false;
            return true;
          }
          if (category === 'montres') {
            if (onlyHomme && MONTRES_MODELES_FEMME_ONLY.includes(m)) return false;
            if (onlyFemme && MONTRES_MODELES_HOMME_ONLY.includes(m)) return false;
            return true;
          }
          return true;
        };
        if (genre.includes('femme')) byBrand.femme.filter(allowModel).forEach((m) => set.add(m));
        if (genre.includes('homme')) byBrand.homme.filter(allowModel).forEach((m) => set.add(m));
      }
    }
    if (category === 'sacs') {
      set.add('Pochette');
    }
    const excludedAsCategory = category ? (MODELE_EXCLU_QUAND_IDENTIQUE_CATEGORIE[category] ?? []) : [];
    const articleTypeLabels = hasTypeCategory ? getArticleTypeLabelsForCategory(category, genre) : [];
    const raw = [...set]
      .filter((m) => m !== 'Autre' && !excludedAsCategory.includes(m))
      .filter((m) => (category !== 'vetements' || !MODELE_VETEMENTS_GENERIQUES_EXCLUS.has(m)))
      .filter((m) => modelMatchesArticleType(m, articleType, category, brandForModels))
      .filter((m) => !articleTypeLabels.includes(m))
      .sort((a, b) => a.localeCompare(b, 'fr'));
    if (model && !raw.includes(model)) return [model, ...raw];
    return raw;
  })();
  const materialOptions = category ? (MATIERES_BY_CATEGORY[category] ?? MATERIALS).filter((o) => o.value !== 'other') : [];
  const colorOptions = category ? (COLORS_BY_CATEGORY[category] ?? COLORS).filter((o) => o.value !== 'other') : [];

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
        setGenre(Array.isArray(data.genre) && data.genre.length > 0 ? data.genre : []);
        setArticleType(data.articleType || '');
        setCustomCategory('');
        const brandsForCat = data.category && BRANDS_BY_CATEGORY[data.category] ? BRANDS_BY_CATEGORY[data.category] : [];
        if (data.brand && brandsForCat.includes(data.brand)) {
          setBrand(data.brand);
          setMarqueSearchQuery(data.brand);
          setCustomBrand('');
        } else if (data.brand) {
          setBrand('');
          setMarqueSearchQuery(data.brand);
          setCustomBrand('');
        } else {
          setBrand('');
          setMarqueSearchQuery('');
          setCustomBrand('');
        }
        const modelsForBrand = data.category && (data.brand || '')
          ? (MODELS_BY_CATEGORY_BRAND[data.category]?.[data.brand || ''] ?? [])
          : [];
        if (data.model && modelsForBrand.includes(data.model)) {
          setModel(data.model);
          setModeleSearchQuery(data.model);
          setCustomModel('');
        } else if (data.model && modelsForBrand.length > 0) {
          setModel(data.model);
          setModeleSearchQuery(data.model);
          setCustomModel('');
        } else {
          setModel('');
          setModeleSearchQuery('');
          setCustomModel(data.model || '');
        }
        setCondition(data.condition || '');
        setSize(data.size || '');
        setSizeSearchQuery(data.size || '');
        const matOpts = data.category ? (MATIERES_BY_CATEGORY[data.category] ?? MATERIALS) : [];
        const matValues = matOpts.map((o: { value: string }) => o.value);
        if (data.material && matValues.includes(data.material)) {
          setMaterial(data.material);
          setMaterialSearchQuery(matOpts.find((o: { value: string; label: string }) => o.value === data.material)?.label ?? data.material);
          setCustomMaterial('');
        } else if (data.material) {
          setMaterial('');
          setMaterialSearchQuery(data.material);
          setCustomMaterial('');
        } else {
          setMaterial('');
          setMaterialSearchQuery('');
          setCustomMaterial('');
        }
        const colOpts = data.category ? (COLORS_BY_CATEGORY[data.category] ?? COLORS) : [];
        const colValues = colOpts.map((o: { value: string }) => o.value);
        if (data.color && colValues.includes(data.color)) {
          setColor(data.color);
          setColorSearchQuery(colOpts.find((o: { value: string; label: string }) => o.value === data.color)?.label ?? data.color);
          setCustomColor('');
        } else if (data.color) {
          setColor('');
          setColorSearchQuery(data.color);
          setCustomColor('');
        } else {
          setColor('');
          setColorSearchQuery('');
          setCustomColor('');
        }
        setDescription(data.description || '');
        setHeightCm(data.heightCm != null ? String(data.heightCm) : '');
        setWidthCm(
          data.widthCm != null ? String(data.widthCm)
          : (data.category === 'montres' && data.size) ? String(parseInt(String(data.size), 10) / 10)
          : ''
        );
        setYear(data.year != null ? String(data.year) : '');
        const pkg = Array.isArray(data.packaging) ? data.packaging : [];
        setContenuInclusState({
          box: pkg.includes('box') ? true : null,
          certificat: pkg.includes('certificat') ? true : null,
          facture: pkg.includes('facture') ? true : null,
        });
        setPrice(data.price.toString());
        setIsActive(data.isActive);
        setExistingPhotos(data.photos || []);
        // Restaurer le brouillon sessionStorage si présent (après changement d'onglet/retour)
        try {
          if (typeof window !== 'undefined') {
            const raw = sessionStorage.getItem(`${DRAFT_KEY_EDIT_PREFIX}${listingId}`);
            if (raw) {
              const d = JSON.parse(raw) as EditListingDraft;
              if (d.step != null && d.step >= 1 && d.step <= 4) setStep(d.step);
              if (d.category != null) setCategory(d.category as ListingCategory | '' | 'autre');
              if (Array.isArray(d.genre)) setGenre(d.genre);
              if (d.articleType != null) setArticleType(d.articleType);
              if (d.customCategory != null) setCustomCategory(d.customCategory);
              if (d.brand != null) setBrand(d.brand);
              if (d.customBrand != null) setCustomBrand(d.customBrand);
              if (d.marqueSearchQuery != null) setMarqueSearchQuery(d.marqueSearchQuery);
              if (d.model != null) setModel(d.model);
              if (d.customModel != null) setCustomModel(d.customModel);
              if (d.modeleSearchQuery != null) setModeleSearchQuery(d.modeleSearchQuery);
              if (d.condition != null) setCondition(d.condition);
              if (d.material != null) setMaterial(d.material);
              if (d.materialSearchQuery != null) setMaterialSearchQuery(d.materialSearchQuery);
              if (d.customMaterial != null) setCustomMaterial(d.customMaterial);
              if (d.color != null) setColor(d.color);
              if (d.colorSearchQuery != null) setColorSearchQuery(d.colorSearchQuery);
              if (d.customColor != null) setCustomColor(d.customColor);
              if (d.size != null) setSize(d.size);
              if (d.sizeSearchQuery != null) setSizeSearchQuery(d.sizeSearchQuery);
              if (d.description != null) setDescription(d.description);
              if (d.heightCm != null) setHeightCm(d.heightCm);
              if (d.widthCm != null) setWidthCm(d.widthCm);
              if (d.year != null) setYear(d.year);
              if (d.contenuInclus != null && typeof d.contenuInclus === 'object') setContenuInclusState(d.contenuInclus);
              if (d.price != null) setPrice(d.price);
              if (d.isActive != null) setIsActive(d.isActive);
              if (d.acceptCguCgv != null) setAcceptCguCgv(d.acceptCguCgv);
              if (Array.isArray(d.existingPhotos)) setExistingPhotos(d.existingPhotos);
            }
          }
        } catch {
          // ignore
        }
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

  // Sauvegarder le brouillon complet (sessionStorage) à chaque modification + quand on quitte l'onglet
  const draftPayloadRef = useRef<EditListingDraft>({});
  draftPayloadRef.current = {
    step, category, genre, articleType, customCategory, brand, customBrand, marqueSearchQuery,
    model, customModel, modeleSearchQuery, condition, material, materialSearchQuery, customMaterial,
    color, colorSearchQuery, customColor, size, sizeSearchQuery, description, heightCm, widthCm, year,
    contenuInclus, price, isActive, acceptCguCgv, existingPhotos,
  };
  useEffect(() => {
    if (!listingId || !listing) return;
    if (draftTimeoutRef.current) clearTimeout(draftTimeoutRef.current);
    const save = () => {
      try {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(`${DRAFT_KEY_EDIT_PREFIX}${listingId}`, JSON.stringify(draftPayloadRef.current));
        }
      } catch {
        // ignore
      }
    };
    draftTimeoutRef.current = setTimeout(save, 800);
    return () => {
      if (draftTimeoutRef.current) clearTimeout(draftTimeoutRef.current);
    };
  }, [
    listingId,
    listing,
    step, category, genre?.join(','), articleType, customCategory, brand, customBrand, marqueSearchQuery,
    model, customModel, modeleSearchQuery, condition, material, materialSearchQuery, customMaterial,
    color, colorSearchQuery, customColor, size, sizeSearchQuery, description, heightCm, widthCm, year,
    JSON.stringify(contenuInclus), price, isActive, acceptCguCgv, existingPhotos.length, existingPhotos.join(','),
  ]);
  useEffect(() => {
    if (!listingId || !listing) return;
    const onHide = () => {
      try {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(`${DRAFT_KEY_EDIT_PREFIX}${listingId}`, JSON.stringify(draftPayloadRef.current));
        }
      } catch {
        // ignore
      }
    };
    document.addEventListener('visibilitychange', onHide);
    return () => document.removeEventListener('visibilitychange', onHide);
  }, [listingId, listing]);

  // À la sortie du formulaire (navigation, fermeture) : ne pas garder le brouillon pour la prochaine visite
  useEffect(() => {
    if (!listingId) return;
    const key = `${DRAFT_KEY_EDIT_PREFIX}${listingId}`;
    return () => {
      try {
        if (typeof window !== 'undefined') sessionStorage.removeItem(key);
      } catch {
        // ignore
      }
    };
  }, [listingId]);

  // Fermer le tooltip État au clic en dehors
  useEffect(() => {
    if (!etatInfoClicked && !etatInfoHover) return;
    const handleClickOutside = (e: MouseEvent) => {
      const el = etatInfoRef.current;
      if (el && !el.contains(e.target as Node)) {
        setEtatInfoClicked(false);
        setEtatInfoHover(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [etatInfoClicked, etatInfoHover]);

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
    setContenuInclusState((prev) => {
      const current = prev[key];
      if (included) return { ...prev, [key]: current === true ? null : true };
      return { ...prev, [key]: current === false ? null : false };
    });
  };

  const validateStep1 = () => {
    if (genre.length === 0) {
      setError('Sélectionner au moins un genre (Femme et/ou Homme)');
      return false;
    }
    if (!category) {
      setError('Sélectionner une catégorie');
      return false;
    }
    if (hasTypeCategory && !articleType) {
      setError('Sélectionner un type de produit');
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
    } else if (brandForModels && !customModel.trim()) {
      setError('Précisez le modèle');
      return false;
    }
    if (!condition) {
      setError("Sélectionner l'état");
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
    setCguCgvError('');
    if (!acceptCguCgv) {
      setCguCgvError('Veuillez accepter les CGU et les CGV pour enregistrer les modifications.');
      return;
    }
    if (genre.length === 0) {
      setError('Sélectionner au moins un genre (Femme et/ou Homme)');
      return;
    }
    if (!category) {
      setError('Sélectionner une catégorie');
      return;
    }
    const hasBrand = !!(brand || marqueSearchQuery.trim());
    if (!hasBrand) {
      setError('Rechercher ou préciser la marque');
      return;
    }
    if (modelOptions.length > 0) {
      const modelOrTyped = model || modeleSearchQuery.trim();
      if (!modelOrTyped) {
        setError('Sélectionner ou saisir le modèle');
        return;
      }
    } else if (brandForModels && !customModel.trim()) {
      setError('Précisez le modèle');
      return;
    }
    if (!condition) {
      setError("Sélectionner l'état");
      return;
    }
    const currentExisting = existingPhotosRef.current;
    const currentNew = newPhotosRef.current;
    if (currentExisting.length === 0 && currentNew.length === 0) {
      setError('Veuillez ajouter au moins une photo');
      return;
    }
    const priceNum = parseFloat(price.replace(',', '.'));
    if (isNaN(priceNum) || priceNum <= 0) {
      setError('Veuillez entrer un prix valide');
      return;
    }

    setSaving(true);

    try {
      let allPhotos = [...currentExisting];
      if (currentNew.length > 0) {
        const newPhotoUrls = await uploadListingPhotos(user!.uid, listingId, currentNew, currentExisting.length);
        allPhotos = [...allPhotos, ...newPhotoUrls];
      }

      const categoryLabel = category === 'autre' ? customCategory.trim() : (CATEGORIES.find((c) => c.value === category)?.label || category);
      const brandToSave = (brand.trim() || marqueSearchQuery.trim()).trim();
      const modelToSave = modelOptions.length > 0 ? (model || modeleSearchQuery.trim() || null) : (customModel.trim() || null);
      const materialToSave = (material || materialSearchQuery.trim() || null) || null;
      const colorToSave = (color || colorSearchQuery.trim() || null) || null;
      const title = modelToSave ? `${brandToSave} - ${modelToSave}` : `${brandToSave} - ${categoryLabel}`;

      await updateListing(listingId, {
        title,
        description: description.trim() || '',
        price: priceNum,
        category: (category === 'autre' ? customCategory.trim() : category) as ListingCategory,
        genre: genre.length > 0 ? genre : null,
        photos: allPhotos,
        isActive,
        brand: brandToSave || null,
        model: modelToSave || null,
        condition: condition || null,
        material: materialToSave,
        color: colorToSave,
        heightCm: (category === 'chaussures' || category === 'vetements') ? null : (heightCm ? parseFloat(heightCm.replace(',', '.')) : null),
        widthCm: (category === 'chaussures' || category === 'vetements') ? null : (widthCm ? parseFloat(widthCm.replace(',', '.')) : null),
        year: year ? parseInt(year, 10) : null,
        packaging: CONTENU_INCLUS_OPTIONS.filter((o) => contenuInclus[o.value] === true).map((o) => o.value).length ? CONTENU_INCLUS_OPTIONS.filter((o) => contenuInclus[o.value] === true).map((o) => o.value) : null,
        size: category === 'montres' ? (widthCm ? String(Math.round(parseFloat(String(widthCm).replace(',', '.')) * 10)) : null) : (category === 'chaussures' || category === 'vetements') ? (size || sizeSearchQuery.trim() || null) : null,
        articleType: hasTypeCategory && articleType ? articleType : null,
      });

      setError('');
      if (isActive) {
        try {
          await ensureInvoiceForListing(listingId);
        } catch (e) {
          console.error('Création facture après activation annonce', e);
        }
      }

      try {
        if (typeof window !== 'undefined') {
          localStorage.removeItem(`luxe-annonce-draft-${listingId}`);
          sessionStorage.removeItem(`${DRAFT_KEY_EDIT_PREFIX}${listingId}`);
        }
      } catch {
        // ignore
      }
      try {
        await fetch('/api/cgu-cgv-acceptance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user!.uid, context: 'modification_annonce' }),
        });
      } catch (e) {
        console.error('Enregistrement acceptation CGU/CGV', e);
      }
      router.push('/vendeur');
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : typeof (err as { message?: string })?.message === 'string'
            ? (err as { message: string }).message
            : err != null && typeof err === 'object' && 'message' in err && typeof (err as { message: unknown }).message === 'string'
              ? (err as { message: string }).message
              : 'Une erreur est survenue lors de la mise à jour';
      console.error('Error updating listing:', err);
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ paddingTop: 'var(--header-height)', minHeight: '100vh', backgroundColor: '#fbfbfb' }}>
      {/* Ligne titre : Retour à gauche (même position que Ma messagerie), Modifier l'annonce au centre */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '0.5cm 24px 0', marginBottom: 28, maxWidth: 1200, marginLeft: 'auto', marginRight: 'auto' }}>
        <Link
          href="/vendeur"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#6e6e73', textDecoration: 'none', flexShrink: 0 }}
          className="hover:opacity-80"
        >
          <ArrowLeft size={18} />
          Retour à mes annonces
        </Link>
        <div style={{ flex: 1, textAlign: 'center', minWidth: 0, padding: '0 16px' }}>
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
        <div style={{ width: 220, flexShrink: 0 }} aria-hidden />
      </div>

      <div style={{ maxWidth: 520, margin: '0 auto', padding: '0 24px 80px' }}>

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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{ backgroundColor: '#fff', padding: '32px 28px', borderRadius: 18, boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}
        >
          <style dangerouslySetInnerHTML={{ __html: '.listing-dropdown-list button:hover { background: #e8e8ed !important; }' }} />
          {error && (
            <div style={{ padding: 14, backgroundColor: '#fef2f2', color: '#dc2626', fontSize: 13, marginBottom: 20 }}>
              {error}
            </div>
          )}

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
              <label style={labelStyle}>Genre <span style={{ color: '#1d1d1f' }}>*</span></label>
              <div style={{ display: 'flex', width: '100%', gap: 0, border: '1px solid #d2d2d7', borderRadius: 10, overflow: 'hidden' }}>
                <button
                  type="button"
                  onClick={() => {
                    const nextGenre: ('homme' | 'femme')[] = genre.includes('femme') ? genre.filter((g) => g !== 'femme') : [...genre, 'femme'];
                    setGenre(nextGenre);
                    if (nextGenre.length === 0) {
                      setCategory('');
                      setArticleType('');
                      setCategoryOpen(false);
                    } else if (category === 'vetements' || category === 'sacs' || category === 'bijoux' || category === 'chaussures' || category === 'accessoires') setArticleType('');
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
                    const nextGenre: ('homme' | 'femme')[] = genre.includes('homme') ? genre.filter((g) => g !== 'homme') : [...genre, 'homme'];
                    setGenre(nextGenre);
                    if (nextGenre.length === 0) {
                      setCategory('');
                      setArticleType('');
                      setCategoryOpen(false);
                    } else if (category === 'vetements' || category === 'sacs' || category === 'bijoux' || category === 'chaussures' || category === 'accessoires') setArticleType('');
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
            <div style={{ marginBottom: 18, position: 'relative' }}>
              <label style={labelStyle}>Catégorie <span style={{ color: '#1d1d1f' }}>*</span></label>
              <button
                type="button"
                onClick={() => genre.length > 0 && setCategoryOpen((o) => !o)}
                onBlur={() => setTimeout(() => setCategoryOpen(false), 200)}
                disabled={genre.length === 0}
                style={{
                  ...selectStyle(genre.length === 0),
                  textAlign: 'left',
                  cursor: genre.length > 0 ? 'pointer' : 'not-allowed',
                  color: category ? '#1d1d1f' : '#86868b',
                  opacity: genre.length > 0 ? 1 : 0.7,
                }}
              >
                {genre.length === 0 ? 'Sélectionner d\'abord un ou des Genre(s)' : category ? (CATEGORIES.find((o) => o.value === category)?.label ?? category) : 'Sélectionner une catégorie'}
              </button>
              {categoryOpen && genre.length > 0 && (
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
                  {CATEGORIES.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        const v = opt.value as ListingCategory | 'autre';
                        setCategory(v);
                        if (v !== 'autre') setCustomCategory('');
                        setArticleType('');
                        setBrand('');
                        setCustomBrand('');
                        setMarqueSearchQuery('');
                        setModel('');
                        setCustomModel('');
                        setModeleSearchQuery('');
                        setMaterial('');
                        setMaterialSearchQuery('');
                        setCustomMaterial('');
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
            {(category === 'vetements' || category === 'sacs' || category === 'bijoux' || category === 'chaussures' || category === 'accessoires') && (
              <div style={{ marginBottom: 18, position: 'relative' }}>
                <label style={labelStyle}>Type de produit <span style={{ color: '#1d1d1f' }}>*</span></label>
                {(() => {
                  const articleTypeOptions = category === 'vetements' ? getVetementsTypesForGenre(genre) : category === 'sacs' ? getSacsTypesForGenre(genre) : category === 'bijoux' ? getBijouxTypesForGenre(genre) : category === 'chaussures' ? getChaussuresTypesForGenre(genre) : getAccessoiresTypesForGenre(genre);
                  return (
                    <>
                      <button
                        type="button"
                        onClick={() => genre.length > 0 && setTypeOpen((o) => !o)}
                        onBlur={() => setTimeout(() => setTypeOpen(false), 200)}
                        disabled={genre.length === 0}
                        style={{
                          ...inputStyle,
                          textAlign: 'left',
                          cursor: genre.length > 0 ? 'pointer' : 'not-allowed',
                          color: articleType ? '#1d1d1f' : '#86868b',
                          opacity: genre.length > 0 ? 1 : 0.7,
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2386868b' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'right 14px center',
                          paddingRight: 40,
                        }}
                      >
                        {genre.length === 0
                          ? 'Sélectionner Femme et/ou Homme'
                          : articleType
                            ? (articleTypeOptions.find((o) => o.value === articleType)?.label ?? articleType)
                            : 'Sélectionner un type de produit'}
                      </button>
                      {typeOpen && genre.length > 0 && (
                        <div
                          ref={typeListRef}
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
                          {articleTypeOptions.map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                setArticleType(opt.value);
                                setTypeOpen(false);
                              }}
                              style={{
                                display: 'block',
                                width: '100%',
                                padding: '6px 12px',
                                textAlign: 'left',
                                fontSize: 15,
                                color: '#1d1d1f',
                                background: articleType === opt.value ? '#f5f5f7' : 'none',
                                border: 'none',
                                cursor: 'pointer',
                                fontWeight: articleType === opt.value ? 600 : 400,
                              }}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
            {category === 'autre' && (
              <div style={{ marginBottom: 18 }}>
                <label style={labelStyle}>Catégorie personnalisée <span style={{ color: '#1d1d1f' }}>*</span></label>
                <input type="text" value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} placeholder="Indiquez la catégorie" style={inputStyle} />
              </div>
            )}
            <div style={{ marginBottom: 18, position: 'relative' }}>
              <label style={labelStyle}>Marque <span style={{ color: '#1d1d1f' }}>*</span></label>
              {(() => {
                const marqueDisabled = !category || genre.length === 0 || (hasTypeCategory && !articleType);
                const marquePlaceholder = !category ? 'Sélectionner d\'abord une catégorie' : genre.length === 0 ? 'Sélectionner d\'abord Femme et/ou Homme' : hasTypeCategory && !articleType ? 'Sélectionner d\'abord un type de produit' : 'Rechercher ou préciser la marque...';
                return (
                  <>
              <input
                type="text"
                value={marqueSearchQuery}
                onChange={(e) => {
                  setMarqueSearchQuery(e.target.value);
                  if (brand && e.target.value !== brand) setBrand('');
                  setMarqueOpen(true);
                }}
                onFocus={() => { if (!marqueDisabled) setMarqueOpen(true); }}
                onBlur={() => setTimeout(() => setMarqueOpen(false), 200)}
                placeholder={marquePlaceholder}
                disabled={marqueDisabled}
                style={{
                  ...inputStyle,
                  cursor: marqueDisabled ? 'not-allowed' : 'text',
                  opacity: marqueDisabled ? 0.7 : 1,
                }}
              />
              {!marqueDisabled && marqueOpen && brandOptions.filter((opt) => !marqueSearchQuery.trim() || opt.label.toLowerCase().includes(marqueSearchQuery.trim().toLowerCase())).length > 0 && (
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
                          setMaterialSearchQuery('');
                          setCustomMaterial('');
                          setColor('');
                          setColorSearchQuery('');
                          setCustomColor('');
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
                  </>
                );
              })()}
            </div>
            <div style={{ marginBottom: 18, position: 'relative' }}>
              <label style={labelStyle}>Modèle <span style={{ color: '#1d1d1f' }}>*</span></label>
              {(() => {
                const hasMarque = !!(brand || marqueSearchQuery.trim());
                const modeleDisabled = !category || !hasMarque;
                const modelePlaceholder = modeleDisabled ? 'Sélectionner d\'abord une marque' : 'Rechercher ou préciser le modèle...';
                const modelePlaceholderCustom = modeleDisabled ? 'Sélectionner d\'abord une marque' : 'Précisez le modèle';
                return modelOptions.length > 0 ? (
                  <>
                    <input
                      type="text"
                      value={modeleSearchQuery}
                      onChange={(e) => {
                        if (modeleDisabled) return;
                        setModeleSearchQuery(e.target.value);
                        if (model && e.target.value !== model) setModel('');
                        setModeleOpen(true);
                      }}
                      onFocus={() => { if (!modeleDisabled) setModeleOpen(true); }}
                      onBlur={() => setTimeout(() => setModeleOpen(false), 200)}
                      placeholder={modelePlaceholder}
                      disabled={modeleDisabled}
                      style={{
                        ...inputStyle,
                        cursor: modeleDisabled ? 'not-allowed' : 'text',
                        opacity: modeleDisabled ? 0.7 : 1,
                      }}
                    />
                    {!modeleDisabled && modeleOpen && modelOptions.filter((name) => !modeleSearchQuery.trim() || name.toLowerCase().includes(modeleSearchQuery.trim().toLowerCase())).length > 0 && (
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
                    onChange={(e) => { if (!modeleDisabled) setCustomModel(e.target.value); }}
                    placeholder={modelePlaceholderCustom}
                    disabled={modeleDisabled}
                    style={{
                      ...inputStyle,
                      cursor: modeleDisabled ? 'not-allowed' : 'text',
                      opacity: modeleDisabled ? 0.7 : 1,
                    }}
                  />
                );
              })()}
            </div>
            {(category === 'chaussures' || category === 'vetements') && (
              <div style={{ marginBottom: 18, position: 'relative' }}>
                <label style={labelStyle}>{category === 'chaussures' ? 'Pointure' : 'Taille'}</label>
                {(() => {
                  const hasModele = !!(model || modeleSearchQuery.trim() || customModel.trim());
                  const sizeDisabled = !hasModele;
                  const sizePlaceholder = sizeDisabled ? 'Renseigner d\'abord le modèle' : (category === 'chaussures' ? 'Rechercher ou préciser la pointure…' : 'Rechercher ou préciser la taille…');
                  return (
                    <>
                      <input
                        type="text"
                        value={sizeSearchQuery}
                        onChange={(e) => {
                          if (sizeDisabled) return;
                          setSizeSearchQuery(e.target.value);
                          if (size && e.target.value !== size) setSize('');
                          setSizeOpen(true);
                        }}
                        onFocus={() => { if (!sizeDisabled) setSizeOpen(true); }}
                        onBlur={() => setTimeout(() => setSizeOpen(false), 200)}
                        placeholder={sizePlaceholder}
                        disabled={sizeDisabled}
                        style={{
                          ...inputStyle,
                          cursor: sizeDisabled ? 'not-allowed' : 'text',
                          opacity: sizeDisabled ? 0.7 : 1,
                        }}
                      />
                      {!sizeDisabled && sizeOpen && (() => {
                        const m = (model || modeleSearchQuery.trim()).toLowerCase();
                        const isPantalon = category === 'vetements' && (m === 'pantalon' || m.includes('pantalon'));
                        const isJean = category === 'vetements' && (m === 'jean' || m.includes('jean'));
                        const options = category === 'chaussures'
                          ? getShoeSizesForGenre(genre)
                          : (isPantalon || isJean
                            ? [...CLOTHING_SIZES, ...(isPantalon ? getPantSizesForGenre(genre) : []), ...(isJean ? getJeanSizesForGenre(genre) : [])]
                            : [...CLOTHING_SIZES]);
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
                    </>
                  );
                })()}
              </div>
            )}
            <div ref={etatInfoRef} style={{ marginBottom: 18, position: 'relative' }}>
              <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 6 }}>
                État <span style={{ color: '#1d1d1f' }}>*</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    const visible = etatInfoClicked || etatInfoHover;
                    if (visible) {
                      setEtatInfoClicked(false);
                      setEtatInfoHover(false);
                    } else {
                      setEtatInfoClicked(true);
                      setEtatInfoHover(false);
                    }
                  }}
                  onMouseEnter={() => setEtatInfoHover(true)}
                  onMouseLeave={() => setEtatInfoHover(false)}
                  aria-label="Informations sur les états"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 22,
                    height: 22,
                    padding: 0,
                    border: '1px solid #d2d2d7',
                    borderRadius: '50%',
                    backgroundColor: etatInfoClicked ? '#1d1d1f' : (etatInfoHover ? '#1d1d1f' : '#fff'),
                    color: etatInfoClicked ? '#fff' : (etatInfoHover ? '#fff' : '#6e6e73'),
                    cursor: 'pointer',
                    transition: 'background-color 0.2s, color 0.2s, border-color 0.2s',
                    boxShadow: etatInfoClicked ? '0 1px 3px rgba(0,0,0,0.12)' : (etatInfoHover ? '0 1px 3px rgba(0,0,0,0.12)' : '0 1px 2px rgba(0,0,0,0.04)'),
                  }}
                >
                  <Info size={13} strokeWidth={2.2} />
                </button>
              </label>
              <div style={{ position: 'relative' }}>
                {(etatInfoClicked || etatInfoHover) && (
                  <div
                    role="tooltip"
                    onMouseEnter={() => setEtatInfoHover(true)}
                    onMouseLeave={() => setEtatInfoHover(false)}
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      top: 0,
                      zIndex: 20,
                      boxSizing: 'border-box',
                      padding: 16,
                      backgroundColor: '#fff',
                      border: '1px solid #e8e6e3',
                      borderRadius: 12,
                      boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                      fontSize: 13,
                      lineHeight: 1.5,
                      color: '#1d1d1f',
                      minHeight: '100%',
                    }}
                  >
                    {ETAT_DEFINITIONS.map((item) => (
                      <div key={item.title} style={{ marginBottom: item.title === 'État correct' ? 0 : 12 }}>
                        <strong style={{ display: 'block', marginBottom: 4 }}>{item.title}</strong>
                        <span style={{ color: '#6e6e73' }}>{item.text}</span>
                      </div>
                    ))}
                  </div>
                )}
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
              </div>
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
              {(() => {
                const hasModel = modelOptions.length > 0 ? !!(model || modeleSearchQuery.trim()) : !!customModel.trim();
                const matiereDisabled = !category || !hasModel;
                return category ? (
                <>
                  <input
                    type="text"
                    value={materialSearchQuery}
                    onChange={(e) => {
                      if (matiereDisabled) return;
                      setMaterialSearchQuery(e.target.value);
                      if (material && e.target.value !== (materialOptions.find((o) => o.value === material)?.label ?? '')) setMaterial('');
                      setMaterialOpen(true);
                    }}
                    onFocus={() => { if (!matiereDisabled) setMaterialOpen(true); }}
                    onBlur={() => setTimeout(() => setMaterialOpen(false), 200)}
                    placeholder={matiereDisabled ? 'Sélectionner d\'abord un modèle' : 'Rechercher ou préciser la matière…'}
                    disabled={matiereDisabled}
                    style={{
                      ...inputStyle,
                      cursor: matiereDisabled ? 'not-allowed' : 'text',
                      opacity: matiereDisabled ? 0.7 : 1,
                    }}
                  />
                  {!matiereDisabled && materialOpen && materialOptions.filter((opt) => !materialSearchQuery.trim() || opt.label.toLowerCase().includes(materialSearchQuery.trim().toLowerCase())).length > 0 && (
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
                  placeholder="Sélectionner d'abord un modèle"
                  style={{ ...inputStyle, cursor: 'not-allowed', opacity: 0.7 }}
                />
              );
              })()}
            </div>
            <div style={{ marginBottom: 18, position: 'relative' }}>
              <label style={labelStyle}>Couleur</label>
              {(() => {
                const hasModel = modelOptions.length > 0 ? !!(model || modeleSearchQuery.trim()) : !!customModel.trim();
                const couleurDisabled = !category || !hasModel;
                return category ? (
                <>
                  <input
                    type="text"
                    value={colorSearchQuery}
                    onChange={(e) => {
                      if (couleurDisabled) return;
                      setColorSearchQuery(e.target.value);
                      if (color && e.target.value !== (colorOptions.find((o) => o.value === color)?.label ?? '')) setColor('');
                      setColorOpen(true);
                    }}
                    onFocus={() => { if (!couleurDisabled) setColorOpen(true); }}
                    onBlur={() => setTimeout(() => setColorOpen(false), 200)}
                    placeholder={couleurDisabled ? 'Sélectionner d\'abord un modèle' : 'Rechercher ou préciser la couleur…'}
                    disabled={couleurDisabled}
                    style={{
                      ...inputStyle,
                      cursor: couleurDisabled ? 'not-allowed' : 'text',
                      opacity: couleurDisabled ? 0.7 : 1,
                    }}
                  />
                  {!couleurDisabled && colorOpen && colorOptions.filter((opt) => !colorSearchQuery.trim() || opt.label.toLowerCase().includes(colorSearchQuery.trim().toLowerCase())).length > 0 && (
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
                  placeholder="Sélectionner d'abord un modèle"
                  style={{ ...inputStyle, cursor: 'not-allowed', opacity: 0.7 }}
                />
              );
              })()}
            </div>
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
            {(category !== 'chaussures' && category !== 'vetements') && (
            category === 'montres' ? (
              <div style={{ marginBottom: 18 }}>
                <label style={labelStyle}>Dimension</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={widthCm ? String(Math.round(parseFloat(widthCm.replace(',', '.')) * 10)) : ''}
                    onChange={(e) => {
                      const v = e.target.value.replace(',', '.');
                      if (v === '') { setWidthCm(''); setHeightCm(''); return; }
                      const num = parseFloat(v);
                      if (!Number.isNaN(num)) { setWidthCm(String(num / 10)); setHeightCm(''); }
                    }}
                    placeholder="Ex: 41"
                    style={{ ...inputStyle, paddingRight: 44 }}
                  />
                  <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#86868b', fontSize: 15, lineHeight: 1 }}>mm</span>
                </div>
              </div>
            ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 18 }}>
              <div>
                <label style={labelStyle}>Longueur</label>
                <div style={{ position: 'relative' }}>
                  <input type="text" inputMode="decimal" value={widthCm} onChange={(e) => setWidthCm(e.target.value)} placeholder="Ex: 35" style={{ ...inputStyle, paddingRight: 44 }} />
                  <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#86868b', fontSize: 15, lineHeight: 1 }}>cm</span>
                </div>
              </div>
              <div>
                <label style={labelStyle}>Hauteur</label>
                <div style={{ position: 'relative' }}>
                  <input type="text" inputMode="decimal" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} placeholder="Ex: 25" style={{ ...inputStyle, paddingRight: 44 }} />
                  <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#86868b', fontSize: 15, lineHeight: 1 }}>cm</span>
                </div>
              </div>
            </div>
            )
            )}
            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle}>Année</label>
              <input type="number" value={year} onChange={(e) => setYear(e.target.value)} placeholder="Ex: 2020" min={1900} max={new Date().getFullYear() + 1} style={inputStyle} />
            </div>
            <div style={{ marginBottom: 18 }}>
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
            <CguCgvCheckbox
              id="modifier-annonce-cgu-cgv"
              checked={acceptCguCgv}
              onChange={(v) => { setAcceptCguCgv(v); setCguCgvError(''); }}
              error={cguCgvError}
            />
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
