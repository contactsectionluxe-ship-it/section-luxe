import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseServer } from '@/lib/supabase/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(s: string): boolean {
  return uuidRegex.test(s);
}

/**
 * Remplace les lignes sale_proposal_invited_sellers pour une proposition.
 * Passe par la service role pour que le DELETE réussisse même sans politique RLS DELETE côté client.
 */
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

    const body = (await request.json()) as { proposalId?: string; sellerIds?: string[] };
    const proposalId = (body.proposalId || '').trim();
    if (!proposalId || !isUuid(proposalId)) {
      return NextResponse.json({ error: 'proposalId invalide' }, { status: 400 });
    }

    const rawIds = Array.isArray(body.sellerIds) ? body.sellerIds : [];
    const sellerIds = [...new Set(rawIds.map((id) => String(id).trim()).filter(Boolean))];
    for (const id of sellerIds) {
      if (!isUuid(id)) {
        return NextResponse.json({ error: `sellerId invalide: ${id}` }, { status: 400 });
      }
    }

    const { data: prop, error: propErr } = await server
      .from('sale_proposals')
      .select('visitor_id')
      .eq('id', proposalId)
      .single();
    if (propErr || !prop || prop.visitor_id !== user.id) {
      return NextResponse.json({ error: 'Proposition introuvable' }, { status: 403 });
    }

    const { error: delErr } = await server.from('sale_proposal_invited_sellers').delete().eq('proposal_id', proposalId);
    if (delErr) {
      return NextResponse.json({ error: delErr.message || 'Échec suppression invitations' }, { status: 500 });
    }

    if (sellerIds.length > 0) {
      const invites = sellerIds.map((seller_id) => ({ proposal_id: proposalId, seller_id }));
      const { error: insErr } = await server.from('sale_proposal_invited_sellers').insert(invites);
      if (insErr) {
        return NextResponse.json({ error: insErr.message || 'Échec insertion invitations' }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('replace-sale-proposal-invites:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
