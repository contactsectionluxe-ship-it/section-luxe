'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Heart, Tag, Calendar, CircleCheck, Palette, Layers, MapPin, Euro, Search } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getUserFavorites } from '@/lib/supabase/favorites';
import { removeFavorite } from '@/lib/supabase/favorites';
import { getListing } from '@/lib/supabase/listings';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { Listing } from '@/types';
import { getDealDefault } from '@/lib/deal';
import { CATEGORIES } from '@/lib/utils';
import { CONDITIONS, COLORS, MATERIALS } from '@/lib/constants';

const iconSize = 14;
const iconColor = '#6e6e73';

function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(price);
}

export default function FavoritesPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingFavoriteId, setLoadingFavoriteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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

  const q = searchQuery.trim().toLowerCase();
  const filteredListings = q
    ? listings.filter(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          l.sellerName.toLowerCase().includes(q) ||
          (l.brand && l.brand.toLowerCase().includes(q)) ||
          (l.category && CATEGORIES.find((c) => c.value === l.category)?.label.toLowerCase().includes(q))
      )
    : listings;

  return (
    <div style={{ paddingTop: 'var(--header-height)', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '30px 20px 60px' }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: 28, fontWeight: 500, marginBottom: 8 }}>
            Mes favoris
          </h1>
          <p style={{ fontSize: 14, color: '#888' }}>
            {listings.length} {listings.length === 1 ? 'article en favori' : 'articles en favoris'}
          </p>
        </div>

        {listings.length > 0 && (
          <div style={{ marginBottom: 20, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#86868b', pointerEvents: 'none' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher dans mes favoris..."
              autoComplete="off"
              style={{
                width: '100%',
                padding: '12px 16px 12px 44px',
                fontSize: 15,
                border: '1px solid #d2d2d7',
                borderRadius: 10,
                backgroundColor: '#fff',
                outline: 'none',
              }}
            />
          </div>
        )}

        {filteredListings.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            {filteredListings.map((listing) => {
              const deal = getDealDefault();
              return (
                <Link key={listing.id} href={`/produit/${listing.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
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
                        width: '28%',
                        minWidth: 64,
                        aspectRatio: '1',
                        backgroundColor: '#f5f5f7',
                        overflow: 'hidden',
                        flexShrink: 0,
                      }}
                    >
                      {listing.photos[0] ? (
                        <img
                          src={listing.photos[0]}
                          alt={listing.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc', fontSize: 9 }}>
                          Photo
                        </div>
                      )}
                    </div>
                    <div
                      style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        padding: '10px 10px 10px 14px',
                        minWidth: 0,
                      }}
                    >
                      <div style={{ paddingBottom: 6 }}>
                        <h3
                          style={{
                            fontSize: 22,
                            fontWeight: 600,
                            color: '#1d1d1f',
                            margin: 0,
                            marginBottom: 5,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            lineHeight: 1.4,
                          }}
                        >
                          {listing.title}
                        </h3>
                        {(listing.category || listing.year != null || listing.condition || listing.color || listing.material) && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '11px 15px', marginBottom: 6, fontSize: 13, color: '#6e6e73', lineHeight: 1.35 }}>
                            {listing.category && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                <Tag size={iconSize} color={iconColor} style={{ flexShrink: 0 }} />
                                {CATEGORIES.find((c) => c.value === listing.category)?.label ?? listing.category}
                              </span>
                            )}
                            {listing.year != null && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                <Calendar size={iconSize} color={iconColor} style={{ flexShrink: 0 }} />
                                {listing.year}
                              </span>
                            )}
                            {listing.condition && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                <CircleCheck size={iconSize} color={iconColor} style={{ flexShrink: 0 }} />
                                {CONDITIONS.find((c) => c.value === listing.condition)?.label ?? listing.condition}
                              </span>
                            )}
                            {listing.color && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                <Palette size={iconSize} color={iconColor} style={{ flexShrink: 0 }} />
                                {COLORS.find((c) => c.value === listing.color)?.label ?? listing.color}
                              </span>
                            )}
                            {listing.material && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                <Layers size={iconSize} color={iconColor} style={{ flexShrink: 0 }} />
                                {MATERIALS.find((m) => m.value === listing.material)?.label ?? listing.material}
                              </span>
                    )}
                  </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                          <p style={{ fontSize: 24, fontWeight: 700, color: '#1d1d1f', margin: 0, lineHeight: 1.4 }}>
                            {formatPrice(listing.price)}
                          </p>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 3,
                              padding: '3px 6px',
                              marginLeft: 4,
                              backgroundColor: '#fff',
                              border: `1px solid ${deal.color}`,
                              borderRadius: 4,
                              fontSize: 10,
                              fontWeight: 500,
                              color: deal.color,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            <span style={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: deal.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Euro size={8} color="#fff" strokeWidth={2.5} />
                            </span>
                            {deal.label}
                          </span>
                        </div>
                      </div>
                      <div style={{ borderTop: '1px solid #e8e6e3', paddingTop: 8, marginTop: 8 }}>
                        <p style={{ fontSize: 16, fontWeight: 600, color: '#1d1d1f', margin: 0, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
              Découvrir le catalogue
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
