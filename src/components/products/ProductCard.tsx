'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { cn, formatPrice } from '@/lib/utils';
import { Listing } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { addFavorite, removeFavorite } from '@/lib/supabase/favorites';

interface ProductCardProps {
  listing: Listing;
  isFavorited?: boolean;
  onFavoriteClick?: () => void;
}

export function ProductCard({
  listing,
  isFavorited = false,
  onFavoriteClick,
}: ProductCardProps) {
  const { isAuthenticated, user } = useAuth();
  const [favorited, setFavorited] = useState(isFavorited);
  const [isLoading, setIsLoading] = useState(false);

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated || !user) {
      onFavoriteClick?.();
      return;
    }

    if (isLoading) return;

    setIsLoading(true);
    try {
      if (favorited) {
        await removeFavorite(user.uid, listing.id);
        setFavorited(false);
      } else {
        await addFavorite(user.uid, listing.id);
        setFavorited(true);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.article
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Link href={`/produit/${listing.id}`} className="group block">
        {/* Image */}
        <div className="relative aspect-[3/4] bg-[#f5f5f5] overflow-hidden">
          {listing.photos[0] ? (
            <img
              src={listing.photos[0]}
              alt={listing.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-[#ccc]">
              <span className="text-xs uppercase tracking-wider">Photo</span>
            </div>
          )}

          {/* Favorite button */}
          <button
            onClick={handleFavoriteClick}
            disabled={isLoading}
            className={cn(
              'absolute top-3 right-3 w-8 h-8 flex items-center justify-center transition-all',
              favorited
                ? 'text-[#1a1a1a]'
                : 'text-[#999] hover:text-[#1a1a1a]'
            )}
          >
            <Heart
              className={cn(
                'h-5 w-5 transition-transform',
                favorited && 'fill-current',
                isLoading && 'animate-pulse'
              )}
            />
          </button>
        </div>

        {/* Info */}
        <div className="mt-4 space-y-1">
          <h3 className="text-sm font-medium text-[#1a1a1a] line-clamp-1 group-hover:underline">
            {listing.title}
          </h3>
          <p className="text-xs text-[#999]">{listing.sellerName}</p>
          <p className="text-sm font-medium text-[#1a1a1a]">
            {formatPrice(listing.price)}
          </p>
        </div>
      </Link>
    </motion.article>
  );
}
