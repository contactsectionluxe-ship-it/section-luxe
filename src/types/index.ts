// Types pour la marketplace luxe

import type { SubscriptionTier } from '@/lib/subscription';

export type { SubscriptionTier } from '@/lib/subscription';
export type UserRole = 'buyer' | 'seller' | 'admin';

export type SellerStatus = 'pending' | 'approved' | 'rejected' | 'suspended' | 'banned';

export type ListingCategory = 
  | 'sacs'
  | 'montres'
  | 'bijoux'
  | 'vetements'
  | 'chaussures'
  | 'accessoires';

export interface User {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: Date;
  phone?: string | null;
}

export interface Seller {
  uid: string;
  email: string;
  companyName: string;
  /** Prénom + Nom (depuis users.display_name) */
  displayName?: string | null;
  siret?: string | null;
  address: string;
  city: string;
  postcode: string;
  phone: string;
  description: string;
  status: SellerStatus;
  idCardFrontUrl: string;
  idCardBackUrl: string | null;
  /** Type du document recto envoyé par le vendeur (pour l’affichage admin) */
  idRectoType?: 'passeport' | 'cni_recto' | null;
  kbisUrl: string;
  avatarUrl?: string | null;
  /** Slug URL du catalogue public (/catalogue/{slug}), si défini */
  catalogueSlug?: string | null;
  /** Date de fin de suspension (null si non suspendu) */
  suspendedUntil?: Date | null;
  /** Formule d’abonnement annonces (défaut start / gratuit) */
  subscriptionTier: SubscriptionTier;
  /** Au moins un paiement Stripe : portail facturation disponible */
  stripeCustomerRegistered?: boolean;
  /** Abonnement Stripe enregistré (ex. sub_xxx), si présent */
  stripeSubscriptionId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Listing {
  id: string;
  sellerId: string;
  sellerName: string;
  /** Code postal du vendeur (récupéré depuis sellers si disponible) */
  sellerPostcode?: string | null;
  title: string;
  description: string;
  price: number;
  category: ListingCategory;
  /** Genre(s) : un ou plusieurs parmi 'homme', 'femme' */
  genre?: ('homme' | 'femme')[] | null;
  photos: string[];
  likesCount: number;
  listingNumber?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  brand?: string | null;
  model?: string | null;
  condition?: string | null;
  material?: string | null;
  color?: string | null;
  heightCm?: number | null;
  widthCm?: number | null;
  year?: number | null;
  packaging?: string[] | null;
  /** Taille (vêtements: XS, S, M, L, XL, XXL, XXXL) ou pointure (chaussures: 34-48) */
  size?: string | null;
  /** Nombre de fois que le numéro de téléphone a été affiché (clic sur N° téléphone) */
  phoneRevealsCount?: number;
  /** Type de produit (ex. sneakers, sac_main, tshirt_polo) — même valeur que dans le formulaire Déposer une annonce */
  articleType?: string | null;
}

export interface Favorite {
  id: string;
  userId: string;
  listingId: string;
  createdAt: Date;
}

export interface Conversation {
  id: string;
  listingId: string;
  listingTitle: string;
  listingPhoto: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  lastMessage: string;
  lastMessageAt: Date;
  unreadBuyer: number;
  unreadSeller: number;
  /** Si défini : n'afficher que les messages après cette date (pour la personne qui avait "supprimé") */
  buyerClearedAt?: Date | null;
  sellerClearedAt?: Date | null;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: Date;
  read: boolean;
  imageUrl?: string | null;
}

// Types pour les formulaires
export interface SellerRegistrationForm {
  companyName: string;
  address: string;
  email: string;
  phone: string;
  description: string;
  password: string;
  confirmPassword: string;
  idCardFront: File | null;
  idCardBack: File | null;
  kbis: File | null;
}

export interface ListingForm {
  title: string;
  description: string;
  price: number;
  category: ListingCategory;
  photos: File[];
}

export interface LoginForm {
  email: string;
  password: string;
}

export interface BuyerRegistrationForm {
  displayName: string;
  email: string;
  password: string;
  confirmPassword: string;
}
