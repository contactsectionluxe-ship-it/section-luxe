/**
 * Sanitisation des entrées utilisateur (API, formulaires) pour limiter les injections et abus.
 */

const MAX_EMAIL_LENGTH = 254;
const MAX_NAME_LENGTH = 200;
const MAX_SUBJECT_LENGTH = 200;
const MAX_MESSAGE_LENGTH = 10_000;

/** Regex email simple (éviter envoi à des adresses invalides / header injection) */
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

/** Supprime caractères de contrôle et limite les retours à la ligne (éviter header injection dans emails) */
function sanitizeText(s: string, maxLen: number): string {
  return s
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, '')
    .slice(0, maxLen);
}

export function sanitizeEmail(email: string): { ok: true; value: string } | { ok: false; error: string } {
  const v = sanitizeText(email.trim(), MAX_EMAIL_LENGTH);
  if (!v) return { ok: false, error: 'Email requis.' };
  if (!EMAIL_REGEX.test(v)) return { ok: false, error: 'Format d’email invalide.' };
  return { ok: true, value: v };
}

export function sanitizeName(name: string): string {
  return sanitizeText(name.trim(), MAX_NAME_LENGTH);
}

export function sanitizeSubject(subject: string): string {
  return sanitizeText(subject.trim(), MAX_SUBJECT_LENGTH) || 'Demande de contact';
}

export function sanitizeMessage(message: string): { ok: true; value: string } | { ok: false; error: string } {
  const v = sanitizeText(message.trim(), MAX_MESSAGE_LENGTH);
  if (!v) return { ok: false, error: 'Message requis.' };
  return { ok: true, value: v };
}

/** Taille max body JSON pour les API (éviter DoS par gros payloads) */
export const MAX_JSON_BODY_BYTES = 100 * 1024; // 100 Ko
