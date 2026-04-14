'use client';

import { useEffect, useLayoutEffect, useMemo, useState, useCallback, useRef, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname, useParams } from 'next/navigation';
import Link from 'next/link';
import { Search, SlidersHorizontal, X, ChevronRight, ChevronLeft, ChevronDown, Heart, Store, MapPin, Tag, Calendar, CircleCheck, Palette, Layers, Euro, LayoutGrid, List, Info, ArrowRight } from 'lucide-react';
import { SearchFilters as Filters, defaultFilters } from '@/types/filters';
import { getListings, getDistinctSizesForCategory, getDistinctSizesForCategoryAndArticleTypes } from '@/lib/supabase/listings';
import { listingAnnoncePath } from '@/lib/listingPaths';
import {
  setAnnonceReturnUrlForNextNavigation,
  consumeCatalogueScrollRestore,
  peekCatalogueScrollRestore,
  persistCatalogueScrollFromViewport,
} from '@/lib/annonceReturnUrl';
import { setDocumentScrollY } from '@/lib/documentScroll';
import { sellerCataloguePath, parseVendeurCatalogueSlug } from '@/lib/sellerCatalogueUrl';
import { getSellerData, getSellerIdByVendeurSlug } from '@/lib/supabase/auth';
import { addFavorite, removeFavorite, getUserFavoriteListingIds } from '@/lib/supabase/favorites';
import { getDealLevel } from '@/lib/deal';
import { useAuth } from '@/hooks/useAuth';
import { Listing, Seller } from '@/types';
import { CATEGORIES, formatDate, getSellerAvatarUrl } from '@/lib/utils';
import {
  BRANDS_BY_CATEGORY,
  CATEGORY_TO_BRAND_KEYS,
  CLOTHING_SIZES,
  COLORS_BY_CATEGORY,
  getModelFilterVariants,
  getVetementsTypesForGenre,
  getVetementsTypesForGenreCatalogue,
  getSacsTypesForGenreCatalogue,
  getBijouxTypesForGenre,
  getChaussuresTypesForGenreCatalogue,
  getAccessoiresTypesForGenreCatalogue,
  getCategoryAndBrandForModel,
  getArticleTypeLabelsForCategory,
  getArticleTypeLabel,
  expandArticleTypesForFilter,
  modelMatchesArticleType,
  MODELE_EXCLU_QUAND_IDENTIQUE_CATEGORIE,
  MODELE_VETEMENTS_GENERIQUES_EXCLUS,
  MODELES_EXCLUS_DEPOT_ANNONCE,
  MATIERES_BY_CATEGORY,
  MODELS_BY_CATEGORY_BRAND,
  CONDITIONS,
  COLORS,
  MATERIALS,
  REGIONS_FR,
  DEPARTEMENTS_FR,
  SHOE_SIZES,
  VETEMENTS_MODELES_TOUJOURS_PROPOSES,
  VETEMENTS_MARQUES_UNIQUEMENT_MODELES_MARQUE,
} from '@/lib/constants';
import { haversineKm, fetchCoordsForPostcode } from '@/lib/geoCoords';
import { useCatalogueLocationSuggestions, RADIUS_KM_OPTIONS } from '@/hooks/useCatalogueLocationSuggestions';
import { ListingCaracteristiques } from '@/components/ListingCaracteristiques';
import { SellerVerifiedSubscriptionBadge } from '@/components/SellerVerifiedSubscriptionBadge';
import { ListingPhoto } from '@/components/ListingPhoto';
import { CatalogueCardPhotos } from '@/components/CatalogueCardPhotos';
import { SellerVisitMapPopup } from '@/components/SellerVisitMapPopup';
import { FluidOneLineHeading } from '@/components/FluidOneLineHeading';

const iconSize = 14;
const iconColor = '#6e6e73';
/** Annonces par page : 20 en grille sur téléphone (≤767px), 21 sinon. */
const PAGE_SIZE_DEFAULT = 21;
const PAGE_SIZE_MOBILE_GRID = 20;

/** Grille catalogue : même carte que la page d’accueil « À la une » (connexion-form-box). */
const CATALOGUE_GRID_CARD_SHADOW = '0 4px 24px rgba(0,0,0,0.06)';
const CATALOGUE_GRID_CARD_RADIUS = 18;

const SORT_OPTIONS = [
  { value: 'date_desc', label: 'Plus récents' },
  { value: 'date_asc', label: 'Plus anciens' },
  { value: 'price_asc', label: 'Prix croissants' },
  { value: 'price_desc', label: 'Prix décroissants' },
  { value: 'likes', label: 'Populaires' },
];

/** 6 marques les plus connues par type d'article (suggestion en tête du menu Marque) */
const MARQUES_PLUS_CONNUES_PAR_TYPE: Record<string, string[]> = {
  sacs: ['Hermès', 'Louis Vuitton', 'Chanel', 'Gucci', 'Prada', 'Dior'],
  maroquinerie: ['Hermès', 'Louis Vuitton', 'Chanel', 'Gucci', 'Prada', 'Dior'],
  montres: ['Rolex', 'Omega', 'Cartier', 'Patek Philippe', 'Audemars Piguet', 'Tag Heuer'],
  bijoux: ['Cartier', 'Van Cleef & Arpels', 'Bulgari', 'Tiffany', 'Chopard', 'Chaumet'],
  vetements: ['Chanel', 'Dior', 'Gucci', 'Louis Vuitton', 'Prada', 'Saint Laurent'],
  chaussures: ['Christian Louboutin', 'Gucci', 'Chanel', 'Prada', 'Saint Laurent', 'Dior'],
  accessoires: ['Louis Vuitton', 'Chanel', 'Gucci', 'Hermès', 'Prada', 'Dior'],
  autre: ['Hermès', 'Louis Vuitton', 'Chanel', 'Gucci', 'Prada', 'Dior'],
};

/** 6 modèles les plus connus par marque (suggestion en tête du menu Modèle, filtrée par type + marque) */
const MODELES_PLUS_CONNUS_PAR_MARQUE: Record<string, string[]> = {
  'Hermès': ['Birkin', 'Kelly', 'Constance', 'Lindy', 'Évelyne', 'Picotin'],
  'Louis Vuitton': ['Neverfull', 'Speedy 25', 'Speedy 30', 'Alma', 'Capucines', 'Pochette Métis'],
  'Chanel': ['Classic Flap', '2.55', 'Boy', 'Gabrielle', 'Coco Handle', '19'],
  'Gucci': ['Dionysus', 'Marmont', 'Jackie', 'Horsebit', 'Ophidia', 'Bamboo'],
  'Prada': ['Galleria', 'Saffiano', 'Re-Edition', 'Cleo', 'Nylon', 'Sidonie'],
  'Dior': ['Lady Dior', 'Saddle', 'Book Tote', 'Bobby', 'Caro', 'Diorama'],
  'Rolex': ['Submariner', 'Submariner Date', 'Daytona', 'Datejust', 'GMT-Master II', 'Day-Date'],
  'Omega': ['Speedmaster', 'Seamaster', 'Constellation', 'Aqua Terra', 'Moonwatch', 'Planet Ocean'],
  'Cartier': ['Tank', 'Santos', 'Ballon Bleu', 'Panthère', 'Love', 'Clé'],
  'Patek Philippe': ['Nautilus', 'Aquanaut', 'Calatrava', 'Complications', 'Twenty~4', 'World Time'],
  'Audemars Piguet': ['Royal Oak', 'Royal Oak Offshore', 'Code 11.59', 'Millenary', 'Royal Oak Concept', 'Jules Audemars'],
  'Tag Heuer': ['Monaco', 'Carrera', 'Aquaracer', 'Autavia', 'Formula 1', 'Link'],
  'Saint Laurent': ['Sac de Jour', 'LouLou', 'Kate', 'Niki', 'Le 5 à 7', 'Solferino'],
  'Van Cleef & Arpels': ['Alhambra', 'Perlée', 'Frivole', 'Between the Finger', 'Magic', 'Sweet'],
  'Bulgari': ['Serpenti', 'Divas\' Dream', 'Bvlgari Bvlgari', 'Octo', 'Octo Finissimo', 'Diagono'],
  'Tiffany': ['Atlas', 'T True', 'Return to Tiffany', 'HardWear', 'T1', 'Knot'],
};

/** Trie les modèles : d’abord alphabétique, les modèles contenant un chiffre sont mis en dernier. */
function sortModelesWithNumericLast(a: string, b: string): number {
  const aHasDigit = /\d/.test(a);
  const bHasDigit = /\d/.test(b);
  if (aHasDigit !== bHasDigit) return aHasDigit ? 1 : -1;
  return a.localeCompare(b, 'fr');
}

/** Modèles favoris affichés en tête du menu Modèle quand la catégorie Vêtements est sélectionnée. */
const MODELES_FAVORIS_VETEMENTS = ['Veste', 'Sweat', 'Chemise', 'T-shirt', 'Pantalon', 'Jean'];

function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(Number(price)));
}

/** Normalise pour la recherche : minuscules, sans accents, sans tirets ni apostrophes (ex. "Île-de-France" → "iledefrance"). */
function normalizeForSearch(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[-'\s]+/g, '');
}

/** Mots-clés de recherche ajoutés par catégorie (ex. "bracelet" pour bijoux). */
const CATEGORY_SEARCH_KEYWORDS: Record<string, string[]> = {
  bijoux: ['bracelet', 'collier', 'bague', 'bijou', 'pendentif', 'boucle', 'oreille', 'creole', 'sautoir'],
};

/** Corrections de fautes de frappe courantes pour la recherche. */
const SEARCH_TYPO_MAP: Record<string, string> = {
  borce: 'force',
  focre: 'force',
  froce: 'force',
};

/** Met en évidence les mots de la recherche dans un texte (surlignage). */
function highlightSearchTerms(text: string, searchQuery: string | undefined): React.ReactNode {
  if (!searchQuery || !text) return text;
  const words = searchQuery.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return text;
  const pattern = new RegExp(
    '(' + words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')',
    'gi'
  );
  const parts = text.split(pattern);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <mark
        key={i}
        style={{
          backgroundColor: 'rgba(255, 204, 0, 0.25)',
          padding: '0 1px',
          borderRadius: 2,
          fontWeight: 600,
        }}
      >
        {part}
      </mark>
    ) : (
      part
    )
  );
}

/** Ordinal pour arrondissement : "01" → "1er", "02" → "2e", … "20" → "20e" */
function arrondissementOrdinal(lastTwo: string): string {
  const n = parseInt(lastTwo, 10);
  if (n === 1) return '1er';
  return `${n}e`;
}

