import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';
import { verifyAdminBearer } from '@/lib/api/verifyAdminBearer';
import { slugifyBlogTitle } from '@/lib/blogSlug';
import { normalizeBlogBodyFormat } from '@/lib/blog-body-format';
import { normalizeBlogCoverImageUrl } from '@/lib/blog-article-cover';
import type { BlogArticleAdminRow } from '../route';

function parseBearer(request: NextRequest): string | undefined {
  const authHeader = request.headers.get('authorization');
  return authHeader?.replace(/^Bearer\s+/i, '');
}

type RouteCtx = { params: Promise<{ id: string }> };

/**
 * PATCH /api/admin/blog-articles/[id]
 */
export async function PATCH(request: NextRequest, ctx: RouteCtx) {
  try {
    const v = await verifyAdminBearer(parseBearer(request));
    if (!v.ok) {
      return NextResponse.json({ error: v.message }, { status: v.status });
    }

    const { id } = await ctx.params;
    if (!id) {
      return NextResponse.json({ error: 'Identifiant manquant' }, { status: 400 });
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

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (body?.title !== undefined) {
      const t = typeof body.title === 'string' ? body.title.trim() : '';
      if (!t) return NextResponse.json({ error: 'Le titre ne peut pas être vide' }, { status: 400 });
      patch.title = t;
    }
    if (body?.body !== undefined) {
      const b = typeof body.body === 'string' ? body.body : '';
      if (!b.trim()) return NextResponse.json({ error: 'Le contenu ne peut pas être vide' }, { status: 400 });
      patch.body = b;
    }
    if (body?.excerpt !== undefined) {
      patch.excerpt =
        typeof body.excerpt === 'string' && body.excerpt.trim() ? body.excerpt.trim() : null;
    }
    if (body?.published_at !== undefined) {
      const p = typeof body.published_at === 'string' ? body.published_at.trim() : '';
      const d = new Date(p);
      if (!p || Number.isNaN(d.getTime())) {
        return NextResponse.json({ error: 'Date de mise en ligne invalide' }, { status: 400 });
      }
      patch.published_at = d.toISOString();
    }
    if (body?.slug !== undefined) {
      const s = typeof body.slug === 'string' ? slugifyBlogTitle(body.slug.trim()) : '';
      if (!s) return NextResponse.json({ error: 'Slug invalide' }, { status: 400 });
      patch.slug = s;
    }
    if (body?.body_format !== undefined) {
      patch.body_format = normalizeBlogBodyFormat(body.body_format);
    }
    if (body?.cover_image_url !== undefined) {
      if (body.cover_image_url === null || body.cover_image_url === '') {
        patch.cover_image_url = null;
      } else {
        const c = typeof body.cover_image_url === 'string' ? body.cover_image_url.trim() : '';
        const normalized = normalizeBlogCoverImageUrl(c || null, supabasePublicUrl);
        if (!normalized) {
          return NextResponse.json(
            { error: 'Image de couverture : URL invalide (utilisez une image du bucket blog du projet).' },
            { status: 400 }
          );
        }
        patch.cover_image_url = normalized;
      }
    }

    if (Object.keys(patch).length <= 1) {
      return NextResponse.json({ error: 'Aucun champ à mettre à jour' }, { status: 400 });
    }

    const { data, error } = await server
      .from('blog_articles')
      .update(patch)
      .eq('id', id)
      .select('id, title, slug, excerpt, body, body_format, published_at, created_at, updated_at')
      .single();

    if (error) {
      if ((error as { code?: string }).code === '23505') {
        return NextResponse.json({ error: 'Ce slug est déjà utilisé' }, { status: 409 });
      }
      if ((error as { code?: string }).code === 'PGRST116') {
        return NextResponse.json({ error: 'Article introuvable' }, { status: 404 });
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

    return NextResponse.json({ article: data as BlogArticleAdminRow });
  } catch (err) {
    console.error('admin/blog-articles PATCH:', err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/blog-articles/[id]
 */
export async function DELETE(request: NextRequest, ctx: RouteCtx) {
  try {
    const v = await verifyAdminBearer(parseBearer(request));
    if (!v.ok) {
      return NextResponse.json({ error: v.message }, { status: v.status });
    }

    const { id } = await ctx.params;
    if (!id) {
      return NextResponse.json({ error: 'Identifiant manquant' }, { status: 400 });
    }

    const server = getSupabaseServer();
    if (!server) {
      return NextResponse.json({ error: 'Supabase non configuré' }, { status: 503 });
    }

    const { data, error } = await server.from('blog_articles').delete().eq('id', id).select('id').maybeSingle();

    if (error) throw error;
    if (!data) {
      return NextResponse.json({ error: 'Article introuvable' }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('admin/blog-articles DELETE:', err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
