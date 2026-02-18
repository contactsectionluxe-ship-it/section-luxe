import { ALL_BRANDS } from './brands-list';

/** Seul ce compte voit le menu Admin et peut accéder à /admin */
export const ADMIN_EMAIL = 'contact.sectionluxe@gmail.com';

export function isAdminEmail(email: string | null | undefined): boolean {
  return email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

// ——— Catalogue / Filtres ———

export const ARTICLE_TYPES = [
  { value: 'bag', label: 'Sacs' },
  { value: 'watch', label: 'Montres' },
  { value: 'jewelry', label: 'Bijoux' },
  { value: 'accessory', label: 'Accessoires' },
  { value: 'clothing', label: 'Vêtements' },
  { value: 'shoes', label: 'Chaussures' },
  { value: 'other', label: 'Autre' },
];

export const LUXURY_BRANDS = [
  'Hermès',
  'Louis Vuitton',
  'Chanel',
  'Gucci',
  'Prada',
  'Dior',
  'Cartier',
  'Rolex',
  'Audemars Piguet',
  'Patek Philippe',
  'Van Cleef & Arpels',
  'Bulgari',
  'Tiffany',
  'Saint Laurent',
  'Bottega Veneta',
  'Fendi',
  'Loewe',
  'Autre',
];

/** Options d’état (alignées sur le formulaire « Déposer une annonce »). */
export const CONDITIONS = [
  { value: 'new', label: 'Neuf' },
  { value: 'very_good', label: 'Très bon état' },
  { value: 'good', label: 'Bon état' },
  { value: 'correct', label: 'État correct' },
];

export const COLORS = [
  { value: 'black', label: 'Noir' },
  { value: 'white', label: 'Blanc' },
  { value: 'beige', label: 'Beige' },
  { value: 'brown', label: 'Marron' },
  { value: 'navy', label: 'Bleu marine' },
  { value: 'red', label: 'Rouge' },
  { value: 'pink', label: 'Rose' },
  { value: 'green', label: 'Vert' },
  { value: 'gold', label: 'Or' },
  { value: 'silver', label: 'Argent' },
  { value: 'grey', label: 'Gris' },
  { value: 'other', label: 'Autre' },
];

/** Couleurs proposées par catégorie (adaptées à la catégorie, marque, modèle, matière). */
const _c = (v: string, l: string) => ({ value: v, label: l });
export const COLORS_BY_CATEGORY: Record<string, { value: string; label: string }[]> = {
  sacs: [
    _c('black', 'Noir'), _c('white', 'Blanc'), _c('beige', 'Beige'), _c('brown', 'Marron'),
    _c('camel', 'Camel'), _c('tan', 'Tan'), _c('taupe', 'Taupe'), _c('navy', 'Bleu marine'),
    _c('red', 'Rouge'), _c('burgundy', 'Bordeaux'), _c('pink', 'Rose'), _c('green', 'Vert'),
    _c('grey', 'Gris'), _c('cognac', 'Cognac'), _c('gold', 'Or'), _c('silver', 'Argent'),
    _c('multicolor', 'Multicolore'), _c('other', 'Autre'),
  ],
  maroquinerie: [
    _c('black', 'Noir'), _c('white', 'Blanc'), _c('beige', 'Beige'), _c('brown', 'Marron'),
    _c('camel', 'Camel'), _c('tan', 'Tan'), _c('taupe', 'Taupe'), _c('navy', 'Bleu marine'),
    _c('red', 'Rouge'), _c('burgundy', 'Bordeaux'), _c('pink', 'Rose'), _c('green', 'Vert'),
    _c('grey', 'Gris'), _c('cognac', 'Cognac'), _c('gold', 'Or'), _c('silver', 'Argent'),
    _c('multicolor', 'Multicolore'), _c('other', 'Autre'),
  ],
  montres: [
    _c('black', 'Noir'), _c('white', 'Blanc'), _c('silver', 'Argent'), _c('grey', 'Gris'),
    _c('gold', 'Or'), _c('rose_gold', 'Or rose'), _c('two_tone', 'Bicolore'), _c('blue', 'Bleu'),
    _c('green', 'Vert'), _c('brown', 'Marron'), _c('navy', 'Bleu marine'), _c('bronze', 'Bronze'),
    _c('champagne', 'Champagne'), _c('other', 'Autre'),
  ],
  bijoux: [
    _c('gold', 'Or'), _c('silver', 'Argent'), _c('rose_gold', 'Or rose'), _c('white_gold', 'Or blanc'),
    _c('platinum', 'Platine'), _c('black', 'Noir'), _c('white', 'Blanc'), _c('two_tone', 'Bicolore'),
    _c('blue', 'Bleu'), _c('green', 'Vert'), _c('red', 'Rouge'), _c('pink', 'Rose'),
    _c('multicolor', 'Multicolore'), _c('champagne', 'Champagne'), _c('other', 'Autre'),
  ],
  vetements: [
    _c('black', 'Noir'), _c('white', 'Blanc'), _c('beige', 'Beige'), _c('brown', 'Marron'),
    _c('grey', 'Gris'), _c('navy', 'Bleu marine'), _c('blue', 'Bleu'), _c('red', 'Rouge'),
    _c('burgundy', 'Bordeaux'), _c('pink', 'Rose'), _c('green', 'Vert'), _c('camel', 'Camel'),
    _c('cream', 'Crème'), _c('denim', 'Denim'), _c('other', 'Autre'),
  ],
  chaussures: [
    _c('black', 'Noir'), _c('white', 'Blanc'), _c('beige', 'Beige'), _c('brown', 'Marron'),
    _c('nude', 'Nude'), _c('tan', 'Tan'), _c('red', 'Rouge'), _c('navy', 'Bleu marine'),
    _c('grey', 'Gris'), _c('gold', 'Or'), _c('silver', 'Argent'), _c('multicolor', 'Multicolore'),
    _c('other', 'Autre'),
  ],
  accessoires: [
    _c('black', 'Noir'), _c('white', 'Blanc'), _c('beige', 'Beige'), _c('brown', 'Marron'),
    _c('navy', 'Bleu marine'), _c('red', 'Rouge'), _c('pink', 'Rose'), _c('green', 'Vert'),
    _c('grey', 'Gris'), _c('gold', 'Or'), _c('silver', 'Argent'), _c('burgundy', 'Bordeaux'),
    _c('multicolor', 'Multicolore'), _c('other', 'Autre'),
  ],
  autre: [
    _c('black', 'Noir'), _c('white', 'Blanc'), _c('beige', 'Beige'), _c('brown', 'Marron'),
    _c('navy', 'Bleu marine'), _c('red', 'Rouge'), _c('pink', 'Rose'), _c('green', 'Vert'),
    _c('gold', 'Or'), _c('silver', 'Argent'), _c('grey', 'Gris'), _c('other', 'Autre'),
  ],
};

/** Tailles vêtements (dépôt annonce + filtre catalogue) */
export const CLOTHING_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'] as const;

function shoeSizesInRange(min: number, max: number): string[] {
  return Array.from(
    { length: (max - min) * 2 + 1 },
    (_, i) => {
      const v = min + i * 0.5;
      return Number.isInteger(v) ? String(v) : v.toFixed(1);
    }
  );
}

/** Pointures chaussures (dépôt annonce + filtre catalogue), 34 à 48 avec demi-pointures (.5) */
export const SHOE_SIZES = shoeSizesInRange(34, 48);

/** Pointures femme (dépôt annonce), 34 à 44 */
export const SHOE_SIZES_FEMME = shoeSizesInRange(34, 44);

/** Pointures homme (dépôt annonce), 38 à 48 */
export const SHOE_SIZES_HOMME = shoeSizesInRange(38, 48);

/** Pointures proposées selon genre sélectionné (dépôt annonce) : femme 34–44, homme 38–48, les deux 34–48 */
export function getShoeSizesForGenre(genre: ('homme' | 'femme')[]): string[] {
  const hasFemme = genre.includes('femme');
  const hasHomme = genre.includes('homme');
  if (hasFemme && hasHomme) return SHOE_SIZES;
  if (hasFemme) return SHOE_SIZES_FEMME;
  if (hasHomme) return SHOE_SIZES_HOMME;
  return [];
}

/** Années pour filtre catalogue (année min/max), de l'année en cours à 1920 */
const currentYear = new Date().getFullYear();
export const YEARS = Array.from({ length: currentYear - 1920 + 1 }, (_, i) => currentYear - i);

/** Régions pour le filtre catalogue (France métropolitaine + DOM-TOM) */
export const REGIONS = [
  { value: 'idf', label: 'Île-de-France' },
  { value: 'paca', label: 'Provence-Alpes-Côte d\'Azur' },
  { value: 'auvergne-rhone-alpes', label: 'Auvergne-Rhône-Alpes' },
  { value: 'occitanie', label: 'Occitanie' },
  { value: 'nouvelle-aquitaine', label: 'Nouvelle-Aquitaine' },
  { value: 'hauts-de-france', label: 'Hauts-de-France' },
  { value: 'grand-est', label: 'Grand Est' },
  { value: 'bretagne', label: 'Bretagne' },
  { value: 'normandie', label: 'Normandie' },
  { value: 'pays-de-la-loire', label: 'Pays de la Loire' },
  { value: 'centre-val-de-loire', label: 'Centre-Val de Loire' },
  { value: 'bourgogne-franche-comte', label: 'Bourgogne-Franche-Comté' },
  { value: 'corse', label: 'Corse' },
  { value: 'dom-tom', label: 'DOM-TOM' },
  { value: 'autre', label: 'Autre' },
];

export const MATERIALS = [
  { value: 'leather', label: 'Cuir' },
  { value: 'canvas', label: 'Toile' },
  { value: 'suede', label: 'Daim' },
  { value: 'gold', label: 'Or' },
  { value: 'silver', label: 'Argent' },
  { value: 'stainless_steel', label: 'Acier' },
  { value: 'precious_stone', label: 'Pierre précieuse' },
  { value: 'fabric', label: 'Tissu' },
  { value: 'other', label: 'Autre' },
];

/** Matières proposées par catégorie (puis par marque si défini). Clé = catégorie, puis marque optionnelle. */
const _m = (v: string, l: string) => ({ value: v, label: l });
export const MATIERES_BY_CATEGORY: Record<string, { value: string; label: string }[]> = {
  sacs: [
    _m('leather', 'Cuir'), _m('canvas', 'Toile'), _m('suede', 'Daim'), _m('fabric', 'Tissu'),
    _m('exotic_leather', 'Cuir exotique'), _m('calfskin', 'Veau'), _m('goatskin', 'Chèvre'), _m('epsom', 'Epsom'),
    _m('togo', 'Togo'), _m('clemence', 'Clémence'), _m('other', 'Autre'),
  ],
  maroquinerie: [
    _m('leather', 'Cuir'), _m('canvas', 'Toile'), _m('suede', 'Daim'), _m('fabric', 'Tissu'),
    _m('exotic_leather', 'Cuir exotique'), _m('calfskin', 'Veau'), _m('other', 'Autre'),
  ],
  montres: [
    _m('stainless_steel', 'Acier'), _m('gold', 'Or'), _m('silver', 'Argent'), _m('two_tone', 'Bicolore'),
    _m('titanium', 'Titane'), _m('ceramic', 'Céramique'), _m('platinum', 'Platine'),
    _m('carbon', 'Carbone'), _m('bronze', 'Bronze'), _m('other', 'Autre'),
  ],
  bijoux: [
    _m('gold', 'Or'), _m('silver', 'Argent'), _m('platinum', 'Platine'), _m('precious_stone', 'Pierre précieuse'),
    _m('diamond', 'Diamant'), _m('pearl', 'Perle'), _m('enamel', 'Émail'), _m('two_tone', 'Bicolore'),
    _m('rose_gold', 'Or rose'), _m('white_gold', 'Or blanc'), _m('other', 'Autre'),
  ],
  vetements: [
    _m('fabric', 'Tissu'), _m('leather', 'Cuir'), _m('wool', 'Laine'), _m('cashmere', 'Cachemire'),
    _m('silk', 'Soie'), _m('cotton', 'Coton'), _m('tweed', 'Tweed'), _m('denim', 'Denim'),
    _m('suede', 'Daim'), _m('other', 'Autre'),
  ],
  chaussures: [
    _m('leather', 'Cuir'), _m('suede', 'Daim'), _m('fabric', 'Tissu'), _m('canvas', 'Toile'),
    _m('exotic_leather', 'Cuir exotique'), _m('patent_leather', 'Cuir verni'), _m('other', 'Autre'),
  ],
  accessoires: [
    _m('leather', 'Cuir'), _m('canvas', 'Toile'), _m('fabric', 'Tissu'), _m('metal', 'Métal'),
    _m('silk', 'Soie'), _m('gold', 'Or'), _m('silver', 'Argent'), _m('other', 'Autre'),
  ],
  autre: [
    _m('leather', 'Cuir'), _m('canvas', 'Toile'), _m('suede', 'Daim'), _m('fabric', 'Tissu'),
    _m('gold', 'Or'), _m('silver', 'Argent'), _m('stainless_steel', 'Acier'), _m('precious_stone', 'Pierre précieuse'),
    _m('other', 'Autre'),
  ],
};

/** Correspondance type d'article (value) → clés BRANDS_BY_CATEGORY. */
export const ARTICLE_TYPE_TO_BRAND_KEYS: Record<string, string[]> = {
  bag: ['sacs', 'maroquinerie'],
  watch: ['montres'],
  jewelry: ['bijoux'],
  accessory: ['accessoires'],
  clothing: ['vetements'],
  shoes: ['chaussures'],
  other: ['autre'],
};

/** Catégorie (valeur BDD, ex. sacs, montres) → clés pour BRANDS_BY_CATEGORY / MODELS etc. */
export const CATEGORY_TO_BRAND_KEYS: Record<string, string[]> = {
  sacs: ['sacs', 'maroquinerie'],
  montres: ['montres'],
  bijoux: ['bijoux'],
  vetements: ['vetements'],
  chaussures: ['chaussures'],
  accessoires: ['accessoires'],
  maroquinerie: ['maroquinerie', 'sacs'],
  autre: ['autre'],
};

/** Modèles par catégorie et marque (base : marques avec modèles détaillés). */
const _MODELS_BY_CATEGORY_BRAND_BASE: Record<string, Record<string, string[]>> = {
  sacs: {
    'Hermès': ['Birkin 25', 'Birkin 30', 'Birkin 35', 'Birkin 40', 'Kelly 25', 'Kelly 28', 'Kelly 32', 'Kelly 35', 'Constance', 'Lindy', 'Évelyne', 'Bolide', 'Picotin', 'Garden Party', 'Herbag', 'Roulis', '24/24', 'Verrou', 'Jypsière', 'In-The-Loop', 'Steeple', 'Mini Lindy', 'Autre'],
    'Louis Vuitton': ['Neverfull', 'Speedy 25', 'Speedy 30', 'Speedy 35', 'Speedy Bandoulière', 'Keepall', 'Alma', 'Capucines', 'Pochette Métis', 'Noé', 'Petite Malle', 'Twist', 'Dauphine', 'OnTheGo', 'Cannes', 'Boulogne', 'Bella', 'Soft Trunk', 'Carryall', 'Loop', 'Autre'],
    'Chanel': ['Classic Flap', '2.55', 'Boy', 'Gabrielle', 'Coco Handle', '19', 'Wallet on Chain', 'Grand Shopping', 'Trendy', 'Reissue', 'Vanity', '22', '31', 'Autre'],
    'Gucci': ['Dionysus', 'Marmont', 'Jackie', 'Horsebit', 'Ophidia', 'Bamboo', 'Jackie 1961', 'Horsebit 1955', 'Gucci Blondie', 'Web', 'Autre'],
    'Prada': ['Galleria', 'Saffiano', 'Re-Edition', 'Cleo', 'Nylon', 'Sidonie', 'Arqué', 'Brique', 'Moon', 'Autre'],
    'Dior': ['Lady Dior', 'Saddle', 'Book Tote', 'Bobby', 'Carousel', 'Diorama', 'Caro', 'Dior Camp', 'Autre'],
    'Saint Laurent': ['Sac de Jour', 'LouLou', 'Kate', 'Niki', 'Le 5 à 7', 'Solferino', 'Icare', 'Uptown', 'Léopard', 'Autre'],
    'Bottega Veneta': ['Pouch', 'Cassette', 'Jodie', 'Arco', 'Kalimero', 'Andiamo', 'Brick', 'Sardine', 'Autre'],
    'Fendi': ['Baguette', 'Peekaboo', 'By The Way', 'Sunshine', 'First', 'Fendigraphy', 'Baguette Soft', 'Autre'],
    'Loewe': ['Puzzle', 'Hammock', 'Gate', 'Flamenco', 'Basket', 'Cubi', 'Paseo', 'Ana', 'Autre'],
    'Chloé': ['Marcie', 'Drew', 'Tess', 'Woody', 'Nile', 'Faye', 'Edith', 'Paddington', 'Autre'],
    'Givenchy': ['Antigona', 'Voyou', 'Cut-Out', '4G', 'Moon Cut-Out', 'Pandora', 'Autre'],
    'Valentino': ['Rockstud', 'Locò', 'One Stud', 'Roman Stud', 'Garavani', 'Vsling', 'Autre'],
    'Goyard': ['Saint Louis', 'Cap Vert', 'Anjou', 'Artois', 'Saigon', 'Belvedere', 'Boîte Aluminium', 'Autre'],
    'Delvaux': ['Brillant', 'Tempête', 'Madame', 'Cool Box', 'Pin', 'Autre'],
    'Moynat': ['Réjane', 'Gabrielle', 'Pauline', 'Limousine', 'Curieuse', 'Autre'],
    'Valextra': ['Iside', 'Tric Trac', 'Brera', 'Serena', 'Autre'],
    'Mulberry': ['Bayswater', 'Alexa', 'Lily', 'Amberley', 'Autre'],
    'Bulgari': ['Serpenti', 'Divas\' Dream', 'Bvlgari Bvlgari', 'Autre'],
    'Balenciaga': ['Hourglass', 'Le Cagole', 'Neo Cagole', 'City', 'Autre'],
    'Alexander McQueen': ['Jewelled Satchel', 'The Curve', 'Autre'],
    'Marni': ['Trunk', 'Pannier', 'Autre'],
    'Salvatore Ferragamo': ['Gancini', 'Studio', 'Autre'],
    'Tod\'s': ['D Bag', 'Gommino', 'Autre'],
    'Bally': ['Janelle', 'Sergeant', 'Scribe', 'Metropolis', 'Autre'],
    'Celine': ['Triomphe', 'Ava', 'Triomphe Canvas', 'Luggage', 'Autre'],
    'Lanvin': ['Pencil', 'Cat Bag', 'Autre'],
    'Polène': ['Numéro Un', 'Numéro Huit', 'Numéro Neuf', 'Numéro Dix', 'Béri', 'Autre'],
    'Strathberry': ['Mosaic', 'East/West', 'Multrees', 'Charlotte', 'Kite Hobo', 'Autre'],
  },
  maroquinerie: {
    'Hermès': ['Birkin', 'Kelly', 'Constance', 'Lindy', 'Évelyne', 'Bolide', 'Picotin', 'Garden Party', 'Herbag', 'Roulis', '24/24', 'Verrou', 'Portefeuille', 'Portefeuille long', 'Porte-cartes', 'Porte-monnaie', 'Porte-clés', 'Pochette', 'Étui à lunettes', 'Autre'],
    'Louis Vuitton': ['Neverfull', 'Speedy', 'Keepall', 'Alma', 'Capucines', 'Pochette Métis', 'Noé', 'Petite Malle', 'Twist', 'Dauphine', 'OnTheGo', 'Portefeuille', 'Portefeuille long', 'Victorine', 'Zippy', 'Sarah', 'Clemence', 'Porte-cartes', 'Porte-monnaie', 'Porte-clés', 'Pochette', 'Étui à lunettes', 'Autre'],
    'Chanel': ['Classic Flap', '2.55', 'Boy', 'Gabrielle', 'Coco Handle', '19', 'Wallet on Chain', 'Portefeuille', 'Portefeuille long', 'Porte-cartes', 'Porte-monnaie', 'Porte-clés', 'Pochette', 'Étui à lunettes', 'Autre'],
    'Gucci': ['Dionysus', 'Marmont', 'Jackie', 'Horsebit', 'Ophidia', 'Bamboo', 'Portefeuille', 'Portefeuille long', 'Porte-cartes', 'Porte-monnaie', 'Porte-clés', 'Pochette', 'Autre'],
    'Prada': ['Galleria', 'Saffiano', 'Re-Edition', 'Cleo', 'Nylon', 'Portefeuille', 'Portefeuille long', 'Porte-cartes', 'Porte-monnaie', 'Porte-clés', 'Pochette', 'Étui à lunettes', 'Autre'],
    'Dior': ['Lady Dior', 'Saddle', 'Book Tote', 'Bobby', 'Carousel', 'Portefeuille', 'Portefeuille long', 'Porte-cartes', 'Porte-monnaie', 'Porte-clés', 'Pochette', 'Autre'],
    'Saint Laurent': ['Sac de Jour', 'LouLou', 'Kate', 'Niki', 'Le 5 à 7', 'Portefeuille', 'Portefeuille long', 'Porte-cartes', 'Porte-monnaie', 'Porte-clés', 'Pochette', 'Autre'],
    'Bottega Veneta': ['Pouch', 'Cassette', 'Jodie', 'Arco', 'Kalimero', 'Portefeuille', 'Portefeuille long', 'Porte-cartes', 'Porte-monnaie', 'Porte-clés', 'Pochette', 'Autre'],
    'Fendi': ['Baguette', 'Peekaboo', 'By The Way', 'Sunshine', 'Portefeuille', 'Portefeuille long', 'Porte-cartes', 'Porte-monnaie', 'Porte-clés', 'Pochette', 'Autre'],
    'Loewe': ['Puzzle', 'Hammock', 'Gate', 'Flamenco', 'Basket', 'Portefeuille', 'Portefeuille long', 'Porte-cartes', 'Porte-monnaie', 'Porte-clés', 'Pochette', 'Autre'],
    'Chloé': ['Marcie', 'Drew', 'Tess', 'Woody', 'Nile', 'Faye', 'Portefeuille', 'Portefeuille long', 'Porte-cartes', 'Porte-monnaie', 'Pochette', 'Autre'],
    'Givenchy': ['Antigona', 'Voyou', 'Cut-Out', '4G', 'Portefeuille', 'Portefeuille long', 'Porte-cartes', 'Porte-monnaie', 'Porte-clés', 'Pochette', 'Autre'],
    'Valentino': ['Rockstud', 'Locò', 'One Stud', 'Roman Stud', 'Portefeuille', 'Portefeuille long', 'Porte-cartes', 'Porte-monnaie', 'Pochette', 'Autre'],
    'Goyard': ['Saint Louis', 'Cap Vert', 'Anjou', 'Artois', 'Saigon', 'Portefeuille', 'Portefeuille long', 'Porte-cartes', 'Porte-monnaie', 'Porte-clés', 'Pochette', 'Autre'],
    'Delvaux': ['Brillant', 'Tempête', 'Madame', 'Cool Box', 'Portefeuille', 'Portefeuille long', 'Porte-cartes', 'Porte-monnaie', 'Pochette', 'Autre'],
    'Moynat': ['Réjane', 'Gabrielle', 'Pauline', 'Portefeuille', 'Portefeuille long', 'Porte-cartes', 'Porte-monnaie', 'Pochette', 'Autre'],
    'Valextra': ['Iside', 'Tric Trac', 'Brera', 'Portefeuille', 'Portefeuille long', 'Porte-cartes', 'Porte-monnaie', 'Pochette', 'Autre'],
    'Mulberry': ['Bayswater', 'Alexa', 'Lily', 'Portefeuille', 'Portefeuille long', 'Porte-cartes', 'Porte-monnaie', 'Pochette', 'Autre'],
    'Alexander McQueen': ['Jewelled Satchel', 'The Curve', 'Portefeuille', 'Portefeuille long', 'Porte-cartes', 'Pochette', 'Autre'],
    'Marni': ['Trunk', 'Pannier', 'Portefeuille', 'Portefeuille long', 'Porte-cartes', 'Pochette', 'Autre'],
    'Salvatore Ferragamo': ['Gancini', 'Studio', 'Portefeuille', 'Portefeuille long', 'Porte-cartes', 'Porte-monnaie', 'Pochette', 'Autre'],
    'Tod\'s': ['D Bag', 'Gommino', 'Portefeuille', 'Portefeuille long', 'Porte-cartes', 'Porte-monnaie', 'Pochette', 'Autre'],
    'Bulgari': ['Serpenti', 'Divas\' Dream', 'Bvlgari Bvlgari', 'Portefeuille', 'Portefeuille long', 'Porte-cartes', 'Porte-monnaie', 'Pochette', 'Autre'],
    'Balenciaga': ['Hourglass', 'Le Cagole', 'Neo Cagole', 'City', 'Portefeuille', 'Portefeuille long', 'Porte-cartes', 'Pochette', 'Autre'],
    'Bally': ['Janelle', 'Sergeant', 'Scribe', 'Metropolis', 'Portefeuille', 'Portefeuille long', 'Porte-cartes', 'Porte-monnaie', 'Pochette', 'Autre'],
    'Celine': ['Triomphe', 'Ava', 'Triomphe Canvas', 'Luggage', 'Portefeuille', 'Portefeuille long', 'Porte-cartes', 'Porte-monnaie', 'Pochette', 'Autre'],
    'Lanvin': ['Pencil', 'Cat Bag', 'Portefeuille', 'Portefeuille long', 'Porte-cartes', 'Pochette', 'Autre'],
    'Polène': ['Numéro Un', 'Numéro Huit', 'Numéro Neuf', 'Numéro Dix', 'Portefeuille', 'Porte-cartes', 'Pochette', 'Autre'],
    'Strathberry': ['Mosaic', 'East/West', 'Multrees', 'Charlotte', 'Portefeuille', 'Porte-cartes', 'Pochette', 'Autre'],
  },
  montres: {
    'Rolex': ['Submariner', 'Submariner Date', 'Daytona', 'Datejust', 'Day-Date', 'GMT-Master II', 'Explorer', 'Explorer II', 'Yacht-Master', 'Oyster Perpetual', 'Sky-Dweller', 'Sea-Dweller', 'Milgauss', 'Air-King', 'Cellini', 'Lady-Datejust', 'Autre'],
    'Audemars Piguet': ['Royal Oak', 'Royal Oak Offshore', 'Royal Oak Concept', 'Code 11.59', 'Millenary', 'Jules Audemars', 'Edward Piguet', 'Autre'],
    'Patek Philippe': ['Nautilus', 'Aquanaut', 'Calatrava', 'Complications', 'Perpetual Calendar', 'Twenty~4', 'Golden Ellipse', 'World Time', 'Autre'],
    'Cartier': ['Tank', 'Tank Louis', 'Tank Française', 'Santos', 'Ballon Bleu', 'Panthère', 'Clé', 'Ronde', 'Baignoire', 'Drive', 'Pasha', 'Baignoire Allongée', 'Autre'],
    'Omega': ['Speedmaster', 'Seamaster', 'Constellation', 'Aqua Terra', 'De Ville', 'Planet Ocean', 'Moonwatch', 'Seamaster Diver', 'Autre'],
    'Chanel': ['J12', 'Boy.Friend', 'Première', 'Mademoiselle', 'Code Coco', 'J12 X-Ray', 'Autre'],
    'Hermès': ['Cape Cod', 'H08', 'Arceau', 'Slim', 'Heure H', 'Galop', 'Arceau Le Temps Voyageur', 'Autre'],
    'Louis Vuitton': ['Tambour', 'Tambour Curve', 'Spirit', 'Escale', 'Escale Time Zone', 'Tambour Moon', 'Autre'],
    'Bulgari': ['Octo', 'Octo Finissimo', 'Serpenti', 'Bvlgari Bvlgari', 'Diagono', 'Aluminium', 'Octo Roma', 'Autre'],
    'IWC': ['Portugieser', 'Pilot', 'Portofino', 'Ingenieur', 'Aquatimer', 'Da Vinci', 'Big Pilot', 'Autre'],
    'Jaeger-LeCoultre': ['Reverso', 'Master', 'Polaris', 'Rendez-Vous', 'Atmos', 'Duomètre', 'Master Ultra Thin', 'Autre'],
    'Vacheron Constantin': ['Overseas', 'Patrimony', 'Fiftysix', 'Historiques', 'Traditionnelle', 'Quai de l\'Île', 'Autre'],
    'Breitling': ['Navitimer', 'Chronomat', 'Superocean', 'Premier', 'Avenger', 'Top Time', 'Autre'],
    'Tag Heuer': ['Monaco', 'Carrera', 'Aquaracer', 'Autavia', 'Formula 1', 'Link', 'Monaco Calibre', 'Autre'],
    'Panerai': ['Luminor', 'Submersible', 'Radiomir', 'Luminor Due', 'Luminor Marina', 'Autre'],
    'Chopard': ['Happy Sport', 'Alpine Eagle', 'L.U.C', 'Mille Miglia', 'Imperiale', 'Happy Diamonds', 'Autre'],
    'Piaget': ['Polo', 'Altiplano', 'Limelight', 'Possession', 'Autre'],
    'Dior': ['Dior VIII', 'La D de Dior', 'Chiffre Rouge', 'Grand Soir', 'Autre'],
    'Gucci': ['G-Timeless', 'Gucci 25H', 'Interlocking', 'Grip', 'Autre'],
    'Van Cleef & Arpels': ['Lady Arpels', 'Pierre Arpels', 'Charms', 'Poetic Complications', 'Autre'],
    'Blancpain': ['Fifty Fathoms', 'Villeret', 'Ladybird', 'Air Command', 'Autre'],
    'Breguet': ['Classique', 'Marine', 'Type XX', 'Reine de Naples', 'Tradition', 'Autre'],
    'Hublot': ['Big Bang', 'Classic Fusion', 'Spirit of Big Bang', 'Square Bang', 'Autre'],
    'Richard Mille': ['RM 011', 'RM 07', 'RM 035', 'RM 027', 'RM 67', 'Autre'],
    'Tudor': ['Black Bay', 'Pelagos', 'Royal', '1926', 'Autre'],
    'Zenith': ['Chronomaster', 'Defy', 'Pilot', 'El Primero', 'Autre'],
    'Girard-Perregaux': ['Laureato', 'Cat\'s Eye', 'Traveller', 'Vintage 1945', 'Autre'],
    'Corum': ['Bubble', 'Admiral', 'Golden Bridge', 'Autre'],
    'Longines': ['Master Collection', 'Conquest', 'Spirit', 'Elegance', 'Heritage', 'HydroConquest', 'DolceVita', 'Autre'],
    'Tissot': ['PRX', 'Seastar', 'PR 100', 'Gentleman', 'Le Locle', 'Autre'],
    'Hamilton': ['Ventura', 'Khaki', 'Khaki Aviation', 'Jazzmaster', 'Autre'],
    'Raymond Weil': ['Freelancer', 'Millesime', 'Toccata', 'Maestro', 'Tango', 'Noemia', 'Autre'],
    'Baume et Mercier': ['Riviera', 'Clifton', 'Autre'],
    'Nomos': ['Tangente', 'Orion', 'Autre'],
    'Mido': ['Multifort', 'Baroncelli', 'Autre'],
  },
  bijoux: {
    'Cartier': ['Love', 'Juste un Clou', 'Panthère', 'Trinity', 'Écrou', 'Clash', 'Maillon Panthère', 'Baignoire', 'Amulette', 'Destinée', 'Autre'],
    'Van Cleef & Arpels': ['Alhambra', 'Perlée', 'Frivole', 'Between the Finger', 'Sweet', 'Lotus', 'Cœur', 'Magic', 'Zip', 'Autre'],
    'Bulgari': ['B.zero1', 'Serpenti', 'Divas\' Dream', 'Bvlgari Bvlgari', 'Fiorever', 'Octo', 'Parentesi', 'Autre'],
    'Tiffany': ['Atlas', 'T True', 'Return to Tiffany', 'Keys', 'HardWear', 'T1', 'Lock', 'Tiffany T', 'Autre'],
    'Chanel': ['Coco Crush', 'Camélia', 'Ultra', 'Comète', 'Ruban', 'Sous le Soleil', 'Coco Crush Mat', 'Autre'],
    'Hermès': ['Chaîne d’ancre', 'Kelly', 'Collier de chien', 'Clic H', 'Autre'],
    'Dior': ['Rose des Vents', 'Tribales', 'Diorama', 'Gem Dior', 'Oui', 'Diorette', 'Autre'],
    'Louis Vuitton': ['LV Volt', 'Idylle', 'Blossom', 'B Blossom', 'Spell On', 'Stellar Times', 'Autre'],
    'Gucci': ['Interlocking', 'Horsebit', 'Blind for Love', 'Link to Love', 'Hortus Deliciarum', 'Autre'],
    'Prada': ['Symphony', 'Eternal Gold', 'Linea Rossa', 'Autre'],
    'Chopard': ['Happy Hearts', 'Ice Cube', 'Happy Spirit', 'Imperiale', 'Happy Diamonds', 'Autre'],
    'Piaget': ['Possession', 'Limelight', 'Rose', 'Sunlight', 'Piaget Rose', 'Autre'],
    'Boucheron': ['Quatre', 'Serpent Bohème', 'Jack', 'Reflet', 'Plume', 'Autre'],
    'Chaumet': ['Liens', 'Joséphine', 'Bee My Love', 'Jeux de Liens', 'Class One', 'Autre'],
    'Harry Winston': ['Winston Cluster', 'Classic Winston', 'Logo', 'Premier', 'Autre'],
    'David Yurman': ['Cable', 'Renaissance', 'Infinity', 'Petals', 'Autre'],
    'De Beers': ['DB Classic', 'Enchanted Lotus', 'Aura', 'Autre'],
    'Graff': ['Butterfly', 'Graff Diamond', 'Spiral', 'Autre'],
    'Messika': ['Move', 'My Way', 'Glam\'azon', 'Autre'],
    'Pomellato': ['Nudo', 'Ritorno', 'Mango', 'Autre'],
    'Fred': ['Force 10', 'Bracelet', 'Bague', 'Collier', 'Boucles d\'oreilles', 'Autre'],
    'Repossi': ['Antifer', 'Serti sur vide', 'Berbère', 'Blast', 'Serti inversé', 'Autre'],
    'Mauboussin': ['1827', 'Étoile divine', 'Belle comme le vent', 'Trop smart', 'Union chance', 'Autre'],
    'Courbet': ['Tennis', 'Les solitaires', 'Origine', 'Pont des arts', 'Autre'],
    'Swarovski': ['Mesmera', 'Symbolica', 'Vienna', 'Octagon', 'Autre'],
  },
  vetements: {
    'Chanel': ['Tweed', 'Cardigan', 'Veste classique', 'Robe', 'Jupe', 'Pantalon', 'Manteau', 'Autre'],
    'Louis Vuitton': ['Veste', 'Pantalon', 'Robe', 'Sweat', 'T-shirt', 'Manteau', 'Short', 'Autre'],
    'Gucci': ['Blazer', 'Robe', 'Veste', 'Sweat', 'Pantalon', 'Manteau', 'Jupe', 'Autre'],
    'Prada': ['Veste', 'Robe', 'Manteau', 'Pantalon', 'Sweat', 'Jupe', 'Autre'],
    'Dior': ['Bar Jacket', 'Robe', 'Veste', 'Manteau', 'Jupe', 'Pantalon', 'Autre'],
    'Saint Laurent': ['Blazer', 'Veste', 'Robe', 'Manteau', 'Pantalon', 'Smoking', 'Autre'],
    'Hermès': ['Veste', 'Robe', 'Pantalon', 'Manteau', 'Cardigan', 'Trench', 'Autre'],
    'Fendi': ['Veste', 'Robe', 'Manteau', 'Pantalon', 'Jupe', 'Sweat', 'Autre'],
    'Bottega Veneta': ['Veste', 'Robe', 'Pantalon', 'Sweat', 'Manteau', 'Cardigan', 'Autre'],
    'Loewe': ['Veste', 'Robe', 'Manteau', 'Pantalon', 'Sweat', 'Jupe', 'Autre'],
    'Balenciaga': ['Veste', 'Robe', 'Pantalon', 'Sweat', 'Manteau', 'T-shirt', 'Autre'],
    'Givenchy': ['Veste', 'Robe', 'Pantalon', 'Manteau', 'Sweat', 'Autre'],
    'Valentino': ['Robe', 'Veste', 'Pantalon', 'Manteau', 'Jupe', 'Autre'],
    'Versace': ['Robe', 'Veste', 'Pantalon', 'Manteau', 'Jupe', 'Autre'],
    'Alexander McQueen': ['Robe', 'Veste', 'Pantalon', 'Manteau', 'Jupe', 'Autre'],
    'Brunello Cucinelli': ['Pull', 'Cardigan', 'Veste', 'Manteau', 'Pantalon', 'Autre'],
    'Max Mara': ['Caban', 'Camel Coat', 'Robe', 'Veste', 'Manteau', 'Pantalon', 'Autre'],
    'Salvatore Ferragamo': ['Veste', 'Robe', 'Pantalon', 'Manteau', 'Jupe', 'Autre'],
    'Chloé': ['Robe', 'Veste', 'Pantalon', 'Manteau', 'Jupe', 'Cardigan', 'Autre'],
    'Marni': ['Robe', 'Veste', 'Pantalon', 'Manteau', 'Jupe', 'Autre'],
  },
  chaussures: {
    'Louis Vuitton': ['Archlight', 'Run Away', 'Frontrow', 'Trainer', 'LV Trainer', 'Aerogram', 'Autre'],
    'Chanel': ['Ballerines', 'Bottes', 'Escarpins', 'Baskets', 'Bottines', 'Sandales', 'Autre'],
    'Gucci': ['Ace', 'Princetown', 'Brixton', 'Rhyton', 'Gazelle', 'Jackie', 'Horsebit', 'Autre'],
    'Prada': ['Monolith', 'America\'s Cup', 'Cloudbust', 'Derby', 'Loafer', 'Autre'],
    'Dior': ['B30', 'B22', 'Walk\'n\'Dior', 'Escarpins', 'Bottes', 'J\'adior', 'Autre'],
    'Saint Laurent': ['Wyatt', 'Tributes', 'Bottes', 'Escarpins', 'Loafer', 'Slides', 'Autre'],
    'Hermès': ['Oran', 'Sandales', 'Bottes', 'Mocassins', 'Quick', 'Chypre', 'Autre'],
    'Bottega Veneta': ['Puddle', 'Tire', 'Lido', 'Sandals', 'Stretch', 'Autre'],
    'Fendi': ['Fendigraphy', 'Baskets', 'Escarpins', 'Bottes', 'Slides', 'Autre'],
    'Loewe': ['Balloon', 'Puzzle', 'Baskets', 'Gate', 'Flamenco', 'Autre'],
    'Jimmy Choo': ['Bing', 'Memento', 'Romy', 'Anouk', 'Bottes', 'Autre'],
    'Manolo Blahnik': ['Hangisi', 'BB', 'Maysale', 'Lurum', 'Autre'],
    'Roger Vivier': ['Belle Vivier', 'Très Vivier', 'Belle de Nuit', 'Ballerine', 'Autre'],
    'Valentino': ['Rockstud', 'Garavani', 'One Stud', 'Bottes', 'Escarpins', 'Autre'],
    'Christian Louboutin': ['Pigalle', 'So Kate', 'Bianca', 'Décolleté', 'Bottes', 'Simple Pump', 'Autre'],
    'Aquazzura': ['Wild Thing', 'Belgravia', 'Christy', 'Sandales', 'Escarpins', 'Autre'],
    'Givenchy': ['Bottes', 'Escarpins', 'Baskets', 'Sandales', 'Autre'],
    'Balenciaga': ['Triple S', 'Track', 'Speed', 'Defender', 'Strike', 'Baskets', 'Bottes', 'Autre'],
  },
  accessoires: {
    'Hermès': ['Ceinture', 'Écharpe', 'Carré', 'Cravate', 'Porte-clés', 'Porte-carte', 'Portefeuille long', 'Portefeuille', 'Porte-monnaie', 'Pochette', 'Gants', 'Lunettes', 'Casquette', 'Bonnet', 'Chapeau', 'Bob', 'Éventail', 'Autre'],
    'Louis Vuitton': ['Ceinture', 'Écharpe', 'Porte-monnaie', 'Porte-carte', 'Portefeuille long', 'Portefeuille', 'Porte-clés', 'Pochette', 'Lunettes', 'Foulard', 'Casquette', 'Bonnet', 'Chapeau', 'Bob', 'Autre'],
    'Chanel': ['Ceinture', 'Lunettes', 'Écharpe', 'Gants', 'Foulard', 'Porte-monnaie', 'Porte-carte', 'Portefeuille long', 'Portefeuille', 'Pochette', 'Casquette', 'Bonnet', 'Chapeau', 'Bob', 'Autre'],
    'Gucci': ['Ceinture', 'Écharpe', 'Lunettes', 'Porte-monnaie', 'Porte-carte', 'Portefeuille long', 'Portefeuille', 'Foulard', 'Cravate', 'Pochette', 'Casquette', 'Bonnet', 'Chapeau', 'Bob', 'Autre'],
    'Prada': ['Ceinture', 'Lunettes', 'Porte-monnaie', 'Porte-carte', 'Portefeuille long', 'Portefeuille', 'Écharpe', 'Foulard', 'Porte-clés', 'Pochette', 'Casquette', 'Bonnet', 'Chapeau', 'Bob', 'Autre'],
    'Dior': ['Ceinture', 'Lunettes', 'Écharpe', 'Porte-monnaie', 'Porte-carte', 'Portefeuille long', 'Portefeuille', 'Foulard', 'Cravate', 'Pochette', 'Casquette', 'Bonnet', 'Chapeau', 'Bob', 'Autre'],
    'Saint Laurent': ['Ceinture', 'Lunettes', 'Porte-monnaie', 'Porte-carte', 'Portefeuille long', 'Portefeuille', 'Foulard', 'Cravate', 'Pochette', 'Casquette', 'Bonnet', 'Chapeau', 'Bob', 'Autre'],
    'Cartier': ['Lunettes', 'Porte-clés', 'Porte-carte', 'Portefeuille', 'Ceinture', 'Écharpe', 'Casquette', 'Bonnet', 'Chapeau', 'Bob', 'Autre'],
    'Fendi': ['Ceinture', 'Lunettes', 'Écharpe', 'Foulard', 'Porte-monnaie', 'Porte-carte', 'Portefeuille long', 'Portefeuille', 'Pochette', 'Casquette', 'Bonnet', 'Chapeau', 'Bob', 'Autre'],
    'Loewe': ['Ceinture', 'Porte-monnaie', 'Porte-carte', 'Portefeuille long', 'Portefeuille', 'Écharpe', 'Foulard', 'Porte-clés', 'Pochette', 'Casquette', 'Bonnet', 'Chapeau', 'Bob', 'Autre'],
    'Bottega Veneta': ['Ceinture', 'Porte-monnaie', 'Porte-carte', 'Portefeuille long', 'Portefeuille', 'Porte-clés', 'Écharpe', 'Pochette', 'Casquette', 'Bonnet', 'Chapeau', 'Bob', 'Autre'],
    'Burberry': ['Écharpe', 'Ceinture', 'Foulard', 'Lunettes', 'Porte-monnaie', 'Porte-carte', 'Portefeuille long', 'Portefeuille', 'Pochette', 'Casquette', 'Bonnet', 'Chapeau', 'Bob', 'Autre'],
    'Valentino': ['Ceinture', 'Porte-monnaie', 'Porte-carte', 'Portefeuille long', 'Portefeuille', 'Lunettes', 'Écharpe', 'Pochette', 'Casquette', 'Bonnet', 'Chapeau', 'Bob', 'Autre'],
    'Longchamp': ['Le Pliage', 'Roseau', 'Box-Trot', 'Écharpe', 'Porte-monnaie', 'Porte-carte', 'Portefeuille long', 'Portefeuille', 'Pochette', 'Casquette', 'Bonnet', 'Chapeau', 'Bob', 'Autre'],
    'Salvatore Ferragamo': ['Ceinture', 'Porte-monnaie', 'Porte-carte', 'Portefeuille long', 'Portefeuille', 'Écharpe', 'Lunettes', 'Pochette', 'Casquette', 'Bonnet', 'Chapeau', 'Bob', 'Autre'],
    'Chloé': ['Écharpe', 'Ceinture', 'Porte-monnaie', 'Porte-carte', 'Portefeuille long', 'Portefeuille', 'Foulard', 'Pochette', 'Casquette', 'Bonnet', 'Chapeau', 'Bob', 'Autre'],
    'Givenchy': ['Écharpe', 'Ceinture', 'Lunettes', 'Porte-monnaie', 'Porte-carte', 'Portefeuille long', 'Portefeuille', 'Pochette', 'Casquette', 'Bonnet', 'Chapeau', 'Bob', 'Autre'],
  },
  autre: {
    'Hermès': ['Birkin', 'Kelly', 'Sac', 'Montre', 'Bijou', 'Vêtement', 'Accessoire', 'Autre'],
    'Louis Vuitton': ['Neverfull', 'Speedy', 'Keepall', 'Sac', 'Montre', 'Bijou', 'Vêtement', 'Accessoire', 'Autre'],
    'Chanel': ['Classic Flap', '2.55', 'Sac', 'Montre', 'Bijou', 'Vêtement', 'Accessoire', 'Autre'],
    'Gucci': ['Dionysus', 'Marmont', 'Sac', 'Montre', 'Bijou', 'Vêtement', 'Accessoire', 'Autre'],
    'Prada': ['Galleria', 'Sac', 'Montre', 'Vêtement', 'Accessoire', 'Autre'],
    'Dior': ['Lady Dior', 'Saddle', 'Sac', 'Montre', 'Bijou', 'Vêtement', 'Accessoire', 'Autre'],
    'Saint Laurent': ['Sac de Jour', 'LouLou', 'Sac', 'Vêtement', 'Accessoire', 'Autre'],
    'Bottega Veneta': ['Pouch', 'Cassette', 'Sac', 'Vêtement', 'Accessoire', 'Autre'],
    'Fendi': ['Baguette', 'Peekaboo', 'Sac', 'Vêtement', 'Accessoire', 'Autre'],
    'Loewe': ['Puzzle', 'Hammock', 'Sac', 'Vêtement', 'Accessoire', 'Autre'],
    'Cartier': ['Love', 'Tank', 'Santos', 'Bijou', 'Montre', 'Accessoire', 'Autre'],
    'Rolex': ['Submariner', 'Daytona', 'Datejust', 'Montre', 'Autre'],
    'Patek Philippe': ['Nautilus', 'Aquanaut', 'Calatrava', 'Montre', 'Autre'],
    'Audemars Piguet': ['Royal Oak', 'Royal Oak Offshore', 'Montre', 'Autre'],
    'Tiffany': ['Atlas', 'T True', 'Bijou', 'Autre'],
    'Van Cleef & Arpels': ['Alhambra', 'Perlée', 'Bijou', 'Montre', 'Autre'],
    'Chloé': ['Marcie', 'Drew', 'Sac', 'Vêtement', 'Autre'],
    'Fred': ['Force 10', 'Bijou', 'Autre'],
    'Repossi': ['Antifer', 'Berbère', 'Bijou', 'Autre'],
    'Mauboussin': ['Bijou', 'Montre', 'Autre'],
    'Polène': ['Numéro Un', 'Numéro Huit', 'Sac', 'Autre'],
    'Strathberry': ['Mosaic', 'Charlotte', 'Sac', 'Autre'],
    'Longines': ['Master Collection', 'Conquest', 'Montre', 'Autre'],
    'Tissot': ['PRX', 'Seastar', 'Montre', 'Autre'],
    'Hamilton': ['Ventura', 'Khaki', 'Montre', 'Autre'],
    'Raymond Weil': ['Freelancer', 'Toccata', 'Montre', 'Autre'],
    'Baume et Mercier': ['Riviera', 'Clifton', 'Montre', 'Autre'],
    'Nomos': ['Tangente', 'Orion', 'Montre', 'Autre'],
    'Mido': ['Multifort', 'Baroncelli', 'Montre', 'Autre'],
    'Courbet': ['Tennis', 'Bijou', 'Autre'],
    'Swarovski': ['Mesmera', 'Symbolica', 'Bijou', 'Autre'],
  },
};

/** Marques proposées par catégorie (uniquement les marques ayant des modèles pour cette catégorie). */
export const BRANDS_BY_CATEGORY: Record<string, string[]> = (() => {
  const out: Record<string, string[]> = {};
  for (const cat of Object.keys(_MODELS_BY_CATEGORY_BRAND_BASE)) {
    out[cat] = Object.keys(_MODELS_BY_CATEGORY_BRAND_BASE[cat]).sort((a, b) => a.localeCompare(b, 'fr'));
  }
  return out;
})();

/** Marques par catégorie et genre (Homme / Femme). Utilisé pour filtrer le sélecteur Marque. */
export const BRANDS_BY_CATEGORY_AND_GENRE: Record<string, { femme: string[]; homme: string[] }> = (() => {
  const out: Record<string, { femme: string[]; homme: string[] }> = {};
  for (const cat of Object.keys(BRANDS_BY_CATEGORY)) {
    const list = BRANDS_BY_CATEGORY[cat];
    out[cat] = { femme: list, homme: list };
  }
  return out;
})();

/** Modèles par catégorie et marque : base + toutes les marques ajoutées avec au moins « Autre ». */
export const MODELS_BY_CATEGORY_BRAND: Record<string, Record<string, string[]>> = (() => {
  const base = _MODELS_BY_CATEGORY_BRAND_BASE;
  const result: Record<string, Record<string, string[]>> = {};
  for (const cat of Object.keys(base)) {
    result[cat] = { ...base[cat] };
    for (const brand of ALL_BRANDS) {
      if (!(brand in result[cat])) result[cat][brand] = ['Autre'];
    }
  }
  return result;
})();

/** Modèles par catégorie, marque et genre (Homme / Femme). Dérivé de MODELS_BY_CATEGORY_BRAND. */
export const MODELS_BY_CATEGORY_BRAND_AND_GENRE: Record<string, Record<string, { femme: string[]; homme: string[] }>> = (() => {
  const out: Record<string, Record<string, { femme: string[]; homme: string[] }>> = {};
  for (const cat of Object.keys(MODELS_BY_CATEGORY_BRAND)) {
    out[cat] = {};
    for (const brand of Object.keys(MODELS_BY_CATEGORY_BRAND[cat])) {
      const models = MODELS_BY_CATEGORY_BRAND[cat][brand];
      out[cat][brand] = { femme: models, homme: models };
    }
  }
  return out;
})();

// ——— Localisation (catalogue) ———
/** Régions françaises et codes départements pour filtrage par localisation. */
export const REGIONS_FR: { name: string; depts: string[] }[] = [
  { name: 'Île-de-France', depts: ['75', '77', '78', '91', '92', '93', '94', '95'] },
  { name: 'Auvergne-Rhône-Alpes', depts: ['01', '03', '07', '15', '26', '38', '42', '43', '63', '69', '73', '74'] },
  { name: 'Nouvelle-Aquitaine', depts: ['16', '17', '19', '23', '24', '33', '40', '47', '64', '79', '86', '87'] },
  { name: 'Occitanie', depts: ['09', '11', '12', '30', '31', '32', '34', '46', '48', '66', '81', '82'] },
  { name: 'Hauts-de-France', depts: ['02', '59', '60', '62', '80'] },
  { name: 'Provence-Alpes-Côte d\'Azur', depts: ['04', '05', '06', '13', '83', '84'] },
  { name: 'Grand Est', depts: ['08', '10', '51', '52', '54', '55', '57', '67', '88'] },
  { name: 'Pays de la Loire', depts: ['44', '49', '53', '72', '85'] },
  { name: 'Bretagne', depts: ['22', '29', '35', '56'] },
  { name: 'Normandie', depts: ['27', '50', '61', '76', '14'] },
  { name: 'Bourgogne-Franche-Comté', depts: ['21', '25', '39', '58', '70', '71', '89', '90'] },
  { name: 'Centre-Val de Loire', depts: ['18', '28', '36', '37', '41', '45'] },
  { name: 'Corse', depts: ['2A', '2B'] },
];

/** Départements (code + libellé) pour suggestions code postal. */
export const DEPARTEMENTS_FR: { code: string; name: string }[] = [
  { code: '75', name: 'Paris' }, { code: '69', name: 'Rhône' }, { code: '13', name: 'Bouches-du-Rhône' },
  { code: '33', name: 'Gironde' }, { code: '31', name: 'Haute-Garonne' }, { code: '59', name: 'Nord' },
  { code: '44', name: 'Loire-Atlantique' }, { code: '34', name: 'Hérault' }, { code: '67', name: 'Bas-Rhin' },
  { code: '64', name: 'Pyrénées-Atlantiques' }, { code: '29', name: 'Finistère' }, { code: '06', name: 'Alpes-Maritimes' },
  { code: '35', name: 'Ille-et-Vilaine' }, { code: '74', name: 'Haute-Savoie' }, { code: '49', name: 'Maine-et-Loire' },
  { code: '84', name: 'Vaucluse' }, { code: '26', name: 'Drôme' }, { code: '38', name: 'Isère' },
  { code: '77', name: 'Seine-et-Marne' }, { code: '78', name: 'Yvelines' }, { code: '92', name: 'Hauts-de-Seine' },
  { code: '93', name: 'Seine-Saint-Denis' }, { code: '94', name: 'Val-de-Marne' }, { code: '95', name: 'Val-d\'Oise' },
  { code: '91', name: 'Essonne' }, { code: '62', name: 'Pas-de-Calais' }, { code: '83', name: 'Var' },
  { code: '30', name: 'Gard' }, { code: '66', name: 'Pyrénées-Orientales' }, { code: '17', name: 'Charente-Maritime' },
  { code: '24', name: 'Dordogne' }, { code: '40', name: 'Landes' }, { code: '19', name: 'Corrèze' },
  { code: '87', name: 'Haute-Vienne' }, { code: '79', name: 'Deux-Sèvres' }, { code: '86', name: 'Vienne' },
  { code: '16', name: 'Charente' }, { code: '23', name: 'Creuse' }, { code: '47', name: 'Lot-et-Garonne' },
  { code: '02', name: 'Aisne' }, { code: '60', name: 'Oise' }, { code: '80', name: 'Somme' },
  { code: '08', name: 'Ardennes' }, { code: '10', name: 'Aube' }, { code: '51', name: 'Marne' },
  { code: '52', name: 'Haute-Marne' }, { code: '54', name: 'Meurthe-et-Moselle' }, { code: '55', name: 'Meuse' },
  { code: '57', name: 'Moselle' }, { code: '88', name: 'Vosges' }, { code: '53', name: 'Mayenne' },
  { code: '72', name: 'Sarthe' }, { code: '85', name: 'Vendée' }, { code: '22', name: 'Côtes-d\'Armor' },
  { code: '56', name: 'Morbihan' }, { code: '27', name: 'Eure' }, { code: '50', name: 'Manche' },
  { code: '61', name: 'Orne' }, { code: '76', name: 'Seine-Maritime' }, { code: '14', name: 'Calvados' },
  { code: '21', name: 'Côte-d\'Or' }, { code: '25', name: 'Doubs' }, { code: '39', name: 'Jura' },
  { code: '58', name: 'Nièvre' }, { code: '70', name: 'Haute-Saône' }, { code: '71', name: 'Saône-et-Loire' },
  { code: '89', name: 'Yonne' }, { code: '90', name: 'Territoire de Belfort' }, { code: '18', name: 'Cher' },
  { code: '28', name: 'Eure-et-Loir' }, { code: '36', name: 'Indre' }, { code: '37', name: 'Indre-et-Loire' },
  { code: '41', name: 'Loir-et-Cher' }, { code: '45', name: 'Loiret' }, { code: '01', name: 'Ain' },
  { code: '03', name: 'Allier' }, { code: '07', name: 'Ardèche' }, { code: '15', name: 'Cantal' },
  { code: '42', name: 'Loire' }, { code: '43', name: 'Haute-Loire' }, { code: '63', name: 'Puy-de-Dôme' },
  { code: '73', name: 'Savoie' }, { code: '09', name: 'Ariège' }, { code: '11', name: 'Aude' },
  { code: '12', name: 'Aveyron' }, { code: '32', name: 'Gers' }, { code: '46', name: 'Lot' },
  { code: '48', name: 'Lozère' }, { code: '81', name: 'Tarn' }, { code: '82', name: 'Tarn-et-Garonne' },
  { code: '04', name: 'Alpes-de-Haute-Provence' }, { code: '05', name: 'Hautes-Alpes' }, { code: '2A', name: 'Corse-du-Sud' }, { code: '2B', name: 'Haute-Corse' },
];
