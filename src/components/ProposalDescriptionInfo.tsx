'use client';

import { useCallback, useEffect, useLayoutEffect, useReducer, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { Info } from 'lucide-react';

const HOVER_CLOSE_DELAY_MS = 160;

/** Hauteur max du panneau = 8 lignes visibles (13px × 1.45) + padding vertical 24px − 3mm */
const PANEL_FONT_PX = 13;
const PANEL_LINE_HEIGHT = 1.45;
const PANEL_VISIBLE_LINES = 8;
const PANEL_HEIGHT_TRIM_PX = Math.round((3 * 96) / 25.4);
const PANEL_MAX_HEIGHT_PX =
  24 + Math.round(PANEL_VISIBLE_LINES * PANEL_FONT_PX * PANEL_LINE_HEIGHT) - PANEL_HEIGHT_TRIM_PX;

/** Décalage sous l’icône (px) : 6px − 0,5mm pour remonter légèrement le panneau */
const PANEL_TOP_GAP_PX = 6 - (0.5 * 96) / 25.4;

/** Décalage horizontal vers la droite (px) par rapport à l’alignement bord droit icône / bord droit panneau */
const PANEL_SHIFT_RIGHT_PX = 36;

/** Padding haut du panneau : 12px − 1mm pour remonter le texte dans le bandeau */
const PANEL_PADDING_TOP_PX = 12 - (1 * 96) / 25.4;

type PanelState = { open: boolean; pinned: boolean };

type PanelAction =
  | { type: 'hoverEnter' }
  | { type: 'delayedHoverClose' }
  | { type: 'toggleClick' }
  | { type: 'closeOutside' };

function panelReducer(state: PanelState, action: PanelAction): PanelState {
  switch (action.type) {
    case 'hoverEnter':
      if (!state.open) return { open: true, pinned: false };
      return state;
    case 'delayedHoverClose':
      if (!state.open || state.pinned) return state;
      return { open: false, pinned: false };
    case 'toggleClick':
      if (!state.open) return { open: true, pinned: true };
      if (state.pinned) return { open: false, pinned: false };
      return { open: true, pinned: true };
    case 'closeOutside':
      return { open: false, pinned: false };
    default:
      return state;
  }
}

/** Icône « i » : survol = panneau temporaire ; clic = reste ouvert jusqu’à second clic ou clic ailleurs. */
export function ProposalDescriptionInfo({ description }: { description: string | null | undefined }) {
  const text = (description ?? '').trim();
  const [{ open, pinned }, dispatch] = useReducer(panelReducer, { open: false, pinned: false });
  const wrapRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [panelStyle, setPanelStyle] = useState<CSSProperties>({});

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current != null) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    if (pinned) return;
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => {
      closeTimerRef.current = null;
      dispatch({ type: 'delayedHoverClose' });
    }, HOVER_CLOSE_DELAY_MS);
  }, [pinned, clearCloseTimer]);

  const openPanel = useCallback(() => {
    clearCloseTimer();
    dispatch({ type: 'hoverEnter' });
  }, [clearCloseTimer]);

  const updatePosition = () => {
    const btn = btnRef.current;
    if (!btn || typeof window === 'undefined') return;
    const r = btn.getBoundingClientRect();
    const maxW = Math.min(320, window.innerWidth - 24);
    const left = Math.max(
      12,
      Math.min(r.right - maxW + PANEL_SHIFT_RIGHT_PX, window.innerWidth - maxW - 12)
    );
    setPanelStyle({
      position: 'fixed',
      top: r.bottom + PANEL_TOP_GAP_PX,
      left,
      width: maxW,
      maxHeight: Math.min(PANEL_MAX_HEIGHT_PX, window.innerHeight - r.bottom - 16),
    });
  };

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
    const onScroll = () => updatePosition();
    const onResize = () => updatePosition();
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (wrapRef.current?.contains(t)) return;
      if (panelRef.current?.contains(t)) return;
      clearCloseTimer();
      dispatch({ type: 'closeOutside' });
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open, clearCloseTimer]);

  useEffect(() => () => clearCloseTimer(), [clearCloseTimer]);

  if (!text) return null;

  const panel = open ? (
    <div
      ref={panelRef}
      role="dialog"
      aria-label="Description"
      onMouseEnter={clearCloseTimer}
      onMouseLeave={scheduleClose}
      style={{
        ...panelStyle,
        overflowY: 'auto',
        padding: `${PANEL_PADDING_TOP_PX}px 14px 12px 14px`,
        fontSize: 13,
        fontWeight: 400,
        lineHeight: 1.45,
        color: '#1d1d1f',
        backgroundColor: '#fff',
        border: '1px solid #e8e6e3',
        borderRadius: 12,
        boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
        zIndex: 9999,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        textAlign: 'justify',
        hyphens: 'auto',
        boxSizing: 'border-box',
      }}
    >
      {text}
    </div>
  )
    : null;

  return (
    <>
      <div
        ref={wrapRef}
        style={{ position: 'relative', flexShrink: 0, lineHeight: 0, display: 'block' }}
        onMouseEnter={openPanel}
        onMouseLeave={scheduleClose}
      >
        <button
          ref={btnRef}
          type="button"
          className="proposal-description-info-btn"
          aria-label="Description du produit"
          aria-expanded={open}
          onClick={() => {
            clearCloseTimer();
            dispatch({ type: 'toggleClick' });
          }}
          style={{
            display: 'block',
            padding: '0 0 0.04em 0',
            margin: 0,
            border: 'none',
            borderRadius: 4,
            backgroundColor: 'transparent',
            color: '#6e6e73',
            cursor: 'pointer',
            flexShrink: 0,
            fontSize: 'inherit',
            lineHeight: 0,
            boxSizing: 'border-box',
            verticalAlign: 'bottom',
            transform: 'translateY(0.17em)',
          }}
        >
          <Info
            strokeWidth={2}
            aria-hidden
            style={{ width: '0.92em', height: '0.92em', display: 'block' }}
          />
        </button>
      </div>
      {typeof document !== 'undefined' && panel ? createPortal(panel, document.body) : null}
    </>
  );
}
