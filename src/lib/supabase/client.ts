import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Check if Supabase is configured
const envOk =
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://votre-projet.supabase.co' &&
  supabaseAnonKey !== 'votre_anon_key_ici';

let _supabase: SupabaseClient | null = null;
let _isConfigured = false;

if (envOk) {
  try {
    _supabase = createClient(supabaseUrl!, supabaseAnonKey!);
    _isConfigured = true;
  } catch (e) {
    console.warn('Supabase createClient failed:', e);
  }
}

export const isSupabaseConfigured = _isConfigured;
export const supabase = _supabase;

if (!isSupabaseConfigured) {
  console.warn(
    '⚠️ Supabase n\'est pas configuré. Veuillez modifier le fichier .env.local avec vos clés Supabase.\n' +
    'Consultez https://supabase.com pour créer un projet.'
  );
}
