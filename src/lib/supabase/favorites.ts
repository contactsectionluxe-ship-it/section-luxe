import { supabase, isSupabaseConfigured } from './client';
import { Favorite } from '@/types';
import { incrementLikesCount, decrementLikesCount } from './listings';

function checkSupabase() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase non configuré');
  }
  return supabase;
}

// Add to favorites
export async function addFavorite(
  userId: string,
  listingId: string
): Promise<string> {
  const client = checkSupabase();
  
  // Check if already favorited
  const existingFavorite = await getFavorite(userId, listingId);
  if (existingFavorite) {
    return existingFavorite.id;
  }

  const { data, error } = await client
    .from('favorites')
    .insert({
      user_id: userId,
      listing_id: listingId,
    })
    .select()
    .single();

  if (error) throw error;
  
  // Increment likes count on listing
  await incrementLikesCount(listingId);

  return data.id;
}

// Remove from favorites
export async function removeFavorite(
  userId: string,
  listingId: string
): Promise<void> {
  const client = checkSupabase();
  
  const { error } = await client
    .from('favorites')
    .delete()
    .eq('user_id', userId)
    .eq('listing_id', listingId);

  if (error) throw error;
  
  // Decrement likes count on listing
  await decrementLikesCount(listingId);
}

// Check if listing is favorited by user
export async function getFavorite(
  userId: string,
  listingId: string
): Promise<Favorite | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  
  const { data, error } = await supabase
    .from('favorites')
    .select('*')
    .eq('user_id', userId)
    .eq('listing_id', listingId)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    userId: data.user_id,
    listingId: data.listing_id,
    createdAt: new Date(data.created_at),
  };
}

// Get all favorites for a user
export async function getUserFavorites(userId: string): Promise<Favorite[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  
  const { data, error } = await supabase
    .from('favorites')
    .select('*')
    .eq('user_id', userId);

  if (error) throw error;
  
  return (data || []).map((row) => ({
    id: row.id,
    userId: row.user_id,
    listingId: row.listing_id,
    createdAt: new Date(row.created_at),
  }));
}

// Get favorite listing IDs for a user
export async function getUserFavoriteListingIds(userId: string): Promise<string[]> {
  const favorites = await getUserFavorites(userId);
  return favorites.map((f) => f.listingId);
}
