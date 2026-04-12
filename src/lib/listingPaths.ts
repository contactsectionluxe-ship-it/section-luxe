/**
 * URLs publiques d’annonce : préférer le numéro court (10K2001…) au lieu de l’UUID pour le partage et la navigation.
 */

/** Segment d’URL pour `/annonce/[segment]` — numéro d’annonce si présent, sinon UUID. */
export function listingPublicPathSegment(listing: { id: string; listingNumber?: string | null }): string {
  const n = listing.listingNumber?.trim();
  if (n) return n;
  return listing.id;
}

/** Chemin `/annonce/…` sans query (segment encodé pour les caractères réservés et partage stable). */
export function listingAnnoncePath(listing: { id: string; listingNumber?: string | null }): string {
  const segment = listingPublicPathSegment(listing);
  return `/annonce/${encodeURIComponent(segment)}`;
}

const LISTING_UUID_IN_SEGMENT =
  /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i;
/** Numéro public type 10K2004, 11K1001 (cf. get_next_listing_number). */
const LISTING_NUMBER_IN_SEGMENT = /^([0-9]{2,3}K[0-9]+)/i;

/**
 * Depuis le segment `[id]` décodé : retourne uniquement l’UUID ou le numéro d’annonce.
 * Quand un OS fusionne texte + URL au partage, on peut recevoir `10K2004 Accéder à…` → évite l’échec de getListing et la redirection catalogue.
 */
export function normalizeAnnoncePublicIdFromSegment(segment: string): string {
  let s = (segment || '').trim();
  if (!s) return '';
  const urlMatch = /\/annonce\/([^/?#]+)/i.exec(s);
  if (urlMatch) {
    try {
      s = decodeURIComponent(urlMatch[1]);
    } catch {
      s = urlMatch[1];
    }
  }
  const uuid = LISTING_UUID_IN_SEGMENT.exec(s);
  if (uuid) return uuid[1];
  const num = LISTING_NUMBER_IN_SEGMENT.exec(s);
  if (num) return num[1];
  const firstToken = s.split(/\s+/)[0] ?? '';
  const noSecondUrl = firstToken.split(/https?:\/\//i)[0]?.trim() ?? firstToken;
  return noSecondUrl;
}
