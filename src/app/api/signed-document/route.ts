import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';

const BUCKET = 'documents';
const EXPIRES_IN = 60; // secondes

/**
 * Extrait le chemin dans le bucket à partir de l'URL publique stockée.
 * Ex: https://xxx.supabase.co/storage/v1/object/public/documents/sellers/xxx/file.png -> sellers/xxx/file.png
 */
function getPathFromDocumentUrl(url: string | null): string | null {
  if (!url || typeof url !== 'string') return null;
  try {
    const match = url.match(/\/storage\/v1\/object\/public\/documents\/(.+)$/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl.searchParams.get('url');
    const path = getPathFromDocumentUrl(url);
    if (!path) {
      return NextResponse.json({ error: 'URL document invalide' }, { status: 400 });
    }

    const server = getSupabaseServer();
    if (!server) {
      return NextResponse.json({ error: 'Service non configuré' }, { status: 503 });
    }

    const { data, error } = await server.storage
      .from(BUCKET)
      .createSignedUrl(path, EXPIRES_IN);

    if (error || !data?.signedUrl) {
      console.error('Signed URL error:', error);
      return NextResponse.json({ error: 'Impossible de générer le lien' }, { status: 500 });
    }

    return NextResponse.redirect(data.signedUrl);
  } catch (err) {
    console.error('signed-document:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
