export interface SearchFilters {
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
  
  // Localisation
  postalCode?: string;
  region?: string;
  deliveryAvailable?: boolean;
  
  // Caractéristiques (couleur en multi-sélection comme Modèle)
  color?: string; // déprécié, préférer colors
  colors?: string[];
  material?: string; // déprécié, préférer materials
  materials?: string[];

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
