import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseServer } from '@/lib/supabase/server';
import { validateImageFile } from '@/lib/file-validation';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Upload des photos d'annonce via la clé service_role pour contourner la RLS Storage.
 * Vérifie que l'utilisateur est connecté (JWT) et que l'annonce lui appartient.
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
    const listingId = formData.get('listingId') as string | null;
    if (!listingId?.trim()) {
      return NextResponse.json(
        { error: 'listingId manquant' },
        { status: 400 }
      );
    }

    // Index de départ pour ne pas écraser les photos existantes (modification d'annonce)
    const startIndex = Math.max(0, parseInt(String(formData.get('startIndex') || '0'), 10) || 0);

    const photos = formData.getAll('photos').filter((f): f is File => f instanceof File && f.size > 0);
    if (photos.length === 0) {
      return NextResponse.json(
        { error: 'Aucune photo fournie' },
        { status: 400 }
      );
    }
    for (const photo of photos) {
      const v = validateImageFile(photo);
      if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });
    }

    const { data: listing, error: listingError } = await server
      .from('listings')
      .select('seller_id')
      .eq('id', listingId)
      .single();

    if (listingError || !listing) {
      return NextResponse.json(
        { error: 'Annonce introuvable' },
        { status: 404 }
      );
    }
    if (listing.seller_id !== user.id) {
      return NextResponse.json(
        { error: 'Vous ne pouvez modifier que vos propres annonces' },
        { status: 403 }
      );
    }

    const bucket = 'listings';
    const sellerId = user.id;
    const baseUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}`;
    const urls: string[] = [];

    for (let i = 0; i < photos.length; i++) {
      const file = photos[i];
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const path = `${sellerId}/${listingId}/photo_${startIndex + i}.${ext}`;
      const buf = Buffer.from(await file.arrayBuffer());
      const { error: uploadError } = await server.storage
        .from(bucket)
        .upload(path, buf, { upsert: true, contentType: file.type || 'image/jpeg' });

      if (uploadError) {
        console.error('Upload listing photo:', uploadError);
        return NextResponse.json(
          { error: `Échec de l'upload : ${(uploadError as { message?: string }).message || String(uploadError)}` },
          { status: 500 }
        );
      }
      urls.push(`${baseUrl}/${path}`);
    }

    return NextResponse.json({ urls });
  } catch (err) {
    console.error('upload-listing-photos:', err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Erreur serveur : ${msg}` },
      { status: 500 }
    );
  }
}
