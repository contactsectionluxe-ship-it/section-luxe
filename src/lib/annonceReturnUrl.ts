/**
 * URL de retour depuis la page annonce (catalogue filtré, favoris) sans polluer l’URL partagée.
 * Stockage session (navigateur), même origine uniquement.
 */

import { getDocumentScrollY } from '@/lib/documentScroll';

export const ANNONCE_RETURN_URL_STORAGE_KEY = 'luxe-annonce-return-url';

/** Position de scroll à restaurer sur le catalogue (même effet que le retour navigateur). */
export const CATALOGUE_SCROLL_RESTORE_KEY = 'luxe-catalogue-scroll-restore';

type CatalogueScrollPayload = { y: number; href: string };

function catalogueHrefsEquivalent(stored: string, current: string): boolean {
  const a = normalizeInternalPath(stored);
  const b = normalizeInternalPath(current);
  if (a === b) return true;
  try {
    const ua = new URL(a, 'https://local.invalid');
    const ub = new URL(b, 'https://local.invalid');
    if (ua.pathname !== ub.pathname) return false;
    const sa = new URLSearchParams(ua.search);
    const sb = new URLSearchParams(ub.search);
    const keys = new Set([...sa.keys(), ...sb.keys()]);
    for (const k of keys) {
      if (sa.getAll(k).join('\0') !== sb.getAll(k).join('\0')) return false;
    }
    return true;
  } catch {
    return false;
  }
}

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
  if (p === '/' || p.startsWith('/?')) return true;
  return false;
}

/**
 * À appeler au clic sur un lien vers une annonce (catalogue, favoris).
 */
export function setAnnonceReturnUrlForNextNavigation(url: string): void {
  if (typeof window === 'undefined') return;
  if (!isSafeInternalReturnUrl(url)) return;
  const normalized = normalizeInternalPath(url);
  try {
    sessionStorage.setItem(ANNONCE_RETURN_URL_STORAGE_KEY, normalized);
    /* Mémoriser le scroll pour retour catalogue (URL complète incl. view=line si besoin). */
    const path = window.location.pathname;
    const onCatalogue = path.startsWith('/catalogue');
    const targetsCatalogue = normalized.startsWith('/catalogue');
    /* Repère de scroll uniquement pour le catalogue : pas sur l’accueil (retour sans repositionnement). */
    if (targetsCatalogue && onCatalogue) {
      const payload: CatalogueScrollPayload = { y: getDocumentScrollY(), href: normalized };
      sessionStorage.setItem(CATALOGUE_SCROLL_RESTORE_KEY, JSON.stringify(payload));
    }
  } catch {
    // quota / mode privé
  }
}

/**
 * Si l’URL courante correspond à celle mémorisée avec le scroll, retourne `y` et supprime l’entrée.
 * Sinon supprime l’entrée si elle ne correspond pas (évite une restauration plus tard par erreur).
 */
/** Lit la position à restaurer sans retirer l’entrée (pour reporter le scroll après le chargement des annonces). */
export function peekCatalogueScrollRestore(currentHref: string): number | null {
  if (typeof window === 'undefined') return null;
  let raw: string | null = null;
  try {
    raw = sessionStorage.getItem(CATALOGUE_SCROLL_RESTORE_KEY);
  } catch {
    return null;
  }
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as CatalogueScrollPayload;
    if (typeof parsed.y !== 'number' || typeof parsed.href !== 'string') {
      return null;
    }
    const cur = normalizeInternalPath(currentHref);
    if (!catalogueHrefsEquivalent(parsed.href, cur)) {
      return null;
    }
    return Math.max(0, parsed.y);
  } catch {
    return null;
  }
}

export function consumeCatalogueScrollRestore(currentHref: string): number | null {
  if (typeof window === 'undefined') return null;
  let raw: string | null = null;
  try {
    raw = sessionStorage.getItem(CATALOGUE_SCROLL_RESTORE_KEY);
  } catch {
    return null;
  }
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as CatalogueScrollPayload;
    if (typeof parsed.y !== 'number' || typeof parsed.href !== 'string') {
      sessionStorage.removeItem(CATALOGUE_SCROLL_RESTORE_KEY);
      return null;
    }
    const cur = normalizeInternalPath(currentHref);
    if (!catalogueHrefsEquivalent(parsed.href, cur)) {
      sessionStorage.removeItem(CATALOGUE_SCROLL_RESTORE_KEY);
      return null;
    }
    sessionStorage.removeItem(CATALOGUE_SCROLL_RESTORE_KEY);
    return Math.max(0, parsed.y);
  } catch {
    try {
      sessionStorage.removeItem(CATALOGUE_SCROLL_RESTORE_KEY);
    } catch {
      /* ignore */
    }
    return null;
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
