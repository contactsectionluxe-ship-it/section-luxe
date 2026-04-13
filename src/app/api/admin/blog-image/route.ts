import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';
import { verifyAdminBearer } from '@/lib/api/verifyAdminBearer';
import { validateImageFile } from '@/lib/file-validation';

const BUCKET = 'blog';

function parseBearer(request: NextRequest): string | undefined {
  const authHeader = request.headers.get('authorization');
  return authHeader?.replace(/^Bearer\s+/i, '');
}

function extForFile(file: File): 'jpg' | 'png' {
  const mime = (file.type || '').toLowerCase();
  if (mime === 'image/png') return 'png';
  const n = file.name.toLowerCase();
  if (n.endsWith('.png')) return 'png';
  return 'jpg';
}

/**
 * POST /api/admin/blog-image — une image JPEG/PNG → bucket `blog`, URL publique pour {{IMG:...}}.
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

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 });
    }

    const file = formData.get('image');
    if (!file || !(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: 'Fichier image requis (champ « image »)' }, { status: 400 });
    }

    const check = validateImageFile(file);
    if (!check.ok) {
      return NextResponse.json({ error: check.error }, { status: 400 });
    }

    const ext = extForFile(file);
    const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';
    const path = `articles/${randomUUID()}.${ext}`;

    const buf = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await server.storage.from(BUCKET).upload(path, buf, {
      contentType,
      upsert: false,
    });

    if (uploadError) {
      const msg = uploadError.message || String(uploadError);
      const msgLower = msg.toLowerCase();
      if (
        msgLower.includes('bucket not found') ||
        msgLower.includes('resource was not found') ||
        (msgLower.includes('bucket') && msgLower.includes('not found'))
      ) {
        return NextResponse.json(
          {
            error:
              'Bucket Storage « blog » introuvable. Exécutez la migration storage_blog_bucket.sql dans Supabase (Storage → créer le bucket blog en public, ou SQL).',
          },
          { status: 503 }
        );
      }
      console.error('admin/blog-image upload:', uploadError);
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    const { data: pub } = server.storage.from(BUCKET).getPublicUrl(path);
    const publicUrl = pub?.publicUrl;
    if (!publicUrl) {
      return NextResponse.json({ error: 'URL publique indisponible' }, { status: 500 });
    }

    return NextResponse.json({ url: publicUrl });
  } catch (err) {
    console.error('admin/blog-image:', err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
