'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Heart, MessageCircle, Phone, Package, ChevronLeft, ChevronRight, Trash2, Pencil, Info, Tag, Award, Calendar, CheckCircle, Layers, Palette, Ruler, FileText, Gift } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getListing, deleteListing } from '@/lib/supabase/listings';
import { getConversationsCountForListing } from '@/lib/supabase/messaging';
import { Listing } from '@/types';
import { formatPrice, formatDate, CATEGORIES } from '@/lib/utils';
import { CONDITIONS, COLORS, MATERIALS } from '@/lib/constants';

const CONTENU_INCLUS_LABELS: Record<string, string> = { box: 'Boîte', certificat: 'Certificat', facture: 'Facture' };

export default function VoirAnnoncePage() {
  const router = useRouter();
  const params = useParams();
  const listingId = params.id as string;
  const { user, seller, isApprovedSeller, loading: authLoading } = useAuth();

  const [listing, setListing] = useState<Listing | null>(null);
  const [messagesCount, setMessagesCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || !seller)) {
      router.push('/connexion');
    }
  }, [authLoading, user, seller, router]);

  useEffect(() => {
    async function load() {
      if (!user || !listingId) return;
      try {
        const [data, count] = await Promise.all([
          getListing(listingId),
          getConversationsCountForListing(listingId),
        ]);
        if (data && data.sellerId !== user.uid) {
          router.replace('/vendeur');
          return;
        }
        setListing(data || null);
        setMessagesCount(count);
        setPhotoIndex(0);
      } catch (e) {
        console.error(e);
        router.replace('/vendeur');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user, listingId, router]);

  if (authLoading || loading) {
    return (
      <div style={{ paddingTop: 'var(--header-height)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#888' }}>Chargement...</p>
      </div>
    );
  }

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteListing(listingId);
      router.push('/vendeur');
    } catch (error) {
      console.error('Error deleting listing:', error);
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (!user || !seller || !listing) {
    return null;
  }

  const categoryLabel = CATEGORIES.find((c) => c.value === listing.category)?.label ?? listing.category;
  const conditionLabel = listing.condition ? CONDITIONS.find((c) => c.value === listing.condition)?.label ?? listing.condition : null;
  const colorLabel = listing.color ? (COLORS.find((c) => c.value === listing.color)?.label ?? listing.color) : null;
  const materialLabel = listing.material ? (MATERIALS.find((m) => m.value === listing.material)?.label ?? listing.material) : null;
  const hasPackaging = Array.isArray(listing.packaging) ? listing.packaging : [];

  return (
    <div style={{ paddingTop: 'var(--header-height)', minHeight: '100vh' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 20px 60px' }}>
        <Link
          href="/vendeur"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#1d1d1f', marginBottom: 24 }}
        >
          <ArrowLeft size={18} /> Retour à mes annonces
        </Link>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Photos avec défilement — flèches à l'extérieur */}
          <div style={{ width: '100%', maxWidth: 480, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {listing.photos.length > 1 ? (
                <button
                  type="button"
                  onClick={() => setPhotoIndex((i) => (i === 0 ? listing.photos.length - 1 : i - 1))}
                  aria-label="Photo précédente"
                  style={{
                    width: 44,
                    height: 44,
                    flexShrink: 0,
                    borderRadius: '50%',
                    backgroundColor: '#f5f5f5',
                    border: '1px solid #e0e0e0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <ChevronLeft size={24} color="#1d1d1f" />
                </button>
              ) : null}
              <div style={{ flex: 1, minWidth: 0, aspectRatio: '1', backgroundColor: '#f5f5f7', borderRadius: 16, overflow: 'hidden' }}>
                {listing.photos.length > 0 ? (
                  <img
                    src={listing.photos[photoIndex]}
                    alt={listing.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Package size={64} color="#ccc" />
                  </div>
                )}
              </div>
              {listing.photos.length > 1 ? (
                <button
                  type="button"
                  onClick={() => setPhotoIndex((i) => (i === listing.photos.length - 1 ? 0 : i + 1))}
                  aria-label="Photo suivante"
                  style={{
                    width: 44,
                    height: 44,
                    flexShrink: 0,
                    borderRadius: '50%',
                    backgroundColor: '#f5f5f5',
                    border: '1px solid #e0e0e0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <ChevronRight size={24} color="#1d1d1f" />
                </button>
              ) : null}
            </div>
            {listing.photos.length > 1 && (
              <p style={{ fontSize: 12, color: '#888', textAlign: 'center', marginTop: 8 }}>
                {photoIndex + 1} / {listing.photos.length}
              </p>
            )}
          </div>

          {/* Titre, prix, statut */}
          <div>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <h1 style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: 24, fontWeight: 500, margin: 0, flex: 1, minWidth: 0 }}>
                {listing.title}
              </h1>
              <span
                style={{
                  padding: '6px 12px',
                  backgroundColor: listing.isActive ? '#dcfce7' : '#f5f5f5',
                  color: listing.isActive ? '#166534' : '#666',
                  fontSize: 12,
                  fontWeight: 600,
                  borderRadius: 8,
                  flexShrink: 0,
                }}
              >
                {listing.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p style={{ fontSize: 22, fontWeight: 700, color: '#1d1d1f', margin: '12px 0 0' }}>{formatPrice(listing.price)}</p>
            {listing.listingNumber && (
              <p style={{ fontSize: 13, color: '#6e6e73', margin: '8px 0 0' }}>N° annonce {listing.listingNumber}</p>
            )}
          </div>

          {/* Stats — même design que Mes annonces */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
            <div style={{ padding: 16, border: '1px solid #eee', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, backgroundColor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}>
                <Heart size={22} color="#666" />
              </div>
              <div>
                <p style={{ fontSize: 11, color: '#888' }}>Total likes</p>
                <p style={{ fontSize: 22, fontWeight: 600 }}>{listing.likesCount}</p>
              </div>
            </div>
            <div style={{ padding: 16, border: '1px solid #eee', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, backgroundColor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}>
                <MessageCircle size={22} color="#666" />
              </div>
              <div>
                <p style={{ fontSize: 11, color: '#888' }}>Total messages</p>
                <p style={{ fontSize: 22, fontWeight: 600 }}>{messagesCount}</p>
              </div>
            </div>
            <div style={{ padding: 16, border: '1px solid #eee', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, backgroundColor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}>
                <Phone size={22} color="#666" />
              </div>
              <div>
                <p style={{ fontSize: 11, color: '#888' }}>Total appels</p>
                <p style={{ fontSize: 22, fontWeight: 600 }}>{listing.phoneRevealsCount ?? 0}</p>
              </div>
            </div>
          </div>

          <p style={{ fontSize: 13, color: '#6e6e73', margin: '12px 0 0' }}>Publié le {formatDate(listing.createdAt)}</p>

          {/* Détails de l'annonce — même design titres que page produit Informations */}
          <div style={{ paddingTop: 4, marginTop: 0 }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, lineHeight: 1, fontFamily: 'var(--font-inter), var(--font-sans)', fontSize: 19, fontWeight: 600, color: '#0a0a0a', margin: 0, marginBottom: 8 }}>
              <Info size={19} color="#0a0a0a" strokeWidth={2} style={{ flexShrink: 0, display: 'block', lineHeight: 1 }} />
              Détails de l&apos;annonce
            </h2>
            <p style={{ fontSize: 13, color: '#6e6e73', marginBottom: 20, marginTop: 0 }}>{listing.title}</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 32px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Tag size={18} color="#6e6e73" style={{ flexShrink: 0 }} />
                    <span style={{ color: '#1d1d1f', fontSize: 14 }}>Catégorie</span>
                  </div>
                  <span style={{ fontWeight: 600, color: '#1d1d1f', fontSize: 14 }}>{categoryLabel}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Award size={18} color="#6e6e73" style={{ flexShrink: 0 }} />
                    <span style={{ color: '#1d1d1f', fontSize: 14 }}>Marque</span>
                  </div>
                  <span style={{ fontWeight: 600, color: '#1d1d1f', fontSize: 14 }}>{listing.brand ?? '…'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Package size={18} color="#6e6e73" style={{ flexShrink: 0 }} />
                    <span style={{ color: '#1d1d1f', fontSize: 14 }}>Modèle</span>
                  </div>
                  <span style={{ fontWeight: 600, color: '#1d1d1f', fontSize: 14 }}>{listing.model ?? '…'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Calendar size={18} color="#6e6e73" style={{ flexShrink: 0 }} />
                    <span style={{ color: '#1d1d1f', fontSize: 14 }}>Année</span>
                  </div>
                  <span style={{ fontWeight: 600, color: '#1d1d1f', fontSize: 14 }}>{listing.year != null ? listing.year : '…'}</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <CheckCircle size={18} color="#6e6e73" style={{ flexShrink: 0 }} />
                    <span style={{ color: '#1d1d1f', fontSize: 14 }}>État</span>
                  </div>
                  <span style={{ fontWeight: 600, color: '#1d1d1f', fontSize: 14 }}>{conditionLabel ?? '…'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Layers size={18} color="#6e6e73" style={{ flexShrink: 0 }} />
                    <span style={{ color: '#1d1d1f', fontSize: 14 }}>Matière</span>
                  </div>
                  <span style={{ fontWeight: 600, color: '#1d1d1f', fontSize: 14 }}>{materialLabel ?? '…'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Palette size={18} color="#6e6e73" style={{ flexShrink: 0 }} />
                    <span style={{ color: '#1d1d1f', fontSize: 14 }}>Couleur</span>
                  </div>
                  <span style={{ fontWeight: 600, color: '#1d1d1f', fontSize: 14 }}>{colorLabel ?? '…'}</span>
                </div>
                {(listing.widthCm != null || listing.heightCm != null) && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Ruler size={18} color="#6e6e73" style={{ flexShrink: 0 }} />
                      <span style={{ color: '#1d1d1f', fontSize: 14 }}>Dimensions</span>
                    </div>
                    <span style={{ fontWeight: 600, color: '#1d1d1f', fontSize: 14 }}>
                      L. {listing.widthCm ?? '—'} × H. {listing.heightCm ?? '—'} cm
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {listing.description && (
            <div style={{ borderTop: '1px solid #e5e5e7', paddingTop: 24 }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, lineHeight: 1, fontFamily: 'var(--font-inter), var(--font-sans)', fontSize: 19, fontWeight: 600, color: '#0a0a0a', margin: 0, marginBottom: 8 }}>
                <FileText size={19} color="#0a0a0a" strokeWidth={2} style={{ flexShrink: 0, display: 'block', lineHeight: 1 }} />
                Description
              </h2>
              <p style={{ fontSize: 14, color: '#555', lineHeight: 1.7, whiteSpace: 'pre-line', margin: 0 }}>{listing.description}</p>
            </div>
          )}

          {hasPackaging.length > 0 && (
            <div style={{ borderTop: '1px solid #e5e5e7', paddingTop: 24 }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, lineHeight: 1, fontFamily: 'var(--font-inter), var(--font-sans)', fontSize: 19, fontWeight: 600, color: '#0a0a0a', margin: 0, marginBottom: 8 }}>
                <Gift size={19} color="#0a0a0a" strokeWidth={2} style={{ flexShrink: 0, display: 'block', lineHeight: 1 }} />
                Contenu inclus
              </h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 0 }}>
                {hasPackaging.filter((key) => CONTENU_INCLUS_LABELS[key]).map((key) => (
                  <span
                    key={key}
                    style={{
                      display: 'inline-block',
                      padding: '6px 12px',
                      backgroundColor: '#e8f5e9',
                      fontSize: 13,
                      fontWeight: 500,
                      color: '#2e7d32',
                      borderRadius: 4,
                    }}
                  >
                    {CONTENU_INCLUS_LABELS[key]} : Oui
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          {isApprovedSeller && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, paddingTop: 8 }}>
              <Link
                href={`/vendeur/annonces/${listing.id}`}
                style={{
                  flex: 1,
                  minWidth: 160,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '12px 20px',
                  backgroundColor: '#1d1d1f',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 500,
                  borderRadius: 12,
                }}
              >
                <Pencil size={18} />
                Modifier l&apos;annonce
              </Link>
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                style={{
                  flex: 1,
                  minWidth: 160,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '12px 20px',
                  backgroundColor: 'transparent',
                  color: '#dc2626',
                  fontSize: 14,
                  fontWeight: 500,
                  borderRadius: 12,
                  border: '1px solid #dc2626',
                  cursor: 'pointer',
                }}
              >
                <Trash2 size={18} />
                Supprimer l&apos;annonce
              </button>
            </div>
          )}

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
                <h2 style={{ fontFamily: 'var(--font-inter), var(--font-sans)', fontSize: 19, fontWeight: 600, marginBottom: 10, color: '#0a0a0a', textAlign: 'center' }}>
                  Supprimer l&apos;annonce
                </h2>
                <p style={{ fontSize: 14, color: '#6e6e73', lineHeight: 1.5, marginBottom: 20, textAlign: 'center' }}>
                  Êtes-vous sûr de vouloir supprimer cette annonce ? Cette action est irréversible.
                </p>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(false)}
                    style={{ flex: 1, height: 44, backgroundColor: '#fff', color: '#1d1d1f', fontSize: 14, fontWeight: 500, border: '1.5px solid #d2d2d7', borderRadius: 980, cursor: 'pointer' }}
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    style={{ flex: 1, height: 44, backgroundColor: '#dc2626', color: '#fff', fontSize: 14, fontWeight: 500, border: 'none', borderRadius: 980, cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.7 : 1 }}
                  >
                    {deleting ? 'Suppression...' : 'Supprimer'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
