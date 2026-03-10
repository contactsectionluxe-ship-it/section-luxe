/**
 * Règles communes : JPEG, PNG uniquement (5 Mo max). Pas de WebP par prudence.
 * Documents « devenir vendeur » : en plus PDF.
 */

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 Mo
export const MAX_FILE_SIZE_MB = 5;

/** Types MIME pour les photos (avatar, annonces) : JPEG et PNG uniquement */
export const ALLOWED_IMAGE_MIMES = ['image/jpeg', 'image/png'] as const;
export const ALLOWED_IMAGE_EXT = ['.jpg', '.jpeg', '.png'];

/** Types MIME pour les documents devenir vendeur : images + PDF */
export const ALLOWED_DOCUMENT_MIMES = ['image/jpeg', 'image/png', 'application/pdf'] as const;
export const ALLOWED_DOCUMENT_EXT = ['.jpg', '.jpeg', '.png', '.pdf'];

export const ACCEPT_IMAGES = 'image/jpeg,image/png';
export const ACCEPT_DOCUMENTS = 'image/jpeg,image/png,application/pdf';

function getExt(name: string): string {
  const i = name.lastIndexOf('.');
  return i >= 0 ? '.' + name.slice(i + 1).toLowerCase() : '';
}

export function isAllowedImageType(file: File): boolean {
  const ext = getExt(file.name);
  // Accepter d’abord par extension (fiable côté serveur où file.type peut être vide)
  if (ALLOWED_IMAGE_EXT.includes(ext)) return true;
  const mime = (file.type || '').toLowerCase();
  return ALLOWED_IMAGE_MIMES.some((m) => m === mime);
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
  if (!isAllowedImageType(file)) return { ok: false, error: 'Format non accepté. Utilisez JPEG ou PNG.' };
  return { ok: true };
}

export function validateDocumentFile(file: File): { ok: true } | { ok: false; error: string } {
  if (file.size === 0) return { ok: false, error: 'Fichier vide.' };
  if (file.size > MAX_FILE_SIZE_BYTES) return { ok: false, error: `Fichier trop volumineux (max ${MAX_FILE_SIZE_MB} Mo).` };
  if (!isAllowedDocumentType(file)) return { ok: false, error: 'Format non accepté. Utilisez JPEG, PNG ou PDF.' };
  return { ok: true };
}
