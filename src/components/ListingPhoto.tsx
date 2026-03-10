'use client';

import Image from 'next/image';

/** Affiche la première photo d'une annonce avec next/image (optimisation, lazy load) si l'URL est Supabase, sinon <img>. */
export function ListingPhoto({
  src,
  alt,
  fill = true,
  sizes = '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw',
  priority = false,
  className,
  style,
}: {
  src: string | null | undefined;
  alt: string;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
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
