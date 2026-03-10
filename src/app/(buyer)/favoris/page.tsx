'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Heart, MapPin, Search, ChevronDown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getUserFavorites } from '@/lib/supabase/favorites';
import { removeFavorite } from '@/lib/supabase/favorites';
import { getListing } from '@/lib/supabase/listings';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { Listing } from '@/types';
import { CATEGORIES } from '@/lib/utils';
import { ListingCaracteristiques } from '@/components/ListingCaracteristiques';
import { ListingPhoto } from '@/components/ListingPhoto';

function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(price);
}

/** Normalise pour la recherche : minuscules, sans accents, sans tirets ni espaces (ex. "T-shirt" et "tshirt" matchent). */
function normalizeForSearch(s: string): string {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[-'\s]+/g, '');
}

const FAVORIS_SORT_OPTIONS = [
  { value: 'recent' as const, label: 'Plus récents' },
  { value: 'oldest' as const, label: 'Plus anciens' },
  { value: 'price_asc' as const, label: 'Prix croissant' },
  { value: 'price_desc' as const, label: 'Prix décroissant' },
];

export default function FavoritesPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingFavoriteId, setLoadingFavoriteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  type SortOption = 'recent' | 'oldest' | 'price_asc' | 'price_desc';
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/connexion');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    async function loadFavorites() {
      if (!user) return;

      try {
        const favorites = await getUserFavorites(user.uid);
        const ids = favorites.map((f) => f.listingId);

        const listingPromises = ids.map((id) => getListing(id));
        const listingsData = await Promise.all(listingPromises);

        let validListings = listingsData.filter((listing): listing is Listing => listing !== null);

        if (isSupabaseConfigured && supabase && validListings.length > 0) {
          const sellerIds = [...new Set(validListings.map((l) => l.sellerId))];
          const { data: sellersData } = await supabase.from('sellers').select('id, postcode').in('id', sellerIds);
          const postcodeBySeller: Record<string, string> = {};
          (sellersData || []).forEach((s: { id: string; postcode?: string }) => {
            if (s.postcode) postcodeBySeller[s.id] = s.postcode;
          });
          validListings = validListings.map((l) => ({ ...l, sellerPostcode: postcodeBySeller[l.sellerId] ?? null }));
        }

        validListings.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        setListings(validListings);
      } catch (error) {
        console.error('Error loading favorites:', error);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      loadFavorites();
    }
  }, [user]);

  useEffect(() => {
    if (!sortDropdownOpen) return;
    const onMouseDown = (e: MouseEvent) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(e.target as Node)) {
        setSortDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [sortDropdownOpen]);

  async function handleRemoveFavorite(e: React.MouseEvent, listingId: string) {
    e.preventDefault();
    e.stopPropagation();
    if (!user || loadingFavoriteId) return;
    setLoadingFavoriteId(listingId);
    try {
      await removeFavorite(user.uid, listingId);
      setListings((prev) => prev.filter((l) => l.id !== listingId));
    } catch (err) {
      console.error('Error removing favorite:', err);
    } finally {
      setLoadingFavoriteId(null);
    }
  }

  if (authLoading || loading) {
    return (
      <div style={{ paddingTop: 'var(--header-height)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#888' }}>Chargement...</p>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const q = normalizeForSearch(searchQuery.trim());
  const filteredBySearch = q
    ? listings.filter(
        (l) =>
          normalizeForSearch(l.title).includes(q) ||
          normalizeForSearch(l.sellerName).includes(q) ||
          (l.brand && normalizeForSearch(l.brand).includes(q)) ||
          (l.category && normalizeForSearch(CATEGORIES.find((c) => c.value === l.category)?.label ?? '').includes(q))
      )
    : listings;

  const filteredListings = [...filteredBySearch].sort((a, b) => {
    switch (sortBy) {
      case 'oldest':
        return a.createdAt.getTime() - b.createdAt.getTime();
      case 'price_asc':
        return a.price - b.price;
      case 'price_desc':
        return b.price - a.price;
      case 'recent':
      default:
        return b.createdAt.getTime() - a.createdAt.getTime();
    }
  });

  return (
    <div style={{ paddingTop: 'var(--header-height)', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '30px calc(20px + 1cm - 0.5mm) 60px' }}>
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: 28, fontWeight: 500, marginBottom: 8 }}>
            Mes favoris
          </h1>
          <p style={{ fontSize: 14, color: '#888' }}>
            {listings.length} {listings.length === 1 ? 'article en favori' : 'articles en favoris'}
          </p>
        </div>

        {listings.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
              <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#86868b', pointerEvents: 'none' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher dans mes favoris..."
                autoComplete="off"
                style={{
                  width: '100%',
                  height: 48,
                  padding: '0 16px 0 44px',
                  fontSize: 14,
                  border: '1px solid #d2d2d7',
                  borderRadius: 12,
                  backgroundColor: '#fff',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div ref={sortDropdownRef} style={{ position: 'relative', flexShrink: 0 }}>
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
                  {FAVORIS_SORT_OPTIONS.find((o) => o.value === sortBy)?.label ?? 'Trier'}
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
                  {FAVORIS_SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setSortBy(opt.value);
                        setSortDropdownOpen(false);
                      }}
                      style={{
                        display: 'block',
                        width: '100%',
                        padding: '10px 14px',
                        border: 'none',
                        background: sortBy === opt.value ? '#f5f5f7' : 'transparent',
                        fontSize: 14,
                        color: '#1d1d1f',
                        cursor: 'pointer',
                        textAlign: 'left',
                        outline: 'none',
                        boxShadow: 'none',
                        fontWeight: sortBy === opt.value ? 600 : 400,
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {filteredListings.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, minWidth: 0 }}>
            {filteredListings.map((listing) => {
              return (
                <Link key={listing.id} href={`/produit/${listing.id}`} style={{ textDecoration: 'none', color: 'inherit', minWidth: 0 }}>
                  <article
                    style={{
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'row',
                      backgroundColor: '#fff',
                      borderRadius: 8,
                      overflow: 'hidden',
                      border: '1px solid #e8e6e3',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                      minHeight: 56,
                      minWidth: 0,
                    }}
                  >
                    <button
                      type="button"
                      onClick={(e) => handleRemoveFavorite(e, listing.id)}
                      disabled={!!loadingFavoriteId}
                      aria-label="Retirer des favoris"
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
                        cursor: 'pointer',
                        padding: 0,
                        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                      }}
                    >
                      <Heart
                        size={18}
                        color="#1d1d1f"
                        fill="#1d1d1f"
                        strokeWidth={2}
                      />
                    </button>
                    <div
                      style={{
                        position: 'relative',
                        width: '28%',
                        minWidth: 64,
                        aspectRatio: '1',
                        backgroundColor: '#f5f5f7',
                        overflow: 'hidden',
                        flexShrink: 0,
                      }}
                    >
                      <ListingPhoto src={listing.photos[0]} alt={listing.title} sizes="120px" />
                    </div>
                    <div
                      style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        padding: '10px 48px 10px 14px',
                        minWidth: 0,
                        overflow: 'hidden',
                      }}
                    >
                      <div style={{ paddingBottom: 6, minWidth: 0, overflow: 'hidden' }}>
                        <h3
                          title={listing.title}
                          style={{
                            fontSize: 22,
                            fontWeight: 600,
                            color: '#1d1d1f',
                            margin: 0,
                            marginBottom: 5,
                            minWidth: 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            lineHeight: 1.4,
                          }}
                        >
                          {listing.title}
                        </h3>
                        <ListingCaracteristiques listing={listing} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                          <p style={{ fontSize: 24, fontWeight: 700, color: '#1d1d1f', margin: 0, lineHeight: 1.4 }}>
                            {formatPrice(listing.price)}
                          </p>
                        </div>
                      </div>
                      <div style={{ borderTop: '1px solid #e8e6e3', paddingTop: 8, marginTop: 8 }}>
                        <p title={listing.sellerName} style={{ fontSize: 16, fontWeight: 600, color: '#1d1d1f', margin: 0, lineHeight: 1.4, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {listing.sellerName}
                  </p>
                        {listing.sellerPostcode && (
                          <p style={{ fontSize: 15, color: '#6e6e73', margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: 4, lineHeight: 1.4 }}>
                            <MapPin size={15} /> {listing.sellerPostcode}
                          </p>
                        )}
                      </div>
                    </div>
                </article>
              </Link>
              );
            })}
          </div>
        ) : listings.length > 0 ? (
          <p style={{ textAlign: 'center', padding: 40, fontSize: 15, color: '#888' }}>Aucun résultat pour « {searchQuery.trim()} »</p>
        ) : (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{ width: 64, height: 64, backgroundColor: '#f5f5f5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <Heart size={28} color="#ccc" />
            </div>
            <h2 style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: 20, marginBottom: 8 }}>Aucun favori</h2>
            <p style={{ fontSize: 14, color: '#888', marginBottom: 24 }}>
              Explorez le catalogue et sauvegardez vos articles préférés
            </p>
            <Link href="/catalogue" style={{ display: 'inline-block', padding: '12px 24px', backgroundColor: '#000', color: '#fff', fontSize: 14, fontWeight: 500 }}>
              Accéder au catalogue
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
