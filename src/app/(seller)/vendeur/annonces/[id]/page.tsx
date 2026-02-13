'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { ArrowLeft, Trash2, Upload } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { PageLoader } from '@/components/ui';
import { getListing, updateListing, deleteListing } from '@/lib/supabase/listings';
import { uploadListingPhotos } from '@/lib/supabase/storage';
import { CATEGORIES } from '@/lib/utils';
import { MAX_FILE_SIZE_BYTES } from '@/lib/file-validation';
import { Listing, ListingCategory } from '@/types';

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: 50,
  padding: '0 16px',
  fontSize: 15,
  border: '1px solid #d2d2d7',
  borderRadius: 12,
  boxSizing: 'border-box',
  outline: 'none',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 500,
  marginBottom: 8,
  color: '#333',
};

const selectStyle = (disabled?: boolean): React.CSSProperties => ({
  ...inputStyle,
  paddingRight: 40,
  cursor: disabled ? 'not-allowed' : 'pointer',
  opacity: disabled ? 0.7 : 1,
  appearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2386868b' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 14px center',
});

export default function EditListingPage() {
  const router = useRouter();
  const params = useParams();
  const listingId = params.id as string;
  const { user, seller, isApprovedSeller, loading: authLoading } = useAuth();

  const [listing, setListing] = useState<Listing | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState<ListingCategory | ''>('');
  const [isActive, setIsActive] = useState(true);
  const [newPhotos, setNewPhotos] = useState<File[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [hoveredExistingIndex, setHoveredExistingIndex] = useState<number | null>(null);
  const [hoveredNewIndex, setHoveredNewIndex] = useState<number | null>(null);
  const [newPhotoPreviews, setNewPhotoPreviews] = useState<string[]>([]);

  const totalPhotosCount = existingPhotos.length + newPhotos.length;
  const maxPhotos = 9;
  const maxSize = MAX_FILE_SIZE_BYTES;

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const remaining = maxPhotos - totalPhotosCount;
      const toAdd = acceptedFiles.slice(0, remaining);
      setNewPhotos((prev) => [...prev, ...toAdd]);
    },
    [totalPhotosCount]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'], 'image/webp': ['.webp'] },
    maxFiles: maxPhotos - totalPhotosCount,
    maxSize,
    disabled: totalPhotosCount >= maxPhotos,
  });

  useEffect(() => {
    const urls = newPhotos.map((file) => URL.createObjectURL(file));
    setNewPhotoPreviews(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [newPhotos]);

  const handleRemoveNewPhoto = (index: number) => {
    setNewPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    async function loadListing() {
      try {
        const data = await getListing(listingId);
        if (!data) {
          router.push('/vendeur');
          return;
        }

        // Check ownership
        if (data.sellerId !== user?.uid) {
          router.push('/vendeur');
          return;
        }

        setListing(data);
        setTitle(data.title);
        setDescription(data.description);
        setPrice(data.price.toString());
        setCategory(data.category);
        setIsActive(data.isActive);
        setExistingPhotos(data.photos);
      } catch (error) {
        console.error('Error loading listing:', error);
        router.push('/vendeur');
      } finally {
        setLoading(false);
      }
    }

    if (user && isApprovedSeller) {
      loadListing();
    } else if (!authLoading && !isApprovedSeller) {
      router.push('/vendeur');
    }
  }, [listingId, user, isApprovedSeller, authLoading, router]);

  if (authLoading || loading) {
    return <PageLoader />;
  }

  if (!listing) {
    return null;
  }

  const handleRemoveExistingPhoto = (index: number) => {
    setExistingPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title || !description || !price || !category) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (existingPhotos.length === 0 && newPhotos.length === 0) {
      setError('Veuillez ajouter au moins une photo');
      return;
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      setError('Veuillez entrer un prix valide');
      return;
    }

    setSaving(true);

    try {
      let allPhotos = [...existingPhotos];

      // Upload new photos if any (startIndex = nombre d'existantes pour ne pas les écraser)
      if (newPhotos.length > 0) {
        const newPhotoUrls = await uploadListingPhotos(
          user!.uid,
          listingId,
          newPhotos,
          existingPhotos.length
        );
        allPhotos = [...allPhotos, ...newPhotoUrls];
      }

      // Update listing
      await updateListing(listingId, {
        title,
        description,
        price: priceNum,
        category: category as ListingCategory,
        photos: allPhotos,
        isActive,
      });

      router.push('/vendeur');
    } catch (err: any) {
      console.error('Error updating listing:', err);
      setError('Une erreur est survenue lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteListing(listingId);
      router.push('/vendeur');
    } catch (error) {
      console.error('Error deleting listing:', error);
      setError('Une erreur est survenue lors de la suppression');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <div style={{ paddingTop: 'var(--header-height)', minHeight: '100vh', backgroundColor: '#fbfbfb' }}>
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '0.5cm 24px 80px' }}>
        <Link
          href="/vendeur"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#6e6e73', marginBottom: 20, textDecoration: 'none' }}
          className="hover:opacity-80"
        >
          <ArrowLeft size={18} />
          Retour au tableau de bord
        </Link>

        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <h1
            style={{
              fontFamily: 'var(--font-playfair), Georgia, serif',
              fontSize: 28,
              fontWeight: 500,
              marginBottom: 8,
              color: '#1d1d1f',
              letterSpacing: '-0.02em',
            }}
          >
            Modifier l&apos;annonce
          </h1>
          <p style={{ fontSize: 15, color: '#6e6e73' }}>
            Modifiez les informations de votre annonce
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{ backgroundColor: '#fff', padding: '32px 28px', borderRadius: 18, boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}
        >
          {error && (
            <div style={{ padding: 14, backgroundColor: '#fef2f2', color: '#dc2626', fontSize: 13, marginBottom: 20 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle}>Titre de l&apos;annonce</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Sac Hermès Birkin 35 Noir"
                required
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle}>Description</label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Décrivez votre article en détail..."
                required
                style={{
                  width: '100%',
                  padding: 14,
                  fontSize: 15,
                  lineHeight: 1.5,
                  border: '1px solid #d2d2d7',
                  borderRadius: 12,
                  boxSizing: 'border-box',
                  resize: 'vertical',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 18 }}>
              <div>
                <label style={labelStyle}>Prix (€)</label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="5000"
                  min={0}
                  step="0.01"
                  required
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Catégorie</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ListingCategory)}
                  required
                  style={selectStyle()}
                >
                  <option value="">Sélectionnez une catégorie</option>
                  {CATEGORIES.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle}>Photos</label>
              <p style={{ fontSize: 12, color: '#86868b', marginBottom: 12 }}>
                La première photo sera l&apos;image principale. Insérez ou supprimez des photos.
              </p>

              {totalPhotosCount < maxPhotos && (
                <div
                  {...getRootProps()}
                  style={{
                    border: '1px dashed #d2d2d7',
                    borderRadius: 12,
                    padding: 24,
                    minHeight: 140,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    cursor: totalPhotosCount >= maxPhotos ? 'not-allowed' : 'pointer',
                    backgroundColor: isDragActive ? '#f5f5f7' : 'transparent',
                    borderColor: isDragActive ? '#1d1d1f' : '#d2d2d7',
                    transition: 'background-color 0.2s, border-color 0.2s',
                  }}
                >
                  <input {...getInputProps()} />
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <Upload size={32} style={{ color: '#86868b' }} />
                    <span style={{ fontSize: 14, color: '#6e6e73' }}>
                      {isDragActive ? 'Déposez ici' : 'Glissez-déposez ou cliquez pour insérer une photo'}
                    </span>
                    <span style={{ fontSize: 12, color: '#86868b' }}>
                      Maximum {maxPhotos} photos — {Math.round(maxSize / 1024 / 1024)} Mo max
                    </span>
                  </div>
                </div>
              )}

              {(existingPhotos.length > 0 || newPhotos.length > 0) && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                    gap: 12,
                    marginTop: totalPhotosCount < maxPhotos ? 16 : 0,
                  }}
                >
                  {existingPhotos.map((photo, index) => (
                    <div
                      key={`existing-${index}`}
                      style={{
                        position: 'relative',
                        aspectRatio: 1,
                        borderRadius: 12,
                        overflow: 'hidden',
                        border: '1px solid #e8e8e8',
                        backgroundColor: '#fafafa',
                      }}
                      onMouseEnter={() => setHoveredExistingIndex(index)}
                      onMouseLeave={() => setHoveredExistingIndex(null)}
                    >
                      <img
                        src={photo}
                        alt={`Photo ${index + 1}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveExistingPhoto(index)}
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'rgba(0,0,0,0.6)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          opacity: hoveredExistingIndex === index ? 1 : 0,
                          transition: 'opacity 0.2s',
                          color: '#fff',
                          fontSize: 11,
                          fontWeight: 500,
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        <Trash2 size={22} />
                        <span>Supprimer</span>
                      </button>
                    </div>
                  ))}
                  {newPhotoPreviews.map((url, index) => (
                    <div
                      key={`new-${index}`}
                      style={{
                        position: 'relative',
                        aspectRatio: 1,
                        borderRadius: 12,
                        overflow: 'hidden',
                        border: '1px solid #e8e8e8',
                        backgroundColor: '#fafafa',
                      }}
                      onMouseEnter={() => setHoveredNewIndex(index)}
                      onMouseLeave={() => setHoveredNewIndex(null)}
                    >
                      <img
                        src={url}
                        alt={`Nouvelle photo ${index + 1}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveNewPhoto(index)}
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'rgba(0,0,0,0.6)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          opacity: hoveredNewIndex === index ? 1 : 0,
                          transition: 'opacity 0.2s',
                          color: '#fff',
                          fontSize: 11,
                          fontWeight: 500,
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        <Trash2 size={22} />
                        <span>Supprimer</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                style={{ width: 20, height: 20, accentColor: '#1d1d1f' }}
              />
              <label htmlFor="isActive" style={{ fontSize: 14, color: '#333' }}>
                Annonce active (visible dans le catalogue)
              </label>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <Link href="/vendeur" style={{ flex: 1 }}>
                <button
                  type="button"
                  style={{
                    width: '100%',
                    height: 50,
                    fontSize: 15,
                    fontWeight: 500,
                    border: '1px solid #d2d2d7',
                    borderRadius: 980,
                    cursor: 'pointer',
                    backgroundColor: '#fff',
                    color: '#1d1d1f',
                  }}
                >
                  Annuler
                </button>
              </Link>
              <button
                type="submit"
                disabled={saving}
                style={{
                  flex: 1,
                  height: 50,
                  backgroundColor: '#1d1d1f',
                  color: '#fff',
                  fontSize: 15,
                  fontWeight: 500,
                  border: 'none',
                  borderRadius: 980,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
              </button>
            </div>
          </form>

          <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid #eee', textAlign: 'center' }}>
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              style={{
                fontSize: 14,
                color: '#dc2626',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Trash2 size={16} />
              Supprimer l&apos;annonce
            </button>
          </div>

          {showDeleteModal && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
              <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)' }} onClick={() => setShowDeleteModal(false)} aria-hidden />
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  maxWidth: 340,
                  backgroundColor: '#fff',
                  padding: '24px 20px',
                  borderRadius: 16,
                  boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
                }}
              >
                <h2
                  style={{
                    fontFamily: 'var(--font-playfair), Georgia, serif',
                    fontSize: 22,
                    fontWeight: 500,
                    marginBottom: 10,
                    color: '#1d1d1f',
                    letterSpacing: '-0.02em',
                    textAlign: 'center',
                  }}
                >
                  Supprimer l&apos;annonce
                </h2>
                <p style={{ fontSize: 14, color: '#6e6e73', lineHeight: 1.5, marginBottom: 20, textAlign: 'center' }}>
                  Êtes-vous sûr de vouloir supprimer cette annonce ? Cette action est irréversible.
                </p>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(false)}
                    style={{
                      flex: 1,
                      height: 44,
                      backgroundColor: '#fff',
                      color: '#1d1d1f',
                      fontSize: 14,
                      fontWeight: 500,
                      border: '1.5px solid #d2d2d7',
                      borderRadius: 980,
                      cursor: 'pointer',
                    }}
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    style={{
                      flex: 1,
                      height: 44,
                      backgroundColor: '#dc2626',
                      color: '#fff',
                      fontSize: 14,
                      fontWeight: 500,
                      border: 'none',
                      borderRadius: 980,
                      cursor: deleting ? 'not-allowed' : 'pointer',
                      opacity: deleting ? 0.7 : 1,
                    }}
                  >
                    {deleting ? 'Suppression...' : 'Supprimer'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
