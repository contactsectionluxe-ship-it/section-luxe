'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Heart, MessageCircle, Phone, Package, ChevronLeft, ChevronRight, Trash2, Pencil, Info, Tag, Award, Calendar, CheckCircle, Layers, Palette, Ruler, FileText, Gift, Euro } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getListing, deleteListing, updateListing } from '@/lib/supabase/listings';
import { recordListingDeletion, getSellerDeletionsByReason } from '@/lib/supabase/sales';
import { getConversationsCountForListing } from '@/lib/supabase/messaging';
import { Listing } from '@/types';
import { isSubscriptionLimitError } from '@/lib/subscription';
import { formatPrice, formatDate, CATEGORIES, parsePriceInputToNumber, sanitizePriceInputWhileTyping, formatEurosForPriceInput } from '@/lib/utils';
import { CONDITIONS, COLORS, MATERIALS, CLOTHING_SIZES } from '@/lib/constants';

const CONTENU_INCLUS_LABELS: Record<string, string> = { box: 'Boîte', certificat: 'Certificat', facture: 'Facture' };

const SUPPRESSION_RAISONS = [
  { value: 'vendu', label: 'Article vendu' },
  { value: 'retire', label: 'Article retiré de la vente' },
] as const;

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
  const [deleteModalStep, setDeleteModalStep] = useState<1 | 2>(1);
  const [deleteReason, setDeleteReason] = useState<string>('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteVenduPriceInput, setDeleteVenduPriceInput] = useState('');
  const [showToggleModal, setShowToggleModal] = useState(false);
  const [toggleToActive, setToggleToActive] = useState<boolean | null>(null);
  const [toggling, setToggling] = useState(false);
  const [isReserved, setIsReserved] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || !seller)) {
      router.push('/connexion');
      return;
    }
    if (!authLoading && user && (seller?.status === 'rejected' || seller?.status === 'banned')) {
      router.replace('/profil');
    }
  }, [authLoading, user, seller, router]);

  useEffect(() => {
    async function load() {
      if (!user || !listingId) return;
      try {
        const [data, count, reserveDeletions] = await Promise.all([
          getListing(listingId),
          getConversationsCountForListing(listingId),
          getSellerDeletionsByReason(user.uid, 'reserve'),
        ]);
        if (data && data.sellerId !== user.uid) {
          router.replace('/vendeur');
          return;
        }
        setListing(data || null);
        setMessagesCount(count);
        setPhotoIndex(0);
        setIsReserved(reserveDeletions.some((d) => d.listingId === listingId));
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
    if (!user?.uid) return;
    if (deleteReason === 'vendu') {
      const euros = parsePriceInputToNumber(deleteVenduPriceInput);
      if (euros == null) {
        setDeleteError('Indiquez un prix de vente valide (supérieur à 0).');
        return;
      }
    }
    setDeleting(true);
    setDeleteError(null);
    try {
      let amountCents: number | undefined;
      if (deleteReason === 'vendu') {
        amountCents = Math.round(parsePriceInputToNumber(deleteVenduPriceInput)! * 100);
      }
      const listingTitle = listing?.title;
      try {
        await recordListingDeletion(user.uid, listingId, deleteReason || 'autre', amountCents, listingTitle);
      } catch (recordErr) {
        console.warn('Enregistrement Mes ventes (listing_deletions) ignoré:', recordErr);
      }
      await deleteListing(listingId);
      router.push('/vendeur');
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'annonce:', error);
      setDeleteError('Impossible de supprimer l\'annonce. Réessayez ou contactez le support.');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
      setDeleteModalStep(1);
      setDeleteReason('');
      setDeleteError(null);
      setDeleteVenduPriceInput('');
    }
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteModalStep(1);
    setDeleteReason('');
    setDeleteError(null);
    setDeleteVenduPriceInput('');
  };

  const openToggleModal = (activate: boolean) => {
    setToggleToActive(activate);
    setShowToggleModal(true);
  };

  const closeToggleModal = () => {
    setShowToggleModal(false);
    setToggleToActive(null);
  };

  const handleToggleActive = async () => {
    if (toggleToActive === null || !listingId) return;
    setToggling(true);
    try {
      await updateListing(listingId, { isActive: toggleToActive });
      setListing((prev) => (prev ? { ...prev, isActive: toggleToActive } : null));
      closeToggleModal();
    } catch (e) {
      if (isSubscriptionLimitError(e)) {
        router.push('/vendeur/abonnement?limite=1');
        closeToggleModal();
      } else {
        console.error(e);
      }
    } finally {
      setToggling(false);
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
          {/* Photos avec défilement — flèches sur la photo (même style que page produit) */}
          <div style={{ width: '100%', maxWidth: 480, margin: '0 auto' }}>
            <div style={{ position: 'relative', aspectRatio: '1', backgroundColor: '#f5f5f7', borderRadius: 16, overflow: 'hidden' }}>
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
              {listing.photos.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => setPhotoIndex((i) => (i === 0 ? listing.photos.length - 1 : i - 1))}
                    aria-label="Photo précédente"
                    style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 40, height: 40, backgroundColor: 'rgba(255,255,255,0.5)', border: 'none', borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhotoIndex((i) => (i === listing.photos.length - 1 ? 0 : i + 1))}
                    aria-label="Photo suivante"
                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 40, height: 40, backgroundColor: 'rgba(255,255,255,0.5)', border: 'none', borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}
            </div>
            {listing.photos.length > 1 && (
              <p style={{ fontSize: 12, color: '#888', textAlign: 'center', marginTop: 8 }}>
                {photoIndex + 1} / {listing.photos.length}
              </p>
            )}
          </div>

          {/* Titre, prix, statut */}
          <div>
            <div className="voir-annonce-title-row" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <h1 className="voir-annonce-title" style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: 24, fontWeight: 500, margin: 0, flex: 1, minWidth: 0 }}>
                {listing.title}
              </h1>
              <div className="voir-annonce-toggle-buttons" style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                {isApprovedSeller && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        if (!listing.isActive && isReserved) {
                          router.push(`/vendeur/ventes?reserve=${listingId}`);
                        } else {
                          openToggleModal(true);
                        }
                      }}
                      disabled={listing.isActive}
                      style={{
                        padding: '6px 14px',
                        fontSize: 12,
                        fontWeight: 600,
                        borderRadius: 8,
                        minWidth: 96,
                        border: listing.isActive ? '1px solid #166534' : '1px solid #d2d2d7',
                        backgroundColor: listing.isActive ? '#dcfce7' : '#fff',
                        color: listing.isActive ? '#166534' : '#1d1d1f',
                        cursor: listing.isActive ? 'default' : 'pointer',
                      }}
                    >
                      Active
                    </button>
                    <button
                      type="button"
                      onClick={() => openToggleModal(false)}
                      disabled={!listing.isActive}
                      style={{
                        padding: '6px 14px',
                        fontSize: 12,
                        fontWeight: 600,
                        borderRadius: 8,
                        minWidth: 96,
                        border: !listing.isActive ? '1px solid #dc2626' : '1px solid #d2d2d7',
                        backgroundColor: !listing.isActive ? 'transparent' : '#fff',
                        color: !listing.isActive ? '#dc2626' : '#1d1d1f',
                        cursor: !listing.isActive && !isReserved ? 'default' : 'pointer',
                      }}
                    >
                      Inactive
                    </button>
                  </>
                )}
              </div>
            </div>
            <p style={{ fontSize: 22, fontWeight: 700, color: '#1d1d1f', margin: '12px 0 0' }}>{formatPrice(listing.price)}</p>
            <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', fontSize: 12, color: '#86868b', marginTop: 8 }}>
              <span>N° annonce {listing.listingNumber || listing.id}</span>
              <span style={{ margin: '0 10px' }}>|</span>
              <span>Publié le {formatDate(listing.createdAt)}</span>
            </div>
          </div>

          {/* Stats — même design que Mes annonces */}
          <div className="voir-annonce-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
            <div style={{ padding: 16, border: '1px solid #eee', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, backgroundColor: '#f5f5f7', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}>
                <Heart size={22} color="#6e6e73" />
              </div>
              <div>
                <p style={{ fontSize: 11, color: '#888' }}><span className="voir-annonce-stat-desktop">Total likes</span><span className="voir-annonce-stat-mobile">Likes</span></p>
                <p style={{ fontSize: 22, fontWeight: 600 }}>{listing.likesCount}</p>
              </div>
            </div>
            <div style={{ padding: 16, border: '1px solid #eee', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, backgroundColor: '#f5f5f7', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}>
                <MessageCircle size={22} color="#6e6e73" />
              </div>
              <div>
                <p style={{ fontSize: 11, color: '#888' }}><span className="voir-annonce-stat-desktop">Total messages</span><span className="voir-annonce-stat-mobile">Messages</span></p>
                <p style={{ fontSize: 22, fontWeight: 600 }}>{messagesCount}</p>
              </div>
            </div>
            <div style={{ padding: 16, border: '1px solid #eee', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, backgroundColor: '#f5f5f7', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}>
                <Phone size={22} color="#6e6e73" />
              </div>
              <div>
                <p style={{ fontSize: 11, color: '#888' }}><span className="voir-annonce-stat-desktop">Total appels</span><span className="voir-annonce-stat-mobile">Appels</span></p>
                <p style={{ fontSize: 22, fontWeight: 600 }}>{listing.phoneRevealsCount ?? 0}</p>
              </div>
            </div>
          </div>

          {/* Détails de l'annonce — même design titres que page produit Informations */}
          <div style={{ paddingTop: 4, marginTop: 0 }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, lineHeight: 1, fontFamily: 'var(--font-inter), var(--font-sans)', fontSize: 19, fontWeight: 600, color: '#0a0a0a', margin: 0, marginBottom: 8 }}>
              <Info size={19} color="#0a0a0a" strokeWidth={2} style={{ flexShrink: 0, display: 'block', lineHeight: 1 }} />
              Détails de l&apos;annonce
            </h2>
            <p style={{ fontSize: 13, color: '#6e6e73', marginBottom: 20, marginTop: 0 }}>{listing.title}</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 32px', minWidth: 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    <Tag size={18} color="#6e6e73" style={{ flexShrink: 0 }} />
                    <span style={{ color: '#1d1d1f', fontSize: 14 }}>Catégorie</span>
                  </div>
                  <span title={categoryLabel} style={{ fontWeight: 600, color: '#1d1d1f', fontSize: 14, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{categoryLabel}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    <Award size={18} color="#6e6e73" style={{ flexShrink: 0 }} />
                    <span style={{ color: '#1d1d1f', fontSize: 14 }}>Marque</span>
                  </div>
                  <span title={listing.brand ?? ''} style={{ fontWeight: 600, color: '#1d1d1f', fontSize: 14, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{listing.brand ?? '…'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    <Package size={18} color="#6e6e73" style={{ flexShrink: 0 }} />
                    <span style={{ color: '#1d1d1f', fontSize: 14 }}>Modèle</span>
                  </div>
                  <span title={listing.model ?? ''} style={{ fontWeight: 600, color: '#1d1d1f', fontSize: 14, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{listing.model ?? '…'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    <Calendar size={18} color="#6e6e73" style={{ flexShrink: 0 }} />
                    <span style={{ color: '#1d1d1f', fontSize: 14 }}>Année</span>
                  </div>
                  <span title={listing.year != null ? String(listing.year) : ''} style={{ fontWeight: 600, color: '#1d1d1f', fontSize: 14, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{listing.year != null ? listing.year : '…'}</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    <CheckCircle size={18} color="#6e6e73" style={{ flexShrink: 0 }} />
                    <span style={{ color: '#1d1d1f', fontSize: 14 }}>État</span>
                  </div>
                  <span title={conditionLabel ?? ''} style={{ fontWeight: 600, color: '#1d1d1f', fontSize: 14, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{conditionLabel ?? '…'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    <Layers size={18} color="#6e6e73" style={{ flexShrink: 0 }} />
                    <span style={{ color: '#1d1d1f', fontSize: 14 }}>Matière</span>
                  </div>
                  <span title={materialLabel ?? ''} style={{ fontWeight: 600, color: '#1d1d1f', fontSize: 14, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{materialLabel ?? '…'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    <Palette size={18} color="#6e6e73" style={{ flexShrink: 0 }} />
                    <span style={{ color: '#1d1d1f', fontSize: 14 }}>Couleur</span>
                  </div>
                  <span title={colorLabel ?? ''} style={{ fontWeight: 600, color: '#1d1d1f', fontSize: 14, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{colorLabel ?? '…'}</span>
                </div>
                {listing.size && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                      <Package size={18} color="#6e6e73" style={{ flexShrink: 0 }} />
                      <span style={{ color: '#1d1d1f', fontSize: 14 }}>{listing.category === 'chaussures' ? 'Pointure' : 'Taille'}</span>
                    </div>
                    <span title={listing.size} style={{ fontWeight: 600, color: '#1d1d1f', fontSize: 14, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{(listing.category === 'chaussures' || (listing.category === 'vetements' && listing.size != null && !CLOTHING_SIZES.includes(listing.size as (typeof CLOTHING_SIZES)[number]))) ? `${listing.size} EU` : listing.size}</span>
                  </div>
                )}
{(listing.category !== 'chaussures' && listing.category !== 'vetements' && (listing.widthCm != null || listing.heightCm != null)) && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                        <Ruler size={18} color="#6e6e73" style={{ flexShrink: 0 }} />
                        <span style={{ color: '#1d1d1f', fontSize: 14 }}>{listing.category === 'montres' ? 'Dimension' : 'Dimensions'}</span>
                      </div>
                    <span title={listing.category === 'montres' ? `${Math.round((listing.widthCm ?? listing.heightCm ?? 0) * 10)} mm` : `L. ${listing.widthCm ?? '—'} × H. ${listing.heightCm ?? '—'} cm`} style={{ fontWeight: 600, color: '#1d1d1f', fontSize: 14, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {listing.category === 'montres'
                        ? `${Math.round((listing.widthCm ?? listing.heightCm ?? 0) * 10)} mm`
                        : `L. ${listing.widthCm ?? '—'} × H. ${listing.heightCm ?? '—'} cm`}
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
                Contenu inclus :
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
                className="voir-annonce-btn-modifier"
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
                <span className="voir-annonce-btn-label-desktop">Modifier l&apos;annonce</span>
                <span className="voir-annonce-btn-label-mobile">Modifier</span>
              </Link>
              <button
                type="button"
                onClick={() => { setShowDeleteModal(true); setDeleteModalStep(1); setDeleteReason(''); setDeleteError(null); setDeleteVenduPriceInput(''); }}
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
                <span className="voir-annonce-btn-label-desktop">Supprimer l&apos;annonce</span>
                <span className="voir-annonce-btn-label-mobile">Supprimer</span>
              </button>
            </div>
          )}

          {showDeleteModal && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
              <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)' }} onClick={closeDeleteModal} aria-hidden />
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  maxWidth: 410,
                  backgroundColor: '#fff',
                  padding: '24px 20px',
                  borderRadius: 16,
                  boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <h2 style={{ fontFamily: 'var(--font-inter), var(--font-sans)', fontSize: 19, fontWeight: 600, margin: 0, color: '#0a0a0a', textAlign: 'center', paddingBottom: 16, borderBottom: '1px solid #e5e5e7' }}>
                  Supprimer l&apos;annonce
                </h2>
                {deleteModalStep === 1 ? (
                  <>
                    <p style={{ fontSize: 14, color: '#1d1d1f', fontWeight: 500, marginTop: 16, marginBottom: 10 }}>
                      Pour quelle raison souhaitez-vous retirer cette annonce ?
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                      {SUPPRESSION_RAISONS.map((r) => (
                        <label
                          key={r.value}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '10px 12px',
                            borderRadius: 10,
                            border: `1.5px solid ${deleteReason === r.value ? '#1d1d1f' : '#e5e5e7'}`,
                            backgroundColor: deleteReason === r.value ? '#f5f5f7' : '#fff',
                            cursor: 'pointer',
                            fontSize: 14,
                            color: '#1d1d1f',
                          }}
                        >
                          <input
                            type="radio"
                            name="deleteReason"
                            value={r.value}
                            checked={deleteReason === r.value}
                            onChange={() => setDeleteReason(r.value)}
                            style={{ width: 18, height: 18, accentColor: '#1d1d1f' }}
                          />
                          {r.label}
                        </label>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button
                        type="button"
                        onClick={closeDeleteModal}
                        style={{ flex: 1, height: 44, backgroundColor: '#fff', color: '#1d1d1f', fontSize: 14, fontWeight: 500, border: '1.5px solid #d2d2d7', borderRadius: 980, cursor: 'pointer' }}
                      >
                        Annuler
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (deleteReason === 'vendu' && listing?.price != null && Number.isFinite(Number(listing.price))) {
                            setDeleteVenduPriceInput(formatEurosForPriceInput(Number(listing.price)));
                          } else if (deleteReason === 'vendu') {
                            setDeleteVenduPriceInput('');
                          } else {
                            setDeleteVenduPriceInput('');
                          }
                          setDeleteModalStep(2);
                        }}
                        disabled={!deleteReason}
                        style={{ flex: 1, height: 44, backgroundColor: '#1d1d1f', color: '#fff', fontSize: 14, fontWeight: 500, border: 'none', borderRadius: 980, cursor: !deleteReason ? 'not-allowed' : 'pointer', opacity: !deleteReason ? 0.7 : 1 }}
                      >
                        Suivant
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p style={{ fontSize: 14, color: '#6e6e73', lineHeight: 1.5, marginTop: 16, marginBottom: deleteReason === 'vendu' ? 12 : 20, textAlign: 'center' }}>
                      Êtes-vous sûr de vouloir supprimer cette annonce ? Cette action est irréversible.
                    </p>
                    {deleteReason === 'vendu' && (
                      <div style={{ marginBottom: 16 }}>
                        <label htmlFor="voir-delete-vendu-price" style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 8, color: '#333' }}>
                          Prix de vente
                        </label>
                        <div style={{ position: 'relative', maxWidth: 220, width: '100%' }}>
                          <input
                            id="voir-delete-vendu-price"
                            type="text"
                            inputMode="decimal"
                            autoComplete="off"
                            value={deleteVenduPriceInput}
                            onChange={(e) => setDeleteVenduPriceInput(sanitizePriceInputWhileTyping(e.target.value))}
                            placeholder="0,00"
                            style={{
                              width: '100%',
                              height: 50,
                              padding: '0 16px',
                              paddingRight: 44,
                              fontSize: 15,
                              border: '1px solid #d2d2d7',
                              borderRadius: 12,
                              boxSizing: 'border-box',
                              outline: 'none',
                              backgroundColor: '#fff',
                            }}
                          />
                          <span
                            style={{
                              position: 'absolute',
                              right: 14,
                              top: '50%',
                              transform: 'translateY(-50%)',
                              pointerEvents: 'none',
                              color: '#86868b',
                              display: 'flex',
                              alignItems: 'center',
                            }}
                            aria-hidden
                          >
                            <Euro size={17} strokeWidth={2} />
                          </span>
                        </div>
                      </div>
                    )}
                    {deleteError && (
                      <p style={{ fontSize: 13, color: '#dc2626', marginBottom: 16, textAlign: 'center' }}>{deleteError}</p>
                    )}
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button
                        type="button"
                        onClick={() => setDeleteModalStep(1)}
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
                  </>
                )}
              </div>
            </div>
          )}

          {showToggleModal && toggleToActive !== null && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
              <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)' }} onClick={closeToggleModal} aria-hidden />
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  maxWidth: 380,
                  backgroundColor: '#fff',
                  padding: '24px 20px',
                  borderRadius: 16,
                  boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
                }}
              >
                <h2 style={{ fontFamily: 'var(--font-inter), var(--font-sans)', fontSize: 19, fontWeight: 600, marginBottom: 12, color: '#0a0a0a', textAlign: 'center' }}>
                  {toggleToActive ? 'Activer l\'annonce' : 'Désactiver l\'annonce'}
                </h2>
                <p style={{ fontSize: 14, color: '#6e6e73', lineHeight: 1.5, marginBottom: 20, textAlign: 'center' }}>
                  {toggleToActive
                    ? 'Voulez-vous activer cette annonce ? Elle sera à nouveau visible dans le catalogue.'
                    : 'Voulez-vous désactiver cette annonce ? Elle ne sera plus visible dans le catalogue.'}
                </p>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    onClick={closeToggleModal}
                    style={{ flex: 1, height: 44, backgroundColor: '#fff', color: '#1d1d1f', fontSize: 14, fontWeight: 500, border: '1.5px solid #d2d2d7', borderRadius: 980, cursor: 'pointer' }}
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={handleToggleActive}
                    disabled={toggling}
                    style={{ flex: 1, height: 44, backgroundColor: '#1d1d1f', color: '#fff', fontSize: 14, fontWeight: 500, border: 'none', borderRadius: 980, cursor: toggling ? 'not-allowed' : 'pointer', opacity: toggling ? 0.7 : 1 }}
                  >
                    {toggling ? 'Enregistrement...' : toggleToActive ? 'Activer' : 'Désactiver'}
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
