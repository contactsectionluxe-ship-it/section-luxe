'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Package, Heart, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getSellerListings } from '@/lib/supabase/listings';
import { Listing } from '@/types';
import { formatPrice, formatDate } from '@/lib/utils';

export default function SellerDashboardPage() {
  const router = useRouter();
  const { user, seller, isSeller, isApprovedSeller, loading: authLoading } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isSeller) {
      router.push('/connexion');
    }
  }, [authLoading, isSeller, router]);

  useEffect(() => {
    async function loadListings() {
      if (!user) return;
      try {
        const sellerListings = await getSellerListings(user.uid);
        setListings(sellerListings);
      } catch (error) {
        console.error('Error loading listings:', error);
      } finally {
        setLoading(false);
      }
    }

    if (user && isApprovedSeller) {
      loadListings();
    } else {
      setLoading(false);
    }
  }, [user, isApprovedSeller]);

  if (authLoading || loading) {
    return (
      <div style={{ paddingTop: 'var(--header-height)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#888' }}>Chargement...</p>
      </div>
    );
  }

  if (!isSeller) return null;

  const totalLikes = listings.reduce((sum, l) => sum + l.likesCount, 0);
  const activeListings = listings.filter((l) => l.isActive).length;

  return (
    <div style={{ paddingTop: 'var(--header-height)', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '30px 20px 60px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 32 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: 28, fontWeight: 500, marginBottom: 8 }}>
              Espace vendeur
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
            <Link href="/vendeur/annonces/nouvelle" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 20px', backgroundColor: '#000', color: '#fff', fontSize: 14, fontWeight: 500 }}>
              <Plus size={18} /> Créer une annonce
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 40 }}>
            <div style={{ padding: 20, border: '1px solid #eee', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 48, height: 48, backgroundColor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Package size={24} color="#666" />
              </div>
              <div>
                <p style={{ fontSize: 12, color: '#888' }}>Annonces actives</p>
                <p style={{ fontSize: 24, fontWeight: 600 }}>{activeListings}</p>
              </div>
            </div>
            <div style={{ padding: 20, border: '1px solid #eee', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 48, height: 48, backgroundColor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Heart size={24} color="#666" />
              </div>
              <div>
                <p style={{ fontSize: 12, color: '#888' }}>Total likes</p>
                <p style={{ fontSize: 24, fontWeight: 600 }}>{totalLikes}</p>
              </div>
            </div>
          </div>
        )}

        {/* Listings */}
        {isApprovedSeller && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: 20, marginBottom: 20 }}>Mes annonces</h2>

            {listings.length === 0 ? (
              <div style={{ padding: 60, border: '1px solid #eee', textAlign: 'center' }}>
                <Package size={48} color="#ccc" style={{ margin: '0 auto 16px' }} />
                <h3 style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>Aucune annonce</h3>
                <p style={{ fontSize: 14, color: '#888', marginBottom: 24 }}>Créez votre première annonce</p>
                <Link href="/vendeur/annonces/nouvelle" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 20px', backgroundColor: '#000', color: '#fff', fontSize: 14, fontWeight: 500 }}>
                  <Plus size={18} /> Créer une annonce
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {listings.map((listing) => (
                  <div key={listing.id} style={{ padding: 16, border: '1px solid #eee', display: 'flex', gap: 16 }}>
                    <div style={{ width: 80, height: 80, backgroundColor: '#f5f5f5', flexShrink: 0, overflow: 'hidden' }}>
                      {listing.photos[0] ? (
                        <img src={listing.photos[0]} alt={listing.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Package size={24} color="#ccc" />
                        </div>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
                        <div>
                          <h3 style={{ fontSize: 15, fontWeight: 500, marginBottom: 4 }}>{listing.title}</h3>
                          <p style={{ fontSize: 16, fontWeight: 600 }}>{formatPrice(listing.price)}</p>
                        </div>
                        <span style={{ padding: '4px 10px', backgroundColor: listing.isActive ? '#dcfce7' : '#f5f5f5', color: listing.isActive ? '#166534' : '#666', fontSize: 11, fontWeight: 500 }}>
                          {listing.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, color: '#888', marginBottom: 12 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Heart size={12} /> {listing.likesCount}</span>
                        <span>{formatDate(listing.createdAt)}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Link href={`/vendeur/annonces/${listing.id}`} style={{ padding: '6px 14px', border: '1px solid #ddd', fontSize: 13 }}>
                          Modifier
                        </Link>
                        <Link href={`/produit/${listing.id}`} style={{ padding: '6px 14px', fontSize: 13, color: '#666' }}>
                          Voir
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
