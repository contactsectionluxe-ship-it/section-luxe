'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button, Input, Textarea, Select, FileUpload, PageLoader } from '@/components/ui';
import { createListing } from '@/lib/supabase/listings';
import { uploadListingPhotos } from '@/lib/supabase/storage';
import { CATEGORIES } from '@/lib/utils';
import { ListingCategory } from '@/types';

export default function NewListingPage() {
  const router = useRouter();
  const { user, seller, isApprovedSeller, loading: authLoading } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState<ListingCategory | ''>('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (authLoading) {
    return <PageLoader />;
  }

  if (!isApprovedSeller) {
    router.push('/vendeur');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title || !description || !price || !category) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (photos.length === 0) {
      setError('Veuillez ajouter au moins une photo');
      return;
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      setError('Veuillez entrer un prix valide');
      return;
    }

    setLoading(true);

    try {
      // Generate a temporary listing ID for photos
      const tempListingId = `listing_${Date.now()}`;

      // Upload photos
      const photoUrls = await uploadListingPhotos(user!.uid, tempListingId, photos);

      // Create listing
      await createListing({
        sellerId: user!.uid,
        sellerName: seller!.companyName,
        title,
        description,
        price: priceNum,
        category: category as ListingCategory,
        photos: photoUrls,
      });

      router.push('/vendeur');
    } catch (err: any) {
      console.error('Error creating listing:', err);
      setError('Une erreur est survenue lors de la création de l\'annonce');
    } finally {
      setLoading(false);
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
          <h1 className="font-serif text-3xl">Nouvelle annonce</h1>
          <p className="mt-2 text-[var(--color-gray)]">
            Créez une nouvelle annonce pour votre article de luxe
          </p>
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
            placeholder="Décrivez votre article en détail : état, dimensions, matériaux, authenticité..."
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

          <FileUpload
            label="Photos de l'article"
            accept={{ 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] }}
            maxFiles={10}
            maxSize={10 * 1024 * 1024}
            onFilesChange={setPhotos}
            helperText="Ajoutez jusqu'à 10 photos de votre article. La première photo sera utilisée comme image principale."
          />

          <div className="flex gap-4 pt-4">
            <Link href="/vendeur" className="flex-1">
              <Button type="button" variant="outline" fullWidth>
                Annuler
              </Button>
            </Link>
            <Button type="submit" isLoading={loading} className="flex-1">
              Publier l&apos;annonce
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
