'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Package, Heart, Clock, CheckCircle, XCircle, AlertCircle, MessageCircle, Phone, Search, ChevronDown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getSellerListings } from '@/lib/supabase/listings';
import { getSellerConversationsCount } from '@/lib/supabase/messaging';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { Listing } from '@/types';
import { formatPrice, formatDate } from '@/lib/utils';
import { CATEGORIES } from '@/lib/utils';
import { ListingPhoto } from '@/components/ListingPhoto';

/** Normalise pour la recherche : minuscules, sans accents, sans tirets ni espaces (ex. "T-shirt" et "tshirt" matchent). */
function normalizeForSearch(s: string): string {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[-'\s]+/g, '');
}

const ANNONCES_SORT_OPTIONS = [
  { value: 'recent' as const, label: 'Plus récents' },
  { value: 'oldest' as const, label: 'Plus anciens' },
  { value: 'price_asc' as const, label: 'Prix croissant' },
  { value: 'price_desc' as const, label: 'Prix décroissant' },
];

export default function SellerDashboardPage() {
  const router = useRouter();
  const { user, seller, isSeller, isApprovedSeller, loading: authLoading, refreshUser } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [totalMessages, setTotalMessages] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  type SortOption = 'recent' | 'oldest' | 'price_asc' | 'price_desc';
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && (!user || !seller)) {
      router.push('/connexion');
    }
  }, [authLoading, user, seller, router]);

  // Synchronisation en temps réel du statut (validé/refusé) quand l'admin met à jour
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase || !user?.uid) return;
    const client = supabase;
    const channel = client
      .channel('seller-status')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'sellers', filter: `id=eq.${user.uid}` },
        () => {
          refreshUser();
        }
      )
      .subscribe();
    return () => {
      client.removeChannel(channel);
    };
  }, [user?.uid, refreshUser]);

  useEffect(() => {
    async function loadListings() {
      if (!user) return;
      try {
        const [sellerListings, count] = await Promise.all([
          getSellerListings(user.uid),
          getSellerConversationsCount(user.uid),
        ]);
        setListings(sellerListings);
        setTotalMessages(count);
      } catch (error) {
        console.error('Error loading listings:', error);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      loadListings();
    } else {
      setLoading(false);
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

  if (!authLoading && (!user || !seller)) return null;

  const totalLikes = listings.reduce((sum, l) => sum + l.likesCount, 0);
  const activeListings = listings.filter((l) => l.isActive).length;
  const totalAppels = listings.reduce((sum, l) => sum + (l.phoneRevealsCount ?? 0), 0);

  const q = normalizeForSearch(searchQuery.trim());
  const filteredBySearch = q
    ? listings.filter(
        (l) =>
          normalizeForSearch(l.title).includes(q) ||
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

  const showSkeletons = authLoading || loading;

  return (
    <div style={{ paddingTop: 'var(--header-height)', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '30px calc(20px + 1cm - 0.5mm) 60px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: 28, fontWeight: 500, marginBottom: 8 }}>
              Mes annonces
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {showSkeletons ? (
                <div className="catalogue-skeleton" style={{ width: 140, height: 18, borderRadius: 4 }} />
              ) : (
                <span style={{ fontSize: 14, color: '#666' }}>{seller?.companyName}</span>
              )}
              {!showSkeletons && seller?.status === 'approved' && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', backgroundColor: '#dcfce7', color: '#166534', fontSize: 12, fontWeight: 500, borderRadius: 8 }}>
                  <CheckCircle size={12} /> Validé
                </span>
              )}
              {!showSkeletons && seller?.status === 'pending' && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', backgroundColor: '#fef3c7', color: '#92400e', fontSize: 12, fontWeight: 500, borderRadius: 8 }}>
                  <Clock size={12} /> En attente
                </span>
              )}
              {!showSkeletons && seller?.status === 'rejected' && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', backgroundColor: '#fee2e2', color: '#991b1b', fontSize: 12, fontWeight: 500, borderRadius: 8 }}>
                  <XCircle size={12} /> Refusé
                </span>
              )}
            </div>
          </div>
          {!showSkeletons && isApprovedSeller && (
            <Link href="/vendeur/annonces/nouvelle" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 20px', backgroundColor: '#000', color: '#fff', fontSize: 14, fontWeight: 500, borderRadius: 12 }}>
              <Plus size={18} /> Déposer une annonce
            </Link>
          )}
        </div>

        {/* Status alerts */}
        {!showSkeletons && seller?.status === 'pending' && (
          <div style={{ padding: 20, backgroundColor: '#fef3c7', marginBottom: 32, display: 'flex', gap: 16 }}>
            <AlertCircle size={24} color="#92400e" style={{ flexShrink: 0 }} />
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: '#92400e', marginBottom: 4 }}>Demande en cours d'étude</h3>
              <p style={{ fontSize: 14, color: '#a16207' }}>
                Notre équipe examine vos documents. Vous ne pouvez pas encore publier d'annonces.
              </p>
            </div>
          </div>
        )}

        {!showSkeletons && seller?.status === 'rejected' && (
          <div style={{ padding: 20, backgroundColor: '#fee2e2', marginBottom: 32, display: 'flex', gap: 16 }}>
            <XCircle size={24} color="#991b1b" style={{ flexShrink: 0 }} />
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: '#991b1b', marginBottom: 4 }}>Demande refusée</h3>
              <p style={{ fontSize: 14, color: '#b91c1c' }}>
                Votre demande n'a pas été acceptée. Contactez-nous pour plus d'informations.
              </p>
            </div>
          </div>
        )}

        {/* Stats */}
        {(showSkeletons || isApprovedSeller) && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
            <div style={{ padding: 16, border: '1px solid #e8e6e3', borderRadius: 12, backgroundColor: '#fff', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, backgroundColor: showSkeletons ? 'transparent' : '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}>
                {showSkeletons ? <div className="catalogue-skeleton" style={{ width: 44, height: 44, borderRadius: 8 }} /> : <Package size={22} color="#666" />}
              </div>
              <div>
                <p style={{ fontSize: 11, color: '#888' }}>Annonces actives</p>
                <p style={{ fontSize: 22, fontWeight: 600 }}>{showSkeletons ? <span className="catalogue-skeleton" style={{ display: 'inline-block', width: 32, height: 22, borderRadius: 4, verticalAlign: 'middle' }} /> : activeListings}</p>
              </div>
            </div>
            <div style={{ padding: 16, border: '1px solid #e8e6e3', borderRadius: 12, backgroundColor: '#fff', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, backgroundColor: showSkeletons ? 'transparent' : '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}>
                {showSkeletons ? <div className="catalogue-skeleton" style={{ width: 44, height: 44, borderRadius: 8 }} /> : <Heart size={22} color="#666" />}
              </div>
              <div>
                <p style={{ fontSize: 11, color: '#888' }}>Total likes</p>
                <p style={{ fontSize: 22, fontWeight: 600 }}>{showSkeletons ? <span className="catalogue-skeleton" style={{ display: 'inline-block', width: 28, height: 22, borderRadius: 4, verticalAlign: 'middle' }} /> : totalLikes}</p>
              </div>
            </div>
            <div style={{ padding: 16, border: '1px solid #e8e6e3', borderRadius: 12, backgroundColor: '#fff', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, backgroundColor: showSkeletons ? 'transparent' : '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}>
                {showSkeletons ? <div className="catalogue-skeleton" style={{ width: 44, height: 44, borderRadius: 8 }} /> : <MessageCircle size={22} color="#666" />}
              </div>
              <div>
                <p style={{ fontSize: 11, color: '#888' }}>Total messages</p>
                <p style={{ fontSize: 22, fontWeight: 600 }}>{showSkeletons ? <span className="catalogue-skeleton" style={{ display: 'inline-block', width: 24, height: 22, borderRadius: 4, verticalAlign: 'middle' }} /> : totalMessages}</p>
              </div>
            </div>
            <div style={{ padding: 16, border: '1px solid #e8e6e3', borderRadius: 12, backgroundColor: '#fff', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, backgroundColor: showSkeletons ? 'transparent' : '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}>
                {showSkeletons ? <div className="catalogue-skeleton" style={{ width: 44, height: 44, borderRadius: 8 }} /> : <Phone size={22} color="#666" />}
              </div>
              <div>
                <p style={{ fontSize: 11, color: '#888' }}>Total appels</p>
                <p style={{ fontSize: 22, fontWeight: 600 }}>{showSkeletons ? <span className="catalogue-skeleton" style={{ display: 'inline-block', width: 20, height: 22, borderRadius: 4, verticalAlign: 'middle' }} /> : totalAppels}</p>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
              <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#86868b', pointerEvents: 'none' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher dans mes annonces..."
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
                  {ANNONCES_SORT_OPTIONS.find((o) => o.value === sortBy)?.label ?? 'Trier'}
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
                  {ANNONCES_SORT_OPTIONS.map((opt) => (
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

        {/* Listings */}
        <div>
          {showSkeletons ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
              {Array.from({ length: 8 }, (_, i) => (
                <div key={i} className="catalogue-skeleton-card" style={{ border: '1px solid #e8e6e3', borderRadius: 12, overflow: 'hidden', backgroundColor: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', ['--skeleton-index' as string]: i }}>
                  <div className="catalogue-skeleton" style={{ width: '100%', aspectRatio: '1', borderRadius: 0 }} />
                  <div style={{ padding: '16px 16px 12px', display: 'flex', flexDirection: 'column', gap: 8, minHeight: '88px' }}>
                    <div className="catalogue-skeleton" style={{ height: 20, width: '85%' }} />
                    <div className="catalogue-skeleton" style={{ height: 24, width: '45%' }} />
                    <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
                      <div className="catalogue-skeleton" style={{ height: 14, width: 48 }} />
                      <div className="catalogue-skeleton" style={{ height: 14, width: 72 }} />
                    </div>
                  </div>
                  <div style={{ padding: '0 16px 16px', display: 'flex', gap: 8 }}>
                    <div className="catalogue-skeleton" style={{ flex: 1, height: 36, borderRadius: 6 }} />
                    <div className="catalogue-skeleton" style={{ flex: 1, height: 36, borderRadius: 6 }} />
                  </div>
                </div>
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div style={{ padding: 60, border: '1px solid #eee', textAlign: 'center', borderRadius: 12 }}>
              <Package size={48} color="#ccc" style={{ margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>Aucune annonce</h3>
              <p style={{ fontSize: 14, color: '#888', marginBottom: 24 }}>Créez votre première annonce</p>
              {isApprovedSeller && (
                <Link href="/vendeur/annonces/nouvelle" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 20px', backgroundColor: '#000', color: '#fff', fontSize: 14, fontWeight: 500, borderRadius: 12 }}>
                  <Plus size={18} /> Déposer une annonce
                </Link>
              )}
            </div>
          ) : filteredListings.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
              {filteredListings.map((listing) => (
                <div key={listing.id} style={{ border: '1px solid #eee', borderRadius: 12, overflow: 'hidden', backgroundColor: '#fff', transition: 'box-shadow 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'; }} onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}>
                  <Link href={`/produit/${listing.id}?from=vendeur`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                    <div style={{ width: '100%', aspectRatio: '1', backgroundColor: '#f5f5f5', overflow: 'hidden', position: 'relative' }}>
                      <ListingPhoto src={listing.photos[0]} alt={listing.title} sizes="25vw" />
                      <span style={{ position: 'absolute', top: 8, right: 8, padding: '4px 10px', backgroundColor: listing.isActive ? '#dcfce7' : '#f5f5f5', color: listing.isActive ? '#166534' : '#666', fontSize: 11, fontWeight: 500, borderRadius: 4 }}>
                        {listing.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div style={{ padding: '16px 16px 12px' }}>
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          {(() => {
                            const lineText = listing.title || '';
                            return (
                              <h3 title={lineText} style={{ fontSize: 15, fontWeight: 500, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lineText}</h3>
                            );
                          })()}
                          <p style={{ fontSize: 18, fontWeight: 600, color: '#000' }}>{formatPrice(listing.price)}</p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, color: '#888' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Heart size={12} /> {listing.likesCount}</span>
                        <span>{formatDate(listing.createdAt)}</span>
                      </div>
                    </div>
                  </Link>
                  <div style={{ padding: '0 16px 16px', display: 'flex', gap: 8 }}>
                    {isApprovedSeller && (
                      <Link href={`/vendeur/annonces/${listing.id}`} style={{ flex: 1, padding: '8px 14px', border: '1px solid #ddd', fontSize: 13, textAlign: 'center', borderRadius: 6, color: '#1d1d1f' }}>
                        Modifier
                      </Link>
                    )}
                    <Link href={`/vendeur/annonces/${listing.id}/voir`} style={{ flex: 1, padding: '8px 14px', backgroundColor: '#000', color: '#fff', fontSize: 13, textAlign: 'center', borderRadius: 6 }}>
                      Détails
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: 60, border: '1px solid #eee', textAlign: 'center', borderRadius: 12 }}>
              <p style={{ fontSize: 15, color: '#6e6e73' }}>Aucun résultat pour « {searchQuery.trim()} »</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
