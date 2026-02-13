import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseServer } from '@/lib/supabase/server';
import { validateImageFile } from '@/lib/file-validation';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Upload de la photo de profil vendeur.
 * Stockage dans le bucket listings : {sellerId}/avatar.{ext}
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
    const file = formData.get('avatar') as File | null;
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'Aucune photo fournie (champ "avatar")' },
        { status: 400 }
      );
    }
    const validation = validateImageFile(file);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `${user.id}/avatar.${ext}`;
    const bucket = 'listings';
    const buf = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await server.storage
      .from(bucket)
      .upload(path, buf, { upsert: true, contentType: file.type || 'image/jpeg' });

    if (uploadError) {
      console.error('Upload seller avatar:', uploadError);
      return NextResponse.json(
        { error: `Échec de l'upload : ${(uploadError as { message?: string }).message || String(uploadError)}` },
        { status: 500 }
      );
    }

    const url = `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
    return NextResponse.json({ url });
  } catch (err) {
    console.error('upload-seller-avatar:', err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Erreur serveur : ${msg}` },
      { status: 500 }
    );
  }
}
