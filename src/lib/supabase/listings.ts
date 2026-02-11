import { supabase, isSupabaseConfigured } from './client';
import { Listing, ListingCategory } from '@/types';

function checkSupabase() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase non configuré');
  }
  return supabase;
}

function rowToListing(row: any): Listing {
  return {
    id: row.id,
    sellerId: row.seller_id,
    sellerName: row.seller_name,
    title: row.title,
    description: row.description,
    price: row.price,
    category: row.category,
    photos: row.photos || [],
    likesCount: row.likes_count || 0,
    isActive: row.is_active,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

// Create a new listing
export async function createListing(
  data: Omit<Listing, 'id' | 'likesCount' | 'isActive' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const client = checkSupabase();
  
  const { data: listing, error } = await client
    .from('listings')
    .insert({
      seller_id: data.sellerId,
      seller_name: data.sellerName,
      title: data.title,
      description: data.description,
      price: data.price,
      category: data.category,
      photos: data.photos,
      likes_count: 0,
      is_active: true,
    })
    .select()
    .single();

  if (error) throw error;
  return listing.id;
}

// Update a listing
export async function updateListing(
  listingId: string,
  data: Partial<Omit<Listing, 'id' | 'sellerId' | 'createdAt'>>
): Promise<void> {
  const client = checkSupabase();
  
  const updateData: any = { updated_at: new Date().toISOString() };
  
  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.price !== undefined) updateData.price = data.price;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.photos !== undefined) updateData.photos = data.photos;
  if (data.isActive !== undefined) updateData.is_active = data.isActive;

  const { error } = await client
    .from('listings')
    .update(updateData)
    .eq('id', listingId);

  if (error) throw error;
}

// Delete a listing
export async function deleteListing(listingId: string): Promise<void> {
  const client = checkSupabase();
  
  const { error } = await client
    .from('listings')
    .delete()
    .eq('id', listingId);

  if (error) throw error;
}

// Get a single listing
export async function getListing(listingId: string): Promise<Listing | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .eq('id', listingId)
    .single();

  if (error || !data) return null;
  return rowToListing(data);
}

// Get all active listings with optional filters
export async function getListings(options?: {
  category?: string;
  sellerId?: string;
  limitCount?: number;
  sortBy?: 'newest' | 'oldest' | 'price_asc' | 'price_desc' | 'likes';
}): Promise<Listing[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  
  const {
    category,
    sellerId,
    limitCount = 50,
    sortBy = 'newest',
  } = options || {};

  let query = supabase
    .from('listings')
    .select('*')
    .eq('is_active', true);

  if (category) {
    query = query.eq('category', category);
  }

  if (sellerId) {
    query = query.eq('seller_id', sellerId);
  }

  // Apply sorting
  switch (sortBy) {
    case 'oldest':
      query = query.order('created_at', { ascending: true });
      break;
    case 'price_asc':
      query = query.order('price', { ascending: true });
      break;
    case 'price_desc':
      query = query.order('price', { ascending: false });
      break;
    case 'likes':
      query = query.order('likes_count', { ascending: false });
      break;
    case 'newest':
    default:
      query = query.order('created_at', { ascending: false });
      break;
  }

  query = query.limit(limitCount);

  const { data, error } = await query;

  if (error) throw error;
  return (data || []).map(rowToListing);
}

// Get listings by seller
export async function getSellerListings(sellerId: string): Promise<Listing[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(rowToListing);
}

// Increment likes count
export async function incrementLikesCount(listingId: string): Promise<void> {
  const client = checkSupabase();
  
  const { error } = await client.rpc('increment_likes', { listing_id: listingId });
  
  // Fallback if RPC doesn't exist
  if (error) {
    const { data } = await client
      .from('listings')
      .select('likes_count')
      .eq('id', listingId)
      .single();
    
    if (data) {
      await client
        .from('listings')
        .update({ likes_count: (data.likes_count || 0) + 1 })
        .eq('id', listingId);
    }
  }
}

// Decrement likes count
export async function decrementLikesCount(listingId: string): Promise<void> {
  const client = checkSupabase();
  
  const { error } = await client.rpc('decrement_likes', { listing_id: listingId });
  
  // Fallback if RPC doesn't exist
  if (error) {
    const { data } = await client
      .from('listings')
      .select('likes_count')
      .eq('id', listingId)
      .single();
    
    if (data) {
      await client
        .from('listings')
        .update({ likes_count: Math.max(0, (data.likes_count || 0) - 1) })
        .eq('id', listingId);
    }
  }
}

// Get featured listings (most liked)
export async function getFeaturedListings(limitCount = 8): Promise<Listing[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .eq('is_active', true)
    .order('likes_count', { ascending: false })
    .limit(limitCount);

  if (error) throw error;
  return (data || []).map(rowToListing);
}
