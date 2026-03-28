'use client';

import { useState, useRef, useCallback } from 'react';
import { ListingPhoto, LISTING_PHOTO_QUALITY_SHARP } from '@/components/ListingPhoto';

/** Photos des cartes catalogue : plusieurs images en carrousel par swipe (pas de flèches sur la vignette). */
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
  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const currentPhoto = validPhotos.length > 0 ? validPhotos[index % validPhotos.length] : null;

  const goTo = useCallback(
    (i: number) => {
      setIndex((prev) => {
        const next = i < 0 ? validPhotos.length - 1 : i >= validPhotos.length ? 0 : i;
        return next;
      });
    },
    [validPhotos.length]
  );

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartX.current == null || validPhotos.length <= 1) return;
      const dx = e.changedTouches[0].clientX - touchStartX.current;
      if (Math.abs(dx) < 30) return;
      if (dx > 0) goTo(index - 1);
      else goTo(index + 1);
      touchStartX.current = null;
    },
    [index, validPhotos.length, goTo]
  );

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
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <ListingPhoto src={currentPhoto} alt={alt} sizes={sizes} quality={LISTING_PHOTO_QUALITY_SHARP} />
    </div>
  );
}
