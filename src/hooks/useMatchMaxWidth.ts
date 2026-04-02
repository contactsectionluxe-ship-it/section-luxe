'use client';

import { useEffect, useState } from 'react';

/** `true` lorsque la fenêtre est au plus `maxPx` px de large (ex. mobile). */
export function useMatchMaxWidth(maxPx: number): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${maxPx}px)`);
    const sync = () => setMatches(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, [maxPx]);

  return matches;
}
