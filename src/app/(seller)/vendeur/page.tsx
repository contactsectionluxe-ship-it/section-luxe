'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Package, Heart, Clock, CheckCircle, XCircle, AlertCircle, MessageCircle, Phone } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getSellerListings } from '@/lib/supabase/listings';
import { getSellerConversationsCount } from '@/lib/supabase/messaging';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { Listing } from '@/types';
import { formatPrice, formatDate } from '@/lib/utils';

export default function SellerDashboardPage() {
  const router = useRouter();
  const { user, seller, isSeller, isApprovedSeller, loading: authLoading, refreshUser } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [totalMessages, setTotalMessages] = useState<number>(0);
  const [loading, setLoading] = useState(true);

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

  if (authLoading || loading) {
    return (
      <div style={{ paddingTop: 'var(--header-height)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#888' }}>Chargement...</p>
      </div>
    );
  }

  if (!user || !seller) return null;

  const totalLikes = listings.reduce((sum, l) => sum + l.likesCount, 0);
  const activeListings = listings.filter((l) => l.isActive).length;
  const totalAppels = listings.reduce((sum, l) => sum + (l.phoneRevealsCount ?? 0), 0);

  return (
    <div style={{ paddingTop: 'var(--header-height)', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', paddingTop: 38, paddingRight: 20, paddingBottom: 60, paddingLeft: 20 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: 28, fontWeight: 500, marginBottom: 8 }}>
              Mes annonces
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 14, color: '#666' }}>{seller?.companyName}</span>
              {seller?.status === 'approved' && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', backgroundColor: '#dcfce7', color: '#166534', fontSize: 12, fontWeight: 500 }}>
                  <CheckCircle size={12} /> Validé
                </span>
              )}
              {seller?.status === 'pending' && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', backgroundColor: '#fef3c7', color: '#92400e', fontSize: 12, fontWeight: 500 }}>
                  <Clock size={12} /> En attente
                </span>
              )}
              {seller?.status === 'rejected' && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', backgroundColor: '#fee2e2', color: '#991b1b', fontSize: 12, fontWeight: 500 }}>
                  <XCircle size={12} /> Refusé
                </span>
              )}
            </div>
          </div>
          {isApprovedSeller && (
            <Link href="/vendeur/annonces/nouvelle" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 20px', backgroundColor: '#000', color: '#fff', fontSize: 14, fontWeight: 500, borderRadius: 12 }}>
              <Plus size={18} /> Déposer une annonce
            </Link>
          )}
        </div>

        {/* Status alerts */}
        {seller?.status === 'pending' && (
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

        {seller?.status === 'rejected' && (
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
        {isApprovedSeller && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 40 }}>
            <div style={{ padding: 16, border: '1px solid #eee', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, backgroundColor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}>
                <Package size={22} color="#666" />
              </div>
              <div>
                <p style={{ fontSize: 11, color: '#888' }}>Annonces actives</p>
                <p style={{ fontSize: 22, fontWeight: 600 }}>{activeListings}</p>
              </div>
            </div>
            <div style={{ padding: 16, border: '1px solid #eee', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, backgroundColor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}>
                <Heart size={22} color="#666" />
              </div>
              <div>
                <p style={{ fontSize: 11, color: '#888' }}>Total likes</p>
                <p style={{ fontSize: 22, fontWeight: 600 }}>{totalLikes}</p>
              </div>
            </div>
            <div style={{ padding: 16, border: '1px solid #eee', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, backgroundColor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}>
                <MessageCircle size={22} color="#666" />
              </div>
              <div>
                <p style={{ fontSize: 11, color: '#888' }}>Total messages</p>
                <p style={{ fontSize: 22, fontWeight: 600 }}>{totalMessages}</p>
              </div>
            </div>
            <div style={{ padding: 16, border: '1px solid #eee', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, backgroundColor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}>
                <Phone size={22} color="#666" />
              </div>
              <div>
                <p style={{ fontSize: 11, color: '#888' }}>Total appels</p>
                <p style={{ fontSize: 22, fontWeight: 600 }}>{totalAppels}</p>
              </div>
            </div>
          </div>
        )}

        {/* Listings */}
        <div>
          {listings.length === 0 ? (
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
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
              {listings.map((listing) => (
                <div key={listing.id} style={{ border: '1px solid #eee', borderRadius: 12, overflow: 'hidden', backgroundColor: '#fff', transition: 'box-shadow 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'; }} onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}>
                  <Link href={`/vendeur/annonces/${listing.id}/voir`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                    <div style={{ width: '100%', aspectRatio: '1', backgroundColor: '#f5f5f5', overflow: 'hidden' }}>
                      {listing.photos[0] ? (
                        <img src={listing.photos[0]} alt={listing.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Package size={48} color="#ccc" />
                        </div>
                      )}
                    </div>
                    <div style={{ padding: '16px 16px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h3 style={{ fontSize: 15, fontWeight: 500, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{listing.title}</h3>
                          <p style={{ fontSize: 18, fontWeight: 600, color: '#000' }}>{formatPrice(listing.price)}</p>
                        </div>
                        <span style={{ padding: '4px 10px', backgroundColor: listing.isActive ? '#dcfce7' : '#f5f5f5', color: listing.isActive ? '#166534' : '#666', fontSize: 11, fontWeight: 500, borderRadius: 4, flexShrink: 0 }}>
                          {listing.isActive ? 'Active' : 'Inactive'}
                        </span>
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
                    <Link href={`/produit/${listing.id}`} style={{ flex: 1, padding: '8px 14px', backgroundColor: '#000', color: '#fff', fontSize: 13, textAlign: 'center', borderRadius: 6 }}>
                      Voir
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
