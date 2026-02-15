'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { MODELS_BY_CATEGORY_BRAND } from '@/lib/constants';

/** 6 marques les plus connues par catégorie (pour colonnes et sous-menus) */
const HEADER_TOP_BRANDS: Record<string, string[]> = {
  sacs: ['Hermès', 'Louis Vuitton', 'Chanel', 'Gucci', 'Prada', 'Dior'],
  montres: ['Rolex', 'Omega', 'Cartier', 'Patek Philippe', 'Audemars Piguet', 'Tag Heuer'],
  bijoux: ['Cartier', 'Van Cleef & Arpels', 'Bulgari', 'Tiffany', 'Chopard', 'Chaumet'],
  vetements: ['Chanel', 'Dior', 'Gucci', 'Louis Vuitton', 'Prada', 'Saint Laurent'],
  chaussures: ['Christian Louboutin', 'Gucci', 'Chanel', 'Prada', 'Saint Laurent', 'Dior'],
  accessoires: ['Louis Vuitton', 'Chanel', 'Gucci', 'Hermès', 'Prada', 'Dior'],
};

/** Marques les plus connues pour la colonne Femme du menu Nouveautés */
const NOUVEAUTES_BRANDS_FEMME = ['Hermès', 'Louis Vuitton', 'Chanel', 'Gucci', 'Prada', 'Dior', 'Saint Laurent'];
/** Marques les plus connues pour la colonne Homme du menu Nouveautés */
const NOUVEAUTES_BRANDS_HOMME = ['Rolex', 'Louis Vuitton', 'Hermès', 'Omega', 'Gucci', 'Cartier', 'Prada'];

/** 7 marques pour Femme/Homme par catégorie (on prend les 6 + 1 suivante de BRANDS si dispo) */
const HEADER_GENRE_BRANDS: Record<string, string[]> = {
  sacs: ['Hermès', 'Louis Vuitton', 'Chanel', 'Gucci', 'Prada', 'Dior', 'Saint Laurent'],
  montres: ['Rolex', 'Omega', 'Cartier', 'Patek Philippe', 'Audemars Piguet', 'Tag Heuer', 'Chanel'],
  bijoux: ['Cartier', 'Van Cleef & Arpels', 'Bulgari', 'Tiffany', 'Chopard', 'Chaumet', 'Hermès'],
  vetements: ['Chanel', 'Dior', 'Gucci', 'Louis Vuitton', 'Prada', 'Saint Laurent', 'Hermès'],
  chaussures: ['Christian Louboutin', 'Gucci', 'Chanel', 'Prada', 'Saint Laurent', 'Dior', 'Hermès'],
  accessoires: ['Louis Vuitton', 'Chanel', 'Gucci', 'Hermès', 'Prada', 'Dior', 'Saint Laurent'],
};

const CATEGORY_LABELS: Record<string, string> = {
  sacs: 'Sacs',
  montres: 'Montres',
  bijoux: 'Bijoux',
  vetements: 'Vêtements',
  chaussures: 'Chaussures',
  accessoires: 'Accessoires',
};

const CATEGORY_KEYS = ['sacs', 'montres', 'bijoux', 'vetements', 'chaussures', 'accessoires'] as const;

/** Pour les sacs, on enlève les tailles (ex. "Birkin 25" → "Birkin") et on déduplique. */
function normalizeModelName(model: string): string {
  return model.replace(/\s+\d{2,3}$/, '').trim() || model;
}

function getModels(category: string, brand: string): string[] {
  const byCat = MODELS_BY_CATEGORY_BRAND[category as keyof typeof MODELS_BY_CATEGORY_BRAND];
  if (!byCat) return [];
  const list = byCat[brand];
  if (!list) return [];
  const filtered = list.filter((m) => m !== 'Autre');
  if (category === 'sacs') {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const m of filtered) {
      const base = normalizeModelName(m);
      if (seen.has(base)) continue;
      seen.add(base);
      out.push(base);
      if (out.length >= 8) break;
    }
    return out;
  }
  return filtered.slice(0, 8);
}

const linkStyle = {
  fontSize: 14,
  fontWeight: 400,
  color: '#6e6e73',
  whiteSpace: 'nowrap' as const,
  transition: 'color 0.2s',
};
const linkHover = (e: React.MouseEvent<HTMLAnchorElement>, over: boolean) => {
  (e.currentTarget as HTMLAnchorElement).style.color = over ? '#1d1d1f' : '#6e6e73';
};

