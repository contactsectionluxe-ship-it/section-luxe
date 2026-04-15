import type { Listing } from '@/types';
import { getArticleTypeLabel } from '@/lib/constants';

/** Titre d’annonce : celui enregistré (avec texte personnalisé) ou recalcul marque - type/modèle en secours. */
export function getListingDisplayTitle(listing: Listing): string {
  if (listing.title && listing.title.trim()) return listing.title;
  const typeLabel = getArticleTypeLabel(listing.category, listing.genre ?? ['femme', 'homme'], listing.articleType);
  const marque = listing.brand || listing.title;
  const typeModel =
    listing.category === 'vetements' && typeLabel.includes(' & ') ? (listing.model ?? '') : [typeLabel, listing.model].filter(Boolean).join(' ');
  return typeModel ? `${marque} - ${typeModel}` : marque;
}

/** Marque sur une ligne, titre sur la ligne suivante (sans dupliquer « Marque - … » dans le titre). Grille « À la une » / catalogue. */
export function listingFeaturedBrandTitleParts(listing: Listing): { brand: string | null; rest: string } {
  const full = getListingDisplayTitle(listing).trim();
  const brand = (listing.brand || '').trim();
  if (!brand) return { brand: null, rest: full };
  const escaped = brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const stripped = full.replace(new RegExp(`^${escaped}\\s*-\\s*`, 'i'), '').trim();
  if (!stripped) return { brand: null, rest: full };
  return { brand, rest: stripped !== full ? stripped : full };
}
