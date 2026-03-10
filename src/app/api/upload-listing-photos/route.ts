import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseServer } from '@/lib/supabase/server';
import { validateImageFile, MAX_FILE_SIZE_BYTES } from '@/lib/file-validation';

const MAX_PHOTOS_PER_REQUEST = 12;
const MAX_TOTAL_UPLOAD_BYTES = MAX_FILE_SIZE_BYTES * MAX_PHOTOS_PER_REQUEST;

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

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (parseErr) {
      const msg = parseErr instanceof Error ? parseErr.message : String(parseErr);
      const cause = parseErr instanceof Error && parseErr.cause instanceof Error ? parseErr.cause.message : '';
      console.error('upload-listing-photos formData parse:', parseErr);
      const isFormDataParse = msg.includes('FormData') || msg.includes('parse body') || cause.includes('boundary') || cause.includes('CRLF');
      return NextResponse.json(
        {
          error: isFormDataParse
            ? 'Envoi des photos impossible. Réessayez avec moins de photos ou des fichiers plus légers (max 5 Mo par photo). Si le problème persiste, évitez les noms de fichiers avec accents ou emoji.'
            : msg,
        },
        { status: 400 }
      );
    }

    const listingId = (formData.get('listingId') as string | null)?.trim() || '';
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!listingId || !uuidRegex.test(listingId)) {
      return NextResponse.json(
        { error: 'listingId invalide' },
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
    if (photos.length > MAX_PHOTOS_PER_REQUEST) {
      return NextResponse.json(
        { error: `Maximum ${MAX_PHOTOS_PER_REQUEST} photos par envoi` },
        { status: 400 }
      );
    }
    let totalSize = 0;
    for (const photo of photos) {
      const v = validateImageFile(photo);
      if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });
      totalSize += photo.size;
    }
    if (totalSize > MAX_TOTAL_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: 'Taille totale des photos trop importante' },
        { status: 400 }
      );
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
      const rawExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const allowedExt = ['jpg', 'jpeg', 'png'].includes(rawExt) ? rawExt : 'jpg';
      const path = `${sellerId}/${listingId}/photo_${startIndex + i}.${allowedExt}`;
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
    return NextResponse.json(
      { error: process.env.NODE_ENV === 'development' ? (err instanceof Error ? err.message : String(err)) : 'Erreur serveur' },
      { status: 500 }
    );
  }
}
