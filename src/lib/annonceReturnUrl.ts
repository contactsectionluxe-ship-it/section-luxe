/**
 * URL de retour depuis la page annonce (catalogue filtré, favoris) sans polluer l’URL partagée.
 * Stockage session (navigateur), même origine uniquement.
 */

export const ANNONCE_RETURN_URL_STORAGE_KEY = 'luxe-annonce-return-url';

export function normalizeInternalPath(path: string): string {
  const p = (path || '').trim();
  if (!p) return '/catalogue';
  return p.startsWith('/') ? p : `/${p}`;
}

/** Autorise uniquement des chemins internes (pas de //, pas de schéma). */
export function isSafeInternalReturnUrl(path: string): boolean {
  if (!path || path.length > 2048) return false;
  if (path.includes('://') || path.includes('//')) return false;
  const p = normalizeInternalPath(path);
  if (p.startsWith('/catalogue')) return true;
  if (p === '/favoris' || p.startsWith('/favoris?')) return true;
  return false;
}

/**
 * À appeler au clic sur un lien vers une annonce (catalogue, favoris).
 */
export function setAnnonceReturnUrlForNextNavigation(url: string): void {
  if (typeof window === 'undefined') return;
  if (!isSafeInternalReturnUrl(url)) return;
  try {
    sessionStorage.setItem(ANNONCE_RETURN_URL_STORAGE_KEY, normalizeInternalPath(url));
  } catch {
    // quota / mode privé
  }
}

export function readAnnonceReturnUrlFromStorage(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const s = sessionStorage.getItem(ANNONCE_RETURN_URL_STORAGE_KEY);
    if (!s || !isSafeInternalReturnUrl(s)) return null;
    return normalizeInternalPath(s);
  } catch {
    return null;
  }
}
