import { createClient } from '@supabase/supabase-js';
import type { BlogArticleListItem } from '@/lib/supabase/blog-articles';
import { logPostgrestError } from '@/lib/supabase/log-postgrest-error';
import { ActualitesListClient } from './ActualitesListClient';

async function loadArticles(): Promise<BlogArticleListItem[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];

  const supabase = createClient(url, key);
  const { data, error } = await supabase
    .from('blog_articles')
    .select('id, title, slug, excerpt, cover_image_url, published_at')
    .order('published_at', { ascending: false });

  if (error) {
    logPostgrestError('actualites list', error);
    return [];
  }

  return (data || []) as BlogArticleListItem[];
}

export default async function ActualitesPage() {
  const articles = await loadArticles();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';

  return (
    <main style={{ paddingTop: 'var(--header-height)', minHeight: '100vh' }}>
      <div className="actualites-page-inner messages-page-inner" style={{ maxWidth: 1100, margin: '0 auto', padding: '30px 24px 60px' }}>
        <ActualitesListClient articles={articles} supabaseUrl={supabaseUrl} />
      </div>
    </main>
  );
}
