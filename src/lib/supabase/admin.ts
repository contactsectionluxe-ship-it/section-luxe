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
    address: row.address,
    phone: row.phone,
    description: row.description,
    status: row.status,
    idCardFrontUrl: row.id_card_front_url,
    idCardBackUrl: row.id_card_back_url,
    kbisUrl: row.kbis_url,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

// Get all seller applications
export async function getAllSellers(): Promise<Seller[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  
  const { data, error } = await supabase
    .from('sellers')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(rowToSeller);
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
