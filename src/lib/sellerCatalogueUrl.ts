/**
 * URLs catalogue vendeur lisibles : /catalogue/vendeur/{slug-nom}-{8 hex du début d'UUID}
 */

/** Slug ASCII pour l’URL (sans accents, tirets). */
export function slugifyCompanyName(name: string): string {
  const s = name
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return s || 'vendeur';
}

/** 8 premiers caractères hex de l’UUID (sans tirets). */
export function uuidFirstBlock(uid: string): string {
  return uid.replace(/-/g, '').slice(0, 8).toLowerCase();
}

/** Segment unique : nom-slug + préfixe UUID (évite collisions). */
export function sellerCatalogueSlug(seller: { uid: string; companyName: string }): string {
  return `${slugifyCompanyName(seller.companyName)}-${uuidFirstBlock(seller.uid)}`;
}

export function sellerCataloguePath(seller: { uid: string; companyName: string }): string {
  return `/catalogue/vendeur/${sellerCatalogueSlug(seller)}`;
}

/**
 * URL absolue de la liste publique des annonces du vendeur (même page que les liens « boutique » du site).
 * Ex. `https://…/catalogue/vendeur/section-luxe-b32c9dac`
 */
export function sellerCatalogueAbsoluteUrl(origin: string, seller: { uid: string; companyName: string }): string {
  const path = sellerCataloguePath(seller);
  try {
    return new URL(path, origin.endsWith('/') ? origin : `${origin}/`).href;
  } catch {
    const base = origin.replace(/\/$/, '');
    return `${base}${path}`;
  }
}

/**
 * Lien partagé / ouvert depuis un message : ajoute `sellerId` pour que le catalogue ait l’UUID vendeur
 * dès le premier rendu (sans attendre la RPC slug → id). Le catalogue retire ensuite ce paramètre de l’URL.
 */
export function sellerCatalogueShareAbsoluteUrl(origin: string, seller: { uid: string; companyName: string }): string {
  const base = sellerCatalogueAbsoluteUrl(origin, seller);
  try {
    const u = new URL(base);
    u.searchParams.set('sellerId', seller.uid);
    return u.href;
  } catch {
    const sep = base.includes('?') ? '&' : '?';
    return `${base}${sep}sellerId=${encodeURIComponent(seller.uid)}`;
  }
}

/** Alias pour les liens (<Link href={…}>). */
export const sellerCatalogueHref = sellerCataloguePath;

/**
 * Parse `/catalogue/vendeur/{slug}` : dernier segment après le dernier tiret = 8 hex.
 */
export function parseVendeurCatalogueSlug(slug: string): { nameSlug: string; uuidPrefix: string } | null {
  const decoded = decodeURIComponent(slug).trim();
  const lastHyphen = decoded.lastIndexOf('-');
  if (lastHyphen <= 0) return null;
  const uuidPrefix = decoded.slice(lastHyphen + 1).toLowerCase();
  if (!/^[0-9a-f]{8}$/.test(uuidPrefix)) return null;
  const nameSlug = decoded.slice(0, lastHyphen);
  if (!nameSlug.length) return null;
  return { nameSlug, uuidPrefix };
}
