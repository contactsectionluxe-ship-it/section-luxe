import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from './client';
import { User, Seller } from '@/types';

function checkSupabase(): SupabaseClient {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase n\'est pas configuré. Veuillez configurer .env.local');
  }
  return supabase;
}

// Sign up as a buyer
export async function signUpBuyer(
  email: string,
  password: string,
  displayName: string
): Promise<User> {
  const client = checkSupabase();
  
  const { data: authData, error: authError } = await client.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
        role: 'buyer',
      },
    },
  });

  if (authError) throw authError;
  if (!authData.user) throw new Error('Erreur lors de la création du compte');

  // Create user profile
  const { error: profileError } = await client
    .from('users')
    .insert({
      id: authData.user.id,
      email,
      display_name: displayName,
      role: 'buyer',
    });

  if (profileError) throw profileError;

  return {
    uid: authData.user.id,
    email,
    displayName,
    role: 'buyer',
    createdAt: new Date(),
  };
}

// Sign up as a seller
export async function signUpSeller(
  email: string,
  password: string,
  sellerData: {
    companyName: string;
    siret: string;
    address: string;
    phone: string;
    description: string;
    idCardFrontUrl: string;
    idCardBackUrl: string | null;
    kbisUrl: string;
  }
): Promise<Seller> {
  const client = checkSupabase();
  
  const { data: authData, error: authError } = await client.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: sellerData.companyName,
        role: 'seller',
      },
    },
  });

  if (authError) throw authError;
  if (!authData.user) throw new Error('Erreur lors de la création du compte');

  // Create user profile
  const { error: profileError } = await client
    .from('users')
    .insert({
      id: authData.user.id,
      email,
      display_name: sellerData.companyName,
      role: 'seller',
    });

  if (profileError) throw profileError;

  // Create seller profile
  const { error: sellerError } = await client
    .from('sellers')
    .insert({
      id: authData.user.id,
      email,
      company_name: sellerData.companyName,
      siret: sellerData.siret || null,
      address: sellerData.address,
      phone: sellerData.phone,
      description: sellerData.description,
      status: 'pending',
      id_card_front_url: sellerData.idCardFrontUrl,
      id_card_back_url: sellerData.idCardBackUrl ?? null,
      kbis_url: sellerData.kbisUrl,
    });

  if (sellerError) throw sellerError;

  return {
    uid: authData.user.id,
    email,
    companyName: sellerData.companyName,
    address: sellerData.address,
    phone: sellerData.phone,
    description: sellerData.description,
    status: 'pending',
    idCardFrontUrl: sellerData.idCardFrontUrl,
    idCardBackUrl: sellerData.idCardBackUrl,
    kbisUrl: sellerData.kbisUrl,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

// Sign in
export async function signIn(email: string, password: string) {
  const client = checkSupabase();
  
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data.user;
}

// Sign out
export async function signOut(): Promise<void> {
  const client = checkSupabase();
  const { error } = await client.auth.signOut();
  if (error) throw error;
}

// Get user data
export async function getUserData(uid: string): Promise<User | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', uid)
    .single();

  if (error || !data) return null;

  return {
    uid: data.id,
    email: data.email,
    displayName: data.display_name,
    role: data.role,
    createdAt: new Date(data.created_at),
  };
}

// Get seller data
export async function getSellerData(uid: string): Promise<Seller | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  
  const { data, error } = await supabase
    .from('sellers')
    .select('*')
    .eq('id', uid)
    .single();

  if (error || !data) return null;

  return {
    uid: data.id,
    email: data.email,
    companyName: data.company_name,
    address: data.address,
    phone: data.phone,
    description: data.description,
    status: data.status,
    idCardFrontUrl: data.id_card_front_url,
    idCardBackUrl: data.id_card_back_url,
    kbisUrl: data.kbis_url,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

// Get current session
export async function getSession() {
  if (!isSupabaseConfigured || !supabase) return null;
  
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

// Auth state change listener
export function onAuthChange(callback: (user: any | null) => void) {
  if (!isSupabaseConfigured || !supabase) {
    callback(null);
    return { data: { subscription: { unsubscribe: () => {} } } };
  }
  
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user || null);
  });
}
