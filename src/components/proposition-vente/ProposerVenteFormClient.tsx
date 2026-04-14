'use client';

import { useState, useEffect, useLayoutEffect, useCallback, useRef, type RefObject } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useDropzone, type FileRejection } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, Euro, Info, Trash2, Upload } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { uploadSaleProposalPhotos } from '@/lib/supabase/storage';
import {
  createSaleProposalWithInvites,
  fetchVisitorSaleProposalById,
  updateVisitorSaleProposalWithInvites,
  type SaleProposalRow,
  type SaleProposalBuyerContact,
} from '@/lib/supabase/saleProposals';
import { MultiLocationPicker } from '@/components/proposition-vente/MultiLocationPicker';
import type { SaleProposalLocationEntry } from '@/lib/saleProposalLocations';
import { unionPrefixes, sellerPostcodeMatchesPrefixes } from '@/lib/saleProposalLocations';
import { fetchCoordsForPostcode, haversineKm } from '@/lib/geoCoords';
import { normalizeSubscriptionTier } from '@/lib/subscription';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { sellerRowToPropositionAddressLine } from '@/lib/sellerAddressDisplay';
import { CguCgvCheckbox } from '@/components/ui';
import { CATEGORIES, parseListingPriceInputToNumber, sanitizeListingPriceInputWhileTyping } from '@/lib/utils';
import {
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_MB,
  PHOTO_MAX_SIZE_PER_FILE_SHORT_HINT,
  photoAdditionHasOversizeFile,
  validateImageFile,
} from '@/lib/file-validation';
import { BRANDS_BY_CATEGORY_AND_GENRE, CHAUSSURES_MODELES_FEMME_ONLY, CHAUSSURES_MODELES_HOMME_ONLY, CLOTHING_SIZES, COLORS, COLORS_BY_CATEGORY, CONDITIONS, getAccessoiresTypesForGenre, getArticleTypeLabelsForCategory, getArticleTypeOptionsForForm, getArticleTypeSingleLabelForTitle, getBijouxTypesForGenre, getChaussuresTypesForGenre, getJeanSizesForGenre, isModelNameATypeLabel, modelMatchesArticleType, getPantSizesForGenre, getSacsTypesForGenre, getShoeSizesForGenre, getVetementsTypesForGenre, MATIERES_BY_CATEGORY, MATERIALS, MODELE_EXCLU_QUAND_IDENTIQUE_CATEGORIE, MODELE_VETEMENTS_GENERIQUES_EXCLUS, MODELES_EXCLUS_DEPOT_ANNONCE, MODELS_BY_CATEGORY_BRAND_AND_GENRE, MONTRES_MODELES_FEMME_ONLY, MONTRES_MODELES_HOMME_ONLY, SACS_MODELES_FEMME_ONLY, SACS_MODELES_HOMME_ONLY, BIJOUX_MODELES_FEMME_ONLY, BIJOUX_MODELES_HOMME_ONLY, VETEMENTS_MODELES_FEMME_ONLY, VETEMENTS_MODELES_HOMME_ONLY, VETEMENTS_MODELES_TOUJOURS_PROPOSES, VETEMENTS_MARQUES_UNIQUEMENT_MODELES_MARQUE, ROBE_SIZES } from '@/lib/constants';
import { ListingCategory } from '@/types';

const KNOWN_LISTING_CATEGORIES = new Set<ListingCategory>([
  'sacs',
  'montres',
  'bijoux',
  'vetements',
  'chaussures',
  'accessoires',
]);

const ETAT_OPTIONS = [
  { value: 'new', label: 'Neuf' },
  { value: 'very_good', label: 'Très bon état' },
  { value: 'good', label: 'Bon état' },
  { value: 'correct', label: 'Correct' },
];

const ETAT_DEFINITIONS: { title: string; text: string }[] = [
  { title: 'Neuf', text: 'Article jamais porté en parfait état. Aucun signe d\'utilisation.' },
  { title: 'Très bon état', text: 'Article peu porté et soigneusement conservé. Peut présenter de très légers signes d\'usage à peine perceptibles.' },
  { title: 'Bon état', text: 'Article porté et bien entretenu. Peut présenter des traces d\'usage visibles liées à une utilisation normale.' },
  { title: 'État correct', text: 'Article régulièrement porté. Présente des signes d\'usure visibles liés à l\'usage, sans défaut majeur ni détérioration importante.' },
];

/** Contenu inclus : chaque clé (box, certificat, facture) présente dans packaging = Oui */
const CONTENU_INCLUS_OPTIONS = [
  { value: 'box', label: 'Boîte' },
  { value: 'certificat', label: 'Certificat' },
  { value: 'facture', label: 'Facture' },
];

const STEP_TITLES = ['Caractéristiques', 'Photos', 'Description & détails', 'Prix & vendeurs', 'Message aux vendeurs'];

/** Coquille + étapes + carte formulaire (auth ou Suspense). */
export function ProposerVenteAuthSkeleton() {
  return (
    <div style={{ paddingTop: 'var(--header-height)', minHeight: '100vh' }}>
      <div
        className="deposer-annonce-title-row"
        style={{ padding: '30px 24px 0', marginBottom: 28, maxWidth: 1100, marginLeft: 'auto', marginRight: 'auto' }}
      >
        <div className="catalogue-skeleton" style={{ width: 168, height: 22, borderRadius: 6, flexShrink: 0 }} />
        <div className="deposer-annonce-title-center">
          <h1
            style={{
              fontFamily: 'var(--font-playfair), Georgia, serif',
              fontSize: 28,
              fontWeight: 500,
              margin: '0 0 8px',
              color: '#1d1d1f',
              letterSpacing: '-0.02em',
            }}
          >
            Proposer une pièce
          </h1>
          <p style={{ fontSize: 15, color: '#6e6e73', margin: 0 }}>
            <span className="deposer-annonce-subtitle-desktop">Proposer une pièce aux vendeurs</span>
            <span className="deposer-annonce-subtitle-mobile">Proposer une pièce aux vendeurs</span>
          </p>
        </div>
        <div className="deposer-annonce-title-spacer" aria-hidden />
      </div>
      <div className="deposer-annonce-form-inner" style={{ maxWidth: 520, margin: '0 auto', padding: '0 24px 80px' }}>
        <div
          className="deposer-annonce-steps-row"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 4 }}
        >
          {[1, 2, 3, 4, 5].map((s, i) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
              <div className="catalogue-skeleton deposer-annonce-step-circle" style={{ width: 40, height: 40, borderRadius: 980, flexShrink: 0 }} />
              {i < 4 && (
                <div
                  className="catalogue-skeleton deposer-annonce-steps-connector"
                  style={{ width: 28, height: 2, margin: '0 6px', borderRadius: 1 }}
                />
              )}
            </div>
          ))}
        </div>
        <div className="catalogue-skeleton" style={{ height: 18, width: 220, maxWidth: '90%', margin: '0 auto 28px', borderRadius: 4 }} />
        <div style={{ backgroundColor: '#fff', padding: '32px 28px', borderRadius: 18, boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
          <div className="catalogue-skeleton" style={{ height: 14, width: 96, marginBottom: 10, borderRadius: 4 }} />
          <div className="catalogue-skeleton" style={{ height: 50, width: '100%', borderRadius: 12, marginBottom: 20 }} />
          <div className="catalogue-skeleton" style={{ height: 14, width: 120, marginBottom: 10, borderRadius: 4 }} />
          <div className="catalogue-skeleton" style={{ height: 50, width: '100%', borderRadius: 12, marginBottom: 20 }} />
          <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
            <div className="catalogue-skeleton" style={{ height: 44, flex: 1, borderRadius: 12 }} />
            <div className="catalogue-skeleton" style={{ height: 44, flex: 1, borderRadius: 12 }} />
          </div>
          <div className="catalogue-skeleton" style={{ height: 14, width: 72, marginBottom: 10, borderRadius: 4 }} />
          <div className="catalogue-skeleton" style={{ height: 50, width: '100%', borderRadius: 12, marginBottom: 24 }} />
          <div className="catalogue-skeleton" style={{ height: 50, width: '100%', borderRadius: 980 }} />
        </div>
      </div>
    </div>
  );
}

const DRAFT_KEY_NEW = 'luxe-proposition-vente-draft';

type NewListingDraft = {
  step?: number;
  selectedLocations?: SaleProposalLocationEntry[];
  selectedSellerIds?: string[];
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
  /** Partie du titre après "Marque - " (personnalisable) */
  titleSuffix?: string;
  description?: string;
  heightCm?: string;
  widthCm?: string;
  year?: string;
  contenuInclus?: Record<string, true | false | null>;
  price?: string;
  acceptCguCgv?: boolean;
  contactFirstName?: string;
  contactLastName?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactMessage?: string;
};

/** Listes déroulantes étape 1 : une seule ouverte à la fois. */
type Step1DropdownId = 'category' | 'type' | 'marque' | 'modele' | 'size' | 'condition' | 'material' | 'color';

/** Photo déjà enregistrée (URL publique) ou fichier ajouté dans la session. */
type PropositionPhotoItem = { kind: 'remote'; url: string } | { kind: 'file'; file: File };

