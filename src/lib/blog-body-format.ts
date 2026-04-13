export type BlogBodyFormat = 'text' | 'html';

export function normalizeBlogBodyFormat(raw: unknown): BlogBodyFormat {
  return raw === 'html' ? 'html' : 'text';
}

/** Détecte un corps qui ressemble à du HTML (collé depuis une page / fichier .html) alors que le format en base est encore « texte ». */
export function bodyLooksLikeHtmlMarkup(body: string): boolean {
  return /<\s*\/?\s*(p|div|span|article|section|header|h[1-6]|strong|em|ul|ol|li|br|img|a|table|blockquote)\b/i.test(
    body
  );
}
