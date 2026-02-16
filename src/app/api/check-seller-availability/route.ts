import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';

/**
 * Vérifie si un email ou un SIRET est déjà utilisé par un vendeur.
 * GET /api/check-seller-availability?email=...&siret=...
 * Réponse: { emailTaken: boolean, siretTaken: boolean }
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email')?.trim().toLowerCase();
    const siret = searchParams.get('siret')?.replace(/\D/g, '') || '';

    if (!email && !siret) {
      return NextResponse.json(
        { error: 'Indiquez email ou siret' },
        { status: 400 }
      );
    }

    const server = getSupabaseServer();
    if (!server) {
      return NextResponse.json(
        { error: 'Service indisponible' },
        { status: 503 }
      );
    }

    let emailTaken = false;
    let siretTaken = false;

    if (email) {
      const { data: byEmail } = await server
        .from('sellers')
        .select('id')
        .ilike('email', email)
        .limit(1)
        .maybeSingle();
      emailTaken = !!byEmail;
    }

    if (siret && siret.length >= 14) {
      const { data: bySiret } = await server
        .from('sellers')
        .select('id')
        .eq('siret', siret)
        .limit(1)
        .maybeSingle();
      siretTaken = !!bySiret;
    }

    return NextResponse.json({ emailTaken, siretTaken });
  } catch (err) {
    console.error('check-seller-availability:', err);
    return NextResponse.json(
      { error: 'Vérification indisponible' },
      { status: 500 }
    );
  }
}
