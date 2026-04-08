'use client';

import type { CSSProperties } from 'react';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type TruncatedInfoValueProps = {
  text: string;
  /** `tag` = pastille verte (contenu inclus) ; ellipsis + popover au-dessus comme le texte plain */
  fontSize: 12 | 13 | 14 | 22 | 25;
  variant?: 'plain' | 'tag';
  /** Couleur du texte (ex. sous-titre Informations #6e6e73) ; ignoré en variante tag */
  color?: string;
  /** Titre multi-lignes (ex. h1 page produit) : même logique que -webkit-line-clamp, clic si débordement */
  lineClamp?: number;
  className?: string;
  /** Grille « libellé | valeur » : `right` (défaut) pour aligner la valeur à droite ; `left` pour sous-titre pleine largeur */
  valueTextAlign?: 'left' | 'right';
};

const MOBILE_MAX_W = 767;

type BubblePosition = {
  top: number;
  left: number;
  maxWidth: number;
  /** Sur mobile, colonne droite : ancrage à droite du texte pour décaler la bulle vers la gauche (une ligne). */
  anchor: 'center' | 'right';
};

/**
 * Texte sur une ligne avec ellipsis ; si tronqué, un clic affiche le texte complet
 * dans un cadre centré juste au-dessus du texte tronqué (pas aligné sur le bord gauche de l’écran).
 * Variante `tag` : pastille contenu inclus (vert).
 * `lineClamp` : troncature multi-lignes (ex. titre h1 avec … en fin de bloc).
 */
