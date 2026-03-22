import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { User } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function getAuthUserFromBearer(request: NextRequest): Promise<{ user: User; token: string } | null> {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace(/^Bearer\s+/i, '').trim();
  if (!token || !supabaseUrl || !supabaseAnonKey) return null;
  const client = createClient(supabaseUrl, supabaseAnonKey);
  const {
    data: { user },
    error,
  } = await client.auth.getUser(token);
  if (error || !user) return null;
  return { user, token };
}
