import { supabase, isSupabaseConfigured } from './client';

function checkSupabase() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase Storage non configuré');
  }
  return supabase;
}

// Upload seller document (CNI, KBIS)
export async function uploadSellerDocument(
  sellerId: string,
  file: File,
  documentType: 'idCardFront' | 'idCardBack' | 'kbis'
): Promise<string> {
  const client = checkSupabase();
  const extension = file.name.split('.').pop();
  const path = `sellers/${sellerId}/${documentType}.${extension}`;

  const { error } = await client.storage
    .from('documents')
    .upload(path, file, { upsert: true });

  if (error) throw error;

  const { data } = client.storage
    .from('documents')
    .getPublicUrl(path);

  return data.publicUrl;
}

// Upload listing photo
export async function uploadListingPhoto(
  sellerId: string,
  listingId: string,
  file: File,
  index: number
): Promise<string> {
  const client = checkSupabase();
  const extension = file.name.split('.').pop();
  const path = `listings/${sellerId}/${listingId}/photo_${index}.${extension}`;

  const { error } = await client.storage
    .from('listings')
    .upload(path, file, { upsert: true });

  if (error) throw error;

  const { data } = client.storage
    .from('listings')
    .getPublicUrl(path);

  return data.publicUrl;
}

// Delete listing photo
export async function deleteListingPhoto(photoUrl: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  
  try {
    // Extract path from URL
    const url = new URL(photoUrl);
    const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/listings\/(.+)/);
    if (pathMatch) {
      await supabase.storage.from('listings').remove([pathMatch[1]]);
    }
  } catch (error) {
    console.error('Error deleting photo:', error);
  }
}

// Upload multiple listing photos
export async function uploadListingPhotos(
  sellerId: string,
  listingId: string,
  files: File[]
): Promise<string[]> {
  const uploadPromises = files.map((file, index) =>
    uploadListingPhoto(sellerId, listingId, file, index)
  );

  return Promise.all(uploadPromises);
}
