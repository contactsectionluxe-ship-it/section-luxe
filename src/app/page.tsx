'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { getFeaturedListings } from '@/lib/supabase/listings';
import { Listing } from '@/types';
import { ListingCaracteristiques } from '@/components/ListingCaracteristiques';
import { ListingPhoto } from '@/components/ListingPhoto';

const categories = [
  { name: 'Sacs', href: '/catalogue?category=sacs', image: '/sac-categorie.png' },
  { name: 'Montres', href: '/catalogue?category=montres', image: '/montres-categorie.png' },
  { name: 'Bijoux', href: '/catalogue?category=bijoux', image: '/bijoux-categorie.png' },
  { name: 'Vêtements', href: '/catalogue?category=vetements', image: '/vetements-categorie.png' },
  { name: 'Chaussures', href: '/catalogue?category=chaussures', image: '/chaussures-categorie.png' },
  { name: 'Accessoires', href: '/catalogue?category=accessoires', image: '/accessoires-categorie.png' },
];

function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
}

const CATEGORIES_VISIBLE = 4;
const CATEGORY_GAP = 12;

export default function HomePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const categoriesScrollRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const dragStartScrollLeft = useRef(0);
  const hasDragged = useRef(false);
  const [scrollState, setScrollState] = useState<'start' | 'middle' | 'end'>('start');

  const updateScrollState = useCallback(() => {
    const el = categoriesScrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const max = scrollWidth - clientWidth;
    if (max <= 0) setScrollState('start');
    else if (scrollLeft >= max - 2) setScrollState('end');
    else if (scrollLeft <= 2) setScrollState('start');
    else setScrollState('middle');
  }, []);

  useEffect(() => {
    const el = categoriesScrollRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener('scroll', updateScrollState);
    return () => el.removeEventListener('scroll', updateScrollState);
  }, [updateScrollState]);

  useEffect(() => {
    async function load() {
      try {
        const data = await getFeaturedListings(12);
        setListings(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div>
      {/* Hero - fond dès le haut, texte sous le logo */}
      <section
        className="hero-section"
        style={{
          position: 'relative',
          paddingTop: 'calc(var(--header-height) + 48px + 1cm)',
          paddingBottom: 100,
          paddingLeft: 24,
          paddingRight: 24,
          backgroundImage: 'url(/banniere-hero.png)',
          backgroundSize: '55%',
          backgroundPosition: '100% center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to right, #ffffff 0%, #ffffff 45%, rgba(255,255,255,0.85) 55%, transparent 75%)',
            pointerEvents: 'none',
          }}
        />
        <div style={{ position: 'relative', maxWidth: 1100, margin: '0 auto' }}>
          <h1
            style={{
              fontFamily: 'var(--font-playfair), Georgia, serif',
              fontSize: 'clamp(32px, 5vw, 56px)',
              fontWeight: 500,
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              marginBottom: 24,
              maxWidth: 520,
              color: '#1d1d1f',
            }}
          >
            <span className="hide-mobile">Trouvez la pièce de luxe qui vous correspond</span>
            <span className="hide-desktop">Trouvez la pièce<br />de luxe qui vous<br />correspond</span>
          </h1>
          <p
            className="hero-sous-titre"
            style={{
              fontSize: 16,
              color: '#6e6e73',
              maxWidth: 400,
              marginBottom: 24,
              lineHeight: 1.5,
            }}
          >
            Une vision claire du marché professionnel.
            <br />
            Comparez, analysez, choisissez
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
            <Link
              href="/catalogue"
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
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9'; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
            >
              Accéder au catalogue
              <ArrowRight size={18} strokeWidth={2} />
            </Link>
            <Link
              href="/inscription-vendeur"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: 50,
                padding: '0 28px',
                backgroundColor: '#fff',
                color: '#1d1d1f',
                fontSize: 15,
                fontWeight: 500,
                border: '1.5px solid #d2d2d7',
                borderRadius: 980,
                transition: 'background-color 0.2s, color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f5f5f7';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#fff';
              }}
            >
              Devenir vendeur
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section style={{ padding: '80px 24px', overflow: 'visible' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', overflow: 'visible' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 36 }}>
            <div>
              <h2
                style={{
                  fontFamily: 'var(--font-playfair), Georgia, serif',
                  fontSize: 28,
                  fontWeight: 500,
                  letterSpacing: '-0.02em',
                  margin: 0,
                  marginBottom: 4,
                  color: '#1d1d1f',
                }}
              >
                Catégories
              </h2>
              <p style={{ fontSize: 15, color: '#6e6e73', margin: 0 }}>Rechercher par catégorie</p>
            </div>
            <Link
              href="/catalogue"
              className="hide-mobile"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, color: '#1d1d1f', fontWeight: 500, flexShrink: 0 }}
            >
              Tout voir <ArrowRight size={14} strokeWidth={2} />
            </Link>
          </div>
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              aria-label="Catégories précédentes"
              onClick={() => {
                const el = categoriesScrollRef.current;
                if (el) el.scrollBy({ left: -el.clientWidth, behavior: 'smooth' });
              }}
              style={{
                position: 'absolute',
                left: -18,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 36,
                height: 36,
                borderRadius: '50%',
                border: '1px solid #e8e8ed',
                background: 'rgba(255,255,255,0.9)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#8e8e93',
                cursor: 'pointer',
                transition: 'background 0.2s, color 0.2s, border-color 0.2s, opacity 0.25s',
                zIndex: 1,
                opacity: scrollState === 'start' ? 0 : 1,
                pointerEvents: scrollState === 'start' ? 'none' : 'auto',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f5f5f7';
                e.currentTarget.style.color = '#1d1d1f';
                e.currentTarget.style.borderColor = '#d2d2d7';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.9)';
                e.currentTarget.style.color = '#8e8e93';
                e.currentTarget.style.borderColor = '#e8e8ed';
              }}
            >
              <ChevronLeft size={20} strokeWidth={2} />
            </button>
            <div
              ref={categoriesScrollRef}
              role="region"
              aria-label="Catégories"
              onPointerDown={(e) => {
                if (e.button !== 0) return;
                hasDragged.current = false;
                dragStartX.current = e.clientX;
                dragStartScrollLeft.current = categoriesScrollRef.current?.scrollLeft ?? 0;
                isDraggingRef.current = true;
                setIsDragging(true);
                (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
              }}
              onPointerMove={(e) => {
                if (!isDraggingRef.current || !categoriesScrollRef.current) return;
                const dx = e.clientX - dragStartX.current;
                if (Math.abs(dx) > 5) hasDragged.current = true;
                categoriesScrollRef.current.scrollLeft = dragStartScrollLeft.current - dx;
              }}
              onPointerUp={(e) => {
                if (e.button !== 0) return;
                isDraggingRef.current = false;
                setIsDragging(false);
                (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
              }}
              onPointerLeave={(e) => {
                if (isDraggingRef.current) {
                  isDraggingRef.current = false;
                  setIsDragging(false);
                  (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
                }
              }}
              style={{
                overflowX: 'auto',
                overflowY: 'hidden',
                width: '100%',
                cursor: isDragging ? 'grabbing' : 'grab',
                userSelect: isDragging ? 'none' : 'auto',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch',
                containerType: 'inline-size',
              }}
              className="categories-scroll categories-scroll-container"
            >
              <div
                style={{
                  display: 'flex',
                  gap: CATEGORY_GAP,
                  padding: '4px 0',
                  width: 'calc(150cqw + 6px)',
                }}
              >
                {categories.map((cat) => (
                  <Link
                    key={cat.name}
                    href={cat.href}
                    onClick={(e) => {
                      if (hasDragged.current) e.preventDefault();
                    }}
                    style={{
                      flex: `0 0 calc((100cqw - ${(CATEGORIES_VISIBLE - 1) * CATEGORY_GAP}px) / ${CATEGORIES_VISIBLE})`,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'stretch',
                      gap: 10,
                      textDecoration: 'none',
                      color: '#1d1d1f',
                      transition: 'transform 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      if (!isDragging) e.currentTarget.style.transform = 'scale(1.02)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <div
                      style={{
                        aspectRatio: '1',
                        borderRadius: 18,
                        overflow: 'hidden',
                        backgroundColor: '#f6f6f8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {cat.image ? (
                        <img
                          src={cat.image}
                          alt={cat.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: (cat.name === 'Sacs' || cat.name === 'Bijoux' || cat.name === 'Montres' || cat.name === 'Vêtements' || cat.name === 'Accessoires') ? 'contain' : 'cover',
                            ...(cat.name === 'Sacs' && { transform: 'scale(0.95)', objectPosition: 'center center' }),
                            ...(cat.name === 'Bijoux' && { transform: 'scale(0.92)', objectPosition: 'center center' }),
                            ...(cat.name === 'Montres' && { transform: 'scale(1.06)', objectPosition: 'center center' }),
                            ...(cat.name === 'Vêtements' && { transform: 'scale(0.97)', objectPosition: 'center center' }),
                            ...(cat.name === 'Accessoires' && { transform: 'scale(0.95)', objectPosition: 'center center' }),
                            ...(cat.name === 'Sacs' && { transform: 'scale(1.06)', objectPosition: 'center center' }),
                          }}
                        />
                      ) : (
                        <span
                          style={{
                            fontFamily: 'var(--font-playfair), Georgia, serif',
                            fontSize: 17,
                            fontWeight: 500,
                            letterSpacing: '-0.02em',
                            color: '#1d1d1f',
                          }}
                        >
                          {cat.name}
                        </span>
                      )}
                    </div>
                    <span
                      style={{
                        fontSize: 15,
                        color: '#6e6e73',
                        textAlign: 'center',
                        lineHeight: 1.2,
                      }}
                    >
                      {cat.name}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
            <button
              type="button"
              aria-label="Catégories suivantes"
              onClick={() => {
                const el = categoriesScrollRef.current;
                if (el) el.scrollBy({ left: el.clientWidth, behavior: 'smooth' });
              }}
              style={{
                position: 'absolute',
                right: -18,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 36,
                height: 36,
                borderRadius: '50%',
                border: '1px solid #e8e8ed',
                background: 'rgba(255,255,255,0.9)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#8e8e93',
                cursor: 'pointer',
                transition: 'background 0.2s, color 0.2s, border-color 0.2s',
                zIndex: 1,
                opacity: scrollState === 'end' ? 0 : 1,
                pointerEvents: scrollState === 'end' ? 'none' : 'auto',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f5f5f7';
                e.currentTarget.style.color = '#1d1d1f';
                e.currentTarget.style.borderColor = '#d2d2d7';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.9)';
                e.currentTarget.style.color = '#8e8e93';
                e.currentTarget.style.borderColor = '#e8e8ed';
              }}
            >
              <ChevronRight size={20} strokeWidth={2} />
            </button>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 36 }}>
            <div>
              <h2
                style={{
                  fontFamily: 'var(--font-playfair), Georgia, serif',
                  fontSize: 28,
                  fontWeight: 500,
                  letterSpacing: '-0.02em',
                  margin: 0,
                  marginBottom: 4,
                  color: '#1d1d1f',
                }}
              >
                À la une
              </h2>
              <p style={{ fontSize: 15, color: '#6e6e73', margin: 0 }}>Notre sélection du moment</p>
            </div>
            <Link
              href="/catalogue?sortBy=likes"
              className="hide-mobile"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, color: '#1d1d1f', fontWeight: 500, flexShrink: 0 }}
            >
              Voir tout <ArrowRight size={14} strokeWidth={2} />
            </Link>
          </div>

          {/* Grille avec hauteur min pour éviter le saut du footer au refresh */}
          <div style={{ minHeight: 920 }}>
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 24 }}>
              {Array.from({ length: 12 }, (_, i) => (
                <div
                  key={i}
                  className="catalogue-skeleton-card"
                  style={{
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: '#fff',
                    borderRadius: 12,
                    border: '1px solid #e8e6e3',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                    overflow: 'hidden',
                    minWidth: 0,
                    ['--skeleton-index' as string]: i,
                  }}
                >
                  <div
                    className="catalogue-skeleton"
                    style={{
                      position: 'relative',
                      width: '100%',
                      aspectRatio: '1',
                      borderRadius: 0,
                      flexShrink: 0,
                    }}
                  />
                  <div
                    style={{
                      borderTop: '1px solid #e8e6e3',
                      padding: '14px 14px 10px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                      minWidth: 0,
                      minHeight: 118,
                    }}
                  >
                    <p style={{ margin: 0, marginBottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, height: 12 }}>
                      <span className="catalogue-skeleton" style={{ display: 'block', height: 12, width: '50%', borderRadius: 4 }} />
                      <span className="catalogue-skeleton" style={{ display: 'block', height: 12, width: 60, flexShrink: 0, borderRadius: 4 }} />
                    </p>
                    <div className="catalogue-skeleton" style={{ height: 16, width: '92%', borderRadius: 4 }} />
                    <div style={{ display: 'flex', gap: '11px 15px', flexWrap: 'wrap', marginBottom: 6 }}>
                      <div className="catalogue-skeleton" style={{ height: 13, width: 60, borderRadius: 4 }} />
                      <div className="catalogue-skeleton" style={{ height: 13, width: 70, borderRadius: 4 }} />
                      <div className="catalogue-skeleton" style={{ height: 13, width: 55, borderRadius: 4 }} />
                    </div>
                    <div style={{ marginTop: -5, minHeight: 24, display: 'flex', alignItems: 'center' }}>
                      <div className="catalogue-skeleton" style={{ height: 18, width: '38%', borderRadius: 4 }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : listings.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 24 }}>
              {listings.map((listing, i) => (
                <Link key={listing.id} href={`/produit/${listing.id}`} style={{ display: 'block', textDecoration: 'none', color: 'inherit', minWidth: 0 }}>
                  <article
                    style={{
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      backgroundColor: '#fff',
                      borderRadius: 12,
                      border: '1px solid #e8e6e3',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                      overflow: 'hidden',
                      minWidth: 0,
                    }}
                  >
                    <div
                      style={{
                        position: 'relative',
                        width: '100%',
                        aspectRatio: '1',
                        background: 'radial-gradient(circle at center, #f8f8f3 0%, #f3f3ed 50%, #f1f1ea 100%)',
                        overflow: 'hidden',
                      }}
                    >
                      <ListingPhoto src={listing.photos[0]} alt={listing.title} priority={i < 6} sizes="(max-width: 640px) 50vw, 25vw" />
                    </div>
                    <div style={{ borderTop: '1px solid #e8e6e3', padding: '14px 14px 10px', display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, color: '#86868b', margin: 0, marginBottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                        <span>{listing.sellerName}</span>
                        {listing.sellerPostcode && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 12, lineHeight: 1, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, color: '#86868b' }}>
                            <MapPin size={14} strokeWidth={2} style={{ flexShrink: 0 }} />
                            {listing.sellerPostcode}
                          </span>
                        )}
                      </p>
                      {(() => {
                        const lineText = listing.title || '';
                        return (
                          <h3 title={lineText} style={{ fontSize: 16, fontWeight: 500, color: '#1d1d1f', margin: 0, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}>
                            {lineText}
                          </h3>
                        );
                      })()}
                      <ListingCaracteristiques listing={listing} variant="grid" className="catalogue-listing-caracteristiques" />
                      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: -5, minHeight: 24 }}>
                        <span style={{ fontSize: 17, fontWeight: 600, color: '#1d1d1f', lineHeight: 1.3 }}>{formatPrice(listing.price)}</span>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '80px 24px', backgroundColor: '#fbfbfb', borderRadius: 22 }}>
              <p style={{ color: '#6e6e73', marginBottom: 24, fontSize: 16 }}>Aucun article disponible pour le moment.</p>
              <Link
                href="/inscription-vendeur"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: 50,
                  padding: '0 28px',
                  backgroundColor: '#fff',
                  border: '1.5px solid #d2d2d7',
                  fontSize: 15,
                  fontWeight: 500,
                  borderRadius: 980,
                  color: '#1d1d1f',
                }}
              >
                Devenir vendeur
              </Link>
            </div>
          )}
          </div>
        </div>
      </section>

      {/* CTA — fond marbre */}
      <section
        style={{
          position: 'relative',
          marginTop: -24,
          padding: '120px 24px 88px',
          backgroundImage: 'url(/section-vendeur-bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center 82%',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.6) 45%, transparent 75%)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse 72% 42% at 50% 50%, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.5) 55%, rgba(255,255,255,0.15) 85%, transparent 100%)',
            pointerEvents: 'none',
          }}
        />
        <div style={{ position: 'relative', maxWidth: 520, margin: '0 auto', textAlign: 'center' }}>
          <h2
            style={{
              fontFamily: 'var(--font-playfair), Georgia, serif',
              fontSize: 'clamp(24px, 4vw, 32px)',
              fontWeight: 500,
              color: '#1d1d1f',
              marginBottom: 16,
              letterSpacing: '-0.02em',
            }}
          >
            Vous êtes un vendeur professionnel ?
          </h2>
          <p style={{ fontSize: 16, color: '#6e6e73', marginBottom: 32, lineHeight: 1.5 }}>
            Rejoignez notre réseau de vendeurs partenaires et donnez de la visibilité à vos articles.
          </p>
          <Link
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
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
          >
            Devenir partenaire
            <ArrowRight size={18} strokeWidth={2} />
          </Link>
        </div>
      </section>
    </div>
  );
}
