'use client';

import { Suspense, useEffect, useLayoutEffect, useState, useRef, useCallback } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { getFeaturedListings } from '@/lib/supabase/listings';
import { listingAnnoncePath } from '@/lib/listingPaths';
import {
  setAnnonceReturnUrlForNextNavigation,
  peekCatalogueScrollRestore,
  consumeCatalogueScrollRestore,
} from '@/lib/annonceReturnUrl';
import { Listing } from '@/types';
import { ListingCaracteristiques } from '@/components/ListingCaracteristiques';
import { ListingPhoto } from '@/components/ListingPhoto';
import { SellerVerifiedSubscriptionBadge } from '@/components/SellerVerifiedSubscriptionBadge';
import { FluidOneLineHeading } from '@/components/FluidOneLineHeading';
import { HeroNumberedSteps } from '@/components/HeroNumberedSteps';

const categories = [
  { name: 'Sacs', href: '/catalogue?category=sacs', image: '/sac-categorie.png' },
  { name: 'Vêtements', href: '/catalogue?category=vetements', image: '/vetements-categorie.png' },
  { name: 'Chaussures', href: '/catalogue?category=chaussures', image: '/chaussures-categorie.png' },
  { name: 'Accessoires', href: '/catalogue?category=accessoires', image: '/accessoires-categorie.png' },
  { name: 'Bijoux', href: '/catalogue?category=bijoux', image: '/bijoux-categorie.png' },
  { name: 'Montres', href: '/catalogue?category=montres', image: '/montres-categorie.png' },
];

function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(Number(price)));
}

/** Cartes « À la une » : alignées sur `connexion-form-box`. */
const CONNEXION_FORM_CARD_SHADOW = '0 4px 24px rgba(0,0,0,0.06)';
const CONNEXION_FORM_CARD_RADIUS = 18;

const CATEGORIES_VISIBLE = 4;
// Même gap que la grille « À la une » (24px) pour des vignettes de même largeur.
const CATEGORY_GAP = 24;
const CATEGORY_SCROLL_INNER_WIDTH = 'calc(150cqw + 12px)';

