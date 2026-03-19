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
