'use client';

import Image from 'next/image';

/** Qualité JPEG/WebP/AVIF (1–100). Défaut au-dessus du défaut Next (75). */
const DEFAULT_QUALITY = 85;
const THUMB_QUALITY = 78;
/** Catalogue grille / fiche produit : rendu plus fin (toujours via Image optimizer). */
export const LISTING_PHOTO_QUALITY_SHARP = 92;

export function ListingPhoto({
  src,
  alt,
  fill = true,
  sizes = '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw',
  priority = false,
  quality = DEFAULT_QUALITY,
  className,
  style,
}: {
  src: string | null | undefined;
  alt: string;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
  /** Qualité (1–100) ou `thumb` pour vignettes (poids réduit, sans impact visible sur petites tailles). */
  quality?: number | 'thumb';
  className?: string;
  style?: React.CSSProperties;
}) {
  const q = quality === 'thumb' ? THUMB_QUALITY : quality;
  if (!src) {
    return (
      <div
        className={className}
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ccc',
          fontSize: 12,
          ...style,
        }}
      >
        Photo
      </div>
    );
  }

  const isSupabase = typeof src === 'string' && src.includes('supabase.co');

  if (isSupabase && fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        quality={q}
        priority={priority}
        className={className}
        style={{ objectFit: 'cover', ...style }}
      />
    );
  }

  if (isSupabase && !fill) {
    return (
      <Image
        src={src}
        alt={alt}
        width={400}
        height={400}
        sizes={sizes}
        quality={q}
        priority={priority}
        className={className}
        style={{ objectFit: 'cover', width: '100%', height: '100%', ...style }}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={className}
      style={{ width: '100%', height: '100%', objectFit: 'cover', ...style }}
    />
  );
}
