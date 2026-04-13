import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';
import { CONSENT_POLICY_VERSION } from '@/lib/consent/constants';
import type { ConsentSource } from '@/lib/consent/types';

const SOURCES: ConsentSource[] = ['accept_all', 'reject_all', 'customize'];

/**
 * POST /api/consent/log
 * Enregistre une trace du choix (preuve). Pas de données personnelles obligatoires.
 */
export async function POST(request: NextRequest) {
  try {
    const server = getSupabaseServer();
    if (!server) {
      return NextResponse.json({ ok: false, skipped: true }, { status: 200 });
    }

    const body = await request.json().catch(() => ({}));
    const policyVersion =
      typeof (body as { policyVersion?: number }).policyVersion === 'number'
        ? (body as { policyVersion: number }).policyVersion
        : CONSENT_POLICY_VERSION;
    const analytics = Boolean((body as { analytics?: boolean }).analytics);
    const marketing = Boolean((body as { marketing?: boolean }).marketing);
    const source = (body as { source?: string }).source;
    if (!source || !SOURCES.includes(source as ConsentSource)) {
      return NextResponse.json({ error: 'source invalide' }, { status: 400 });
    }

    const ua = request.headers.get('user-agent')?.slice(0, 512) ?? null;
    const locale = request.headers.get('accept-language')?.slice(0, 32) ?? null;

    const { error } = await server.from('consent_logs').insert({
      policy_version: policyVersion,
      analytics_granted: analytics,
      marketing_granted: marketing,
      source,
      user_agent: ua,
      locale,
    });

    if (error) {
      console.error('consent/log insert:', error);
      return NextResponse.json({ ok: false }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('consent/log:', err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