export function TruncatedInfoValue({
  text,
  fontSize,
  variant = 'plain',
  color,
  lineClamp,
  className,
  valueTextAlign,
}: TruncatedInfoValueProps) {
  const spanRef = useRef<HTMLSpanElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [truncated, setTruncated] = useState(false);
  const [open, setOpen] = useState(false);
  const [bubble, setBubble] = useState<BubblePosition | null>(null);

  const measure = useCallback(() => {
    const el = spanRef.current;
    if (!el) return;
    if (lineClamp != null && lineClamp > 0) {
      setTruncated(el.scrollHeight > el.clientHeight + 1);
    } else {
      setTruncated(el.scrollWidth > el.clientWidth + 0.5);
    }
  }, [lineClamp]);

  useLayoutEffect(() => {
    measure();
  }, [text, measure]);

  useEffect(() => {
    const el = spanRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure]);

  useEffect(() => {
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [measure]);

  const refreshBubble = useCallback(() => {
    const span = spanRef.current;
    if (!span || typeof window === 'undefined') return;
    const r = span.getBoundingClientRect();
    const vw = window.innerWidth;
    const centerX = r.left + r.width / 2;
    /** Colonne droite (ligne courte ~½ écran), pas une ligne pleine largeur comme le sous-titre sous « Informations ». */
    const narrowCell = r.width < vw * 0.62;
    const rightColumn = vw <= MOBILE_MAX_W && narrowCell && centerX > vw * 0.54;
    const maxW = Math.min(360, vw - 16);
    const top = r.top;
    const pop = popoverRef.current;

    if (rightColumn) {
      let left = r.right;
      if (pop) {
        const w = pop.getBoundingClientRect().width;
        if (r.right - w < 8) {
          left = 8 + w;
        }
      } else {
        const halfEst = Math.min(maxW * 0.45, 120);
        if (r.right - halfEst * 2 < 8) {
          left = 8 + halfEst * 2;
        }
      }
      setBubble({ top, left, maxWidth: maxW, anchor: 'right' });
      return;
    }

    let left = centerX;
    if (pop) {
      const half = pop.getBoundingClientRect().width / 2;
      left = Math.max(8 + half, Math.min(centerX, vw - 8 - half));
    } else {
      const halfEst = Math.min(maxW * 0.48, 140);
      left = Math.max(8 + halfEst, Math.min(centerX, vw - 8 - halfEst));
    }
    setBubble({ top, left, maxWidth: maxW, anchor: 'center' });
  }, []);

  useLayoutEffect(() => {
    if (!open || !truncated) {
      setBubble(null);
      return;
    }
    refreshBubble();
    const raf1 = requestAnimationFrame(() => {
      refreshBubble();
      requestAnimationFrame(refreshBubble);
    });
    window.addEventListener('scroll', refreshBubble, true);
    window.addEventListener('resize', refreshBubble);
    return () => {
      cancelAnimationFrame(raf1);
      window.removeEventListener('scroll', refreshBubble, true);
      window.removeEventListener('resize', refreshBubble);
    };
  }, [open, truncated, refreshBubble, text, fontSize]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: Event) => {
      const t = e.target as Node;
      if (spanRef.current?.contains(t) || popoverRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('touchstart', onDoc, { passive: true });
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('touchstart', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const onToggle = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    if (!truncated) return;
    setOpen((o) => !o);
  };

  const isTag = variant === 'tag';
  const tagPadding = fontSize === 12 ? '5px 10px' : '6px 12px';
  const plainColor = color ?? '#555';
  const multiline = lineClamp != null && lineClamp > 0 && !isTag;

  const mobileRightColumn = bubble?.anchor === 'right';

  const popover =
    open && truncated && bubble && typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={popoverRef}
            role="dialog"
            aria-label="Texte complet"
            style={{
              position: 'fixed',
              left: bubble.left,
              top: bubble.top,
              transform:
                bubble.anchor === 'right'
                  ? 'translate(-100%, calc(-100% - 6px))'
                  : 'translate(-50%, calc(-100% - 6px))',
              maxWidth: bubble.maxWidth,
              zIndex: 2000,
              padding: '8px 10px',
              backgroundColor: '#fff',
              border: '1px solid #e5e5e7',
              borderRadius: 8,
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
              fontSize,
              fontWeight: isTag ? 500 : multiline ? 500 : 400,
              fontFamily: multiline ? 'var(--font-playfair), Georgia, serif' : undefined,
              color: isTag ? '#2e7d32' : plainColor,
              lineHeight: multiline ? 1.25 : 1.4,
              wordBreak: mobileRightColumn ? 'normal' : 'break-word',
              whiteSpace: mobileRightColumn ? 'nowrap' : 'normal',
              overflowX: mobileRightColumn ? 'auto' : undefined,
              WebkitOverflowScrolling: mobileRightColumn ? 'touch' : undefined,
            }}
          >
            {text}
          </div>,
          document.body,
        )
      : null;

  const singleLineStyles: CSSProperties = {
    boxSizing: 'border-box',
    display: isTag ? 'inline-block' : 'block',
    verticalAlign: isTag ? 'top' : undefined,
    flex: isTag ? undefined : '1 1 0%',
    maxWidth: isTag ? 'min(100%, 260px)' : undefined,
    padding: isTag ? tagPadding : undefined,
    backgroundColor: isTag ? '#e8f5e9' : undefined,
    borderRadius: isTag ? 4 : undefined,
    fontWeight: isTag ? 500 : 400,
    color: isTag ? '#2e7d32' : plainColor,
    fontSize,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    textAlign: isTag ? 'left' : (valueTextAlign ?? 'right'),
    cursor: truncated ? 'pointer' : 'default',
    touchAction: truncated ? 'manipulation' : undefined,
    WebkitTapHighlightColor: 'transparent',
  };

  const multiLineStyles: CSSProperties = {
    boxSizing: 'border-box',
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: lineClamp,
    overflow: 'hidden',
    wordBreak: 'break-word',
    whiteSpace: 'normal',
    textAlign: 'left',
    lineHeight: 1.25,
    width: '100%',
    margin: 0,
    fontWeight: 500,
    color: plainColor,
    fontSize,
    fontFamily: 'inherit',
    cursor: truncated ? 'pointer' : 'default',
    touchAction: truncated ? 'manipulation' : undefined,
    WebkitTapHighlightColor: 'transparent',
  };

  return (
    <>
      <span
        ref={spanRef}
        className={className}
        role={truncated ? 'button' : undefined}
        tabIndex={truncated ? 0 : undefined}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (!truncated) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setOpen((o) => !o);
          }
        }}
        style={multiline ? multiLineStyles : singleLineStyles}
        title={truncated ? 'Cliquer pour afficher en entier' : undefined}
      >
        {text}
      </span>
      {popover}
    </>
  );
}
