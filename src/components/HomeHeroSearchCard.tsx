'use client';

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import { Search, ChevronRight } from 'lucide-react';
import { CATEGORIES } from '@/lib/utils';
import {
  BRANDS_BY_CATEGORY,
  CATEGORY_TO_BRAND_KEYS,
  getVetementsTypesForGenreCatalogue,
  getSacsTypesForGenreCatalogue,
  getBijouxTypesForGenre,
  getChaussuresTypesForGenreCatalogue,
  getAccessoiresTypesForGenreCatalogue,
} from '@/lib/constants';

/** Aligné sur le catalogue (suggestions marques). */
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

function normalizeForSearch(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[-'\s]+/g, '');
}

const CATEGORIES_WITH_ARTICLE_TYPE = ['sacs', 'vetements', 'chaussures', 'accessoires', 'bijoux'];

const triggerButtonStyle: CSSProperties = {
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
  boxSizing: 'border-box',
};

const pillStyle: CSSProperties = {
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
};

const dropdownPanelStyle: CSSProperties = {
  position: 'absolute',
  top: 'calc(100% + 6px)',
  left: 0,
  right: 0,
  minWidth: 280,
  maxHeight: 360,
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: '#fff',
  border: '1px solid #d2d2d7',
  borderRadius: 12,
  boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
  zIndex: 100,
  overflow: 'hidden',
};

/** Sous-menus type / marque : plus compacts ; espacement entre les lignes de propositions inchangé. */
const typeMarquePanelStyle: CSSProperties = {
  ...dropdownPanelStyle,
  maxHeight: 292,
  minWidth: 260,
  borderRadius: 10,
  boxShadow: '0 3px 18px rgba(0,0,0,0.1)',
};

/** Sous-menu marque : un peu plus large / haut que « type de produit ». */
const marqueSubmenuPanelStyle: CSSProperties = {
  ...typeMarquePanelStyle,
  minWidth: 292,
  maxHeight: 320,
};

const typeMarqueMenuHeaderBtnStyle: CSSProperties = {
  padding: '7px 10px',
  fontSize: 13,
  color: '#1d1d1f',
  background: '#fff',
  border: 'none',
  borderBottom: '1px solid #d2d2d7',
  cursor: 'pointer',
  textAlign: 'left',
  fontWeight: 600,
  flexShrink: 0,
};

const marqueRowLabelStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  cursor: 'pointer',
  padding: '6px 4px',
  borderRadius: 8,
  minWidth: 0,
};

