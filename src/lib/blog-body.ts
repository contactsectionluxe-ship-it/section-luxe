export type BlogBodySegment = { type: 'text'; text: string } | { type: 'img'; url: string };

/**
 * Découpe le corps d’article : texte libre + blocs `{{IMG:url}}` insérés depuis l’admin.
 */
export function parseBlogBody(body: string): BlogBodySegment[] {
  const out: BlogBodySegment[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  const re = /\{\{IMG:([^}]*)\}\}/g;
  while ((m = re.exec(body)) !== null) {
    if (m.index > last) {
      out.push({ type: 'text', text: body.slice(last, m.index) });
    }
    out.push({ type: 'img', url: m[1].trim() });
    last = m.index + m[0].length;
  }
  if (last < body.length) {
    out.push({ type: 'text', text: body.slice(last) });
  }
  if (out.length === 0) {
    out.push({ type: 'text', text: body });
  }
  return out;
}

/** N’autorise que les fichiers du bucket `blog` du projet courant (évite img arbitraires). */
export function isTrustedBlogImageUrl(raw: string, projectSupabaseUrl: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed || !projectSupabaseUrl) return false;
  try {
    const u = new URL(trimmed);
    if (u.protocol !== 'https:') return false;
    const base = new URL(projectSupabaseUrl);
    if (u.hostname !== base.hostname) return false;
    return u.pathname.startsWith('/storage/v1/object/public/blog/');
  } catch {
    return false;
  }
}
