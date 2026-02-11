'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button, Input, Textarea, Select, FileUpload, Modal, PageLoader } from '@/components/ui';
import { getListing, updateListing, deleteListing } from '@/lib/supabase/listings';
import { uploadListingPhotos } from '@/lib/supabase/storage';
import { CATEGORIES } from '@/lib/utils';
import { Listing, ListingCategory } from '@/types';

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

      // Upload new photos if any
      if (newPhotos.length > 0) {
        const newPhotoUrls = await uploadListingPhotos(
          user!.uid,
          listingId,
          newPhotos
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
    <div className="container max-w-2xl py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/vendeur"
            className="inline-flex items-center gap-2 text-sm text-[var(--color-gray)] hover:text-[var(--color-black)] mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour au tableau de bord
          </Link>
          <div className="flex items-center justify-between">
            <h1 className="font-serif text-3xl">Modifier l&apos;annonce</h1>
            <Button
              variant="ghost"
              onClick={() => setShowDeleteModal(true)}
              className="text-[var(--destructive)]"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 text-sm rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Titre de l'annonce"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Sac Hermès Birkin 35 Noir"
            required
          />

          <Textarea
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Décrivez votre article en détail..."
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Prix (€)"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="5000"
              min="0"
              step="0.01"
              required
            />

            <Select
              label="Catégorie"
              value={category}
              onChange={(e) => setCategory(e.target.value as ListingCategory)}
              options={CATEGORIES}
              placeholder="Sélectionnez une catégorie"
              required
            />
          </div>

          {/* Existing Photos */}
          {existingPhotos.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-[var(--color-black)] mb-2">
                Photos existantes
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                {existingPhotos.map((photo, index) => (
                  <div
                    key={index}
                    className="relative group aspect-square rounded-lg overflow-hidden border border-[var(--color-silver)]"
                  >
                    <img
                      src={photo}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveExistingPhoto(index)}
                      className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-6 w-6 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <FileUpload
            label="Ajouter de nouvelles photos"
            accept="image/*"
            multiple
            maxSize={10}
            value={newPhotos}
            onChange={setNewPhotos}
            hint="Ajoutez des photos supplémentaires"
          />

          {/* Active toggle */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-5 h-5 rounded border-[var(--color-silver)]"
            />
            <label htmlFor="isActive" className="text-sm">
              Annonce active (visible dans le catalogue)
            </label>
          </div>

          <div className="flex gap-4 pt-4">
            <Link href="/vendeur" className="flex-1">
              <Button type="button" variant="outline" fullWidth>
                Annuler
              </Button>
            </Link>
            <Button type="submit" isLoading={saving} className="flex-1">
              Enregistrer les modifications
            </Button>
          </div>
        </form>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="Supprimer l'annonce"
          description="Êtes-vous sûr de vouloir supprimer cette annonce ? Cette action est irréversible."
          size="sm"
        >
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              isLoading={deleting}
              className="flex-1"
            >
              Supprimer
            </Button>
          </div>
        </Modal>
      </motion.div>
    </div>
  );
}