const marqueNameSpanStyle: CSSProperties = {
  fontSize: 14,
  color: '#1d1d1f',
  flex: 1,
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

function triggerStyle(disabled: boolean): CSSProperties {
  return {
    ...triggerButtonStyle,
    opacity: disabled ? 0.48 : 1,
    cursor: disabled ? 'not-allowed' : 'pointer',
    pointerEvents: disabled ? 'none' : 'auto',
  };
}

export function HomeHeroSearchCard() {
  const typeTriggerRef = useRef<HTMLButtonElement>(null);
  const typePanelRef = useRef<HTMLDivElement>(null);
  const articleTypeTriggerRef = useRef<HTMLButtonElement>(null);
  const articleTypePanelRef = useRef<HTMLDivElement>(null);
  const marqueTriggerRef = useRef<HTMLButtonElement>(null);
  const marquePanelRef = useRef<HTMLDivElement>(null);
  const [genre, setGenre] = useState<('femme' | 'homme')[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [articleTypes, setArticleTypes] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [openDropdown, setOpenDropdown] = useState<null | 'type' | 'articleType' | 'marque'>(null);
  const [marqueSearchQuery, setMarqueSearchQuery] = useState('');
  const [count, setCount] = useState<number | null>(null);
  const [loadingCount, setLoadingCount] = useState(false);

  const genreForOptions = useMemo(
    () => (genre.length ? genre : (['femme', 'homme'] as const)) as ('femme' | 'homme')[],
    [genre],
  );

  const articleTypeOptionsByCategory = useMemo(() => {
    const withType = categories.filter((c) => CATEGORIES_WITH_ARTICLE_TYPE.includes(c));
    if (withType.length === 0) return [];
    return withType
      .map((cat) => {
        const list =
          cat === 'vetements'
            ? getVetementsTypesForGenreCatalogue(genreForOptions)
            : cat === 'sacs'
              ? getSacsTypesForGenreCatalogue(genreForOptions)
              : cat === 'bijoux'
                ? getBijouxTypesForGenre(genreForOptions)
                : cat === 'chaussures'
                  ? getChaussuresTypesForGenreCatalogue(genreForOptions)
                  : cat === 'accessoires'
                    ? getAccessoiresTypesForGenreCatalogue(genreForOptions)
                    : [];
        const categoryLabel = CATEGORIES.find((c) => c.value === cat)?.label ?? cat;
        return { categoryKey: cat, categoryLabel, options: list };
      })
      .filter((g) => g.options.length > 0);
  }, [categories, genreForOptions]);

  const articleTypeOptions = useMemo(
    () => articleTypeOptionsByCategory.flatMap((g) => g.options),
    [articleTypeOptionsByCategory],
  );

  const articleTypeKey = (opt: { value: string; label: string }) => `${opt.value}::${opt.label}`;
  const isArticleTypeOptionChecked = (opt: { value: string; label: string }) =>
    articleTypes.includes(opt.value) || articleTypes.includes(articleTypeKey(opt));

  const toggleArticleType = (opt: { value: string; label: string }) => {
    const key = articleTypeKey(opt);
    setArticleTypes((current) => {
      if (current.includes(key)) {
        const next = current.filter((t) => t !== key);
        return next;
      }
      if (current.includes(opt.value)) {
        const otherSameValue = articleTypeOptions.filter((o) => o.value === opt.value && o.label !== opt.label);
        const next = current.filter((t) => t !== opt.value).concat(otherSameValue.map((o) => articleTypeKey(o)));
        return next;
      }
      return [...current, key];
    });
  };

  const marquesAlphabetiques = useMemo(() => {
    const categoryKeys =
      categories.length > 0
        ? [...new Set(categories.flatMap((t) => CATEGORY_TO_BRAND_KEYS[t] ?? [t]))]
        : Object.keys(BRANDS_BY_CATEGORY);
    const list = [...new Set(categoryKeys.flatMap((k) => BRANDS_BY_CATEGORY[k] ?? []))];
    return [...list.filter((b) => b !== 'Autre').sort((a, b) => a.localeCompare(b, 'fr')), 'Autre'];
  }, [categories]);

  const marquesSuggestion = useMemo(() => {
    const firstType = categories.length > 0 ? categories[0] : 'sacs';
    const list = MARQUES_PLUS_CONNUES_PAR_TYPE[firstType] ?? MARQUES_PLUS_CONNUES_PAR_TYPE.sacs;
    const fromType = list.filter((b) => marquesAlphabetiques.includes(b));
    const max6 =
      fromType.length >= 6
        ? fromType.slice(0, 6)
        : [...fromType, ...marquesAlphabetiques.filter((b) => !fromType.includes(b))].slice(0, 6);
    const n = Math.min(max6.length, 6);
    const even = n % 2 === 0 ? n : n - 1;
    return max6.slice(0, Math.max(0, even));
  }, [categories, marquesAlphabetiques]);

  const categoriesKey = categories.join(',');
  const genreKey = genre.join(',');

  /** Au moins Femme ou Homme avant catégorie / type / marque. */
  const genreStepOk = genre.length >= 1;
  const categoryUnlocked = genreStepOk;
  const typeUnlocked = genreStepOk && categories.length >= 1;
  const needsArticleTypePick = articleTypeOptions.length > 0;
  const typeStepComplete = !needsArticleTypePick || articleTypes.length > 0;
  const brandUnlocked = typeUnlocked && typeStepComplete;

  useEffect(() => {
    if (genre.length === 0) {
      setCategories([]);
      setArticleTypes([]);
      setBrands([]);
      setOpenDropdown(null);
    }
  }, [genreKey]);

  useEffect(() => {
    if (!brandUnlocked) setBrands([]);
  }, [brandUnlocked]);

  useEffect(() => {
    setOpenDropdown((o) => {
      if (o === 'type' && !categoryUnlocked) return null;
      if (o === 'articleType' && !typeUnlocked) return null;
      if (o === 'marque' && !brandUnlocked) return null;
      return o;
    });
  }, [categoryUnlocked, typeUnlocked, brandUnlocked]);

  useEffect(() => {
    if (categories.length === 0) {
      setBrands([]);
      setArticleTypes([]);
      return;
    }
    const categoryKeys = [...new Set(categories.flatMap((t) => CATEGORY_TO_BRAND_KEYS[t] ?? [t]))];
    const validBrandSet = new Set(categoryKeys.flatMap((k) => BRANDS_BY_CATEGORY[k] ?? []));
    setBrands((b) => b.filter((x) => validBrandSet.has(x)));
    setArticleTypes([]);
  }, [categoriesKey]);

  const toggleCategory = (value: string) => {
    setCategories((prev) => (prev.includes(value) ? prev.filter((c) => c !== value) : [...prev, value]));
  };

  const toggleBrand = (brand: string) => {
    setBrands((current) => (current.includes(brand) ? current.filter((b) => b !== brand) : [...current, brand]));
  };

  const toggleGenre = (g: 'femme' | 'homme') => {
    setGenre((current) => {
      const next = current.includes(g) ? current.filter((x) => x !== g) : [...current, g];
      return next;
    });
  };

  useEffect(() => {
    if (!openDropdown) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      const insideOpen =
        (openDropdown === 'type' &&
          (typeTriggerRef.current?.contains(target) || typePanelRef.current?.contains(target))) ||
        (openDropdown === 'articleType' &&
          (articleTypeTriggerRef.current?.contains(target) || articleTypePanelRef.current?.contains(target))) ||
        (openDropdown === 'marque' &&
          (marqueTriggerRef.current?.contains(target) || marquePanelRef.current?.contains(target)));
      if (!insideOpen) setOpenDropdown(null);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [openDropdown]);

  const catalogueParams = useMemo(() => {
    const p = new URLSearchParams();
    genre.forEach((g) => p.append('genre', g));
    categories.forEach((c) => p.append('categories', c));
    articleTypes.forEach((t) => p.append('articleTypes', t));
    brands.forEach((b) => p.append('brands', b));
    return p;
  }, [genre, categories, articleTypes, brands]);

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(async () => {
      setLoadingCount(true);
      try {
        const res = await fetch(`/api/listings/count?${catalogueParams.toString()}`);
        const data = (await res.json()) as { count?: number };
        if (!cancelled) setCount(typeof data.count === 'number' ? data.count : 0);
      } catch {
        if (!cancelled) setCount(0);
      } finally {
        if (!cancelled) setLoadingCount(false);
      }
    }, 280);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [catalogueParams]);

  const countLabel =
    count === null || loadingCount ? '…' : count === 1 ? '1 annonce' : `${count} annonces`;

  const href = `/catalogue${catalogueParams.toString() ? `?${catalogueParams.toString()}` : ''}`;

  const typeDropdownOpen = openDropdown === 'type';
  const articleTypeDropdownOpen = openDropdown === 'articleType';
  const marqueDropdownOpen = openDropdown === 'marque';

  const filterSectionEnd: CSSProperties = { paddingBottom: 16 };

  return (
    <div
      style={{
        backgroundColor: '#fff',
        borderRadius: 18,
        boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
        border: '1px solid rgba(0,0,0,0.06)',
        padding: '20px 22px 22px',
        maxWidth: 400,
        width: '100%',
        position: 'relative',
      }}
    >
      <div
        style={{
          marginBottom: 12,
          fontSize: 14,
          fontWeight: 600,
          color: '#1d1d1f',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <Search size={18} strokeWidth={2} color="#1d1d1f" />
        <span>Recherche</span>
      </div>

      {/* Femme / Homme — même barre segmentée que le catalogue */}
      <div style={filterSectionEnd}>
        <div style={{ position: 'relative' }}>
          <div
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
              onClick={() => toggleGenre('femme')}
              style={{
                flex: 1,
                height: '100%',
                padding: '0 14px',
                fontSize: 14,
                fontWeight: 400,
                fontFamily: 'inherit',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: genre.includes('femme') ? '#1d1d1f' : '#fff',
                color: genre.includes('femme') ? '#fff' : '#1d1d1f',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              Femme
            </button>
            <button
              type="button"
              onClick={() => toggleGenre('homme')}
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
                backgroundColor: genre.includes('homme') ? '#1d1d1f' : '#fff',
                color: genre.includes('homme') ? '#fff' : '#1d1d1f',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              Homme
            </button>
          </div>
        </div>
      </div>

      {/* Catégorie — après genre */}
      <div style={filterSectionEnd}>
        <div style={{ position: 'relative' }}>
          <button
            ref={typeTriggerRef}
            type="button"
            onClick={() => {
              if (!categoryUnlocked) return;
              setOpenDropdown((prev) => (prev === 'type' ? null : 'type'));
            }}
            style={triggerStyle(!categoryUnlocked)}
          >
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              Catégorie
            </span>
            {categories.length > 0 && <span style={pillStyle}>{categories.length}</span>}
            <ChevronRight size={16} style={{ flexShrink: 0, color: categoryUnlocked ? '#86868b' : '#c7c7cc' }} />
          </button>
          {typeDropdownOpen && categoryUnlocked && (
            <div
              ref={typePanelRef}
              className="catalogue-filter-dropdown hero-hero-search-dropdown"
              style={dropdownPanelStyle}
            >
              <button
                type="button"
                onClick={() => {
                  setCategories(CATEGORIES.map((c) => c.value));
                  setArticleTypes([]);
                  setOpenDropdown(null);
                }}
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
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 32px' }}>
                  {CATEGORIES.map((type) => (
                    <label
                      key={type.value}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        cursor: 'pointer',
                        padding: '6px 4px',
                        borderRadius: 8,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={categories.includes(type.value)}
                        onChange={() => toggleCategory(type.value)}
                        style={{ width: 16, height: 16, accentColor: '#1d1d1f', flexShrink: 0 }}
                      />
                      <span style={{ fontSize: 14, color: '#1d1d1f' }}>{type.label}</span>
                    </label>
                  ))}
                </div>
                {categories.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setCategories([]);
                      setArticleTypes([]);
                      setBrands([]);
                      setOpenDropdown(null);
                    }}
                    style={{
                      marginTop: 2,
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
      </div>

      {/* Type de produit — toujours visible, après catégorie */}
      <div style={filterSectionEnd}>
        <div style={{ position: 'relative' }}>
          <button
            ref={articleTypeTriggerRef}
            type="button"
            onClick={() => {
              if (!typeUnlocked) return;
              setOpenDropdown((prev) => (prev === 'articleType' ? null : 'articleType'));
            }}
            style={triggerStyle(!typeUnlocked)}
          >
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              Type de produit
            </span>
            {articleTypes.length > 0 && <span style={pillStyle}>{articleTypes.length}</span>}
            <ChevronRight size={16} style={{ flexShrink: 0, color: typeUnlocked ? '#86868b' : '#c7c7cc' }} />
          </button>
          {articleTypeDropdownOpen && typeUnlocked && (
            <div
              ref={articleTypePanelRef}
              className="catalogue-filter-dropdown hero-hero-search-dropdown"
              style={typeMarquePanelStyle}
            >
              {articleTypeOptions.length > 0 ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setArticleTypes([]);
                      setOpenDropdown(null);
                    }}
                    style={typeMarqueMenuHeaderBtnStyle}
                  >
                    Tous les types
                  </button>
                  <div
                    style={{
                      overflowY: articleTypeOptions.length > 9 ? 'auto' : 'visible',
                      flex: articleTypeOptions.length > 9 ? 1 : undefined,
                      minHeight: articleTypeOptions.length > 9 ? 0 : undefined,
                      maxHeight: articleTypeOptions.length > 9 ? 248 : undefined,
                      padding: 8,
                      backgroundColor: '#fff',
                    }}
                  >
                    {articleTypeOptionsByCategory.map((group, groupIndex) => (
                    <div
                      key={group.categoryKey}
                      style={{ marginBottom: groupIndex < articleTypeOptionsByCategory.length - 1 ? 16 : 0 }}
                    >
                      {articleTypeOptionsByCategory.length > 1 && (
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: '#6e6e73',
                            marginBottom: 6,
                            paddingBottom: 4,
                            borderBottom: '1px solid #e8e6e3',
                          }}
                        >
                          {group.categoryLabel}
                        </div>
                      )}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {group.options.map((opt) => (
                          <label
                            key={articleTypeKey(opt)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              cursor: 'pointer',
                              padding: '6px 4px',
                              borderRadius: 8,
                            }}
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
                  {articleTypes.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setArticleTypes([]);
                        setOpenDropdown(null);
                      }}
                      style={{
                        marginTop: 2,
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
                </>
              ) : (
                <div style={{ padding: 10, fontSize: 13, color: '#6e6e73', lineHeight: 1.45 }}>
                  Pas de type de produit pour cette catégorie (ex. montres). Passez à la marque.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Marque — après type (ou directement si aucun type) */}
      <div style={filterSectionEnd}>
        <div style={{ position: 'relative' }}>
          <button
            ref={marqueTriggerRef}
            type="button"
            onClick={() => {
              if (!brandUnlocked) return;
              setOpenDropdown((prev) => (prev === 'marque' ? null : 'marque'));
            }}
            style={triggerStyle(!brandUnlocked)}
          >
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              Marque
            </span>
            {brands.length > 0 && <span style={pillStyle}>{brands.length}</span>}
            <ChevronRight size={16} style={{ flexShrink: 0, color: brandUnlocked ? '#86868b' : '#c7c7cc' }} />
          </button>
          {marqueDropdownOpen && brandUnlocked && (
            <div
              ref={marquePanelRef}
              className="catalogue-filter-dropdown hero-hero-search-dropdown"
              style={marqueSubmenuPanelStyle}
            >
              <button
                type="button"
                onClick={() => {
                  setBrands([]);
                  setMarqueSearchQuery('');
                  setOpenDropdown(null);
                }}
                style={typeMarqueMenuHeaderBtnStyle}
              >
                Toutes les marques
              </button>
              <div style={{ padding: '6px 10px 0 10px', flexShrink: 0 }}>
                <div style={{ position: 'relative' }}>
                  <Search
                    size={14}
                    style={{
                      position: 'absolute',
                      left: 9,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#86868b',
                    }}
                  />
                  <input
                    type="text"
                    value={marqueSearchQuery}
                    onChange={(e) => setMarqueSearchQuery(e.target.value)}
                    placeholder="Rechercher une marque..."
                    style={{
                      width: '100%',
                      height: 32,
                      paddingLeft: 30,
                      paddingRight: 8,
                      fontSize: 13,
                      border: '1px solid #d2d2d7',
                      borderRadius: 8,
                      backgroundColor: '#fff',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>
              <div
                style={{
                  overflowY: 'auto',
                  flex: 1,
                  minHeight: 0,
                  maxHeight: 236,
                  padding: 8,
                  backgroundColor: '#fff',
                }}
              >
                {marqueSearchQuery.trim() === '' && marquesSuggestion.length > 0 && (
                  <div style={{ paddingBottom: 6, marginBottom: 6 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 32px' }}>
                      {marquesSuggestion.map((brand) => (
                        <label key={brand} style={marqueRowLabelStyle}>
                          <input
                            type="checkbox"
                            checked={brands.includes(brand)}
                            onChange={() => toggleBrand(brand)}
                            style={{ width: 16, height: 16, accentColor: '#1d1d1f', flexShrink: 0 }}
                          />
                          <span style={marqueNameSpanStyle} title={brand}>
                            {brand}
                          </span>
                        </label>
                      ))}
                    </div>
                    <div style={{ marginLeft: 4, marginRight: 4, marginTop: 6, borderBottom: '1px solid #e8e6e3' }} />
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 32px' }}>
                  {marquesAlphabetiques
                    .filter((b) => normalizeForSearch(b).includes(normalizeForSearch(marqueSearchQuery.trim())))
                    .map((brand) => (
                      <label key={brand} style={marqueRowLabelStyle}>
                        <input
                          type="checkbox"
                          checked={brands.includes(brand)}
                          onChange={() => toggleBrand(brand)}
                          style={{ width: 16, height: 16, accentColor: '#1d1d1f', flexShrink: 0 }}
                        />
                        <span style={marqueNameSpanStyle} title={brand}>
                          {brand}
                        </span>
                      </label>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <Link
        href={href}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          minHeight: 48,
          padding: '0 20px',
          marginTop: 4,
          backgroundColor: '#1d1d1f',
          color: '#fff',
          fontSize: 15,
          fontWeight: 500,
          borderRadius: 980,
          textDecoration: 'none',
          transition: 'opacity 0.2s',
          boxSizing: 'border-box',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '0.9';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '1';
        }}
      >
        Rechercher ({countLabel})
      </Link>
    </div>
  );
}
