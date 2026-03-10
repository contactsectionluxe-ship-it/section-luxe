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
  const path = `${sellerId}/${listingId}/photo_${index}.${extension}`;

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

// Extensions et types MIME autorisés pour l’upload (JPEG et PNG uniquement, pas de WebP)
const ALLOWED_EXT = ['jpg', 'jpeg', 'png'] as const;
const SAFE_MIME: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png' };

// Upload multiple listing photos (passe par l'API pour contourner la RLS Storage)
// startIndex : lors d'une modification, nombre de photos déjà présentes (évite d'écraser photo_0, photo_1...)
export async function uploadListingPhotos(
  sellerId: string,
  listingId: string,
  files: File[],
  startIndex: number = 0
): Promise<string[]> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase Storage non configuré');
  }
  if (files.length === 0) return [];

  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    const base = typeof window !== 'undefined' ? window.location.origin : '';
    const urls: string[] = [];
    // Une requête par photo pour éviter les erreurs de parsing FormData (multipart) côté serveur
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const rawExt = (file.name.split('.').pop() || 'jpg').replace(/[^a-z0-9]/gi, '').toLowerCase() || 'jpg';
      const ext = ALLOWED_EXT.includes(rawExt as (typeof ALLOWED_EXT)[number]) ? rawExt : 'jpg';
      const safeName = `photo_${startIndex + i}.${ext}`;
      const safeType = SAFE_MIME[ext] || 'image/jpeg';
      const buffer = await file.arrayBuffer();
      const formData = new FormData();
      formData.set('listingId', listingId);
      formData.set('startIndex', String(startIndex + i));
      formData.append('photos', new File([buffer], safeName, { type: safeType }));
      const res = await fetch(`${base}/api/upload-listing-photos`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: formData,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const msg = (body as { error?: string }).error || `Upload échoué (${res.status})`;
        if (res.status === 503 && msg.includes('service role')) {
          throw new Error(
            'Upload des photos impossible : la clé Supabase service role n’est pas configurée. ' +
            'Ajoutez SUPABASE_SERVICE_ROLE_KEY dans .env.local (Supabase → Settings → API → service_role), puis redémarrez le serveur.'
          );
        }
        throw new Error(msg);
      }
      const data = (await res.json()) as { urls: string[] };
      if (data.urls?.[0]) urls.push(data.urls[0]);
    }
    return urls;
  }

  const uploadPromises = files.map((file, index) =>
    uploadListingPhoto(sellerId, listingId, file, startIndex + index)
  );
  return Promise.all(uploadPromises);
}
