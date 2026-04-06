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

/** Même bouton (i) et panneau que le tooltip « État » sur la page produit (annonce). */
export function SellerVisitDescriptionInfo({ description, children, rowClassName, rowStyle }: Props) {
  const [clickedOpen, setClickedOpen] = useState(false);
  const [hoverOpen, setHoverOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const triggerId = useId();
  const text = typeof description === 'string' ? description.trim() : '';
  const hasDesc = Boolean(text);
  const visible = clickedOpen || hoverOpen;
  const active = visible;

  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setClickedOpen(false);
        setHoverOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    const onDoc = (e: MouseEvent) => {
      const el = wrapRef.current;
      if (el && !el.contains(e.target as Node)) {
        setClickedOpen(false);
        setHoverOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [visible]);

  return (
    <div style={{ width: '100%', marginBottom: 8 }}>
      <div
        className={rowClassName}
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
            ref={wrapRef}
            style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}
            onMouseEnter={() => setHoverOpen(true)}
            onMouseLeave={() => setHoverOpen(false)}
          >
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (visible) {
                  setClickedOpen(false);
                  setHoverOpen(false);
                } else {
                  setClickedOpen(true);
                }
              }}
              aria-expanded={visible}
              aria-controls={panelId}
              id={triggerId}
              aria-label="Description du vendeur"
              title="Description du vendeur"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 22,
                height: 22,
                padding: 0,
                lineHeight: 0,
                fontSize: 0,
                boxSizing: 'border-box',
                border: '1px solid #d2d2d7',
                borderRadius: '50%',
                backgroundColor: active ? '#1d1d1f' : '#fff',
                color: active ? '#fff' : '#6e6e73',
                cursor: 'pointer',
                transition: 'background-color 0.2s, color 0.2s',
                boxShadow: active ? '0 1px 3px rgba(0,0,0,0.12)' : '0 1px 2px rgba(0,0,0,0.04)',
              }}
            >
              <Info size={13} strokeWidth={2.2} style={{ display: 'block', flexShrink: 0 }} aria-hidden />
            </button>
            {visible && (
              <>
                {/* Pont sous le (i) : même logique que la fiche produit pour ne pas perdre le survol entre le bouton et le panneau */}
                <div
                  aria-hidden
                  onMouseEnter={() => setHoverOpen(true)}
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: '100%',
                    width: 'min(360px, calc(100vw - 48px))',
                    minWidth: 320,
                    height: 6,
                  }}
                />
                <div
                  id={panelId}
                  role="tooltip"
                  aria-labelledby={triggerId}
                  onMouseEnter={() => setHoverOpen(true)}
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 'calc(100% + 6px)',
                    zIndex: 30,
                    minWidth: 320,
                    maxWidth: 'min(360px, calc(100vw - 48px))',
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
                  }}
                >
                  <p style={{ margin: 0, color: '#6e6e73', whiteSpace: 'pre-wrap' }}>{text}</p>
                </div>
              </>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
