'use client';

import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Info } from 'lucide-react';

type Props = {
  description?: string | null;
  children: ReactNode;
  /** Classe(s) pour la ligne : nom, badge, bouton (ex. `catalogue-seller-banner-title-row`). */
  rowClassName?: string;
  /** Styles complémentaires pour la ligne (typo, etc.). */
  rowStyle?: CSSProperties;
};

/** Icône (i) ; panneau description en pleine largeur sous le titre (comme la carte), tous écrans. */
export function SellerVisitDescriptionInfo({ description, children, rowClassName, rowStyle }: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const triggerId = useId();
  const text = typeof description === 'string' ? description.trim() : '';
  const hasDesc = Boolean(text);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const el = wrapRef.current;
      if (el && !el.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const rowClass = [rowClassName, 'seller-visit-title-row'].filter(Boolean).join(' ');

  const panelStyle: CSSProperties = {
    width: '100%',
    maxWidth: '100%',
    marginTop: 10,
    padding: 16,
    backgroundColor: '#fff',
    border: '1px solid #e8e6e3',
    borderRadius: 12,
    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
    fontSize: 13,
    lineHeight: 1.5,
    color: '#1d1d1f',
    boxSizing: 'border-box',
    wordBreak: 'break-word',
  };

  return (
    <div
      ref={wrapRef}
      className="seller-visit-description-block"
      style={{ position: 'relative', zIndex: 3, width: '100%', marginBottom: 8 }}
    >
      <div
        className={rowClass}
        style={{
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.35em',
          minWidth: 0,
          ...rowStyle,
        }}
      >
        {hasDesc && (
          <div
            className="seller-visit-info-wrap"
            style={{
              position: 'relative',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              margin: 0,
              padding: 0,
              lineHeight: 0,
            }}
          >
            <button
              type="button"
              className="seller-visit-info-btn"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setOpen((v) => !v);
              }}
              aria-expanded={open}
              aria-controls={panelId}
              id={triggerId}
              aria-label="Description du vendeur"
              title="Description du vendeur"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                background: 'transparent',
                padding: 0,
                margin: 0,
                cursor: 'pointer',
                fontSize: 'inherit',
                color: open ? '#1d1d1f' : '#aeaeb2',
                lineHeight: 0,
                transition: 'color 0.15s ease',
              }}
            >
              <Info
                strokeWidth={2}
                aria-hidden
                style={{
                  display: 'block',
                  flexShrink: 0,
                  width: '1em',
                  height: '1em',
                }}
              />
            </button>
          </div>
        )}
        {children}
      </div>
      {open && hasDesc && (
        <div
          id={panelId}
          role="region"
          aria-labelledby={triggerId}
          className="seller-visit-desc-panel"
          style={panelStyle}
        >
          <p style={{ margin: 0, color: '#6e6e73', whiteSpace: 'pre-wrap' }}>{text}</p>
        </div>
      )}
    </div>
  );
}
