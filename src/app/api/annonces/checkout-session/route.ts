import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { stripeServer, STRIPE_PRICE_DEPOT_ANNONCE, isStripeDepotEnabled } from '@/lib/stripe';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Crée une session Stripe Checkout pour payer le dépôt d'annonce.
 * Body: { listingId }. L'annonce doit exister, appartenir au vendeur connecté et être en brouillon (is_active: false).
 * Retourne { url } pour rediriger vers Stripe Checkout.
 */
export async function POST(request: NextRequest) {
  if (!isStripeDepotEnabled()) {
    return NextResponse.json(
      { error: 'Paiement dépôt d\'annonce non configuré' },
      { status: 503 }
    );
  }

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

  let body: { listingId?: string; publishAfterPayment?: boolean };
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

  const publishAfterPayment = body.publishAfterPayment !== false;

  const { data: listing, error: listingError } = await clientWithAuth
    .from('listings')
    .select('id, seller_id, is_active')
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

  const stripe = stripeServer!;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        price: STRIPE_PRICE_DEPOT_ANNONCE,
        quantity: 1,
      },
    ],
    client_reference_id: listingId,
    success_url: `${baseUrl}/vendeur/annonces/nouvelle/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/vendeur/annonces/nouvelle?cancel=1&listingId=${encodeURIComponent(listingId)}`,
    metadata: {
      listingId,
      sellerId: user.id,
      publish_after_payment: publishAfterPayment ? 'true' : 'false',
    },
  });

  if (!session.url) {
    return NextResponse.json(
      { error: 'Impossible de créer la session de paiement' },
      { status: 500 }
    );
  }

  return NextResponse.json({ url: session.url });
}
