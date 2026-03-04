import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';
import { CGU_CGV_VERSION } from '@/lib/cgu-cgv-version';

const ALLOWED_CONTEXTS = ['inscription', 'inscription_vendeur', 'publication_annonce', 'modification_annonce'] as const;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = typeof body.userId === 'string' ? body.userId.trim() : '';
    const context = typeof body.context === 'string' ? body.context.trim() : '';

    if (!userId) {
      return NextResponse.json({ error: 'userId requis' }, { status: 400 });
    }
    if (!context || !ALLOWED_CONTEXTS.includes(context as (typeof ALLOWED_CONTEXTS)[number])) {
      return NextResponse.json({ error: 'context invalide' }, { status: 400 });
    }

    const db = getSupabaseServer();
    if (!db) {
      return NextResponse.json({ error: 'Base non disponible' }, { status: 503 });
    }

    const { error } = await db.from('cgu_cgv_acceptances').insert({
      user_id: userId,
      cgu_cgv_version: CGU_CGV_VERSION,
      context,
    });

    if (error) {
      console.error('cgu_cgv_acceptance insert error:', error);
      return NextResponse.json({ error: 'Enregistrement impossible' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('cgu_cgv_acceptance error:', e);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
