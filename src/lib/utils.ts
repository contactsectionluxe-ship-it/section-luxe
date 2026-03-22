import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
}

/**
 * Virgules « exotiques » (copier-coller Word, claviers) → virgule ASCII pour détecter les décimales.
 * Sans ça, parseFloat("10,90") s’arrête à la virgule et donne 10 au lieu de 10,90.
 */
const WEIRD_COMMAS = /[\u060C\u066C\uFE50\uFE51\uFF0C\u201A]/g;

/**
 * Interprète un prix saisi (FR : 10,90 ou 1.234,56 ; US : 1,234.56).
 * Max 2 décimales (arrondi centimes). Retourne null si invalide ou ≤ 0.
 */
export function parsePriceInputToNumber(raw: string): number | null {
  if (raw == null) return null;
  let s = String(raw).trim().replace(/[\s\u00A0\u202F]/g, '');
  if (!s) return null;
  s = s.replace(/'/g, '').replace(WEIRD_COMMAS, ',');
  const lastComma = s.lastIndexOf(',');
  const lastDot = s.lastIndexOf('.');
  let normalized: string;
  if (lastComma === -1 && lastDot === -1) {
    normalized = s;
  } else if (lastComma > lastDot) {
    const head = s.slice(0, lastComma).replace(/\./g, '');
    const tail = s.slice(lastComma + 1).replace(/[^0-9]/g, '').slice(0, 2);
    normalized = tail.length > 0 ? `${head}.${tail}` : head;
  } else {
    const head = s.slice(0, lastDot).replace(/,/g, '');
    const tail = s.slice(lastDot + 1).replace(/[^0-9]/g, '').slice(0, 2);
    normalized = tail.length > 0 ? `${head}.${tail}` : head;
  }
  const n = parseFloat(normalized);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100) / 100;
}

/** Pendant la saisie : garde chiffres + séparateurs, max 2 chiffres après le dernier . ou ,. */
export function sanitizePriceInputWhileTyping(raw: string): string {
  let v = raw.replace(WEIRD_COMMAS, ',').replace(/[^0-9,.]/g, '');
  const lastComma = v.lastIndexOf(',');
  const lastDot = v.lastIndexOf('.');
  const sep = Math.max(lastComma, lastDot);
  if (sep === -1) return v;
  return v.slice(0, sep + 1) + v.slice(sep + 1).replace(/[^0-9]/g, '').slice(0, 2);
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

/** Date au format jj/mm/aaaa (pour affichage court, ex. mobile). */
export function formatDateShort(date: Date): string {
  const d = date.getDate();
  const m = date.getMonth() + 1;
  const y = date.getFullYear();
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
}

/** URL de l'avatar vendeur avec cache-buster (updated_at) pour afficher la photo à jour partout. */
export function getSellerAvatarUrl(seller: { avatarUrl?: string | null; updatedAt?: Date } | null): string | null {
  if (!seller?.avatarUrl) return null;
  const t = seller.updatedAt instanceof Date ? seller.updatedAt.getTime() : 0;
  return `${seller.avatarUrl}${seller.avatarUrl.includes('?') ? '&' : '?'}t=${t}`;
}

export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "À l'instant";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `Il y a ${diffInMinutes} min`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `Il y a ${diffInHours}h`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `Il y a ${diffInDays}j`;
  }

  return formatDate(date);
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

export const CATEGORIES: { value: string; label: string }[] = [
  { value: 'sacs', label: 'Sacs' },
  { value: 'vetements', label: 'Vêtements' },
  { value: 'chaussures', label: 'Chaussures' },
  { value: 'accessoires', label: 'Accessoires' },
  { value: 'bijoux', label: 'Bijoux' },
  { value: 'montres', label: 'Montres' },
];
