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
    listingNumber: row.listing_number ?? null,
    isActive: row.is_active,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    brand: row.brand ?? null,
    model: row.model ?? null,
    condition: row.condition ?? null,
    material: row.material ?? null,
    color: row.color ?? null,
    heightCm: row.height_cm != null ? Number(row.height_cm) : null,
    widthCm: row.width_cm != null ? Number(row.width_cm) : null,
    year: row.year ?? null,
    packaging: row.packaging && Array.isArray(row.packaging) ? row.packaging : null,
    phoneRevealsCount: row.phone_reveals_count != null ? Number(row.phone_reveals_count) : 0,
  };
}

/** Génère le prochain numéro d'annonce (unique à vie, jamais réutilisé). Utilise la séquence Supabase. */
export async function getNextListingNumber(): Promise<string> {
  const client = checkSupabase();
  const { data, error } = await client.rpc('get_next_listing_number', {});
  if (error || data == null) {
    throw new Error(
      error?.message || 'Impossible de générer le numéro d\'annonce. Exécutez la migration supabase/migrations/listings_number_sequence.sql dans le SQL Editor Supabase.'
    );
  }
  return String(data);
}

// Create a new listing
export async function createListing(
  data: Omit<Listing, 'id' | 'likesCount' | 'listingNumber' | 'createdAt' | 'updatedAt'> & { isActive?: boolean }
): Promise<string> {
  const client = checkSupabase();
  const listingNumber = await getNextListingNumber();

  const insertData: Record<string, unknown> = {
    seller_id: data.sellerId,
    seller_name: data.sellerName,
    title: data.title,
    description: data.description,
    price: data.price,
    category: (data.category || '').toLowerCase(),
    photos: data.photos,
    likes_count: 0,
    listing_number: listingNumber,
    is_active: data.isActive !== undefined ? data.isActive : true,
  };
  if (data.brand != null) insertData.brand = data.brand;
  if (data.model != null) insertData.model = data.model;
  if (data.condition != null) insertData.condition = data.condition;
  if (data.material != null) insertData.material = data.material;
  if (data.color != null) insertData.color = data.color;
  if (data.heightCm != null) insertData.height_cm = data.heightCm;
  if (data.widthCm != null) insertData.width_cm = data.widthCm;
  if (data.year != null) insertData.year = data.year;
  if (data.packaging != null && data.packaging.length) insertData.packaging = data.packaging;

  const { data: listing, error } = await client
    .from('listings')
    .insert(insertData)
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
  if (data.category !== undefined) updateData.category = (data.category || '').toLowerCase();
  if (data.photos !== undefined) updateData.photos = data.photos;
  if (data.isActive !== undefined) updateData.is_active = data.isActive;
  if (data.brand !== undefined) updateData.brand = data.brand;
  if (data.model !== undefined) updateData.model = data.model;
  if (data.condition !== undefined) updateData.condition = data.condition;
  if (data.material !== undefined) updateData.material = data.material;
  if (data.color !== undefined) updateData.color = data.color;
  if (data.heightCm !== undefined) updateData.height_cm = data.heightCm;
  if (data.widthCm !== undefined) updateData.width_cm = data.widthCm;
  if (data.year !== undefined) updateData.year = data.year;
  if (data.packaging !== undefined) updateData.packaging = data.packaging;

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
  categories?: string[];
  brand?: string;
  brands?: string[];
  model?: string;
  models?: string[];
  color?: string;
  colors?: string[];
  material?: string;
  materials?: string[];
  condition?: string;
  conditions?: string[];
  sellerId?: string;
  year?: number | null;
  limitCount?: number;
  sortBy?: 'newest' | 'oldest' | 'price_asc' | 'price_desc' | 'likes';
}): Promise<Listing[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  
  const {
    category,
    categories,
    brand,
    brands,
    model,
    models,
    color,
    colors,
    material,
    materials,
    condition,
    conditions,
    sellerId,
    year,
    limitCount = 50,
    sortBy = 'newest',
  } = options || {};

  let query = supabase
    .from('listings')
    .select('*')
    .eq('is_active', true);

  const cats = categories?.length ? categories : (category ? [category] : undefined);
  if (cats?.length) {
    const catsNormalized = cats.map((c) => (c || '').toLowerCase());
    query = query.in('category', catsNormalized);
  }

  const brandList = brands?.length ? brands : (brand ? [brand] : undefined);
  if (brandList?.length) {
    query = query.in('brand', brandList);
  }

  const modelList = models?.length ? models : (model ? [model] : undefined);
  if (modelList?.length) {
    query = query.in('model', modelList);
  }

  const colorList = colors?.length ? colors : (color ? [color] : undefined);
  if (colorList?.length) {
    query = query.in('color', colorList);
  }

  const materialList = materials?.length ? materials : (material ? [material] : undefined);
  if (materialList?.length) {
    query = query.in('material', materialList);
  }

  const conditionList = conditions?.length ? conditions : (condition ? [condition] : undefined);
  if (conditionList?.length) {
    query = query.in('condition', conditionList);
  }

  if (sellerId) {
    query = query.eq('seller_id', sellerId);
  }

  if (year != null) {
    query = query.eq('year', year);
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
  const listings = (data || []).map(rowToListing);
  if (listings.length === 0) return listings;

  const sellerIds = [...new Set(listings.map((l) => l.sellerId))];
  const { data: sellersData } = await supabase.from('sellers').select('id, postcode').in('id', sellerIds);
  const postcodeBySeller: Record<string, string> = {};
  (sellersData || []).forEach((s: { id: string; postcode?: string }) => {
    if (s.postcode) postcodeBySeller[s.id] = s.postcode;
  });
  return listings.map((l) => ({ ...l, sellerPostcode: postcodeBySeller[l.sellerId] ?? null }));
}

/** Liste des marques présentes sur les annonces actives (en stock). */
export async function getDistinctBrands(): Promise<string[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data, error } = await supabase
    .from('listings')
    .select('brand')
    .eq('is_active', true)
    .not('brand', 'is', null);
  if (error) return [];
  const brands = [...new Set((data || []).map((r) => (r.brand as string).trim()).filter(Boolean))];
  return brands.sort((a, b) => a.localeCompare(b, 'fr'));
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

/** Retourne un ID visiteur persistant (localStorage) pour les utilisateurs non connectés. */
function getVisitorId(): string | null {
  if (typeof window === 'undefined') return null;
  const key = 'luxe_visitor_id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID?.() ?? `v-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    localStorage.setItem(key, id);
  }
  return id;
}

/**
 * Incrémente le compteur d'affichage du numéro (clic sur "N° téléphone").
 * Limite : 1 seul comptage par utilisateur (ou visiteur anonyme) par annonce.
 * Pour les visiteurs non connectés, passer visitorId (ex. getVisitorId()).
 */
export async function incrementPhoneReveals(listingId: string, visitorId?: string | null): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  const payload: { p_listing_id: string; p_visitor_id?: string } = { p_listing_id: listingId };
  if (visitorId != null && visitorId !== '') payload.p_visitor_id = visitorId;
  const { error } = await supabase.rpc('increment_phone_reveals', payload);
  if (error) {
    console.error('[incrementPhoneReveals]', error.message, { listingId });
  }
}

export { getVisitorId };

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
