import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /api/newsletter/subscribe
 * Body: { email: string }
 * Inscrit un email à la newsletter (ou réinscrit si désinscrit).
 */
export async function POST(request: NextRequest) {
  try {
    const server = getSupabaseServer();
    if (!server) {
      return NextResponse.json(
        { error: 'Service indisponible' },
        { status: 503 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const email = typeof (body as { email?: string }).email === 'string'
      ? (body as { email: string }).email.trim().toLowerCase()
      : '';
    if (!email || !EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: 'Email invalide' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    const { data: existing } = await server
      .from('newsletter_subscribers')
      .select('id, status')
      .eq('email', email)
      .single();

    if (existing) {
      if (existing.status === 'subscribed') {
        return NextResponse.json({ ok: true, message: 'Déjà inscrit' });
      }
      await server
        .from('newsletter_subscribers')
        .update({
          status: 'subscribed',
          unsubscribed_at: null,
          updated_at: now,
        })
        .eq('id', existing.id);
    } else {
      await server
        .from('newsletter_subscribers')
        .insert({
          email,
          status: 'subscribed',
          subscribed_at: now,
          updated_at: now,
        });
    }

    return NextResponse.json({ ok: true, message: 'Inscription enregistrée' });
  } catch (err) {
    console.error('newsletter/subscribe:', err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
