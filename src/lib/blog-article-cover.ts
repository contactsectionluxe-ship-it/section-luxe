import { isTrustedBlogImageUrl } from '@/lib/blog-body';

/** URL de couverture : uniquement fichier public du bucket Storage « blog » du projet. */
export function normalizeBlogCoverImageUrl(
  raw: string | null | undefined,
  projectSupabaseUrl: string
): string | null {
  const u = typeof raw === 'string' ? raw.trim() : '';
  if (!u || !projectSupabaseUrl) return null;
  return isTrustedBlogImageUrl(u, projectSupabaseUrl) ? u : null;
}
