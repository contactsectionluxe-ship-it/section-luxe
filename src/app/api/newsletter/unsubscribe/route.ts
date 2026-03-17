import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /api/newsletter/unsubscribe
 * Body: { email: string }
 * Désinscrit un email de la newsletter.
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

    const { data: row } = await server
      .from('newsletter_subscribers')
      .select('id, status')
      .eq('email', email)
      .single();

    if (!row) {
      return NextResponse.json({ ok: true, message: 'Email inconnu' });
    }
    if (row.status === 'unsubscribed') {
      return NextResponse.json({ ok: true, message: 'Déjà désinscrit' });
    }

    await server
      .from('newsletter_subscribers')
      .update({
        status: 'unsubscribed',
        unsubscribed_at: now,
        updated_at: now,
      })
      .eq('id', row.id);

    return NextResponse.json({ ok: true, message: 'Désinscription enregistrée' });
  } catch (err) {
    console.error('newsletter/unsubscribe:', err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
