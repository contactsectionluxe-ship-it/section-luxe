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
