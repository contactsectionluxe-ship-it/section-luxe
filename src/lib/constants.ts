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

/** Tailles pantalon (numériques). À ajouter en plus de XS/S/M... quand le modèle est un pantalon. */
export const PANT_SIZES_HOMME = ['38', '40', '42', '44', '46', '48', '50', '52', '54', '56', '58'] as const;
export const PANT_SIZES_FEMME = ['32', '34', '36', '38', '40', '42', '44', '46', '48', '50', '52'] as const;
/** Mix (homme+femme) ou quand aucun genre n’est précisé : 32 à 58. */
export const PANT_SIZES_MIX = ['32', '34', '36', '38', '40', '42', '44', '46', '48', '50', '52', '54', '56', '58'] as const;

export function getPantSizesForGenre(genre: ('homme' | 'femme')[] | null | undefined): string[] {
  const g = genre ?? [];
  const hasH = g.includes('homme');
  const hasF = g.includes('femme');
  if (hasH && hasF) return [...PANT_SIZES_MIX];
  if (hasH) return [...PANT_SIZES_HOMME];
  if (hasF) return [...PANT_SIZES_FEMME];
  return [...PANT_SIZES_MIX];
}

/** Tailles jean (numériques). À ajouter quand le modèle est un jean. */
export const JEAN_SIZES_FEMME = ['24', '25', '26', '27', '28', '29', '30', '31', '32'] as const;
export const JEAN_SIZES_HOMME = ['28', '29', '30', '31', '32', '33', '34', '35', '36', '38', '40'] as const;
/** Mix (homme+femme) ou quand aucun genre n’est précisé : 24 à 40. */
export const JEAN_SIZES_MIX = ['24', '25', '26', '27', '28', '29', '30', '31', '32', '33', '34', '35', '36', '38', '40'] as const;

export function getJeanSizesForGenre(genre: ('homme' | 'femme')[] | null | undefined): string[] {
  const g = genre ?? [];
  const hasH = g.includes('homme');
  const hasF = g.includes('femme');
  if (hasH && hasF) return [...JEAN_SIZES_MIX];
  if (hasH) return [...JEAN_SIZES_HOMME];
  if (hasF) return [...JEAN_SIZES_FEMME];
  return [...JEAN_SIZES_MIX];
}

/** Modèles toujours proposés pour la catégorie vêtements (dépôt annonce), en plus des modèles par marque. Filtrés selon genre (Femme / Homme). */
export const VETEMENTS_MODELES_TOUJOURS_PROPOSES: { name: string; genre: 'femme' | 'homme' | 'both' }[] = [
  { name: 'Blazer', genre: 'both' },
  { name: 'Caban', genre: 'both' },
  { name: 'Camel Coat', genre: 'both' },
  { name: 'Cardigan', genre: 'both' },
  { name: 'Chemise', genre: 'both' },
  { name: 'Jean', genre: 'both' },
  { name: 'Jupe', genre: 'femme' },
  { name: 'Manteau', genre: 'both' },
  { name: 'Pantalon', genre: 'both' },
  { name: 'Pull', genre: 'both' },
  { name: 'Robe', genre: 'femme' },
  { name: 'Short', genre: 'both' },
  { name: 'Smoking', genre: 'homme' },
  { name: 'Sweat', genre: 'both' },
  { name: 'T-shirt', genre: 'both' },
  { name: 'Trench', genre: 'both' },
  { name: 'Tweed', genre: 'both' },
  { name: 'Veste', genre: 'both' },
];

/** Modèles vêtements orientés Femme : à ne pas proposer quand seul Homme est sélectionné. */
export const VETEMENTS_MODELES_FEMME_ONLY = [
  'Jupe', 'Robe', 'Jupe plissée', 'Tailleur tweed', 'Cardigan signature', 'Cardigan boutonné',
  'Bar Jacket', 'Tailleur Bar', 'Robe Miss Dior', 'Robe Soir', 'Robe volant', 'Robe cape', 'Robe Rockstud', 'Robe Garavani',
  'Manuela', 'Teddy', 'Egeo', 'Icon', 'Cardigan style sweat',
  'Pantalon cigarette', 'Blouson Baguette',
];

/** Modèles vêtements orientés Homme : à ne pas proposer quand seule Femme est sélectionnée. */
export const VETEMENTS_MODELES_HOMME_ONLY = [
  'Smoking', 'Veste classique', 'Blouson Bombers', 'Sweat 3B', 'Hoodie Round', 'Hoodie Ski', 'Blouson Tape',
  'Pull cachemire', 'Cardigan zippé', 'Pull col V', 'Pull col montant', 'Blouson Linea Rossa', 'Parka',
];

/** Modèles chaussures réservés Femme : à ne pas proposer quand seul Homme est sélectionné. */
export const CHAUSSURES_MODELES_FEMME_ONLY = [
  'Escarpins', 'Ballerines', 'Bottines', 'Sandales', 'Slingback', 'Cap-Toe', 'Ballerine',
  'Walk\'n\'Dior', 'J\'adior', 'Tributes', 'Court', 'Pigalle', 'So Kate', 'Bianca', 'Décolleté', 'Simple Pump', 'Louboutin', 'Spike',
  'Hangisi', 'BB', 'Maysale', 'Lurum', 'Campari', 'Suede',
  'Belle Vivier', 'Très Vivier', 'Belle de Nuit',
  'Jackie', 'Romy', 'Anouk', 'Bing', 'Memento', 'Bing 85', 'Mulan',
  'First', 'Gate', 'Flamenco', 'Drop', 'Platform',
  'Wild Thing', 'Belgravia', 'Christy', 'Sexy Thing', 'Open',
  'Oran', 'Quick', 'Chypre', 'Sandals', 'Tire', 'Lido', 'Puddle', 'Stretch',
  'Run Away', 'Frontrow', 'Princetown', 'Brixton', 'Archlight',
  'Rockstud', 'Garavani', 'One Stud',
  'Speed', 'Strike',
];

/** Modèles chaussures réservés Homme : à ne pas proposer quand seule Femme est sélectionnée. */
export const CHAUSSURES_MODELES_HOMME_ONLY = [
  'Derby', 'Wyatt', 'Monolith', 'Charlie', 'Skate', 'Ezcape', '3XL', 'Runner', 'Gum', 'Voyou', 'Combat', 'Viv\' Run',
];

