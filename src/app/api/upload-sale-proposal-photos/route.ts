import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseServer } from '@/lib/supabase/server';
import { validateImageFile, MAX_FILE_SIZE_BYTES } from '@/lib/file-validation';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace(/^Bearer\s+/i, '');
    if (!token || !supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const clientWithAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const {
      data: { user },
      error: userError,
    } = await clientWithAuth.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Session invalide' }, { status: 401 });
    }

    const server = getSupabaseServer();
    if (!server) {
      return NextResponse.json({ error: 'Supabase service role non configuré' }, { status: 503 });
    }

    const formData = await request.formData();
    const proposalId = (formData.get('proposalId') as string | null)?.trim() || '';
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!proposalId || !uuidRegex.test(proposalId)) {
      return NextResponse.json({ error: 'proposalId invalide' }, { status: 400 });
    }

    const { data: prop, error: propErr } = await server
      .from('sale_proposals')
      .select('visitor_id')
      .eq('id', proposalId)
      .single();
    if (propErr || !prop || prop.visitor_id !== user.id) {
      return NextResponse.json({ error: 'Proposition introuvable' }, { status: 403 });
    }

    const startIndex = Math.max(0, parseInt(String(formData.get('startIndex') || '0'), 10) || 0);
    const photos = formData.getAll('photos').filter((f): f is File => f instanceof File && f.size > 0);
    if (photos.length === 0) {
      return NextResponse.json({ error: 'Aucune photo' }, { status: 400 });
    }
    for (const photo of photos) {
      const v = validateImageFile(photo);
      if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });
    }

    const bucket = 'listings';
    const baseUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}`;
    const urls: string[] = [];

    for (let i = 0; i < photos.length; i++) {
      const file = photos[i];
      const rawExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const allowedExt = ['jpg', 'jpeg', 'png'].includes(rawExt) ? rawExt : 'jpg';
      const path = `${user.id}/proposals/${proposalId}/photo_${startIndex + i}.${allowedExt}`;
      const buf = Buffer.from(await file.arrayBuffer());
      const { error: uploadError } = await server.storage
        .from(bucket)
        .upload(path, buf, { upsert: true, contentType: file.type || 'image/jpeg' });
      if (uploadError) {
        return NextResponse.json(
          { error: uploadError.message || 'Échec upload' },
          { status: 500 },
        );
      }
      urls.push(`${baseUrl}/${path}`);
    }

    return NextResponse.json({ urls });
  } catch (err) {
    console.error('upload-sale-proposal-photos:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
