'use client';

import { useLayoutEffect, useRef, type CSSProperties, type ReactNode } from 'react';

const MOBILE_MAX = 1023;
const MIN_PX = 9;
const MAX_PX = 64;

export type FluidOneLineHeadingProps = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
};

/**
 * Sur mobile : calcule la plus grande font-size pour que le texte tienne sur une ligne
 * et occupe toute la largeur utile (scrollWidth ≈ clientWidth).
 */
export function FluidOneLineHeading({ children, className, style }: FluidOneLineHeadingProps) {
  const ref = useRef<HTMLHeadingElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const fit = () => {
      if (window.innerWidth > MOBILE_MAX) {
        el.style.removeProperty('--vendeur-title-fs');
        return;
      }

      const available = el.clientWidth;
      if (available < 12) return;

      let lo = MIN_PX;
      let hi = MAX_PX;
      for (let i = 0; i < 28; i++) {
        const mid = (lo + hi) / 2;
        el.style.setProperty('--vendeur-title-fs', `${mid}px`);
        if (el.scrollWidth <= available + 1) lo = mid;
        else hi = mid;
      }
      el.style.setProperty('--vendeur-title-fs', `${lo}px`);
    };

    const ro = new ResizeObserver(fit);
    ro.observe(el);

    const onWin = () => fit();
    window.addEventListener('resize', onWin);

    const fonts = document.fonts;
    if (fonts?.ready) {
      void fonts.ready.then(fit);
    } else {
      fit();
    }

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', onWin);
    };
  }, []);

  return (
    <h2 ref={ref} className={className} style={style}>
      {children}
    </h2>
  );
}
