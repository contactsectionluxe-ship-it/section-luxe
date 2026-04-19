'use client';

import { ListingPhoto, LISTING_PHOTO_QUALITY_SHARP } from '@/components/ListingPhoto';

/**
 * Photos des cartes catalogue (et cartes type grille) : première image uniquement.
 * Le swipe entre photos est réservé à la page produit.
 */
export function CatalogueCardPhotos({
  photos,
  alt,
  sizes,
  containerStyle,
}: {
  photos: (string | null | undefined)[];
  alt: string;
  sizes?: string;
  containerStyle?: React.CSSProperties;
}) {
  const validPhotos = photos.filter((p): p is string => !!p);
  const currentPhoto = validPhotos.length > 0 ? validPhotos[0] : null;

  return (
    <div
      className="catalogue-card-photos"
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        ...containerStyle,
      }}
    >
      <ListingPhoto src={currentPhoto} alt={alt} sizes={sizes} quality={LISTING_PHOTO_QUALITY_SHARP} />
    </div>
  );
}
