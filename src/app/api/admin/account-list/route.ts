import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseServer } from '@/lib/supabase/server';
import { isAdminEmail } from '@/lib/constants';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export type VisitorAccountRow = {
  id: string;
  email: string;
  display_name: string;
  role: string;
  created_at: string;
};

export type SellerAccountRow = {
  id: string;
  email: string;
  company_name: string;
  phone: string;
  status: string;
  subscription_tier: string | null;
  created_at: string;
};

function matchesQuery(q: string, ...fields: (string | null | undefined)[]): boolean {
  const ql = q.toLowerCase();
  return fields.some((f) => (f && String(f).toLowerCase().includes(ql)) || false);
}

/**
 * GET /api/admin/account-list?category=visitors|sellers|start|plus|pro&q=
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

    const category = request.nextUrl.searchParams.get('category') || 'visitors';
    const q = (request.nextUrl.searchParams.get('q') || '').trim();

    if (category === 'visitors') {
      const { data: sellerRows, error: sErr } = await server.from('sellers').select('id');
      if (sErr) throw sErr;
      const sellerIds = new Set((sellerRows || []).map((r: { id: string }) => r.id));

      const { data: userRows, error: uErr } = await server
        .from('users')
        .select('id, email, display_name, role, created_at')
        .order('created_at', { ascending: false });
      if (uErr) throw uErr;

      let items: VisitorAccountRow[] = (userRows || [])
        .filter((u: { id: string }) => !sellerIds.has(u.id))
        .map((u: { id: string; email: string; display_name: string; role: string; created_at: string }) => ({
          id: u.id,
          email: u.email,
          display_name: u.display_name,
          role: u.role,
          created_at: u.created_at,
        }));

      if (q) {
        items = items.filter((u) => matchesQuery(q, u.email, u.display_name, u.id, u.role));
      }

      return NextResponse.json({ kind: 'visitors' as const, items });
    }

    if (category === 'sellers' || category === 'start' || category === 'plus' || category === 'pro') {
      let query = server
        .from('sellers')
        .select('id, email, company_name, phone, status, subscription_tier, created_at')
        .order('created_at', { ascending: false });

      if (category === 'start') {
        query = query.or('subscription_tier.eq.start,subscription_tier.is.null');
      } else if (category === 'plus') {
        query = query.eq('subscription_tier', 'plus');
      } else if (category === 'pro') {
        query = query.eq('subscription_tier', 'pro');
      }

      const { data: sellerData, error: selErr } = await query;
      if (selErr) throw selErr;

      let items: SellerAccountRow[] = (sellerData || []).map(
        (r: {
          id: string;
          email: string;
          company_name: string;
          phone: string;
          status: string;
          subscription_tier: string | null;
          created_at: string;
        }) => ({
          id: r.id,
          email: r.email,
          company_name: r.company_name,
          phone: r.phone,
          status: r.status,
          subscription_tier: r.subscription_tier,
          created_at: r.created_at,
        })
      );

      if (q) {
        items = items.filter((r) =>
          matchesQuery(q, r.email, r.company_name, r.phone, r.id, r.status, r.subscription_tier ?? '')
        );
      }

      return NextResponse.json({ kind: 'sellers' as const, items });
    }

    return NextResponse.json({ error: 'category invalide' }, { status: 400 });
  } catch (err) {
    console.error('admin/account-list:', err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
