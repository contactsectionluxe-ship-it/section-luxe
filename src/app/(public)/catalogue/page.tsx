'use client';

import { useEffect, useLayoutEffect, useMemo, useState, useCallback, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search, SlidersHorizontal, X, ChevronDown, Heart, Store, MapPin, Plus, Minus, ArrowLeft } from 'lucide-react';
import { SearchFilters as Filters, defaultFilters } from '@/types/filters';
import { getListings } from '@/lib/supabase/listings';
import { getSellerData } from '@/lib/supabase/auth';
import { Listing, Seller } from '@/types';
import { CATEGORIES } from '@/lib/utils';
import {
  BRANDS_BY_CATEGORY,
  CATEGORY_TO_BRAND_KEYS,
  COLORS_BY_CATEGORY,
  MATIERES_BY_CATEGORY,
  MODELS_BY_CATEGORY_BRAND,
  CONDITIONS,
  COLORS,
  MATERIALS,
} from '@/lib/constants';

const SORT_OPTIONS = [
  { value: 'date_desc', label: 'Plus récents' },
  { value: 'date_asc', label: 'Plus anciens' },
  { value: 'price_asc', label: 'Prix croissant' },
  { value: 'price_desc', label: 'Prix décroissant' },
  { value: 'likes', label: 'Populaires' },
];

function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
  }).format(price);
}

