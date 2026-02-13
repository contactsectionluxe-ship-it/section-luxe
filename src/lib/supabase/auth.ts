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
    city: string;
    postcode: string;
    phone: string;
    description: string;
    idCardFrontUrl: string;
    idCardBackUrl: string | null;
    kbisUrl: string;
    displayName?: string; // Prénom + Nom pour l'affichage utilisateur
  }
): Promise<Seller> {
  const client = checkSupabase();
  const displayName = (sellerData.displayName || sellerData.companyName).trim() || sellerData.companyName;

  const { data: authData, error: authError } = await client.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
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
      display_name: displayName,
      role: 'seller',
    });

  if (profileError) throw profileError;

  // Create seller profile (city/postcode réactivés après migration sellers_city_postcode.sql)
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
    city: sellerData.city ?? '',
    postcode: sellerData.postcode ?? '',
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
    .maybeSingle();

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
    .maybeSingle();

  if (error) {
    console.warn('getSellerData error:', error);
    return null;
  }
  if (!data) return null;

  const row = data as Record<string, unknown>;
  return {
    uid: data.id,
    email: data.email,
    companyName: data.company_name,
    siret: data.siret || null,
    address: data.address,
    city: (row.city as string) ?? '',
    postcode: (row.postcode as string) ?? '',
    phone: data.phone,
    description: data.description,
    status: data.status,
    idCardFrontUrl: data.id_card_front_url,
    idCardBackUrl: data.id_card_back_url,
    kbisUrl: data.kbis_url,
    avatarUrl: (row.avatar_url as string | null) ?? null,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

// Mise à jour du profil utilisateur (public.users)
export async function updateUserProfile(
  uid: string,
  data: { displayName?: string; email?: string }
): Promise<void> {
  const client = checkSupabase();
  const updateData: Record<string, unknown> = {};
  if (data.displayName !== undefined) updateData.display_name = data.displayName;
  if (data.email !== undefined) updateData.email = data.email;
  if (Object.keys(updateData).length === 0) return;

  const { error } = await client.from('users').update(updateData).eq('id', uid);
  if (error) throw error;
}

// Mise à jour du profil vendeur (sellers) — modifiable par le vendeur
export async function updateSellerProfile(
  uid: string,
  data: { companyName?: string; phone?: string; address?: string; city?: string; postcode?: string; description?: string; avatarUrl?: string | null }
): Promise<void> {
  const client = checkSupabase();
  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (data.companyName !== undefined) updateData.company_name = data.companyName;
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.address !== undefined) updateData.address = data.address;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.avatarUrl !== undefined) (updateData as Record<string, unknown>).avatar_url = data.avatarUrl;
  if (data.city !== undefined) (updateData as Record<string, unknown>).city = data.city;
  if (data.postcode !== undefined) (updateData as Record<string, unknown>).postcode = data.postcode;

  const { error } = await client.from('sellers').update(updateData).eq('id', uid);
  if (error) throw error;
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
