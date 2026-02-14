'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { ProductCard } from './ProductCard';
import { Modal, Button } from '@/components/ui';
import { Listing } from '@/types';
import Link from 'next/link';

interface ProductGridProps {
  listings: Listing[];
  favoritedIds?: string[];
}

export function ProductGrid({ listings, favoritedIds = [] }: ProductGridProps) {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const pathname = usePathname();
  const redirectUrl = pathname ? `?redirect=${encodeURIComponent(pathname)}` : '';

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {listings.map((listing) => (
          <ProductCard
            key={listing.id}
            listing={listing}
            isFavorited={favoritedIds.includes(listing.id)}
            onFavoriteClick={() => setShowAuthModal(true)}
          />
        ))}
      </div>

      {/* Auth Modal */}
      <Modal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        title="Créer un compte"
      >
        <div className="p-6">
          <p className="text-sm text-[#666] mb-6">
            Connectez-vous ou créez un compte pour sauvegarder vos favoris.
          </p>
          <div className="flex gap-3">
            <Link href={`/connexion${redirectUrl}`} className="flex-1">
              <Button variant="outline" fullWidth onClick={() => setShowAuthModal(false)}>
                Connexion
              </Button>
            </Link>
            <Link href={`/inscription${redirectUrl}`} className="flex-1">
              <Button fullWidth onClick={() => setShowAuthModal(false)}>
                S&apos;inscrire
              </Button>
            </Link>
          </div>
        </div>
      </Modal>
    </>
  );
}
