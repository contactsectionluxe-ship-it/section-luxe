'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { getFeaturedListings } from '@/lib/supabase/listings';
import { Listing } from '@/types';

const categories = [
  { name: 'Sacs', href: '/catalogue?category=sacs' },
  { name: 'Montres', href: '/catalogue?category=montres' },
  { name: 'Bijoux', href: '/catalogue?category=bijoux' },
  { name: 'Vêtements', href: '/catalogue?category=vetements' },
  { name: 'Chaussures', href: '/catalogue?category=chaussures' },
  { name: 'Accessoires', href: '/catalogue?category=accessoires' },
];

function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
  }).format(price);
}

export default function HomePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

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
            Trouvez la pièce de luxe qui vous correspond
          </h1>
          <p
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
                backgroundColor: 'transparent',
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
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              Devenir vendeur
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 36 }}>
            <h2
              style={{
                fontFamily: 'var(--font-playfair), Georgia, serif',
                fontSize: 28,
                fontWeight: 500,
                letterSpacing: '-0.02em',
                color: '#1d1d1f',
              }}
            >
              Catégories
            </h2>
            <Link
              href="/catalogue"
              className="hide-mobile"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, color: '#1d1d1f', fontWeight: 500 }}
            >
              Tout voir <ArrowRight size={14} strokeWidth={2} />
            </Link>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: 16,
            }}
          >
            {categories.map((cat) => (
              <Link
                key={cat.name}
                href={cat.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: 110,
                  backgroundColor: '#f5f5f7',
                  fontSize: 15,
                  fontWeight: 500,
                  color: '#1d1d1f',
                  borderRadius: 18,
                  transition: 'background-color 0.2s, transform 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#e8e8ed';
                  e.currentTarget.style.transform = 'scale(1.02)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#f5f5f7';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 36 }}>
            <div>
              <h2
                style={{
                  fontFamily: 'var(--font-playfair), Georgia, serif',
                  fontSize: 28,
                  fontWeight: 500,
                  letterSpacing: '-0.02em',
                  marginBottom: 8,
                  color: '#1d1d1f',
                }}
              >
                À la une
              </h2>
              <p style={{ fontSize: 15, color: '#6e6e73' }}>Notre sélection du moment</p>
            </div>
            <Link
              href="/catalogue"
              className="hide-mobile"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, color: '#1d1d1f', fontWeight: 500 }}
            >
              Voir tout <ArrowRight size={14} strokeWidth={2} />
            </Link>
          </div>

          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 24 }}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i}>
                  <div style={{ aspectRatio: '3/4', backgroundColor: '#f5f5f7', marginBottom: 16, borderRadius: 18 }} />
                  <div style={{ height: 16, backgroundColor: '#f5f5f7', width: '70%', marginBottom: 10, borderRadius: 8 }} />
                  <div style={{ height: 14, backgroundColor: '#f5f5f7', width: '40%', borderRadius: 8 }} />
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
                        aspectRatio: '3/4',
                        backgroundColor: '#f5f5f7',
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
