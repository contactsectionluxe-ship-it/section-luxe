'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Package,
  ChevronLeft,
  ChevronRight,
  Info,
  FileText,
  MapPin,
  User,
  Mail,
  Phone,
  X,
  Store,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import {
  deleteVisitorSaleProposal,
  fetchVisitorSaleProposalById,
  saleProposalRowToListing,
  type SaleProposalRow,
} from '@/lib/supabase/saleProposals';
import { getSellerData } from '@/lib/supabase/auth';
import { formatPrice, formatDate } from '@/lib/utils';
import { ListingCharacteristicsProductStyle } from '@/components/listings/ListingCharacteristicsProductStyle';
import { TruncatedInfoValue } from '@/components/TruncatedInfoValue';
import { getListingDisplayTitle } from '@/lib/listingDisplayTitle';
import { sellerCataloguePath } from '@/lib/sellerCatalogueUrl';
import type { Listing } from '@/types';
import type { SaleProposalLocationEntry } from '@/lib/saleProposalLocations';

const CONTENU_INCLUS_LABELS: Record<string, string> = { box: 'Boîte', certificat: 'Certificat', facture: 'Facture' };

export default function SuivreMesOffresDetailPage() {
  const router = useRouter();
  const params = useParams();
  const proposalId = params.proposalId as string;
  const { user, isAuthenticated, isSeller, loading: authLoading } = useAuth();

  const [row, setRow] = useState<SaleProposalRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [showPhotoLightbox, setShowPhotoLightbox] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const lightboxTouchStartX = useRef(0);
  const lightboxSwipedThisGesture = useRef(false);

  const listing: Listing | null = useMemo(() => (row ? saleProposalRowToListing(row) : null), [row]);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !user)) {
      router.replace(`/connexion?redirect=/suivre-mes-offres/${encodeURIComponent(proposalId)}`);
    }
  }, [authLoading, isAuthenticated, user, router, proposalId]);

  useEffect(() => {
    if (!authLoading && isAuthenticated && user && isSeller) {
      router.replace('/vendeur');
    }
  }, [authLoading, isAuthenticated, user, isSeller, router]);

  useEffect(() => {
    if (authLoading || !user || isSeller) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchVisitorSaleProposalById(user.uid, proposalId);
        if (!cancelled) {
          setRow(data);
          setPhotoIndex(0);
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) setRow(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authLoading, user, isSeller, proposalId]);

  const closeDeleteModal = useCallback(() => {
    if (deleting) return;
    setShowDeleteModal(false);
    setDeleteError(null);
  }, [deleting]);

  const handleConfirmDelete = useCallback(async () => {
    if (!user?.uid || !row) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteVisitorSaleProposal(user.uid, row.id);
      router.push('/suivre-mes-offres');
    } catch (e) {
      console.error(e);
      setDeleteError(e instanceof Error ? e.message : 'Impossible de supprimer l’offre.');
    } finally {
      setDeleting(false);
    }
  }, [user?.uid, row, router]);

  useEffect(() => {
    if (!showPhotoLightbox) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowPhotoLightbox(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showPhotoLightbox]);

  if (authLoading || loading) {
    return (
      <div style={{ paddingTop: 'var(--header-height)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#888' }}>Chargement…</p>
      </div>
    );
  }

  if (!isAuthenticated || !user || isSeller) return null;

  if (!row || !listing) {
    return (
      <div style={{ paddingTop: 'var(--header-height)', minHeight: '100vh' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 20px 60px' }}>
          <Link href="/suivre-mes-offres" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#1d1d1f', marginBottom: 24 }}>
            <ArrowLeft size={18} /> Retour à Suivre mes offres
          </Link>
          <p style={{ fontSize: 15, color: '#6e6e73' }}>Offre introuvable ou vous n’y avez plus accès.</p>
        </div>
      </div>
    );
  }

  const p = row;
  const hasPackaging = Array.isArray(listing.packaging) ? listing.packaging : [];
  const packagingTagKeys = hasPackaging.filter((key) => CONTENU_INCLUS_LABELS[key]);
  const locations = (Array.isArray(p.locations) ? p.locations : []) as SaleProposalLocationEntry[];
  const locationLabels = locations.map((l) => l.label).filter(Boolean);
  const buyer = p.buyer_contact;

  return (
    <div style={{ paddingTop: 'var(--header-height)', minHeight: '100vh' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 20px 60px' }}>
        <Link href="/suivre-mes-offres" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#1d1d1f', marginBottom: 24 }}>
          <ArrowLeft size={18} /> Retour à Suivre mes offres
        </Link>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ width: '100%', maxWidth: 480, margin: '0 auto' }}>
            <div
              role={listing.photos.length > 0 ? 'button' : undefined}
              tabIndex={listing.photos.length > 0 ? 0 : undefined}
              onClick={() => listing.photos[photoIndex] && setShowPhotoLightbox(true)}
              onKeyDown={(e) => e.key === 'Enter' && listing.photos[photoIndex] && setShowPhotoLightbox(true)}
              style={{
                position: 'relative',
                aspectRatio: '1',
                backgroundColor: '#f5f5f7',
                borderRadius: 16,
                overflow: 'hidden',
                cursor: listing.photos[photoIndex] ? 'zoom-in' : 'default',
              }}
            >
              {listing.photos.length > 0 ? (
                <img
                  src={listing.photos[photoIndex]}
                  alt={listing.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }}
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
                    onClick={(e) => {
                      e.stopPropagation();
                      setPhotoIndex((i) => (i === 0 ? listing.photos.length - 1 : i - 1));
                    }}
                    aria-label="Photo précédente"
                    style={{
                      position: 'absolute',
                      left: 10,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: 40,
                      height: 40,
                      backgroundColor: 'rgba(255,255,255,0.5)',
                      border: 'none',
                      borderRadius: 10,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPhotoIndex((i) => (i === listing.photos.length - 1 ? 0 : i + 1));
                    }}
                    aria-label="Photo suivante"
                    style={{
                      position: 'absolute',
                      right: 10,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: 40,
                      height: 40,
                      backgroundColor: 'rgba(255,255,255,0.5)',
                      border: 'none',
                      borderRadius: 10,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
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

          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#6e6e73', textTransform: 'uppercase', letterSpacing: 0.4, margin: '0 0 6px' }}>
              Mon offre
            </p>
            <h1 style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: 24, fontWeight: 500, margin: 0, color: '#1d1d1f' }}>
              {listing.title}
            </h1>
            <p style={{ fontSize: 14, color: '#6e6e73', margin: '8px 0 0' }}>
              Prix souhaité : <strong style={{ color: '#1d1d1f', fontWeight: 600 }}>{formatPrice(p.wish_price_cents / 100)}</strong>
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', fontSize: 12, color: '#86868b', marginTop: 8, flexWrap: 'wrap', gap: 8 }}>
              <span>Offre créée le {formatDate(new Date(p.created_at))}</span>
            </div>
          </div>

          {locationLabels.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: '#1d1d1f' }}>
              <MapPin size={18} color="#6e6e73" style={{ flexShrink: 0, marginTop: 2 }} />
              <span>
                <span style={{ color: '#6e6e73' }}>Lieux souhaités : </span>
                {locationLabels.join(' · ')}
              </span>
            </div>
          )}

          {buyer && (
            <div style={{ borderTop: '1px solid #e5e5e7', paddingTop: 20 }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-inter), var(--font-sans)', fontSize: 19, fontWeight: 600, color: '#0a0a0a', margin: '0 0 12px' }}>
                <User size={19} color="#0a0a0a" strokeWidth={2} />
                Votre contact transmis aux vendeurs
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14, color: '#1d1d1f' }}>
                <span>
                  {buyer.firstName} {buyer.lastName}
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <Mail size={16} color="#6e6e73" />
                  {buyer.email}
                </span>
                {buyer.phone?.trim() ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <Phone size={16} color="#6e6e73" />
                    {buyer.phone}
                  </span>
                ) : null}
              </div>
            </div>
          )}

          {p.invites && p.invites.length > 0 && (
            <div style={{ borderTop: '1px solid #e5e5e7', paddingTop: 20 }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-inter), var(--font-sans)', fontSize: 19, fontWeight: 600, color: '#0a0a0a', margin: '0 0 12px' }}>
                <Store size={19} color="#0a0a0a" strokeWidth={2} />
                Vendeurs invités
              </h2>
              <InvitedSellersDetailList invites={p.invites} />
            </div>
          )}

          <div style={{ paddingTop: 4, marginTop: 0 }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, lineHeight: 1, fontFamily: 'var(--font-inter), var(--font-sans)', fontSize: 19, fontWeight: 600, color: '#0a0a0a', margin: 0, marginBottom: 8 }}>
              <Info size={19} color="#0a0a0a" strokeWidth={2} style={{ flexShrink: 0, display: 'block', lineHeight: 1 }} />
              Détails de l’offre
            </h2>
            <div style={{ fontSize: 13, color: '#6e6e73', marginBottom: 20, marginTop: 0, minWidth: 0 }}>
              <TruncatedInfoValue text={getListingDisplayTitle(listing)} fontSize={13} color="#6e6e73" valueTextAlign="left" />
            </div>
            <ListingCharacteristicsProductStyle listing={listing} />
          </div>

          {(listing.description?.trim() || packagingTagKeys.length > 0) && (
            <div style={{ borderTop: '1px solid #e5e5e7', paddingTop: 24 }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, lineHeight: 1, fontFamily: 'var(--font-inter), var(--font-sans)', fontSize: 19, fontWeight: 600, color: '#0a0a0a', margin: 0, marginBottom: 8 }}>
                <FileText size={19} color="#0a0a0a" strokeWidth={2} style={{ flexShrink: 0, display: 'block', lineHeight: 1 }} />
                Description
              </h2>
              {packagingTagKeys.length > 0 && (
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 8,
                    paddingTop: 6,
                    marginBottom: listing.description?.trim() ? 12 : 0,
                    minWidth: 0,
                  }}
                >
                  {packagingTagKeys.map((key) => (
                    <TruncatedInfoValue key={key} text={`${CONTENU_INCLUS_LABELS[key]} : Oui`} fontSize={13} variant="tag" />
                  ))}
                </div>
              )}
              {listing.description?.trim() ? (
                <p style={{ fontSize: 14, color: '#555', lineHeight: 1.7, whiteSpace: 'pre-line', margin: 0 }}>{listing.description}</p>
              ) : null}
            </div>
          )}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, paddingTop: 8 }}>
            <Link
              href={`/proposer-vente?modifier=${encodeURIComponent(p.id)}`}
              style={{
                flex: 1,
                minWidth: 140,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '12px 20px',
                backgroundColor: '#fff',
                color: '#1d1d1f',
                fontSize: 14,
                fontWeight: 500,
                borderRadius: 12,
                border: '1.5px solid #d2d2d7',
                textDecoration: 'none',
              }}
            >
              Modifier
            </Link>
            <button
              type="button"
              disabled={deleting}
              onClick={() => {
                setDeleteError(null);
                setShowDeleteModal(true);
              }}
              style={{
                flex: 1,
                minWidth: 140,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '12px 20px',
                backgroundColor: '#fff',
                color: '#dc2626',
                fontSize: 14,
                fontWeight: 500,
                borderRadius: 12,
                border: '1.5px solid #fecaca',
                cursor: deleting ? 'not-allowed' : 'pointer',
                opacity: deleting ? 0.6 : 1,
              }}
            >
              Supprimer
            </button>
          </div>
        </div>
      </div>

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
            <h2
              style={{
                fontFamily: 'var(--font-inter), var(--font-sans)',
                fontSize: 19,
                fontWeight: 600,
                margin: 0,
                color: '#0a0a0a',
                textAlign: 'center',
                paddingBottom: 16,
                borderBottom: '1px solid #e5e5e7',
              }}
            >
              Supprimer l&apos;offre
            </h2>
            <p style={{ fontSize: 14, color: '#6e6e73', lineHeight: 1.5, marginTop: 16, marginBottom: 20, textAlign: 'center' }}>
              Supprimer cette offre ? Elle disparaîtra pour vous et pour les vendeurs concernés.
            </p>
            {deleteError && <p style={{ fontSize: 13, color: '#dc2626', marginBottom: 16, textAlign: 'center' }}>{deleteError}</p>}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={deleting}
                style={{
                  flex: 1,
                  height: 44,
                  backgroundColor: '#fff',
                  color: '#1d1d1f',
                  fontSize: 14,
                  fontWeight: 500,
                  border: '1.5px solid #d2d2d7',
                  borderRadius: 10,
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  opacity: deleting ? 0.7 : 1,
                }}
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmDelete()}
                disabled={deleting}
                style={{
                  flex: 1,
                  height: 44,
                  backgroundColor: '#dc2626',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 500,
                  border: 'none',
                  borderRadius: 10,
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  opacity: deleting ? 0.7 : 1,
                }}
              >
                {deleting ? 'Suppression…' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showPhotoLightbox && listing.photos[photoIndex] && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Photo agrandie"
          style={{ position: 'fixed', inset: 0, zIndex: 199, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
        >
          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)' }} onClick={() => setShowPhotoLightbox(false)} />
          <button
            type="button"
            onClick={() => setShowPhotoLightbox(false)}
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              zIndex: 1,
              width: 44,
              height: 44,
              borderRadius: '50%',
              border: 'none',
              backgroundColor: 'rgba(255,255,255,0.2)',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Fermer"
          >
            <X size={24} />
          </button>
          {listing.photos.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setPhotoIndex((i) => (i > 0 ? i - 1 : listing.photos.length - 1));
                }}
                style={{
                  position: 'absolute',
                  left: 16,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 1,
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  border: 'none',
                  backgroundColor: 'rgba(255,255,255,0.12)',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                aria-label="Photo précédente"
              >
                <ChevronLeft size={28} />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setPhotoIndex((i) => (i < listing.photos.length - 1 ? i + 1 : 0));
                }}
                style={{
                  position: 'absolute',
                  right: 16,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 1,
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  border: 'none',
                  backgroundColor: 'rgba(255,255,255,0.12)',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                aria-label="Photo suivante"
              >
                <ChevronRight size={28} />
              </button>
            </>
          )}
          <div
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '90vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              touchAction: 'pan-y',
            }}
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => {
              lightboxSwipedThisGesture.current = false;
              lightboxTouchStartX.current = e.touches[0].clientX;
            }}
            onTouchMove={(e) => {
              if (listing.photos.length <= 1 || lightboxSwipedThisGesture.current) return;
              const dx = e.touches[0].clientX - lightboxTouchStartX.current;
              if (Math.abs(dx) > 50) {
                lightboxSwipedThisGesture.current = true;
                if (dx > 0) {
                  setPhotoIndex((i) => (i > 0 ? i - 1 : listing.photos.length - 1));
                } else {
                  setPhotoIndex((i) => (i < listing.photos.length - 1 ? i + 1 : 0));
                }
              }
            }}
          >
            <img
              src={listing.photos[photoIndex]}
              alt={listing.title}
              style={{ maxWidth: '90vw', maxHeight: '90vh', width: 'auto', height: 'auto', objectFit: 'contain', borderRadius: 8 }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function InvitedSellersDetailList({ invites }: { invites: NonNullable<SaleProposalRow['invites']> }) {
  const [rows, setRows] = useState<{ uid: string; companyName: string }[] | null>(null);
  const sellerIdsKey = invites.map((i) => i.seller_id).join('\0');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const loaded = await Promise.all(
        invites.map(async (inv) => {
          const s = await getSellerData(inv.seller_id);
          const name = (s?.companyName || 'Vendeur').trim() || 'Vendeur';
          return { uid: inv.seller_id, companyName: name };
        }),
      );
      if (!cancelled) setRows(loaded);
    })();
    return () => {
      cancelled = true;
    };
  }, [sellerIdsKey, invites]);

  const cardStyle: CSSProperties = {
    border: '1px solid #e5e5e7',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    fontSize: 14,
  };

  if (rows === null) {
    return <p style={{ fontSize: 14, color: '#86868b' }}>Chargement des vendeurs…</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {invites.map((inv) => {
        const seller = rows.find((r) => r.uid === inv.seller_id);
        const name = seller?.companyName ?? 'Vendeur';
        const catalogueHref = sellerCataloguePath(seller ?? { uid: inv.seller_id, companyName: name });
        return (
          <div key={inv.seller_id} style={cardStyle}>
            <Link
              href={catalogueHref}
              style={{ fontWeight: 600, color: '#1d1d1f', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Store size={16} aria-hidden />
              {name}
            </Link>
            {inv.estimated_price_cents != null && (
              <p style={{ margin: '8px 0 0', fontSize: 13, color: '#374151' }}>
                Offre indicative : <strong>{formatPrice(inv.estimated_price_cents / 100)}</strong>
              </p>
            )}
            {inv.seller_note?.trim() ? (
              <p style={{ margin: '6px 0 0', fontSize: 13, color: '#6e6e73', lineHeight: 1.45 }}>{inv.seller_note.trim()}</p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
