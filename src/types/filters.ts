export interface SearchFilters {
  // Type d'article
  category?: string;
  
  // Marque
  brand?: string;
  
  // Modèle / Collection
  model?: string;
  
  // Année
  yearMin?: number;
  yearMax?: number;
  
  // Prix
  priceMin?: number;
  priceMax?: number;
  
  // État
  condition?: string;
  
  // Localisation
  postalCode?: string;
  region?: string;
  deliveryAvailable?: boolean;
  
  // Caractéristiques
  color?: string;
  material?: string;
  
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