/** Modèles sacs réservés Femme : à ne pas proposer quand seul Homme est sélectionné. */
export const SACS_MODELES_FEMME_ONLY = [
  'Birkin 25', 'Birkin 30', 'Kelly 25', 'Kelly 28', 'Kelly 32', 'Kelly 35', 'Mini Lindy', 'Constance', 'Lindy',
  'Neverfull', 'Speedy 25', 'Speedy 30', 'Speedy 35', 'Pochette Métis', 'Alma', 'Capucines', 'Petite Malle', 'Dauphine', 'Loop',
  'Classic Flap', '2.55', 'Boy', 'Gabrielle', 'Coco Handle', '19', 'Wallet on Chain', 'Vanity', '22', '31',
  'Lady Dior', 'Kate', 'Niki', 'LouLou', 'First', 'Baguette', 'Baguette Soft',
];

/** Modèles sacs réservés Homme : à ne pas proposer quand seule Femme est sélectionnée. */
export const SACS_MODELES_HOMME_ONLY = [
  'Keepall', 'Soft Trunk', 'Discovery', 'Herbag', 'Hac à dos', 'Dior Camp',
];

/** Modèles bijoux réservés Femme : à ne pas proposer quand seul Homme est sélectionné. */
export const BIJOUX_MODELES_FEMME_ONLY = [
  'Amulette', 'Destinée', 'Joséphine', 'Bee My Love', 'Between the Finger', 'Fiorever', 'Coco Crush', 'Coco Crush Mat',
  'Tribales', 'Sweet', 'Lotus', 'Cœur', 'Zip', 'Premier',
];

/** Modèles bijoux réservés Homme : à ne pas proposer quand seule Femme est sélectionnée. */
export const BIJOUX_MODELES_HOMME_ONLY = [
  'Clash', 'Maillon Panthère', 'Écrou', 'Collier de chien',
];

/** Modèles montres orientés Femme : à ne pas proposer quand seul Homme est sélectionné. */
export const MONTRES_MODELES_FEMME_ONLY = [
  'Lady-Datejust', 'Twenty~4', 'Mademoiselle', 'Première', 'Code Coco', 'La D de Dior', 'Grand Soir',
  'Lady Arpels', 'Limelight', 'Limelight Gala', 'Possession', 'Rendez-Vous',
  'Reine de Naples', 'Ladybird', "Cat's Eye", 'DolceVita', 'Noemia',
  'Panthère', 'Baignoire', 'Baignoire Allongée', 'Serpenti',
];

/** Modèles montres orientés Homme : à ne pas proposer quand seule Femme est sélectionnée. */
export const MONTRES_MODELES_HOMME_ONLY = [
  'Submariner', 'Submariner Date', 'GMT-Master II', 'Explorer', 'Explorer II', 'Sea-Dweller', 'Deepsea', 'Milgauss', 'Air-King',
  'Royal Oak Offshore', 'Royal Oak Concept', 'Big Pilot', 'Navitimer', 'Chronomat', 'Avenger', 'Superocean',
  'Luminor', 'Submersible', 'Radiomir', 'Luminor Marina', 'Luminor Due',
  'Type XX', 'Spirit of Big Bang', 'Square Bang', 'Portugieser', 'Pilot', 'Aquatimer', 'Ingenieur',
  'Fifty Fathoms', 'Air Command', 'Monaco', 'Carrera', 'Aquaracer', 'Formula 1',
  'Pierre Arpels',
];

/** Modèles à ne pas proposer quand ils sont identiques au nom de la catégorie (ex. catégorie Sacs → ne pas proposer "Sac"). */
export const MODELE_EXCLU_QUAND_IDENTIQUE_CATEGORIE: Record<string, string[]> = {
  sacs: ['Sac', 'Sacs'],
  bijoux: ['Bijou', 'Bijoux'],
  chaussures: ['Chaussure', 'Chaussures'],
  vetements: ['Vêtement', 'Vêtements'],
  accessoires: ['Accessoire', 'Accessoires'],
  montres: ['Montre', 'Montres'],
  autre: ['Autre'],
};

/** Groupes de variantes d’orthographe pour le filtre catalogue : un filtre sur un modèle doit aussi matcher les autres écritures (ex. T-Shirt / Tshirt). */
const MODEL_FILTER_EQUIVALENTS: string[][] = [
  ['T-Shirt', 'Tshirt', 'T shirt', 't-shirt', 't shirt', 'T-shirt'],
  ['Camel Coat', 'Camel coat', 'CamelCoat'],
];

function normalizeModelForFilter(s: string): string {
  return (s || '').toLowerCase().replace(/-/g, '').replace(/\s+/g, '').trim();
}

