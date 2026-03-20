import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthUserFromBearer } from '@/lib/api/getAuthUserFromBearer';
import { getSupabaseServer } from '@/lib/supabase/server';
import { generateSixDigitCode, hashEmailChangeCode } from '@/lib/email-change-code';
import { getSmtpTransporter } from '@/lib/email/smtpTransporter';

export const runtime = 'nodejs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const OTP_TTL_MS = 5 * 60 * 1000;

function isMissingTableError(err: { message?: string; code?: string } | null): boolean {
  if (!err) return false;
  const m = (err.message || '').toLowerCase();
  return (
    m.includes('does not exist') ||
    m.includes('schema cache') ||
    m.includes('could not find the table') ||
    err.code === '42P01' ||
    err.code === 'PGRST205'
  );
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUserFromBearer(request);
    if (!auth?.user?.email) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const password = typeof body.password === 'string' ? body.password : '';
    if (!password) {
      return NextResponse.json({ error: 'Mot de passe requis.' }, { status: 400 });
    }

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: 'Configuration Supabase manquante.' }, { status: 503 });
    }

    const signInClient = createClient(supabaseUrl, supabaseAnonKey);
    const { error: signErr } = await signInClient.auth.signInWithPassword({
      email: auth.user.email,
      password,
    });
    if (signErr) {
      const msg = signErr.message?.toLowerCase() || '';
      if (msg.includes('invalid') || msg.includes('credential')) {
        return NextResponse.json({ error: 'Mot de passe incorrect.' }, { status: 400 });
      }
      return NextResponse.json({ error: signErr.message || 'Connexion impossible.' }, { status: 400 });
    }

    const server = getSupabaseServer();
    if (!server) {
      return NextResponse.json({ error: 'Service indisponible.' }, { status: 503 });
    }

    const code = generateSixDigitCode();
    const codeHash = hashEmailChangeCode(auth.user.id, code);
    const expiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString();

    await server.from('email_change_otp').delete().eq('user_id', auth.user.id);

    const { error: insErr } = await server.from('email_change_otp').insert({
      user_id: auth.user.id,
      code_hash: codeHash,
      expires_at: expiresAt,
    });
    if (insErr) {
      console.error('email-change send-code insert:', insErr);
      if (isMissingTableError(insErr)) {
        return NextResponse.json(
          {
            error:
              'Tables OTP non créées. Exécutez la migration Supabase `email_change_otp.sql` (SQL Editor ou CLI).',
          },
          { status: 503 }
        );
      }
      return NextResponse.json({ error: 'Impossible d’enregistrer le code.' }, { status: 500 });
    }

    const transporter = getSmtpTransporter();
    if (!transporter) {
      console.error('SMTP non configuré (email-change send-code)');
      await server.from('email_change_otp').delete().eq('user_id', auth.user.id);
      return NextResponse.json(
        {
          error:
            'Envoi e-mail indisponible : configurez SMTP_HOST, SMTP_USER et SMTP_PASS sur Vercel (ou un relais SMTP autorisé).',
        },
        { status: 503 }
      );
    }

    const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@sectionluxe.com';
    try {
      await transporter.sendMail({
        from: `"Section Luxe" <${from}>`,
        to: auth.user.email,
        subject: 'Votre code Section Luxe',
        text: [
          'Bonjour,',
          '',
          `Votre code de vérification est : ${code}`,
          '',
          'Il est valable 5 minutes.',
          '',
          'Si vous n’avez pas demandé ce code, ignorez ce message.',
          '',
          '— Section Luxe',
        ].join('\n'),
      });
    } catch (mailErr) {
      console.error('email-change send-code sendMail:', mailErr);
      await server.from('email_change_otp').delete().eq('user_id', auth.user.id);
      return NextResponse.json(
        {
          error:
            'L’e-mail n’a pas pu être envoyé. Vérifiez les identifiants SMTP sur Vercel et que le fournisseur autorise l’envoi.',
        },
        { status: 503 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('email-change send-code:', err);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
