import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseServer } from '@/lib/supabase/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Supprime le compte vendeur : supprime toutes les annonces et l'identité du vendeur,
 * conserve les factures et leurs données. Supprime l'utilisateur Auth et la ligne users.
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
        { error: 'Supabase service role non configuré (SUPABASE_SERVICE_ROLE_KEY)' },
        { status: 503 }
      );
    }

    const uid = user.id;

    // 1. Supprimer toutes les annonces du vendeur (les factures restent avec listing_id / infos conservées)
    await server.from('listings').delete().eq('seller_id', uid);

    // 2. Anonymiser le vendeur : conserver la ligne pour les factures, retirer l'identité du site
    await server
      .from('sellers')
      .update({
        company_name: 'Compte supprimé',
        email: `deleted-${uid}@deleted.local`,
        address: '',
        city: '',
        postcode: '',
        phone: '',
        description: '',
        avatar_url: null,
        id_card_front_url: null,
        id_card_back_url: null,
        kbis_url: null,
      })
      .eq('id', uid);

    // 3. Supprimer la ligne utilisateur (profil public)
    await server.from('users').delete().eq('id', uid);

    // 4. Supprimer le compte Auth (plus de connexion possible)
    const { error: deleteError } = await server.auth.admin.deleteUser(uid);
    if (deleteError) {
      console.error('delete-account:', deleteError);
      return NextResponse.json(
        { error: deleteError.message || 'Impossible de supprimer le compte' },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('delete-account:', err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Erreur serveur : ${msg}` },
      { status: 500 }
    );
  }
}
