'use client';

import { useState, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ListingPhoto } from '@/components/ListingPhoto';

const arrowSize = 14;

/** Carousel discret pour les photos des cartes catalogue : flèches gauche/droite si plusieurs photos, swipe au doigt. */
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

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    goTo(index - 1);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    goTo(index + 1);
  };

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
      <ListingPhoto src={currentPhoto} alt={alt} sizes={sizes} />
      {validPhotos.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Photo précédente"
            onClick={handlePrev}
            style={{
              position: 'absolute',
              left: 6,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 28,
              height: 28,
              border: 'none',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'transparent',
              color: 'rgba(0,0,0,0.45)',
              cursor: 'pointer',
            }}
          >
            <ChevronLeft size={arrowSize} strokeWidth={2} />
          </button>
          <button
            type="button"
            aria-label="Photo suivante"
            onClick={handleNext}
            style={{
              position: 'absolute',
              right: 6,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 28,
              height: 28,
              border: 'none',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'transparent',
              color: 'rgba(0,0,0,0.45)',
              cursor: 'pointer',
            }}
          >
            <ChevronRight size={arrowSize} strokeWidth={2} />
          </button>
        </>
      )}
    </div>
  );
}
