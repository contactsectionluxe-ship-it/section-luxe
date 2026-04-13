import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { formatDateShort } from '@/lib/utils';
import type { BlogArticlePublic } from '@/lib/supabase/blog-articles';
import { normalizeBlogBodyFormat } from '@/lib/blog-body-format';
import { logPostgrestError } from '@/lib/supabase/log-postgrest-error';
import { BlogArticleBody } from '../BlogArticleBody';

type BlogArticleDetail = Pick<BlogArticlePublic, 'body' | 'body_format' | 'published_at'>;

async function loadArticle(slug: string): Promise<BlogArticleDetail | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  const supabase = createClient(url, key);
  const { data, error } = await supabase
    .from('blog_articles')
    .select('body, body_format, published_at')
    .eq('slug', slug)
    .maybeSingle();

  if (error) {
    logPostgrestError('actualites detail', error);
    return null;
  }

  return data as BlogArticleDetail | null;
}

type Props = { params: Promise<{ slug: string }> };

export default async function ActualiteArticlePage({ params }: Props) {
  const { slug: raw } = await params;
  const slug = decodeURIComponent(raw || '');
  if (!slug) notFound();

  const article = await loadArticle(slug);
  if (!article) notFound();

  const published = new Date(article.published_at);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';

  return (
    <main style={{ paddingTop: 'var(--header-height)', minHeight: '100vh', backgroundColor: '#fff' }}>
      <article
        className="actualites-article-inner messages-conversation-inner"
        style={{ maxWidth: 1100, width: '100%', margin: '0 auto', padding: '30px 24px 80px', boxSizing: 'border-box' }}
      >
        <div
          className="actualites-article-meta-row"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            marginBottom: 14,
          }}
        >
          <Link href="/actualites" className="actualites-article-meta-item">
            ← Actualités
          </Link>
          <span
            className="actualites-article-meta-item actualites-article-meta-date"
            style={{ marginLeft: 'auto', marginRight: '1mm' }}
          >
            Publié le {formatDateShort(published)}
          </span>
        </div>

        <div
          style={{
            backgroundColor: '#fff',
            borderRadius: 12,
            border: '1px solid #e8e6e3',
            boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '28px 28px 36px' }}>
          <BlogArticleBody
            body={article.body}
            bodyFormat={normalizeBlogBodyFormat(article.body_format)}
            supabaseUrl={supabaseUrl}
          />
          </div>
        </div>
      </article>
    </main>
  );
}
