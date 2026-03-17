import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseServer } from '@/lib/supabase/server';
import { isAdminEmail } from '@/lib/constants';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export type NewsletterSubscriberRow = {
  id: string;
  email: string;
  status: 'subscribed' | 'unsubscribed';
  subscribed_at: string;
  unsubscribed_at: string | null;
  created_at: string;
  updated_at: string;
};

/**
 * GET /api/admin/newsletter-subscribers
 * Liste des inscrits / désinscrits newsletter. Réservé aux admins.
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace(/^Bearer\s+/i, '');
    if (!token || !supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const clientWithAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const {
      data: { user },
      error: userError,
    } = await clientWithAuth.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Session invalide ou expirée' },
        { status: 401 }
      );
    }

    const server = getSupabaseServer();
    if (!server) {
      return NextResponse.json(
        { error: 'Supabase non configuré' },
        { status: 503 }
      );
    }

    const { data: caller } = await server
      .from('users')
      .select('role, email')
      .eq('id', user.id)
      .single();
    if (!caller || caller.role !== 'admin' || !isAdminEmail(caller.email)) {
      return NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // 'subscribed' | 'unsubscribed' | null = all

    let query = server
      .from('newsletter_subscribers')
      .select('id, email, status, subscribed_at, unsubscribed_at, created_at, updated_at')
      .order('subscribed_at', { ascending: false });

    if (status === 'subscribed' || status === 'unsubscribed') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      if ((error as { code?: string }).code === '42P01') {
        return NextResponse.json(
          { error: 'Table newsletter_subscribers absente. Exécutez la migration newsletter_subscribers.sql dans Supabase.' },
          { status: 503 }
        );
      }
      throw error;
    }

    return NextResponse.json({ subscribers: (data || []) as NewsletterSubscriberRow[] });
  } catch (err) {
    console.error('admin/newsletter-subscribers:', err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