// Filter Section Component
function FilterSection({
  title,
  children,
  defaultOpen = false,
  collapsible = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  collapsible?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  if (!collapsible) {
    return (
      <div style={{ borderBottom: '1px solid #e8e6e3' }}>
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
        <div style={{ paddingBottom: 16 }}>{children}</div>
      </div>
    );
  }

  return (
    <div style={{ borderBottom: '1px solid #e8e6e3' }}>
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
        <ChevronDown
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

function CatalogueContent() {
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<Filters>(() => {
    const initial: Filters = { ...defaultFilters };
    const category = searchParams.get('category');
    if (category) initial.categories = [category];
    const brand = searchParams.get('brand');
    if (brand) initial.brands = [decodeURIComponent(brand)];
    const sellerId = searchParams.get('sellerId');
    if (sellerId) initial.sellerId = sellerId;
    return initial;
  });

  /** Un seul menu déroulant ouvert à la fois. */
  type DropdownId = 'type' | 'marque' | 'modele' | 'color' | 'material';
  const [openDropdown, setOpenDropdown] = useState<DropdownId | null>(null);
  const typeDropdownRef = useRef<HTMLDivElement>(null);
  const marqueDropdownRef = useRef<HTMLDivElement>(null);
  const [marqueSearchQuery, setMarqueSearchQuery] = useState('');
  const modeleDropdownRef = useRef<HTMLDivElement>(null);
  const [modeleSearchQuery, setModeleSearchQuery] = useState('');
  const colorDropdownRef = useRef<HTMLDivElement>(null);
  const materialDropdownRef = useRef<HTMLDivElement>(null);
  const typeDropdownOpen = openDropdown === 'type';
  const marqueDropdownOpen = openDropdown === 'marque';
  const modeleDropdownOpen = openDropdown === 'modele';
  const colorDropdownOpen = openDropdown === 'color';
  const materialDropdownOpen = openDropdown === 'material';
  const modelesAlphabetiques = useMemo(() => {
    const selectedTypes = filters.categories ?? (filters.category ? [filters.category] : []);
    const selectedBrands = filters.brands ?? (filters.brand ? [filters.brand] : []);
    const categoryKeys =
      selectedTypes.length > 0
        ? [...new Set(selectedTypes.flatMap((t) => CATEGORY_TO_BRAND_KEYS[t] ?? [t]))]
        : Object.keys(MODELS_BY_CATEGORY_BRAND);
    const modelSet = new Set<string>();
    for (const cat of categoryKeys) {
      const byBrand = MODELS_BY_CATEGORY_BRAND[cat];
      if (!byBrand) continue;
      const brandsToConsider = selectedBrands.length > 0 ? selectedBrands : Object.keys(byBrand);
      for (const brand of brandsToConsider) {
        const models = byBrand[brand];
        if (models) models.forEach((m) => modelSet.add(m));
      }
    }
    return [
      ...[...modelSet].filter((m) => m !== 'Autre').sort((a, b) => a.localeCompare(b, 'fr')),
      'Autre',
    ];
  }, [filters.categories, filters.category, filters.brands, filters.brand]);

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
  const [loading, setLoading] = useState(true);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [sellerLoading, setSellerLoading] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestionsOpen, setSearchSuggestionsOpen] = useState(false);
  const searchBarRef = useRef<HTMLDivElement>(null);
  const [showMapPopup, setShowMapPopup] = useState(false);
  const [mapZoom, setMapZoom] = useState(15);

  // Synchroniser sellerId depuis l'URL
  useEffect(() => {
    const sellerId = searchParams.get('sellerId');
    setFilters((prev) => (prev.sellerId !== (sellerId || undefined) ? { ...prev, sellerId: sellerId || undefined } : prev));
  }, [searchParams]);

  // Charger les infos vendeur quand sellerId est présent
  useEffect(() => {
    if (!filters.sellerId) {
      setSeller(null);
      return;
    }
    setSellerLoading(true);
    getSellerData(filters.sellerId)
      .then((data) => {
        setSeller(data || null);
      })
      .finally(() => setSellerLoading(false));
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
    setLoading(true);
    try {
      let sortBy: 'newest' | 'oldest' | 'price_asc' | 'price_desc' | 'likes' = 'newest';
      if (filters.sortBy === 'date_asc') sortBy = 'oldest';
      else if (filters.sortBy === 'price_asc') sortBy = 'price_asc';
      else if (filters.sortBy === 'price_desc') sortBy = 'price_desc';
      else if (filters.sortBy === 'likes') sortBy = 'likes';

      const categories = filters.categories?.length ? filters.categories : (filters.category ? [filters.category] : undefined);
      const brands = filters.brands?.length ? filters.brands : (filters.brand ? [filters.brand] : undefined);
      const models = filters.models?.length ? filters.models : (filters.model ? [filters.model] : undefined);
      const colors = filters.colors?.length ? filters.colors : (filters.color ? [filters.color] : undefined);
      const conditions = filters.conditions?.length ? filters.conditions : (filters.condition ? [filters.condition] : undefined);
      const data = await getListings({ categories, brands, models, colors, conditions, sellerId: filters.sellerId, sortBy });

      let filtered = data;
      if (filters.priceMin) filtered = filtered.filter((l) => l.price >= filters.priceMin!);
      if (filters.priceMax) filtered = filtered.filter((l) => l.price <= filters.priceMax!);
      if (filters.yearMin != null) filtered = filtered.filter((l) => (l.year ?? 0) >= filters.yearMin!);
      if (filters.yearMax != null) filtered = filtered.filter((l) => (l.year ?? 0) <= filters.yearMax!);
      if (filters.query) {
        const q = filters.query.toLowerCase();
        filtered = filtered.filter(
          (l) => l.title.toLowerCase().includes(q) || l.description.toLowerCase().includes(q)
        );
      }

      setListings(filtered);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  useLayoutEffect(() => {
    if (!marqueDropdownOpen) setMarqueSearchQuery('');
  }, [marqueDropdownOpen]);

  useLayoutEffect(() => {
    if (!modeleDropdownOpen) setModeleSearchQuery('');
  }, [modeleDropdownOpen]);


  /** Fermer le menu au clic extérieur ou Escape (un seul menu ouvert à la fois). */
  useEffect(() => {
    if (openDropdown === null) return;
    const ref =
      openDropdown === 'type' ? typeDropdownRef :
      openDropdown === 'marque' ? marqueDropdownRef :
      openDropdown === 'modele' ? modeleDropdownRef :
      openDropdown === 'color' ? colorDropdownRef :
      materialDropdownRef;
    const onMouseDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpenDropdown(null);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenDropdown(null);
    };
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [openDropdown]);

  const updateFilter = (key: keyof Filters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value || undefined }));
  };

  const selectedTypes = filters.categories ?? (filters.category ? [filters.category] : []);
  const toggleType = (value: string) => {
    setFilters((prev) => {
      const current = prev.categories ?? (prev.category ? [prev.category] : []);
      const next = current.includes(value) ? current.filter((c) => c !== value) : [...current, value];
      return { ...prev, categories: next.length ? next : undefined, category: undefined };
    });
  };

  const selectedBrands = filters.brands ?? (filters.brand ? [filters.brand] : []);
  const toggleBrand = (brand: string) => {
    setFilters((prev) => {
      const current = prev.brands ?? (prev.brand ? [prev.brand] : []);
      const next = current.includes(brand) ? current.filter((b) => b !== brand) : [...current, brand];
      return { ...prev, brands: next.length ? next : undefined, brand: undefined };
    });
  };

  const selectedModels = filters.models ?? (filters.model ? [filters.model] : []);
  const toggleModele = (model: string) => {
    setFilters((prev) => {
      const current = prev.models ?? (prev.model ? [prev.model] : []);
      const next = current.includes(model) ? current.filter((m) => m !== model) : [...current, model];
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

  const selectedConditions = filters.conditions ?? (filters.condition ? [filters.condition] : []);
  const toggleCondition = (conditionValue: string) => {
    setFilters((prev) => {
      const current = prev.conditions ?? (prev.condition ? [prev.condition] : []);
      const next = current.includes(conditionValue) ? current.filter((c) => c !== conditionValue) : [...current, conditionValue];
      return { ...prev, conditions: next.length ? next : undefined, condition: undefined };
    });
  };

  const handleReset = () => {
    setFilters(defaultFilters);
    setSearchQuery('');
    setLocalPriceMin('');
    setLocalPriceMax('');
    setOpenDropdown(null);
    setMarqueSearchQuery('');
    setModeleSearchQuery('');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchSuggestionsOpen(false);
    setFilters((prev) => ({ ...prev, query: searchQuery }));
  };

  /** Suggestions pour la barre de recherche (types d'article + marques + titres d'annonces) */
  const searchSuggestions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const types = CATEGORIES.map((t) => t.label);
    const brands = [...new Set(Object.values(BRANDS_BY_CATEGORY).flat())].filter((b) => b !== 'Autre');
    const fromListings = listings
      .slice(0, 50)
      .map((l) => l.title)
      .filter(Boolean);
    const all = [...new Set([...types, ...brands, ...fromListings])];
    if (!q) return all.slice(0, 10);
    return all.filter((s) => s.toLowerCase().includes(q)).slice(0, 10);
  }, [searchQuery, listings]);

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
      {/* Type d'article — toujours visible, pas repliable */}
      <FilterSection title="Type d'article" defaultOpen collapsible={false}>
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
            }}
          >
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {selectedTypes.length === 0
                ? 'Tous les types'
                : selectedTypes.length === 1
                  ? CATEGORIES.find((t) => t.value === selectedTypes[0])?.label ?? selectedTypes[0]
                  : `${selectedTypes.length} types sélectionnés`}
            </span>
            <ChevronDown
              size={16}
              style={{ flexShrink: 0, marginLeft: 8, transform: typeDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', color: '#86868b' }}
            />
          </button>
          {typeDropdownOpen && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: '100%',
                marginLeft: 8,
                minWidth: 415,
                maxHeight: 360,
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: '#fff',
                border: '1px solid #e8e6e3',
                borderRadius: 12,
                boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
                zIndex: 9999,
                overflow: 'hidden',
              }}
            >
              <button
                type="button"
                onClick={() => { setFilters((p) => ({ ...p, categories: undefined, category: undefined })); setOpenDropdown(null); }}
                style={{
                  padding: '10px 12px',
                  fontSize: 14,
                  color: '#1d1d1f',
                  background: '#fff',
                  border: 'none',
                  borderBottom: '1px solid #e8e6e3',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontWeight: selectedTypes.length === 0 ? 600 : 400,
                  flexShrink: 0,
                }}
              >
                Tous les types
              </button>
              <div style={{ overflowY: 'auto', flex: 1, minHeight: 0, padding: 8 }}>
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
                      marginTop: 8,
                      fontSize: 12,
                      color: '#6e6e73',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      padding: '6px 4px',
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

      {/* Marque — toujours visible, pas repliable */}
      <FilterSection title="Marque" defaultOpen collapsible={false}>
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
            }}
          >
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {selectedBrands.length === 0
                ? 'Toutes les marques'
                : selectedBrands.length === 1
                  ? selectedBrands[0]
                  : `${selectedBrands.length} marques sélectionnées`}
            </span>
            <ChevronDown
              size={16}
              style={{ flexShrink: 0, marginLeft: 8, transform: marqueDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', color: '#86868b' }}
            />
          </button>
          {marqueDropdownOpen && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: '100%',
                marginLeft: 8,
                minWidth: 415,
                maxHeight: 360,
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: '#fff',
                border: '1px solid #e8e6e3',
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
                  borderBottom: '1px solid #e8e6e3',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontWeight: selectedBrands.length === 0 ? 600 : 400,
                  flexShrink: 0,
                }}
              >
                Toutes les marques
              </button>
              <div style={{ padding: '8px 12px', borderBottom: '1px solid #e8e6e3', flexShrink: 0 }}>
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
              <div style={{ overflowY: 'auto', flex: 1, minHeight: 0, maxHeight: 252, padding: 8 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 56px' }}>
                  {marquesAlphabetiques.filter((b) => b.toLowerCase().includes(marqueSearchQuery.toLowerCase().trim())).map((brand) => (
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
                      marginTop: 8,
                      fontSize: 12,
                      color: '#6e6e73',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      padding: '6px 4px',
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

      {/* Modèle — toujours visible, même style que Marque */}
      <FilterSection title="Modèle" defaultOpen collapsible={false}>
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
            }}
          >
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {selectedModels.length === 0
                ? 'Tous les modèles'
                : selectedModels.length === 1
                  ? selectedModels[0]
                  : `${selectedModels.length} modèles sélectionnés`}
            </span>
            <ChevronDown
              size={16}
              style={{ flexShrink: 0, marginLeft: 8, transform: modeleDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', color: '#86868b' }}
            />
          </button>
          {modeleDropdownOpen && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: '100%',
                marginLeft: 8,
                minWidth: 415,
                maxHeight: 360,
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: '#fff',
                border: '1px solid #e8e6e3',
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
                  borderBottom: '1px solid #e8e6e3',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontWeight: selectedModels.length === 0 ? 600 : 400,
                  flexShrink: 0,
                }}
              >
                Tous les modèles
              </button>
              <div style={{ padding: '8px 12px', borderBottom: '1px solid #e8e6e3', flexShrink: 0 }}>
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
              <div style={{ overflowY: 'auto', flex: 1, minHeight: 0, maxHeight: 252, padding: 8 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 56px' }}>
                  {modelesAlphabetiques.filter((m) => m.toLowerCase().includes(modeleSearchQuery.toLowerCase().trim())).map((model) => (
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
                {selectedModels.length > 0 && (
                  <button
                    type="button"
                    onClick={() => { setFilters((p) => ({ ...p, models: undefined, model: undefined })); setOpenDropdown(null); setModeleSearchQuery(''); }}
                    style={{
                      marginTop: 8,
                      fontSize: 12,
                      color: '#6e6e73',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      padding: '6px 4px',
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

      {/* Année — même format que Prix (Min / Max sur une ligne) */}
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

      {priceInputs}

      {/* Couleur — menu comme Modèle */}
      <FilterSection title="Couleur" defaultOpen collapsible={false}>
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
            }}
          >
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {selectedColors.length === 0
                ? 'Toutes les couleurs'
                : selectedColors.length === 1
                  ? (COLORS.find((c) => c.value === selectedColors[0])?.label ?? selectedColors[0])
                  : `${selectedColors.length} couleurs sélectionnées`}
            </span>
            <ChevronDown
              size={16}
              style={{ flexShrink: 0, marginLeft: 8, transform: colorDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', color: '#86868b' }}
            />
          </button>
          {colorDropdownOpen && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: '100%',
                marginLeft: 8,
                minWidth: 415,
                maxHeight: 360,
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: '#fff',
                border: '1px solid #e8e6e3',
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
                  borderBottom: '1px solid #e8e6e3',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontWeight: selectedColors.length === 0 ? 600 : 400,
                  flexShrink: 0,
                }}
              >
                Toutes les couleurs
              </button>
              <div style={{ overflowY: 'auto', flex: 1, minHeight: 0, maxHeight: 252, padding: 8 }}>
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
                      marginTop: 8,
                      fontSize: 12,
                      color: '#6e6e73',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      padding: '6px 4px',
                      width: '100%',
                    }}
                  >
                    Réinitialiser les couleurs
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </FilterSection>

      {/* Matière — menu comme Couleur */}
      <FilterSection title="Matière" defaultOpen collapsible={false}>
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
            }}
          >
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {selectedMaterials.length === 0
                ? 'Toutes les matières'
                : selectedMaterials.length === 1
                  ? (MATERIALS.find((m) => m.value === selectedMaterials[0])?.label ?? selectedMaterials[0])
                  : `${selectedMaterials.length} matières sélectionnées`}
            </span>
            <ChevronDown
              size={16}
              style={{ flexShrink: 0, marginLeft: 8, transform: materialDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', color: '#86868b' }}
            />
          </button>
          {materialDropdownOpen && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: '100%',
                marginLeft: 8,
                minWidth: 415,
                maxHeight: 360,
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: '#fff',
                border: '1px solid #e8e6e3',
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
                  borderBottom: '1px solid #e8e6e3',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontWeight: selectedMaterials.length === 0 ? 600 : 400,
                  flexShrink: 0,
                }}
              >
                Toutes les matières
              </button>
              <div style={{ overflowY: 'auto', flex: 1, minHeight: 0, maxHeight: 252, padding: 8 }}>
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
                      marginTop: 8,
                      fontSize: 12,
                      color: '#6e6e73',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      padding: '6px 4px',
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

      {/* État — sélection multiple, même style que Type / Marque / Modèle (carré bords ronds) */}
      <FilterSection title="État" defaultOpen collapsible={false}>
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
                marginTop: 8,
                fontSize: 12,
                color: '#6e6e73',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                padding: '6px 4px',
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
    <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, backgroundColor: '#fff' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%', padding: '0 24px', boxSizing: 'border-box' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', maxWidth: 1100, width: '100%', margin: '0 auto' }}>
        {/* Carte principale : même largeur que la page d'accueil (1100px) */}
        <div
          style={{
            flex: 1,
            minHeight: 'calc(100vh - var(--header-height))',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#fff',
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
            boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
            border: '1px solid #e8e6e3',
            borderTop: 'none',
            overflow: 'hidden',
          }}
        >
          {/* Barre de recherche : marge haute pour ne pas passer sous le header fixe */}
          <div style={{ padding: 'calc(var(--header-height) + 20px) 28px 20px 28px', borderBottom: '1px solid #e8e6e3', backgroundColor: '#fff' }}>
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: 12 }}>
              <div ref={searchBarRef} style={{ flex: 1, position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#86868b', pointerEvents: 'none' }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchSuggestionsOpen(true)}
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
                    {searchSuggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => {
                          setSearchQuery(suggestion);
                          setSearchSuggestionsOpen(false);
                          setFilters((prev) => ({ ...prev, query: suggestion }));
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
                    ))}
                  </div>
                )}
              </div>
              <button
                type="submit"
                style={{
                  height: 48,
                  padding: '0 24px',
                  backgroundColor: '#1d1d1f',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 500,
                  border: 'none',
                  borderRadius: 12,
                  cursor: 'pointer',
                }}
              >
                Rechercher
              </button>
            </form>
          </div>

          <div style={{ display: 'flex', flex: 1, minHeight: 0, gap: 0 }}>
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
            <main style={{ flex: 1, minWidth: 0, padding: '24px 28px 32px' }}>
            {/* Bloc vendeur : nom, logo, annonces */}
            {filters.sellerId && (
              <div
                style={{
                  marginBottom: 24,
                  padding: 20,
                  backgroundColor: '#fafaf9',
                  border: '1px solid #e8e6e3',
                  borderRadius: 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 20,
                  flexWrap: 'wrap',
                }}
              >
                {sellerLoading ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 80, height: 80, borderRadius: 12, backgroundColor: '#f0f0f2' }} />
                    <div>
                      <div style={{ width: 180, height: 20, backgroundColor: '#f0f0f2', marginBottom: 8, borderRadius: 4 }} />
                      <div style={{ width: 120, height: 14, backgroundColor: '#f0f0f2', borderRadius: 4 }} />
                    </div>
                  </div>
                ) : seller ? (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                      <div
                        style={{
                          width: 80,
                          height: 80,
                          borderRadius: 12,
                          overflow: 'hidden',
                          backgroundColor: '#f0f0f2',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {seller.avatarUrl ? (
                          <img src={seller.avatarUrl} alt={seller.companyName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <Store size={40} color="#888" />
                        )}
                      </div>
                      <div>
                        <h2 style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: 22, fontWeight: 600, color: '#1d1d1f', margin: 0, marginBottom: 4 }}>
                          {seller.companyName}
                        </h2>
                        <p style={{ fontSize: 14, color: '#6e6e73', margin: 0 }}>
                          {listings.length} annonce{listings.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    {(seller.address || seller.city || seller.postcode) && (
                      <div
                        style={{
                          height: 80,
                          minWidth: 260,
                          padding: '0 16px',
                          display: 'flex',
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 16,
                          backgroundImage: "linear-gradient(rgba(255,255,255,0.6), rgba(255,255,255,0.6)), url('/map-plan.png')",
                          backgroundSize: '115%',
                          backgroundPosition: 'center',
                          backgroundColor: '#f6f6f8',
                          border: '1px solid #c8c8cc',
                          borderRadius: 14,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                          <MapPin size={24} color="#1d1d1f" style={{ flexShrink: 0 }} />
                          {seller.postcode && <span style={{ fontSize: 16, fontWeight: 600, color: '#1d1d1f' }}>{seller.postcode}</span>}
                          {seller.city && <span style={{ fontSize: 16, fontWeight: 600, color: '#1d1d1f', textDecoration: 'underline' }}>{seller.city}</span>}
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowMapPopup(true)}
                          style={{ padding: '10px 20px', backgroundColor: '#fff', border: '1px solid #d2d2d7', borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}
                        >
                          Voir la carte
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <p style={{ fontSize: 14, color: '#6e6e73', margin: 0 }}>Vendeur introuvable.</p>
                )}
              </div>
            )}

            {/* Barre tri + filtre mobile */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                marginBottom: 20,
                flexWrap: 'wrap',
                gap: 10,
              }}
            >
                {/* Mobile filter button */}
                <button
                  onClick={() => setMobileFiltersOpen(true)}
                  className="hide-desktop"
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

                {/* Sort */}
                <div style={{ position: 'relative' }}>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => updateFilter('sortBy', e.target.value)}
                    style={{
                      appearance: 'none',
                      height: 40,
                      padding: '0 32px 0 14px',
                      border: '1px solid #d2d2d7',
                      borderRadius: 12,
                      backgroundColor: '#fff',
                      fontSize: 14,
                      color: '#1d1d1f',
                      cursor: 'pointer',
                    }}
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={16}
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      pointerEvents: 'none',
                      color: '#86868b',
                    }}
                  />
                </div>
              </div>

            {/* Results */}
            {loading ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: 20,
                }}
              >
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i}>
                    <div style={{ aspectRatio: '3/4', backgroundColor: '#f0f0f0', marginBottom: 12 }} />
                    <div style={{ height: 12, backgroundColor: '#f0f0f0', width: '60%', marginBottom: 8 }} />
                    <div style={{ height: 14, backgroundColor: '#f0f0f0', width: '80%', marginBottom: 6 }} />
                    <div style={{ height: 14, backgroundColor: '#f0f0f0', width: '40%' }} />
                  </div>
                ))}
              </div>
            ) : listings.length > 0 ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: 20,
                }}
              >
                {listings.map((listing) => (
                  <Link key={listing.id} href={`/produit/${listing.id}`}>
                    <article style={{ position: 'relative' }}>
                      <div
                        style={{
                          position: 'relative',
                          aspectRatio: '3/4',
                          backgroundColor: '#f5f5f7',
                          overflow: 'hidden',
                          marginBottom: 14,
                          borderRadius: 18,
                        }}
                      >
                        {listing.photos[0] ? (
                          <img
                            src={listing.photos[0]}
                            alt={listing.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '100%',
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#ccc',
                              fontSize: 12,
                            }}
                          >
                            Photo
                          </div>
                        )}
                        {listing.likesCount > 0 && (
                            <div
                            style={{
                              position: 'absolute',
                              bottom: 10,
                              left: 10,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                              padding: '6px 10px',
                              backgroundColor: '#fff',
                              fontSize: 11,
                              fontWeight: 500,
                              borderRadius: 10,
                            }}
                          >
                            <Heart size={12} /> {listing.likesCount}
                          </div>
                        )}
                      </div>
                      <p
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: 0.5,
                          color: '#999',
                          marginBottom: 4,
                        }}
                      >
                        {listing.sellerName}
                      </p>
                      <h3
                        style={{
                          fontSize: 13,
                          fontWeight: 500,
                          marginBottom: 6,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {listing.title}
                      </h3>
                      <p style={{ fontSize: 14, fontWeight: 600 }}>{formatPrice(listing.price)}</p>
                    </article>
                  </Link>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 24px' }}>
                <p style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: 20, fontWeight: 500, marginBottom: 8, color: '#1d1d1f' }}>Aucun résultat</p>
                <p style={{ fontSize: 15, color: '#6e6e73', marginBottom: 24 }}>
                  Essayez de modifier vos critères ou réinitialisez les filtres.
                </p>
                <button
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
            )}
          </main>
          </div>
        </div>

      {/* Popup Plan vendeur */}
      {showMapPopup && seller && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 210, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)' }} onClick={() => setShowMapPopup(false)} />
          <div style={{ position: 'relative', width: '100%', maxWidth: 560, maxHeight: '90vh', overflow: 'auto', backgroundColor: '#fff', borderRadius: 18, boxShadow: '0 4px 24px rgba(0,0,0,0.06)', border: '1px solid #e8e6e3' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #e5e5e7' }}>
                <button type="button" onClick={() => setShowMapPopup(false)} style={{ position: 'absolute', left: 0, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: '#f5f5f7', borderRadius: 10, cursor: 'pointer' }} aria-label="Retour">
                  <ArrowLeft size={20} />
                </button>
                <h2 style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: 22, fontWeight: 500, margin: 0, textAlign: 'center' }}>Plan vendeur</h2>
                <button type="button" onClick={() => setShowMapPopup(false)} style={{ position: 'absolute', right: 0, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: '#f5f5f7', borderRadius: 10, cursor: 'pointer' }} aria-label="Fermer">
                  <X size={20} />
                </button>
              </div>
              <p style={{ fontSize: 18, fontWeight: 600, color: '#1d1d1f', margin: 0, marginBottom: 8 }}>{seller.companyName}</p>
              <p style={{ fontSize: 14, color: '#666', margin: 0, marginBottom: 16 }}>{[seller.address, seller.postcode, seller.city].filter(Boolean).join(', ')}</p>
              <div style={{ position: 'relative', width: '100%', height: 220, borderRadius: 12, overflow: 'hidden' }}>
                <iframe
                  title="Carte du vendeur"
                  src={`https://www.google.com/maps?q=${encodeURIComponent([seller.address, seller.postcode, seller.city].filter(Boolean).join(', '))}&z=${mapZoom}&output=embed`}
                  style={{ width: '100%', height: '100%', border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
                <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setMapZoom((z) => Math.min(20, z + 1)); }}
                    style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', border: '1px solid #d2d2d7', borderRadius: 10, cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}
                    title="Zoom avant"
                  >
                    <Plus size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setMapZoom((z) => Math.max(10, z - 1)); }}
                    style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', border: '1px solid #d2d2d7', borderRadius: 10, cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}
                    title="Zoom arrière"
                  >
                    <Minus size={18} />
                  </button>
                </div>
              </div>
            </div>
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
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: 340,
              height: '100%',
              backgroundColor: '#fff',
              overflowY: 'auto',
              marginLeft: 'auto',
            }}
          >
            <div
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
              <h2 style={{ fontSize: 18, fontWeight: 600, color: '#1d1d1f', fontFamily: 'var(--font-playfair), Georgia, serif', display: 'flex', alignItems: 'center', gap: 10 }}>
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
              style={{
                position: 'fixed',
                bottom: 0,
                right: 0,
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
        </div>
      </div>
    </main>
  );
}

export default function CataloguePage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            paddingTop: 'var(--header-height)',
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <p style={{ color: '#888' }}>Chargement...</p>
        </div>
      }
    >
      <CatalogueContent />
    </Suspense>
  );
}
