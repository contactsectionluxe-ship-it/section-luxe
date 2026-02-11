// Types pour la marketplace luxe

export type UserRole = 'buyer' | 'seller' | 'admin';

export type SellerStatus = 'pending' | 'approved' | 'rejected';

export type ListingCategory = 
  | 'sacs'
  | 'montres'
  | 'bijoux'
  | 'vetements'
  | 'chaussures'
  | 'accessoires'
  | 'maroquinerie'
  | 'autre';

export interface User {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: Date;
}

export interface Seller {
  uid: string;
  email: string;
  companyName: string;
  address: string;
  phone: string;
  description: string;
  status: SellerStatus;
  idCardFrontUrl: string;
  idCardBackUrl: string | null;
  kbisUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Listing {
  id: string;
  sellerId: string;
  sellerName: string;
  title: string;
  description: string;
  price: number;
  category: ListingCategory;
  photos: string[];
  likesCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
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
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: Date;
  read: boolean;
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