function HomePageInner() {
  const pathname = usePathname() ?? '';
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();
  const homeReturnHref = pathname + (searchParamsString ? `?${searchParamsString}` : '') || '/';

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const categoriesScrollRef = useRef<HTMLDivElement>(null);

  /** Retour depuis une annonce : restaurer le scroll comme sur le catalogue (même mécanisme sessionStorage). */
  const homeRestoreScrollYRef = useRef<number | null>(null);
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
    const currentHref = homeReturnHref;
    const pending = peekCatalogueScrollRestore(currentHref);
    homeRestoreScrollYRef.current = pending;
    if (typeof window === 'undefined') return;
    if (pending != null) return;
    try {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
      if (nav?.type === 'reload') {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      }
    } catch {
      /* ignore */
    }
  }, [homeReturnHref]);

  useEffect(() => {
    if (loading) return;
    const currentHref = homeReturnHref;
    if (homeRestoreScrollYRef.current == null) return;
    homeRestoreScrollYRef.current = null;
    const y = consumeCatalogueScrollRestore(currentHref);
    if (y == null) return;

    const applyY = (behavior: ScrollBehavior) => {
      const maxY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      const target = Math.min(y, maxY);
      window.scrollTo({ top: target, left: 0, behavior });
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
  }, [loading, homeReturnHref]);
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
    if (typeof window !== 'undefined' && window.innerWidth <= 767 && max > 0 && scrollLeft > max) {
      el.scrollLeft = max;
      setScrollState('end');
      return;
    }
    if (max <= 0) setScrollState('start');
    else if (scrollLeft <= 2) setScrollState('start');
    else if (
      scrollLeft >= max - 2 ||
      (typeof window !== 'undefined' && window.innerWidth <= 767 && scrollLeft >= max - Math.max(20, clientWidth * 0.15))
    ) setScrollState('end');
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
          paddingTop: 'calc(var(--header-height) + 68px + 1cm)',
          paddingBottom: 128,
          paddingLeft: 24,
          paddingRight: 24,
          backgroundColor: '#ffffff',
          overflow: 'hidden',
        }}
      >
        <div
          className="hero-section-backdrop"
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 0,
            pointerEvents: 'none',
          }}
        >
          <div
            className="hero-bg-image-wrap"
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              bottom: 0,
              width: '76%',
              zIndex: 0,
              overflow: 'hidden',
            }}
          >
            <div className="hero-bg-image-inner" style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
              <Image
                src="/banniere-hero.png"
                alt=""
                fill
                priority
                quality={100}
                sizes="(max-width: 767px) 100vw, (max-width: 1599px) 85vw, (max-width: 1999px) 92vw, 96vw"
                style={{
                  objectFit: 'contain',
                  objectPosition: 'right center',
                  transform: 'scale(1.12)',
                  transformOrigin: 'right center',
                }}
              />
            </div>
          </div>
          <div className="hero-backdrop-gradient" style={{ position: 'absolute', inset: 0, zIndex: 1 }} />
        </div>
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 1100, margin: '0 auto' }}>
          <h1
            style={{
              fontFamily: 'var(--font-playfair), Georgia, serif',
              fontSize: 'clamp(32px, 5vw, 56px)',
              fontWeight: 500,
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              marginTop: '0.5cm',
              marginBottom: 24,
              maxWidth: 520,
              color: '#1d1d1f',
            }}
          >
            <span className="hide-mobile">L’excellence du luxe, à portée de main</span>
            <span className="hide-desktop">L’excellence du luxe,<br />à portée de main</span>
          </h1>
          <p className="hero-sous-titre">
            Explorez les offres de professionnels près de chez vous.
          </p>
          <HeroNumberedSteps />
          <div className="hero-buttons" style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: '0.5cm' }}>
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
              <span className="hero-catalogue-label-desktop">Accéder au catalogue</span>
              <span className="hero-catalogue-label-mobile">Voir le catalogue</span>
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
      <section className="home-section-padded home-section-categories" style={{ padding: '80px 24px 0', overflow: 'visible' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', overflow: 'visible' }}>
          <div className="home-categories-section-head" style={{ marginBottom: 16 }}>
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
            <div
              className="home-categories-sub-row"
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, minWidth: 0 }}
            >
              <p style={{ fontSize: 15, color: '#6e6e73', margin: 0, minWidth: 0, flex: '1 1 auto' }}>Rechercher par catégorie</p>
              <Link
                href="/catalogue"
                className="home-categories-voir-tout"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#1d1d1f', fontWeight: 500, flexShrink: 0 }}
              >
                Tout voir <ArrowRight size={14} strokeWidth={2} />
              </Link>
            </div>
          </div>
          <div className="categories-scroll-wrap" style={{ position: 'relative' }} data-scroll-state={scrollState}>
            <div className="categories-scroll-viewport">
            <div
              ref={categoriesScrollRef}
              role="region"
              aria-label="Catégories"
              onPointerDown={(e) => {
                if (e.button !== 0) return;
                if ((e.target as HTMLElement).closest?.('.category-item-card-link')) return;
                const el = categoriesScrollRef.current;
                if (!el) return;
                e.preventDefault();
                hasDragged.current = false;
                dragStartX.current = e.clientX;
                dragStartScrollLeft.current = el.scrollLeft;
                isDraggingRef.current = true;
                setIsDragging(true);
                el.setPointerCapture?.(e.pointerId);
              }}
              onPointerMove={(e) => {
                if (!isDraggingRef.current || !categoriesScrollRef.current) return;
                const dx = e.clientX - dragStartX.current;
                if (Math.abs(dx) > 10) hasDragged.current = true;
                categoriesScrollRef.current.scrollLeft = dragStartScrollLeft.current - dx;
              }}
              onPointerUp={(e) => {
                if (e.button !== 0) return;
                isDraggingRef.current = false;
                setIsDragging(false);
                hasDragged.current = false;
                try {
                  categoriesScrollRef.current?.releasePointerCapture(e.pointerId);
                } catch {
                  /* déjà relâché */
                }
              }}
              onPointerCancel={() => {
                isDraggingRef.current = false;
                setIsDragging(false);
                hasDragged.current = false;
              }}
              style={{
                overflowX: 'auto',
                overflowY: 'hidden',
                width: '100%',
                cursor: isDragging ? 'grabbing' : 'grab',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch',
                containerType: 'inline-size',
              }}
              className="categories-scroll categories-scroll-container"
              data-dragging={isDragging ? 'true' : 'false'}
            >
              <div
                className="categories-scroll-inner"
                style={{
                  display: 'flex',
                  gap: CATEGORY_GAP,
                  /* Pas de padding horizontal = aligné sur la grille « À la une » */
                  padding: '14px 0',
                  width: CATEGORY_SCROLL_INNER_WIDTH,
                }}
              >
                {categories.map((cat) => (
                  <div
                    key={cat.name}
                    className="categories-scroll-item"
                    style={{
                      flex: `0 0 calc((100cqw - ${(CATEGORIES_VISIBLE - 1) * CATEGORY_GAP}px) / ${CATEGORIES_VISIBLE})`,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'stretch',
                      gap: 10,
                      minWidth: 0,
                    }}
                  >
                    <Link
                      href={cat.href}
                      prefetch={true}
                      className="category-item-card-link"
                      aria-label={cat.name}
                      style={{
                        display: 'block',
                        textDecoration: 'none',
                        color: 'inherit',
                        cursor: 'pointer',
                        touchAction: 'manipulation',
                        minWidth: 0,
                      }}
                      onClick={(e) => {
                        if (hasDragged.current) e.preventDefault();
                      }}
                    >
                      <article
                        style={{
                          position: 'relative',
                          display: 'flex',
                          flexDirection: 'column',
                          backgroundColor: '#f6f6f8',
                          borderRadius: CONNEXION_FORM_CARD_RADIUS,
                          overflow: 'hidden',
                          minWidth: 0,
                        }}
                      >
                        <div
                          style={{
                            position: 'relative',
                            width: '100%',
                            aspectRatio: '1',
                            backgroundColor: '#f6f6f8',
                            overflow: 'hidden',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {cat.image ? (
                            <img
                              src={cat.image}
                              alt=""
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
                          ) : null}
                        </div>
                      </article>
                    </Link>
                    <p
                      className="category-item-label"
                      title={cat.name}
                      style={{
                        margin: 0,
                        fontSize: 12,
                        fontWeight: 400,
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                        color: '#86868b',
                        textAlign: 'center',
                        lineHeight: 1,
                        minWidth: 0,
                        width: '100%',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {cat.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <button
              type="button"
              aria-label="Catégories précédentes"
              onClick={() => {
                const el = categoriesScrollRef.current;
                if (!el) return;
                const pageW = el.clientWidth;
                const pageIndex = Math.round(el.scrollLeft / pageW);
                const target = Math.max((pageIndex - 1) * pageW, 0);
                el.scrollTo({ left: target, behavior: 'smooth' });
              }}
              style={{
                position: 'absolute',
                borderRadius: '50%',
                border: '1px solid #e8e8ed',
                background: 'rgba(255,255,255,0.9)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#8e8e93',
                cursor: 'pointer',
                transition: 'background 0.2s, color 0.2s, border-color 0.2s, opacity 0.25s',
                zIndex: 2,
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
            <button
              type="button"
              aria-label="Catégories suivantes"
              onClick={() => {
                const el = categoriesScrollRef.current;
                if (!el) return;
                const pageW = el.clientWidth;
                const maxScroll = el.scrollWidth - pageW;
                const pageIndex = Math.round(el.scrollLeft / pageW);
                const target = Math.min((pageIndex + 1) * pageW, maxScroll);
                el.scrollTo({ left: target, behavior: 'smooth' });
              }}
              style={{
                position: 'absolute',
                borderRadius: '50%',
                border: '1px solid #e8e8ed',
                background: 'rgba(255,255,255,0.9)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#8e8e93',
                cursor: 'pointer',
                transition: 'background 0.2s, color 0.2s, border-color 0.2s',
                zIndex: 2,
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
        </div>
      </section>

      {/* Featured Products */}
      <section className="home-section-padded home-section-featured" style={{ padding: '80px 24px 104px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className="home-featured-section-head" style={{ marginBottom: 36 }}>
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
            <div
              className="home-featured-sub-row"
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, minWidth: 0 }}
            >
              <p style={{ fontSize: 15, color: '#6e6e73', margin: 0, minWidth: 0, flex: '1 1 auto' }}>Notre sélection du moment</p>
              <Link
                href="/catalogue?sortBy=likes"
                className="home-featured-voir-tout"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#1d1d1f', fontWeight: 500, flexShrink: 0 }}
              >
                Voir tout <ArrowRight size={14} strokeWidth={2} />
              </Link>
            </div>
          </div>

          {/* Grille avec hauteur min pour éviter le saut du footer au refresh */}
          <div style={{ minHeight: 920 }}>
          {loading ? (
            <div className="home-featured-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 24 }}>
              {Array.from({ length: 12 }, (_, i) => (
                <div
                  key={i}
                  className="catalogue-skeleton-card"
                  style={{
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: '#fff',
                    borderRadius: CONNEXION_FORM_CARD_RADIUS,
                    boxShadow: CONNEXION_FORM_CARD_SHADOW,
                    overflow: 'hidden',
                    minWidth: 0,
                    ['--skeleton-index' as string]: i,
                  }}
                >
                  <div
                    style={{
                      position: 'relative',
                      width: '100%',
                      aspectRatio: '1',
                      flexShrink: 0,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      className="catalogue-skeleton"
                      style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: 0,
                      }}
                    />
                    <div className="listing-card-photo-fade" aria-hidden />
                  </div>
                  <div
                    style={{
                      padding: '14px 14px 10px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                      minWidth: 0,
                      minHeight: 118,
                      backgroundColor: '#fff',
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
            <div className="home-featured-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 24 }}>
              {listings.map((listing, i) => (
                <Link
                  key={listing.id}
                  href={listingAnnoncePath(listing)}
                  onClick={() => setAnnonceReturnUrlForNextNavigation(homeReturnHref)}
                  style={{ display: 'block', textDecoration: 'none', color: 'inherit', minWidth: 0 }}
                >
                  <article
                    style={{
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      backgroundColor: '#fff',
                      borderRadius: CONNEXION_FORM_CARD_RADIUS,
                      boxShadow: CONNEXION_FORM_CARD_SHADOW,
                      overflow: 'hidden',
                      minWidth: 0,
                    }}
                  >
                    <div
                      style={{
                        position: 'relative',
                        width: '100%',
                        aspectRatio: '1',
                        backgroundColor: '#fff',
                        overflow: 'hidden',
                      }}
                    >
                      <ListingPhoto src={listing.photos[0]} alt={listing.title} priority={i < 6} sizes="(max-width: 640px) 50vw, 25vw" />
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
                          <h3
                            className="listing-grid-title"
                            title={lineText}
                            style={{
                              fontSize: 16,
                              fontWeight: 500,
                              color: '#1d1d1f',
                              margin: 0,
                              minWidth: 0,
                              overflow: 'hidden',
                              lineHeight: 1.3,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                            }}
                          >
                            {lineText}
                          </h3>
                        );
                      })()}
                      <ListingCaracteristiques listing={listing} variant="homeFeatured" className="catalogue-listing-caracteristiques" />
                      <div className="listing-grid-price" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: -5, minHeight: 24 }}>
                        <span style={{ fontSize: 18, fontWeight: 600, color: '#1d1d1f', lineHeight: 1.3 }}>{formatPrice(listing.price)}</span>
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

      {/* CTA vendeur — fond gris */}
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
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: '100vh', paddingTop: 'var(--header-height)', backgroundColor: '#fff' }} aria-hidden />
      }
    >
      <HomePageInner />
    </Suspense>
  );
}
