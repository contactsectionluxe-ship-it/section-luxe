import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';
import { verifyAdminBearer } from '@/lib/api/verifyAdminBearer';
import { slugifyBlogTitle } from '@/lib/blogSlug';
import { normalizeBlogBodyFormat, type BlogBodyFormat } from '@/lib/blog-body-format';
import { normalizeBlogCoverImageUrl } from '@/lib/blog-article-cover';

export type BlogArticleAdminRow = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string;
  body_format: BlogBodyFormat;
  cover_image_url: string | null;
  published_at: string;
  created_at: string;
  updated_at: string;
};

function parseBearer(request: NextRequest): string | undefined {
  const authHeader = request.headers.get('authorization');
  return authHeader?.replace(/^Bearer\s+/i, '');
}

/**
 * GET /api/admin/blog-articles — tous les articles (y compris programmés).
 */
export async function GET(request: NextRequest) {
  try {
    const v = await verifyAdminBearer(parseBearer(request));
    if (!v.ok) {
      return NextResponse.json({ error: v.message }, { status: v.status });
    }

    const server = getSupabaseServer();
    if (!server) {
      return NextResponse.json({ error: 'Supabase non configuré' }, { status: 503 });
    }

    const { data, error } = await server
      .from('blog_articles')
      .select('id, title, slug, excerpt, body, body_format, cover_image_url, published_at, created_at, updated_at')
      .order('published_at', { ascending: false });

    if (error) {
      if ((error as { code?: string }).code === '42P01') {
        return NextResponse.json(
          { error: 'Table blog_articles absente. Exécutez la migration blog_articles.sql dans Supabase.' },
          { status: 503 }
        );
      }
      const em = String((error as { message?: string }).message || '');
      if (em.includes('body_format')) {
        return NextResponse.json(
          {
            error:
              'Colonne body_format absente. Dans Supabase → SQL, exécutez la fin de blog_articles.sql (section body_format) ou le fichier blog_articles_body_format.sql.',
          },
          { status: 503 }
        );
      }
      if (em.includes('cover_image_url')) {
        return NextResponse.json(
          {
            error:
              'Colonne cover_image_url absente. Exécutez blog_articles_cover_image.sql ou la fin de blog_articles.sql dans Supabase.',
          },
          { status: 503 }
        );
      }
      throw error;
    }

    return NextResponse.json({ articles: (data || []) as BlogArticleAdminRow[] });
  } catch (err) {
    console.error('admin/blog-articles GET:', err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * POST /api/admin/blog-articles — création (slug unique).
 */
export async function POST(request: NextRequest) {
  try {
    const v = await verifyAdminBearer(parseBearer(request));
    if (!v.ok) {
      return NextResponse.json({ error: v.message }, { status: v.status });
    }

    const server = getSupabaseServer();
    if (!server) {
      return NextResponse.json({ error: 'Supabase non configuré' }, { status: 503 });
    }

    const supabasePublicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';

    const body = (await request.json().catch(() => null)) as {
      title?: string;
      slug?: string;
      excerpt?: string | null;
      body?: string;
      body_format?: string;
      cover_image_url?: string | null;
      published_at?: string;
    } | null;

    const title = typeof body?.title === 'string' ? body.title.trim() : '';
    const textBody = typeof body?.body === 'string' ? body.body : '';
    const publishedAt = typeof body?.published_at === 'string' ? body.published_at.trim() : '';
    if (!title || !textBody || !publishedAt) {
      return NextResponse.json(
        { error: 'Champs requis : title, body, published_at (ISO ou datetime-local)' },
        { status: 400 }
      );
    }

    const parsedDate = new Date(publishedAt);
    if (Number.isNaN(parsedDate.getTime())) {
      return NextResponse.json({ error: 'Date de mise en ligne invalide' }, { status: 400 });
    }

    let slug =
      typeof body?.slug === 'string' && body.slug.trim()
        ? slugifyBlogTitle(body.slug.trim())
        : slugifyBlogTitle(title);
    const excerpt =
      typeof body?.excerpt === 'string' && body.excerpt.trim() ? body.excerpt.trim() : null;
    const bodyFormat = normalizeBlogBodyFormat(body?.body_format);
    let coverUrl: string | null = null;
    if (body?.cover_image_url !== undefined && body?.cover_image_url !== null) {
      const c = typeof body.cover_image_url === 'string' ? body.cover_image_url.trim() : '';
      coverUrl = normalizeBlogCoverImageUrl(c || null, supabasePublicUrl);
      if (c && !coverUrl) {
        return NextResponse.json(
          { error: 'Image de couverture : URL invalide (utilisez une image du bucket blog du projet).' },
          { status: 400 }
        );
      }
    }

    for (let attempt = 0; attempt < 8; attempt++) {
      const trySlug = attempt === 0 ? slug : `${slug}-${attempt}`;
      const { data: inserted, error } = await server
        .from('blog_articles')
        .insert({
          title,
          slug: trySlug,
          excerpt,
          body: textBody,
          body_format: bodyFormat,
          cover_image_url: coverUrl,
          published_at: parsedDate.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select('id, title, slug, excerpt, body, body_format, cover_image_url, published_at, created_at, updated_at')
        .single();

      if (!error && inserted) {
        return NextResponse.json({ article: inserted as BlogArticleAdminRow });
      }
      if ((error as { code?: string })?.code === '23505') {
        continue;
      }
      if ((error as { code?: string }).code === '42P01') {
        return NextResponse.json(
          { error: 'Table blog_articles absente. Exécutez la migration blog_articles.sql dans Supabase.' },
          { status: 503 }
        );
      }
      const em = String((error as { message?: string }).message || '');
      if (em.includes('body_format')) {
        return NextResponse.json(
          {
            error:
              'Colonne body_format absente. Dans Supabase → SQL, exécutez la fin de blog_articles.sql (section body_format) ou le fichier blog_articles_body_format.sql.',
          },
          { status: 503 }
        );
      }
      if (em.includes('cover_image_url')) {
        return NextResponse.json(
          {
            error:
              'Colonne cover_image_url absente. Exécutez blog_articles_cover_image.sql ou la fin de blog_articles.sql dans Supabase.',
          },
          { status: 503 }
        );
      }
      throw error;
    }

    return NextResponse.json({ error: 'Impossible de générer un slug unique' }, { status: 409 });
  } catch (err) {
    console.error('admin/blog-articles POST:', err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
