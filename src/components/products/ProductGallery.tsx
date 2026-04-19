'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ListingPhoto, LISTING_PHOTO_QUALITY_SHARP } from '@/components/ListingPhoto';

interface ProductGalleryProps {
  photos: string[];
  title: string;
}

export function ProductGallery({ photos, title }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);

  const handlePrevious = () => {
    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
  };

  if (photos.length === 0) {
    return (
      <div className="aspect-square bg-[var(--color-cream)] rounded-xl flex items-center justify-center">
        <p className="text-[var(--color-gray)]">Pas d&apos;image disponible</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Main Image */}
        <div
          className="relative aspect-square bg-[var(--color-cream)] rounded-xl overflow-hidden cursor-zoom-in group"
          onClick={() => setShowLightbox(true)}
        >
          <ListingPhoto
            src={photos[selectedIndex]}
            alt={`${title} - Image ${selectedIndex + 1}`}
            sizes="(max-width: 1023px) 100vw, 560px"
            quality={LISTING_PHOTO_QUALITY_SHARP}
          />

          {/* Zoom indicator */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors">
            <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>

          {/* Navigation arrows */}
          {photos.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevious();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-md hover:bg-white transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-md hover:bg-white transition-colors"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
        </div>

        {/* Thumbnails */}
        {photos.length > 1 && (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {photos.map((photo, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setSelectedIndex(index)}
                className={cn(
                  'relative flex-shrink-0 h-20 w-20 overflow-hidden rounded-lg border-2 transition-all',
                  selectedIndex === index
                    ? 'border-[var(--color-black)]'
                    : 'border-transparent hover:border-[var(--color-silver)]'
                )}
              >
                <ListingPhoto
                  src={photo}
                  alt={`${title} - Miniature ${index + 1}`}
                  sizes="80px"
                  quality={LISTING_PHOTO_QUALITY_SHARP}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {showLightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex items-center justify-center"
          >
            {/* Close button */}
            <button
              onClick={() => setShowLightbox(false)}
              className="absolute top-4 right-4 p-2 text-white/80 hover:text-white transition-colors z-10"
            >
              <X className="h-8 w-8" />
            </button>

            {/* Image counter */}
            <div className="absolute top-4 left-4 text-white/80 text-sm">
              {selectedIndex + 1} / {photos.length}
            </div>

            {/* Main image */}
            <motion.div
              key={selectedIndex}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative flex h-[min(90vh,1200px)] w-[min(90vw,1600px)] max-h-full max-w-full items-center justify-center"
            >
              {photos[selectedIndex].includes('supabase.co') ? (
                <Image
                  src={photos[selectedIndex]}
                  alt={`${title} - Image ${selectedIndex + 1}`}
                  fill
                  sizes="(max-width: 1023px) 90vw, min(90vw, 1600px)"
                  quality={100}
                  className="object-contain p-4"
                  style={{ objectFit: 'contain' }}
                  priority
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photos[selectedIndex]}
                  alt={`${title} - Image ${selectedIndex + 1}`}
                  className="max-h-full max-w-full object-contain p-4"
                  style={{ width: 'auto', height: 'auto', maxWidth: '100%', maxHeight: '100%' }}
                />
              )}
            </motion.div>

            {/* Navigation */}
            {photos.length > 1 && (
              <>
                <button
                  onClick={handlePrevious}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 text-white/80 hover:text-white transition-colors"
                >
                  <ChevronLeft className="h-10 w-10" />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 text-white/80 hover:text-white transition-colors"
                >
                  <ChevronRight className="h-10 w-10" />
                </button>
              </>
            )}

            {/* Thumbnails */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {photos.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedIndex(index)}
                  className={cn(
                    'w-2 h-2 rounded-full transition-all',
                    selectedIndex === index
                      ? 'bg-white w-6'
                      : 'bg-white/50 hover:bg-white/80'
                  )}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
