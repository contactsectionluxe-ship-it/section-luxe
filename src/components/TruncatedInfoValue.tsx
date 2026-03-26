'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type TruncatedInfoValueProps = {
  text: string;
  fontSize: 13 | 14;
};

type PopoverLayout = { top: number; left: number; maxWidth: number };

function computeLayout(el: HTMLElement): PopoverLayout {
  const r = el.getBoundingClientRect();
  const maxW = Math.min(360, typeof window !== 'undefined' ? window.innerWidth - 24 : 360);
  const left =
    typeof window !== 'undefined'
      ? Math.max(8, Math.min(r.left, window.innerWidth - maxW - 8))
      : r.left;
  return { top: r.top, left, maxWidth: maxW };
}

/**
 * Valeur sur une ligne avec ellipsis ; si le texte est tronqué, un clic affiche
 * le texte complet dans un petit cadre au-dessus.
 */
export function TruncatedInfoValue({ text, fontSize }: TruncatedInfoValueProps) {
  const spanRef = useRef<HTMLSpanElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [truncated, setTruncated] = useState(false);
  const [open, setOpen] = useState(false);
  const [layout, setLayout] = useState<PopoverLayout | null>(null);

  const measure = useCallback(() => {
    const el = spanRef.current;
    if (!el) return;
    setTruncated(el.scrollWidth > el.clientWidth + 1);
  }, []);

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

  const refreshLayout = useCallback(() => {
    const el = spanRef.current;
    if (!el) return;
    setLayout(computeLayout(el));
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      setLayout(null);
      return;
    }
    refreshLayout();
    window.addEventListener('scroll', refreshLayout, true);
    window.addEventListener('resize', refreshLayout);
    return () => {
      window.removeEventListener('scroll', refreshLayout, true);
      window.removeEventListener('resize', refreshLayout);
    };
  }, [open, refreshLayout]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (spanRef.current?.contains(t) || popoverRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const onToggle = () => {
    if (!truncated) return;
    setOpen((o) => !o);
  };

  const popover =
    open && truncated && layout && typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={popoverRef}
            role="dialog"
            aria-label="Texte complet"
            style={{
              position: 'fixed',
              left: layout.left,
              top: layout.top,
              transform: 'translateY(calc(-100% - 6px))',
              maxWidth: layout.maxWidth,
              zIndex: 2000,
              padding: '8px 10px',
              backgroundColor: '#fff',
              border: '1px solid #e5e5e7',
              borderRadius: 8,
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
              fontSize,
              fontWeight: 600,
              color: '#1d1d1f',
              lineHeight: 1.4,
              wordBreak: 'break-word',
              whiteSpace: 'normal',
            }}
          >
            {text}
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <span
        ref={spanRef}
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        style={{
          fontWeight: 600,
          color: '#1d1d1f',
          fontSize,
          minWidth: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          cursor: truncated ? 'pointer' : 'default',
        }}
        title={truncated ? 'Cliquer pour afficher en entier' : undefined}
      >
        {text}
      </span>
      {popover}
    </>
  );
}
