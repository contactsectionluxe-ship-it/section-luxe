import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromBearer } from '@/lib/api/getAuthUserFromBearer';
import { getSupabaseServer } from '@/lib/supabase/server';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUserFromBearer(request);
    if (!auth?.user?.id || !auth.user.email) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const newEmail = typeof body.newEmail === 'string' ? body.newEmail.trim().toLowerCase() : '';
    if (!newEmail || !EMAIL_RE.test(newEmail)) {
      return NextResponse.json({ error: 'Adresse e-mail invalide.' }, { status: 400 });
    }

    if (newEmail === auth.user.email.trim().toLowerCase()) {
      return NextResponse.json({ error: 'La nouvelle adresse est identique à l’actuelle.' }, { status: 400 });
    }

    const server = getSupabaseServer();
    if (!server) {
      return NextResponse.json({ error: 'Service indisponible.' }, { status: 503 });
    }

    const { data: verifiedRow, error: verErr } = await server
      .from('email_change_verified')
      .select('expires_at')
      .eq('user_id', auth.user.id)
      .maybeSingle();

    if (verErr || !verifiedRow) {
      return NextResponse.json({ error: 'Étape de vérification manquante ou expirée.' }, { status: 403 });
    }

    const exp = new Date((verifiedRow as { expires_at: string }).expires_at).getTime();
    if (Number.isNaN(exp) || exp < Date.now()) {
      await server.from('email_change_verified').delete().eq('user_id', auth.user.id);
      return NextResponse.json({ error: 'Session expirée. Recommencez depuis le début.' }, { status: 403 });
    }

    const { error: adminErr } = await server.auth.admin.updateUserById(auth.user.id, {
      email: newEmail,
      email_confirm: true,
    });
    if (adminErr) {
      const msg = adminErr.message?.toLowerCase() || '';
      if (msg.includes('already') || msg.includes('registered') || msg.includes('exists')) {
        return NextResponse.json({ error: 'Cette adresse e-mail est déjà utilisée.' }, { status: 400 });
      }
      console.error('email-change confirm admin:', adminErr);
      return NextResponse.json({ error: adminErr.message || 'Impossible de mettre à jour l’e-mail.' }, { status: 400 });
    }

    await server.from('users').update({ email: newEmail }).eq('id', auth.user.id);

    const { data: sellerRow } = await server.from('sellers').select('id').eq('id', auth.user.id).maybeSingle();
    if (sellerRow) {
      await server
        .from('sellers')
        .update({ email: newEmail, updated_at: new Date().toISOString() })
        .eq('id', auth.user.id);
    }

    await server.from('email_change_verified').delete().eq('user_id', auth.user.id);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('email-change confirm:', err);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
