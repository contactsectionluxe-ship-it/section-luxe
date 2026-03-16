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
    suspendedUntil: row.suspended_until ? new Date(row.suspended_until) : null,
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

// Approve seller (réactive aussi si suspendu : efface suspended_until)
export async function approveSeller(sellerId: string): Promise<void> {
  const client = checkSupabase();
  const { error } = await client
    .from('sellers')
    .update({
      status: 'approved',
      suspended_until: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sellerId);
  if (error) throw error;
}

// Reject seller : statut rejected + remettre le rôle utilisateur en buyer (compte visiteur)
export async function rejectSeller(sellerId: string): Promise<void> {
  const client = checkSupabase();
  await updateSellerStatus(sellerId, 'rejected');
  const { error } = await client
    .from('users')
    .update({ role: 'buyer' })
    .eq('id', sellerId);
  if (error) throw error;
}

// Suspend seller : ne peut plus déposer d'annonces pendant X jours (annonces existantes conservées)
export async function suspendSeller(sellerId: string, days: number): Promise<void> {
  const client = checkSupabase();
  const until = new Date();
  until.setDate(until.getDate() + days);
  const payloadWithUntil = {
    status: 'suspended',
    suspended_until: until.toISOString(),
    updated_at: new Date().toISOString(),
  };
  const { error } = await client
    .from('sellers')
    .update(payloadWithUntil)
    .eq('id', sellerId);
  if (error) {
    const msg = error?.message ?? '';
    const columnMissing = /suspended_until|schema cache|column.*does not exist/i.test(msg);
    if (columnMissing) {
      const { error: err2 } = await client
        .from('sellers')
        .update({
          status: 'suspended',
          updated_at: new Date().toISOString(),
        })
        .eq('id', sellerId);
      if (err2) {
        throw new Error(err2.message || 'Erreur lors de la suspension');
      }
      return;
    }
    throw new Error(msg || 'Erreur lors de la suspension');
  }
}

// Ban seller : redevient visiteur + annonces désactivées (appel API côté serveur pour bypass RLS)
export async function banSeller(sellerId: string): Promise<void> {
  const { getSession } = await import('@/lib/supabase/auth');
  const session = await getSession();
  if (!session?.access_token) throw new Error('Session expirée');
  const res = await fetch('/api/admin/ban-seller', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ sellerId }),
    credentials: 'same-origin',
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error || `Erreur ${res.status}`);
  }
}

// Unban seller : réactive le compte (statut approved, rôle seller). Les annonces restent désactivées.
export async function unbanSeller(sellerId: string): Promise<void> {
  const { getSession } = await import('@/lib/supabase/auth');
  const session = await getSession();
  if (!session?.access_token) throw new Error('Session expirée');
  const res = await fetch('/api/admin/unban-seller', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ sellerId }),
    credentials: 'same-origin',
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error || `Erreur ${res.status}`);
  }
}

// Get seller statistics
export async function getSellerStats(): Promise<{
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  suspended: number;
  banned: number;
}> {
  const sellers = await getAllSellers();

  return {
    total: sellers.length,
    pending: sellers.filter((s) => s.status === 'pending').length,
    approved: sellers.filter((s) => s.status === 'approved').length,
    rejected: sellers.filter((s) => s.status === 'rejected').length,
    suspended: sellers.filter((s) => s.status === 'suspended').length,
    banned: sellers.filter((s) => s.status === 'banned').length,
  };
}
