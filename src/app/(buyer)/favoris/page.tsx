'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getUserFavorites } from '@/lib/supabase/favorites';
import { getListing } from '@/lib/supabase/listings';
import { Listing } from '@/types';

function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(price);
}

export default function FavoritesPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

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

        const validListings = listingsData.filter((listing): listing is Listing => listing !== null);
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

  if (authLoading || loading) {
    return (
      <div style={{ paddingTop: 'var(--header-height)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#888' }}>Chargement...</p>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div style={{ paddingTop: 'var(--header-height)', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '30px 20px 60px' }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: 28, fontWeight: 500, marginBottom: 8 }}>
            Mes favoris
          </h1>
          <p style={{ fontSize: 14, color: '#888' }}>
            {listings.length} {listings.length === 1 ? 'article sauvegardé' : 'articles sauvegardés'}
          </p>
        </div>

        {listings.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
            {listings.map((listing) => (
              <Link key={listing.id} href={`/produit/${listing.id}`}>
                <article>
                  <div style={{ aspectRatio: '3/4', backgroundColor: '#f5f5f5', marginBottom: 12, overflow: 'hidden' }}>
                    {listing.photos[0] && (
                      <img src={listing.photos[0]} alt={listing.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    )}
                  </div>
                  <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, color: '#999', marginBottom: 4 }}>
                    {listing.sellerName}
                  </p>
                  <h3 style={{ fontSize: 14, fontWeight: 500, marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {listing.title}
                  </h3>
                  <p style={{ fontSize: 15, fontWeight: 600 }}>{formatPrice(listing.price)}</p>
                </article>
              </Link>
            ))}
          </div>
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
