/**
 * Position verticale du document : sur certains navigateurs mobiles (Safari iOS),
 * `window.scrollY` peut rester à 0 alors que le défilement réel est sur `documentElement` / `body`.
 */
export function getDocumentScrollY(): number {
  if (typeof window === 'undefined') return 0;
  const w = window.scrollY ?? window.pageYOffset ?? 0;
  const root = document.documentElement?.scrollTop ?? 0;
  const body = document.body?.scrollTop ?? 0;
  return Math.max(w, root, body);
}

/** Applique le scroll vertical en forçant aussi html/body (meilleure prise en charge WebKit mobile). */
export function setDocumentScrollY(top: number, behavior: ScrollBehavior = 'auto'): void {
  if (typeof window === 'undefined') return;
  const maxY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  const y = Math.min(Math.max(0, top), maxY);
  window.scrollTo({ top: y, left: 0, behavior });
  if (behavior === 'auto') {
    document.documentElement.scrollTop = y;
    document.body.scrollTop = y;
  }
}
