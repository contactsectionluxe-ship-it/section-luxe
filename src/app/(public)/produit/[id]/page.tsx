'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Heart, MessageCircle, Store, ArrowLeft, Share2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getListing } from '@/lib/supabase/listings';
import { getFavorite, addFavorite, removeFavorite } from '@/lib/supabase/favorites';
import { getOrCreateConversation } from '@/lib/supabase/messaging';
import { getSellerData } from '@/lib/supabase/auth';
import { Listing, Seller } from '@/types';
import { formatPrice, formatDate, CATEGORIES } from '@/lib/utils';

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const listingId = params.id as string;
  const { user, isAuthenticated } = useAuth();

  const [listing, setListing] = useState<Listing | null>(null);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  useEffect(() => {
    async function loadData() {
      try {
        const listingData = await getListing(listingId);
        if (!listingData) {
          router.push('/catalogue');
          return;
        }

        setListing(listingData);
        setLikesCount(listingData.likesCount);

        const sellerData = await getSellerData(listingData.sellerId);
        setSeller(sellerData);

        if (isAuthenticated && user) {
          const favorite = await getFavorite(user.uid, listingId);
          setIsFavorited(!!favorite);
        }
      } catch (error) {
        console.error('Error loading listing:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [listingId, isAuthenticated, user, router]);

  const handleFavoriteClick = async () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    if (favoriteLoading) return;

    setFavoriteLoading(true);
    try {
      if (isFavorited) {
        await removeFavorite(user!.uid, listingId);
        setIsFavorited(false);
        setLikesCount((prev) => Math.max(0, prev - 1));
      } else {
        await addFavorite(user!.uid, listingId);
        setIsFavorited(true);
        setLikesCount((prev) => prev + 1);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleContactSeller = async () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    if (!listing || !seller || contactLoading) return;

    if (user?.uid === listing.sellerId) return;

    setContactLoading(true);
    try {
      const conversation = await getOrCreateConversation({
        listingId: listing.id,
        listingTitle: listing.title,
        listingPhoto: listing.photos[0] || '',
        buyerId: user!.uid,
        buyerName: user!.displayName || 'Acheteur',
        sellerId: listing.sellerId,
        sellerName: seller.companyName,
      });

      router.push(`/messages/${conversation.id}`);
    } catch (error) {
      console.error('Error creating conversation:', error);
    } finally {
      setContactLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ paddingTop: 'var(--header-height)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#888' }}>Chargement...</p>
      </div>
    );
  }

  if (!listing) return null;

  const categoryLabel = CATEGORIES.find((c) => c.value === listing.category)?.label;

  return (
    <div style={{ paddingTop: 'var(--header-height)', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '30px 20px 60px' }}>
        {/* Back button */}
        <Link
          href="/catalogue"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#666', marginBottom: 24 }}
        >
          <ArrowLeft size={16} />
          Retour au catalogue
        </Link>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 40 }}>
          {/* Desktop: 2 columns */}
          <div className="hide-mobile" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
            {/* Gallery */}
            <div>
              <div style={{ aspectRatio: '1', backgroundColor: '#f5f5f7', marginBottom: 12, position: 'relative', overflow: 'hidden', borderRadius: 18 }}>
                {listing.photos[currentPhotoIndex] ? (
                  <img
                    src={listing.photos[currentPhotoIndex]}
                    alt={listing.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc' }}>
                    Photo
                  </div>
                )}
                {listing.photos.length > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentPhotoIndex(i => i > 0 ? i - 1 : listing.photos.length - 1)}
                      style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 40, height: 40, backgroundColor: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      onClick={() => setCurrentPhotoIndex(i => i < listing.photos.length - 1 ? i + 1 : 0)}
                      style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 40, height: 40, backgroundColor: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <ChevronRight size={20} />
                    </button>
                  </>
                )}
              </div>
              {listing.photos.length > 1 && (
                <div style={{ display: 'flex', gap: 8 }}>
                  {listing.photos.map((photo, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentPhotoIndex(index)}
                      style={{
                        width: 60,
                        height: 60,
                        border: currentPhotoIndex === index ? '2px solid #000' : '1px solid #ddd',
                        padding: 0,
                        cursor: 'pointer',
                        overflow: 'hidden',
                      }}
                    >
                      <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Details */}
            <div>
              {categoryLabel && (
                <span style={{ display: 'inline-block', padding: '4px 10px', backgroundColor: '#f5f5f5', fontSize: 11, fontWeight: 500, marginBottom: 16 }}>
                  {categoryLabel}
                </span>
              )}
              <h1 style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: 28, fontWeight: 500, marginBottom: 16 }}>
                {listing.title}
              </h1>
              <p style={{ fontSize: 28, fontWeight: 600, marginBottom: 16 }}>{formatPrice(listing.price)}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 13, color: '#888', marginBottom: 24 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Heart size={14} /> {likesCount} likes
                </span>
                <span>Publié le {formatDate(listing.createdAt)}</span>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                <button
                  onClick={handleFavoriteClick}
                  disabled={favoriteLoading}
                  style={{
                    flex: 1,
                    height: 50,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    backgroundColor: isFavorited ? '#1d1d1f' : '#fff',
                    color: isFavorited ? '#fff' : '#1d1d1f',
                    border: '1.5px solid #d2d2d7',
                    borderRadius: 980,
                    fontSize: 15,
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  <Heart size={18} fill={isFavorited ? '#fff' : 'none'} />
                  {isFavorited ? 'Sauvegardé' : 'Sauvegarder'}
                </button>
              </div>

              {user?.uid !== listing.sellerId && (
                <button
                  onClick={handleContactSeller}
                  disabled={contactLoading}
                  style={{
                    width: '100%',
                    height: 50,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    backgroundColor: '#1d1d1f',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 980,
                    fontSize: 15,
                    fontWeight: 500,
                    cursor: 'pointer',
                    marginBottom: 32,
                  }}
                >
                  <MessageCircle size={18} />
                  {contactLoading ? 'Chargement...' : 'Contacter le vendeur'}
                </button>
              )}

              <div style={{ marginBottom: 32 }}>
                <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Description</h2>
                <p style={{ fontSize: 14, color: '#555', lineHeight: 1.7, whiteSpace: 'pre-line' }}>{listing.description}</p>
              </div>

              {seller && (
                <div style={{ padding: 20, backgroundColor: '#f5f5f7', borderRadius: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 48, height: 48, backgroundColor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Store size={24} color="#888" />
                    </div>
                    <div>
                      <h3 style={{ fontSize: 15, fontWeight: 600 }}>{seller.companyName}</h3>
                      <p style={{ fontSize: 12, color: '#888' }}>Vendeur professionnel</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile: single column */}
          <div className="hide-desktop">
            {/* Gallery */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ aspectRatio: '1', backgroundColor: '#f5f5f7', marginBottom: 12, position: 'relative', overflow: 'hidden', borderRadius: 18 }}>
                {listing.photos[currentPhotoIndex] ? (
                  <img src={listing.photos[currentPhotoIndex]} alt={listing.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc' }}>Photo</div>
                )}
              </div>
              {listing.photos.length > 1 && (
                <div style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
                  {listing.photos.map((photo, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentPhotoIndex(index)}
                      style={{ width: 50, height: 50, flexShrink: 0, border: currentPhotoIndex === index ? '2px solid #1d1d1f' : '1px solid #d2d2d7', borderRadius: 12, padding: 0, cursor: 'pointer', overflow: 'hidden' }}
                    >
                      <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Details */}
            {categoryLabel && (
              <span style={{ display: 'inline-block', padding: '4px 10px', backgroundColor: '#f5f5f5', fontSize: 11, fontWeight: 500, marginBottom: 12 }}>{categoryLabel}</span>
            )}
            <h1 style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: 24, fontWeight: 500, marginBottom: 12 }}>{listing.title}</h1>
            <p style={{ fontSize: 24, fontWeight: 600, marginBottom: 12 }}>{formatPrice(listing.price)}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: '#888', marginBottom: 20 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Heart size={12} /> {likesCount}</span>
              <span>{formatDate(listing.createdAt)}</span>
            </div>

            <button
              onClick={handleFavoriteClick}
              style={{ width: '100%', height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: isFavorited ? '#000' : '#fff', color: isFavorited ? '#fff' : '#000', border: '1px solid #000', fontSize: 14, fontWeight: 500, cursor: 'pointer', marginBottom: 12 }}
            >
              <Heart size={18} fill={isFavorited ? '#fff' : 'none'} />
              {isFavorited ? 'Sauvegardé' : 'Sauvegarder'}
            </button>

            {user?.uid !== listing.sellerId && (
              <button
                onClick={handleContactSeller}
                style={{ width: '100%', height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#000', color: '#fff', border: 'none', fontSize: 14, fontWeight: 500, cursor: 'pointer', marginBottom: 24 }}
              >
                <MessageCircle size={18} />
                Contacter le vendeur
              </button>
            )}

            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 10 }}>Description</h2>
              <p style={{ fontSize: 14, color: '#555', lineHeight: 1.7, whiteSpace: 'pre-line' }}>{listing.description}</p>
            </div>

            {seller && (
              <div style={{ padding: 16, backgroundColor: '#f5f5f7', borderRadius: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, backgroundColor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Store size={20} color="#888" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 14, fontWeight: 600 }}>{seller.companyName}</h3>
                    <p style={{ fontSize: 11, color: '#888' }}>Vendeur professionnel</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)' }} onClick={() => setShowAuthModal(false)} />
          <div style={{ position: 'relative', width: '100%', maxWidth: 380, backgroundColor: '#fff', padding: 36, borderRadius: 18, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
            <h2 style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: 20, marginBottom: 8 }}>Connectez-vous</h2>
            <p style={{ fontSize: 14, color: '#666', marginBottom: 24 }}>Créez un compte pour sauvegarder vos favoris et contacter les vendeurs.</p>
            <Link href="/inscription" onClick={() => setShowAuthModal(false)} style={{ display: 'block', width: '100%', height: 50, backgroundColor: '#1d1d1f', color: '#fff', fontSize: 15, fontWeight: 500, textAlign: 'center', lineHeight: '50px', marginBottom: 12, borderRadius: 980 }}>
              Créer un compte
            </Link>
            <Link href="/connexion" onClick={() => setShowAuthModal(false)} style={{ display: 'block', width: '100%', height: 50, border: '1.5px solid #d2d2d7', color: '#1d1d1f', fontSize: 15, fontWeight: 500, textAlign: 'center', lineHeight: '50px', borderRadius: 980 }}>
              J&apos;ai déjà un compte
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
