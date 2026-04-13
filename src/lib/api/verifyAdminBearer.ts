import { createClient } from '@supabase/supabase-js';
import { getSupabaseServer } from '@/lib/supabase/server';
import { isAdminEmail } from '@/lib/constants';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export type AdminVerifyResult =
  | { ok: true; userId: string }
  | { ok: false; status: number; message: string };

/**
 * Vérifie le Bearer JWT et que l’utilisateur est admin (rôle + e-mail Section Luxe).
 */
export async function verifyAdminBearer(token: string | undefined): Promise<AdminVerifyResult> {
  if (!token || !supabaseUrl || !supabaseAnonKey) {
    return { ok: false, status: 401, message: 'Non autorisé' };
  }

  const clientWithAuth = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const {
    data: { user },
    error: userError,
  } = await clientWithAuth.auth.getUser();
  if (userError || !user) {
    return { ok: false, status: 401, message: 'Session invalide ou expirée' };
  }

  const server = getSupabaseServer();
  if (!server) {
    return { ok: false, status: 503, message: 'Supabase non configuré' };
  }

  const { data: caller } = await server.from('users').select('role, email').eq('id', user.id).single();
  if (!caller || caller.role !== 'admin' || !isAdminEmail(caller.email)) {
    return { ok: false, status: 403, message: 'Accès réservé aux administrateurs' };
  }

  return { ok: true, userId: user.id };
}
