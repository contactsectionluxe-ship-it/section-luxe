/** Logique partagée section Prix (page produit) et étiquette catalogue. */

export function getDealLevel(
  price: number,
  average: number
): { label: string; color: string; description: string } {
  if (price <= average * 0.85)
    return {
      label: 'Très bonne affaire',
      color: '#248a3d',
      description: 'Le prix est très en-dessous de la moyenne des articles similaires.',
    };
  if (price <= average * 0.95)
    return {
      label: 'Bonne affaire',
      color: '#248a3d',
      description: 'Le prix est en-dessous de la moyenne des articles similaires.',
    };
  if (price <= average * 1.05)
    return {
      label: 'Offre équitable',
      color: '#6e6e73',
      description: 'Le prix est dans la moyenne des articles similaires.',
    };
  return {
    label: 'Au-dessus du marché',
    color: '#ff9500',
    description: 'Le prix est supérieur à la moyenne des prix des articles similaires.',
  };
}

export function getDealDefault(): { label: string; color: string; description: string } {
  return {
    label: 'Offre équitable',
    color: '#6e6e73',
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
    case 'Très bonne affaire':
      return 0.125; // premier segment vert
    case 'Bonne affaire':
      return 0.375; // second segment vert
    case 'Offre équitable':
      return 0.625; // segment gris
    case 'Au-dessus du marché':
      return 0.875; // segment orange
    default:
      return 0.625;
  }
}
