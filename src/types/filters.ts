export interface SearchFilters {
  /** Genre(s) : Femme et/ou Homme (filtre catalogue). */
  genre?: ('femme' | 'homme')[];

  // Type d'article (sélection multiple)
  category?: string; // déprécié, préférer categories
  categories?: string[];
  
  // Marque (sélection multiple)
  brand?: string; // déprécié, préférer brands
  brands?: string[];
  
  // Modèle / Collection (sélection multiple)
  model?: string; // déprécié, préférer models
  models?: string[];
  
  // Année
  yearMin?: number;
  yearMax?: number;
  
  // Prix
  priceMin?: number;
  priceMax?: number;
  
  // État (sélection multiple)
  condition?: string; // déprécié, préférer conditions
  conditions?: string[];
  
  // Localisation (sélection multiple : villes, codes postaux, régions)
  /** Chaque entrée = un libellé affiché + liste de préfixes code postal (ex. 75, 2A) pour matcher les vendeurs. */
  locations?: Array<{ label: string; prefixes: string[] }>;
  postalCode?: string;
  region?: string;
  deliveryAvailable?: boolean;
  
  // Caractéristiques (couleur en multi-sélection comme Modèle)
  color?: string; // déprécié, préférer colors
  colors?: string[];
  material?: string; // déprécié, préférer materials
  materials?: string[];

  /** Taille (vêtements: XS, S, M, …) / Pointure (chaussures: 34-48) */
  sizes?: string[];

  // Historique
  firstHand?: boolean;
  hasCertificate?: boolean;
  
  // Tri
  sortBy?: 'date_desc' | 'date_asc' | 'price_asc' | 'price_desc' | 'likes';
  
  // Recherche texte
  query?: string;

  // Filtre vendeur (depuis page produit)
  sellerId?: string;
}

export const defaultFilters: SearchFilters = {
  sortBy: 'date_desc',
};
