// Types d'articles
export const ARTICLE_TYPES = [
  { value: 'sacs', label: 'Sacs' },
  { value: 'montres', label: 'Montres' },
  { value: 'bijoux', label: 'Bijoux' },
  { value: 'vetements', label: 'Vêtements' },
  { value: 'chaussures', label: 'Chaussures' },
  { value: 'accessoires', label: 'Accessoires' },
  { value: 'autre', label: 'Autre' },
];

// Marques de luxe
export const LUXURY_BRANDS = [
  'Hermès',
  'Louis Vuitton',
  'Chanel',
  'Dior',
  'Gucci',
  'Prada',
  'Cartier',
  'Rolex',
  'Omega',
  'Patek Philippe',
  'Audemars Piguet',
  'Van Cleef & Arpels',
  'Bulgari',
  'Tiffany & Co.',
  'Céline',
  'Bottega Veneta',
  'Saint Laurent',
  'Balenciaga',
  'Fendi',
  'Valentino',
  'Burberry',
  'Loewe',
  'Givenchy',
  'Goyard',
  'Berluti',
];

// États
export const CONDITIONS = [
  { value: 'neuf', label: 'Neuf' },
  { value: 'tres_bon', label: 'Très bon état' },
  { value: 'bon', label: 'Bon état' },
  { value: 'correct', label: 'État correct' },
];

// Couleurs
export const COLORS = [
  { value: 'noir', label: 'Noir' },
  { value: 'blanc', label: 'Blanc' },
  { value: 'beige', label: 'Beige' },
  { value: 'marron', label: 'Marron' },
  { value: 'bleu', label: 'Bleu' },
  { value: 'rouge', label: 'Rouge' },
  { value: 'rose', label: 'Rose' },
  { value: 'vert', label: 'Vert' },
  { value: 'or', label: 'Or' },
  { value: 'argent', label: 'Argent' },
  { value: 'multicolore', label: 'Multicolore' },
];

// Matériaux
export const MATERIALS = [
  { value: 'cuir', label: 'Cuir' },
  { value: 'cuir_exotique', label: 'Cuir exotique' },
  { value: 'toile', label: 'Toile' },
  { value: 'or', label: 'Or' },
  { value: 'or_blanc', label: 'Or blanc' },
  { value: 'or_rose', label: 'Or rose' },
  { value: 'platine', label: 'Platine' },
  { value: 'acier', label: 'Acier' },
  { value: 'argent', label: 'Argent' },
  { value: 'diamant', label: 'Diamant' },
  { value: 'soie', label: 'Soie' },
  { value: 'cachemire', label: 'Cachemire' },
];

// Régions
export const REGIONS = [
  { value: 'ile_de_france', label: 'Île-de-France' },
  { value: 'provence', label: 'Provence-Alpes-Côte d\'Azur' },
  { value: 'auvergne', label: 'Auvergne-Rhône-Alpes' },
  { value: 'nouvelle_aquitaine', label: 'Nouvelle-Aquitaine' },
  { value: 'occitanie', label: 'Occitanie' },
  { value: 'bretagne', label: 'Bretagne' },
  { value: 'normandie', label: 'Normandie' },
  { value: 'hauts_de_france', label: 'Hauts-de-France' },
  { value: 'grand_est', label: 'Grand Est' },
  { value: 'pays_de_la_loire', label: 'Pays de la Loire' },
];

// Années (générer de l'année actuelle à 1950)
export const YEARS = Array.from(
  { length: new Date().getFullYear() - 1949 },
  (_, i) => new Date().getFullYear() - i
);
