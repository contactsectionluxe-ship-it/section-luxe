import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromBearer } from '@/lib/api/getAuthUserFromBearer';
import { getSupabaseServer } from '@/lib/supabase/server';
import { hashEmailChangeCode, hashesEqualHex } from '@/lib/email-change-code';

const VERIFIED_TTL_MS = 15 * 60 * 1000;

function normalizeCode(raw: string): string | null {
  const digits = raw.replace(/\D/g, '').slice(0, 6);
  if (digits.length !== 6) return null;
  return digits;
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUserFromBearer(request);
    if (!auth?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const raw = typeof body.code === 'string' ? body.code : '';
    const code = normalizeCode(raw);
    if (!code) {
      return NextResponse.json({ error: 'Saisissez le code à 6 chiffres.' }, { status: 400 });
    }

    const server = getSupabaseServer();
    if (!server) {
      return NextResponse.json({ error: 'Service indisponible.' }, { status: 503 });
    }

    const { data: row, error: fetchErr } = await server
      .from('email_change_otp')
      .select('id, code_hash, expires_at')
      .eq('user_id', auth.user.id)
      .maybeSingle();

    if (fetchErr || !row) {
      return NextResponse.json({ error: 'Aucun code actif. Demandez un nouveau code.' }, { status: 400 });
    }

    const expiresAt = new Date((row as { expires_at: string }).expires_at).getTime();
    if (Number.isNaN(expiresAt) || expiresAt < Date.now()) {
      await server.from('email_change_otp').delete().eq('user_id', auth.user.id);
      return NextResponse.json({ error: 'Code expiré. Demandez un nouveau code.' }, { status: 400 });
    }

    const storedHash = (row as { code_hash: string }).code_hash;
    const tryHash = hashEmailChangeCode(auth.user.id, code);
    if (!hashesEqualHex(storedHash, tryHash)) {
      return NextResponse.json({ error: 'Code incorrect.' }, { status: 400 });
    }

    await server.from('email_change_otp').delete().eq('user_id', auth.user.id);

    const verifiedExpires = new Date(Date.now() + VERIFIED_TTL_MS).toISOString();
    const { error: upErr } = await server.from('email_change_verified').upsert(
      {
        user_id: auth.user.id,
        verified_at: new Date().toISOString(),
        expires_at: verifiedExpires,
      },
      { onConflict: 'user_id' }
    );
    if (upErr) {
      console.error('email-change verify upsert:', upErr);
      return NextResponse.json({ error: 'Impossible de valider la session.' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('email-change verify-code:', err);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
