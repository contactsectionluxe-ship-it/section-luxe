'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Tag, Calendar, CheckCircle, Palette, Layers, Ruler } from 'lucide-react';
import { Listing } from '@/types';
import { CATEGORIES } from '@/lib/utils';
import { CONDITIONS, COLORS, MATERIALS, CLOTHING_SIZES } from '@/lib/constants';

const iconSize = 14;
const iconColor = '#6e6e73';

export function ListingCaracteristiques({
  listing,
  className,
  style,
  variant = 'full',
}: {
  listing: Listing;
  className?: string;
  style?: React.CSSProperties;
  /** En mode "grid" (catalogue en cases) : état, taille, couleur, matière — pas catégorie ni année */
  /** En mode "line" (catalogue en ligne) : état, taille (si présent), date, couleur, matière */
  variant?: 'full' | 'grid' | 'line';
}) {
  const ref = useRef<HTMLDivElement>(null);

  const items = useMemo(() => {
    const arr: { key: string; node: React.ReactNode }[] = [];
    const isGrid = variant === 'grid';
    const isLine = variant === 'line';

    if (!isGrid && !isLine && listing.category) {
      arr.push({
        key: 'category',
        node: (
          <>
            <Tag size={iconSize} color={iconColor} style={{ flexShrink: 0 }} />
            {CATEGORIES.find((c) => c.value === listing.category)?.label ?? listing.category}
          </>
        ),
      });
    }
    if (listing.category === 'montres') {
      const dimVal = listing.size?.trim();
      const dimFromWidth = listing.widthCm != null ? String(Math.round(Number(listing.widthCm) * 10)) : null;
      const dimRaw = dimVal || dimFromWidth || null;
      const dimText = dimRaw ? `${dimRaw}${String(dimRaw).match(/^\d+$/) ? ' mm' : ''}` : '—';
      arr.push({
        key: 'size',
        node: (
          <>
            <Ruler size={iconSize} color={iconColor} style={{ flexShrink: 0 }} />
            {dimText}
          </>
        ),
      });
    } else if ((listing.category === 'chaussures' || listing.category === 'vetements') && listing.size) {
      arr.push({
        key: 'size',
        node: (
          <>
            <Ruler size={iconSize} color={iconColor} style={{ flexShrink: 0 }} />
            {listing.category === 'chaussures' ? (
              <>{listing.size}&nbsp;EU</>
            ) : listing.category === 'vetements' && listing.size != null && CLOTHING_SIZES.includes(listing.size as (typeof CLOTHING_SIZES)[number]) ? (
              <>Taille&nbsp;{listing.size}</>
            ) : (
              <>{listing.size}&nbsp;EU</>
            )}
          </>
        ),
      });
    }
    if (!isGrid && listing.year != null) {
      arr.push({
        key: 'year',
        node: (
          <>
            <Calendar size={iconSize} color={iconColor} style={{ flexShrink: 0 }} />
            {listing.year}
          </>
        ),
      });
    }
    if (listing.condition) {
      arr.push({
        key: 'condition',
        node: (
          <>
            <CheckCircle size={iconSize} color={iconColor} style={{ flexShrink: 0 }} />
            {CONDITIONS.find((c) => c.value === listing.condition)?.label ?? listing.condition}
          </>
        ),
      });
    }
    if (listing.color) {
      arr.push({
        key: 'color',
        node: (
          <>
            <Palette size={iconSize} color={iconColor} style={{ flexShrink: 0 }} />
            {COLORS.find((c) => c.value === listing.color)?.label ?? listing.color}
          </>
        ),
      });
    }
    if (listing.material) {
      arr.push({
        key: 'material',
        node: (
          <>
            <Layers size={iconSize} color={iconColor} style={{ flexShrink: 0 }} />
            {MATERIALS.find((m) => m.value === listing.material)?.label ?? listing.material}
          </>
        ),
      });
    }
    // En mode grille : ordre état → taille → couleur → matière
    if (isGrid) {
      const order = ['condition', 'size', 'color', 'material'];
      return order.map((key) => arr.find((x) => x.key === key)).filter(Boolean) as { key: string; node: React.ReactNode }[];
    }
    // En mode ligne : ordre état → taille → date → couleur → matière
    if (isLine) {
      const order = ['condition', 'size', 'year', 'color', 'material'];
      return order.map((key) => arr.find((x) => x.key === key)).filter(Boolean) as { key: string; node: React.ReactNode }[];
    }
    return arr;
  }, [
    variant,
    listing.category,
    listing.size,
    listing.widthCm,
    listing.year,
    listing.condition,
    listing.color,
    listing.material,
  ]);

  const [visibleCount, setVisibleCount] = useState(items.length);
  const lastWidthRef = useRef<number>(0);

  useEffect(() => {
    setVisibleCount(items.length);
  }, [listing.id, items.length]);

  const measureAndFit = useCallback(() => {
    const el = ref.current;
    if (!el || items.length === 0) return;
    const containerRight = el.getBoundingClientRect().left + el.clientWidth;
    const children = el.children;
    let fitCount = 0;
    for (let i = 0; i < children.length; i++) {
      const childRight = (children[i] as HTMLElement).getBoundingClientRect().right;
      if (childRight <= Math.floor(containerRight)) {
        fitCount = i + 1;
      } else {
        break;
      }
    }
    setVisibleCount((prev) => (fitCount < prev ? fitCount : prev));
  }, [items.length]);

  useLayoutEffect(() => {
    if (!ref.current || items.length === 0) return;
    measureAndFit();
    const raf = requestAnimationFrame(() => {
      measureAndFit();
    });
    return () => cancelAnimationFrame(raf);
  }, [visibleCount, items.length, listing.id, measureAndFit]);

  useEffect(() => {
    const el = ref.current;
    if (!el || items.length === 0) return;
    const ro = new ResizeObserver(() => {
      const w = el.clientWidth;
      if (w > lastWidthRef.current) {
        lastWidthRef.current = w;
        setVisibleCount(items.length);
      }
    });
    lastWidthRef.current = el.clientWidth;
    ro.observe(el);
    return () => ro.disconnect();
  }, [items.length, listing.id]);

  useEffect(() => {
    const onResize = () => setVisibleCount(items.length);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [items.length]);

  if (items.length === 0 || visibleCount === 0) return null;

  const visible = items.slice(0, visibleCount);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        display: 'flex',
        flexWrap: 'nowrap',
        gap: '11px 15px',
        marginBottom: 6,
        fontSize: 13,
        color: '#6e6e73',
        lineHeight: 1.35,
        minWidth: 0,
        maxWidth: '100%',
        width: '100%',
        overflow: 'hidden',
        ...style,
      }}
    >
      {visible.map((item) => (
        <span
          key={item.key}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 3,
            flexShrink: 0,
            whiteSpace: 'nowrap',
          }}
        >
          {item.node}
        </span>
      ))}
    </div>
  );
}
