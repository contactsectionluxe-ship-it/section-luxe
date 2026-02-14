import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseServer } from '@/lib/supabase/server';
import { isAllowedImageType } from '@/lib/file-validation';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const MAX_SIZE = 3 * 1024 * 1024; // 3 Mo

/**
 * Upload d'une image pour un message.
 * Stockage dans le bucket listings : {userId}/messages/{conversationId}/{uuid}.{ext}
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace(/^Bearer\s+/i, '');
    if (!token || !supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: 'Non autorisé (token manquant ou Supabase non configuré)' },
        { status: 401 }
      );
    }

    const clientWithAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: { user }, error: userError } = await clientWithAuth.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Session invalide ou expirée' },
        { status: 401 }
      );
    }

    const server = getSupabaseServer();
    if (!server) {
      return NextResponse.json(
        { error: 'Supabase service role non configuré' },
        { status: 503 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('image') as File | null;
    const conversationId = formData.get('conversationId') as string | null;
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'Aucune image fournie (champ "image")' },
        { status: 400 }
      );
    }
    if (!conversationId || typeof conversationId !== 'string') {
      return NextResponse.json(
        { error: 'conversationId requis' },
        { status: 400 }
      );
    }
    if (file.size === 0) {
      return NextResponse.json({ error: 'Fichier vide.' }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'Image trop volumineuse (max. 3 Mo).' }, { status: 400 });
    }
    if (!isAllowedImageType(file)) {
      return NextResponse.json({ error: 'Format accepté : JPEG, PNG ou WebP.' }, { status: 400 });
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const safeExt = ['jpg', 'jpeg', 'png', 'webp'].includes(ext) ? ext : 'jpg';
    const uuid = crypto.randomUUID();
    const path = `${user.id}/messages/${conversationId}/${uuid}.${safeExt}`;
    const bucket = 'listings';
    const buf = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await server.storage
      .from(bucket)
      .upload(path, buf, { upsert: false, contentType: file.type || 'image/jpeg' });

    if (uploadError) {
      console.error('Upload message image:', uploadError);
      return NextResponse.json(
        { error: `Échec de l'upload : ${(uploadError as { message?: string }).message || String(uploadError)}` },
        { status: 500 }
      );
    }

    const url = `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
    return NextResponse.json({ url });
  } catch (err) {
    console.error('upload-message-image:', err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Erreur serveur : ${msg}` },
      { status: 500 }
    );
  }
}
