'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search, SlidersHorizontal, X, ChevronDown, Heart } from 'lucide-react';
import { SearchFilters as Filters, defaultFilters } from '@/types/filters';
import { getListings } from '@/lib/supabase/listings';
import { Listing } from '@/types';
import {
  ARTICLE_TYPES,
  LUXURY_BRANDS,
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
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div style={{ borderBottom: '1px solid #eee' }}>
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
          fontSize: 13,
          fontWeight: 600,
          color: '#1a1a1a',
          cursor: 'pointer',
        }}
      >
        {title}
        <ChevronDown
          size={16}
          style={{
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
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
    if (category) initial.category = category;
    return initial;
  });

  // États locaux pour les inputs de prix (évite le re-render à chaque frappe)
  const [localPriceMin, setLocalPriceMin] = useState('');
  const [localPriceMax, setLocalPriceMax] = useState('');

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Applique les filtres de prix manuellement
  const applyPriceFilter = () => {
    setFilters(prev => ({
      ...prev,
      priceMin: localPriceMin ? Number(localPriceMin) : undefined,
      priceMax: localPriceMax ? Number(localPriceMax) : undefined,
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

      const data = await getListings({ category: filters.category, sortBy });

      let filtered = data;
      if (filters.priceMin) filtered = filtered.filter((l) => l.price >= filters.priceMin!);
      if (filters.priceMax) filtered = filtered.filter((l) => l.price <= filters.priceMax!);
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

  const updateFilter = (key: keyof Filters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value || undefined }));
  };

  const handleReset = () => {
    setFilters(defaultFilters);
    setSearchQuery('');
    setLocalPriceMin('');
    setLocalPriceMax('');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters((prev) => ({ ...prev, query: searchQuery }));
  };

  // Filters sidebar content - utiliser une variable JSX au lieu d'une fonction
  const filtersContent = (
    <>
      {/* Type */}
      <FilterSection title="Type d'article" defaultOpen>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {ARTICLE_TYPES.map((type) => (
            <label
              key={type.value}
              style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
            >
              <input
                type="radio"
                name="category"
                checked={filters.category === type.value}
                onChange={() => updateFilter('category', type.value)}
                style={{ width: 16, height: 16, accentColor: '#1a1a1a' }}
              />
              <span style={{ fontSize: 13, color: '#444' }}>{type.label}</span>
            </label>
          ))}
          {filters.category && (
            <button
              onClick={() => updateFilter('category', undefined)}
              style={{
                marginTop: 4,
                fontSize: 12,
                color: '#888',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                padding: 0,
              }}
            >
              Voir tout
            </button>
          )}
        </div>
      </FilterSection>

      {/* Marque */}
      <FilterSection title="Marque" defaultOpen>
        <select
          value={filters.brand || ''}
          onChange={(e) => updateFilter('brand', e.target.value)}
          style={{
            width: '100%',
            height: 40,
            padding: '0 12px',
            fontSize: 13,
            border: '1px solid #ddd',
            backgroundColor: '#fff',
          }}
        >
          <option value="">Toutes les marques</option>
          {LUXURY_BRANDS.map((brand) => (
            <option key={brand} value={brand}>
              {brand}
            </option>
          ))}
        </select>
      </FilterSection>

      {/* État */}
      <FilterSection title="État">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {CONDITIONS.map((c) => (
            <label key={c.value} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="radio"
                name="condition"
                checked={filters.condition === c.value}
                onChange={() => updateFilter('condition', c.value)}
                style={{ width: 16, height: 16, accentColor: '#1a1a1a' }}
              />
              <span style={{ fontSize: 13, color: '#444' }}>{c.label}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Couleur */}
      <FilterSection title="Couleur">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {COLORS.map((color) => (
            <button
              key={color.value}
              onClick={() => updateFilter('color', filters.color === color.value ? undefined : color.value)}
              style={{
                padding: '6px 12px',
                fontSize: 12,
                border: filters.color === color.value ? '1px solid #1a1a1a' : '1px solid #ddd',
                backgroundColor: filters.color === color.value ? '#1a1a1a' : '#fff',
                color: filters.color === color.value ? '#fff' : '#444',
                cursor: 'pointer',
              }}
            >
              {color.label}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Matériaux */}
      <FilterSection title="Matériaux">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {MATERIALS.slice(0, 8).map((m) => (
            <button
              key={m.value}
              onClick={() => updateFilter('material', filters.material === m.value ? undefined : m.value)}
              style={{
                padding: '6px 12px',
                fontSize: 12,
                border: filters.material === m.value ? '1px solid #1a1a1a' : '1px solid #ddd',
                backgroundColor: filters.material === m.value ? '#1a1a1a' : '#fff',
                color: filters.material === m.value ? '#fff' : '#444',
                cursor: 'pointer',
              }}
            >
              {m.label}
            </button>
          ))}
        </div>
      </FilterSection>
    </>
  );

  // Composant séparé pour les inputs de prix (évite la perte de focus)
  const priceInputs = (
    <div style={{ borderBottom: '1px solid #eee', paddingBottom: 16 }}>
      <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Prix</p>
      <input
        type="text"
        inputMode="numeric"
        value={localPriceMin}
        onChange={(e) => setLocalPriceMin(e.target.value.replace(/\D/g, ''))}
        placeholder="Prix min (€)"
        style={{
          display: 'block',
          width: '100%',
          height: 40,
          padding: '0 12px',
          fontSize: 13,
          border: '1px solid #ddd',
          marginBottom: 8,
        }}
      />
      <input
        type="text"
        inputMode="numeric"
        value={localPriceMax}
        onChange={(e) => setLocalPriceMax(e.target.value.replace(/\D/g, ''))}
        placeholder="Prix max (€)"
        style={{
          display: 'block',
          width: '100%',
          height: 40,
          padding: '0 12px',
          fontSize: 13,
          border: '1px solid #ddd',
          marginBottom: 10,
        }}
      />
      <button
        type="button"
        onClick={applyPriceFilter}
        style={{
          width: '100%',
          height: 36,
          backgroundColor: '#1a1a1a',
          color: '#fff',
          fontSize: 12,
          fontWeight: 500,
          border: 'none',
          cursor: 'pointer',
        }}
      >
        Appliquer
      </button>
    </div>
  );

  return (
    <div style={{ paddingTop: 72, minHeight: '100vh', backgroundColor: '#fbfbfb' }}>
      {/* Search Bar - collée sous le header */}
      <div style={{ borderBottom: '1px solid rgba(0,0,0,0.06)', backgroundColor: '#fbfbfb' }}>
        <div className="catalogue-search-inner" style={{ maxWidth: 1100, margin: '0 auto', padding: '12px 24px' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#86868b' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un article, une marque..."
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
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px' }}>
        <div style={{ display: 'flex', gap: 40, paddingTop: 30, paddingBottom: 60 }}>
          {/* Sidebar - Desktop */}
          <aside
            className="hide-mobile"
            style={{ width: 260, flexShrink: 0 }}
          >
            <div style={{ position: 'sticky', top: 100 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 20,
                }}
              >
                <h2 style={{ fontSize: 16, fontWeight: 600 }}>Filtres</h2>
                <button
                  onClick={handleReset}
                  style={{
                    fontSize: 12,
                    color: '#888',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Réinitialiser
                </button>
              </div>
              {priceInputs}
              {filtersContent}
            </div>
          </aside>

          {/* Main */}
          <main style={{ flex: 1, minWidth: 0 }}>
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 24,
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <div>
                <h1
                  style={{
                    fontFamily: 'var(--font-playfair), Georgia, serif',
                    fontSize: 24,
                    fontWeight: 500,
                    marginBottom: 4,
                  }}
                >
                  {filters.category
                    ? filters.category.charAt(0).toUpperCase() + filters.category.slice(1)
                    : 'Tous les articles'}
                </h1>
                <p style={{ fontSize: 13, color: '#888' }}>
                  {listings.length} résultat{listings.length !== 1 ? 's' : ''}
                </p>
              </div>

              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                {/* Mobile filter button */}
                <button
                  onClick={() => setMobileFiltersOpen(true)}
                  className="hide-desktop"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    height: 40,
                    padding: '0 14px',
                    border: '1px solid #ddd',
                    backgroundColor: '#fff',
                    fontSize: 13,
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
                      padding: '0 32px 0 12px',
                      border: '1px solid #ddd',
                      backgroundColor: '#fff',
                      fontSize: 13,
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
                      right: 10,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      pointerEvents: 'none',
                      color: '#888',
                    }}
                  />
                </div>
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
              <div style={{ textAlign: 'center', padding: '80px 24px', backgroundColor: '#fbfbfb', borderRadius: 18 }}>
                <p style={{ fontSize: 17, marginBottom: 8, color: '#1d1d1f' }}>Aucun résultat</p>
                <p style={{ fontSize: 14, color: '#6e6e73', marginBottom: 24 }}>
                  Essayez de modifier vos critères
                </p>
                <button
                  onClick={handleReset}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#1d1d1f',
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: 500,
                    border: 'none',
                    borderRadius: 980,
                    cursor: 'pointer',
                  }}
                >
                  Réinitialiser
                </button>
              </div>
            )}
          </main>
        </div>
      </div>

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
                padding: '16px 20px',
                borderBottom: '1px solid #eee',
                position: 'sticky',
                top: 0,
                backgroundColor: '#fff',
                zIndex: 10,
              }}
            >
              <h2 style={{ fontSize: 16, fontWeight: 600 }}>Filtres</h2>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                style={{ padding: 8, background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <X size={22} />
              </button>
            </div>
            <div style={{ padding: '0 20px 100px' }}>
              {priceInputs}
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
                borderTop: '1px solid #eee',
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
                  borderRadius: 980,
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
