/**
 * Règles communes : JPEG, PNG, WebP (5 Mo max).
 * Documents « devenir vendeur » : en plus PDF.
 */

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 Mo
export const MAX_FILE_SIZE_MB = 5;

/** Types MIME pour les photos (avatar, annonces) : images uniquement */
export const ALLOWED_IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const ALLOWED_IMAGE_EXT = ['.jpg', '.jpeg', '.png', '.webp'];

/** Types MIME pour les documents devenir vendeur : images + PDF */
export const ALLOWED_DOCUMENT_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'] as const;
export const ALLOWED_DOCUMENT_EXT = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];

export const ACCEPT_IMAGES = 'image/jpeg,image/png,image/webp';
export const ACCEPT_DOCUMENTS = 'image/jpeg,image/png,image/webp,application/pdf';

function getExt(name: string): string {
  const i = name.lastIndexOf('.');
  return i >= 0 ? '.' + name.slice(i + 1).toLowerCase() : '';
}

export function isAllowedImageType(file: File): boolean {
  const ext = getExt(file.name);
  return (
    ALLOWED_IMAGE_MIMES.includes(file.type as (typeof ALLOWED_IMAGE_MIMES)[number]) ||
    ALLOWED_IMAGE_EXT.includes(ext)
  );
}

export function isAllowedDocumentType(file: File): boolean {
  const ext = getExt(file.name);
  return (
    ALLOWED_DOCUMENT_MIMES.includes(file.type as (typeof ALLOWED_DOCUMENT_MIMES)[number]) ||
    ALLOWED_DOCUMENT_EXT.includes(ext)
  );
}

export function isWithinSizeLimit(file: File): boolean {
  return file.size > 0 && file.size <= MAX_FILE_SIZE_BYTES;
}

export function validateImageFile(file: File): { ok: true } | { ok: false; error: string } {
  if (file.size === 0) return { ok: false, error: 'Fichier vide.' };
  if (file.size > MAX_FILE_SIZE_BYTES) return { ok: false, error: `Fichier trop volumineux (max ${MAX_FILE_SIZE_MB} Mo).` };
  if (!isAllowedImageType(file)) return { ok: false, error: 'Format non accepté. Utilisez JPEG, PNG ou WebP.' };
  return { ok: true };
}

export function validateDocumentFile(file: File): { ok: true } | { ok: false; error: string } {
  if (file.size === 0) return { ok: false, error: 'Fichier vide.' };
  if (file.size > MAX_FILE_SIZE_BYTES) return { ok: false, error: `Fichier trop volumineux (max ${MAX_FILE_SIZE_MB} Mo).` };
  if (!isAllowedDocumentType(file)) return { ok: false, error: 'Format non accepté. Utilisez JPEG, PNG, WebP ou PDF.' };
  return { ok: true };
}
