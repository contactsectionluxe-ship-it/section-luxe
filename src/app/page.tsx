'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { getFeaturedListings } from '@/lib/supabase/listings';
import { Listing } from '@/types';

const categories = [
  { name: 'Sac', href: '/catalogue?category=sacs', image: '/sac-categorie.png' },
  { name: 'Montre', href: '/catalogue?category=montres', image: '/montres-categorie.png' },
  { name: 'Bijou', href: '/catalogue?category=bijoux', image: '/bijoux-categorie.png' },
  { name: 'Vêtement', href: '/catalogue?category=vetements', image: '/vetements-categorie.png' },
  { name: 'Chaussure', href: '/catalogue?category=chaussures', image: '/chaussures-categorie.png' },
  { name: 'Accessoire', href: '/catalogue?category=accessoires', image: '/accessoires-categorie.png' },
];

function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
  }).format(price);
}

const CATEGORIES_VISIBLE = 4;
// 3 copies pour faire 3 tours avant de revenir au début
const extendedCategories = [...categories, ...categories, ...categories];
const categoryMaxIndex = Math.max(0, extendedCategories.length - CATEGORIES_VISIBLE);

export default function HomePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryIndex, setCategoryIndex] = useState(0);
  const [noTransition, setNoTransition] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await getFeaturedListings(8);
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
              fontSize: 17,
              color: '#6e6e73',
              maxWidth: 400,
              marginBottom: 40,
              lineHeight: 1.5,
            }}
          >
            Découvrez une sélection exclusive d'articles de luxe proposés par des professionnels certifiés.
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
              Découvrir
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
                if (categoryIndex === 0) {
                  setNoTransition(true);
                  setCategoryIndex(categoryMaxIndex);
                  requestAnimationFrame(() => requestAnimationFrame(() => setNoTransition(false)));
                } else {
                  setCategoryIndex((i) => i - 1);
                }
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
                opacity: categoryIndex === 0 ? 0 : 1,
                pointerEvents: categoryIndex === 0 ? 'none' : 'auto',
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
            <div style={{ overflow: 'hidden', width: '100%' }}>
              <div
                style={{
                  display: 'flex',
                  gap: 12,
                  transition: noTransition ? 'none' : 'transform 0.3s ease',
                  transform: `translateX(calc(-${categoryIndex} * ((100% - 36px) / ${CATEGORIES_VISIBLE} + 12px)))`,
                }}
              >
                {extendedCategories.map((cat, idx) => (
                  <Link
                    key={`${cat.name}-${idx}`}
                    href={cat.href}
                    style={{
                      flex: `0 0 calc((100% - ${12 * (CATEGORIES_VISIBLE - 1)}px) / ${CATEGORIES_VISIBLE})`,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'stretch',
                      gap: 10,
                      textDecoration: 'none',
                      color: '#1d1d1f',
                      transition: 'transform 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.02)';
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
                            objectFit: (cat.name === 'Sac' || cat.name === 'Bijou' || cat.name === 'Montre' || cat.name === 'Vêtement' || cat.name === 'Accessoire') ? 'contain' : 'cover',
                            ...(cat.name === 'Sac' && { transform: 'scale(0.95)', objectPosition: 'center center' }),
                            ...(cat.name === 'Bijou' && { transform: 'scale(0.92)', objectPosition: 'center center' }),
                            ...(cat.name === 'Montre' && { transform: 'scale(1.06)', objectPosition: 'center center' }),
                            ...(cat.name === 'Vêtement' && { transform: 'scale(0.97)', objectPosition: 'center center' }),
                            ...(cat.name === 'Accessoire' && { transform: 'scale(0.95)', objectPosition: 'center center' }),
                            ...(cat.name === 'Sac' && { transform: 'scale(1.06)', objectPosition: 'center center' }),
                          }}
                        />
                      ) : (
                        <span
                          style={{
                            fontSize: 15,
                            fontWeight: 500,
                          }}
                        >
                          {cat.name}
                        </span>
                      )}
                    </div>
                    <span
                      style={{
                        fontSize: 15,
                        fontWeight: 500,
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
                if (categoryIndex >= categoryMaxIndex) {
                  setNoTransition(true);
                  setCategoryIndex(0);
                  requestAnimationFrame(() => requestAnimationFrame(() => setNoTransition(false)));
                } else {
                  setCategoryIndex((i) => i + 1);
                }
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
              href="/catalogue"
              className="hide-mobile"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, color: '#1d1d1f', fontWeight: 500, flexShrink: 0 }}
            >
              Voir tout <ArrowRight size={14} strokeWidth={2} />
            </Link>
          </div>

          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 24 }}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i}>
                  <div style={{ aspectRatio: '1', backgroundColor: '#f1f1ea', marginBottom: 16, borderRadius: 18 }} />
                  <div style={{ height: 16, backgroundColor: '#f1f1ea', width: '70%', marginBottom: 10, borderRadius: 8 }} />
                  <div style={{ height: 14, backgroundColor: '#f1f1ea', width: '40%', borderRadius: 8 }} />
                </div>
              ))}
            </div>
          ) : listings.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 24 }}>
              {listings.map((listing) => (
                <Link key={listing.id} href={`/produit/${listing.id}`} style={{ display: 'block' }}>
                  <article>
                    <div
                      style={{
                        aspectRatio: '1',
                        background: 'radial-gradient(circle at center, #f8f8f3 0%, #f3f3ed 50%, #f1f1ea 100%)',
                        marginBottom: 16,
                        overflow: 'hidden',
                        borderRadius: 18,
                      }}
                    >
                      {listing.photos[0] && (
                        <img
                          src={listing.photos[0]}
                          alt={listing.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      )}
                    </div>
                    <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, color: '#86868b', marginBottom: 6 }}>
                      {listing.sellerName}
                    </p>
                    <h3 style={{ fontSize: 15, fontWeight: 500, marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#1d1d1f' }}>
                      {listing.title}
                    </h3>
                    <p style={{ fontSize: 16, fontWeight: 600, color: '#1d1d1f' }}>
                      {formatPrice(listing.price)}
                    </p>
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
      </section>

      {/* CTA */}
      <section
        style={{
          padding: '100px 24px',
          backgroundColor: '#1d1d1f',
        }}
      >
        <div style={{ maxWidth: 520, margin: '0 auto', textAlign: 'center' }}>
          <h2
            style={{
              fontFamily: 'var(--font-playfair), Georgia, serif',
              fontSize: 'clamp(24px, 4vw, 32px)',
              fontWeight: 500,
              color: '#fff',
              marginBottom: 16,
              letterSpacing: '-0.02em',
            }}
          >
            Vous êtes un professionnel du luxe ?
          </h2>
          <p style={{ fontSize: 16, color: '#a1a1a6', marginBottom: 32, lineHeight: 1.5 }}>
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
              backgroundColor: '#fff',
              color: '#1d1d1f',
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
