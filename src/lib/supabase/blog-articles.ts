import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { logPostgrestError } from '@/lib/supabase/log-postgrest-error';

export type BlogArticlePublic = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string;
  body_format: 'text' | 'html';
  cover_image_url: string | null;
  published_at: string;
};

export type BlogArticleListItem = Pick<
  BlogArticlePublic,
  'id' | 'title' | 'slug' | 'excerpt' | 'cover_image_url' | 'published_at'
>;

/**
 * Articles visibles sur le site (RLS : published_at <= now()).
 */
export async function fetchPublishedBlogArticles(): Promise<BlogArticlePublic[]> {
  if (!isSupabaseConfigured || !supabase) return [];

  const { data, error } = await supabase
    .from('blog_articles')
    .select('id, title, slug, excerpt, body, body_format, cover_image_url, published_at')
    .order('published_at', { ascending: false });

  if (error) {
    logPostgrestError('fetchPublishedBlogArticles', error);
    return [];
  }

  return (data || []) as BlogArticlePublic[];
}

export async function fetchPublishedBlogArticleBySlug(slug: string): Promise<BlogArticlePublic | null> {
  if (!isSupabaseConfigured || !supabase || !slug) return null;

  const { data, error } = await supabase
    .from('blog_articles')
    .select('id, title, slug, excerpt, body, body_format, cover_image_url, published_at')
    .eq('slug', slug)
    .maybeSingle();

  if (error) {
    logPostgrestError('fetchPublishedBlogArticleBySlug', error);
    return null;
  }

  return data as BlogArticlePublic | null;
}
