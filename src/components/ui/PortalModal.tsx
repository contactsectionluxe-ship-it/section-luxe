'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

export type PortalModalProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Au-dessus du header (z-index ~100). */
  zIndex?: number;
  /** Padding autour du panneau (px). */
  padding?: number;
};

/**
 * Modale centrée dans un portail `document.body` : fond assombri, animation d’entrée/sortie, blocage du scroll arrière-plan.
 */
export function PortalModal({ open, onClose, children, zIndex = 120, padding = 24 }: PortalModalProps) {
  const [mounted, setMounted] = useState(false);
  const reduceMotion = useReducedMotion();
  useBodyScrollLock(open);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const t = reduceMotion ? { duration: 0.01 } : { duration: 0.22, ease: [0.22, 1, 0.36, 1] as const };
  const tBackdrop = reduceMotion ? { duration: 0.01 } : { duration: 0.18, ease: 'easeOut' as const };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence mode="wait">
      {open && (
        <motion.div
          key="portal-modal-layer"
          role="presentation"
          className="portal-modal-root"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding,
            boxSizing: 'border-box',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={tBackdrop}
        >
          <motion.div
            role="presentation"
            aria-hidden
            className="portal-modal-backdrop"
            style={{
              position: 'absolute',
              inset: 0,
              cursor: 'pointer',
              backgroundColor: 'rgba(0,0,0,0.4)',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={tBackdrop}
            onClick={onClose}
          />
          <motion.div
            className="portal-modal-panel-wrap"
            style={{
              position: 'relative',
              zIndex: 1,
              width: '100%',
              maxWidth: 'min(100%, 100vw - 32px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={t}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ pointerEvents: 'auto', width: '100%' }}>{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
