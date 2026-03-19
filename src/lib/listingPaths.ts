/**
 * URLs publiques d’annonce : préférer le numéro court (10K2001…) au lieu de l’UUID pour le partage.
 */

/** Segment d’URL pour `/annonce/[segment]` — numéro d’annonce si présent, sinon UUID. */
export function listingPublicPathSegment(listing: { id: string; listingNumber?: string | null }): string {
  const n = listing.listingNumber?.trim();
  if (n) return n;
  return listing.id;
}

/** Chemin `/annonce/…` sans query. */
export function listingAnnoncePath(listing: { id: string; listingNumber?: string | null }): string {
  return `/annonce/${listingPublicPathSegment(listing)}`;
}
