import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseServer } from '@/lib/supabase/server';
import { isAdminEmail } from '@/lib/constants';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * POST /api/admin/ban-seller
 * Body: { sellerId: string }
 * Bannit un vendeur : statut banned, rôle buyer, désactivation de toutes ses annonces (non supprimées).
 * Réservé aux admins (role + email).
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
    const {
      data: { user },
      error: userError,
    } = await clientWithAuth.auth.getUser();
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

    const { data: caller } = await server
      .from('users')
      .select('role, email')
      .eq('id', user.id)
      .single();
    if (!caller || caller.role !== 'admin' || !isAdminEmail(caller.email)) {
      return NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const sellerId =
      typeof (body as { sellerId?: string }).sellerId === 'string'
        ? (body as { sellerId: string }).sellerId
        : '';
    if (!sellerId) {
      return NextResponse.json({ error: 'sellerId requis' }, { status: 400 });
    }

    // 1. Désactiver toutes les annonces du vendeur (elles ne peuvent être réactivées qu'après réactivation du compte)
    await server
      .from('listings')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('seller_id', sellerId);

    // 2. Statut vendeur → banned
    await server
      .from('sellers')
      .update({ status: 'banned', updated_at: new Date().toISOString() })
      .eq('id', sellerId);

    // 3. Rôle utilisateur → buyer (redevient visiteur)
    await server.from('users').update({ role: 'buyer' }).eq('id', sellerId);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('ban-seller:', err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
