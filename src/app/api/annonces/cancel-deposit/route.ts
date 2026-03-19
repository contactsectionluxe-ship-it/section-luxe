import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Supprime l'annonce brouillon si le paiement n'a pas été mené à terme (annulation Stripe).
 * Body: { listingId }. L'annonce doit appartenir au vendeur connecté et être en brouillon (is_active: false).
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace(/^Bearer\s+/i, '');
  if (!token || !supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      { error: 'Non autorisé (token manquant)' },
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

  let body: { listingId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Corps de requête JSON invalide' },
      { status: 400 }
    );
  }

  const listingId = typeof body.listingId === 'string' ? body.listingId.trim() : '';
  if (!listingId) {
    return NextResponse.json(
      { error: 'listingId requis' },
      { status: 400 }
    );
  }

  const { data: listing, error: fetchError } = await clientWithAuth
    .from('listings')
    .select('id, seller_id, is_active')
    .eq('id', listingId)
    .single();

  if (fetchError || !listing) {
    return NextResponse.json(
      { error: 'Annonce introuvable' },
      { status: 404 }
    );
  }
  if (listing.seller_id !== user.id) {
    return NextResponse.json(
      { error: 'Cette annonce ne vous appartient pas' },
      { status: 403 }
    );
  }
  if (listing.is_active === true) {
    return NextResponse.json(
      { error: 'Cette annonce est déjà publiée' },
      { status: 400 }
    );
  }

  const { error: deleteError } = await clientWithAuth
    .from('listings')
    .delete()
    .eq('id', listingId);

  if (deleteError) {
    return NextResponse.json(
      { error: 'Impossible de supprimer l\'annonce' },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
