'use client';

import { useEffect } from 'react';

let lockDepth = 0;
let snapshot: { htmlOverflow: string; bodyOverflow: string; bodyPaddingRight: string } | null = null;

function applyScrollLock() {
  lockDepth += 1;
  if (lockDepth > 1) return;
  const html = document.documentElement;
  const body = document.body;
  snapshot = {
    htmlOverflow: html.style.overflow,
    bodyOverflow: body.style.overflow,
    bodyPaddingRight: body.style.paddingRight,
  };
  const scrollbarGap = window.innerWidth - html.clientWidth;
  html.style.overflow = 'hidden';
  body.style.overflow = 'hidden';
  if (scrollbarGap > 0) {
    body.style.paddingRight = `${scrollbarGap}px`;
  }
}

function releaseScrollLock() {
  if (lockDepth <= 0) return;
  lockDepth -= 1;
  if (lockDepth > 0) return;
  if (!snapshot) return;
  const html = document.documentElement;
  const body = document.body;
  html.style.overflow = snapshot.htmlOverflow;
  body.style.overflow = snapshot.bodyOverflow;
  body.style.paddingRight = snapshot.bodyPaddingRight;
  snapshot = null;
}

/**
 * Empêche le défilement du document quand une modale / overlay est ouvert (évite les sauts et le scroll de fond sur mobile).
 * Réentrant : plusieurs modales empilées ne libèrent le scroll qu’à la fermeture de la dernière.
 */
export function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    applyScrollLock();
    return () => {
      releaseScrollLock();
    };
  }, [locked]);
}