/** Retourne toutes les variantes d’orthographe à envoyer à l’API pour un filtre modèle (ex. "T-Shirt" → ["T-Shirt", "Tshirt", "T shirt", ...]). */
export function getModelFilterVariants(model: string): string[] {
  if (!model?.trim()) return [];
  const key = normalizeModelForFilter(model);
  for (const group of MODEL_FILTER_EQUIVALENTS) {
    if (group.some((m) => normalizeModelForFilter(m) === key)) return group;
  }
  return [model.trim()];
}

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
    'Loewe': ['Puzzle', 'Hammock', 'Gate', 'Flamenco', 'Basket', 'Cubi', 'Paseo', 'Ana', 'Squeeze', 'Autre'],
    'Chloé': ['Marcie', 'Drew', 'Tess', 'Woody', 'Nile', 'Faye', 'Edith', 'Paddington', 'Autre'],
    'Givenchy': ['Antigona', 'Voyou', 'Cut-Out', '4G', 'Moon Cut-Out', 'Pandora', 'Autre'],
    'Valentino': ['Rockstud', 'Locò', 'One Stud', 'Roman Stud', 'Garavani', 'Vsling', 'Autre'],
    'Goyard': ['Saint Louis', 'Cap Vert', 'Anjou', 'Artois', 'Saigon', 'Belvedere', 'Boîte Aluminium', 'Autre'],
    'Delvaux': ['Brillant', 'Tempête', 'Madame', 'Cool Box', 'Pin', 'Autre'],
    'Moynat': ['Réjane', 'Gabrielle', 'Pauline', 'Limousine', 'Curieuse', 'Autre'],
    'Valextra': ['Iside', 'Tric Trac', 'Brera', 'Serena', 'Autre'],
    'Mulberry': ['Bayswater', 'Alexa', 'Lily', 'Amberley', 'Autre'],
    'Bulgari': ['Serpenti', 'Serpenti Tubogas', 'Divas\' Dream', 'Bvlgari Bvlgari', 'Autre'],
    'Balenciaga': ['Hourglass', 'Le Cagole', 'Neo Cagole', 'City', 'Autre'],
    'Alexander McQueen': ['Jewelled Satchel', 'The Curve', 'The Bow', 'Autre'],
    'Marni': ['Trunk', 'Pannier', 'Autre'],
    'Salvatore Ferragamo': ['Gancini', 'Studio', 'Hobo', 'Autre'],
    'Tod\'s': ['D Bag', 'Gommino', 'Di Bag', 'Autre'],
    'Bally': ['Janelle', 'Sergeant', 'Scribe', 'Metropolis', 'Autre'],
    'Celine': ['Triomphe', 'Ava', 'Belt', '16', 'Triomphe Canvas', 'Luggage', 'Autre'],
    'Lanvin': ['Pencil', 'Cat Bag', 'Puffy', 'Autre'],
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
    'Rolex': ['Submariner', 'Submariner Date', 'Daytona', 'Datejust', 'Day-Date', 'GMT-Master II', 'Explorer', 'Explorer II', 'Yacht-Master', 'Oyster Perpetual', 'Sky-Dweller', 'Sea-Dweller', 'Deepsea', 'Milgauss', 'Air-King', 'Cellini', 'Lady-Datejust', '1908', 'Autre'],
    'Audemars Piguet': ['Royal Oak', 'Royal Oak Offshore', 'Royal Oak Concept', 'Code 11.59', 'Millenary', 'Jules Audemars', 'Edward Piguet', 'Autre'],
    'Patek Philippe': ['Nautilus', 'Aquanaut', 'Calatrava', 'Complications', 'Perpetual Calendar', 'Twenty~4', 'Golden Ellipse', 'World Time', 'Autre'],
    'Cartier': ['Tank', 'Tank Louis', 'Tank Française', 'Santos', 'Ballon Bleu', 'Panthère', 'Clé', 'Ronde', 'Baignoire', 'Drive', 'Pasha', 'Baignoire Allongée', 'Autre'],
    'Omega': ['Speedmaster', 'Seamaster', 'Constellation', 'Aqua Terra', 'De Ville', 'Planet Ocean', 'Moonwatch', 'Seamaster Diver', 'Globemaster', 'Railmaster', 'Diver 300M', 'Autre'],
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
    'Piaget': ['Polo', 'Polo Date', 'Altiplano', 'Limelight', 'Limelight Gala', 'Possession', 'Autre'],
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
    'Chanel': ['Veste Tweed', 'Cardigan signature', 'Veste classique', 'Robe', 'Jupe plissée', 'Pantalon', 'Manteau', 'Tailleur tweed', 'Cardigan boutonné', 'Autre'],
    'Louis Vuitton': ['Veste Monogram', 'Pantalon', 'Robe', 'Sweat', 'T-shirt', 'Manteau', 'Short', 'Blouson', 'Parka', 'Autre'],
    'Gucci': ['Blazer GG', 'Robe', 'Veste Horsebit', 'Sweat', 'Pantalon', 'Manteau', 'Jupe', 'Blazer laine', 'Veste GG Canvas', 'Autre'],
    'Prada': ['Veste Nylon', 'Robe', 'Manteau Saffiano', 'Pantalon', 'Sweat', 'Jupe', 'Veste cuir', 'Blouson Linea Rossa', 'Autre'],
    'Dior': ['Bar Jacket', 'Tailleur Bar', 'Robe Miss Dior', 'Veste', 'Manteau', 'Jupe plissée', 'Pantalon', 'Robe Soir', 'Sweat Oblique', 'Autre'],
    'Saint Laurent': ['Le Smoking', 'Blazer', 'Veste Loulou', 'Robe', 'Manteau', 'Pantalon cigarette', 'Blouson cuir', 'Trench', 'Autre'],
    'Hermès': ['Caban Chaîne d\'ancre', 'Veste', 'Robe', 'Pantalon', 'Manteau', 'Cardigan', 'Trench', 'Blouson Bombers', 'Cardigan cachemire', 'Autre'],
    'Fendi': ['Veste', 'Robe', 'Manteau', 'Pantalon', 'Jupe', 'Sweat', 'Blouson Baguette', 'Cardigan', 'Autre'],
    'Bottega Veneta': ['Veste', 'Robe', 'Pantalon', 'Sweat', 'Manteau', 'Cardigan', 'Blouson intrecciato', 'Trench', 'Autre'],
    'Loewe': ['Veste', 'Robe', 'Manteau', 'Pantalon', 'Sweat', 'Jupe', 'Blouson Puzzle', 'Cardigan', 'Autre'],
    'Balenciaga': ['Sweat 3B', 'Hoodie Round', 'Veste', 'Robe', 'Pantalon', 'Sweat', 'Manteau', 'T-shirt', 'Blouson Tape', 'Hoodie Ski', 'Autre'],
    'Givenchy': ['Veste', 'Robe', 'Pantalon', 'Manteau', 'Sweat', 'Blouson 4G', 'Trench', 'Cardigan', 'Autre'],
    'Valentino': ['Robe Rockstud', 'Veste', 'Pantalon', 'Manteau', 'Jupe', 'Robe Garavani', 'Blazer', 'Trench', 'Autre'],
    'Versace': ['Robe', 'Veste', 'Pantalon', 'Manteau', 'Jupe', 'Blouson Medusa', 'Cardigan', 'Autre'],
    'Alexander McQueen': ['Robe', 'Veste', 'Pantalon', 'Manteau', 'Jupe', 'Blazer tailleur', 'Trench', 'Autre'],
    'Brunello Cucinelli': ['Pull cachemire', 'Cardigan zippé', 'Veste', 'Manteau', 'Pantalon', 'Cardigan style sweat', 'Pull col V', 'Pull col montant', 'Autre'],
    'Max Mara': ['Manuela', 'Teddy', 'Caban', 'Camel Coat', 'Robe', 'Veste', 'Manteau', 'Pantalon', 'Egeo', 'Icon', 'Autre'],
    'Salvatore Ferragamo': ['Veste', 'Robe', 'Pantalon', 'Manteau', 'Jupe', 'Blazer Gancini', 'Cardigan', 'Autre'],
    'Chloé': ['Robe volant', 'Veste', 'Pantalon', 'Manteau', 'Jupe', 'Cardigan', 'Robe cape', 'Trench', 'Blouson', 'Autre'],
    'Marni': ['Robe', 'Veste', 'Pantalon', 'Manteau', 'Jupe', 'Cardigan', 'Blouson', 'Autre'],
  },
  chaussures: {
    'Louis Vuitton': ['Archlight', 'Run Away', 'Frontrow', 'Trainer', 'LV Trainer', 'Aerogram', 'Soft Trunk', 'Charlie', 'Skate', 'Autre'],
    'Chanel': ['Ballerines', 'Bottes', 'Escarpins', 'Baskets', 'Bottines', 'Sandales', 'Slingback', 'Cap-Toe', 'Autre'],
    'Gucci': ['Ace', 'Princetown', 'Brixton', 'Rhyton', 'Gazelle', 'Jackie', 'Horsebit', 'Screener', 'Luna', 'Rhyton 2.0', 'Autre'],
    'Prada': ['Monolith', 'America\'s Cup', 'Cloudbust', 'Derby', 'Loafer', 'Linea Rossa', 'Symbole', 'Autre'],
    'Dior': ['B30', 'B22', 'Walk\'n\'Dior', 'Escarpins', 'Bottes', 'J\'adior', 'D-Fusion', 'B27', 'Autre'],
    'Saint Laurent': ['Wyatt', 'Tributes', 'Bottes', 'Escarpins', 'Loafer', 'Slides', 'Court', 'Niki', 'Lou', 'Autre'],
    'Hermès': ['Oran', 'Sandales', 'Bottes', 'Mocassins', 'Quick', 'Chypre', 'Avalon', 'Ezcape', 'Autre'],
    'Bottega Veneta': ['Puddle', 'Tire', 'Lido', 'Sandals', 'Stretch', 'Drop', 'Platform', 'Autre'],
    'Fendi': ['Fendigraphy', 'Baskets', 'Escarpins', 'Bottes', 'Slides', 'Rolling', 'First', 'Autre'],
    'Loewe': ['Balloon', 'Puzzle', 'Baskets', 'Gate', 'Flamenco', 'Flow', 'Croc', 'Autre'],
    'Jimmy Choo': ['Bing', 'Memento', 'Romy', 'Anouk', 'Bottes', 'Bing 85', 'Mulan', 'Autre'],
    'Manolo Blahnik': ['Hangisi', 'BB', 'Maysale', 'Lurum', 'Campari', 'Suede', 'Autre'],
    'Roger Vivier': ['Belle Vivier', 'Très Vivier', 'Belle de Nuit', 'Ballerine', 'Viv\' Run', 'Combat', 'Autre'],
    'Valentino': ['Rockstud', 'Garavani', 'One Stud', 'Bottes', 'Escarpins', 'Open', 'VLogo', 'Autre'],
    'Christian Louboutin': ['Pigalle', 'So Kate', 'Bianca', 'Décolleté', 'Bottes', 'Simple Pump', 'Louboutin', 'Spike', 'Autre'],
    'Aquazzura': ['Wild Thing', 'Belgravia', 'Christy', 'Sandales', 'Escarpins', 'Sexy Thing', 'Autre'],
    'Givenchy': ['Bottes', 'Escarpins', 'Baskets', 'Sandales', 'Voyou', 'Gum', 'Autre'],
    'Balenciaga': ['Triple S', 'Track', 'Speed', 'Defender', 'Strike', 'Baskets', 'Bottes', '3XL', 'Runner', 'Autre'],
  },
  accessoires: {
    'Hermès': ['Ceinture', 'Ceinture H', 'Ceinture Collier de chien', 'Écharpe', 'Carré', 'Carré 90', 'Carré 140', 'Cravate', 'Porte-clés', 'Porte-carte', 'Portefeuille long', 'Portefeuille', 'Porte-monnaie', 'Pochette', 'Gants', 'Lunettes', 'Casquette', 'Bonnet', 'Chapeau', 'Bob', 'Éventail', 'Autre'],
    'Louis Vuitton': ['Ceinture', 'Écharpe', 'Porte-monnaie', 'Porte-carte', 'Portefeuille long', 'Portefeuille', 'Victorine', 'Zippy', 'Porte-clés', 'Pochette', 'Lunettes', 'Foulard', 'Casquette', 'Bonnet', 'Chapeau', 'Bob', 'Autre'],
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

/** Modèles supplémentaires par catégorie, marque et genre (affichés uniquement pour Femme ou uniquement pour Homme). */
export const EXTRA_MODELS_BY_CATEGORY_BRAND_GENRE: Record<string, Record<string, { femme?: string[]; homme?: string[] }>> = {
  chaussures: {
    'Louis Vuitton': { homme: ['Archlight', 'LV Trainer', 'Charlie', 'Skate'], femme: ['Run Away', 'Tributes', 'Ballerines'] },
    'Chanel': { femme: ['Slingback', 'Cap-Toe', 'Ballerines', 'Escarpins'], homme: ['Baskets', 'Derby'] },
    'Dior': { femme: ['J\'adior', 'Escarpins'], homme: ['B30', 'B22', 'Walk\'n\'Dior', 'D-Fusion'] },
    'Saint Laurent': { homme: ['Wyatt', 'Loafer', 'Lou'], femme: ['Tributes', 'Court', 'Escarpins'] },
    'Gucci': { homme: ['Ace', 'Rhyton', 'Screener'], femme: ['Jackie', 'Princetown', 'Brixton'] },
    'Balenciaga': { homme: ['Triple S', 'Track', 'Runner', '3XL'], femme: ['Speed', 'Strike', 'Bottes'] },
  },
  sacs: {
    'Hermès': { femme: ['Birkin 25', 'Birkin 30', 'Kelly 25', 'Kelly 28', 'Mini Lindy'], homme: ['Herbag', 'Hac à dos', 'Evelyne'] },
    'Louis Vuitton': { femme: ['Neverfull', 'Speedy 25', 'Pochette Métis'], homme: ['Keepall', 'Soft Trunk', 'Discovery'] },
  },
  bijoux: {
    'Cartier': { femme: ['Love', 'Juste un Clou', 'Amulette', 'Destinée'], homme: ['Clash', 'Maillon Panthère', 'Écrou'] },
    'Hermès': { femme: ['Clic H', 'Chaîne d\'ancre', 'Kelly'], homme: ['Chaîne d\'ancre', 'Collier de chien'] },
  },
  vetements: {
    'Chanel': { femme: ['Veste Tweed', 'Cardigan signature', 'Robe', 'Jupe plissée', 'Tailleur tweed'], homme: ['Veste classique', 'Pantalon', 'Manteau'] },
    'Dior': { femme: ['Bar Jacket', 'Tailleur Bar', 'Robe Miss Dior', 'Robe Soir', 'Jupe plissée'], homme: ['Pantalon', 'Sweat Oblique', 'Veste'] },
    'Saint Laurent': { femme: ['Le Smoking', 'Robe', 'Pantalon cigarette', 'Blouson cuir'], homme: ['Le Smoking', 'Blazer', 'Trench', 'Pantalon'] },
    'Max Mara': { femme: ['Manuela', 'Teddy', 'Caban', 'Camel Coat', 'Robe', 'Egeo', 'Icon'], homme: ['Caban', 'Manteau', 'Pantalon'] },
    'Hermès': { femme: ['Caban Chaîne d\'ancre', 'Robe', 'Cardigan cachemire'], homme: ['Veste', 'Pantalon', 'Trench', 'Blouson Bombers'] },
    'Balenciaga': { homme: ['Sweat 3B', 'Hoodie Round', 'Hoodie Ski', 'Blouson Tape', 'T-shirt'], femme: ['Robe', 'Veste', 'Manteau', 'Jupe'] },
    'Brunello Cucinelli': { homme: ['Pull cachemire', 'Cardigan zippé', 'Veste', 'Pull col V', 'Pull col montant'], femme: ['Cardigan style sweat', 'Robe', 'Manteau'] },
    'Chloé': { femme: ['Robe volant', 'Robe cape', 'Jupe', 'Cardigan', 'Trench'], homme: ['Veste', 'Pantalon', 'Manteau'] },
  },
};

/** Modèles par catégorie, marque et genre (Homme / Femme). Base commune + modèles supplémentaires par genre. */
export const MODELS_BY_CATEGORY_BRAND_AND_GENRE: Record<string, Record<string, { femme: string[]; homme: string[] }>> = (() => {
  const out: Record<string, Record<string, { femme: string[]; homme: string[] }>> = {};
  const extra = EXTRA_MODELS_BY_CATEGORY_BRAND_GENRE;
  for (const cat of Object.keys(MODELS_BY_CATEGORY_BRAND)) {
    out[cat] = {};
    for (const brand of Object.keys(MODELS_BY_CATEGORY_BRAND[cat])) {
      const base = MODELS_BY_CATEGORY_BRAND[cat][brand];
      const ext = extra[cat]?.[brand];
      const femme = ext?.femme ? [...new Set([...base, ...ext.femme])] : base;
      const homme = ext?.homme ? [...new Set([...base, ...ext.homme])] : base;
      out[cat][brand] = { femme, homme };
    }
  }
  return out;
})();

/** Type (Bracelet, Bague, Collier, etc.) par marque et modèle — jamais identique à la catégorie "bijoux". */
export const MODEL_TYPE_BIJOUX: Record<string, Record<string, string>> = {
  'Hermès': { 'Clic H': 'Bracelet', 'Chaîne d\'ancre': 'Bracelet', 'Kelly': 'Collier', 'Collier de chien': 'Collier' },
  'Cartier': { 'Love': 'Bracelet', 'Juste un Clou': 'Bracelet', 'Panthère': 'Bracelet', 'Trinity': 'Bracelet', 'Écrou': 'Bracelet', 'Clash': 'Bracelet', 'Maillon Panthère': 'Bracelet', 'Baignoire': 'Bracelet', 'Amulette': 'Pendentif', 'Destinée': 'Bague' },
  'Van Cleef & Arpels': { 'Alhambra': 'Bracelet', 'Perlée': 'Bracelet', 'Frivole': 'Bracelet', 'Between the Finger': 'Bague', 'Sweet': 'Bracelet', 'Lotus': 'Bracelet', 'Cœur': 'Pendentif', 'Magic': 'Bracelet', 'Zip': 'Collier' },
  'Bulgari': { 'B.zero1': 'Bracelet', 'Serpenti': 'Bracelet', 'Divas\' Dream': 'Bracelet', 'Bvlgari Bvlgari': 'Bracelet', 'Fiorever': 'Bague', 'Octo': 'Bracelet', 'Parentesi': 'Bracelet' },
  'Tiffany': { 'Atlas': 'Bracelet', 'T True': 'Bracelet', 'Return to Tiffany': 'Bracelet', 'Keys': 'Pendentif', 'HardWear': 'Bracelet', 'T1': 'Bracelet', 'Lock': 'Bracelet', 'Tiffany T': 'Bracelet' },
  'Chanel': { 'Coco Crush': 'Bague', 'Camélia': 'Bracelet', 'Ultra': 'Bracelet', 'Comète': 'Collier', 'Ruban': 'Bracelet', 'Sous le Soleil': 'Bracelet', 'Coco Crush Mat': 'Bague' },
  'Dior': { 'Rose des Vents': 'Collier', 'Tribales': 'Boucles d\'oreilles', 'Diorama': 'Bracelet', 'Gem Dior': 'Bague', 'Oui': 'Bracelet', 'Diorette': 'Bracelet' },
  'Louis Vuitton': { 'LV Volt': 'Bracelet', 'Idylle': 'Collier', 'Blossom': 'Bracelet', 'B Blossom': 'Bracelet', 'Spell On': 'Bracelet', 'Stellar Times': 'Bracelet' },
  'Gucci': { 'Interlocking': 'Bracelet', 'Horsebit': 'Bracelet', 'Blind for Love': 'Bracelet', 'Link to Love': 'Bracelet', 'Hortus Deliciarum': 'Collier' },
  'Prada': { 'Symphony': 'Bracelet', 'Eternal Gold': 'Bracelet', 'Linea Rossa': 'Bracelet' },
  'Boucheron': { 'Quatre': 'Bague', 'Serpent Bohème': 'Bracelet', 'Jack': 'Bague', 'Reflet': 'Bracelet', 'Plume': 'Bracelet' },
  'Harry Winston': { 'Winston Cluster': 'Collier', 'Classic Winston': 'Bracelet', 'Logo': 'Bracelet', 'Premier': 'Bague' },
  'David Yurman': { 'Cable': 'Bracelet', 'Renaissance': 'Bracelet', 'Infinity': 'Bracelet', 'Petals': 'Boucles d\'oreilles' },
  'De Beers': { 'DB Classic': 'Bracelet', 'Enchanted Lotus': 'Bracelet', 'Aura': 'Bracelet' },
  'Graff': { 'Butterfly': 'Pendentif', 'Graff Diamond': 'Bracelet', 'Spiral': 'Bracelet' },
  'Messika': { 'Move': 'Bracelet', 'My Way': 'Bracelet', 'Glam\'azon': 'Bracelet' },
  'Pomellato': { 'Nudo': 'Bague', 'Ritorno': 'Bracelet', 'Mango': 'Bracelet' },
  'Fred': { 'Force 10': 'Bracelet' },
  'Repossi': { 'Antifer': 'Bracelet', 'Serti sur vide': 'Bague', 'Berbère': 'Bracelet', 'Blast': 'Bracelet', 'Serti inversé': 'Bracelet' },
  'Mauboussin': { '1827': 'Bracelet', 'Étoile divine': 'Bracelet', 'Belle comme le vent': 'Bracelet', 'Trop smart': 'Bracelet', 'Union chance': 'Bague' },
  'Courbet': { 'Tennis': 'Bracelet', 'Les solitaires': 'Bague', 'Origine': 'Bracelet', 'Pont des arts': 'Bracelet' },
  'Swarovski': { 'Mesmera': 'Bracelet', 'Symbolica': 'Collier', 'Vienna': 'Bracelet', 'Octagon': 'Bracelet' },
  'Chopard': { 'Happy Hearts': 'Bracelet', 'Ice Cube': 'Bracelet', 'Happy Spirit': 'Bracelet', 'Imperiale': 'Bracelet', 'Happy Diamonds': 'Bracelet' },
  'Chaumet': { 'Liens': 'Bracelet', 'Joséphine': 'Bague', 'Bee My Love': 'Bague', 'Jeux de Liens': 'Bracelet', 'Class One': 'Bracelet' },
  'Piaget': { 'Possession': 'Bracelet', 'Limelight': 'Bracelet', 'Rose': 'Bracelet', 'Sunlight': 'Bracelet', 'Piaget Rose': 'Bracelet' },
};

/** Type (Sac à main, Pochette, Sac de voyage, etc.) par marque et modèle — jamais identique à la catégorie "sacs". */
export const MODEL_TYPE_SACS: Record<string, Record<string, string>> = {
  'Hermès': { 'Birkin 25': 'Sac à main', 'Birkin 30': 'Sac à main', 'Birkin 35': 'Sac à main', 'Birkin 40': 'Sac à main', 'Kelly 25': 'Sac à main', 'Kelly 28': 'Sac à main', 'Kelly 32': 'Sac à main', 'Kelly 35': 'Sac à main', 'Constance': 'Sac à main', 'Lindy': 'Sac à main', 'Évelyne': 'Sac bandoulière', 'Bolide': 'Sac à main', 'Picotin': 'Sac à main', 'Garden Party': 'Sac à main', 'Herbag': 'Sac à dos', 'Roulis': 'Sac à main', '24/24': 'Sac à main', 'Verrou': 'Sac à main', 'Jypsière': 'Sac à main', 'In-The-Loop': 'Pochette', 'Steeple': 'Sac à main', 'Mini Lindy': 'Sac à main', 'Hac à dos': 'Sac à dos' },
  'Louis Vuitton': { 'Neverfull': 'Sac à main', 'Speedy 25': 'Sac à main', 'Speedy 30': 'Sac à main', 'Speedy 35': 'Sac à main', 'Speedy Bandoulière': 'Sac bandoulière', 'Keepall': 'Sac de voyage', 'Alma': 'Sac à main', 'Capucines': 'Sac à main', 'Pochette Métis': 'Pochette', 'Noé': 'Sac à main', 'Petite Malle': 'Pochette', 'Twist': 'Sac à main', 'Dauphine': 'Sac à main', 'OnTheGo': 'Sac à main', 'Cannes': 'Pochette', 'Boulogne': 'Sac à main', 'Bella': 'Sac à main', 'Soft Trunk': 'Sac à main', 'Carryall': 'Sac à main', 'Loop': 'Sac à main', 'Discovery': 'Sac à dos' },
  'Chanel': { 'Classic Flap': 'Sac à main', '2.55': 'Sac à main', 'Boy': 'Sac à main', 'Gabrielle': 'Sac à main', 'Coco Handle': 'Sac à main', '19': 'Sac à main', 'Wallet on Chain': 'Pochette', 'Grand Shopping': 'Sac à main', 'Trendy': 'Sac à main', 'Reissue': 'Sac à main', 'Vanity': 'Pochette', '22': 'Sac à main', '31': 'Sac à main' },
  'Gucci': { 'Dionysus': 'Sac à main', 'Marmont': 'Sac à main', 'Jackie': 'Sac à main', 'Horsebit': 'Sac à main', 'Ophidia': 'Sac à main', 'Bamboo': 'Sac à main', 'Jackie 1961': 'Sac à main', 'Horsebit 1955': 'Sac à main', 'Gucci Blondie': 'Sac à main', 'Web': 'Sac à main' },
  'Prada': { 'Galleria': 'Sac à main', 'Saffiano': 'Sac à main', 'Re-Edition': 'Sac à main', 'Cleo': 'Sac à main', 'Nylon': 'Sac à main', 'Sidonie': 'Sac à main', 'Arqué': 'Sac à main', 'Brique': 'Sac à main', 'Moon': 'Sac à main' },
  'Dior': { 'Lady Dior': 'Sac à main', 'Saddle': 'Sac à main', 'Book Tote': 'Sac à main', 'Bobby': 'Sac bandoulière', 'Carousel': 'Sac à main', 'Diorama': 'Sac à main', 'Caro': 'Sac à main', 'Dior Camp': 'Sac à dos' },
  'Saint Laurent': { 'Sac de Jour': 'Sac à main', 'LouLou': 'Sac à main', 'Kate': 'Pochette', 'Niki': 'Sac à main', 'Le 5 à 7': 'Sac à main', 'Solferino': 'Sac à main', 'Icare': 'Sac à main', 'Uptown': 'Sac à main', 'Léopard': 'Sac à main' },
  'Bottega Veneta': { 'Pouch': 'Pochette', 'Cassette': 'Sac à main', 'Jodie': 'Sac à main', 'Arco': 'Sac à main', 'Kalimero': 'Sac à main', 'Andiamo': 'Sac à main', 'Brick': 'Sac à main', 'Sardine': 'Sac à main' },
  'Fendi': { 'Baguette': 'Sac bandoulière', 'Peekaboo': 'Sac à main', 'By The Way': 'Sac à main', 'Sunshine': 'Sac à main', 'First': 'Pochette', 'Fendigraphy': 'Sac à main', 'Baguette Soft': 'Sac bandoulière' },
  'Chloé': { 'Marcie': 'Sac à main', 'Drew': 'Sac à main', 'Tess': 'Sac à main', 'Woody': 'Sac à main', 'Nile': 'Sac à main', 'Faye': 'Sac à main', 'Edith': 'Sac à main', 'Paddington': 'Sac à main' },
  'Givenchy': { 'Antigona': 'Sac à main', 'Voyou': 'Sac à main', 'Cut-Out': 'Sac à main', '4G': 'Sac à main', 'Moon Cut-Out': 'Sac à main', 'Pandora': 'Sac à main' },
  'Valentino': { 'Rockstud': 'Sac à main', 'Locò': 'Sac à main', 'One Stud': 'Sac à main', 'Roman Stud': 'Sac à main', 'Garavani': 'Sac à main', 'Vsling': 'Sac bandoulière' },
  'Goyard': { 'Saint Louis': 'Sac à main', 'Cap Vert': 'Sac à main', 'Anjou': 'Sac à main', 'Artois': 'Sac à main', 'Saigon': 'Sac à main', 'Belvedere': 'Sac à main', 'Boîte Aluminium': 'Pochette' },
  'Delvaux': { 'Brillant': 'Sac à main', 'Tempête': 'Sac à main', 'Madame': 'Sac à main', 'Cool Box': 'Sac à main', 'Pin': 'Pochette' },
  'Moynat': { 'Réjane': 'Sac à main', 'Gabrielle': 'Sac à main', 'Pauline': 'Sac à main', 'Limousine': 'Sac à main', 'Curieuse': 'Sac à main' },
  'Valextra': { 'Iside': 'Sac à main', 'Tric Trac': 'Sac à main', 'Brera': 'Sac à main', 'Serena': 'Sac à main' },
  'Mulberry': { 'Bayswater': 'Sac à main', 'Alexa': 'Sac à main', 'Lily': 'Sac à main', 'Amberley': 'Sac à main' },
  'Bulgari': { 'Serpenti': 'Sac à main', 'Serpenti Tubogas': 'Sac à main', 'Divas\' Dream': 'Sac à main', 'Bvlgari Bvlgari': 'Sac à main' },
  'Balenciaga': { 'Hourglass': 'Sac à main', 'Le Cagole': 'Sac à main', 'Neo Cagole': 'Sac à main', 'City': 'Sac à main' },
  'Alexander McQueen': { 'Jewelled Satchel': 'Sac à main', 'The Curve': 'Sac à main', 'The Bow': 'Sac à main' },
  'Marni': { 'Trunk': 'Sac à main', 'Pannier': 'Sac à main' },
  'Salvatore Ferragamo': { 'Gancini': 'Sac à main', 'Studio': 'Sac à main', 'Hobo': 'Sac à main' },
  'Tod\'s': { 'D Bag': 'Sac à main', 'Gommino': 'Pochette', 'Di Bag': 'Sac à main' },
  'Bally': { 'Janelle': 'Sac à main', 'Sergeant': 'Sac à main', 'Scribe': 'Sac à main', 'Metropolis': 'Sac à main' },
  'Celine': { 'Triomphe': 'Sac à main', 'Ava': 'Sac à main', 'Belt': 'Sac à main', '16': 'Sac à main', 'Triomphe Canvas': 'Sac à main', 'Luggage': 'Sac à main' },
  'Lanvin': { 'Pencil': 'Sac à main', 'Cat Bag': 'Sac à main', 'Puffy': 'Sac à main' },
  'Polène': { 'Numéro Un': 'Sac à main', 'Numéro Huit': 'Sac à main', 'Numéro Neuf': 'Sac à main', 'Numéro Dix': 'Sac à main', 'Béri': 'Sac à main' },
  'Strathberry': { 'Mosaic': 'Sac à main', 'East/West': 'Sac à main', 'Multrees': 'Sac à main', 'Charlotte': 'Sac à main', 'Kite Hobo': 'Sac à main' },
  'Loewe': { 'Puzzle': 'Sac à main', 'Hammock': 'Sac à main', 'Gate': 'Sac à main', 'Flamenco': 'Sac à main', 'Basket': 'Sac à main', 'Cubi': 'Sac à main', 'Paseo': 'Sac à main', 'Ana': 'Sac à main', 'Squeeze': 'Sac à main' },
};

/** Type (Botte, Escarpin, Basket, Sandale, etc.) par marque et modèle — jamais identique à la catégorie "chaussures". Vérifié par référence produit. */
export const MODEL_TYPE_CHAUSSURES: Record<string, Record<string, string>> = {
  'Louis Vuitton': { 'Archlight': 'Basket', 'Run Away': 'Basket', 'Frontrow': 'Basket', 'Trainer': 'Basket', 'LV Trainer': 'Basket', 'Aerogram': 'Basket', 'Soft Trunk': 'Basket', 'Charlie': 'Basket', 'Skate': 'Basket' },
  'Chanel': { 'Ballerines': 'Ballerine', 'Bottes': 'Botte', 'Escarpins': 'Escarpin', 'Baskets': 'Basket', 'Bottines': 'Bottine', 'Sandales': 'Sandale', 'Slingback': 'Escarpin', 'Cap-Toe': 'Escarpin' },
  'Gucci': { 'Ace': 'Basket', 'Princetown': 'Mocassin', 'Brixton': 'Mocassin', 'Rhyton': 'Basket', 'Gazelle': 'Basket', 'Jackie': 'Escarpin', 'Horsebit': 'Loafer', 'Screener': 'Basket', 'Luna': 'Basket', 'Rhyton 2.0': 'Basket' },
  'Prada': { 'Monolith': 'Botte', 'America\'s Cup': 'Basket', 'Cloudbust': 'Basket', 'Derby': 'Derby', 'Loafer': 'Loafer', 'Linea Rossa': 'Basket', 'Symbole': 'Basket' },
  'Dior': { 'B30': 'Basket', 'B22': 'Basket', 'Walk\'n\'Dior': 'Basket', 'Escarpins': 'Escarpin', 'Bottes': 'Botte', 'J\'adior': 'Escarpin', 'D-Fusion': 'Basket', 'B27': 'Basket' },
  'Saint Laurent': { 'Wyatt': 'Botte', 'Tributes': 'Escarpin', 'Bottes': 'Botte', 'Escarpins': 'Escarpin', 'Loafer': 'Loafer', 'Slides': 'Slide', 'Court': 'Escarpin', 'Niki': 'Botte', 'Lou': 'Basket' },
  'Hermès': { 'Oran': 'Sandale', 'Sandales': 'Sandale', 'Bottes': 'Botte', 'Mocassins': 'Mocassin', 'Quick': 'Sandale', 'Chypre': 'Sandale', 'Avalon': 'Mocassin', 'Ezcape': 'Basket' },
  'Bottega Veneta': { 'Puddle': 'Botte', 'Tire': 'Sandale', 'Lido': 'Sandale', 'Sandals': 'Sandale', 'Stretch': 'Basket', 'Drop': 'Escarpin', 'Platform': 'Escarpin' },
  'Fendi': { 'Fendigraphy': 'Basket', 'Baskets': 'Basket', 'Escarpins': 'Escarpin', 'Bottes': 'Botte', 'Slides': 'Slide', 'Rolling': 'Basket', 'First': 'Escarpin' },
  'Loewe': { 'Balloon': 'Basket', 'Puzzle': 'Basket', 'Baskets': 'Basket', 'Gate': 'Sandale', 'Flamenco': 'Ballerine', 'Flow': 'Basket', 'Croc': 'Basket' },
  'Jimmy Choo': { 'Bing': 'Escarpin', 'Memento': 'Escarpin', 'Romy': 'Escarpin', 'Anouk': 'Escarpin', 'Bottes': 'Botte', 'Bing 85': 'Escarpin', 'Mulan': 'Escarpin' },
  'Manolo Blahnik': { 'Hangisi': 'Escarpin', 'BB': 'Escarpin', 'Maysale': 'Escarpin', 'Lurum': 'Escarpin', 'Campari': 'Escarpin', 'Suede': 'Escarpin' },
  'Roger Vivier': { 'Belle Vivier': 'Escarpin', 'Très Vivier': 'Escarpin', 'Belle de Nuit': 'Escarpin', 'Ballerine': 'Ballerine', 'Viv\' Run': 'Basket', 'Combat': 'Basket' },
  'Valentino': { 'Rockstud': 'Escarpin', 'Garavani': 'Escarpin', 'One Stud': 'Escarpin', 'Bottes': 'Botte', 'Escarpins': 'Escarpin', 'Open': 'Sandale', 'VLogo': 'Basket' },
  'Christian Louboutin': { 'Pigalle': 'Escarpin', 'So Kate': 'Escarpin', 'Bianca': 'Escarpin', 'Décolleté': 'Escarpin', 'Bottes': 'Botte', 'Simple Pump': 'Escarpin', 'Louboutin': 'Escarpin', 'Spike': 'Escarpin' },
  'Aquazzura': { 'Wild Thing': 'Sandale', 'Belgravia': 'Escarpin', 'Christy': 'Escarpin', 'Sandales': 'Sandale', 'Escarpins': 'Escarpin', 'Sexy Thing': 'Sandale' },
  'Givenchy': { 'Bottes': 'Botte', 'Escarpins': 'Escarpin', 'Baskets': 'Basket', 'Sandales': 'Sandale', 'Voyou': 'Basket', 'Gum': 'Basket' },
  'Balenciaga': { 'Triple S': 'Basket', 'Track': 'Basket', 'Speed': 'Basket', 'Defender': 'Basket', 'Strike': 'Basket', 'Baskets': 'Basket', 'Bottes': 'Botte', '3XL': 'Basket', 'Runner': 'Basket' },
};

/** Types déjà = nom du modèle (accessoires / vêtements) : on n’ajoute pas de préfixe pour éviter doublon. */
const MODEL_IS_ALREADY_TYPE_ACCESSOIRES = new Set(['Ceinture', 'Écharpe', 'Carré', 'Cravate', 'Porte-clés', 'Porte-carte', 'Portefeuille long', 'Portefeuille', 'Porte-monnaie', 'Pochette', 'Gants', 'Lunettes', 'Casquette', 'Bonnet', 'Chapeau', 'Bob', 'Éventail', 'Foulard', 'Ceinture H', 'Ceinture Collier de chien', 'Carré 90', 'Carré 140', 'Victorine', 'Zippy']);
const MODEL_IS_ALREADY_TYPE_VETEMENTS = new Set(['Tweed', 'Cardigan', 'Veste classique', 'Robe', 'Jupe', 'Pantalon', 'Manteau', 'Veste', 'Sweat', 'T-shirt', 'Short', 'Blazer', 'Smoking', 'Trench', 'Pull', 'Caban', 'Camel Coat', 'Bar Jacket', 'Blouson', 'Parka', 'Jupe plissée', 'Cardigan signature', 'Tailleur tweed', 'Le Smoking']);

/** Modèles chaussures qui sont déjà le type (évite "Botte Bottes", "Escarpin Escarpins"). */
const MODEL_IS_ALREADY_TYPE_CHAUSSURES = new Set(['Bottes', 'Escarpins', 'Baskets', 'Sandales', 'Ballerines', 'Bottines', 'Mocassins', 'Sandals']);

/** Retourne le libellé "Type + Modèle" pour l’affichage. N’affiche jamais un type identique à la catégorie (ex. pas "Bijou" en bijoux, pas "Sac" seul en sacs — sauf pour montres où "Montre" est autorisé : Montre Santos, Montre Submariner). */
export function getModelDisplayName(category: string, brand: string, model: string): string {
  if (!model) return model;
  if (category === 'bijoux') {
    const type = MODEL_TYPE_BIJOUX[brand]?.[model];
    if (type && type !== model) return `${type} ${model}`;
    return model;
  }
  if (category === 'sacs') {
    const type = MODEL_TYPE_SACS[brand]?.[model];
    if (type && type !== model) return `${type} ${model}`;
    return model;
  }
  if (category === 'chaussures') {
    if (MODEL_IS_ALREADY_TYPE_CHAUSSURES.has(model)) return model;
    const type = MODEL_TYPE_CHAUSSURES[brand]?.[model];
    if (type) return `${type} ${model}`;
    return model;
  }
  if (category === 'accessoires') {
    if (MODEL_IS_ALREADY_TYPE_ACCESSOIRES.has(model)) return model;
    return model;
  }
  if (category === 'vetements') {
    if (MODEL_IS_ALREADY_TYPE_VETEMENTS.has(model)) return model;
    return model;
  }
  if (category === 'montres') {
    if (model.startsWith('Montre ')) return model;
    return `Montre ${model}`;
  }
  if (category === 'autre') return model;
  return model;
}

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