function parsePositiveInt(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/** Normalise un code postal pour l'utiliser comme clé (coordsMap, cache). Toujours 5 caractères ou 2A/2B. */
function normalizePostcodeKey(s: string | null | undefined): string {
  const raw = (s ?? '').replace(/\s/g, '').trim();
  if (!raw) return '';
  if (raw === '2A' || raw === '2B') return raw;
  return raw.length >= 5 ? raw.slice(0, 5) : raw;
}

/** Récupère le code postal à partir de coordonnées (reverse geocoding, API adresse.data.gouv.fr). */
async function fetchPostcodeFromCoords(
  lat: number,
  lon: number
): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api-adresse.data.gouv.fr/reverse/?lat=${lat}&lon=${lon}&limit=1`
    );
    if (!res.ok) return null;
    const data = await res.json();
    const props = data?.features?.[0]?.properties;
    if (!props) return null;
    const postcode = props.postcode ?? props.postal_code ?? props.code_postal;
    const str = postcode != null ? String(postcode).replace(/\s/g, '').trim() : '';
    return str || null;
  } catch {
    return null;
  }
}

// Filter Section Component
function FilterSection({
  title,
  children,
  defaultOpen = false,
  collapsible = true,
  noBorder = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  collapsible?: boolean;
  noBorder?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const borderStyle = noBorder ? undefined : { borderBottom: '1px solid #e8e6e3' as const };

  if (!collapsible) {
  return (
      <div style={borderStyle}>
        {title ? (
          <div
            style={{
              padding: '14px 0 0',
              marginBottom: 12,
              fontSize: 14,
              fontWeight: 600,
              color: '#1d1d1f',
            }}
          >
            {title}
          </div>
        ) : null}
        <div style={{ paddingBottom: 16 }}>{children}</div>
      </div>
    );
  }

  return (
    <div style={borderStyle}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 0',
          background: 'none',
          border: 'none',
          fontSize: 14,
          fontWeight: 600,
          color: '#1d1d1f',
          cursor: 'pointer',
        }}
      >
        {title}
        <ChevronRight
          size={16}
          style={{
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
            color: '#86868b',
          }}
        />
      </button>
      {open && <div style={{ paddingBottom: 16 }}>{children}</div>}
    </div>
  );
}

const OCCASION_CONDITIONS = ['very_good', 'good', 'correct'];

const ETAT_DEFINITIONS: { title: string; text: string }[] = [
  { title: 'Neuf', text: 'Article jamais porté en parfait état. Aucun signe d\'utilisation.' },
  { title: 'Très bon état', text: 'Article peu porté et soigneusement conservé. Peut présenter de très légers signes d\'usage à peine perceptibles.' },
  { title: 'Bon état', text: 'Article porté et bien entretenu. Peut présenter des traces d\'usage visibles liées à une utilisation normale.' },
  { title: 'État correct', text: 'Article régulièrement porté. Présente des signes d\'usure visibles liés à l\'usage, sans défaut majeur ni détérioration importante.' },
];

/** Normalise la chaîne de requête pour comparaison (ordre des clés). */
function normalizeQueryString(params: URLSearchParams): string {
  return [...params.entries()].sort((a, b) => a[0].localeCompare(b[0]) || a[1].localeCompare(b[1])).map(([k, v]) => `${k}=${v}`).join('&');
}

/** Construit les paramètres URL à partir des filtres (pour conserver les filtres au retour depuis la page produit). */
function filtersToParams(filters: Filters, page: number, opts?: { omitSellerId?: boolean }): URLSearchParams {
  const params = new URLSearchParams();
  (filters.genre ?? []).forEach((g) => params.append('genre', g));
  const categories = filters.categories ?? (filters.category ? [filters.category] : []);
  categories.forEach((c) => params.append('categories', c));
  (filters.articleTypes ?? []).forEach((t) => params.append('articleTypes', t));
  const brands = filters.brands ?? (filters.brand ? [filters.brand] : []);
  brands.forEach((b) => params.append('brands', b));
  const models = filters.models ?? (filters.model ? [filters.model] : []);
  models.forEach((m) => params.append('models', m));
  const colors = filters.colors ?? (filters.color ? [filters.color] : []);
  colors.forEach((c) => params.append('colors', c));
  const materials = filters.materials ?? (filters.material ? [filters.material] : []);
  materials.forEach((m) => params.append('materials', m));
  (filters.sizes ?? []).forEach((s) => params.append('sizes', s));
  if (filters.conditions?.length === 1 && filters.conditions[0] === 'new') params.set('condition', 'new');
  else if (filters.conditions?.length === OCCASION_CONDITIONS.length && OCCASION_CONDITIONS.every((c, i) => filters.conditions![i] === c)) params.set('condition', 'occasion');
  if (filters.query) params.set('query', filters.query);
  if (filters.sortBy && filters.sortBy !== 'date_desc') params.set('sortBy', filters.sortBy);
  if (filters.sellerId && !opts?.omitSellerId) params.set('sellerId', filters.sellerId);
  if (filters.priceMin != null) params.set('priceMin', String(filters.priceMin));
  if (filters.priceMax != null) params.set('priceMax', String(filters.priceMax));
  if (filters.yearMin != null) params.set('yearMin', String(filters.yearMin));
  if (filters.yearMax != null) params.set('yearMax', String(filters.yearMax));
  if (filters.region) params.set('region', filters.region);
  if (filters.postalCode) params.set('postalCode', filters.postalCode);
  if (page > 1) params.set('page', String(page));
  return params;
}

/** Vue liste desktop : `view=line` dans l’URL pour le même repère qu’au retour depuis une annonce (scroll + layout). */
function appendCatalogueListViewParam(
  params: URLSearchParams,
  viewMode: 'horizontal' | 'grid',
  isMobile: boolean
) {
  if (isMobile) {
    params.delete('view');
    return;
  }
  if (viewMode === 'horizontal') params.set('view', 'line');
  else params.delete('view');
}

/** Empreinte des filtres telle qu’en URL (sans `page`), pour éviter setFilters inutile au retour arrière. */
function catalogueFiltersUrlSignature(f: Filters, opts?: { omitSellerId?: boolean }): string {
  return normalizeQueryString(filtersToParams(f, 1, opts));
}

/** Reconstruit les filtres à partir des paramètres URL (retour arrière, lien partagé). */
function paramsToFilters(params: URLSearchParams): Filters {
  const initial: Filters = { ...defaultFilters };
  const genre = params.getAll('genre').filter((g) => g === 'femme' || g === 'homme') as ('femme' | 'homme')[];
  if (genre.length) initial.genre = genre;
  const categories = params.getAll('categories');
  if (categories.length) initial.categories = categories;
  else {
    const cat = params.get('category');
    if (cat) initial.categories = [cat];
  }
  const articleTypes = params.getAll('articleTypes');
  if (articleTypes.length) initial.articleTypes = articleTypes;
  const brands = params.getAll('brands');
  if (brands.length) initial.brands = brands.map((b) => decodeURIComponent(b));
  else {
    const b = params.get('brand');
    if (b) initial.brands = [decodeURIComponent(b)];
  }
  const models = params.getAll('models');
  if (models.length) initial.models = models.map((m) => decodeURIComponent(m));
  else {
    const m = params.get('model');
    if (m) initial.models = [decodeURIComponent(m)];
  }
  const colors = params.getAll('colors');
  if (colors.length) initial.colors = colors;
  const materials = params.getAll('materials');
  if (materials.length) initial.materials = materials;
  const sizes = params.getAll('sizes');
  if (sizes.length) initial.sizes = sizes;
  const condition = params.get('condition');
  if (condition === 'new') initial.conditions = ['new'];
  else if (condition === 'occasion') initial.conditions = [...OCCASION_CONDITIONS];
  const query = params.get('query');
  if (query) initial.query = query;
  const sortBy = params.get('sortBy');
  if (sortBy && ['date_asc', 'date_desc', 'price_asc', 'price_desc', 'likes'].includes(sortBy)) initial.sortBy = sortBy as Filters['sortBy'];
  const sellerId = params.get('sellerId');
  if (sellerId) initial.sellerId = sellerId;
  const priceMin = params.get('priceMin');
  if (priceMin !== null && priceMin !== '') initial.priceMin = Number(priceMin) || undefined;
  const priceMax = params.get('priceMax');
  if (priceMax !== null && priceMax !== '') initial.priceMax = Number(priceMax) || undefined;
  const yearMin = params.get('yearMin');
  if (yearMin !== null && yearMin !== '') initial.yearMin = Number(yearMin) || undefined;
  const yearMax = params.get('yearMax');
  if (yearMax !== null && yearMax !== '') initial.yearMax = Number(yearMax) || undefined;
  const region = params.get('region');
  if (region) initial.region = region;
  const postalCode = params.get('postalCode');
  if (postalCode) initial.postalCode = postalCode;
  return initial;
}

function CatalogueContent() {
  const router = useRouter();
  const pathname = usePathname();
  const paramsRoute = useParams();
  const slugFromPathname = useMemo(() => {
    if (!pathname?.startsWith('/catalogue/vendeur/')) return undefined;
    const raw = pathname.slice('/catalogue/vendeur/'.length).split('/')[0];
    if (!raw) return undefined;
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }, [pathname]);
  const slugParam =
    typeof paramsRoute?.slug === 'string' && paramsRoute.slug.length > 0
      ? paramsRoute.slug
      : slugFromPathname;
  const isVendeurCataloguePath = Boolean(pathname?.startsWith('/catalogue/vendeur/'));
  const parsedVendeurSlug = useMemo(() => (slugParam ? parseVendeurCatalogueSlug(slugParam) : null), [slugParam]);
  const vendeurParseInvalid = isVendeurCataloguePath && Boolean(slugParam) && !parsedVendeurSlug;
  const [vendeurSlugError, setVendeurSlugError] = useState(false);
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();
  const redirectUrl = pathname ? `?redirect=${encodeURIComponent(pathname + (searchParams.toString() ? `?${searchParams.toString()}` : ''))}` : '';

  /** Retour depuis la fiche annonce : après chargement, replacer le scroll à Y sans animation (pas de smooth / pas de passage par le haut). */
  const catalogueRestoreScrollYRef = useRef<number | null>(null);

  /** Évite que le navigateur restaure la position après un F5 alors que le squelette n’a pas la même hauteur que le catalogue final (saut / flash en bas de page). */
  useLayoutEffect(() => {
    if (typeof window === 'undefined') return;
    let previous: ScrollRestoration = 'auto';
    try {
      previous = history.scrollRestoration;
      history.scrollRestoration = 'manual';
    } catch {
      /* ignore */
    }
    return () => {
      try {
        history.scrollRestoration = previous;
      } catch {
        /* ignore */
      }
    };
  }, []);

  useLayoutEffect(() => {
    /* Au retour arrière (mobile / Safari), la barre d’adresse reflète souvent l’URL avant useSearchParams. */
    const currentHref =
      typeof window !== 'undefined'
        ? `${window.location.pathname}${window.location.search || ''}`
        : `${pathname || ''}${searchParamsString ? `?${searchParamsString}` : ''}`;
    const pending = peekCatalogueScrollRestore(currentHref);
    catalogueRestoreScrollYRef.current = pending;
    if (typeof window === 'undefined') return;
    if (pending != null) return;
    try {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
      if (nav?.type === 'reload') {
        setDocumentScrollY(0, 'auto');
      }
    } catch {
      /* ignore */
    }
  }, [pathname, searchParamsString]);

  /** Retour navigateur / bfcache : réaligner le scroll ; plusieurs passes pour Next.js / mobile. */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const tryFromWindow = () => {
      if (!window.location.pathname.startsWith('/catalogue')) return;
      const href = `${window.location.pathname}${window.location.search || ''}`;
      const y = peekCatalogueScrollRestore(href);
      if (y == null) return;
      catalogueRestoreScrollYRef.current = y;
      setDocumentScrollY(y, 'auto');
    };
    const scheduleTry = () => {
      queueMicrotask(() => {
        requestAnimationFrame(() => {
          requestAnimationFrame(tryFromWindow);
        });
      });
    };
    let popStateDelayIds: number[] = [];
    const clearPopDelays = () => {
      popStateDelayIds.forEach((id) => window.clearTimeout(id));
      popStateDelayIds = [];
    };
    const onPageShow = () => {
      scheduleTry();
    };
    const onPopState = () => {
      clearPopDelays();
      scheduleTry();
      popStateDelayIds = [80, 200, 450, 900].map((ms) => window.setTimeout(tryFromWindow, ms));
    };
    window.addEventListener('pageshow', onPageShow);
    window.addEventListener('popstate', onPopState);
    return () => {
      clearPopDelays();
      window.removeEventListener('pageshow', onPageShow);
      window.removeEventListener('popstate', onPopState);
    };
  }, []);

  /** Dernière position de scroll en continu : le retour « flèche » a souvent la même session que le clic sans rejouer pointerdown (Safari iOS). */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let debounceId: number | undefined;
    const onScroll = () => {
      if (debounceId !== undefined) window.clearTimeout(debounceId);
      debounceId = window.setTimeout(() => {
        debounceId = undefined;
        persistCatalogueScrollFromViewport();
      }, 140);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (debounceId !== undefined) window.clearTimeout(debounceId);
    };
  }, []);

  /** Avant navigation vers une fiche : forcer l’écriture du repère (complément au scroll débouncé). */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const flush = () => persistCatalogueScrollFromViewport();
    const onTouchStart = (e: TouchEvent) => {
      const t = e.target;
      if (!(t instanceof Element)) return;
      const a = t.closest('a[href]');
      if (!a) return;
      const href = a.getAttribute('href') || '';
      if (!href.includes('/annonce/')) return;
      flush();
    };
    document.addEventListener('touchstart', onTouchStart, { capture: true, passive: true });
    return () => document.removeEventListener('touchstart', onTouchStart, { capture: true });
  }, []);

  const [filters, setFilters] = useState<Filters>(() => {
    const reset = searchParams.get('reset');
    const condition = searchParams.get('condition');
    if (reset === '1') return { ...defaultFilters };
    if (condition === 'new') return { ...defaultFilters, conditions: ['new'], sellerId: searchParams.get('sellerId') || undefined };
    if (condition === 'occasion') return { ...defaultFilters, conditions: [...OCCASION_CONDITIONS], sellerId: searchParams.get('sellerId') || undefined };
    return paramsToFilters(searchParams);
  });

  // Résoudre /catalogue/vendeur/{slug} → sellerId (Supabase)
  useEffect(() => {
    if (!isVendeurCataloguePath) {
      setVendeurSlugError(false);
      return;
    }
    if (!parsedVendeurSlug) {
      setVendeurSlugError(Boolean(slugParam));
      return;
    }
    setVendeurSlugError(false);
    let cancelled = false;
    getSellerIdByVendeurSlug(parsedVendeurSlug.nameSlug, parsedVendeurSlug.uuidPrefix)
      .then((id) => {
        if (cancelled) return;
        if (!id) {
          setVendeurSlugError(true);
          return;
        }
        setFilters((prev) => (prev.sellerId === id ? prev : { ...prev, sellerId: id }));
      })
      .catch(() => {
        if (!cancelled) setVendeurSlugError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [isVendeurCataloguePath, parsedVendeurSlug, slugParam]);

  /** Un seul menu déroulant ouvert à la fois. */
  type DropdownId = 'type' | 'articleType' | 'marque' | 'modele' | 'color' | 'material' | 'taille' | 'tailleMontres' | 'pointure';
  const [openDropdown, setOpenDropdown] = useState<DropdownId | null>(null);
  const typeDropdownRef = useRef<HTMLDivElement>(null);
  const articleTypeDropdownRef = useRef<HTMLDivElement>(null);
  const marqueDropdownRef = useRef<HTMLDivElement>(null);
  const [marqueSearchQuery, setMarqueSearchQuery] = useState('');
  const modeleDropdownRef = useRef<HTMLDivElement>(null);
  const [modeleSearchQuery, setModeleSearchQuery] = useState('');
  const tailleDropdownRef = useRef<HTMLDivElement>(null);
  const pointureDropdownRef = useRef<HTMLDivElement>(null);
  const [pointureSearchQuery, setPointureSearchQuery] = useState('');
  const colorDropdownRef = useRef<HTMLDivElement>(null);
  const materialDropdownRef = useRef<HTMLDivElement>(null);
  const typeDropdownOpen = openDropdown === 'type';
  const articleTypeDropdownOpen = openDropdown === 'articleType';
  const marqueDropdownOpen = openDropdown === 'marque';
  const modeleDropdownOpen = openDropdown === 'modele';
  const tailleDropdownOpen = openDropdown === 'taille';
  const pointureDropdownOpen = openDropdown === 'pointure';
  const colorDropdownOpen = openDropdown === 'color';
  const materialDropdownOpen = openDropdown === 'material';
  const modelesAlphabetiques = useMemo(() => {
    const selectedTypes = filters.categories ?? (filters.category ? [filters.category] : []);
    const selectedBrands = filters.brands ?? (filters.brand ? [filters.brand] : []);
    const genre = (filters.genre?.length ? filters.genre : ['femme', 'homme']) as ('femme' | 'homme')[];
    const selectedArticleTypeValues = [...new Set((filters.articleTypes ?? []).map((t) => (t.includes('::') ? t.split('::')[0] : t)))];
    const categoryKeys =
      selectedTypes.length > 0
        ? [...new Set(selectedTypes.flatMap((t) => CATEGORY_TO_BRAND_KEYS[t] ?? [t]))]
        : Object.keys(MODELS_BY_CATEGORY_BRAND);
    const dataKeyToFilterCategory = (dataKey: string) =>
      Object.entries(CATEGORY_TO_BRAND_KEYS).find(([, keys]) => keys.includes(dataKey))?.[0] ?? dataKey;
    const CATEGORIES_WITH_ARTICLE_TYPE = ['sacs', 'vetements', 'chaussures', 'accessoires', 'bijoux'];
    const getOptionValuesForCategory = (filterCat: string) => {
      if (filterCat === 'vetements') return getVetementsTypesForGenre(genre).map((o) => o.value);
      if (filterCat === 'sacs') return getSacsTypesForGenreCatalogue(genre).map((o) => o.value);
      if (filterCat === 'bijoux') return getBijouxTypesForGenre(genre).map((o) => o.value);
      if (filterCat === 'chaussures') return getChaussuresTypesForGenreCatalogue(genre).map((o) => o.value);
      if (filterCat === 'accessoires') return getAccessoiresTypesForGenreCatalogue(genre).map((o) => o.value);
      return [];
    };
    const applicableByFilterCategory: Record<string, string[]> = {};
    for (const filterCat of selectedTypes) {
      if (!CATEGORIES_WITH_ARTICLE_TYPE.includes(filterCat)) continue;
      const optionValues = getOptionValuesForCategory(filterCat);
      applicableByFilterCategory[filterCat] = selectedArticleTypeValues.filter((t) => optionValues.includes(t));
    }
    const modelSet = new Set<string>();
    for (const categoryKey of categoryKeys) {
      const filterCategory = dataKeyToFilterCategory(categoryKey);
      const articleTypeLabels = getArticleTypeLabelsForCategory(filterCategory, genre);
      const excludedAsCategory = MODELE_EXCLU_QUAND_IDENTIQUE_CATEGORIE[filterCategory] ?? [];
      const applicableTypes = applicableByFilterCategory[filterCategory];
      const byBrand = MODELS_BY_CATEGORY_BRAND[categoryKey];
      if (!byBrand) continue;
      const brandsToConsider = selectedBrands.length > 0 ? selectedBrands : Object.keys(byBrand);
      for (const brand of brandsToConsider) {
        const models = byBrand[brand];
        if (!models) continue;
        for (const m of models) {
          if (m === 'Autre') continue;
          if (articleTypeLabels.includes(m)) continue;
          if (excludedAsCategory.includes(m)) continue;
          if (filterCategory === 'vetements' && MODELE_VETEMENTS_GENERIQUES_EXCLUS.has(m)) continue;
          if (applicableTypes?.length) {
            if (!applicableTypes.some((at) => modelMatchesArticleType(m, at, filterCategory, brand))) continue;
          }
          modelSet.add(m);
        }
      }
    }
    if (categoryKeys.includes('vetements')) {
      const articleTypeLabels = getArticleTypeLabelsForCategory('vetements', genre);
      const applicableTypes = applicableByFilterCategory['vetements'];
      const vetementsByBrand = MODELS_BY_CATEGORY_BRAND['vetements'];
      const brandsForVetements = selectedBrands.length > 0 ? selectedBrands : (vetementsByBrand ? Object.keys(vetementsByBrand) : []);
      const skipGeneric = selectedBrands.length > 0 && brandsForVetements.some((b) => VETEMENTS_MARQUES_UNIQUEMENT_MODELES_MARQUE.has(b));
      if (!skipGeneric) {
        VETEMENTS_MODELES_TOUJOURS_PROPOSES.forEach(({ name, genre: modelGenre }) => {
          if (articleTypeLabels.includes(name)) return;
          if (MODELE_VETEMENTS_GENERIQUES_EXCLUS.has(name)) return;
          const genreOk = modelGenre === 'both' || (modelGenre === 'femme' && genre.includes('femme')) || (modelGenre === 'homme' && genre.includes('homme'));
          if (!genreOk) return;
          if (applicableTypes?.length && !applicableTypes.some((at) => modelMatchesArticleType(name, at, 'vetements'))) return;
          modelSet.add(name);
        });
      }
    }
    return [...modelSet]
      .filter((m) => m !== 'Autre' && m.toLowerCase() !== 'autre' && !MODELES_EXCLUS_DEPOT_ANNONCE.has(m))
      .sort(sortModelesWithNumericLast);
  }, [filters.categories, filters.category, filters.brands, filters.brand, filters.articleTypes, filters.genre]);

  /** Modèles groupés par marque (pour afficher des sections quand plusieurs marques sont choisies). Filtrage par type de produit comme dans Déposer une annonce. "Autre" n'est jamais proposé. */
  const modelesByBrand = useMemo(() => {
    const selectedTypes = filters.categories ?? (filters.category ? [filters.category] : []);
    const selectedBrands = filters.brands ?? (filters.brand ? [filters.brand] : []);
    if (selectedBrands.length <= 1) return [];
    const genre = (filters.genre?.length ? filters.genre : ['femme', 'homme']) as ('femme' | 'homme')[];
    const selectedArticleTypeValues = [...new Set((filters.articleTypes ?? []).map((t) => (t.includes('::') ? t.split('::')[0] : t)))];
    const categoryKeys =
      selectedTypes.length > 0
        ? [...new Set(selectedTypes.flatMap((t) => CATEGORY_TO_BRAND_KEYS[t] ?? [t]))]
        : Object.keys(MODELS_BY_CATEGORY_BRAND);
    const dataKeyToFilterCategory = (dataKey: string) =>
      Object.entries(CATEGORY_TO_BRAND_KEYS).find(([, keys]) => keys.includes(dataKey))?.[0] ?? dataKey;
    const CATEGORIES_WITH_ARTICLE_TYPE = ['sacs', 'vetements', 'chaussures', 'accessoires', 'bijoux'];
    const getOptionValuesForCategory = (filterCat: string) => {
      if (filterCat === 'vetements') return getVetementsTypesForGenre(genre).map((o) => o.value);
      if (filterCat === 'sacs') return getSacsTypesForGenreCatalogue(genre).map((o) => o.value);
      if (filterCat === 'bijoux') return getBijouxTypesForGenre(genre).map((o) => o.value);
      if (filterCat === 'chaussures') return getChaussuresTypesForGenreCatalogue(genre).map((o) => o.value);
      if (filterCat === 'accessoires') return getAccessoiresTypesForGenreCatalogue(genre).map((o) => o.value);
      return [];
    };
    const applicableByFilterCategory: Record<string, string[]> = {};
    for (const filterCat of selectedTypes) {
      if (!CATEGORIES_WITH_ARTICLE_TYPE.includes(filterCat)) continue;
      const optionValues = getOptionValuesForCategory(filterCat);
      applicableByFilterCategory[filterCat] = selectedArticleTypeValues.filter((t) => optionValues.includes(t));
    }
    const out: { brandLabel: string; models: string[]; favoris: string[] }[] = [];
    for (const brand of selectedBrands) {
      const modelSet = new Set<string>();
      for (const categoryKey of categoryKeys) {
        const filterCategory = dataKeyToFilterCategory(categoryKey);
        const articleTypeLabels = getArticleTypeLabelsForCategory(filterCategory, genre);
        const excludedAsCategory = MODELE_EXCLU_QUAND_IDENTIQUE_CATEGORIE[filterCategory] ?? [];
        const applicableTypes = applicableByFilterCategory[filterCategory];
        const models = MODELS_BY_CATEGORY_BRAND[categoryKey]?.[brand];
        if (!models) continue;
        for (const m of models) {
          if (m === 'Autre') continue;
          if (articleTypeLabels.includes(m)) continue;
          if (excludedAsCategory.includes(m)) continue;
          if (filterCategory === 'vetements' && MODELE_VETEMENTS_GENERIQUES_EXCLUS.has(m)) continue;
          if (applicableTypes?.length) {
            if (!applicableTypes.some((at) => modelMatchesArticleType(m, at, filterCategory, brand))) continue;
          }
          modelSet.add(m);
        }
      }
      if (categoryKeys.includes('vetements') && !VETEMENTS_MARQUES_UNIQUEMENT_MODELES_MARQUE.has(brand)) {
        const articleTypeLabels = getArticleTypeLabelsForCategory('vetements', genre);
        const applicableTypes = applicableByFilterCategory['vetements'];
        VETEMENTS_MODELES_TOUJOURS_PROPOSES.forEach(({ name, genre: modelGenre }) => {
          if (articleTypeLabels.includes(name)) return;
          if (MODELE_VETEMENTS_GENERIQUES_EXCLUS.has(name)) return;
          const genreOk = modelGenre === 'both' || (modelGenre === 'femme' && genre.includes('femme')) || (modelGenre === 'homme' && genre.includes('homme'));
          if (!genreOk) return;
          if (applicableTypes?.length && !applicableTypes.some((at) => modelMatchesArticleType(name, at, 'vetements'))) return;
          modelSet.add(name);
        });
      }
      const list = [...modelSet]
        .filter((m) => m !== 'Autre' && m.toLowerCase() !== 'autre' && !MODELES_EXCLUS_DEPOT_ANNONCE.has(m))
        .sort(sortModelesWithNumericLast);
      const allModels = list;
      const favorisRaw = (MODELES_PLUS_CONNUS_PAR_MARQUE[brand] ?? []).filter(
        (m) => m !== 'Autre' && m.toLowerCase() !== 'autre' && !MODELES_EXCLUS_DEPOT_ANNONCE.has(m),
      );
      const favoris = favorisRaw.filter((m) => modelSet.has(m)).slice(0, 6);
      out.push({ brandLabel: brand, models: allModels, favoris });
    }
    return out;
  }, [filters.categories, filters.category, filters.brands, filters.brand, filters.articleTypes, filters.genre]);
  const hasMultipleBrandsForModeles = modelesByBrand.length > 1;

  const marquesAlphabetiques = useMemo(() => {
    const selected = filters.categories ?? (filters.category ? [filters.category] : []);
    const categoryKeys =
      selected.length > 0
        ? [...new Set(selected.flatMap((t) => CATEGORY_TO_BRAND_KEYS[t] ?? [t]))]
        : Object.keys(BRANDS_BY_CATEGORY);
    const brands = [...new Set(categoryKeys.flatMap((k) => BRANDS_BY_CATEGORY[k] ?? []))];
    return [
      ...brands.filter((b) => b !== 'Autre').sort((a, b) => a.localeCompare(b, 'fr')),
      'Autre',
    ];
  }, [filters.categories, filters.category]);

  /** Catégories qui ont un type de produit (comme dans Déposer une annonce). */
  const CATEGORIES_WITH_ARTICLE_TYPE = ['sacs', 'vetements', 'chaussures', 'accessoires', 'bijoux'];
  /** Options "Type de produit" groupées par catégorie (pour afficher des sections quand plusieurs catégories choisies). */
  const articleTypeOptionsByCategory = useMemo(() => {
    const selected = filters.categories ?? (filters.category ? [filters.category] : []);
    const withType = selected.filter((c) => CATEGORIES_WITH_ARTICLE_TYPE.includes(c));
    if (withType.length === 0) return [];
    const genre = (filters.genre?.length ? filters.genre : ['femme', 'homme']) as ('femme' | 'homme')[];
    return withType.map((cat) => {
      const list =
        cat === 'vetements' ? getVetementsTypesForGenreCatalogue(genre)
        : cat === 'sacs' ? getSacsTypesForGenreCatalogue(genre)
        : cat === 'bijoux' ? getBijouxTypesForGenre(genre)
        : cat === 'chaussures' ? getChaussuresTypesForGenreCatalogue(genre)
        : cat === 'accessoires' ? getAccessoiresTypesForGenreCatalogue(genre)
        : [];
      const options = list;
      const categoryLabel = CATEGORIES.find((c) => c.value === cat)?.label ?? cat;
      return { categoryKey: cat, categoryLabel, options };
    }).filter((g) => g.options.length > 0);
  }, [filters.categories, filters.category, filters.genre]);
  const articleTypeOptions = useMemo(() => articleTypeOptionsByCategory.flatMap((g) => g.options), [articleTypeOptionsByCategory]);
  const hasArticleTypeFilter = articleTypeOptions.length > 0;
  const selectedArticleTypes = filters.articleTypes ?? [];
  /** Valeurs uniques pour l’API et la logique métier (une entrée par value, même si plusieurs libellés sont cochés). */
  const selectedArticleTypeValues = useMemo(
    () => [...new Set((filters.articleTypes ?? []).map((t) => (t.includes('::') ? t.split('::')[0] : t)))],
    [filters.articleTypes]
  );
  const articleTypeKey = (opt: { value: string; label: string }) => `${opt.value}::${opt.label}`;
  const isArticleTypeOptionChecked = (opt: { value: string; label: string }) =>
    selectedArticleTypes.includes(opt.value) || selectedArticleTypes.includes(articleTypeKey(opt));
  const toggleArticleType = (opt: { value: string; label: string }) => {
    setFilters((prev) => {
      const current = prev.articleTypes ?? [];
      const key = articleTypeKey(opt);
      if (current.includes(key)) {
        const next = current.filter((t) => t !== key);
        return { ...prev, articleTypes: next.length ? next : undefined };
      }
      if (current.includes(opt.value)) {
        const otherSameValue = articleTypeOptions.filter((o) => o.value === opt.value && o.label !== opt.label);
        const next = current.filter((t) => t !== opt.value).concat(otherSameValue.map((o) => articleTypeKey(o)));
        return { ...prev, articleTypes: next.length ? next : undefined };
      }
      const next = [...current, key];
      return { ...prev, articleTypes: next };
    });
  };

  /** 6 marques les plus connues selon le type (toujours nombre pair : 6, 4, 2 ou 0) */
  const marquesSuggestion = useMemo(() => {
    const selectedTypes = filters.categories ?? (filters.category ? [filters.category] : []);
    const firstType = selectedTypes.length > 0 ? selectedTypes[0] : 'sacs';
    const list = MARQUES_PLUS_CONNUES_PAR_TYPE[firstType] ?? MARQUES_PLUS_CONNUES_PAR_TYPE.sacs;
    const fromType = list.filter((b) => marquesAlphabetiques.includes(b));
    const max6 = fromType.length >= 6 ? fromType.slice(0, 6) : [...fromType, ...marquesAlphabetiques.filter((b) => !fromType.includes(b))].slice(0, 6);
    const n = Math.min(max6.length, 6);
    const even = n % 2 === 0 ? n : n - 1;
    return max6.slice(0, Math.max(0, even));
  }, [filters.categories, filters.category, marquesAlphabetiques]);

  /** 6 modèles les plus connus selon le type et la marque (toujours nombre pair : 6, 4, 2 ou 0) */
  const modelesSuggestion = useMemo(() => {
    const selectedTypes = filters.categories ?? (filters.category ? [filters.category] : []);
    const categoryKeys = selectedTypes.length > 0 ? [...new Set(selectedTypes.flatMap((t) => CATEGORY_TO_BRAND_KEYS[t] ?? [t]))] : [];
    const selectedBrands = filters.brands ?? (filters.brand ? [filters.brand] : []);
    let fromSuggest: string[] = [];
    if (categoryKeys.includes('vetements')) {
      fromSuggest = MODELES_FAVORIS_VETEMENTS.filter((m) => modelesAlphabetiques.includes(m));
    } else if (selectedBrands.length === 1) {
      const list = MODELES_PLUS_CONNUS_PAR_MARQUE[selectedBrands[0]] ?? [];
      fromSuggest = list.filter((m) => modelesAlphabetiques.includes(m));
    } else if (selectedBrands.length > 1) {
      const seen = new Set<string>();
      for (const brand of selectedBrands) {
        const list = MODELES_PLUS_CONNUS_PAR_MARQUE[brand] ?? [];
        for (const m of list) {
          if (modelesAlphabetiques.includes(m)) seen.add(m);
        }
      }
      fromSuggest = [...seen];
    } else {
      const fallback = ['Submariner', 'Birkin', 'Kelly', 'Speedmaster', 'Santos', 'Lady Dior'];
      fromSuggest = fallback.filter((m) => modelesAlphabetiques.includes(m));
    }
    const max6 = fromSuggest.length >= 6 ? fromSuggest.slice(0, 6) : [...fromSuggest, ...modelesAlphabetiques.filter((m) => !fromSuggest.includes(m) && m !== 'Autre' && m.toLowerCase() !== 'autre')].slice(0, 6);
    const n = Math.min(max6.length, 6);
    const even = n % 2 === 0 ? n : n - 1;
    return max6.slice(0, Math.max(0, even));
  }, [filters.categories, filters.category, filters.brands, filters.brand, modelesAlphabetiques]);

  /** Couleurs proposées selon le(s) type(s) d'article sélectionné(s) (COLORS_BY_CATEGORY). */
  const couleursDisponibles = useMemo(() => {
    const selectedTypes = filters.categories ?? (filters.category ? [filters.category] : []);
    if (selectedTypes.length === 0) return COLORS;
    const categoryKeys = [...new Set(selectedTypes.flatMap((t) => CATEGORY_TO_BRAND_KEYS[t] ?? [t]))];
    const seen = new Set<string>();
    const out: { value: string; label: string }[] = [];
    for (const k of categoryKeys) {
      const list = COLORS_BY_CATEGORY[k];
      if (!list) continue;
      for (const c of list) {
        if (!seen.has(c.value)) {
          seen.add(c.value);
          out.push(c);
        }
      }
    }
    return out.length ? out : COLORS;
  }, [filters.categories, filters.category]);

  /** Matières proposées selon le(s) type(s) d'article sélectionné(s) (MATIERES_BY_CATEGORY). */
  const matieresDisponibles = useMemo(() => {
    const selectedTypes = filters.categories ?? (filters.category ? [filters.category] : []);
    if (selectedTypes.length === 0) return MATERIALS;
    const categoryKeys = [...new Set(selectedTypes.flatMap((t) => CATEGORY_TO_BRAND_KEYS[t] ?? [t]))];
    const seen = new Set<string>();
    const out: { value: string; label: string }[] = [];
    for (const k of categoryKeys) {
      const list = MATIERES_BY_CATEGORY[k];
      if (!list) continue;
      for (const m of list) {
        if (!seen.has(m.value)) {
          seen.add(m.value);
          out.push(m);
        }
      }
    }
    return out.length ? out : MATERIALS;
  }, [filters.categories, filters.category]);

  // États locaux pour les inputs de prix et d'année (évite le re-render à chaque frappe)
  const [localPriceMin, setLocalPriceMin] = useState('');
  const [localPriceMax, setLocalPriceMax] = useState('');
  const [localYearMin, setLocalYearMin] = useState('');
  const [localYearMax, setLocalYearMax] = useState('');

  const [listings, setListings] = useState<Listing[]>([]);
  /** Étiquette prix (même logique que page produit section Prix) : id → { label, color } */
  const [dealByListingId, setDealByListingId] = useState<Record<string, { label: string; color: string }>>({});
  const [loading, setLoading] = useState(true);
  const { user, isAuthenticated } = useAuth();
  /** Ids des annonces mises en favoris par l'utilisateur connecté */
  const [favoritedListingIds, setFavoritedListingIds] = useState<Record<string, boolean>>({});
  const [loadingFavoriteId, setLoadingFavoriteId] = useState<string | null>(null);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [sellerLoading, setSellerLoading] = useState(false);
  /** false tant que la fiche vendeur n’a pas fini de charger. */
  const [sellerProfileResolved, setSellerProfileResolved] = useState(false);
  const sellerFetchIdRef = useRef(0);
  /** Bannière boutique : affichée dès l’URL /catalogue/vendeur/… valide, y compris avant résolution du sellerId */
  const showVendeurStoreBanner = useMemo(() => {
    const slugOk = isVendeurCataloguePath && Boolean(parsedVendeurSlug) && !vendeurParseInvalid && !vendeurSlugError;
    const base = Boolean(filters.sellerId) || slugOk;
    if (!base) return false;
    if (filters.sellerId && sellerProfileResolved && !seller) return false;
    return true;
  }, [
    filters.sellerId,
    isVendeurCataloguePath,
    parsedVendeurSlug,
    vendeurParseInvalid,
    vendeurSlugError,
    sellerProfileResolved,
    seller,
  ]);
  /** Sous le nom vendeur : n’afficher le décompte que lorsque la liste reflète le filtre vendeur (évite apparition / disparition au passage catalogue → boutique). */
  const sellerStoreBannerListingsLine = useMemo(() => {
    if (!filters.sellerId) return '';
    const listingsCoherentForSeller =
      listings.length === 0
        ? !loading
        : listings.every((l) => l.sellerId === filters.sellerId);
    if (!listingsCoherentForSeller) return '';
    return `${listings.length} annonce${listings.length !== 1 ? 's' : ''}`;
  }, [filters.sellerId, loading, listings]);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestionsOpen, setSearchSuggestionsOpen] = useState(false);
  const searchBarRef = useRef<HTMLDivElement>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Titres d'annonces pour les suggestions de recherche (sans appliquer les filtres) */
  const [allListingTitlesForSearch, setAllListingTitlesForSearch] = useState<string[]>([]);
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const sortDropdownRefMobile = useRef<HTMLDivElement>(null);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  /** Affichage des annonces : grille (défaut) ou horizontal — localStorage + `view=line` / `view=grid` dans l’URL (repère retour annonce). */
  const [viewMode, setViewMode] = useState<'horizontal' | 'grid'>('grid');
  const catalogueListViewBootstrappedRef = useRef(false);
  useLayoutEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.innerWidth <= 767) {
      setViewMode('grid');
      catalogueListViewBootstrappedRef.current = true;
      return;
    }
    const v = searchParams.get('view');
    if (v === 'line' || v === 'list') {
      setViewMode('horizontal');
      catalogueListViewBootstrappedRef.current = true;
      try {
        localStorage.setItem('catalogue-view-mode', 'horizontal');
      } catch {
        /* ignore */
      }
      return;
    }
    if (v === 'grid') {
      setViewMode('grid');
      catalogueListViewBootstrappedRef.current = true;
      try {
        localStorage.setItem('catalogue-view-mode', 'grid');
      } catch {
        /* ignore */
      }
      return;
    }
    if (!catalogueListViewBootstrappedRef.current) {
      catalogueListViewBootstrappedRef.current = true;
      const saved = localStorage.getItem('catalogue-view-mode');
      if (saved === 'grid' || saved === 'horizontal') setViewMode(saved);
    }
  }, [searchParams]);
  /** Largeur téléphone (alignée sur globals.css / barre filtres). */
  const [isMobile, setIsMobile] = useState(false);
  useLayoutEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 767px)');
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);
  const [showMapPopup, setShowMapPopup] = useState(false);
  const [showAuthModalFavoris, setShowAuthModalFavoris] = useState(false);
  /** Tailles de montres présentes dans les annonces (rempli quand catégorie montres est sélectionnée). */
  const [montresSizeOptions, setMontresSizeOptions] = useState<string[]>([]);
  /** Tailles pantalon / jean / robe présentes dans les annonces (rempli quand catégorie vêtements est sélectionnée). */
  const [pantalonSizeOptions, setPantalonSizeOptions] = useState<string[]>([]);
  const [jeanSizeOptions, setJeanSizeOptions] = useState<string[]>([]);
  const [robeSizeOptions, setRobeSizeOptions] = useState<string[]>([]);
  const [mapZoom, setMapZoom] = useState(13);
  /** Évite que l'effet "retirer condition" ne s'exécute juste après une synchro URL → filtres (clic Neuf/Occasion). */
  const justSyncedConditionFromUrlRef = useRef(false);
  /** Quand true, les filtres viennent d'être mis à jour depuis le lien Neuf/Occasion ; ne pas resynchroniser vers l'URL (évite boucle). */
  const justSetFiltersFromConditionRef = useRef(false);
  /** Dernière chaîne URL qu'on a écrite nous-mêmes (évite boucle synchro URL ↔ filtres). */
  const lastSyncedUrlRef = useRef<string | null>(null);
  /** Changement de page uniquement (pagination Neuf/Occasion) : ne pas refaire setFilters pour garder la même animation qu'au catalogue. */
  const navigatingPageOnlyRef = useRef(false);
  /** Ignorer les réponses de loadListings périmées (ex. retour au catalogue avec filtres). */
  const loadListingsIdRef = useRef(0);
  /** Localisation : saisie pour suggestions (code postal ou région) */
  const [locationQuery, setLocationQuery] = useState('');
  const [locationSuggestionsOpen, setLocationSuggestionsOpen] = useState(false);
  const locationInputRef = useRef<HTMLDivElement>(null);

  /** Rayon en km (0 = désactivé) et position utilisateur pour filtre "autour de ma position". */
  const [radiusKm, setRadiusKm] = useState(0);
  const [userCoords, setUserCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const postcodeCoordsCacheRef = useRef<Map<string, { lat: number; lon: number }>>(new Map());

  const [etatInfoClicked, setEtatInfoClicked] = useState(false);
  const [etatInfoHover, setEtatInfoHover] = useState(false);
  const etatInfoRef = useRef<HTMLDivElement>(null);

  const resultsTopRef = useRef<HTMLDivElement>(null);

  const [page, setPage] = useState<number>(() => parsePositiveInt(searchParams.get('page'), 1));

  const navigateToPage = useCallback(
    (nextPage: number, replace = false) => {
      const omitSellerInQuery = pathname.startsWith('/catalogue/vendeur/');
      const params = filtersToParams(filters, nextPage, { omitSellerId: omitSellerInQuery });
      appendCatalogueListViewParam(params, viewMode, isMobile);
      const q = params.toString();
      lastSyncedUrlRef.current = q ? normalizeQueryString(params) : '';
      const url = q ? `${pathname}?${q}` : pathname;
      if (replace) router.replace(url, { scroll: false });
      else router.push(url, { scroll: false });
    },
    [router, pathname, filters, viewMode, isMobile]
  );

  // Sync état local page ← URL (back/forward, lien partagé, etc.)
  useEffect(() => {
    setPage(parsePositiveInt(searchParams.get('page'), 1));
  }, [searchParams]);

  const pageSize =
    isMobile && viewMode === 'grid' ? PAGE_SIZE_MOBILE_GRID : PAGE_SIZE_DEFAULT;
  const totalPages = Math.max(1, Math.ceil(listings.length / pageSize));
  /** Tant que les résultats ne sont pas chargés (liste vide + loading), garder la page de l’URL — sinon totalPages=1 et on écrasait ?page=2 au retour arrière. */
  const effectivePage =
    loading && listings.length === 0
      ? Math.max(page, 1)
      : Math.min(Math.max(page, 1), totalPages);
  const paginatedListings = useMemo(() => {
    const start = (effectivePage - 1) * pageSize;
    return listings.slice(start, start + pageSize);
  }, [listings, effectivePage, pageSize]);

  /** URL du catalogue avec les filtres actuels + vue liste/grille (même repère que la barre d’adresse pour le retour annonce). */
  const catalogueReturnUrl = useMemo(() => {
    const omitSellerInQuery = pathname.startsWith('/catalogue/vendeur/');
    const p = filtersToParams(filters, effectivePage, { omitSellerId: omitSellerInQuery });
    appendCatalogueListViewParam(p, viewMode, isMobile);
    const q = p.toString();
    return pathname + (q ? '?' + q : '');
  }, [pathname, filters, effectivePage, viewMode, isMobile]);

  // Ancienne URL ?sellerId= → /catalogue/vendeur/{slug} (plus lisible, sellerId hors query)
  useEffect(() => {
    if (!filters.sellerId || !sellerProfileResolved || sellerLoading) return;
    if (!seller) return;
    if (!pathname?.startsWith('/catalogue')) return;
    if (pathname.startsWith('/catalogue/vendeur/')) return;
    const q = searchParams.get('sellerId');
    if (!q || q !== filters.sellerId) return;
    const pretty = sellerCataloguePath(seller);
    const p = filtersToParams(filters, effectivePage, { omitSellerId: true });
    appendCatalogueListViewParam(p, viewMode, isMobile);
    const qs = p.toString();
    lastSyncedUrlRef.current = qs ? normalizeQueryString(p) : '';
    router.replace(qs ? `${pretty}?${qs}` : pretty, { scroll: false });
  }, [filters.sellerId, seller, sellerLoading, sellerProfileResolved, pathname, searchParams, router, filters, effectivePage, viewMode, isMobile]);

  const rangeStart =
    listings.length === 0 ? 0 : (effectivePage - 1) * pageSize + 1;
  const rangeEnd = Math.min(effectivePage * pageSize, listings.length);

  const goToPage = useCallback(
    (nextPage: number) => {
      const clamped = Math.min(Math.max(nextPage, 1), totalPages);
      if (searchParams.get('condition')) navigatingPageOnlyRef.current = true;
      setPage(clamped);
      navigateToPage(clamped, false);
    },
    [navigateToPage, totalPages, searchParams]
  );

  // Remonter en haut à chaque changement de page — sauf retour annonce avec restauration du scroll (évite d’écraser la position mémorisée).
  const prevEffectivePageRef = useRef(effectivePage);
  /** Après le 1er chargement réel, ignorer le 1er écart URL → page effective (évite un smooth vers le haut au refresh / clamp pagination). */
  const cataloguePaginationScrollPrimedRef = useRef(false);
  useEffect(() => {
    if (catalogueRestoreScrollYRef.current != null) {
      prevEffectivePageRef.current = effectivePage;
      return;
    }
    if (loading) return;
    if (!cataloguePaginationScrollPrimedRef.current) {
      cataloguePaginationScrollPrimedRef.current = true;
      prevEffectivePageRef.current = effectivePage;
      return;
    }
    if (prevEffectivePageRef.current !== effectivePage) {
      prevEffectivePageRef.current = effectivePage;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [effectivePage, loading]);

  // Après chargement : replacer Y en une fois (instantané) ; recalage si la hauteur de page évolue encore (images, layout).
  useEffect(() => {
    if (loading) return;
    const currentHref =
      typeof window !== 'undefined'
        ? `${window.location.pathname}${window.location.search || ''}`
        : `${pathname || ''}${searchParamsString ? `?${searchParamsString}` : ''}`;
    if (catalogueRestoreScrollYRef.current == null) return;
    catalogueRestoreScrollYRef.current = null;
    const y = consumeCatalogueScrollRestore(currentHref);
    if (y == null) return;
    prevEffectivePageRef.current = effectivePage;

    const applyY = (behavior: ScrollBehavior) => {
      setDocumentScrollY(y, behavior);
    };

    let cancelled = false;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (cancelled) return;
        applyY('auto');
      });
    });
    const snapTimer = window.setTimeout(() => {
      if (cancelled) return;
      applyY('auto');
    }, 550);
    return () => {
      cancelled = true;
      window.clearTimeout(snapTimer);
    };
  }, [loading, pathname, searchParamsString, effectivePage]);

  const toggleViewMode = useCallback(() => {
    setViewMode((prev) => {
      const next: 'horizontal' | 'grid' = prev === 'horizontal' ? 'grid' : 'horizontal';
      if (typeof window !== 'undefined') window.localStorage.setItem('catalogue-view-mode', next);
      if (typeof window !== 'undefined' && window.innerWidth > 767) {
        queueMicrotask(() => {
          const omitSellerInQuery = pathname.startsWith('/catalogue/vendeur/');
          const params = filtersToParams(filters, effectivePage, { omitSellerId: omitSellerInQuery });
          appendCatalogueListViewParam(params, next, false);
          const q = params.toString();
          lastSyncedUrlRef.current = q ? normalizeQueryString(params) : '';
          router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
        });
      }
      return next;
    });
  }, [pathname, filters, effectivePage, router]);

  // Reset page à 1 seulement quand les critères de filtre « utiles » changent vraiment (empreinte URL), pas à chaque nouveau objet filters (retour arrière, injection sellerId vendeur, etc.).
  const catalogueFilterSigSnapshotRef = useRef<{ pathname: string; sig: string } | null>(null);
  useLayoutEffect(() => {
    const omitSellerInQuery = pathname.startsWith('/catalogue/vendeur/');
    const sig = catalogueFiltersUrlSignature(filters, { omitSellerId: omitSellerInQuery });

    if (justSetFiltersFromConditionRef.current) {
      justSetFiltersFromConditionRef.current = false;
      catalogueFilterSigSnapshotRef.current = { pathname, sig };
      return;
    }

    const snap = catalogueFilterSigSnapshotRef.current;
    if (!snap || snap.pathname !== pathname) {
      catalogueFilterSigSnapshotRef.current = { pathname, sig };
      return;
    }
    if (snap.sig === sig) {
      return;
    }

    catalogueFilterSigSnapshotRef.current = { pathname, sig };
    setPage(1);
    navigateToPage(1, true);
  }, [filters, navigateToPage, pathname]);

  // Clamp si la page dépasse le nombre total de pages après un changement de résultats (pas pendant le chargement initial : liste vide).
  useEffect(() => {
    if (loading && listings.length === 0) return;
    if (page !== effectivePage) {
      setPage(effectivePage);
      navigateToPage(effectivePage, true);
    }
  }, [page, effectivePage, navigateToPage, loading, listings.length]);

  // Synchroniser depuis l'URL. Clic sur Catalogue dans le header (reset=1) : tout réinitialiser. Clic sur Neuf/Occasion : tout réinitialiser + présélectionner l'état. Sinon (ex. retour depuis page produit) : restaurer les filtres depuis l'URL.
  useEffect(() => {
    if (searchParams.get('reset') === '1') {
      setFilters(defaultFilters);
      setLocalPriceMin('');
      setLocalPriceMax('');
      setLocalYearMin('');
      setLocalYearMax('');
      setSearchQuery('');
      setMarqueSearchQuery('');
      setModeleSearchQuery('');
      setOpenDropdown(null);
      setSortDropdownOpen(false);
      router.replace('/catalogue', { scroll: false });
      return;
    }
    const sellerId = searchParams.get('sellerId');
    const condition = searchParams.get('condition');
    let nextConditions: string[] | undefined;
    if (condition === 'new') nextConditions = ['new'];
    else if (condition === 'occasion') nextConditions = OCCASION_CONDITIONS;
    else nextConditions = undefined;
    if (nextConditions !== undefined) {
      if (navigatingPageOnlyRef.current) {
        navigatingPageOnlyRef.current = false;
        return;
      }
      justSyncedConditionFromUrlRef.current = true;
      justSetFiltersFromConditionRef.current = true;
      const fromUrl = paramsToFilters(searchParams);
      if (pathname.startsWith('/catalogue/vendeur/')) {
        setFilters((prev) => ({
          ...fromUrl,
          conditions: nextConditions,
          sellerId: prev.sellerId ?? (sellerId || undefined),
        }));
      } else {
        setFilters({ ...fromUrl, conditions: nextConditions, sellerId: sellerId || undefined });
      }
      setPage(parsePositiveInt(searchParams.get('page'), 1));
      setLocalPriceMin(fromUrl.priceMin != null ? String(fromUrl.priceMin) : '');
      setLocalPriceMax(fromUrl.priceMax != null ? String(fromUrl.priceMax) : '');
      setLocalYearMin(fromUrl.yearMin != null ? String(fromUrl.yearMin) : '');
      setLocalYearMax(fromUrl.yearMax != null ? String(fromUrl.yearMax) : '');
      setSearchQuery(fromUrl.query ?? '');
      setMarqueSearchQuery('');
      setModeleSearchQuery('');
      setOpenDropdown(null);
      return;
    }
    // Éviter de réappliquer les filtres quand l'URL vient d'être mise à jour par nous (évite boucle)
    const currentQuery = searchParams.toString();
    const normalizedCurrent = currentQuery ? normalizeQueryString(new URLSearchParams(currentQuery)) : '';
    if (lastSyncedUrlRef.current !== null && normalizedCurrent === lastSyncedUrlRef.current) {
      lastSyncedUrlRef.current = null;
      return;
    }
    lastSyncedUrlRef.current = null;
    // Retour depuis page produit ou autre : restaurer filtres et page depuis l'URL
    const fromUrl = paramsToFilters(searchParams);
    const omitSellerInQuery = pathname.startsWith('/catalogue/vendeur/');
    setFilters((prev) => {
      const merged = omitSellerInQuery
        ? { ...fromUrl, sellerId: prev.sellerId ?? fromUrl.sellerId }
        : fromUrl;
      const prevSig = catalogueFiltersUrlSignature(prev, { omitSellerId: omitSellerInQuery });
      const nextSig = catalogueFiltersUrlSignature(merged, { omitSellerId: omitSellerInQuery });
      return prevSig === nextSig ? prev : merged;
    });
    const pageFromUrl = parsePositiveInt(searchParams.get('page'), 1);
    setPage((p) => (p === pageFromUrl ? p : pageFromUrl));
    setLocalPriceMin(fromUrl.priceMin != null ? String(fromUrl.priceMin) : '');
    setLocalPriceMax(fromUrl.priceMax != null ? String(fromUrl.priceMax) : '');
    setLocalYearMin(fromUrl.yearMin != null ? String(fromUrl.yearMin) : '');
    setLocalYearMax(fromUrl.yearMax != null ? String(fromUrl.yearMax) : '');
    setSearchQuery(fromUrl.query ?? '');
  }, [searchParams, pathname]);

  /** Lien partagé avec `?sellerId=` : une fois le filtre connu, retirer le paramètre (URL lisible, état inchangé). */
  useEffect(() => {
    if (!pathname?.startsWith('/catalogue/vendeur/')) return;
    const qSid = searchParams.get('sellerId');
    if (!qSid || !filters.sellerId || qSid !== filters.sellerId) return;
    const params = new URLSearchParams(searchParams.toString());
    params.delete('sellerId');
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [pathname, filters.sellerId, searchParams, router]);

  // Si on était sur Neuf ou Occasion (lien header) et que l'utilisateur change le filtre état, repasser l'URL en /catalogue pour garder « Catalogue » actif. Ne pas retirer condition juste après un clic Neuf/Occasion (synchro URL → filtres).
  useEffect(() => {
    if (justSyncedConditionFromUrlRef.current) {
      justSyncedConditionFromUrlRef.current = false;
      return;
    }
    const urlCondition = searchParams.get('condition');
    if (!urlCondition) return;
    const conds = filters.conditions ?? [];
    const matchNew = conds.length === 1 && conds[0] === 'new';
    const matchOccasion = conds.length === OCCASION_CONDITIONS.length && OCCASION_CONDITIONS.every((c, i) => conds[i] === c);
    const stillMatches = (urlCondition === 'new' && matchNew) || (urlCondition === 'occasion' && matchOccasion);
    if (stillMatches) return;
    const params = new URLSearchParams(searchParams.toString());
    params.delete('condition');
    const q = params.toString();
    const basePath = pathname.startsWith('/catalogue/vendeur/') ? pathname : '/catalogue';
    router.replace(q ? `${basePath}?${q}` : basePath, { scroll: false });
  }, [filters.conditions, searchParams, router, pathname]);

  // Charger des titres d'annonces sans filtre pour les suggestions de la barre de recherche (toujours les mêmes qu'il y ait des filtres ou non)
  useEffect(() => {
    getListings({ limitCount: 150 })
      .then((list) => setAllListingTitlesForSearch(list.map((l) => l.title).filter(Boolean)))
      .catch(() => setAllListingTitlesForSearch([]));
  }, []);

  /** Avant le paint : évite une frame avec sellerId connu mais état « résolu » obsolète. */
  useLayoutEffect(() => {
    if (!filters.sellerId) {
      setSeller(null);
      setSellerLoading(false);
      setSellerProfileResolved(false);
      return;
    }
    setSeller(null);
    setSellerLoading(true);
    setSellerProfileResolved(false);
  }, [filters.sellerId]);

  // Charger les infos vendeur quand sellerId est présent
  useEffect(() => {
    if (!filters.sellerId) return;
    const fetchId = ++sellerFetchIdRef.current;
    const id = filters.sellerId;
    getSellerData(id)
      .then((data) => {
        if (sellerFetchIdRef.current !== fetchId) return;
        setSeller(data || null);
        setSellerLoading(false);
        setSellerProfileResolved(true);
      })
      .catch(() => {
        if (sellerFetchIdRef.current !== fetchId) return;
        setSeller(null);
        setSellerLoading(false);
        setSellerProfileResolved(true);
      });
  }, [filters.sellerId]);

  // Applique les filtres de prix et d'année (au blur)
  const applyPriceFilter = () => {
    setFilters(prev => ({
      ...prev,
      priceMin: localPriceMin ? Number(localPriceMin) : undefined,
      priceMax: localPriceMax ? Number(localPriceMax) : undefined,
    }));
  };
  const applyYearFilter = () => {
    setFilters(prev => ({
      ...prev,
      yearMin: localYearMin ? Number(localYearMin) : undefined,
      yearMax: localYearMax ? Number(localYearMax) : undefined,
    }));
  };

  const loadListings = useCallback(async () => {
    const loadId = ++loadListingsIdRef.current;
    setLoading(true);
    setDealByListingId({});
    /** Si true, le `finally` ne force pas `loading` à false (ex. attente résolution slug → sellerId sur /catalogue/vendeur/…). */
    let skipLoadingOffInFinally = false;
    try {
      if (vendeurParseInvalid && !filters.sellerId) {
        setListings([]);
        setLoading(false);
        return;
      }
      if (isVendeurCataloguePath && parsedVendeurSlug) {
        if (vendeurSlugError && !filters.sellerId) {
          setListings([]);
          setLoading(false);
          return;
        }
        if (!filters.sellerId) {
          setLoading(true);
          skipLoadingOffInFinally = true;
          return;
        }
      }
      let sortBy: 'newest' | 'oldest' | 'price_asc' | 'price_desc' | 'likes' = 'newest';
      if (filters.sortBy === 'date_asc') sortBy = 'oldest';
      else if (filters.sortBy === 'price_asc') sortBy = 'price_asc';
      else if (filters.sortBy === 'price_desc') sortBy = 'price_desc';
      else if (filters.sortBy === 'likes') sortBy = 'likes';

      const categories = filters.categories?.length ? filters.categories : (filters.category ? [filters.category] : undefined);
      const brands = filters.brands?.length ? filters.brands : (filters.brand ? [filters.brand] : undefined);
      const rawModels = filters.models?.length ? filters.models : (filters.model ? [filters.model] : undefined);
      const models = rawModels ? [...new Set(rawModels.flatMap(getModelFilterVariants))] : undefined;
      const colors = filters.colors?.length ? filters.colors : (filters.color ? [filters.color] : undefined);
      const materials = filters.materials?.length ? filters.materials : (filters.material ? [filters.material] : undefined);
      const conditions = filters.conditions?.length ? filters.conditions : (filters.condition ? [filters.condition] : undefined);
      const sizes = filters.sizes?.length ? filters.sizes : undefined;
      const genres = filters.genre?.length ? filters.genre : undefined;
      const articleTypes = filters.articleTypes?.length
        ? expandArticleTypesForFilter(selectedArticleTypeValues)
        : undefined;
      const limitCount = radiusKm > 0 && userCoords ? 3000 : 200;
      const data = await getListings({ categories, brands, models, colors, materials, conditions, sizes, genres, articleTypes, sellerId: filters.sellerId, sortBy, limitCount });

      if (loadId !== loadListingsIdRef.current) return;

      let filtered = data;
      if (filters.priceMin) filtered = filtered.filter((l) => l.price >= filters.priceMin!);
      if (filters.priceMax) filtered = filtered.filter((l) => l.price <= filters.priceMax!);
      if (filters.yearMin != null) filtered = filtered.filter((l) => (l.year ?? 0) >= filters.yearMin!);
      if (filters.yearMax != null) filtered = filtered.filter((l) => (l.year ?? 0) <= filters.yearMax!);
      if (filters.query) {
        const words = filters.query
          .trim()
          .split(/\s+/)
          .filter(Boolean)
          .map((w) => normalizeForSearch(w));
        if (words.length > 0) {
          filtered = filtered.filter((l) => {
            const titleNorm = normalizeForSearch(l.title);
            const descNorm = normalizeForSearch(l.description ?? '');
            const sellerNorm = l.sellerName ? normalizeForSearch(l.sellerName) : '';
            const brandNorm = l.brand ? normalizeForSearch(l.brand) : '';
            const categoryNorm = l.category ? normalizeForSearch(CATEGORIES.find((c) => c.value === l.category)?.label ?? '') : '';
            const modelNorm = l.model ? normalizeForSearch(l.model) : '';
            let searchable = `${titleNorm} ${descNorm} ${sellerNorm} ${brandNorm} ${categoryNorm} ${modelNorm}`;
            if (l.category && CATEGORY_SEARCH_KEYWORDS[l.category]) {
              searchable += ' ' + CATEGORY_SEARCH_KEYWORDS[l.category].map(normalizeForSearch).join(' ');
            }
            const termGroups = words.map((word) => {
              const correction = SEARCH_TYPO_MAP[word];
              return correction ? [word, normalizeForSearch(correction)] : [word];
            });
            return termGroups.every((group) => group.some((term) => searchable.includes(term)));
          });
        }
      }
      /** Filtre localisation (multi : villes, codes postaux, régions) */
      const locList = filters.locations?.length
        ? filters.locations
        : filters.postalCode
          ? [{ label: filters.postalCode, prefixes: (() => {
              const code = filters.postalCode!.replace(/\s/g, '').slice(0, 2);
              return code === '2A' || code === '2B' ? ['2A', '2B'] : [code];
            })() }]
          : filters.region
            ? (REGIONS_FR.find((r) => r.name === filters.region) ? [{ label: filters.region!, prefixes: REGIONS_FR.find((r) => r.name === filters.region)!.depts }] : [])
            : [];
      if (locList.length > 0) {
        const allowedPrefixes = locList.flatMap((x) => x.prefixes);
        filtered = filtered.filter((l) => {
          const pc = l.sellerPostcode?.replace(/\s/g, '');
          if (!pc) return false;
          return allowedPrefixes.some((prefix) => {
            if (prefix === '2A' || prefix === '2B') return pc.startsWith('20');
            if (prefix.length > 2) return pc.startsWith(prefix);
            const dept = pc.startsWith('20') ? '20' : pc.slice(0, 2);
            return dept === prefix || pc.startsWith(prefix);
          });
        });
      }

      /**
       * Filtre rayon (km) :
       * - Pas de km sélectionné (0) → ne pas prendre en compte le filtre.
       * - 5 / 10 / 20 / 50 / 100 / 200 km → n'afficher que les annonces des vendeurs situés à au plus cette distance de la position de l'utilisateur.
       */
      if (radiusKm > 0) {
        if (!userCoords) {
          filtered = [];
        } else {
          const isValidKey = (key: string) => key.length >= 5 || key === '2A' || key === '2B';
          const cache = postcodeCoordsCacheRef.current;
          const postcodesNorm = filtered
            .map((l) => normalizePostcodeKey(l.sellerPostcode))
            .filter((key) => isValidKey(key));
          const uniquePostcodes = [...new Set(postcodesNorm)];
          const coordsMap = new Map<string, { lat: number; lon: number }>();
          for (const pcNorm of uniquePostcodes) {
            let c: { lat: number; lon: number } | undefined = cache.get(pcNorm);
            if (!c) {
              const fetched = await fetchCoordsForPostcode(pcNorm);
              if (fetched) {
                cache.set(pcNorm, fetched);
                c = fetched;
              }
            }
            if (c) coordsMap.set(pcNorm, c);
          }
          const userPostcode = await fetchPostcodeFromCoords(userCoords.lat, userCoords.lon);
          const userPostcodeNorm = userPostcode?.replace(/\s/g, '').trim() ?? '';
          const userNorm5 = normalizePostcodeKey(userPostcodeNorm);
          const epsilonKm = 0.2;
          filtered = filtered.filter((l) => {
            const pcNorm = normalizePostcodeKey(l.sellerPostcode);
            if (!pcNorm || !isValidKey(pcNorm)) return false;
            if (userNorm5 && (pcNorm === userNorm5 || (userPostcodeNorm && l.sellerPostcode?.replace(/\s/g, '').trim() === userPostcodeNorm))) return true;
            if (userNorm5 && isValidKey(userNorm5) && pcNorm.slice(0, 2) === '75' && userNorm5.slice(0, 2) === '75' && pcNorm.slice(-2) === userNorm5.slice(-2)) return true;
            const c = coordsMap.get(pcNorm);
            if (!c) return false;
            const d = haversineKm(userCoords, c);
            return d <= radiusKm + epsilonKm;
          });
          // Avec filtre rayon : tri par plus récent (pas par distance)
          filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        }
      }

      if (loadId !== loadListingsIdRef.current) return;
      setListings(filtered);
      if (loadId !== loadListingsIdRef.current) return;
      setLoading(false);

      // Calcul des étiquettes « bonne affaire » en différé pour ne pas bloquer l’affichage (N requêtes getListings)
      const computeDeal = async () => {
        const keyToPair = new Map<string, { category: string; brand: string | undefined; articleType: string | undefined; condition: string | undefined }>();
        filtered.forEach((l) => {
          const k = `${l.category}_${l.brand ?? 'all'}_${l.articleType ?? 'all'}_${l.condition ?? 'all'}`;
          if (!keyToPair.has(k)) keyToPair.set(k, { category: l.category, brand: l.brand ?? undefined, articleType: l.articleType ?? undefined, condition: l.condition ?? undefined });
        });
        const pairs = [...keyToPair.entries()];
        const similarLists = await Promise.all(
          pairs.map(([, p]) =>
            getListings({
              category: p.category,
              brand: p.brand ?? undefined,
              articleTypes: p.articleType ? [p.articleType] : undefined,
              condition: p.condition ?? undefined,
              limitCount: 100,
            })
          )
        );
        const similarByKey = new Map<string, { id: string; price: number; model?: string | null; year?: number | null }[]>();
        pairs.forEach(([k], i) => {
          similarByKey.set(
            k,
            similarLists[i].filter((l) => l.price > 0).map((l) => ({ id: l.id, price: l.price, model: l.model, year: l.year }))
          );
        });
        const next: Record<string, { label: string; color: string }> = {};
        filtered.forEach((listing) => {
          const k = `${listing.category}_${listing.brand ?? 'all'}_${listing.articleType ?? 'all'}_${listing.condition ?? 'all'}`;
          const listingYear = listing.year ?? null;
          const others = (similarByKey.get(k) ?? []).filter(
            (x) =>
              x.id !== listing.id &&
              (listing.model == null ? x.model == null : x.model === listing.model) &&
              (listingYear == null || (x.year != null && Math.abs(x.year - listingYear) <= 2))
          );
          if (others.length === 0) return;
          const average = others.reduce((s, x) => s + x.price, 0) / others.length;
          const deal = getDealLevel(listing.price, average);
          next[listing.id] = { label: deal.label, color: deal.color };
        });
        if (loadListingsIdRef.current === loadId) setDealByListingId(next);
      };
      if (typeof requestIdleCallback !== 'undefined') {
        requestIdleCallback(() => { computeDeal(); }, { timeout: 2000 });
      } else {
        setTimeout(() => { computeDeal(); }, 0);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : (error && typeof error === 'object' && 'message' in error ? String((error as { message?: unknown }).message) : null);
      if (msg) console.error('Catalogue loadListings:', msg);
    } finally {
      if (loadId === loadListingsIdRef.current && !skipLoadingOffInFinally) {
        setLoading(false);
      }
    }
  }, [filters, radiusKm, userCoords, isVendeurCataloguePath, parsedVendeurSlug, vendeurParseInvalid, vendeurSlugError]);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  /** Demander la position (appelée quand l'utilisateur sélectionne un rayon > 0). */
  const requestPosition = useCallback(() => {
    setGeoError(null);
    setGeoLoading(true);
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGeoError("La géolocalisation n'est pas supportée par votre navigateur.");
      setGeoLoading(false);
      return;
    }
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      setGeoError("La géolocalisation n'est disponible qu'en HTTPS. Ouvrez le site avec une adresse commençant par https:// (ou utilisez localhost en développement).");
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
        setUserCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
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
      options
    );
  }, []);

  /** Ne pas demander la position depuis un useEffect : le navigateur exige un geste utilisateur (clic). */

  /** Fermer le tooltip État (i) au clic ailleurs sur la page */
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

  /** Quand aucun résultat, remonter en haut pour afficher le message et le bouton Réinitialiser les filtres */
  useEffect(() => {
    if (!loading && listings.length === 0) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [loading, listings.length]);

  /** Charger les favoris de l'utilisateur pour les annonces affichées */
  useEffect(() => {
    if (!isAuthenticated || !user || listings.length === 0) return;
    getUserFavoriteListingIds(user.uid).then((ids) => {
      setFavoritedListingIds((prev) => {
        const next = { ...prev };
        ids.forEach((id) => (next[id] = true));
        return next;
      });
    });
  }, [isAuthenticated, user, listings.length]);

  const handleFavoriteClick = useCallback(
    async (e: React.MouseEvent, listingId: string) => {
      e.preventDefault();
      e.stopPropagation();
      if (!user) {
        setShowAuthModalFavoris(true);
        return;
      }
      if (loadingFavoriteId) return;
      setLoadingFavoriteId(listingId);
      try {
        const isFav = favoritedListingIds[listingId];
        if (isFav) {
          await removeFavorite(user.uid, listingId);
          setFavoritedListingIds((prev) => ({ ...prev, [listingId]: false }));
        } else {
          await addFavorite(user.uid, listingId);
          setFavoritedListingIds((prev) => ({ ...prev, [listingId]: true }));
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : (err && typeof err === 'object' && 'message' in err ? String((err as { message?: unknown }).message) : null);
        if (msg) console.error('Catalogue favori:', msg);
      } finally {
        setLoadingFavoriteId(null);
      }
    },
    [user, loadingFavoriteId, favoritedListingIds]
  );

  useLayoutEffect(() => {
    if (!marqueDropdownOpen) setMarqueSearchQuery('');
  }, [marqueDropdownOpen]);

  useLayoutEffect(() => {
    if (!modeleDropdownOpen) setModeleSearchQuery('');
  }, [modeleDropdownOpen]);

  useLayoutEffect(() => {
    if (!pointureDropdownOpen) setPointureSearchQuery('');
  }, [pointureDropdownOpen]);

  /** Charger les tailles de montres existantes en annonces quand la catégorie montres est sélectionnée. */
  useEffect(() => {
    const types = filters.categories ?? (filters.category ? [filters.category] : []);
    if (!types.includes('montres')) {
      setMontresSizeOptions([]);
      return;
    }
    let cancelled = false;
    getDistinctSizesForCategory('montres').then((sizes) => {
      if (!cancelled) setMontresSizeOptions(sizes);
    });
    return () => { cancelled = true; };
  }, [filters.categories, filters.category]);

  /** Charger les tailles pantalon / jean / robe présentes en annonces quand la catégorie vêtements est sélectionnée. */
  useEffect(() => {
    const types = filters.categories ?? (filters.category ? [filters.category] : []);
    if (!types.includes('vetements')) {
      setPantalonSizeOptions([]);
      setJeanSizeOptions([]);
      setRobeSizeOptions([]);
      return;
    }
    let cancelled = false;
    Promise.all([
      getDistinctSizesForCategoryAndArticleTypes('vetements', ['pantalon', 'pantalon_short']),
      getDistinctSizesForCategoryAndArticleTypes('vetements', ['jean']),
      getDistinctSizesForCategoryAndArticleTypes('vetements', ['robe']),
    ]).then(([pantalon, jean, robe]) => {
      if (!cancelled) {
        setPantalonSizeOptions(pantalon);
        setJeanSizeOptions(jean);
        setRobeSizeOptions(robe);
      }
    });
    return () => { cancelled = true; };
  }, [filters.categories, filters.category]);

  /** Fermer le menu au clic extérieur ou Escape (un seul menu ouvert à la fois). Fermer aussi le tri « Plus récents » au clic à côté. */
  useEffect(() => {
    const ref =
      openDropdown === 'type' ? typeDropdownRef :
      openDropdown === 'articleType' ? articleTypeDropdownRef :
      openDropdown === 'marque' ? marqueDropdownRef :
      openDropdown === 'modele' ? modeleDropdownRef :
      openDropdown === 'taille' ? tailleDropdownRef :
      openDropdown === 'pointure' ? pointureDropdownRef :
      openDropdown === 'color' ? colorDropdownRef :
      materialDropdownRef;
    const onMouseDown = (e: MouseEvent) => {
      if (openDropdown !== null && ref.current && !ref.current.contains(e.target as Node)) setOpenDropdown(null);
      const inSort = sortDropdownRef.current?.contains(e.target as Node) || sortDropdownRefMobile.current?.contains(e.target as Node);
      if (!inSort) setSortDropdownOpen(false);
      if (locationInputRef.current && !locationInputRef.current.contains(e.target as Node)) setLocationSuggestionsOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenDropdown(null);
      if (e.key === 'Escape') setSortDropdownOpen(false);
      if (e.key === 'Escape') setLocationSuggestionsOpen(false);
    };
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [openDropdown, sortDropdownOpen]);

  const updateFilter = (key: keyof Filters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value || undefined }));
  };

  const selectedTypes = filters.categories ?? (filters.category ? [filters.category] : []);
  const toggleType = (value: string) => {
    setFilters((prev) => {
      const current = prev.categories ?? (prev.category ? [prev.category] : []);
      const next = current.includes(value) ? current.filter((c) => c !== value) : [...current, value];
      const base = { ...prev, categories: next.length ? next : undefined, category: undefined, articleTypes: undefined };
      if (next.length === 0) return { ...base, brands: undefined, brand: undefined, models: undefined, model: undefined };
      const categoryKeys = [...new Set(next.flatMap((t) => CATEGORY_TO_BRAND_KEYS[t] ?? [t]))];
      const validBrandSet = new Set(categoryKeys.flatMap((k) => BRANDS_BY_CATEGORY[k] ?? []));
      const prevBrands = prev.brands ?? (prev.brand ? [prev.brand] : []);
      const keptBrands = prevBrands.filter((b) => validBrandSet.has(b));
      const brandsChanged = keptBrands.length !== prevBrands.length;
      const nextBrands = keptBrands.length ? keptBrands : undefined;
      const prevModels = prev.models ?? (prev.model ? [prev.model] : []);
      if (keptBrands.length === 0) {
        return { ...base, brands: nextBrands, brand: undefined, models: undefined, model: undefined };
      }
      if (prevModels.length === 0) {
        return { ...base, brands: nextBrands, brand: undefined, ...(brandsChanged ? { models: undefined, model: undefined } : {}) };
      }
      const modelSet = new Set<string>();
      for (const cat of categoryKeys) {
        const byBrand = MODELS_BY_CATEGORY_BRAND[cat];
        if (!byBrand) continue;
        for (const brand of keptBrands) {
          const models = byBrand[brand];
          if (models) models.forEach((m) => modelSet.add(m));
        }
      }
      const keptModels = prevModels.filter((m) => modelSet.has(m));
      const nextModels = keptModels.length ? keptModels : undefined;
      return {
        ...base,
        brands: nextBrands,
        brand: undefined,
        models: nextModels,
        model: undefined,
      };
    });
  };

  const selectedBrands = filters.brands ?? (filters.brand ? [filters.brand] : []);
  const toggleBrand = (brand: string) => {
    setFilters((prev) => {
      const current = prev.brands ?? (prev.brand ? [prev.brand] : []);
      const next = current.includes(brand) ? current.filter((b) => b !== brand) : [...current, brand];
      const removingBrand = next.length < current.length;
      return {
        ...prev,
        brands: next.length ? next : undefined,
        brand: undefined,
        ...(removingBrand ? { models: undefined, model: undefined } : {}),
      };
    });
  };

  const selectedModels = filters.models ?? (filters.model ? [filters.model] : []);
  const hasPantalonModel = selectedModels.some((m) => normalizeForSearch(m).includes('pantalon'));
  const hasJeanModel = selectedModels.some((m) => normalizeForSearch(m).includes('jean'));
  const hasPantalonType = selectedArticleTypeValues.includes('pantalon') || selectedArticleTypeValues.includes('pantalon_short');
  const hasJeanType = selectedArticleTypeValues.includes('jean');
  const hasRobeType = selectedArticleTypeValues.includes('robe');
  /** Si catégorie vêtements sans filtre par type : afficher toutes les tailles spécifiques. */
  const noVetementsTypeSelected = selectedTypes.includes('vetements') && selectedArticleTypeValues.length === 0;
  const showPantSizes = hasPantalonModel || hasPantalonType || noVetementsTypeSelected;
  const showJeanSizes = hasJeanModel || hasJeanType || noVetementsTypeSelected;
  const showRobeSizes = hasRobeType || noVetementsTypeSelected;
  /** Options de taille vêtements : taille standard + tailles spécifiques présentes en annonces (pantalon, jean, robe) ; on n’affiche une catégorie que si au moins une taille existe. */
  const clothingSizeOptions = (selectedTypes.includes('vetements')
    ? [...new Set([
        ...CLOTHING_SIZES,
        ...(showPantSizes && pantalonSizeOptions.length > 0 ? pantalonSizeOptions : []),
        ...(showJeanSizes && jeanSizeOptions.length > 0 ? jeanSizeOptions : []),
        ...(showRobeSizes && robeSizeOptions.length > 0 ? robeSizeOptions : []),
      ])]
    : [...CLOTHING_SIZES]) as string[];
  /** Sections pour le sous-menu Taille : taille standard + une section par type uniquement si des tailles existent en annonces. */
  const clothingSizeSections = selectedTypes.includes('vetements')
    ? [
        { label: 'Taille standard', values: [...CLOTHING_SIZES] as string[] },
        ...(showPantSizes && pantalonSizeOptions.length > 0 ? [{ label: 'Pantalon', values: [...pantalonSizeOptions] as string[] }] : []),
        ...(showJeanSizes && jeanSizeOptions.length > 0 ? [{ label: 'Jean', values: [...jeanSizeOptions] as string[] }] : []),
        ...(showRobeSizes && robeSizeOptions.length > 0 ? [{ label: 'Robe', values: [...robeSizeOptions] as string[] }] : []),
      ]
    : [];
  /** Un seul filtre Taille quand vêtements et/ou montres : options et sections fusionnés si les deux catégories sont sélectionnées. */
  const hasVetements = selectedTypes.includes('vetements');
  const hasMontres = selectedTypes.includes('montres');
  const sizeFilterOptions = hasVetements && hasMontres
    ? [...new Set([...clothingSizeOptions, ...montresSizeOptions])] as string[]
    : hasVetements
      ? clothingSizeOptions
      : montresSizeOptions;
  const sizeFilterSections = hasVetements && hasMontres
    ? [...clothingSizeSections, { label: 'Montres', values: [...montresSizeOptions] as string[] }]
    : hasVetements
      ? clothingSizeSections
      : [{ label: 'Montres', values: [...montresSizeOptions] as string[] }];
  const toggleModele = (model: string) => {
    setFilters((prev) => {
      const current = prev.models ?? (prev.model ? [prev.model] : []);
      const next = current.includes(model) ? current.filter((m) => m !== model) : [...current, model];
      const addedModel = next.length > current.length;
      const noCategory = !(prev.categories?.length || prev.category);
      const noBrand = !(prev.brands?.length || prev.brand);
      if (addedModel && (noCategory || noBrand)) {
        const resolved = getCategoryAndBrandForModel(model);
        if (resolved) {
          return {
            ...prev,
            models: next,
            model: undefined,
            categories: [resolved.filterCategory],
            category: undefined,
            brands: [resolved.brand],
            brand: undefined,
            articleTypes: undefined,
          };
        }
      }
      return { ...prev, models: next.length ? next : undefined, model: undefined };
    });
  };

  const selectedColors = filters.colors ?? (filters.color ? [filters.color] : []);
  const toggleColor = (colorValue: string) => {
    setFilters((prev) => {
      const current = prev.colors ?? (prev.color ? [prev.color] : []);
      const next = current.includes(colorValue) ? current.filter((c) => c !== colorValue) : [...current, colorValue];
      return { ...prev, colors: next.length ? next : undefined, color: undefined };
    });
  };

  const selectedMaterials = filters.materials ?? (filters.material ? [filters.material] : []);
  const toggleMaterial = (materialValue: string) => {
    setFilters((prev) => {
      const current = prev.materials ?? (prev.material ? [prev.material] : []);
      const next = current.includes(materialValue) ? current.filter((m) => m !== materialValue) : [...current, materialValue];
      return { ...prev, materials: next.length ? next : undefined, material: undefined };
    });
  };

  const { suggestions: locationSuggestions, cityLoading: locationCityLoading } =
    useCatalogueLocationSuggestions(locationQuery);

  /** Liste des localisations sélectionnées (multi) : depuis locations ou anciens champs postalCode/region */
  const selectedLocations = useMemo(() => {
    const list = filters.locations ?? [];
    if (list.length > 0) return list;
    if (filters.postalCode) {
      const d = DEPARTEMENTS_FR.find((x) => x.code === filters.postalCode?.replace(/\s/g, ''));
      const prefix = (filters.postalCode?.replace(/\s/g, '') || '').slice(0, 2);
      const prefixes = prefix === '2A' || prefix === '2B' ? ['2A', '2B'] : [prefix];
      return [{ label: d ? `${d.code} - ${d.name}` : filters.postalCode!, prefixes }];
    }
    if (filters.region) {
      const r = REGIONS_FR.find((x) => x.name === filters.region);
      return r ? [{ label: r.name, prefixes: r.depts }] : [];
    }
    return [];
  }, [filters.locations, filters.postalCode, filters.region]);

  const selectedConditions = filters.conditions ?? (filters.condition ? [filters.condition] : []);
  const selectedSizes = filters.sizes ?? [];
  const toggleSize = (sizeValue: string) => {
    setFilters((prev) => {
      const current = prev.sizes ?? [];
      const next = current.includes(sizeValue) ? current.filter((s) => s !== sizeValue) : [...current, sizeValue];
      return { ...prev, sizes: next.length ? next : undefined };
    });
  };
  const toggleCondition = (conditionValue: string) => {
    setFilters((prev) => {
      const current = prev.conditions ?? (prev.condition ? [prev.condition] : []);
      const next = current.includes(conditionValue) ? current.filter((c) => c !== conditionValue) : [...current, conditionValue];
      return { ...prev, conditions: next.length ? next : undefined, condition: undefined };
    });
  };

  const handleReset = () => {
    const urlCondition = searchParams.get('condition');
    const baseFilters = { ...defaultFilters };
    if (urlCondition === 'new') {
      baseFilters.conditions = ['new'];
      const sid = searchParams.get('sellerId') ?? (pathname.startsWith('/catalogue/vendeur/') ? filters.sellerId : undefined);
      if (sid) baseFilters.sellerId = sid;
    } else if (urlCondition === 'occasion') {
      baseFilters.conditions = [...OCCASION_CONDITIONS];
      const sid = searchParams.get('sellerId') ?? (pathname.startsWith('/catalogue/vendeur/') ? filters.sellerId : undefined);
      if (sid) baseFilters.sellerId = sid;
    } else if (pathname.startsWith('/catalogue/vendeur/') && filters.sellerId) {
      /* Réinitialiser les filtres sans retirer le vendeur : la bannière reste visible */
      baseFilters.sellerId = filters.sellerId;
    }
    setFilters(baseFilters);
    setSearchQuery('');
    setLocalPriceMin('');
    setLocalPriceMax('');
    setLocalYearMin('');
    setLocalYearMax('');
    setOpenDropdown(null);
    setSortDropdownOpen(false);
    setMarqueSearchQuery('');
    setModeleSearchQuery('');
    setLocationQuery('');
    setLocationSuggestionsOpen(false);
    setRadiusKm(0);
    setUserCoords(null);
    setGeoError(null);
    const params = new URLSearchParams();
    if (urlCondition) params.set('condition', urlCondition);
    const sid = searchParams.get('sellerId') ?? (pathname.startsWith('/catalogue/vendeur/') ? filters.sellerId : undefined);
    if (sid && !pathname.startsWith('/catalogue/vendeur/')) params.set('sellerId', sid);
    appendCatalogueListViewParam(params, viewMode, isMobile);
    const q = params.toString();
    const basePath = pathname.startsWith('/catalogue/vendeur/') ? pathname : '/catalogue';
    router.replace(q ? `${basePath}?${q}` : basePath, { scroll: false });
  };

  /** Recherche automatique à la frappe (comme Mes favoris) : appliquer le filtre query après debounce 300 ms */
  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setFilters((prev) => ({ ...prev, query: searchQuery.trim() || undefined }));
      searchDebounceRef.current = null;
    }, 300);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchQuery]);

  /** Suggestions pour la barre de recherche (types + marques + titres), sans tenir compte des accents */
  const searchSuggestions = useMemo(() => {
    const q = normalizeForSearch(searchQuery.trim());
    const types = CATEGORIES.map((t) => t.label);
    const brands = [...new Set(Object.values(BRANDS_BY_CATEGORY).flat())].filter((b) => b !== 'Autre');
    const fromListings = [...new Set(allListingTitlesForSearch)].slice(0, 50);
    const all = [...new Set([...types, ...brands, ...fromListings])];
    if (!q) return all.slice(0, 10);
    return all.filter((s) => normalizeForSearch(s).includes(q)).slice(0, 10);
  }, [searchQuery, allListingTitlesForSearch]);

  useEffect(() => {
    if (!searchSuggestionsOpen) return;
    const onMouseDown = (e: MouseEvent) => {
      if (searchBarRef.current && !searchBarRef.current.contains(e.target as Node)) setSearchSuggestionsOpen(false);
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [searchSuggestionsOpen]);

  // Styles partagés pour inputs Prix et Année (déclarés avant filtersContent)
  const priceInputWrapperStyle = { position: 'relative' as const };
  const priceInputStyle = {
    display: 'block' as const,
    width: '100%',
    height: 44,
    padding: '0 36px 0 14px',
    fontSize: 14,
    border: '1px solid #d2d2d7',
    borderRadius: 12,
    boxSizing: 'border-box' as const,
    outline: 'none',
  };
  const priceSuffixStyle = {
    position: 'absolute' as const,
    right: 14,
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: 14,
    color: '#86868b',
    pointerEvents: 'none' as const,
  };

  // Inputs Prix (même structure que Année pour marges et ligne)
  const priceInputs = (
    <FilterSection title="Prix" defaultOpen collapsible={false}>
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ ...priceInputWrapperStyle, flex: 1 }}>
          <input
            type="text"
            inputMode="numeric"
            value={localPriceMin}
            onChange={(e) => setLocalPriceMin(e.target.value.replace(/\D/g, ''))}
            onBlur={applyPriceFilter}
            placeholder="Min"
            style={priceInputStyle}
          />
          <span style={priceSuffixStyle} aria-hidden>€</span>
        </div>
        <div style={{ ...priceInputWrapperStyle, flex: 1 }}>
          <input
            type="text"
            inputMode="numeric"
            value={localPriceMax}
            onChange={(e) => setLocalPriceMax(e.target.value.replace(/\D/g, ''))}
            onBlur={applyPriceFilter}
            placeholder="Max"
            style={priceInputStyle}
          />
          <span style={priceSuffixStyle} aria-hidden>€</span>
        </div>
      </div>
    </FilterSection>
  );

  // Filters sidebar content - utiliser une variable JSX au lieu d'une fonction
  const filtersContent = (
    <>
      {/* Recherche — même police que Année */}
      <div
        className="catalogue-filters-recherche-block"
        style={{
          marginBottom: 12,
          fontSize: 14,
          fontWeight: 600,
          color: '#1d1d1f',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
        }}
      >
        <span>Recherche</span>
        <button
          type="button"
          className="hide-desktop"
          onClick={handleReset}
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: '#6e6e73',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            textDecoration: 'underline',
            padding: 0,
          }}
        >
          Réinitialiser
        </button>
      </div>
      {/* Femme / Homme — même largeur et hauteur que la case Catégorie (même wrapper) */}
      <div>
        <FilterSection title="" defaultOpen collapsible={false} noBorder>
          <div style={{ position: 'relative' }}>
            <div
              className="catalogue-seller-banner"
              style={{
                display: 'flex',
                width: 'calc(100% - 0.5mm)',
                height: 'calc(44px - 0.5mm)',
                gap: 0,
                border: '1px solid #d2d2d7',
                borderRadius: 12,
                backgroundColor: '#fff',
                overflow: 'hidden',
                boxSizing: 'border-box',
              }}
            >
              <button
                type="button"
                onClick={() => {
                  const current = filters.genre ?? [];
                  const next: ('femme' | 'homme')[] = current.includes('femme') ? current.filter((g) => g !== 'femme') : [...current, 'femme'];
                  setFilters((p) => ({ ...p, genre: next.length ? next : undefined }));
                }}
                style={{
                  flex: 1,
                  height: '100%',
                  padding: '0 14px',
                  fontSize: 14,
                  fontWeight: 400,
                  fontFamily: 'inherit',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: (filters.genre ?? []).includes('femme') ? '#1d1d1f' : '#fff',
                  color: (filters.genre ?? []).includes('femme') ? '#fff' : '#1d1d1f',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                Femme
              </button>
              <button
                type="button"
                onClick={() => {
                  const current = filters.genre ?? [];
                  const next: ('femme' | 'homme')[] = current.includes('homme') ? current.filter((g) => g !== 'homme') : [...current, 'homme'];
                  setFilters((p) => ({ ...p, genre: next.length ? next : undefined }));
                }}
                style={{
                  flex: 1,
                  height: '100%',
                  padding: '0 14px',
                  fontSize: 14,
                  fontWeight: 400,
                  fontFamily: 'inherit',
                  border: 'none',
                  borderLeft: '1px solid #d2d2d7',
                  cursor: 'pointer',
                  backgroundColor: (filters.genre ?? []).includes('homme') ? '#1d1d1f' : '#fff',
                  color: (filters.genre ?? []).includes('homme') ? '#fff' : '#1d1d1f',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                Homme
              </button>
            </div>
          </div>
        </FilterSection>
      </div>
      {/* Catégorie — libellé dans la case + pastille nombre si sélection */}
      <div>
        <FilterSection title="" defaultOpen collapsible={false} noBorder>
        <div ref={typeDropdownRef} style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setOpenDropdown((prev) => (prev === 'type' ? null : 'type'))}
            style={{
              width: '100%',
              height: 44,
              padding: '0 14px',
              fontSize: 14,
              border: '1px solid #d2d2d7',
              borderRadius: 12,
              backgroundColor: '#fff',
              color: '#1d1d1f',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              gap: 8,
            }}
          >
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              Catégorie
            </span>
            {selectedTypes.length > 0 && (
              <span
                style={{
                  flexShrink: 0,
                  minWidth: 22,
                  height: 22,
                  padding: '0 8px',
                  borderRadius: 11,
                  backgroundColor: '#f5f5f7',
                  color: '#1d1d1f',
                  fontSize: 12,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid #d2d2d7',
                }}
              >
                {selectedTypes.length}
              </span>
            )}
            <ChevronRight
              size={16}
              style={{ flexShrink: 0, marginLeft: 0, color: '#86868b' }}
            />
          </button>
          {typeDropdownOpen && (
            <div
              className="catalogue-filter-dropdown"
              style={{
                position: 'absolute',
                top: 0,
                left: '100%',
                marginLeft: 20,
                minWidth: 415,
                maxHeight: 360,
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: '#fff',
                border: '1px solid #d2d2d7',
                borderRadius: 12,
                boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
                zIndex: 9999,
                overflow: 'hidden',
              }}
            >
              <button
                type="button"
                onClick={() => { setFilters((p) => ({ ...p, categories: CATEGORIES.map((c) => c.value), category: undefined })); setOpenDropdown(null); }}
                style={{
                  padding: '10px 12px',
                  fontSize: 14,
                  color: '#1d1d1f',
                  background: '#fff',
                  border: 'none',
                  borderBottom: '1px solid #d2d2d7',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontWeight: 600,
                  flexShrink: 0,
                }}
              >
                Toutes les catégories
              </button>
              <div style={{ overflowY: 'auto', flex: 1, minHeight: 0, padding: 8, backgroundColor: '#fff' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 56px' }}>
                  {CATEGORIES.map((type) => (
            <label
              key={type.value}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '6px 4px', borderRadius: 8 }}
            >
              <input
                        type="checkbox"
                        checked={selectedTypes.includes(type.value)}
                        onChange={() => toggleType(type.value)}
                        style={{ width: 16, height: 16, accentColor: '#1d1d1f', flexShrink: 0 }}
                      />
                      <span style={{ fontSize: 14, color: '#1d1d1f' }}>{type.label}</span>
            </label>
          ))}
                </div>
                {selectedTypes.length > 0 && (
            <button
                    type="button"
                    onClick={() => { setFilters((p) => ({ ...p, categories: undefined, category: undefined })); setOpenDropdown(null); }}
              style={{
                      marginTop: 2,
                      marginBottom: 0,
                fontSize: 12,
                      color: '#6e6e73',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                      padding: '2px 4px',
                      width: '100%',
              }}
            >
                    Réinitialiser les types
            </button>
                )}
              </div>
            </div>
          )}
        </div>
      </FilterSection>
      </div>

      {/* Type de produit — affiché uniquement quand au moins une catégorie avec type est sélectionnée (même options que Déposer une annonce) */}
      {hasArticleTypeFilter && (
      <div>
        <FilterSection title="" defaultOpen collapsible={false} noBorder>
        <div ref={articleTypeDropdownRef} style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setOpenDropdown((prev) => (prev === 'articleType' ? null : 'articleType'))}
            style={{
              width: '100%',
              height: 44,
              padding: '0 14px',
              fontSize: 14,
              border: '1px solid #d2d2d7',
              borderRadius: 12,
              backgroundColor: '#fff',
              color: '#1d1d1f',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              gap: 8,
            }}
          >
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              Type de produit
            </span>
            {selectedArticleTypes.length > 0 && (
              <span
                style={{
                  flexShrink: 0,
                  minWidth: 22,
                  height: 22,
                  padding: '0 8px',
                  borderRadius: 11,
                  backgroundColor: '#f5f5f7',
                  color: '#1d1d1f',
                  fontSize: 12,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid #d2d2d7',
                }}
              >
                {selectedArticleTypes.length}
              </span>
            )}
            <ChevronRight
              size={16}
              style={{ flexShrink: 0, marginLeft: 0, color: '#86868b' }}
            />
          </button>
          {articleTypeDropdownOpen && (
            <div
              className="catalogue-filter-dropdown"
              style={{
                position: 'absolute',
                top: 0,
                left: '100%',
                marginLeft: 20,
                minWidth: 415,
                maxHeight: articleTypeOptionsByCategory.length > 1 ? 420 : 420,
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: '#fff',
                border: '1px solid #d2d2d7',
                borderRadius: 12,
                boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
                zIndex: 9999,
                overflow: 'hidden',
              }}
            >
              <button
                type="button"
                onClick={() => { setFilters((p) => ({ ...p, articleTypes: undefined })); setOpenDropdown(null); }}
                style={{
                  padding: '10px 12px',
                  fontSize: 14,
                  color: '#1d1d1f',
                  background: '#fff',
                  border: 'none',
                  borderBottom: '1px solid #d2d2d7',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontWeight: 600,
                  flexShrink: 0,
                }}
              >
                Tous les types
              </button>
              <div style={{ overflowY: articleTypeOptions.length > 9 ? 'auto' : 'visible', flex: articleTypeOptions.length > 9 ? 1 : undefined, minHeight: articleTypeOptions.length > 9 ? 0 : undefined, maxHeight: articleTypeOptions.length > 9 ? (articleTypeOptionsByCategory.length > 1 ? 'calc(340px + 2mm)' : 'calc(304px + 4mm)') : undefined, padding: 8, backgroundColor: '#fff' }}>
                {articleTypeOptionsByCategory.map((group, groupIndex) => (
                  <div key={group.categoryKey} style={{ marginBottom: groupIndex < articleTypeOptionsByCategory.length - 1 ? 16 : 0 }}>
                    {articleTypeOptionsByCategory.length > 1 && (
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#6e6e73', marginBottom: 6, paddingBottom: 4, borderBottom: '1px solid #e8e6e3' }}>
                        {group.categoryLabel}
                      </div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {group.options.map((opt) => (
                        <label
                          key={articleTypeKey(opt)}
                          style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '6px 4px', borderRadius: 8 }}
                        >
                          <input
                            type="checkbox"
                            checked={isArticleTypeOptionChecked(opt)}
                            onChange={() => toggleArticleType(opt)}
                            style={{ width: 16, height: 16, accentColor: '#1d1d1f', flexShrink: 0 }}
                          />
                          <span style={{ fontSize: 14, color: '#1d1d1f' }}>{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
                {selectedArticleTypes.length > 0 && (
                  <button
                    type="button"
                    onClick={() => { setFilters((p) => ({ ...p, articleTypes: undefined })); setOpenDropdown(null); }}
                    style={{
                      marginTop: 2,
                      marginBottom: 0,
                      fontSize: 12,
                      color: '#6e6e73',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      padding: '2px 4px',
                      width: '100%',
                    }}
                  >
                    Réinitialiser le type
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </FilterSection>
      </div>
      )}

      {/* Marque — libellé dans la case + pastille nombre si sélection */}
      <FilterSection title="" defaultOpen collapsible={false} noBorder>
        <div ref={marqueDropdownRef} style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setOpenDropdown((prev) => (prev === 'marque' ? null : 'marque'))}
          style={{
            width: '100%',
              height: 44,
              padding: '0 14px',
              fontSize: 14,
              border: '1px solid #d2d2d7',
              borderRadius: 12,
            backgroundColor: '#fff',
              color: '#1d1d1f',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              gap: 8,
            }}
          >
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              Marque
            </span>
            {selectedBrands.length > 0 && (
              <span
                style={{
                  flexShrink: 0,
                  minWidth: 22,
                  height: 22,
                  padding: '0 8px',
                  borderRadius: 11,
                  backgroundColor: '#f5f5f7',
                  color: '#1d1d1f',
                  fontSize: 12,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid #d2d2d7',
                }}
              >
                {selectedBrands.length}
              </span>
            )}
            <ChevronRight
              size={16}
              style={{ flexShrink: 0, marginLeft: 0, color: '#86868b' }}
            />
          </button>
          {marqueDropdownOpen && (
            <div
              className="catalogue-filter-dropdown"
              style={{
                position: 'absolute',
                top: 0,
                left: '100%',
                marginLeft: 20,
                minWidth: 415,
                maxHeight: 360,
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: '#fff',
                border: '1px solid #d2d2d7',
                borderRadius: 12,
                boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
                zIndex: 9999,
                overflow: 'hidden',
              }}
            >
              <button
                type="button"
                onClick={() => { setFilters((p) => ({ ...p, brands: undefined, brand: undefined })); setOpenDropdown(null); setMarqueSearchQuery(''); }}
                style={{
                  padding: '10px 12px',
                  fontSize: 14,
                  color: '#1d1d1f',
                  background: '#fff',
                  border: 'none',
                  borderBottom: '1px solid #d2d2d7',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontWeight: 600,
                  flexShrink: 0,
                }}
              >
                Toutes les marques
              </button>
              <div style={{ padding: '8px 12px 0 12px', flexShrink: 0 }}>
                <div style={{ position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#86868b' }} />
                  <input
                    type="text"
                    value={marqueSearchQuery}
                    onChange={(e) => setMarqueSearchQuery(e.target.value)}
                    placeholder="Rechercher une marque..."
                    style={{
                      width: '100%',
                      height: 36,
                      paddingLeft: 32,
                      paddingRight: 10,
                      fontSize: 14,
                      border: '1px solid #d2d2d7',
                      borderRadius: 8,
                      backgroundColor: '#fff',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>
              <div style={{ overflowY: 'auto', flex: 1, minHeight: 0, maxHeight: 'calc(252px + 5mm)', padding: 8, backgroundColor: '#fff' }}>
                {/* 6 marques les plus connues (masquées dès que l'utilisateur tape une recherche) */}
                {(() => {
                  const marquesTop = marqueSearchQuery.trim() === '' ? marquesSuggestion : [];
                  if (marquesTop.length > 0) {
                    return (
                      <div style={{ paddingBottom: 6, marginBottom: 6 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 56px' }}>
                          {marquesTop.map((brand) => (
                            <label
                              key={brand}
                              style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '6px 4px', borderRadius: 8 }}
                            >
                              <input
                                type="checkbox"
                                checked={selectedBrands.includes(brand)}
                                onChange={() => toggleBrand(brand)}
                                style={{ width: 16, height: 16, accentColor: '#1d1d1f', flexShrink: 0 }}
                              />
                              <span style={{ fontSize: 14, color: '#1d1d1f' }}>{brand}</span>
                            </label>
                          ))}
                        </div>
                        <div style={{ marginLeft: 4, marginRight: 4, marginTop: 6, borderBottom: '1px solid #e8e6e3' }} />
                      </div>
                    );
                  }
                  return null;
                })()}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 56px' }}>
                  {marquesAlphabetiques.filter((b) => normalizeForSearch(b).includes(normalizeForSearch(marqueSearchQuery.trim()))).map((brand) => (
                    <label
                      key={brand}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '6px 4px', borderRadius: 8 }}
                    >
              <input
                        type="checkbox"
                        checked={selectedBrands.includes(brand)}
                        onChange={() => toggleBrand(brand)}
                        style={{ width: 16, height: 16, accentColor: '#1d1d1f', flexShrink: 0 }}
                      />
                      <span style={{ fontSize: 14, color: '#1d1d1f' }}>{brand}</span>
            </label>
          ))}
        </div>
                {selectedBrands.length > 0 && (
            <button
                    type="button"
                    onClick={() => { setFilters((p) => ({ ...p, brands: undefined, brand: undefined })); setOpenDropdown(null); setMarqueSearchQuery(''); }}
              style={{
                      marginTop: 2,
                      marginBottom: 0,
                fontSize: 12,
                      color: '#6e6e73',
                      background: 'none',
                      border: 'none',
                cursor: 'pointer',
                      textAlign: 'left',
                      padding: '2px 4px',
                      width: '100%',
              }}
            >
                    Réinitialiser les marques
            </button>
                )}
              </div>
            </div>
          )}
        </div>
      </FilterSection>

      {/* Modèle — libellé dans la case + pastille nombre si sélection */}
      <FilterSection title="" defaultOpen collapsible={false} noBorder>
        <div ref={modeleDropdownRef} style={{ position: 'relative' }}>
            <button
            type="button"
            onClick={() => setOpenDropdown((prev) => (prev === 'modele' ? null : 'modele'))}
              style={{
              width: '100%',
              height: 44,
              padding: '0 14px',
              fontSize: 14,
              border: '1px solid #d2d2d7',
              borderRadius: 12,
              backgroundColor: '#fff',
              color: '#1d1d1f',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              gap: 8,
            }}
          >
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              Modèle
            </span>
            {selectedModels.length > 0 && (
              <span
                style={{
                  flexShrink: 0,
                  minWidth: 22,
                  height: 22,
                  padding: '0 8px',
                  borderRadius: 11,
                  backgroundColor: '#f5f5f7',
                  color: '#1d1d1f',
                fontSize: 12,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid #d2d2d7',
                }}
              >
                {selectedModels.length}
              </span>
            )}
            <ChevronRight
              size={16}
              style={{ flexShrink: 0, marginLeft: 0, color: '#86868b' }}
            />
          </button>
          {modeleDropdownOpen && (
            <div
              className="catalogue-filter-dropdown"
              style={{
                position: 'absolute',
                top: 0,
                left: '100%',
                marginLeft: 20,
                minWidth: 415,
                maxHeight: 360,
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: '#fff',
                border: '1px solid #d2d2d7',
                borderRadius: 12,
                boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
                zIndex: 9999,
                overflow: 'hidden',
              }}
            >
              <button
                type="button"
                onClick={() => { setFilters((p) => ({ ...p, models: undefined, model: undefined })); setOpenDropdown(null); setModeleSearchQuery(''); }}
                style={{
                  padding: '10px 12px',
                  fontSize: 14,
                  color: '#1d1d1f',
                  background: '#fff',
                  border: 'none',
                  borderBottom: '1px solid #d2d2d7',
                cursor: 'pointer',
                  textAlign: 'left',
                  fontWeight: 600,
                  flexShrink: 0,
              }}
            >
                Tous les modèles
            </button>
              <div style={{ padding: '8px 12px 0 12px', flexShrink: 0 }}>
                <div style={{ position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#86868b' }} />
                  <input
                    type="text"
                    value={modeleSearchQuery}
                    onChange={(e) => setModeleSearchQuery(e.target.value)}
                    placeholder="Rechercher un modèle..."
                    style={{
                      width: '100%',
                      height: 36,
                      paddingLeft: 32,
                      paddingRight: 10,
                      fontSize: 14,
                      border: '1px solid #d2d2d7',
                      borderRadius: 8,
                      backgroundColor: '#fff',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>
              <div style={{ overflowY: 'auto', flex: 1, minHeight: 0, maxHeight: 'calc(252px + 5mm)', padding: 8, backgroundColor: '#fff' }}>
                {hasMultipleBrandsForModeles ? (
                  /* Plusieurs marques : modèles groupés par marque, avec 6 favoris par marque quand recherche vide */
                  modelesByBrand.map((group, groupIndex) => {
                    const searchNorm = modeleSearchQuery.trim();
                    const filtered = group.models.filter((m) => m !== 'Autre' && m.toLowerCase() !== 'autre' && normalizeForSearch(m).includes(normalizeForSearch(searchNorm)));
                    if (filtered.length === 0) return null;
                    const showFavoris = searchNorm === '' && group.favoris.length > 0 && group.models.length >= 6;
                    const favorisFiltered = showFavoris ? group.favoris.filter((m) => group.models.includes(m)) : [];
                    const restModels = showFavoris ? filtered.filter((m) => !favorisFiltered.includes(m)) : filtered;
                    return (
                      <div key={group.brandLabel} style={{ marginBottom: groupIndex < modelesByBrand.length - 1 ? 16 : 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#6e6e73', marginBottom: 6, paddingBottom: 4, borderBottom: '1px solid #e8e6e3' }}>
                          {group.brandLabel}
                        </div>
                        {showFavoris && favorisFiltered.length > 0 && (
                          <div style={{ paddingBottom: 6, marginBottom: 6 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 56px' }}>
                              {favorisFiltered.map((model) => (
                                <label
                                  key={model}
                                  style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '6px 4px', borderRadius: 8 }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={selectedModels.includes(model)}
                                    onChange={() => toggleModele(model)}
                                    style={{ width: 16, height: 16, accentColor: '#1d1d1f', flexShrink: 0 }}
                                  />
                                  <span style={{ fontSize: 14, color: '#1d1d1f' }}>{model}</span>
                                </label>
                              ))}
                            </div>
                            {restModels.length > 0 && <div style={{ marginLeft: 4, marginRight: 4, marginTop: 6, borderBottom: '1px solid #e8e6e3' }} />}
                          </div>
                        )}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 56px' }}>
                          {restModels.map((model) => (
                            <label
                              key={model}
                              style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '6px 4px', borderRadius: 8 }}
                            >
                              <input
                                type="checkbox"
                                checked={selectedModels.includes(model)}
                                onChange={() => toggleModele(model)}
                                style={{ width: 16, height: 16, accentColor: '#1d1d1f', flexShrink: 0 }}
                              />
                              <span style={{ fontSize: 14, color: '#1d1d1f' }}>{model}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <>
                {/* 6 modèles les plus connus (masqués dès que l'utilisateur tape une recherche) */}
                {(() => {
                      const modelesTop = (modeleSearchQuery.trim() === '' && modelesAlphabetiques.length >= 6) ? modelesSuggestion : [];
                  if (modelesTop.length > 0) {
                    return (
                      <div style={{ paddingBottom: 6, marginBottom: 6 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 56px' }}>
                          {modelesTop.map((model) => (
                            <label
                              key={model}
                              style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '6px 4px', borderRadius: 8 }}
                            >
                              <input
                                type="checkbox"
                                checked={selectedModels.includes(model)}
                                onChange={() => toggleModele(model)}
                                style={{ width: 16, height: 16, accentColor: '#1d1d1f', flexShrink: 0 }}
                              />
                              <span style={{ fontSize: 14, color: '#1d1d1f' }}>{model}</span>
                            </label>
          ))}
        </div>
                        <div style={{ marginLeft: 4, marginRight: 4, marginTop: 6, borderBottom: '1px solid #e8e6e3' }} />
                      </div>
                    );
                  }
                  return null;
                })()}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 56px' }}>
                  {modelesAlphabetiques.filter((m) => m !== 'Autre' && m.toLowerCase() !== 'autre' && normalizeForSearch(m).includes(normalizeForSearch(modeleSearchQuery.trim()))).map((model) => (
                    <label
                      key={model}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '6px 4px', borderRadius: 8 }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedModels.includes(model)}
                        onChange={() => toggleModele(model)}
                        style={{ width: 16, height: 16, accentColor: '#1d1d1f', flexShrink: 0 }}
                      />
                      <span style={{ fontSize: 14, color: '#1d1d1f' }}>{model}</span>
                    </label>
                  ))}
                </div>
                  </>
                )}
                {selectedModels.length > 0 && (
                  <button
                    type="button"
                    onClick={() => { setFilters((p) => ({ ...p, models: undefined, model: undefined })); setOpenDropdown(null); setModeleSearchQuery(''); }}
                    style={{
                      marginTop: 2,
                      marginBottom: 0,
                      fontSize: 12,
                      color: '#6e6e73',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      padding: '2px 4px',
                      width: '100%',
                    }}
                  >
                    Réinitialiser les modèles
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </FilterSection>

      {/* Taille (vêtements et/ou montres) — un seul filtre quand les deux catégories sont sélectionnées */}
      {(hasVetements || hasMontres) && (
        <div>
          <FilterSection title="" defaultOpen collapsible={false} noBorder>
            <div ref={tailleDropdownRef} style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setOpenDropdown((prev) => (prev === 'taille' ? null : 'taille'))}
                style={{
                  width: '100%',
                  height: 44,
                  padding: '0 14px',
                  fontSize: 14,
                  border: '1px solid #d2d2d7',
                  borderRadius: 12,
                  backgroundColor: '#fff',
                  color: '#1d1d1f',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  gap: 8,
                }}
              >
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  Taille
                </span>
                {selectedSizes.some((s) => sizeFilterOptions.includes(s)) && (
                  <span
                    style={{
                      flexShrink: 0,
                      minWidth: 22,
                      height: 22,
                      padding: '0 8px',
                      borderRadius: 11,
                      backgroundColor: '#f5f5f7',
                      color: '#1d1d1f',
                      fontSize: 12,
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid #d2d2d7',
                    }}
                  >
                    {selectedSizes.filter((s) => sizeFilterOptions.includes(s)).length}
                  </span>
                )}
                <ChevronRight
                  size={16}
                  style={{ flexShrink: 0, marginLeft: 0, color: '#86868b' }}
                />
              </button>
              {tailleDropdownOpen && (
                <div
                  className="catalogue-filter-dropdown"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: '100%',
                    marginLeft: 20,
                    minWidth: 415,
                    maxHeight: 360,
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: '#fff',
                    border: '1px solid #d2d2d7',
                    borderRadius: 12,
                    boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
                    zIndex: 9999,
                    overflow: 'hidden',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => { setFilters((p) => ({ ...p, sizes: p.sizes?.filter((s) => !sizeFilterOptions.includes(s)) ?? undefined })); setOpenDropdown(null); }}
                    style={{
                      padding: '10px 12px',
                      fontSize: 14,
                      color: '#1d1d1f',
                      background: '#fff',
                      border: 'none',
                      borderBottom: '1px solid #d2d2d7',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontWeight: 600,
                      flexShrink: 0,
                    }}
                  >
                    Toutes les tailles
                  </button>
                  <div style={{ overflowY: 'auto', flex: 1, minHeight: 0, maxHeight: 'calc(252px + 5mm)', padding: '8px 8px 0 8px', backgroundColor: '#fff' }}>
                    {sizeFilterSections.length > 0 ? (
                      sizeFilterSections.map((section, sectionIndex) => (
                        <div key={section.label} style={{ marginBottom: sectionIndex < sizeFilterSections.length - 1 ? 14 : 0 }}>
                          {(sizeFilterSections.length > 1 || section.label !== 'Taille standard') && (
                            <div style={{ fontSize: 12, fontWeight: 600, color: '#6e6e73', marginBottom: 6, paddingBottom: 4, borderBottom: '1px solid #e8e6e3' }}>
                              {section.label}
                            </div>
                          )}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 56px' }}>
                            {section.label === 'Montres' && section.values.length === 0 ? (
                              <span style={{ fontSize: 14, color: '#6e6e73', padding: 8 }}>Chargement…</span>
                            ) : section.label !== 'Taille standard' && section.values.length === 0 ? (
                              <span style={{ fontSize: 14, color: '#6e6e73', padding: 8 }}>Chargement…</span>
                            ) : (
                            section.values.map((s) => (
                        <label
                          key={s}
                          style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '6px 4px', borderRadius: 8, minHeight: 26, lineHeight: 1.25 }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedSizes.includes(s)}
                            onChange={() => toggleSize(s)}
                            style={{ width: 16, height: 16, accentColor: '#1d1d1f', flexShrink: 0 }}
                          />
                          <span style={{ fontSize: 14, color: '#1d1d1f', lineHeight: 1.25, overflow: 'visible', whiteSpace: 'nowrap' }}>
                            {section.label === 'Montres' ? `${s}${s.match(/^\d+$/) ? ' mm' : ''}` : (section.label === 'Robe' || section.label === 'Jean' || section.label === 'Pantalon' ? `${s} EU` : s)}
                          </span>
                        </label>
                      )))
                            }
                    </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 56px' }}>
                        {sizeFilterOptions.map((s) => (
                          <label
                            key={s}
                            style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '6px 4px', borderRadius: 8, minHeight: 26, lineHeight: 1.25 }}
                          >
                            <input
                              type="checkbox"
                              checked={selectedSizes.includes(s)}
                              onChange={() => toggleSize(s)}
                              style={{ width: 16, height: 16, accentColor: '#1d1d1f', flexShrink: 0 }}
                            />
                            <span style={{ fontSize: 14, color: '#1d1d1f', lineHeight: 1.25, overflow: 'visible', whiteSpace: 'nowrap' }}>{s}</span>
                          </label>
                        ))}
                      </div>
                    )}
                    {selectedSizes.some((s) => sizeFilterOptions.includes(s)) && (
                      <button
                        type="button"
                        onClick={() => { setFilters((p) => ({ ...p, sizes: p.sizes?.filter((s) => !sizeFilterOptions.includes(s)) ?? undefined })); setOpenDropdown(null); }}
                        style={{
                          marginTop: 2,
                          marginBottom: 0,
                          fontSize: 12,
                          color: '#6e6e73',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          textAlign: 'left',
                          padding: '2px 4px',
                          width: '100%',
                        }}
                      >
                        Réinitialiser les tailles
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </FilterSection>
        </div>
      )}

      {/* Pointure (chaussures) — même présentation que Taille (sans titre, même ligne au-dessus d'Année) */}
      {selectedTypes.includes('chaussures') && (
        <div>
          <FilterSection title="" defaultOpen collapsible={false} noBorder>
            <div ref={pointureDropdownRef} style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setOpenDropdown((prev) => (prev === 'pointure' ? null : 'pointure'))}
              style={{
                width: '100%',
                height: 44,
                padding: '0 14px',
                fontSize: 14,
                border: '1px solid #d2d2d7',
                borderRadius: 12,
                backgroundColor: '#fff',
                color: '#1d1d1f',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                gap: 8,
              }}
            >
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                Pointure
              </span>
              {selectedSizes.some((s) => SHOE_SIZES.includes(s)) && (
                <span
                  style={{
                    flexShrink: 0,
                    minWidth: 22,
                    height: 22,
                    padding: '0 8px',
                    borderRadius: 11,
                    backgroundColor: '#f5f5f7',
                    color: '#1d1d1f',
                    fontSize: 12,
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid #d2d2d7',
                  }}
                >
                  {selectedSizes.filter((s) => SHOE_SIZES.includes(s)).length}
                </span>
              )}
              <ChevronRight
                size={16}
                style={{ flexShrink: 0, marginLeft: 0, color: '#86868b' }}
              />
            </button>
            {pointureDropdownOpen && (
              <div
                className="catalogue-filter-dropdown"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: '100%',
                  marginLeft: 20,
                  minWidth: 415,
                  maxHeight: 360,
                  display: 'flex',
                  flexDirection: 'column',
                  backgroundColor: '#fff',
                  border: '1px solid #d2d2d7',
                  borderRadius: 12,
                  boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
                  zIndex: 9999,
                  overflow: 'hidden',
                }}
              >
                <button
                  type="button"
                  onClick={() => { setFilters((p) => ({ ...p, sizes: p.sizes?.filter((s) => !SHOE_SIZES.includes(s)) ?? undefined })); setOpenDropdown(null); setPointureSearchQuery(''); }}
                  style={{
                    padding: '10px 12px',
                    fontSize: 14,
                    color: '#1d1d1f',
                    background: '#fff',
                    border: 'none',
                    borderBottom: '1px solid #d2d2d7',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
                  Toutes les pointures
                </button>
                <div style={{ padding: '8px 12px 0 12px', flexShrink: 0 }}>
                  <div style={{ position: 'relative' }}>
                    <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#86868b' }} />
                    <input
                      type="text"
                      value={pointureSearchQuery}
                      onChange={(e) => setPointureSearchQuery(e.target.value)}
                      placeholder="Rechercher ou préciser la pointure…"
                      style={{
                        width: '100%',
                        height: 36,
                        paddingLeft: 32,
                        paddingRight: 10,
                        fontSize: 14,
                        border: '1px solid #d2d2d7',
                        borderRadius: 8,
                        backgroundColor: '#fff',
                        boxSizing: 'border-box',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>
                <div style={{ overflowY: 'auto', flex: 1, minHeight: 0, height: 224, maxHeight: 224, padding: '8px 8px 0 8px', backgroundColor: '#fff' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 56px' }}>
                    {SHOE_SIZES.filter((p) => normalizeForSearch(p).includes(normalizeForSearch(pointureSearchQuery.trim()))).map((p) => (
                      <label
                        key={p}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '6px 4px', borderRadius: 8, minHeight: 26, lineHeight: 1.25 }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedSizes.includes(p)}
                          onChange={() => toggleSize(p)}
                          style={{ width: 16, height: 16, accentColor: '#1d1d1f', flexShrink: 0 }}
                        />
                        <span style={{ fontSize: 14, color: '#1d1d1f', lineHeight: 1.25, overflow: 'visible', whiteSpace: 'nowrap' }}>{p} EU</span>
                      </label>
                    ))}
                  </div>
                  {selectedSizes.some((s) => SHOE_SIZES.includes(s)) && (
                    <button
                      type="button"
                      onClick={() => { setFilters((p) => ({ ...p, sizes: p.sizes?.filter((s) => !SHOE_SIZES.includes(s)) ?? undefined })); setOpenDropdown(null); setPointureSearchQuery(''); }}
                      style={{
                        marginTop: 2,
                        marginBottom: 0,
                        fontSize: 12,
                        color: '#6e6e73',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        padding: '2px 4px',
                        width: '100%',
                      }}
                    >
                      Réinitialiser les pointures
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
          </FilterSection>
        </div>
      )}

      {/* Année — même format que Prix (Min / Max sur une ligne), même ligne au-dessus que Prix */}
      <div style={{ borderTop: '1px solid #e8e6e3' }}>
        <FilterSection title="Année" defaultOpen collapsible={false}>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1 }}>
      <input
        type="text"
        inputMode="numeric"
              value={localYearMin}
              onChange={(e) => setLocalYearMin(e.target.value.replace(/\D/g, ''))}
              onBlur={applyYearFilter}
              placeholder="Min"
              style={{ ...priceInputStyle, padding: '0 14px', width: '100%' }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <input
              type="text"
              inputMode="numeric"
              value={localYearMax}
              onChange={(e) => setLocalYearMax(e.target.value.replace(/\D/g, ''))}
              onBlur={applyYearFilter}
              placeholder="Max"
              style={{ ...priceInputStyle, padding: '0 14px', width: '100%' }}
            />
          </div>
        </div>
      </FilterSection>
      </div>

      {priceInputs}

      {/* Finition — libellé « Couleur » dans la case + pastille comme Marque */}
      <FilterSection title="Finition" defaultOpen collapsible={false} noBorder>
        <div ref={colorDropdownRef} style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setOpenDropdown((prev) => (prev === 'color' ? null : 'color'))}
        style={{
          width: '100%',
              height: 44,
              padding: '0 14px',
              fontSize: 14,
              border: '1px solid #d2d2d7',
              borderRadius: 12,
              backgroundColor: '#fff',
              color: '#1d1d1f',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              gap: 8,
            }}
          >
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              Couleur
            </span>
            {selectedColors.length > 0 && (
              <span
                style={{
                  flexShrink: 0,
                  minWidth: 22,
                  height: 22,
                  padding: '0 8px',
                  borderRadius: 11,
                  backgroundColor: '#f5f5f7',
                  color: '#1d1d1f',
                  fontSize: 12,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid #d2d2d7',
                }}
              >
                {selectedColors.length}
              </span>
            )}
            <ChevronRight
              size={16}
              style={{ flexShrink: 0, marginLeft: 0, color: '#86868b' }}
            />
          </button>
          {colorDropdownOpen && (
            <div
              className="catalogue-filter-dropdown"
              style={{
                position: 'absolute',
                top: 0,
                left: '100%',
                marginLeft: 20,
                minWidth: 415,
                maxHeight: 360,
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: '#fff',
                border: '1px solid #d2d2d7',
                borderRadius: 12,
                boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
                zIndex: 9999,
                overflow: 'hidden',
              }}
            >
              <button
                type="button"
                onClick={() => { setFilters((p) => ({ ...p, colors: undefined, color: undefined })); setOpenDropdown(null); }}
                style={{
                  padding: '10px 12px',
                  fontSize: 14,
                  color: '#1d1d1f',
                  background: '#fff',
                  border: 'none',
                  borderBottom: '1px solid #d2d2d7',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontWeight: 600,
                  flexShrink: 0,
                }}
              >
                Toutes les finitions
              </button>
              <div style={{ overflowY: 'auto', flex: 1, minHeight: 0, maxHeight: 252, padding: 8, backgroundColor: '#fff' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 56px' }}>
                  {couleursDisponibles.map((color) => (
                    <label
                      key={color.value}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '6px 4px', borderRadius: 8 }}
                    >
      <input
                        type="checkbox"
                        checked={selectedColors.includes(color.value)}
                        onChange={() => toggleColor(color.value)}
                        style={{ width: 16, height: 16, accentColor: '#1d1d1f', flexShrink: 0 }}
                      />
                      <span style={{ fontSize: 14, color: '#1d1d1f' }}>{color.label}</span>
                    </label>
                  ))}
                </div>
                {selectedColors.length > 0 && (
                  <button
                    type="button"
                    onClick={() => { setFilters((p) => ({ ...p, colors: undefined, color: undefined })); setOpenDropdown(null); }}
        style={{
                      marginTop: 2,
                      marginBottom: 0,
                      fontSize: 12,
                      color: '#6e6e73',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      padding: '2px 4px',
          width: '100%',
                    }}
                  >
                    Réinitialiser les finitions
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </FilterSection>

      {/* Matière — libellé dans la case + pastille comme Marque */}
      <FilterSection title="" defaultOpen collapsible={false}>
        <div ref={materialDropdownRef} style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setOpenDropdown((prev) => (prev === 'material' ? null : 'material'))}
            style={{
              width: '100%',
              height: 44,
              padding: '0 14px',
              fontSize: 14,
              border: '1px solid #d2d2d7',
              borderRadius: 12,
              backgroundColor: '#fff',
              color: '#1d1d1f',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              gap: 8,
            }}
          >
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              Matière
            </span>
            {selectedMaterials.length > 0 && (
              <span
                style={{
                  flexShrink: 0,
                  minWidth: 22,
                  height: 22,
                  padding: '0 8px',
                  borderRadius: 11,
                  backgroundColor: '#f5f5f7',
                  color: '#1d1d1f',
                  fontSize: 12,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid #d2d2d7',
                }}
              >
                {selectedMaterials.length}
              </span>
            )}
            <ChevronRight
              size={16}
              style={{ flexShrink: 0, marginLeft: 0, color: '#86868b' }}
            />
          </button>
          {materialDropdownOpen && (
            <div
              className="catalogue-filter-dropdown"
              style={{
                position: 'absolute',
                top: 0,
                left: '100%',
                marginLeft: 20,
                minWidth: 415,
                maxHeight: 360,
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: '#fff',
                border: '1px solid #d2d2d7',
                borderRadius: 12,
                boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
                zIndex: 9999,
                overflow: 'hidden',
              }}
            >
      <button
        type="button"
                onClick={() => { setFilters((p) => ({ ...p, materials: undefined, material: undefined })); setOpenDropdown(null); }}
        style={{
                  padding: '10px 12px',
                  fontSize: 14,
                  color: '#1d1d1f',
                  background: '#fff',
                  border: 'none',
                  borderBottom: '1px solid #d2d2d7',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontWeight: 600,
                  flexShrink: 0,
                }}
              >
                Toutes les matières
              </button>
              <div style={{ overflowY: 'auto', flex: 1, minHeight: 0, maxHeight: 252, padding: 8, backgroundColor: '#fff' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 56px' }}>
                  {matieresDisponibles.map((mat) => (
                    <label
                      key={mat.value}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '6px 4px', borderRadius: 8 }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedMaterials.includes(mat.value)}
                        onChange={() => toggleMaterial(mat.value)}
                        style={{ width: 16, height: 16, accentColor: '#1d1d1f', flexShrink: 0 }}
                      />
                      <span style={{ fontSize: 14, color: '#1d1d1f' }}>{mat.label}</span>
                    </label>
                  ))}
                </div>
                {selectedMaterials.length > 0 && (
                  <button
                    type="button"
                    onClick={() => { setFilters((p) => ({ ...p, materials: undefined, material: undefined })); setOpenDropdown(null); }}
                    style={{
                      marginTop: 2,
                      marginBottom: 0,
                      fontSize: 12,
                      color: '#6e6e73',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      padding: '2px 4px',
          width: '100%',
                    }}
                  >
                    Réinitialiser les matières
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </FilterSection>

      {/* Localisation — villes, codes postaux, régions (sélection multiple) */}
      <div style={{ borderBottom: '1px solid #e8e6e3' }}>
        <FilterSection title="Localisation" defaultOpen collapsible={false} noBorder>
        <div ref={locationInputRef} style={{ position: 'relative', width: '100%', minWidth: 0 }}>
          <input
            type="text"
            value={locationQuery}
            onChange={(e) => {
              setLocationQuery(e.target.value);
              setLocationSuggestionsOpen(true);
            }}
            onFocus={() => setLocationSuggestionsOpen(locationQuery.trim().length > 0 || locationSuggestions.length > 0)}
            placeholder="Ville, code postal, région…"
            autoComplete="off"
            style={{
              display: 'block',
              width: '100%',
              minWidth: 0,
              maxWidth: '100%',
              height: 44,
              padding: '0 14px',
              fontSize: 14,
              border: '1px solid #d2d2d7',
              borderRadius: 12,
              backgroundColor: '#fff',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          {locationSuggestionsOpen && (locationSuggestions.length > 0 || locationCityLoading) && (
            <div
              className="catalogue-seller-banner"
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: '100%',
                marginTop: 4,
                backgroundColor: '#fff',
                border: '1px solid #e8e6e3',
                borderRadius: 8,
                boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
                zIndex: 1000,
                maxHeight: 'min(400px, 60vh)',
                overflowY: 'auto',
              }}
            >
              {locationCityLoading && locationSuggestions.length === 0 ? (
                <div style={{ padding: '12px 12px', fontSize: 13, color: '#6e6e73' }}>Recherche en cours…</div>
              ) : (
                <>
                {locationSuggestions.map((s, si) => (
                  <button
                    key={`${s.type}-${s.label}-${si}`}
                    type="button"
                    onClick={() => {
                      const entry = { label: s.label, prefixes: s.prefixes };
                      const current = filters.locations ?? selectedLocations;
                      const exists = current.some((l) => l.label === entry.label && l.prefixes.length === entry.prefixes.length);
                      if (exists) {
                        setLocationQuery('');
                        setLocationSuggestionsOpen(false);
                        return;
                      }
                      setFilters((p) => ({
                        ...p,
                        locations: [...(p.locations ?? []), entry],
                        postalCode: undefined,
                        region: undefined,
                      }));
                      setRadiusKm(0);
                      setLocationQuery('');
                      setLocationSuggestionsOpen(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      textAlign: 'left',
                      fontSize: 14,
                      color: '#1d1d1f',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'block',
                    }}
                  >
                    {s.label}
                  </button>
                ))}
                </>
              )}
            </div>
          )}
          {selectedLocations.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
              {selectedLocations.map((loc, idx) => (
                <span
                  key={`${loc.label}-${idx}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '4px 10px',
                    backgroundColor: '#f5f5f7',
                    borderRadius: 8,
                    fontSize: 13,
                    color: '#1d1d1f',
                  }}
                >
                  {loc.label}
                  <button
                    type="button"
                    onClick={() => {
                      const next = selectedLocations.filter((_, i) => i !== idx);
                      setFilters((p) => ({
                        ...p,
                        locations: next.length ? next : undefined,
                        postalCode: undefined,
                        region: undefined,
                      }));
                    }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#6e6e73', display: 'flex' }}
                    aria-label="Retirer"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
        {/* Barre rayon km — curseur 5 à 200 km (même marge qu’entre Localisation et le champ) */}
        <div style={{ marginTop: 15, marginBottom: 0 }}>
          <style dangerouslySetInnerHTML={{ __html: `
            input.radius-slider { -webkit-appearance: none; appearance: none; background: transparent; }
            input.radius-slider::-webkit-slider-runnable-track {
              height: 8px; border-radius: 4px; background: linear-gradient(to right, #1d1d1f 0%, #1d1d1f var(--fill, 0%), #f5f5f5 var(--fill, 0%), #f5f5f5 100%);
              border: 1px solid #e0e0e0;
            }
            input.radius-slider::-webkit-slider-thumb {
              -webkit-appearance: none; width: 18px; height: 18px; border-radius: 50%;
              background: #1d1d1f; cursor: pointer; margin-top: -5px; border: none;
            }
            input.radius-slider::-moz-range-track {
              height: 8px; border-radius: 4px; background: linear-gradient(to right, #1d1d1f 0%, #1d1d1f var(--fill, 0%), #f5f5f5 var(--fill, 0%), #f5f5f5 100%);
              border: 1px solid #e0e0e0;
            }
            input.radius-slider::-moz-range-thumb {
              width: 18px; height: 18px; border-radius: 50%; background: #1d1d1f; cursor: pointer; border: none;
            }
          `}} />
          <p style={{ fontSize: 14, fontWeight: 600, color: '#1d1d1f', marginBottom: 10 }}>Dans un rayon de (km)</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <input
              className="radius-slider"
              type="range"
              min={0}
              max={RADIUS_KM_OPTIONS.length}
              step={1}
              value={
                radiusKm === 0
                  ? 0
                  : RADIUS_KM_OPTIONS.indexOf(radiusKm) >= 0
                    ? RADIUS_KM_OPTIONS.indexOf(radiusKm) + 1
                    : 1
              }
              onChange={(e) => {
                const idx = Number(e.target.value);
                const nextKm = idx === 0 ? 0 : RADIUS_KM_OPTIONS[idx - 1] ?? 5;
                setRadiusKm(nextKm);
                if (nextKm > 0) {
                  setGeoError(null);
                  setFilters((p) => ({ ...p, locations: undefined, postalCode: undefined, region: undefined }));
                  setLocationQuery('');
                  setLocationSuggestionsOpen(false);
                  requestPosition();
                }
              }}
              aria-label="Rayon en kilomètres autour de ma position"
              style={{
                flex: '1 1 120px',
                minWidth: 120,
                height: 8,
                ['--fill' as string]: `${radiusKm === 0 ? 0 : ((RADIUS_KM_OPTIONS.indexOf(radiusKm) >= 0 ? RADIUS_KM_OPTIONS.indexOf(radiusKm) + 1 : 1) / RADIUS_KM_OPTIONS.length) * 100}%`,
              }}
            />
            <span style={{ fontSize: 14, fontWeight: 500, color: '#1d1d1f', minWidth: 48 }}>
              {radiusKm === 0 ? '— —' : `${radiusKm} km`}
            </span>
          </div>
        </div>
      </FilterSection>
      </div>

      {/* État — sélection multiple + (i) comme page produit */}
      <FilterSection title="" defaultOpen collapsible={false} noBorder>
        <div style={{ padding: '14px 0 0', marginBottom: 12 }}>
          <div ref={etatInfoRef} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, position: 'relative' }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#1d1d1f' }}>État</span>
            <button
              type="button"
              onClick={() => {
                const visible = etatInfoClicked || etatInfoHover;
                if (visible) { setEtatInfoClicked(false); setEtatInfoHover(false); } else { setEtatInfoClicked(true); setEtatInfoHover(false); }
              }}
              onMouseEnter={() => setEtatInfoHover(true)}
              onMouseLeave={() => setEtatInfoHover(false)}
              aria-label="Informations sur les états"
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, padding: 0,
                border: '1px solid #d2d2d7', borderRadius: '50%',
                backgroundColor: etatInfoClicked ? '#1d1d1f' : (etatInfoHover ? '#1d1d1f' : '#fff'),
                color: etatInfoClicked ? '#fff' : (etatInfoHover ? '#fff' : '#6e6e73'),
                cursor: 'pointer', transition: 'background-color 0.2s, color 0.2s',
                boxShadow: etatInfoClicked ? '0 1px 3px rgba(0,0,0,0.12)' : (etatInfoHover ? '0 1px 3px rgba(0,0,0,0.12)' : '0 1px 2px rgba(0,0,0,0.04)'),
              }}
            >
              <Info size={13} strokeWidth={2.2} />
            </button>
            {(etatInfoClicked || etatInfoHover) && (
              <div
                role="tooltip"
                onMouseEnter={() => setEtatInfoHover(true)}
                onMouseLeave={() => setEtatInfoHover(false)}
                style={{
                  position: 'absolute', left: '-1mm', top: '100%', marginTop: 6, zIndex: 20, minWidth: 320, maxWidth: 360,
                  padding: 16, backgroundColor: '#fff', border: '1px solid #e8e6e3', borderRadius: 12,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)', fontSize: 13, lineHeight: 1.5, color: '#1d1d1f',
                }}
              >
                {ETAT_DEFINITIONS.map((item) => (
                  <div key={item.title} style={{ marginBottom: item.title === 'État correct' ? 0 : 10 }}>
                    <strong style={{ display: 'block', marginBottom: 2 }}>{item.title}</strong>
                    <span style={{ color: '#6e6e73' }}>{item.text}</span>
                  </div>
                ))}
                <p style={{ margin: 0, marginTop: 12, paddingTop: 10, borderTop: '1px solid #eee', fontSize: 12, color: '#6e6e73', lineHeight: 1.5 }}>
                  L&apos;article est montré tel qu&apos;il est sur les photos. La description sert uniquement de repère.
                </p>
              </div>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {CONDITIONS.map((c) => (
            <label
              key={c.value}
              style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '6px 4px', borderRadius: 8 }}
            >
              <input
                type="checkbox"
                checked={selectedConditions.includes(c.value)}
                onChange={() => toggleCondition(c.value)}
                style={{ width: 16, height: 16, accentColor: '#1d1d1f', flexShrink: 0 }}
              />
              <span style={{ fontSize: 14, color: '#1d1d1f' }}>{c.label}</span>
            </label>
          ))}
          {selectedConditions.length > 0 && (
            <button
              type="button"
              onClick={() => setFilters((p) => ({ ...p, conditions: undefined, condition: undefined }))}
              style={{
                marginTop: 2,
                marginBottom: 0,
          fontSize: 12,
                color: '#6e6e73',
                background: 'none',
          border: 'none',
          cursor: 'pointer',
                textAlign: 'left',
                padding: '2px 4px',
                width: '100%',
        }}
      >
              Réinitialiser les états
      </button>
          )}
    </div>
      </FilterSection>
    </>
  );

  return (
    <>
    <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, paddingTop: 'var(--header-height)' }}>
      <div className="catalogue-page-wrap" style={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%', padding: '0 24px', boxSizing: 'border-box' }}>
        <div className="catalogue-page-inner" style={{ flex: 1, display: 'flex', flexDirection: 'column', maxWidth: 'calc(1100px + 1cm)', width: '100%', margin: '0 auto' }}>
        {/* Contenu catalogue : 1100px + 0,5cm de chaque côté */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Barre de recherche — même espace au-dessus (header) et en dessous (ligne) */}
          <div className="catalogue-page-search" style={{ padding: 24, flexShrink: 0 }}>
          <div style={{ borderBottom: '1px solid #e8e6e3', paddingBottom: 24, marginBottom: -24, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 12, flex: 1, minWidth: 0 }}>
              <div ref={searchBarRef} style={{ flex: 1, minWidth: 0, position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#86868b', pointerEvents: 'none' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchSuggestionsOpen(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') e.preventDefault();
                  }}
                  placeholder="Rechercher un article..."
                  autoComplete="off"
                style={{
                  width: '100%',
                  height: 48,
                  paddingLeft: 46,
                  paddingRight: 18,
                  fontSize: 15,
                  border: '1px solid #d2d2d7',
                  borderRadius: 12,
                  backgroundColor: '#fff',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              />
                {searchSuggestionsOpen && searchSuggestions.length > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      top: '100%',
                      marginTop: 4,
                      backgroundColor: '#fff',
                      border: '1px solid #e8e6e3',
                      borderRadius: 12,
                      boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
                      zIndex: 1000,
                      maxHeight: 280,
                      overflowY: 'auto',
                    }}
                  >
                    {searchSuggestions.map((suggestion) => {
                      const categoryMatch = CATEGORIES.find((c) => c.label === suggestion);
                      const isCategory = !!categoryMatch;
                      return (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => {
                          setSearchQuery(suggestion);
                          setSearchSuggestionsOpen(false);
                          const baseFromSearch = { ...defaultFilters, sellerId: filters.sellerId };
                          if (isCategory) {
                            setFilters({ ...baseFromSearch, categories: [categoryMatch!.value] });
                          } else {
                            setFilters({ ...baseFromSearch, query: suggestion });
                          }
                        }}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          textAlign: 'left',
                          fontSize: 14,
                          color: '#1d1d1f',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          borderBottom: '1px solid #f0f0f0',
                        }}
                      >
                        {suggestion}
                      </button>
                    ); })}
                  </div>
                )}
            </div>
          </div>
                {/* Affichage grille/liste + Tri "Plus récents" (desktop) */}
                <div className="hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={toggleViewMode}
                    title={viewMode === 'horizontal' ? 'Afficher en grille (3 par ligne)' : 'Afficher en liste'}
                    aria-label={viewMode === 'horizontal' ? 'Afficher en grille' : 'Afficher en liste'}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 48,
                      height: 48,
                      border: '1px solid #d2d2d7',
                      borderRadius: 12,
                      backgroundColor: '#fff',
                      color: '#6e6e73',
                      cursor: 'pointer',
                      outline: 'none',
                      boxShadow: 'none',
                    }}
                  >
                    {viewMode === 'horizontal' ? <LayoutGrid size={20} /> : <List size={20} />}
                  </button>
                  <div ref={sortDropdownRef} style={{ position: 'relative' }}>
                  <button
                    type="button"
                    onClick={() => setSortDropdownOpen((v) => !v)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      height: 48,
                      padding: '0 14px 0 16px',
                      border: '1px solid #d2d2d7',
                      borderRadius: 12,
                      backgroundColor: '#fff',
                      fontSize: 14,
                      color: '#1d1d1f',
                      cursor: 'pointer',
                      outline: 'none',
                      boxShadow: 'none',
                      minWidth: 160,
                    }}
                  >
                    <span style={{ flex: 1, textAlign: 'left' }}>
                      {SORT_OPTIONS.find((o) => o.value === filters.sortBy)?.label ?? 'Trier'}
                    </span>
                    <ChevronDown size={16} style={{ color: '#86868b', flexShrink: 0 }} />
                  </button>
                  {sortDropdownOpen && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        marginTop: 4,
                        backgroundColor: '#fff',
                        border: '1px solid #d2d2d7',
                        borderRadius: 12,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        zIndex: 9999,
                        overflow: 'hidden',
                      }}
                    >
                      {SORT_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            updateFilter('sortBy', opt.value);
                            setSortDropdownOpen(false);
                          }}
                          style={{
                            display: 'block',
                            width: '100%',
                            padding: '10px 14px',
                            border: 'none',
                            background: filters.sortBy === opt.value ? '#f5f5f7' : 'transparent',
                            fontSize: 14,
                            color: '#1d1d1f',
                            cursor: 'pointer',
                            textAlign: 'left',
                            outline: 'none',
                            boxShadow: 'none',
                            fontWeight: filters.sortBy === opt.value ? 600 : 400,
                          }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                  </div>
                </div>
        </div>
      </div>

          <div style={{ display: 'flex', gap: 0, alignItems: 'stretch' }}>
          {/* Sidebar - Desktop */}
          <aside
            className="hide-mobile"
              style={{ position: 'relative', zIndex: 10, width: 260, flexShrink: 0, borderRight: '1px solid #e8e6e3', padding: '24px 20px', overflow: 'visible' }}
          >
              <div style={{ position: 'sticky', top: 100, overflow: 'visible', paddingBottom: 32 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 20,
                }}
              >
                  <h2 style={{ fontSize: 17, fontWeight: 600, color: '#1d1d1f', fontFamily: 'var(--font-inter), var(--font-sans)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <SlidersHorizontal size={20} style={{ flexShrink: 0 }} />
                    Filtres
                  </h2>
                <button
                  onClick={handleReset}
                  style={{
                      fontSize: 13,
                      color: '#6e6e73',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                      textDecoration: 'underline',
                  }}
                >
                  Réinitialiser
                </button>
              </div>
              {filtersContent}
            </div>
          </aside>

          {/* Main */}
            <main className={`catalogue-page-main${showVendeurStoreBanner ? ' catalogue-page-main--seller' : ''}`} style={{ flex: 1, minWidth: 0, padding: '24px calc(24px - 0.5mm) 0 var(--catalogue-line-gap, 24px)' }}>
            {/* Bloc vendeur : nom, logo, annonces */}
            {showVendeurStoreBanner && (
            <div
              className="catalogue-seller-banner catalogue-seller-store-banner"
              style={{
                  marginBottom: 24,
                  padding: 12,
                  backgroundColor: '#fafaf9',
                  border: '1px solid #e8e6e3',
                  borderRadius: 14,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                  flexWrap: 'nowrap',
                  minWidth: 0,
              }}
            >
                {!filters.sellerId || !sellerProfileResolved || sellerLoading || !seller ? (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                      width: '100%',
                      minWidth: 0,
                      flexWrap: 'nowrap',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
                      <div
                        className="catalogue-skeleton catalogue-seller-banner-skeleton-avatar"
                        style={{ width: 64, height: 64, borderRadius: 10, flexShrink: 0, ['--skeleton-index' as string]: 0 }}
                      />
                      <div style={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div
                          className="catalogue-skeleton"
                          style={{ height: 24, width: 'min(100%, 280px)', maxWidth: '75%', borderRadius: 4, ['--skeleton-index' as string]: 1 }}
                        />
                        <div
                          className="catalogue-skeleton"
                          style={{ height: 16, width: 140, borderRadius: 4, ['--skeleton-index' as string]: 2 }}
                        />
                      </div>
                    </div>
                    <div
                      className="catalogue-skeleton catalogue-seller-banner-skeleton-loc"
                      style={{ height: 44, width: 180, borderRadius: 10, flexShrink: 0, ['--skeleton-index' as string]: 3 }}
                    />
                  </div>
                ) : (
                  <>
                    <div className="catalogue-seller-main-info" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div
                        className="catalogue-seller-logo-wrap"
                  style={{
                          width: 64,
                          height: 64,
                          borderRadius: 10,
                          overflow: 'hidden',
                          backgroundColor: '#f0f0f2',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {seller.avatarUrl ? (
                          <img src={getSellerAvatarUrl(seller) ?? ''} alt={seller.companyName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <Store size={32} color="#888" />
                        )}
                      </div>
                      <div className="catalogue-seller-text-block" style={{ minWidth: 0, flex: 1 }}>
                        <div
                          className="catalogue-seller-banner-title-row"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            flexWrap: 'nowrap',
                            gap: '0.35em',
                            rowGap: 4,
                            marginBottom: 4,
                            minWidth: 0,
                            /* Même base em que la ligne nom + badge page produit (Inter 22px) */
                            fontFamily: 'var(--font-inter), var(--font-sans)',
                            fontSize: 22,
                            fontWeight: 600,
                            color: '#1d1d1f',
                          }}
                        >
                          {filters.sellerId ? (
                            <h2
                              style={{
                                fontFamily: 'var(--font-playfair), Georgia, serif',
                                fontSize: 22,
                                fontWeight: 600,
                                color: '#1d1d1f',
                                margin: 0,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                minWidth: 0,
                                flex: '0 1 auto',
                                maxWidth: '100%',
                              }}
                            >
                              {seller.companyName}
                            </h2>
                          ) : (
                            <Link
                              href={sellerCataloguePath(seller)}
                              style={{ color: 'inherit', textDecoration: 'none', minWidth: 0, flex: '0 1 auto', maxWidth: '100%' }}
                            >
                              <h2
                                style={{
                                  fontFamily: 'var(--font-playfair), Georgia, serif',
                                  fontSize: 22,
                                  fontWeight: 600,
                                  color: '#1d1d1f',
                                  margin: 0,
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                              >
                                {seller.companyName}
                              </h2>
                            </Link>
                          )}
                          <SellerVerifiedSubscriptionBadge tier={seller.subscriptionTier} variant="produit" />
                        </div>
                        <p
                          style={{
                            fontSize: 14,
                            lineHeight: '20px',
                            height: 20,
                            margin: 0,
                            color: '#6e6e73',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: '100%',
                          }}
                        >
                          {sellerStoreBannerListingsLine}
                        </p>
              </div>
                    </div>
                    {(seller.address || seller.city || seller.postcode) && (
                          <button
                            className="catalogue-seller-location-btn"
                            type="button"
                            onClick={() => setShowMapPopup(true)}
                        style={{ height: 44, minWidth: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#fff', border: '1px solid #d2d2d7', borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
                          >
                        <MapPin size={18} color="#1d1d1f" style={{ flexShrink: 0 }} />
                        {seller.postcode && <span style={{ fontSize: 16 }}>{seller.postcode}</span>}
                        {seller.city && <span className="hide-mobile" style={{ fontSize: 16 }}>{seller.city}</span>}
                          </button>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Barre tri + filtre : même espace en dessous qu'entre "Plus récents" et la ligne au-dessus */}
            <div
              className={`catalogue-barre-tri${showVendeurStoreBanner ? ' catalogue-barre-tri--seller' : ''}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 0,
                flexWrap: 'wrap',
                gap: 10,
              }}
            >
                {/* Mobile filter button — à gauche */}
                <button
                  onClick={() => setMobileFiltersOpen(true)}
                  className="hide-desktop catalogue-barre-tri-filtres"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    height: 40,
                    padding: '0 16px',
                    border: '1px solid #d2d2d7',
                    borderRadius: 12,
                    backgroundColor: '#fff',
                    fontSize: 14,
                    color: '#1d1d1f',
                    cursor: 'pointer',
                  }}
                >
                  <SlidersHorizontal size={16} />
                  Filtres
                </button>

                {/* Affichage grille/liste (mobile) */}
                <button
                  type="button"
                  onClick={toggleViewMode}
                  title={viewMode === 'horizontal' ? 'Afficher en grille' : 'Afficher en liste'}
                  aria-label={viewMode === 'horizontal' ? 'Afficher en grille' : 'Afficher en liste'}
                  className="hide-desktop catalogue-barre-tri-view-toggle"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 40,
                    height: 40,
                    border: '1px solid #d2d2d7',
                    borderRadius: 12,
                    backgroundColor: '#fff',
                    color: '#6e6e73',
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                >
                  {viewMode === 'horizontal' ? <LayoutGrid size={18} /> : <List size={18} />}
                </button>

                {/* Sort — menu déroulant à droite (mobile uniquement ; desktop : tri à côté de la barre de recherche) */}
                <div ref={sortDropdownRefMobile} className="hide-desktop catalogue-barre-tri-sort" style={{ position: 'relative' }}>
                  <button
                    type="button"
                    onClick={() => setSortDropdownOpen((v) => !v)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      height: 40,
                      padding: '0 12px 0 14px',
                      border: '1px solid #d2d2d7',
                      borderRadius: 12,
                      backgroundColor: '#fff',
                      fontSize: 14,
                      color: '#1d1d1f',
                      cursor: 'pointer',
                      outline: 'none',
                      boxShadow: 'none',
                      minWidth: 160,
                    }}
                  >
                    <span style={{ flex: 1, textAlign: 'left' }}>
                      {SORT_OPTIONS.find((o) => o.value === filters.sortBy)?.label ?? 'Trier'}
                    </span>
                    <ChevronDown size={16} style={{ color: '#86868b', flexShrink: 0 }} />
                  </button>
                  {sortDropdownOpen && (
                    <div
                    style={{
                      position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        marginTop: 4,
                        backgroundColor: '#fff',
                        border: '1px solid #d2d2d7',
                        borderRadius: 12,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        zIndex: 9999,
                        overflow: 'hidden',
                      }}
                    >
                      {SORT_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            updateFilter('sortBy', opt.value);
                            setSortDropdownOpen(false);
                          }}
                          style={{
                            display: 'block',
                            width: '100%',
                            padding: '10px 14px',
                            border: 'none',
                            background: filters.sortBy === opt.value ? '#f5f5f7' : 'transparent',
                            fontSize: 14,
                            color: '#1d1d1f',
                            cursor: 'pointer',
                            textAlign: 'left',
                            outline: 'none',
                            boxShadow: 'none',
                            fontWeight: filters.sortBy === opt.value ? 600 : 400,
                          }}
                        >
                          {opt.label}
                        </button>
                      ))}
                </div>
                  )}
              </div>
            </div>

            <div ref={resultsTopRef} />

            {/* Results — marginTop 24 pour même espace qu'entre "Plus récents" et la ligne au-dessus */}
            {(() => {
              if (loading && listings.length === 0) {
                const count = pageSize;
                return (
                  <div
                    className={
                      viewMode === 'grid' ? 'catalogue-results catalogue-results-grid' : 'catalogue-results catalogue-results-line'
                    }
                    style={{
                      display: viewMode === 'grid' ? 'grid' : 'flex',
                      gridTemplateColumns: viewMode === 'grid' ? 'repeat(3, 1fr)' : undefined,
                      flexDirection: viewMode === 'grid' ? undefined : 'column',
                      gap: viewMode === 'grid' ? 24 : 20,
                      minWidth: 0,
                    }}
                  >
                    {Array.from({ length: count }, (_, i) => (
                      <div
                        key={i}
                        className={viewMode === 'grid' ? 'catalogue-skeleton-card' : 'catalogue-skeleton-card catalogue-line-card'}
                        style={{
                          display: 'flex',
                          flexDirection: viewMode === 'grid' ? 'column' : 'row',
                          backgroundColor: '#fff',
                          borderRadius: CATALOGUE_GRID_CARD_RADIUS,
                          overflow: 'hidden',
                          boxShadow: CATALOGUE_GRID_CARD_SHADOW,
                          minWidth: 0,
                          minHeight: viewMode === 'grid' ? undefined : 56,
                          position: 'relative',
                          ['--skeleton-index' as string]: i,
                        }}
                      >
                        <div
                          style={{
                            position: 'relative',
                            width: viewMode === 'grid' ? '100%' : undefined,
                            aspectRatio: viewMode === 'grid' ? '1' : undefined,
                            flexShrink: 0,
                            alignSelf: viewMode === 'grid' ? undefined : 'center',
                            overflow: 'hidden',
                            borderRadius: viewMode === 'grid' ? 0 : 4,
                          }}
                        >
                          <div
                            className={viewMode === 'grid' ? 'catalogue-skeleton' : 'catalogue-skeleton catalogue-line-photo'}
                            style={{
                              width: '100%',
                              height: '100%',
                              borderRadius: viewMode === 'grid' ? 0 : 4,
                            }}
                          />
                          {viewMode === 'grid' ? (
                            <div className="listing-card-photo-fade" aria-hidden />
                          ) : (
                            <div className="listing-card-photo-fade listing-card-photo-fade--line" aria-hidden />
                          )}
                        </div>
                        <div
                          style={{
                            padding: viewMode === 'grid' ? '14px 14px 10px' : '10px 48px 10px 14px',
                            flex: 1,
                            minWidth: 0,
                            minHeight: viewMode === 'grid' ? 'calc(112px + 2mm)' : undefined,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: viewMode === 'grid' ? 6 : 8,
                            justifyContent: viewMode === 'grid' ? undefined : 'space-between',
                            backgroundColor: '#fff',
                          }}
                        >
                          {viewMode === 'grid' ? (
                            <>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, height: 12 }}>
                                <div className="catalogue-skeleton" style={{ height: 12, width: '50%' }} />
                                <div className="catalogue-skeleton" style={{ height: 12, width: 60, flexShrink: 0 }} />
                              </div>
                              <div className="catalogue-skeleton" style={{ height: 16, width: '92%' }} />
                              <div style={{ display: 'flex', gap: '6px 12px', flexWrap: 'wrap', marginBottom: 5 }}>
                                <div className="catalogue-skeleton" style={{ height: 13, width: 60 }} />
                                <div className="catalogue-skeleton" style={{ height: 13, width: 70 }} />
                                <div className="catalogue-skeleton" style={{ height: 13, width: 55 }} />
                              </div>
                              <div style={{ marginTop: -5, minHeight: 24, display: 'flex', alignItems: 'center' }}>
                                <div className="catalogue-skeleton" style={{ height: 18, width: '38%' }} />
                              </div>
                            </>
                          ) : (
                            <>
                              <div>
                                <div className="catalogue-skeleton" style={{ height: 22, width: '75%', marginBottom: 5 }} />
                                <div className="catalogue-skeleton" style={{ height: 12, width: '50%' }} />
                                <div className="catalogue-skeleton" style={{ height: 24, width: '35%', marginTop: 8 }} />
                              </div>
                              <div style={{ borderTop: '1px solid #e8e6e3', paddingTop: 8, marginTop: 8 }}>
                                <div className="catalogue-skeleton" style={{ height: 16, width: '40%' }} />
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              }
              if (listings.length === 0) {
                return (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      padding: 24,
                      minHeight: 'calc(100vh - var(--header-height, 80px) - 24px)',
                      transform: 'translateY(-6vh)',
                    }}
                  >
                    <p style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: 20, fontWeight: 500, marginBottom: 8, color: '#1d1d1f' }}>Aucun résultat</p>
                    <p className="catalogue-aucun-resultat-msg" style={{ fontSize: 15, color: '#6e6e73', marginBottom: 24 }}>
                      Essayez de modifier vos critères ou réinitialisez les filtres.
                    </p>
                    <button
                      className="catalogue-reset-filters-btn"
                      onClick={handleReset}
                      style={{
                        padding: '14px 28px',
                        backgroundColor: '#1d1d1f',
                        color: '#fff',
                        fontSize: 15,
                        fontWeight: 500,
                        border: 'none',
                        borderRadius: 12,
                        cursor: 'pointer',
                      }}
                    >
                      Réinitialiser les filtres
                    </button>
                  </div>
                );
              }
              if (viewMode === 'grid') {
                return (
              <div className="catalogue-results catalogue-results-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, minWidth: 0 }}>
                {paginatedListings.map((listing) => (
                  <Link
                    key={listing.id}
                    href={listingAnnoncePath(listing)}
                    onPointerDownCapture={(e) => {
                      if (e.pointerType === 'mouse' && e.button !== 0) return;
                      setAnnonceReturnUrlForNextNavigation(catalogueReturnUrl);
                    }}
                    onClick={() => setAnnonceReturnUrlForNextNavigation(catalogueReturnUrl)}
                    style={{ textDecoration: 'none', color: 'inherit', minWidth: 0 }}
                  >
                    <article
                      style={{
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        backgroundColor: '#fff',
                        borderRadius: CATALOGUE_GRID_CARD_RADIUS,
                        overflow: 'hidden',
                        boxShadow: CATALOGUE_GRID_CARD_SHADOW,
                        minWidth: 0,
                      }}
                    >
                      <button
                        type="button"
                        onClick={(e) => handleFavoriteClick(e, listing.id)}
                        disabled={!!loadingFavoriteId}
                        aria-label={favoritedListingIds[listing.id] ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                        style={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          zIndex: 1,
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          backgroundColor: 'rgba(255,255,255,0.95)',
                          border: '1px solid rgba(0,0,0,0.06)',
                          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: user ? 'pointer' : 'default',
                          padding: 0,
                        }}
                      >
                        <Heart size={16} color={favoritedListingIds[listing.id] ? '#1d1d1f' : '#6e6e73'} fill={favoritedListingIds[listing.id] ? '#1d1d1f' : 'none'} strokeWidth={2} />
                      </button>
                      <div
                        style={{
                          position: 'relative',
                          width: '100%',
                          aspectRatio: '1',
                          backgroundColor: '#fff',
                          overflow: 'hidden',
                        }}
                      >
                        <CatalogueCardPhotos
                          photos={listing.photos}
                          alt={listing.title}
                          sizes="(max-width: 640px) 50vw, 25vw"
                        />
                        <div className="listing-card-photo-fade" aria-hidden />
                      </div>
                      <div style={{ padding: '14px 14px 10px', display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0, backgroundColor: '#fff' }}>
                        <p className="listing-grid-vendeur" style={{ fontSize: 12, fontWeight: 400, textTransform: 'uppercase', letterSpacing: 0.5, color: '#86868b', margin: 0, marginBottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, minWidth: 0 }}>
                          <span className="listing-grid-vendeur-nom-badge-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', minWidth: 0, flex: 1, gap: '0.2em' }}>
                            <span className="listing-grid-vendeur-nom" title={listing.sellerName} style={{ minWidth: 0, flex: '0 1 auto', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{listing.sellerName}</span>
                            <SellerVerifiedSubscriptionBadge tier={listing.sellerSubscriptionTier ?? 'start'} variant="homeFeatured" />
                          </span>
                          {listing.sellerPostcode && (
                            <span className="listing-grid-vendeur-cp" style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 12, lineHeight: 1, fontWeight: 400, textTransform: 'uppercase', letterSpacing: 0.5, color: '#86868b', flexShrink: 0 }}>
                              <MapPin size={14} strokeWidth={2} style={{ flexShrink: 0, transform: 'translateY(-0.6px)' }} />
                              {listing.sellerPostcode}
                            </span>
                          )}
                        </p>
                        {(() => {
                          const lineText = listing.title || '';
                          return (
                            <h3 className="listing-grid-title" title={lineText} style={{ fontSize: 16, fontWeight: 500, color: '#1d1d1f', margin: 0, minWidth: 0, overflow: 'hidden', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                              {highlightSearchTerms(lineText, filters.query)}
                        </h3>
                          );
                        })()}
                        <ListingCaracteristiques listing={listing} variant="homeFeatured" className="catalogue-listing-caracteristiques" />
                        <div className="listing-grid-price" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: -5, minHeight: 24 }}>
                          <span style={{ fontSize: 18, fontWeight: 600, color: '#1d1d1f', lineHeight: 1.3 }}>{formatPrice(listing.price)}</span>
                          {dealByListingId[listing.id] && (() => {
                            const deal = dealByListingId[listing.id]!;
                            return (
                              <span className="catalogue-listing-deal-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 5px', backgroundColor: '#fff', border: `1px solid ${deal.color}`, borderRadius: 3, fontSize: 11, fontWeight: 500, lineHeight: 1, color: deal.color, whiteSpace: 'nowrap' }}>
                                <span style={{ width: 11, height: 11, borderRadius: '50%', backgroundColor: deal.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Euro size={6} color="#fff" strokeWidth={2.5} />
                                </span>
                                {deal.label}
                              </span>
                            );
                          })()}
                        </div>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
                );
              }
              return (
              <div className="catalogue-results catalogue-results-line" style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
                {paginatedListings.map((listing) => (
                  <Link
                    key={listing.id}
                    href={listingAnnoncePath(listing)}
                    onPointerDownCapture={(e) => {
                      if (e.pointerType === 'mouse' && e.button !== 0) return;
                      setAnnonceReturnUrlForNextNavigation(catalogueReturnUrl);
                    }}
                    onClick={() => setAnnonceReturnUrlForNextNavigation(catalogueReturnUrl)}
                    style={{ textDecoration: 'none', color: 'inherit', minWidth: 0 }}
                  >
                    <article
                className="catalogue-line-card"
                style={{
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'row',
                        backgroundColor: '#fff',
                        borderRadius: CATALOGUE_GRID_CARD_RADIUS,
                        overflow: 'hidden',
                        boxShadow: CATALOGUE_GRID_CARD_SHADOW,
                        minHeight: 56,
                        minWidth: 0,
                      }}
                    >
                      <button
                        type="button"
                        onClick={(e) => handleFavoriteClick(e, listing.id)}
                        disabled={!!loadingFavoriteId}
                        aria-label={favoritedListingIds[listing.id] ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                        style={{
                          position: 'absolute',
                          top: 10,
                          right: 10,
                          zIndex: 1,
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          backgroundColor: 'rgba(255,255,255,0.95)',
                          border: '1px solid rgba(0,0,0,0.06)',
                          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: user ? 'pointer' : 'default',
                          padding: 0,
                          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                        }}
                      >
                        <Heart
                          size={18}
                          color={favoritedListingIds[listing.id] ? '#1d1d1f' : '#6e6e73'}
                          fill={favoritedListingIds[listing.id] ? '#1d1d1f' : 'none'}
                          strokeWidth={2}
                        />
                      </button>
                      <div
                        className="catalogue-line-photo"
                        style={{
                          position: 'relative',
                          backgroundColor: '#fff',
                          overflow: 'hidden',
                        }}
                      >
                        <CatalogueCardPhotos
                          photos={listing.photos}
                          alt={listing.title}
                          sizes="(max-width: 640px) 50vw, min(480px, 40vw)"
                        />
                        <div className="listing-card-photo-fade listing-card-photo-fade--line" aria-hidden />
                      </div>
                            <div
                            className="catalogue-line-content"
                            style={{
                          flex: 1,
                              display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          padding: '0 48px 4px 14px',
                          minWidth: 0,
                          overflow: 'hidden',
                        }}
                      >
                        <div className="catalogue-line-title-block" style={{ paddingBottom: 4, minWidth: 0, overflow: 'hidden' }}>
                          {(() => {
                            const lineText = listing.title || '';
                            return (
                              <h3
                                title={lineText}
                                className="catalogue-line-title"
                                style={{
                                  fontSize: 20,
                                  fontWeight: 600,
                                  color: '#1d1d1f',
                                  margin: 0,
                                  marginBottom: 4,
                                  minWidth: 0,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  lineHeight: 1.4,
                                }}
                              >
                                {highlightSearchTerms(lineText, filters.query)}
                          </h3>
                            );
                          })()}
                          <ListingCaracteristiques listing={listing} variant="lineCatalogue" className="catalogue-listing-caracteristiques" />
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                            <p className="catalogue-listing-prix" style={{ fontSize: 19, fontWeight: 600, color: '#1d1d1f', margin: 0, lineHeight: 1.3 }}>
                              {formatPrice(listing.price)}
                            </p>
                            {dealByListingId[listing.id] && (() => {
                              const deal = dealByListingId[listing.id]!;
                              return (
                                <span
                                  className="catalogue-listing-deal-badge"
                        style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    padding: '3px 6px',
                                    marginLeft: 2,
                                    backgroundColor: '#fff',
                                    border: `1px solid ${deal.color}`,
                                    borderRadius: 3,
                                    fontSize: 11,
                          fontWeight: 500,
                                    lineHeight: 1,
                                    color: deal.color,
                          whiteSpace: 'nowrap',
                        }}
                      >
                                  <span style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: deal.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Euro size={7} color="#fff" strokeWidth={2.5} />
                                  </span>
                                  {deal.label}
                                </span>
                              );
                            })()}
                          </div>
                        </div>
                        <div className="catalogue-listing-vendeur-block" style={{ borderTop: '1px solid #e8e6e3', paddingTop: 8, paddingBottom: 4, marginTop: 2, display: 'flex', alignItems: 'center', minHeight: 36, backgroundColor: '#fff' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, fontSize: 13, fontWeight: 400, color: '#86868b', lineHeight: 1.2, minWidth: 0, width: '100%', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            <span className="catalogue-listing-vendeur-nom-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', minWidth: 0, flex: 1, gap: '0.2em' }}>
                              <span className="catalogue-listing-vendeur-nom" title={listing.sellerName} style={{ minWidth: 0, flex: '0 1 auto', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {listing.sellerName}
                              </span>
                              <SellerVerifiedSubscriptionBadge tier={listing.sellerSubscriptionTier ?? 'start'} variant="homeFeatured" />
                            </span>
                          {listing.sellerPostcode && (
                              <span className="catalogue-listing-codepostal" style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 13, lineHeight: 1.2, fontWeight: 400, flexShrink: 0, letterSpacing: 0.5 }}>
                              <MapPin size={15} strokeWidth={2} style={{ flexShrink: 0, transform: 'translateY(-0.6px)' }} /> {listing.sellerPostcode}
                              </span>
                          )}
                          </div>
                        </div>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
              );
            })()}

          </main>

          </div>

            {/* Pagination : Précédent, Page, Suivant — centrés ; squelette identique au chargement initial */}
            {loading && listings.length === 0 ? (
              <div style={{ padding: '0 calc(24px - 0.5mm) 0 var(--catalogue-line-gap, 24px)' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    flexWrap: 'wrap',
                    marginTop: 48,
                    marginBottom: 80,
                    width: '100%',
                  }}
                  aria-hidden
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14, color: '#1d1d1f', fontWeight: 500 }}>Page</span>
                    <div
                      className="catalogue-skeleton"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: 32,
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        border: '1px solid #e8e6e3',
                        boxSizing: 'border-box',
                        ['--skeleton-index' as string]: 24,
                      }}
                    />
                    <div
                      className="catalogue-skeleton"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: 32,
                        height: 32,
                        padding: '0 10px',
                        borderRadius: 8,
                        border: '1px solid #e8e6e3',
                        boxSizing: 'border-box',
                        width: 40,
                        ['--skeleton-index' as string]: 25,
                      }}
                    />
                    <div
                      className="catalogue-skeleton"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: 32,
                        height: 32,
                        padding: '0 10px',
                        borderRadius: 8,
                        border: '1px solid #e8e6e3',
                        boxSizing: 'border-box',
                        width: 40,
                        ['--skeleton-index' as string]: 26,
                      }}
                    />
                    <div
                      className="catalogue-skeleton"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: 32,
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        border: '1px solid #e8e6e3',
                        boxSizing: 'border-box',
                        ['--skeleton-index' as string]: 27,
                      }}
                    />
                  </div>
                </div>
              </div>
            ) : listings.length > 0 ? (
              <div style={{ padding: '0 calc(24px - 0.5mm) 0 var(--catalogue-line-gap, 24px)' }}>
                <div
                  aria-busy={loading}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    flexWrap: 'wrap',
                    marginTop: 48,
                    marginBottom: 80,
                    width: '100%',
                    opacity: loading ? 0.72 : 1,
                    transition: 'opacity 0.2s ease',
                  }}
                >
                  {totalPages > 1 ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 14, color: '#1d1d1f', fontWeight: 500 }}>Page</span>
                      <button
                        type="button"
                        onClick={() => goToPage(effectivePage - 1)}
                        disabled={loading || effectivePage <= 1}
                        aria-label="Page précédente"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minWidth: 32,
                          width: 32,
                          height: 32,
                          padding: 0,
                          borderRadius: 8,
                          border: '1px solid #d2d2d7',
                          backgroundColor: loading || effectivePage <= 1 ? '#f5f5f7' : '#fff',
                          color: loading || effectivePage <= 1 ? '#9b9ba0' : '#1d1d1f',
                          cursor: loading || effectivePage <= 1 ? 'not-allowed' : 'pointer',
                        }}
                      >
                        <ChevronLeft size={18} strokeWidth={2.5} />
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => goToPage(p)}
                          disabled={loading}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minWidth: 32,
                            height: 32,
                            padding: '0 10px',
                            fontSize: 13,
                            fontWeight: p === effectivePage ? 600 : 500,
                            color: p === effectivePage ? '#1d1d1f' : '#6e6e73',
                            border: p === effectivePage ? '1px solid #1d1d1f' : '1px solid #d2d2d7',
                            borderRadius: 8,
                            backgroundColor: '#fff',
                            cursor: loading ? 'not-allowed' : 'pointer',
                          }}
                        >
                          {p}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => goToPage(effectivePage + 1)}
                        disabled={loading || effectivePage >= totalPages}
                        aria-label="Page suivante"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minWidth: 32,
                          width: 32,
                          height: 32,
                          padding: 0,
                          borderRadius: 8,
                          border: '1px solid #d2d2d7',
                          backgroundColor: loading || effectivePage >= totalPages ? '#f5f5f7' : '#fff',
                          color: loading || effectivePage >= totalPages ? '#9b9ba0' : '#1d1d1f',
                          cursor: loading || effectivePage >= totalPages ? 'not-allowed' : 'pointer',
                        }}
                      >
                        <ChevronRight size={18} strokeWidth={2.5} />
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 auto' }}>
                      <span style={{ fontSize: 14, color: '#1d1d1f', fontWeight: 500 }}>Page</span>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minWidth: 32,
                          height: 32,
                          padding: '0 10px',
                          fontSize: 13,
                          fontWeight: 600,
                          color: '#1d1d1f',
                          border: '1px solid #d2d2d7',
                          borderRadius: 8,
                          backgroundColor: '#fff',
                        }}
                      >
                        {effectivePage}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
        </div>
        </div>
      </div>

      {/* CTA vendeur — aligné sur l’accueil */}
      <section
        className="home-section-padded home-section-vendeur-cta"
        style={{
          position: 'relative',
          marginTop: 0,
          padding: 'calc(76px + 2mm) 24px 76px',
          backgroundColor: '#f5f5f7',
        }}
      >
        <div className="home-section-vendeur-cta-inner" style={{ position: 'relative', textAlign: 'center' }}>
          <FluidOneLineHeading
            className="home-section-vendeur-cta-title"
            style={{
              fontFamily: 'var(--font-playfair), Georgia, serif',
              fontWeight: 500,
              color: '#1d1d1f',
              marginBottom: 16,
              letterSpacing: '-0.02em',
            }}
          >
            Vous êtes un vendeur professionnel ?
          </FluidOneLineHeading>
          <p className="home-section-vendeur-cta-desc" style={{ fontSize: 16, color: '#6e6e73', marginBottom: 24, lineHeight: 1.5 }}>
            Rejoignez notre réseau de vendeurs partenaires et donnez de la visibilité à vos articles.
          </p>
          <Link
            className="home-section-vendeur-cta-btn"
            href="/inscription-vendeur"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              height: 50,
              padding: '0 28px',
              backgroundColor: '#1d1d1f',
              color: '#fff',
              fontSize: 15,
              fontWeight: 500,
              borderRadius: 980,
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.9';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
          >
            Devenir partenaire
            <ArrowRight size={18} strokeWidth={2} />
          </Link>
        </div>
      </section>

      {/* Popup Rendre visite au vendeur (même composant que annonce / messages) */}
      {seller && (
        <SellerVisitMapPopup
          seller={seller}
          open={showMapPopup}
          onClose={() => setShowMapPopup(false)}
          mapZoom={mapZoom}
          setMapZoom={setMapZoom}
          showBackButton
        />
      )}

      {/* Modal : connectez-vous pour ajouter aux favoris */}
      {showAuthModalFavoris && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 205, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)' }} onClick={() => setShowAuthModalFavoris(false)} />
          <div style={{ position: 'relative', width: '100%', maxWidth: 380, backgroundColor: '#fff', padding: 36, borderRadius: 18, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
            <h2 style={{ fontFamily: 'var(--font-inter), var(--font-sans)', fontSize: 19, fontWeight: 600, marginBottom: 8, color: '#0a0a0a', textAlign: 'center' }}>Connectez-vous</h2>
            <p style={{ fontSize: 14, color: '#666', marginBottom: 24, textAlign: 'center' }}>Connectez-vous pour ajouter des annonces à vos favoris.</p>
            <Link href={`/connexion${redirectUrl}`} onClick={() => setShowAuthModalFavoris(false)} style={{ display: 'block', width: '100%', height: 50, border: '1.5px solid #d2d2d7', color: '#1d1d1f', fontSize: 15, fontWeight: 500, textAlign: 'center', lineHeight: '50px', marginBottom: 12, borderRadius: 980 }}>
              J&apos;ai déjà un compte
            </Link>
            <Link href={`/inscription${redirectUrl}`} onClick={() => setShowAuthModalFavoris(false)} style={{ display: 'block', width: '100%', height: 50, backgroundColor: '#1d1d1f', color: '#fff', fontSize: 15, fontWeight: 500, textAlign: 'center', lineHeight: '50px', borderRadius: 980 }}>
              Créer un compte
            </Link>
          </div>
        </div>
      )}

      {/* Mobile Filters Modal */}
      {mobileFiltersOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 200,
            display: 'flex',
          }}
        >
          <div
            style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)' }}
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div
            className="catalogue-mobile-filters-panel"
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: 340,
              height: '100%',
              backgroundColor: '#fff',
              overflowY: 'auto',
              marginRight: 'auto',
              left: 0,
            }}
          >
            <div
              className="catalogue-mobile-filters-panel-header"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '20px 24px',
                borderBottom: '1px solid #e8e6e3',
                position: 'sticky',
                top: 0,
                backgroundColor: '#fff',
                zIndex: 10,
              }}
            >
              <h2 style={{ fontFamily: 'var(--font-inter), var(--font-sans)', fontSize: 19, fontWeight: 600, color: '#0a0a0a', display: 'flex', alignItems: 'center', gap: 10 }}>
                <SlidersHorizontal size={20} style={{ flexShrink: 0 }} />
                Filtres
              </h2>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                style={{ padding: 8, background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <X size={22} />
              </button>
            </div>
            <div style={{ padding: '0 20px 100px' }}>
              {filtersContent}
            </div>
            <div
              className="catalogue-mobile-filters-panel-footer"
              style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                width: '100%',
                maxWidth: 340,
                padding: 20,
                backgroundColor: '#fff',
                borderTop: '1px solid #e8e6e3',
              }}
            >
              <button
                onClick={() => setMobileFiltersOpen(false)}
                style={{
                  width: '100%',
                  height: 50,
                  backgroundColor: '#1d1d1f',
                  color: '#fff',
                  fontSize: 15,
                  fontWeight: 500,
                  border: 'none',
                  borderRadius: 12,
                  cursor: 'pointer',
                }}
              >
                Voir {listings.length} résultat{listings.length !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
    </>
  );
}

export default function CataloguePage() {
  return (
    <Suspense fallback={null}>
      <CatalogueContent />
    </Suspense>
  );
}
