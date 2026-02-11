'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Heart, MapPin, Store } from 'lucide-react';
import { Listing } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { addFavorite, removeFavorite } from '@/lib/supabase/favorites';

interface ProductCardProps {
  listing: Listing;
  isFavorited?: boolean;
  onAuthRequired?: () => void;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
  }).format(price);
}

export function ProductCard({ listing, isFavorited = false, onAuthRequired }: ProductCardProps) {
  const { isAuthenticated, user } = useAuth();
  const [favorited, setFavorited] = useState(isFavorited);
  const [likes, setLikes] = useState(listing.likesCount);
  const [isLoading, setIsLoading] = useState(false);

  const handleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated || !user) {
      onAuthRequired?.();
      return;
    }

    if (isLoading) return;
    setIsLoading(true);

    try {
      if (favorited) {
        await removeFavorite(user.uid, listing.id);
        setFavorited(false);
        setLikes(l => Math.max(0, l - 1));
      } else {
        await addFavorite(user.uid, listing.id);
        setFavorited(true);
        setLikes(l => l + 1);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Link href={`/produit/${listing.id}`} style={{ display: 'block' }}>
      <article style={{ position: 'relative' }}>
        {/* Image */}
        <div style={{
          position: 'relative',
          aspectRatio: '3/4',
          backgroundColor: '#f5f5f5',
          overflow: 'hidden',
          marginBottom: 12,
        }}>
          {listing.photos[0] ? (
            <img
              src={listing.photos[0]}
              alt={listing.title}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transition: 'transform 0.3s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            />
          ) : (
            <div style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ccc',
              fontSize: 12,
            }}>
              Photo
            </div>
          )}

          {/* Favorite button */}
          <button
            onClick={handleFavorite}
            disabled={isLoading}
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#fff',
              border: 'none',
              borderRadius: '50%',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            <Heart
              size={18}
              fill={favorited ? '#1a1a1a' : 'none'}
              color="#1a1a1a"
            />
          </button>

          {/* Likes badge */}
          {likes > 0 && (
            <div style={{
              position: 'absolute',
              bottom: 12,
              left: 12,
              padding: '4px 10px',
              backgroundColor: '#fff',
              fontSize: 12,
              fontWeight: 500,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}>
              {likes} ♥
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          {/* Brand */}
          <p style={{
            fontSize: 11,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            color: '#888',
            marginBottom: 4,
          }}>
            {listing.sellerName}
          </p>

          {/* Title */}
          <h3 style={{
            fontSize: 14,
            fontWeight: 500,
            color: '#1a1a1a',
            marginBottom: 6,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {listing.title}
          </h3>

          {/* Price */}
          <p style={{
            fontSize: 16,
            fontWeight: 600,
            color: '#1a1a1a',
            marginBottom: 8,
          }}>
            {formatPrice(listing.price)}
          </p>

          {/* Meta */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 12,
              color: '#888',
            }}>
              <Store size={12} />
              Pro
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
