import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseServer } from '@/lib/supabase/server';
import { isAdminEmail } from '@/lib/constants';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export type AccountStatsResponse = {
  visitorAccounts: number;
  sellerAccounts: number;
  subscriptionByTier: { start: number; plus: number; pro: number; other: number };
};

/**
 * GET /api/admin/account-stats
 * Comptes visiteurs (users sans fiche vendeur), vendeurs, répartition abonnement.
 */
export async function GET(request: NextRequest) {
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
      return NextResponse.json({ error: 'Session invalide ou expirée' }, { status: 401 });
    }

    const server = getSupabaseServer();
    if (!server) {
      return NextResponse.json({ error: 'Supabase non configuré' }, { status: 503 });
    }

    const { data: caller } = await server
      .from('users')
      .select('role, email')
      .eq('id', user.id)
      .single();
    if (!caller || caller.role !== 'admin' || !isAdminEmail(caller.email)) {
      return NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 });
    }

    const { count: usersCount, error: usersErr } = await server
      .from('users')
      .select('*', { count: 'exact', head: true });
    if (usersErr) throw usersErr;

    const { count: sellersCount, error: sellersErr } = await server
      .from('sellers')
      .select('*', { count: 'exact', head: true });
    if (sellersErr) throw sellersErr;

    const u = usersCount ?? 0;
    const s = sellersCount ?? 0;
    const visitorAccounts = Math.max(0, u - s);

    const { data: tierRows, error: tierErr } = await server.from('sellers').select('subscription_tier');
    if (tierErr) throw tierErr;

    const subscriptionByTier = { start: 0, plus: 0, pro: 0, other: 0 };
    for (const row of tierRows || []) {
      const t = String((row as { subscription_tier?: string }).subscription_tier || 'start')
        .trim()
        .toLowerCase();
      if (t === 'plus') subscriptionByTier.plus += 1;
      else if (t === 'pro') subscriptionByTier.pro += 1;
      else if (t === 'start') subscriptionByTier.start += 1;
      else subscriptionByTier.other += 1;
    }

    const body: AccountStatsResponse = {
      visitorAccounts,
      sellerAccounts: s,
      subscriptionByTier,
    };

    return NextResponse.json(body);
  } catch (err) {
    console.error('admin/account-stats:', err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
