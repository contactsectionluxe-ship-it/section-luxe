import { supabase, isSupabaseConfigured } from './client';
import { Seller, SellerStatus } from '@/types';

function checkSupabase() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase non configuré');
  }
  return supabase;
}

function rowToSeller(row: any): Seller {
  return {
    uid: row.id,
    email: row.email,
    companyName: row.company_name,
    siret: row.siret || null,
    address: row.address,
    city: row.city ?? '',
    postcode: row.postcode ?? '',
    phone: row.phone,
    description: row.description,
    status: row.status,
    idCardFrontUrl: row.id_card_front_url,
    idCardBackUrl: row.id_card_back_url,
    idRectoType: row.id_recto_type === 'passeport' || row.id_recto_type === 'cni_recto' ? row.id_recto_type : null,
    kbisUrl: row.kbis_url,
    avatarUrl: row.avatar_url ?? null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

// Get all seller applications (avec display_name depuis users pour prénom/nom)
export async function getAllSellers(): Promise<Seller[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  
  const { data, error } = await supabase
    .from('sellers')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  const sellers = (data || []).map(rowToSeller);
  if (sellers.length === 0) return sellers;

  const { data: usersData } = await supabase
    .from('users')
    .select('id, display_name')
    .in('id', sellers.map((s) => s.uid));

  const displayNameByUid: Record<string, string> = {};
  (usersData || []).forEach((u: { id: string; display_name?: string }) => {
    if (u.display_name) displayNameByUid[u.id] = u.display_name;
  });

  return sellers.map((s) => ({ ...s, displayName: displayNameByUid[s.uid] ?? null }));
}

// Get one seller by id (avec display_name depuis users)
export async function getSellerById(uid: string): Promise<Seller | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data: row, error } = await supabase
    .from('sellers')
    .select('*')
    .eq('id', uid)
    .single();
  if (error || !row) return null;
  const seller = rowToSeller(row);
  const { data: userRow } = await supabase
    .from('users')
    .select('display_name')
    .eq('id', uid)
    .single();
  return { ...seller, displayName: (userRow as { display_name?: string } | null)?.display_name ?? null };
}

// Get sellers by status
export async function getSellersByStatus(status: SellerStatus): Promise<Seller[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  
  const { data, error } = await supabase
    .from('sellers')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(rowToSeller);
}

// Get pending seller applications
export async function getPendingSellers(): Promise<Seller[]> {
  return getSellersByStatus('pending');
}

// Update seller status
export async function updateSellerStatus(
  sellerId: string,
  status: SellerStatus
): Promise<void> {
  const client = checkSupabase();
  
  const { error } = await client
    .from('sellers')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', sellerId);

  if (error) throw error;
}

// Approve seller
export async function approveSeller(sellerId: string): Promise<void> {
  await updateSellerStatus(sellerId, 'approved');
}

// Reject seller
export async function rejectSeller(sellerId: string): Promise<void> {
  await updateSellerStatus(sellerId, 'rejected');
}

// Get seller statistics
export async function getSellerStats(): Promise<{
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}> {
  const sellers = await getAllSellers();
  
  return {
    total: sellers.length,
    pending: sellers.filter((s) => s.status === 'pending').length,
    approved: sellers.filter((s) => s.status === 'approved').length,
    rejected: sellers.filter((s) => s.status === 'rejected').length,
  };
}