export function HeaderFilters() {
  const [openFilter, setOpenFilter] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleEnter = (id: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setOpenFilter(id);
  };

  const handleLeave = () => {
    timeoutRef.current = setTimeout(() => setOpenFilter(null), 150);
  };

  const dropdownStyle: React.CSSProperties = {
    position: 'fixed',
    top: 117,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 'min(calc(100vw - 48px), 1100px)',
    maxWidth: 1100,
    backgroundColor: '#fbfbfb',
    boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    zIndex: 99,
    maxHeight: 'calc(100vh - 140px)',
    overflowY: 'auto',
  };

  const innerStyle: React.CSSProperties = {
    padding: 24,
    backgroundColor: '#fbfbfb',
  };

  return (
    <>
      <div
        className="hide-mobile header-filters-bar"
        style={{
          borderTop: '1px solid rgba(0,0,0,0.06)',
          maxWidth: 1100,
          margin: '0 auto',
          padding: '0 24px',
          width: '100%',
          height: 44,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 28,
          flexWrap: 'nowrap',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {/* Nouveautés */}
        <div
          onMouseEnter={() => handleEnter('nouveautes')}
          onMouseLeave={handleLeave}
          style={{ position: 'relative' }}
        >
          <Link
            href="/catalogue"
            style={linkStyle}
            onMouseEnter={(e) => linkHover(e, true)}
            onMouseLeave={(e) => linkHover(e, false)}
          >
            Nouveautés
          </Link>
          {openFilter === 'nouveautes' && (
            <div style={dropdownStyle} onMouseEnter={() => handleEnter('nouveautes')} onMouseLeave={handleLeave}>
              <div style={{ ...innerStyle, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 40 }}>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#86868b', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Nouveautés</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <Link href="/catalogue" style={{ ...linkStyle, color: '#1d1d1f' }}>Dernières annonces</Link>
                    {CATEGORY_KEYS.map((cat) => (
                      <Link key={cat} href={`/catalogue?category=${cat}`} style={{ ...linkStyle, color: '#1d1d1f' }}>{CATEGORY_LABELS[cat]}</Link>
                    ))}
                  </div>
                </div>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#86868b', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Femme</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {NOUVEAUTES_BRANDS_FEMME.map((brand) => (
                      <Link key={brand} href={`/catalogue?genre=femme&brand=${encodeURIComponent(brand)}`} style={{ ...linkStyle, color: '#1d1d1f' }}>{brand}</Link>
                    ))}
                  </div>
                </div>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#86868b', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Homme</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {NOUVEAUTES_BRANDS_HOMME.map((brand) => (
                      <Link key={brand} href={`/catalogue?genre=homme&brand=${encodeURIComponent(brand)}`} style={{ ...linkStyle, color: '#1d1d1f' }}>{brand}</Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Femme */}
        <div onMouseEnter={() => handleEnter('femme')} onMouseLeave={handleLeave} style={{ position: 'relative' }}>
          <Link href="/catalogue?genre=femme" style={linkStyle} onMouseEnter={(e) => linkHover(e, true)} onMouseLeave={(e) => linkHover(e, false)}>Femme</Link>
          {openFilter === 'femme' && (
            <div style={dropdownStyle} onMouseEnter={() => handleEnter('femme')} onMouseLeave={handleLeave}>
              <div style={innerStyle}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 24 }}>
                  {CATEGORY_KEYS.map((cat) => (
                    <div key={cat}>
                      <Link href={`/catalogue?genre=femme&category=${cat}`} style={{ fontSize: 12, fontWeight: 600, color: '#86868b', marginBottom: 8, display: 'block', textTransform: 'uppercase', letterSpacing: 0.5 }}>{CATEGORY_LABELS[cat]}</Link>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {(HEADER_GENRE_BRANDS[cat] ?? []).slice(0, 7).map((brand) => (
                          <Link key={brand} href={`/catalogue?genre=femme&category=${cat}&brand=${encodeURIComponent(brand)}`} style={{ ...linkStyle, fontSize: 13, color: '#1d1d1f' }}>{brand}</Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Homme */}
        <div onMouseEnter={() => handleEnter('homme')} onMouseLeave={handleLeave} style={{ position: 'relative' }}>
          <Link href="/catalogue?genre=homme" style={linkStyle} onMouseEnter={(e) => linkHover(e, true)} onMouseLeave={(e) => linkHover(e, false)}>Homme</Link>
          {openFilter === 'homme' && (
            <div style={dropdownStyle} onMouseEnter={() => handleEnter('homme')} onMouseLeave={handleLeave}>
              <div style={innerStyle}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 24 }}>
                  {CATEGORY_KEYS.map((cat) => (
                    <div key={cat}>
                      <Link href={`/catalogue?genre=homme&category=${cat}`} style={{ fontSize: 12, fontWeight: 600, color: '#86868b', marginBottom: 8, display: 'block', textTransform: 'uppercase', letterSpacing: 0.5 }}>{CATEGORY_LABELS[cat]}</Link>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {(HEADER_GENRE_BRANDS[cat] ?? []).slice(0, 7).map((brand) => (
                          <Link key={brand} href={`/catalogue?genre=homme&category=${cat}&brand=${encodeURIComponent(brand)}`} style={{ ...linkStyle, fontSize: 13, color: '#1d1d1f' }}>{brand}</Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Catégories avec 6 colonnes (marque + modèles) */}
        {CATEGORY_KEYS.map((catKey) => {
          const brands = HEADER_TOP_BRANDS[catKey] ?? [];
          return (
            <div key={catKey} onMouseEnter={() => handleEnter(catKey)} onMouseLeave={handleLeave} style={{ position: 'relative' }}>
              <Link
                href={`/catalogue?category=${catKey}`}
                style={linkStyle}
                onMouseEnter={(e) => linkHover(e, true)}
                onMouseLeave={(e) => linkHover(e, false)}
              >
                {CATEGORY_LABELS[catKey]}
              </Link>
              {openFilter === catKey && (
                <div style={dropdownStyle} onMouseEnter={() => handleEnter(catKey)} onMouseLeave={handleLeave}>
                  <div style={innerStyle}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 24 }}>
                      {brands.map((brand) => {
                        const models = getModels(catKey, brand);
                        return (
                          <div key={brand}>
                            <Link
                              href={`/catalogue?category=${catKey}&brand=${encodeURIComponent(brand)}`}
                              style={{ fontSize: 12, fontWeight: 600, color: '#86868b', marginBottom: 8, display: 'block', textTransform: 'uppercase', letterSpacing: 0.5 }}
                            >
                              {brand}
                            </Link>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              {models.map((model) => (
                                <Link
                                  key={model}
                                  href={`/catalogue?category=${catKey}&brand=${encodeURIComponent(brand)}&model=${encodeURIComponent(model)}`}
                                  style={{ ...linkStyle, fontSize: 13, color: '#1d1d1f' }}
                                >
                                  {model}
                                </Link>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
