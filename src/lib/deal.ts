/** Logique partagée section Prix (page produit) et étiquette catalogue. */

/** Badges / texte / bordures : verts, gris et ambre plus clairs (lisibles sur fond blanc). */
const DEAL_COLOR_GOOD = '#5db883';
const DEAL_COLOR_FAIR = '#a8a8b0';
const DEAL_COLOR_HIGH = '#ffb14d';

/** Segments de la barre « indicateur de marché » (du meilleur prix au plus élevé), tons assortis. */
export const DEAL_MARKET_BAR_SEGMENT_COLORS = ['#6ec498', '#8fd9b0', '#c4c4ca', '#ffd6a3'] as const;

export function getDealLevel(
  price: number,
  average: number
): { label: string; color: string; description: string } {
  if (price <= average * 0.85)
    return {
      label: 'Très bonne offre',
      color: DEAL_COLOR_GOOD,
      description: 'Le prix est très en-dessous de la moyenne des articles similaires.',
    };
  if (price <= average * 0.95)
    return {
      label: 'Bonne offre',
      color: DEAL_COLOR_GOOD,
      description: 'Le prix est en-dessous de la moyenne des articles similaires.',
    };
  if (price <= average * 1.05)
    return {
      label: 'Offre juste',
      color: DEAL_COLOR_FAIR,
      description: 'Le prix est dans la moyenne des articles similaires.',
    };
  return {
    label: 'Offre élevée',
    color: DEAL_COLOR_HIGH,
    description: 'Le prix est supérieur à la moyenne des prix des articles similaires.',
  };
}

export function getDealDefault(): { label: string; color: string; description: string } {
  return {
    label: 'Offre juste',
    color: DEAL_COLOR_FAIR,
    description:
      "Le prix de l'annonce est dans la moyenne des prix des annonces similaires.",
  };
}

export function getBarPosition(price: number, min: number, max: number): number {
  if (max <= min) return 0.5;
  return Math.max(0, Math.min(1, (price - min) / (max - min)));
}

/** Position de la flèche (0–1) selon le niveau d'affaire pour l’aligner sur le bon segment (vert / gris / orange). */
export function getBarPositionFromDeal(deal: { label: string }): number {
  switch (deal.label) {
    case 'Très bonne offre':
      return 0.125; // premier segment vert
    case 'Bonne offre':
      return 0.375; // second segment vert
    case 'Offre juste':
      return 0.625; // segment gris
    case 'Offre élevée':
      return 0.875; // segment orange
    default:
      return 0.625;
  }
}
