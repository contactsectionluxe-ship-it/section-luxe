import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Check if Supabase is configured
export const isSupabaseConfigured = 
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://votre-projet.supabase.co' &&
  supabaseAnonKey !== 'votre_anon_key_ici';

// Create Supabase client (sans typage Database strict pour éviter les erreurs de build)
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null;

if (!isSupabaseConfigured) {
  console.warn(
    '⚠️ Supabase n\'est pas configuré. Veuillez modifier le fichier .env.local avec vos clés Supabase.\n' +
    'Consultez https://supabase.com pour créer un projet.'
  );
}