function maxSaleProposalPhotoIndexFromUrls(urls: string[]): number {
  let max = -1;
  for (const u of urls) {
    const m = u.match(/photo_(\d+)\./i);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return max;
}

/**
 * Réaligne la valeur BDD sur la valeur attendue par les listes du formulaire.
 * Quand plusieurs options partagent la même clé BDD (ex. maille_sweatshirt::Mailles vs ::Sweatshirts),
 * le texte modèle/titre aide à retrouver le bon sous-type ; sinon on enregistre désormais la valeur complète avec :: en BDD.
 */
function articleTypeDbToFormValue(
  category: ListingCategory | '' | 'autre',
  genre: ('homme' | 'femme')[],
  stored: string | null | undefined,
  disambiguationText?: string | null,
): string {
  const raw = (stored || '').trim();
  if (!raw || category === 'autre' || !category) return raw;
  const typed =
    category === 'vetements' ||
    category === 'sacs' ||
    category === 'bijoux' ||
    category === 'chaussures' ||
    category === 'accessoires';
  if (!typed || genre.length === 0) return raw;
  const options =
    category === 'vetements'
      ? getArticleTypeOptionsForForm(getVetementsTypesForGenre(genre))
      : category === 'sacs'
        ? getArticleTypeOptionsForForm(getSacsTypesForGenre(genre))
        : category === 'bijoux'
          ? getArticleTypeOptionsForForm(getBijouxTypesForGenre(genre))
          : category === 'chaussures'
            ? getArticleTypeOptionsForForm(getChaussuresTypesForGenre(genre))
            : getArticleTypeOptionsForForm(getAccessoiresTypesForGenre(genre));

  if (options.some((o) => o.value === raw)) return raw;

  const base = raw.includes('::') ? (raw.split('::')[0] || '').trim() : raw;
  if (!base) return raw;
  if (options.some((o) => o.value === base)) return base;

  const composites = options.filter((o) => o.value.startsWith(`${base}::`));
  if (composites.length === 0) return raw;
  if (composites.length === 1) return composites[0].value;

  const t = (disambiguationText || '').toLowerCase();
  const sweatHint = /sweat|hoodie|molleton|capuche|crewneck|sweatshirt|\bhood\b/i.test(t);
  const mailleHint = /\bmaille\b|\bpull\b|\bcardigan\b|\bgilet\b|\btricot\b/i.test(t);
  if (sweatHint && !mailleHint) {
    const hit = composites.find((c) => /sweatshirt|sweat/i.test(c.value) || /sweatshirt|sweat/i.test(c.label));
    if (hit) return hit.value;
  }
  if (mailleHint && !sweatHint) {
    const hit = composites.find((c) => /maille/i.test(c.value) || /maille/i.test(c.label));
    if (hit) return hit.value;
  }
  return composites[0].value;
}

function buyerContactFromRow(row: SaleProposalRow): SaleProposalBuyerContact | null {
  const raw = row.buyer_contact as unknown;
  if (raw == null || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const s = (k: string) => (typeof o[k] === 'string' ? (o[k] as string) : '');
  const firstName = s('firstName');
  const lastName = s('lastName');
  const email = s('email');
  const message = s('message');
  const phone = s('phone');
  if (!firstName && !lastName && !email && !message && !phone) return null;
  const out: SaleProposalBuyerContact = { firstName, lastName, email, message };
  if (phone.trim()) out.phone = phone;
  return out;
}

export function ProposerVenteFormClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isSeller, loading: authLoading } = useAuth();
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [acceptCguCgv, setAcceptCguCgv] = useState(false);
  const [cguCgvError, setCguCgvError] = useState('');
  /** Proposition existante chargée via ?modifier= (mise à jour au lieu de création). */
  const [editingProposalId, setEditingProposalId] = useState<string | null>(null);
  const [selectedLocations, setSelectedLocations] = useState<SaleProposalLocationEntry[]>([]);
  const [radiusKm, setRadiusKm] = useState(0);
  const [buyerLatLon, setBuyerLatLon] = useState<{ lat: number; lon: number } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [selectedSellerIds, setSelectedSellerIds] = useState<string[]>([]);
  const [eligibleSellers, setEligibleSellers] = useState<
    { id: string; companyName: string; addressLine: string; subscriptionTier: string; avatarUrl: string | null }[]
  >([]);
  const [eligibleLoading, setEligibleLoading] = useState(false);

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
  /** Une seule liste déroulante ouverte à la fois (étape caractéristiques). */
  const [step1Dropdown, setStep1Dropdown] = useState<Step1DropdownId | null>(null);
  const blurStep1Dropdown = (id: Step1DropdownId) => () => {
    setTimeout(() => {
      setStep1Dropdown((prev) => (prev === id ? null : prev));
    }, 200);
  };
  const [etatInfoClicked, setEtatInfoClicked] = useState(false);
  const [etatInfoHover, setEtatInfoHover] = useState(false);
  const [condition, setCondition] = useState('');
  const [material, setMaterial] = useState('');
  const [materialSearchQuery, setMaterialSearchQuery] = useState('');
  const [customMaterial, setCustomMaterial] = useState('');
  const [color, setColor] = useState('');
  const [colorSearchQuery, setColorSearchQuery] = useState('');
  const [customColor, setCustomColor] = useState('');
  const [size, setSize] = useState('');
  const [sizeSearchQuery, setSizeSearchQuery] = useState('');
  /** Partie du titre après "Marque - " (personnalisable par le vendeur) */
  const [titleSuffix, setTitleSuffix] = useState('');
  const [description, setDescription] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [widthCm, setWidthCm] = useState('');
  const [year, setYear] = useState('');
  const [contenuInclus, setContenuInclusState] = useState<Record<string, true | false | null>>({ box: null, certificat: null, facture: null });
  const [price, setPrice] = useState('');
  const [contactFirstName, setContactFirstName] = useState('');
  const [contactLastName, setContactLastName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactLegalExpanded, setContactLegalExpanded] = useState(false);
  const [photoItems, setPhotoItems] = useState<PropositionPhotoItem[]>([]);
  /** Cache blob: URL par `File` — synchrone avec `photoItems` (pas de useMemo avec revoke, pas d’un rendu « vide » avant setState). */
  const proposalPhotoBlobUrlByFileRef = useRef<Map<File, string>>(new Map());

  const photoDisplayUrls = photoItems.map((item) => {
    if (item.kind === 'remote') return item.url;
    const cache = proposalPhotoBlobUrlByFileRef.current;
    let u = cache.get(item.file);
    if (!u) {
      u = URL.createObjectURL(item.file);
      cache.set(item.file, u);
    }
    return u;
  });

  useLayoutEffect(() => {
    const filesInList = new Set(
      photoItems.filter((p): p is Extract<PropositionPhotoItem, { kind: 'file' }> => p.kind === 'file').map((p) => p.file)
    );
    const cache = proposalPhotoBlobUrlByFileRef.current;
    cache.forEach((url, file) => {
      if (!filesInList.has(file)) {
        URL.revokeObjectURL(url);
        cache.delete(file);
      }
    });
  }, [photoItems]);

  useEffect(() => {
    return () => {
      proposalPhotoBlobUrlByFileRef.current.forEach(URL.revokeObjectURL);
      proposalPhotoBlobUrlByFileRef.current.clear();
    };
  }, []);

  // Remonter le formulaire en haut à chaque changement d'étape
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  // Restaurer le brouillon complet au chargement (sessionStorage : survit au changement d'onglet/fenêtre)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Ne pas écraser avec un brouillon partiel quand on arrive pour modifier (URL initiale, pas après replace)
    if (new URLSearchParams(window.location.search).get('modifier')?.trim()) return;
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY_NEW);
      if (!raw) return;
      const d = JSON.parse(raw) as NewListingDraft;
      if (d.step != null && d.step >= 1 && d.step <= 5) setStep(d.step);
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
      if (d.titleSuffix != null) setTitleSuffix(d.titleSuffix);
      if (d.description != null) setDescription(d.description);
      if (d.heightCm != null) setHeightCm(d.heightCm);
      if (d.widthCm != null) setWidthCm(d.widthCm);
      if (d.year != null) setYear(d.year);
      if (d.contenuInclus != null && typeof d.contenuInclus === 'object') setContenuInclusState(d.contenuInclus);
      if (d.price != null) setPrice(sanitizeListingPriceInputWhileTyping(String(d.price)));
      if (d.acceptCguCgv != null) setAcceptCguCgv(d.acceptCguCgv);
      if (Array.isArray(d.selectedLocations)) setSelectedLocations(d.selectedLocations);
      if (Array.isArray(d.selectedSellerIds)) setSelectedSellerIds(d.selectedSellerIds);
      if (d.contactFirstName != null) setContactFirstName(d.contactFirstName);
      if (d.contactLastName != null) setContactLastName(d.contactLastName);
      if (d.contactEmail != null) setContactEmail(d.contactEmail);
      if (d.contactPhone != null) setContactPhone(d.contactPhone);
      if (d.contactMessage != null) setContactMessage(d.contactMessage);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    setContactEmail((e) => (e.trim() ? e : user.email || ''));
    const parts = (user.displayName || '').trim().split(/\s+/).filter(Boolean);
    setContactFirstName((f) => (f.trim() ? f : parts[0] ?? ''));
    setContactLastName((l) => (l.trim() ? l : parts.slice(1).join(' ') ?? ''));
    const p = user.phone;
    if (typeof p === 'string' && p.trim()) {
      setContactPhone((ph) => (ph.trim() ? ph : p));
    }
  }, [user]);

  // Sauvegarder le brouillon complet (sessionStorage) à chaque modification + quand on quitte l'onglet
  const draftPayloadRef = useRef<NewListingDraft>({});
  const draftTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Si false, le titre est resynchronisé avec le titre suggéré quand marque / modèle / type changent. */
  const titleManuallyEditedRef = useRef(false);
  const modifierHydratedRef = useRef<string | null>(null);
  /** En modification : vendeurs invités au chargement (réaffichés même si hors filtre géo). */
  const inviteSellerIdsFromLoadedProposalRef = useRef<string[]>([]);
  /** Proposition chargée pour aligner modèle / champs recherche après le calcul de modelOptions. */
  const lastLoadedProposalRowRef = useRef<SaleProposalRow | null>(null);
  const pendingProposalFieldSyncRef = useRef(false);
  const modifierProposalId = searchParams.get('modifier')?.trim() || null;

  const applyLoadedProposalRow = useCallback((row: SaleProposalRow) => {
    titleManuallyEditedRef.current = true;
    const rawCat = (row.category || '').trim();
    let cat: ListingCategory | '' | 'autre' = '';
    if (KNOWN_LISTING_CATEGORIES.has(rawCat as ListingCategory)) {
      cat = rawCat as ListingCategory;
      setCategory(cat);
      setCustomCategory('');
    } else if (rawCat) {
      cat = 'autre';
      setCategory('autre');
      setCustomCategory(rawCat);
    } else {
      setCategory('');
      setCustomCategory('');
    }
    const rawGenre = row.genre;
    const genreArr =
      Array.isArray(rawGenre)
        ? (rawGenre.filter((x): x is 'homme' | 'femme' => x === 'homme' || x === 'femme') as ('homme' | 'femme')[])
        : [];
    setGenre(genreArr);
    setArticleType(
      articleTypeDbToFormValue(cat, genreArr, row.article_type, [row.model, row.title].filter(Boolean).join(' ')),
    );
    const brandStr = (row.brand || '').trim();
    setBrand(brandStr);
    setMarqueSearchQuery(brandStr);
    setCustomBrand('');
    setCondition(row.condition || '');
    const mat = (row.material || '').trim();
    const materialOpts =
      cat && cat !== 'autre' ? (MATIERES_BY_CATEGORY[cat] ?? MATERIALS).filter((o) => o.value !== 'other') : [];
    const matOpt = materialOpts.find((o) => o.value === mat);
    if (matOpt) {
      setMaterial(matOpt.value);
      setMaterialSearchQuery(matOpt.label);
    } else {
      setMaterial('');
      setMaterialSearchQuery(mat);
    }
    const col = (row.color || '').trim();
    const colorOpts =
      cat && cat !== 'autre' ? (COLORS_BY_CATEGORY[cat] ?? COLORS).filter((o) => o.value !== 'other') : [];
    const colOpt = colorOpts.find((o) => o.value === col);
    if (colOpt) {
      setColor(colOpt.value);
      setColorSearchQuery(colOpt.label);
    } else {
      setColor('');
      setColorSearchQuery(col);
    }
    const sz = (row.size || '').trim();
    setSize(sz);
    setSizeSearchQuery(sz);
    const b = (row.brand || '').trim();
    const t = (row.title || '').trim();
    setTitleSuffix(b && t.startsWith(`${b} - `) ? t.slice(b.length + 3).trim() : t);
    setDescription(row.description || '');
    setHeightCm(row.height_cm != null ? String(row.height_cm) : '');
    setWidthCm(row.width_cm != null ? String(row.width_cm) : '');
    setYear(row.year != null ? String(row.year) : '');
    const pack = row.packaging ?? [];
    setContenuInclusState({
      box: pack.includes('box'),
      certificat: pack.includes('certificat'),
      facture: pack.includes('facture'),
    });
    setPrice(sanitizeListingPriceInputWhileTyping(String(Number(row.wish_price_cents) / 100)));
    setSelectedLocations(Array.isArray(row.locations) ? row.locations : []);
    setSelectedSellerIds(row.invites?.map((i) => i.seller_id) ?? []);
    const bc = buyerContactFromRow(row);
    setContactFirstName(bc?.firstName ?? '');
    setContactLastName(bc?.lastName ?? '');
    setContactEmail(bc?.email ?? '');
    setContactPhone(bc?.phone ?? '');
    setContactMessage(bc?.message ?? '');
    setStep(1);
  }, []);

  useEffect(() => {
    if (authLoading || !user?.uid || !modifierProposalId) return;
    if (modifierHydratedRef.current === modifierProposalId) return;
    let cancelled = false;
    (async () => {
      try {
        const row = await fetchVisitorSaleProposalById(user.uid, modifierProposalId);
        if (cancelled) return;
        if (!row) {
          setError("Proposition introuvable ou vous n'avez pas accès à cette offre.");
          return;
        }
        modifierHydratedRef.current = modifierProposalId;
        lastLoadedProposalRowRef.current = row;
        pendingProposalFieldSyncRef.current = true;
        inviteSellerIdsFromLoadedProposalRef.current =
          row.invites?.map((i) => i.seller_id).filter((id): id is string => typeof id === 'string' && id.length > 0) ?? [];
        setEditingProposalId(row.id);
        applyLoadedProposalRow(row);
        const urls = Array.isArray(row.photo_urls) ? row.photo_urls : [];
        setPhotoItems(
          urls
            .filter((u): u is string => typeof u === 'string' && u.trim().length > 0)
            .map((u) => ({ kind: 'remote' as const, url: u.trim() })),
        );
        router.replace('/proposer-piece', { scroll: false });
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Impossible de charger la proposition.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authLoading, user?.uid, modifierProposalId, router, applyLoadedProposalRow]);

  draftPayloadRef.current = {
    step, category, genre, articleType, customCategory, brand, customBrand, marqueSearchQuery,
    model, customModel, modeleSearchQuery, condition, material, materialSearchQuery, customMaterial,
    color, colorSearchQuery, customColor, size, sizeSearchQuery, titleSuffix, description, heightCm, widthCm, year,
    contenuInclus, price, acceptCguCgv,
    contactFirstName, contactLastName, contactEmail, contactPhone, contactMessage,
    selectedLocations,
    selectedSellerIds,
  };
  useEffect(() => {
    if (draftTimeoutRef.current) clearTimeout(draftTimeoutRef.current);
    const save = () => {
      try {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(DRAFT_KEY_NEW, JSON.stringify(draftPayloadRef.current));
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
    step, category, genre?.join(','), articleType, customCategory, brand, customBrand, marqueSearchQuery,
    model, customModel, modeleSearchQuery, condition, material, materialSearchQuery, customMaterial,
    color, colorSearchQuery, customColor, size, sizeSearchQuery, titleSuffix, description, heightCm, widthCm, year,
    JSON.stringify(contenuInclus), price, acceptCguCgv,
    contactFirstName, contactLastName, contactEmail, contactPhone, contactMessage,
    JSON.stringify(selectedLocations), selectedSellerIds.join(','),
  ]);
  useEffect(() => {
    const onHide = () => {
      try {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(DRAFT_KEY_NEW, JSON.stringify(draftPayloadRef.current));
        }
      } catch {
        // ignore
      }
    };
    document.addEventListener('visibilitychange', onHide);
    return () => document.removeEventListener('visibilitychange', onHide);
  }, []);

  // À la sortie du formulaire (navigation, fermeture) : ne pas garder le brouillon pour la prochaine visite
  useEffect(() => {
    return () => {
      try {
        if (typeof window !== 'undefined') sessionStorage.removeItem(DRAFT_KEY_NEW);
      } catch {
        // ignore
      }
    };
  }, []);
  const categoryListRef = useRef<HTMLDivElement>(null);
  const typeListRef = useRef<HTMLDivElement>(null);
  const marqueListRef = useRef<HTMLDivElement>(null);
  const modeleListRef = useRef<HTMLDivElement>(null);
  const conditionListRef = useRef<HTMLDivElement>(null);
  const etatInfoRef = useRef<HTMLDivElement>(null);
  const materialListRef = useRef<HTMLDivElement>(null);
  const colorListRef = useRef<HTMLDivElement>(null);
  const sizeListRef = useRef<HTMLDivElement>(null);
  /** Conteneur champ + liste (fermeture au clic extérieur) */
  const categoryFieldRef = useRef<HTMLDivElement>(null);
  const typeFieldRef = useRef<HTMLDivElement>(null);
  const marqueFieldRef = useRef<HTMLDivElement>(null);
  const modeleFieldRef = useRef<HTMLDivElement>(null);
  const sizeFieldRef = useRef<HTMLDivElement>(null);
  const materialFieldRef = useRef<HTMLDivElement>(null);
  const colorFieldRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!step1Dropdown) return;
    const fieldRefs: Record<Step1DropdownId, RefObject<HTMLDivElement | null>> = {
      category: categoryFieldRef,
      type: typeFieldRef,
      marque: marqueFieldRef,
      modele: modeleFieldRef,
      size: sizeFieldRef,
      condition: etatInfoRef,
      material: materialFieldRef,
      color: colorFieldRef,
    };
    const onMouseDown = (e: MouseEvent) => {
      const root = fieldRefs[step1Dropdown]?.current;
      if (root?.contains(e.target as Node)) return;
      setStep1Dropdown(null);
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [step1Dropdown]);

  // Étape 2
  const [hoveredPhotoIndex, setHoveredPhotoIndex] = useState<number | null>(null);
  const [photoDropTargetIndex, setPhotoDropTargetIndex] = useState<number | null>(null);
  const [draggingPhotoIndex, setDraggingPhotoIndex] = useState<number | null>(null);
  const [photoRejectMessage, setPhotoRejectMessage] = useState<string | null>(null);

  const maxPhotos = 9;
  const appendProposalPhotos = useCallback((acceptedFiles: File[], fileRejections: FileRejection[]) => {
    let rejectedCountForMessage = 0;
    setPhotoItems((prev) => {
      const remaining = maxPhotos - prev.length;
      if (remaining <= 0) {
        rejectedCountForMessage = acceptedFiles.length + fileRejections.length;
        return prev;
      }
      const validFiles = acceptedFiles.filter((f) => validateImageFile(f).ok);
      const toAdd = validFiles.slice(0, remaining);
      rejectedCountForMessage =
        fileRejections.length +
        (acceptedFiles.length - validFiles.length) +
        Math.max(0, validFiles.length - remaining);
      return [...prev, ...toAdd.map((file) => ({ kind: 'file' as const, file }))];
    });
    if (rejectedCountForMessage > 0) {
      if (photoAdditionHasOversizeFile(acceptedFiles, fileRejections)) {
        setPhotoRejectMessage(PHOTO_MAX_SIZE_PER_FILE_SHORT_HINT);
      } else {
        setPhotoRejectMessage(
          rejectedCountForMessage === 1
            ? `1 fichier non ajouté : max ${MAX_FILE_SIZE_MB} Mo/photo, types JPEG ou PNG.`
            : `${rejectedCountForMessage} fichiers non ajoutés : max ${MAX_FILE_SIZE_MB} Mo/photo, types JPEG ou PNG.`
        );
      }
    } else {
      setPhotoRejectMessage(null);
    }
  }, []);
  const onDropPhotos = useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      appendProposalPhotos(acceptedFiles, fileRejections);
    },
    [appendProposalPhotos]
  );
  useEffect(() => {
    if (!photoRejectMessage) return;
    const ms = photoRejectMessage === PHOTO_MAX_SIZE_PER_FILE_SHORT_HINT ? 7000 : 5000;
    const t = setTimeout(() => setPhotoRejectMessage(null), ms);
    return () => clearTimeout(t);
  }, [photoRejectMessage]);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onDropPhotos,
    accept: { 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'] },
    maxFiles: maxPhotos - photoItems.length,
    maxSize: MAX_FILE_SIZE_BYTES,
    disabled: photoItems.length >= maxPhotos,
  });
  const handleRemovePhoto = (index: number) => {
    setPhotoItems((prev) => prev.filter((_, i) => i !== index));
  };
  const handleMovePhoto = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    setPhotoItems((prev) => {
      const next = [...prev];
      const [removed] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, removed);
      return next;
    });
  };

  // Étape 3
  // Fermer le tooltip État (i) au clic ailleurs sur la page
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(etatInfoClicked || etatInfoHover)) return;
      const el = etatInfoRef.current;
      if (el && !el.contains(e.target as Node)) {
        setEtatInfoClicked(false);
        setEtatInfoHover(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [etatInfoClicked, etatInfoHover]);

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

  // Modèles selon catégorie, marque, genre et type de produit — sans préfixe type dans les propositions
  const brandForModels = brand || marqueSearchQuery.trim();
  const hasTypeCategory = category === 'vetements' || category === 'sacs' || category === 'bijoux' || category === 'chaussures' || category === 'accessoires';
  const effectiveArticleType = articleType.includes('::') ? articleType.split('::')[0] : articleType;
  const modelOptions = (() => {
    if (!category || category === 'autre' || genre.length === 0) return [];
    // Pour les catégories avec type de produit : n'afficher des modèles que si type ET marque sont choisis
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
    const excludedAsCategory = category ? (MODELE_EXCLU_QUAND_IDENTIQUE_CATEGORIE[category] ?? []) : [];
    const articleTypeLabels = (category === 'vetements' || category === 'sacs' || category === 'bijoux' || category === 'chaussures' || category === 'accessoires') ? getArticleTypeLabelsForCategory(category, genre) : [];
    const raw = [...set]
      .filter((m) => m !== 'Autre' && !excludedAsCategory.includes(m))
      .filter((m) => !MODELES_EXCLUS_DEPOT_ANNONCE.has(m))
      .filter((m) => (category !== 'vetements' || !MODELE_VETEMENTS_GENERIQUES_EXCLUS.has(m)))
      .filter((m) => modelMatchesArticleType(m, effectiveArticleType, category, brandForModels))
      .filter((m) => !articleTypeLabels.includes(m))
      .filter((m) => !category || !isModelNameATypeLabel(category, m))
      .sort((a, b) => a.localeCompare(b, 'fr'));
    return raw;
  })();

  const modelOptionsKey = modelOptions.join('\u0001');

  useLayoutEffect(() => {
    if (!pendingProposalFieldSyncRef.current || !editingProposalId) return;
    const row = lastLoadedProposalRowRef.current;
    if (!row || row.id !== editingProposalId) return;
    pendingProposalFieldSyncRef.current = false;

    const m = (row.model || '').trim();
    if (modelOptions.length > 0) {
      setModel(modelOptions.includes(m) ? m : '');
      setModeleSearchQuery(m);
      setCustomModel('');
    } else {
      setCustomModel(m);
      setModel('');
      setModeleSearchQuery('');
    }
  }, [editingProposalId, modelOptionsKey, modelOptions.length]);

  // Matières selon catégorie (sans "Autre" : saisie libre dans le champ comme marque/modèle)
  const materialOptions = category ? (MATIERES_BY_CATEGORY[category] ?? MATERIALS).filter((o) => o.value !== 'other') : [];

  // Couleurs selon catégorie (sans "Autre" : saisie libre dans le champ)
  const colorOptions = category ? (COLORS_BY_CATEGORY[category] ?? COLORS).filter((o) => o.value !== 'other') : [];

  // Resynchroniser la partie personnalisable du titre quand le modèle ou le type changent (sauf si le vendeur l'a modifiée à la main)
  useEffect(() => {
    if (titleManuallyEditedRef.current) return;
    const categoryLabel = category === 'autre' ? customCategory.trim() : (CATEGORIES.find((c) => c.value === category)?.label || category);
    const modelForTitle = modelOptions.length > 0 ? (model || modeleSearchQuery.trim() || null) : (customModel.trim() || null);
    const typeLabelForTitle = getArticleTypeSingleLabelForTitle(category, genre, articleType);
    const suggested = [typeLabelForTitle, modelForTitle].filter(Boolean).join(' ').trim() || categoryLabel || '';
    setTitleSuffix(suggested);
  }, [category, customCategory, brand, marqueSearchQuery, model, modeleSearchQuery, customModel, genre, articleType, modelOptions.length]);

  const clearPropositionGeolocation = useCallback(() => {
    setBuyerLatLon(null);
    setGeoError(null);
    setGeoLoading(false);
  }, []);

  const requestPropositionGeolocation = useCallback(() => {
    setGeoError(null);
    setGeoLoading(true);
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGeoError("La géolocalisation n'est pas supportée par votre navigateur.");
      setGeoLoading(false);
      return;
    }
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      setGeoError(
        "La géolocalisation n'est disponible qu'en HTTPS. Ouvrez le site avec une adresse commençant par https:// (ou utilisez localhost en développement).",
      );
      setGeoLoading(false);
      return;
    }
    const options: PositionOptions = {
      enableHighAccuracy: false,
      timeout: 15000,
      maximumAge: 300000,
    };
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setBuyerLatLon({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setGeoError(null);
        setGeoLoading(false);
      },
      (err: GeolocationPositionError) => {
        const code = err?.code ?? 0;
        const isSecure = typeof window !== 'undefined' && window.isSecureContext;
        const message =
          code === 1
            ? !isSecure
              ? "La géolocalisation n'est disponible qu'en HTTPS. Ouvrez le site avec une adresse sécurisée (https://) pour utiliser le filtre par rayon."
              : "Localisation refusée. Vérifiez les autorisations du site : cliquez sur l'icône (cadenas ou i) à gauche de l'adresse et autorisez la localisation."
            : code === 2
              ? 'Position indisponible. Vérifiez que la localisation est activée sur votre appareil.'
              : code === 3
                ? 'Délai dépassé. Réessayez dans un endroit avec meilleur signal.'
                : "Impossible d'obtenir votre position. Vérifiez les autorisations du navigateur et réessayez.";
        setGeoError(message);
        setGeoLoading(false);
      },
      options,
    );
  }, []);

  const handleLocationsChange = useCallback(
    (next: SaleProposalLocationEntry[]) => {
      setSelectedLocations(next);
      if (next.length > 0) {
        setRadiusKm(0);
        clearPropositionGeolocation();
      }
    },
    [clearPropositionGeolocation],
  );

  const handlePropositionRadiusKmChange = useCallback(
    (km: number) => {
      setRadiusKm(km);
      if (km > 0) {
        setSelectedLocations([]);
      }
      if (km === 0) clearPropositionGeolocation();
    },
    [clearPropositionGeolocation],
  );

  useEffect(() => {
    if (step !== 4) return;
    if (!isSupabaseConfigured || !supabase) {
      setEligibleSellers([]);
      setEligibleLoading(false);
      return;
    }
    const sb = supabase;

    type EligibleRow = {
      id: string;
      companyName: string;
      addressLine: string;
      subscriptionTier: string;
      avatarUrl: string | null;
    };

    const mergeInvitedIntoRows = async (rows: EligibleRow[]): Promise<EligibleRow[]> => {
      if (!editingProposalId) return rows;
      const inviteIds = inviteSellerIdsFromLoadedProposalRef.current;
      if (inviteIds.length === 0) return rows;
      const have = new Set(rows.map((r) => r.id));
      const missing = inviteIds.filter((id) => !have.has(id));
      if (missing.length === 0) return rows;
      const { data: extraData, error: extraErr } = await sb
        .from('sellers')
        .select('id, company_name, address, city, postcode, subscription_tier, avatar_url')
        .in('id', missing)
        .eq('status', 'approved');
      if (extraErr || !extraData?.length) return rows;
      const extra = extraData
        .filter(
          (s) =>
            normalizeSubscriptionTier(s.subscription_tier) === 'plus' ||
            normalizeSubscriptionTier(s.subscription_tier) === 'pro',
        )
        .map(
          (s): EligibleRow => ({
            id: s.id,
            companyName: s.company_name?.trim() || 'Vendeur',
            addressLine: sellerRowToPropositionAddressLine(s as Record<string, unknown>),
            subscriptionTier: s.subscription_tier || 'plus',
            avatarUrl: s.avatar_url,
          }),
        );
      const byId = new Map(rows.map((r) => [r.id, r] as const));
      for (const r of extra) byId.set(r.id, r);
      return [...byId.values()];
    };

    const finishWithRows = (rows: EligibleRow[]) => {
      setEligibleSellers(rows);
      setSelectedSellerIds((prev) => prev.filter((id) => rows.some((r) => r.id === id)));
      setEligibleLoading(false);
    };

    if (radiusKm > 0) {
      if (!buyerLatLon) {
        if (editingProposalId && inviteSellerIdsFromLoadedProposalRef.current.length > 0) {
          let cancelled = false;
          setEligibleLoading(true);
          void (async () => {
            const merged = await mergeInvitedIntoRows([]);
            if (cancelled) return;
            finishWithRows(merged);
          })();
          return () => {
            cancelled = true;
          };
        }
        setEligibleSellers([]);
        setEligibleLoading(false);
        return;
      }
      let cancelled = false;
      setEligibleLoading(true);
      void (async () => {
        const { data, error } = await sb
          .from('sellers')
          .select('id, company_name, address, city, postcode, subscription_tier, avatar_url')
          .eq('status', 'approved')
          .in('subscription_tier', ['plus', 'pro']);
        if (cancelled) return;
        if (error || !data) {
          const merged = await mergeInvitedIntoRows([]);
          if (cancelled) return;
          finishWithRows(merged);
          return;
        }
        const raw = data as {
          id: string;
          company_name: string | null;
          address: string | null;
          city: string | null;
          postcode: string | null;
          subscription_tier: string | null;
          avatar_url: string | null;
        }[];
        const cache = new Map<string, { lat: number; lon: number } | null>();
        const rows: EligibleRow[] = [];
        for (const s of raw) {
          if (
            normalizeSubscriptionTier(s.subscription_tier) !== 'plus' &&
            normalizeSubscriptionTier(s.subscription_tier) !== 'pro'
          ) {
            continue;
          }
          const pc = s.postcode?.replace(/\s/g, '').trim() || '';
          if (!pc) continue;
          const key = pc.slice(0, 5);
          if (!cache.has(key)) {
            cache.set(key, await fetchCoordsForPostcode(key));
          }
          if (cancelled) return;
          const c = cache.get(key);
          if (!c) continue;
          if (haversineKm(buyerLatLon, c) <= radiusKm) {
            rows.push({
              id: s.id,
              companyName: s.company_name?.trim() || 'Vendeur',
              addressLine: sellerRowToPropositionAddressLine(s as Record<string, unknown>),
              subscriptionTier: s.subscription_tier || 'plus',
              avatarUrl: s.avatar_url,
            });
          }
        }
        const merged = await mergeInvitedIntoRows(rows);
        if (cancelled) return;
        finishWithRows(merged);
      })();
      return () => {
        cancelled = true;
      };
    }

    const prefixes = unionPrefixes(selectedLocations);
    if (prefixes.length === 0) {
      if (editingProposalId && inviteSellerIdsFromLoadedProposalRef.current.length > 0) {
        let cancelled = false;
        setEligibleLoading(true);
        void (async () => {
          const merged = await mergeInvitedIntoRows([]);
          if (cancelled) return;
          finishWithRows(merged);
        })();
        return () => {
          cancelled = true;
        };
      }
      setEligibleSellers([]);
      setEligibleLoading(false);
      return;
    }
    let cancelled = false;
    setEligibleLoading(true);
    void (async () => {
      const { data, error } = await sb
        .from('sellers')
        .select('id, company_name, address, city, postcode, subscription_tier, avatar_url')
        .eq('status', 'approved')
        .in('subscription_tier', ['plus', 'pro']);
      if (cancelled) return;
      if (error || !data) {
        const merged = await mergeInvitedIntoRows([]);
        if (cancelled) return;
        finishWithRows(merged);
        return;
      }
      const rows = (
        data as {
          id: string;
          company_name: string | null;
          address: string | null;
          city: string | null;
          postcode: string | null;
          subscription_tier: string | null;
          avatar_url: string | null;
        }[]
      )
        .filter(
          (s) =>
            (normalizeSubscriptionTier(s.subscription_tier) === 'plus' ||
              normalizeSubscriptionTier(s.subscription_tier) === 'pro') &&
            sellerPostcodeMatchesPrefixes(s.postcode, prefixes),
        )
        .map(
          (s): EligibleRow => ({
            id: s.id,
            companyName: s.company_name?.trim() || 'Vendeur',
            addressLine: sellerRowToPropositionAddressLine(s as Record<string, unknown>),
            subscriptionTier: s.subscription_tier || 'plus',
            avatarUrl: s.avatar_url,
          }),
        );
      const merged = await mergeInvitedIntoRows(rows);
      if (cancelled) return;
      finishWithRows(merged);
    })();
    return () => {
      cancelled = true;
    };
  }, [step, selectedLocations, radiusKm, buyerLatLon, editingProposalId]);

  if (authLoading) return <ProposerVenteAuthSkeleton />;
  if (!user) {
    router.replace('/connexion?redirect=/proposer-piece');
    return null;
  }
  if (isSeller) {
    router.replace('/vendeur/annonces');
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
    if ((category === 'vetements' || category === 'sacs' || category === 'bijoux' || category === 'chaussures' || category === 'accessoires') && !articleType) {
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
    if (photoItems.length < 1) {
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
    const priceNum = parseListingPriceInputToNumber(price);
    if (priceNum == null) {
      setError('Indiquez un prix souhaité en euros entiers, sans centimes (ex. 5000)');
      return false;
    }
    if (radiusKm > 0) {
      if (geoLoading) {
        setError('Localisation en cours… patientez un instant.');
        return false;
      }
      if (!buyerLatLon) {
        setError(
          geoError ||
            'Autorisez la géolocalisation pour utiliser le filtre par rayon, ou repassez le curseur sur « — — » et choisissez une ville ou une région.',
        );
        return false;
      }
    }
    if (selectedSellerIds.length === 0) {
      setError(
        'Sélectionnez au moins un vendeur professionnel (Plus ou Pro). Si la liste est vide, définissez une zone (localisation ou rayon) pour afficher les vendeurs éligibles.',
      );
      return false;
    }
    if (!editingProposalId && selectedLocations.length === 0 && radiusKm === 0) {
      setError('Ajoutez au moins une localisation (ville, code postal ou région)');
      return false;
    }
    setError('');
    return true;
  };

  const validateStep5 = () => {
    if (!contactFirstName.trim()) {
      setError('Indiquez votre prénom');
      return false;
    }
    if (!contactLastName.trim()) {
      setError('Indiquez votre nom');
      return false;
    }
    const em = contactEmail.trim();
    if (!em) {
      setError('Indiquez votre e-mail');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
      setError('E-mail invalide');
      return false;
    }
    setError('');
    return true;
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    if (step === 3 && !validateStep3()) return;
    if (step === 4 && !validateStep4()) return;
    setError('');
    setStep((s) => Math.min(s + 1, 5));
  };

  const handleBack = () => {
    setError('');
    setStep((s) => Math.max(s - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCguCgvError('');
    if (!acceptCguCgv) {
      setCguCgvError(
        'Veuillez accepter les conditions générales d’utilisation, les conditions générales de vente et la politique de confidentialité pour envoyer votre proposition.',
      );
      return;
    }
    if (!validateStep4()) return;
    if (!validateStep5()) return;

    setLoading(true);
    setError('');

    try {
      const categoryLabel = category === 'autre' ? customCategory.trim() : (CATEGORIES.find((c) => c.value === category)?.label || category);
      const brandToSave = (brand.trim() || marqueSearchQuery.trim()).trim();
      const modelToSave = modelOptions.length > 0 ? (model || modeleSearchQuery.trim() || null) : (customModel.trim() || null);
      const materialToSave = (material || materialSearchQuery.trim() || null) || null;
      const colorToSave = (color || colorSearchQuery.trim() || null) || null;
      const typeLabelForTitle = getArticleTypeSingleLabelForTitle(category, genre, articleType);
      const suggestedSuffix = [typeLabelForTitle, modelToSave].filter(Boolean).join(' ').trim() || categoryLabel || '';
      const finalTitle = brandToSave ? `${brandToSave} - ${(titleSuffix.trim() || suggestedSuffix).trim()}` : (titleSuffix.trim() || suggestedSuffix).trim();
      const priceNum = parseListingPriceInputToNumber(price);
      if (priceNum == null) {
        setError('Indiquez un prix en euros entiers, sans centimes (ex. 5000)');
        setLoading(false);
        return;
      }

      const buyerContactPayload: SaleProposalBuyerContact = {
        firstName: contactFirstName.trim(),
        lastName: contactLastName.trim(),
        email: contactEmail.trim(),
        message: contactMessage.trim(),
      };
      const phoneTrim = contactPhone.trim();
      if (phoneTrim) buyerContactPayload.phone = phoneTrim;

      const payload = {
        title: finalTitle,
        description: description.trim() || '',
        category: category === 'autre' ? customCategory.trim().toLowerCase() : category,
        genre: genre.length > 0 ? genre : null,
        articleType:
          (category === 'vetements' || category === 'sacs' || category === 'bijoux' || category === 'chaussures' || category === 'accessoires') && articleType
            ? articleType
            : null,
        brand: brandToSave || null,
        model: modelToSave || null,
        condition: condition || null,
        material: materialToSave,
        color: colorToSave,
        heightCm:
          category === 'chaussures' || category === 'vetements'
            ? null
            : heightCm
              ? parseFloat(heightCm.replace(',', '.'))
              : null,
        widthCm:
          category === 'chaussures' || category === 'vetements'
            ? null
            : widthCm
              ? parseFloat(widthCm.replace(',', '.'))
              : null,
        year: year ? parseInt(year, 10) : null,
        packaging:
          CONTENU_INCLUS_OPTIONS.filter((o) => contenuInclus[o.value] === true).map((o) => o.value).length > 0
            ? CONTENU_INCLUS_OPTIONS.filter((o) => contenuInclus[o.value] === true).map((o) => o.value)
            : null,
        size:
          category === 'montres'
            ? widthCm
              ? String(Math.round(parseFloat(String(widthCm).replace(',', '.')) * 10))
              : null
            : category === 'chaussures' || category === 'vetements'
              ? size || sizeSearchQuery.trim() || null
              : null,
        wishPriceCents: Math.round(priceNum * 100),
        locations: selectedLocations,
        invitedSellerIds: selectedSellerIds,
        buyerContact: buyerContactPayload,
      };

      let proposalId: string;
      if (editingProposalId) {
        await updateVisitorSaleProposalWithInvites(editingProposalId, user!.uid, payload);
        proposalId = editingProposalId;
      } else {
        proposalId = await createSaleProposalWithInvites({
          visitorId: user!.uid,
          ...payload,
        });
      }

      const remoteUrlsForIndex = photoItems
        .filter((i): i is { kind: 'remote'; url: string } => i.kind === 'remote')
        .map((i) => i.url);
      const uploadStartIndex = maxSaleProposalPhotoIndexFromUrls(remoteUrlsForIndex) + 1;
      const filesToUpload = photoItems
        .filter((i): i is { kind: 'file'; file: File } => i.kind === 'file')
        .map((i) => i.file);
      let uploadedNew: string[] = [];
      if (filesToUpload.length > 0) {
        uploadedNew = await uploadSaleProposalPhotos(user!.uid, proposalId, filesToUpload, uploadStartIndex);
      }
      let u = 0;
      const finalPhotoUrls = photoItems.map((item) => (item.kind === 'remote' ? item.url : uploadedNew[u++]));
      if (finalPhotoUrls.length > 0) {
        const { supabase: sb } = await import('@/lib/supabase/client');
        if (sb) {
          await sb.from('sale_proposals').update({ photo_urls: finalPhotoUrls }).eq('id', proposalId).eq('visitor_id', user!.uid);
        }
      }

      try {
        if (typeof window !== 'undefined') {
          localStorage.removeItem(DRAFT_KEY_NEW);
          sessionStorage.removeItem(DRAFT_KEY_NEW);
        }
      } catch {
        // ignore
      }
      await fetch('/api/cgu-cgv-acceptance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user!.uid, context: 'proposition_vente' }),
      });

      setEditingProposalId(null);
      inviteSellerIdsFromLoadedProposalRef.current = [];
      router.push('/propositions');
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : typeof (err as { message?: string })?.message === 'string'
            ? (err as { message: string }).message
            : 'Une erreur est survenue';
      if (process.env.NODE_ENV === 'development' && err instanceof Error) {
        console.error(editingProposalId ? '[updateSaleProposal]' : '[createSaleProposal]', message, err);
      }
      const storageObjectTooLarge = /exceeded the maximum allowed size/i.test(message);
      setError(
        storageObjectTooLarge
          ? `Le stockage Supabase refuse le fichier (limite du bucket « listings » trop basse). Prévu côté app : ${PHOTO_MAX_SIZE_PER_FILE_SHORT_HINT}. Exécutez la migration storage_listings_bucket_file_size_10mb.sql ou augmentez la limite du bucket dans Storage → listings.`
          : message.includes('Storage') || message.includes('upload')
            ? `Erreur lors de l'upload des photos. Détail : ${message}`
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
    <div style={{ paddingTop: 'var(--header-height)', minHeight: '100vh' }}>
      {/* Ligne titre : Retour à gauche (comme Modifier l'annonce), Déposer une annonce au centre */}
      <div className="deposer-annonce-title-row" style={{ padding: '30px 24px 0', marginBottom: 28, maxWidth: 1100, marginLeft: 'auto', marginRight: 'auto' }}>
        <Link
          href="/"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#6e6e73', textDecoration: 'none', flexShrink: 0 }}
          className="hover:opacity-80 deposer-annonce-back-link"
          aria-label="Retour à l'accueil"
        >
          <ArrowLeft size={18} />
          <span className="deposer-annonce-back-link-text">Retour à l&apos;accueil</span>
        </Link>
        <div className="deposer-annonce-title-center">
          <h1
            style={{
              fontFamily: 'var(--font-playfair), Georgia, serif',
              fontSize: 28,
              fontWeight: 500,
              margin: '0 0 8px',
              color: '#1d1d1f',
              letterSpacing: '-0.02em',
            }}
          >
            Proposer une pièce
          </h1>
          <p style={{ fontSize: 15, color: '#6e6e73', margin: 0 }}>
            <span className="deposer-annonce-subtitle-desktop">Proposer une pièce aux vendeurs</span>
            <span className="deposer-annonce-subtitle-mobile">Proposer une pièce aux vendeurs</span>
          </p>
        </div>
        <div className="deposer-annonce-title-spacer" aria-hidden />
      </div>

      <div className="deposer-annonce-form-inner" style={{ maxWidth: 520, margin: '0 auto', padding: '0 24px 80px' }}>
        <div className="deposer-annonce-steps-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 4 }}>
          {[1, 2, 3, 4, 5].map((s, i) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
              <div
                className="deposer-annonce-step-circle"
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
                  flexShrink: 0,
                }}
              >
                {step > s ? <Check size={18} /> : s}
              </div>
              {i < 4 && (
                <div
                  className="deposer-annonce-steps-connector"
                  style={{
                    width: 28,
                    height: 2,
                    backgroundColor: step > s ? '#1d1d1f' : '#d2d2d7',
                    margin: '0 6px',
                    borderRadius: 1,
                  }}
                />
              )}
            </div>
          ))}
        </div>
        <p style={{ textAlign: 'center', fontSize: 14, fontWeight: 500, color: '#6e6e73', margin: '0 0 28px' }}>
          {STEP_TITLES[step - 1] ?? ''}
        </p>

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
                          setStep1Dropdown(null);
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
                          setStep1Dropdown(null);
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
                <div ref={categoryFieldRef} style={{ marginBottom: 18, position: 'relative' }}>
                  <label style={labelStyle}>Catégorie <span style={{ color: '#1d1d1f' }}>*</span></label>
                  <button
                    type="button"
                    onClick={() => genre.length > 0 && setStep1Dropdown((d) => (d === 'category' ? null : 'category'))}
                    onBlur={blurStep1Dropdown('category')}
                    disabled={genre.length === 0}
                    style={{
                      ...inputStyle,
                      textAlign: 'left',
                      cursor: genre.length > 0 ? 'pointer' : 'not-allowed',
                      color: category ? '#1d1d1f' : '#86868b',
                      opacity: genre.length > 0 ? 1 : 0.7,
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2386868b' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 14px center',
                      paddingRight: 40,
                    }}
                  >
                    {genre.length === 0 ? (
                      <>
                        <span className="deposer-annonce-category-placeholder-desktop">Sélectionner d&apos;abord un ou des Genre(s)</span>
                        <span className="deposer-annonce-category-placeholder-mobile">Sélectionner d&apos;abord Genre</span>
                      </>
                    ) : category ? (categoryOptions.find((o) => o.value === category)?.label ?? category) : 'Sélectionner une catégorie'}
                  </button>
                  {step1Dropdown === 'category' && genre.length > 0 && (
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
                            setArticleType(''); // réinitialiser le type dès que la catégorie change
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
                            setStep1Dropdown(null);
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
                <div ref={typeFieldRef} style={{ marginBottom: 18, position: 'relative' }}>
                  <label style={labelStyle}>Type de produit <span style={{ color: '#1d1d1f' }}>*</span></label>
                  {(() => {
                    const articleTypeOptions = category === 'vetements' ? getArticleTypeOptionsForForm(getVetementsTypesForGenre(genre)) : category === 'sacs' ? getArticleTypeOptionsForForm(getSacsTypesForGenre(genre)) : category === 'bijoux' ? getArticleTypeOptionsForForm(getBijouxTypesForGenre(genre)) : category === 'chaussures' ? getArticleTypeOptionsForForm(getChaussuresTypesForGenre(genre)) : getArticleTypeOptionsForForm(getAccessoiresTypesForGenre(genre));
                    return (
                      <>
                        <button
                          type="button"
                          onClick={() => genre.length > 0 && setStep1Dropdown((d) => (d === 'type' ? null : 'type'))}
                          onBlur={blurStep1Dropdown('type')}
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
                        {step1Dropdown === 'type' && genre.length > 0 && (
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
                                key={`${opt.value}-${opt.label}`}
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => {
                                  setArticleType(opt.value);
                                  setStep1Dropdown(null);
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
                    <input
                      type="text"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      placeholder="Indiquez la catégorie"
                      style={inputStyle}
                    />
                  </div>
                )}
                <div ref={marqueFieldRef} style={{ marginBottom: 18, position: 'relative' }}>
                  <label style={labelStyle}>Marque <span style={{ color: '#1d1d1f' }}>*</span></label>
                  {(() => {
                    const hasTypeCategory = category === 'vetements' || category === 'sacs' || category === 'bijoux' || category === 'chaussures' || category === 'accessoires';
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
                      setStep1Dropdown('marque');
                    }}
                    onFocus={() => { if (!marqueDisabled) setStep1Dropdown('marque'); }}
                    onBlur={blurStep1Dropdown('marque')}
                    placeholder={marquePlaceholder}
                    disabled={marqueDisabled}
                    style={{
                      ...inputStyle,
                      cursor: marqueDisabled ? 'not-allowed' : 'text',
                      opacity: marqueDisabled ? 0.7 : 1,
                    }}
                  />
                  {!marqueDisabled && step1Dropdown === 'marque' && brandOptions.filter((opt) => !marqueSearchQuery.trim() || opt.label.toLowerCase().includes(marqueSearchQuery.trim().toLowerCase())).length > 0 && (
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
                              setStep1Dropdown(null);
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
                <div ref={modeleFieldRef} style={{ marginBottom: 18, position: 'relative' }}>
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
                          setStep1Dropdown('modele');
                        }}
                        onFocus={() => { if (!modeleDisabled) setStep1Dropdown('modele'); }}
                        onBlur={blurStep1Dropdown('modele')}
                        placeholder={modelePlaceholder}
                        disabled={modeleDisabled}
                        style={{
                          ...inputStyle,
                          cursor: modeleDisabled ? 'not-allowed' : 'text',
                          opacity: modeleDisabled ? 0.7 : 1,
                        }}
                      />
                      {!modeleDisabled && step1Dropdown === 'modele' && modelOptions.filter((name) => !modeleSearchQuery.trim() || name.toLowerCase().includes(modeleSearchQuery.trim().toLowerCase())).length > 0 && (
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
                                  setStep1Dropdown(null);
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
                  <div ref={sizeFieldRef} style={{ marginBottom: 18, position: 'relative' }}>
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
                        setStep1Dropdown('size');
                      }}
                      onFocus={() => { if (!sizeDisabled) setStep1Dropdown('size'); }}
                      onBlur={blurStep1Dropdown('size')}
                      placeholder={sizePlaceholder}
                      disabled={sizeDisabled}
                      style={{
                        ...inputStyle,
                        cursor: sizeDisabled ? 'not-allowed' : 'text',
                        opacity: sizeDisabled ? 0.7 : 1,
                      }}
                    />
                    {!sizeDisabled && step1Dropdown === 'size' && (() => {
                      const m = (model || modeleSearchQuery.trim()).toLowerCase();
                      const isPantalon = category === 'vetements' && (m === 'pantalon' || m.includes('pantalon'));
                      const isJean = category === 'vetements' && (m === 'jean' || m.includes('jean'));
                      const isRobe = category === 'vetements' && articleType === 'robe';
                      const options = category === 'chaussures'
                        ? getShoeSizesForGenre(genre)
                        : (isPantalon || isJean || isRobe
                          ? [...CLOTHING_SIZES, ...(isPantalon ? getPantSizesForGenre(genre) : []), ...(isJean ? getJeanSizesForGenre(genre) : []), ...(isRobe ? [...ROBE_SIZES] : [])]
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
                                setStep1Dropdown(null);
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
                      onClick={() => setStep1Dropdown((d) => (d === 'condition' ? null : 'condition'))}
                      onBlur={blurStep1Dropdown('condition')}
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
                  {step1Dropdown === 'condition' && (
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
                            setStep1Dropdown(null);
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
                <div ref={materialFieldRef} style={{ marginBottom: 18, position: 'relative' }}>
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
                          setStep1Dropdown('material');
                        }}
                        onFocus={() => { if (!matiereDisabled) setStep1Dropdown('material'); }}
                        onBlur={blurStep1Dropdown('material')}
                        placeholder={matiereDisabled ? 'Sélectionner d\'abord un modèle' : 'Rechercher ou préciser la matière…'}
                        disabled={matiereDisabled}
                        style={{
                          ...inputStyle,
                          cursor: matiereDisabled ? 'not-allowed' : 'text',
                          opacity: matiereDisabled ? 0.7 : 1,
                        }}
                      />
                      {!matiereDisabled && step1Dropdown === 'material' && materialOptions.filter((opt) => !materialSearchQuery.trim() || opt.label.toLowerCase().includes(materialSearchQuery.trim().toLowerCase())).length > 0 && (
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
                                  setStep1Dropdown(null);
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
                <div ref={colorFieldRef} style={{ marginBottom: 24, position: 'relative' }}>
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
                          setStep1Dropdown('color');
                        }}
                        onFocus={() => { if (!couleurDisabled) setStep1Dropdown('color'); }}
                        onBlur={blurStep1Dropdown('color')}
                        placeholder={couleurDisabled ? 'Sélectionner d\'abord un modèle' : 'Rechercher ou préciser la couleur…'}
                        disabled={couleurDisabled}
                        style={{
                          ...inputStyle,
                          cursor: couleurDisabled ? 'not-allowed' : 'text',
                          opacity: couleurDisabled ? 0.7 : 1,
                        }}
                      />
                      {!couleurDisabled && step1Dropdown === 'color' && colorOptions.filter((opt) => !colorSearchQuery.trim() || opt.label.toLowerCase().includes(colorSearchQuery.trim().toLowerCase())).length > 0 && (
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
                                  setStep1Dropdown(null);
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
                  <label style={labelStyle}>Déposer les photos <span style={{ color: '#1d1d1f' }}>*</span></label>
                  <p style={{ fontSize: 12, color: '#86868b', marginBottom: 12 }}>
                    La première photo sera l&apos;image principale.
                  </p>

                  {photoItems.length < maxPhotos && (
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
                        cursor: photoItems.length >= maxPhotos ? 'not-allowed' : 'pointer',
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
                          Maximum 9 photos — 10 Mo max/photo. Types JPEG, PNG.
                        </span>
                      </div>
                    </div>
                  )}

                  {photoRejectMessage && (
                    <p style={{ fontSize: 12, color: '#e53935', marginTop: 8, marginBottom: 0 }}>
                      {photoRejectMessage}
                    </p>
                  )}

                  {photoItems.length > 0 && (
                    <p style={{ fontSize: 12, color: '#86868b', marginTop: 8, marginBottom: 0 }}>
                      Glissez une photo pour modifier l&apos;ordre
                    </p>
                  )}
                  {photoItems.length > 0 && (() => {
                    const isDragging = draggingPhotoIndex !== null && photoDropTargetIndex !== null;
                    const displaySlots: Array<{ type: 'photo'; url: string; originalIndex: number } | { type: 'placeholder' }> = isDragging
                      ? (() => {
                          const rest = photoItems
                            .map((_, origIndex) => ({
                              type: 'photo' as const,
                              url: photoDisplayUrls[origIndex],
                              originalIndex: origIndex,
                            }))
                            .filter((x) => x.originalIndex !== draggingPhotoIndex);
                          return [
                            ...rest.slice(0, photoDropTargetIndex),
                            { type: 'placeholder' as const },
                            ...rest.slice(photoDropTargetIndex),
                          ];
                        })()
                      : photoItems.map((_, i) => ({ type: 'photo' as const, url: photoDisplayUrls[i], originalIndex: i }));
                    return (
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                        gap: 12,
                        marginTop: photoItems.length < maxPhotos ? 16 : 0,
                      }}
                      onDragOver={(e) => {
                        if ([...e.dataTransfer.types].includes('Files')) {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'copy';
                        }
                      }}
                      onDrop={(e) => {
                        if ([...e.dataTransfer.types].includes('Files') && e.dataTransfer.files.length > 0) {
                          e.preventDefault();
                          appendProposalPhotos(Array.from(e.dataTransfer.files), []);
                        }
                      }}
                    >
                      {displaySlots.map((slot, displayIndex) =>
                        slot.type === 'placeholder' ? (
                          <div
                            key="placeholder"
                            onDragOver={(e) => {
                              e.preventDefault();
                              if ([...e.dataTransfer.types].includes('Files')) {
                                e.dataTransfer.dropEffect = 'copy';
                              } else {
                                e.dataTransfer.dropEffect = 'move';
                                setPhotoDropTargetIndex(displayIndex);
                              }
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              if (e.dataTransfer.files.length > 0) {
                                e.stopPropagation();
                                appendProposalPhotos(Array.from(e.dataTransfer.files), []);
                                setDraggingPhotoIndex(null);
                                setPhotoDropTargetIndex(null);
                                return;
                              }
                              const from = parseInt(e.dataTransfer.getData('text/plain'), 10);
                              if (!Number.isNaN(from) && from !== displayIndex) handleMovePhoto(from, displayIndex);
                              setDraggingPhotoIndex(null);
                              setPhotoDropTargetIndex(null);
                            }}
                            style={{
                              aspectRatio: 1,
                              borderRadius: 12,
                              border: '2px dashed #1d1d1f',
                              backgroundColor: 'rgba(29,29,31,0.06)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#1d1d1f',
                              fontSize: 11,
                              fontWeight: 600,
                              textAlign: 'center',
                              padding: 4,
                            }}
                          >
                            Déposer ici
                          </div>
                        ) : (
                          <div
                            key={slot.originalIndex}
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData('text/plain', String(slot.originalIndex));
                              e.dataTransfer.effectAllowed = 'move';
                              setDraggingPhotoIndex(slot.originalIndex);
                              setPhotoDropTargetIndex(null);
                            }}
                            onDragEnd={() => {
                              setDraggingPhotoIndex(null);
                              setPhotoDropTargetIndex(null);
                            }}
                            onDragOver={(e) => {
                              e.preventDefault();
                              if ([...e.dataTransfer.types].includes('Files')) {
                                e.dataTransfer.dropEffect = 'copy';
                              } else {
                                e.dataTransfer.dropEffect = 'move';
                                setPhotoDropTargetIndex(displayIndex);
                              }
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              if (e.dataTransfer.files.length > 0) {
                                e.stopPropagation();
                                appendProposalPhotos(Array.from(e.dataTransfer.files), []);
                                setDraggingPhotoIndex(null);
                                setPhotoDropTargetIndex(null);
                                return;
                              }
                              const from = parseInt(e.dataTransfer.getData('text/plain'), 10);
                              if (!Number.isNaN(from) && from !== displayIndex) handleMovePhoto(from, displayIndex);
                              setDraggingPhotoIndex(null);
                              setPhotoDropTargetIndex(null);
                            }}
                            style={{
                              position: 'relative',
                              aspectRatio: 1,
                              borderRadius: 12,
                              overflow: 'hidden',
                              border: '1px solid #e8e8e8',
                              backgroundColor: '#fafafa',
                              cursor: 'grab',
                              userSelect: 'none',
                              opacity: draggingPhotoIndex === slot.originalIndex ? 0.5 : 1,
                              transition: 'opacity 0.15s ease',
                            }}
                            onMouseEnter={() => setHoveredPhotoIndex(slot.originalIndex)}
                            onMouseLeave={() => setHoveredPhotoIndex(null)}
                          >
                            <img
                              src={slot.url}
                              alt={`Photo ${slot.originalIndex + 1}`}
                              style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }}
                              draggable={false}
                            />
                            <button
                              type="button"
                              onClick={() => handleRemovePhoto(slot.originalIndex)}
                              style={{
                                position: 'absolute',
                                inset: 0,
                                background: 'rgba(0,0,0,0.6)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 6,
                                opacity: hoveredPhotoIndex === slot.originalIndex ? 1 : 0,
                                transition: 'opacity 0.2s',
                                color: '#fff',
                                fontSize: 11,
                                fontWeight: 500,
                                border: 'none',
                                cursor: 'pointer',
                                pointerEvents: draggingPhotoIndex !== null ? 'none' : 'auto',
                              }}
                            >
                              <Trash2 size={22} />
                              <span>Supprimer</span>
                            </button>
                          </div>
                        )
                      )}
                    </div>
                    );
                  })()}
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
                    disabled={photoItems.length < 1}
                    style={{
                      flex: 1,
                      height: 50,
                      backgroundColor: '#1d1d1f',
                      color: '#fff',
                      fontSize: 15,
                      fontWeight: 500,
                      border: 'none',
                      borderRadius: 980,
                      cursor: photoItems.length < 1 ? 'not-allowed' : 'pointer',
                      opacity: photoItems.length < 1 ? 0.6 : 1,
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
                {(() => {
                  const categoryLabel = category === 'autre' ? customCategory.trim() : (CATEGORIES.find((c) => c.value === category)?.label || category);
                  const brandForTitle = (brand.trim() || marqueSearchQuery.trim()).trim();
                  const modelForTitle = modelOptions.length > 0 ? (model || modeleSearchQuery.trim() || null) : (customModel.trim() || null);
                  const typeLabelForTitle = getArticleTypeSingleLabelForTitle(category, genre, articleType);
                  const suggestedSuffix = [typeLabelForTitle, modelForTitle].filter(Boolean).join(' ').trim() || categoryLabel || '';
                  const titlePrefix = brandForTitle ? `${brandForTitle} - ` : '';
                  return (
                <>
                <div style={{ marginBottom: 18 }}>
                  <label style={labelStyle}>Titre</label>
                  <div style={{ display: 'flex', alignItems: 'center', height: 50, border: '1px solid #d2d2d7', borderRadius: 12, padding: '0 16px', fontSize: 15, background: '#fff', boxSizing: 'border-box' }}>
                    <span style={{ color: '#86868b', whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {titlePrefix || 'Marque - '}
                    </span>
                    <input
                      type="text"
                      value={titleSuffix}
                      onChange={(e) => {
                        titleManuallyEditedRef.current = true;
                        setTitleSuffix(e.target.value);
                      }}
                      placeholder={suggestedSuffix || 'Modèle ou type'}
                      style={{
                        ...inputStyle,
                        flex: 1,
                        minWidth: 0,
                        border: 'none',
                        padding: 0,
                        marginLeft: 2,
                        fontSize: 15,
                        background: 'transparent',
                      }}
                    />
                  </div>
                </div>
                <div style={{ marginBottom: 18 }}>
                  <label style={labelStyle}>Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={category === 'chaussures' || category === 'vetements' ? "Décrivez votre produit en précisant : état, caractéristiques, éventuelles imperfections, taille." : "Décrivez votre produit en précisant : état, caractéristiques, éventuelles imperfections, taille et dimensions."}
                    style={{
                      width: '100%',
                      minHeight: 100,
                      padding: '8px 14px 14px',
                      fontSize: 15,
                      border: '1px solid #d2d2d7',
                      borderRadius: 12,
                      boxSizing: 'border-box',
                      resize: 'vertical',
                      outline: 'none',
                    }}
                  />
                </div>
                </>
                  );
                })()}
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
                )
                )}
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
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                <div style={{ marginBottom: 24 }}>
                  <label style={labelStyle}>Prix souhaité <span style={{ color: '#1d1d1f' }}>*</span></label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={price}
                      onChange={(e) => setPrice(sanitizeListingPriceInputWhileTyping(e.target.value))}
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
                <MultiLocationPicker
                  selected={selectedLocations}
                  onChange={handleLocationsChange}
                  radiusKm={radiusKm}
                  onRadiusKmChange={handlePropositionRadiusKmChange}
                  geoError={geoError}
                  geoLoading={geoLoading}
                  onRequestGeolocation={requestPropositionGeolocation}
                  onClearGeolocation={clearPropositionGeolocation}
                />
                {(eligibleLoading || eligibleSellers.length > 0) && (
                  <div style={{ marginBottom: 24 }}>
                    {eligibleLoading ? (
                      <p style={{ fontSize: 14, color: '#6e6e73' }}>Recherche des vendeurs…</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {eligibleSellers.map((s) => {
                          const checked = selectedSellerIds.includes(s.id);
                          return (
                            <label
                              key={s.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                padding: '6px 12px',
                                border: '1px solid #e8e6e3',
                                borderRadius: 12,
                                cursor: 'pointer',
                                backgroundColor: checked ? '#f5f5f7' : '#fff',
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() =>
                                  setSelectedSellerIds((prev) =>
                                    prev.includes(s.id) ? prev.filter((x) => x !== s.id) : [...prev, s.id],
                                  )
                                }
                                style={{ width: 18, height: 18, accentColor: '#1d1d1f' }}
                              />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 600, fontSize: 15, color: '#1d1d1f', lineHeight: 1.25 }}>{s.companyName}</div>
                                <div
                                  style={{
                                    fontSize: 12,
                                    lineHeight: 1.25,
                                    marginTop: 2,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 1,
                                  }}
                                >
                                  <div style={{ color: '#6e6e73' }}>{s.addressLine || 'Adresse non renseignée'}</div>
                                  <div style={{ color: '#86868b' }}>Vendeur professionnel</div>
                                </div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
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

            {step === 5 && (
              <motion.form
                id="proposer-piece-final-form"
                key="step5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                onSubmit={handleSubmit}
              >
                <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <label style={labelStyle}>Prénom <span style={{ color: '#1d1d1f' }}>*</span></label>
                    <input
                      required
                      value={contactFirstName}
                      onChange={(e) => setContactFirstName(e.target.value)}
                      placeholder="Prénom"
                      style={inputStyle}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <label style={labelStyle}>Nom <span style={{ color: '#1d1d1f' }}>*</span></label>
                    <input
                      required
                      value={contactLastName}
                      onChange={(e) => setContactLastName(e.target.value)}
                      placeholder="Nom"
                      style={inputStyle}
                    />
                  </div>
                </div>
                <div style={{ marginBottom: 18 }}>
                  <label style={labelStyle}>E-mail <span style={{ color: '#1d1d1f' }}>*</span></label>
                  <input
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="email@exemple.fr"
                    style={inputStyle}
                  />
                </div>
                <div style={{ marginBottom: 18 }}>
                  <label style={labelStyle}>Téléphone</label>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+33 6 12 34 56 78"
                    style={inputStyle}
                  />
                </div>
                <div style={{ marginBottom: 18 }}>
                  <label style={labelStyle}>Message</label>
                  <textarea
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    rows={4}
                    placeholder="Votre message aux vendeurs"
                    style={{
                      ...inputStyle,
                      height: 'auto',
                      minHeight: 120,
                      padding: '12px 16px',
                      resize: 'vertical',
                    }}
                  />
                </div>
                <p style={{ fontSize: 11, color: '#666', marginBottom: 20, whiteSpace: 'pre-line' }}>
                  {!contactLegalExpanded ? (
                    <>
                      {`Le vendeur pourra vous répondre directement depuis sa messagerie Section Luxe, veuillez ne pas mentionner vos données personnelles dans le contenu de votre message.
Les données que vous renseignez dans ce formulaire sont traitées par Section Luxe en qualité de responsable de traitement. `}
                      <button
                        type="button"
                        onClick={() => setContactLegalExpanded(true)}
                        style={{
                          background: 'none',
                          border: 'none',
                          fontSize: 11,
                          color: '#1d1d1f',
                          fontWeight: 600,
                          cursor: 'pointer',
                          padding: 0,
                          marginLeft: 4,
                          textDecoration: 'underline',
                        }}
                      >
                        Afficher plus
                      </button>
                    </>
                  ) : (
                    <>
                      {`Le vendeur pourra vous répondre directement depuis sa messagerie Section Luxe, veuillez ne pas mentionner vos données personnelles dans le contenu de votre message.
Les données que vous renseignez dans ce formulaire sont traitées par Section Luxe en qualité de responsable de traitement. Elles sont transmises directement au vendeur que vous souhaitez contacter et le cas échéant, aux vendeurs professionnels. Ces données sont utilisées à des fins de : mise en relation avec le vendeur que vous souhaitez contacter ; mesure et étude de l'audience du site, évaluer son utilisation et améliorer ses services ; lutte anti-fraude ; gestion de vos demandes d'exercice de vos droits. Vous disposez d'un droit d'accès, de rectification, d'effacement de ces données, d'un droit de limitation du traitement, d'un droit d'opposition, du droit à la portabilité de vos données et du droit d'introduire une réclamation auprès d'une autorité de contrôle (en France, la CNIL). Vous pouvez également retirer à tout moment votre consentement au traitement de vos données. Pour en savoir plus sur le traitement de vos données : `}
                      <a
                        href="https://www.sectionluxe.fr/politique-confidentialite"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#1d1d1f', textDecoration: 'underline' }}
                      >
                        https://www.sectionluxe.fr/politique-confidentialite
                      </a>
                      {' '}
                      <button
                        type="button"
                        onClick={() => setContactLegalExpanded(false)}
                        style={{
                          background: 'none',
                          border: 'none',
                          fontSize: 11,
                          color: '#1d1d1f',
                          fontWeight: 600,
                          cursor: 'pointer',
                          padding: 0,
                          marginLeft: 4,
                          textDecoration: 'underline',
                        }}
                      >
                        Afficher moins
                      </button>
                    </>
                  )}
                </p>
                <CguCgvCheckbox
                  id="nouvelle-annonce-cgu-cgv"
                  checked={acceptCguCgv}
                  onChange={(v) => { setAcceptCguCgv(v); setCguCgvError(''); }}
                  error={cguCgvError}
                />
                <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                  <button
                    type="button"
                    onClick={() => { setError(''); setCguCgvError(''); handleBack(); }}
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
                    {loading ? 'Envoi…' : editingProposalId ? 'Enregistrer' : 'Envoyer'}
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

