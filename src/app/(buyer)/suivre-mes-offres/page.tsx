'use client';

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Package, Search, ChevronDown, X, Calendar, SquarePen } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useMatchMaxWidth } from '@/hooks/useMatchMaxWidth';
import {
  deleteVisitorSaleProposal,
  fetchVisitorSaleProposals,
  saleProposalRowToListing,
  type SaleProposalRow,
} from '@/lib/supabase/saleProposals';
import { getSellerData } from '@/lib/supabase/auth';
import { formatPrice, formatDateShort } from '@/lib/utils';
import { CatalogueCardPhotos } from '@/components/CatalogueCardPhotos';
import {
  ListingCaracteristiques,
  LISTING_CARACTERISTIQUES_COMPACT_TEXT_STYLE,
} from '@/components/ListingCaracteristiques';
import { sellerCataloguePath } from '@/lib/sellerCatalogueUrl';
import { SaleProposalGridDescriptionAccordion } from '@/components/sale-proposals/SaleProposalGridDescriptionAccordion';

/** Même carte que le catalogue (vue grille), alignée sur `catalogue/page.tsx`. */
const CATALOGUE_GRID_CARD_SHADOW = '0 4px 24px rgba(0,0,0,0.06)';
const CATALOGUE_GRID_CARD_RADIUS = 18;

const SORT_OPTIONS = [
  { value: 'recent' as const, label: 'Plus récents' },
  { value: 'oldest' as const, label: 'Plus anciens' },
];

/** Boutons modifier / supprimer sur la photo (même idée que le cœur favori en grille catalogue). */
const SUIVRE_OFFRES_GRID_PHOTO_ACTION_WRAP: CSSProperties = {
  position: 'absolute',
  top: 8,
  right: 8,
  zIndex: 1,
  display: 'flex',
  alignItems: 'center',
  gap: 6,
};

const SUIVRE_OFFRES_GRID_PHOTO_ACTION_BTN: CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: '50%',
  backgroundColor: 'rgba(255,255,255,0.95)',
  border: '1px solid rgba(0,0,0,0.06)',
  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
  cursor: 'pointer',
  textDecoration: 'none',
  color: '#6e6e73',
  flexShrink: 0,
  boxSizing: 'border-box',
};

/** Même objet que le texte des pastilles `homeFeatured` (Neuf, Taille L…). */
const SUIVRE_OFFRES_GRID_CARAC_TYPO = LISTING_CARACTERISTIQUES_COMPACT_TEXT_STYLE;
const SUIVRE_OFFRES_GRID_CARAC_ICON_SIZE = 13.5;
const SUIVRE_OFFRES_GRID_CARAC_ICON_COLOR = '#6e6e73';

/** Comme `<h3 className="listing-grid-title" style={{ fontSize: 16, … }}>` en grille catalogue (`catalogue/page.tsx`). */
const SUIVRE_OFFRES_GRID_CATALOGUE_LISTING_TITLE_TYPO: CSSProperties = {
  fontSize: 16,
  fontWeight: 500,
  color: '#1d1d1f',
  lineHeight: 1.3,
};

/** Libellé « Prix souhaité » : même corps que le titre, Playfair explicite (les `<span>` n’ont pas la règle globale `h3`). */
const SUIVRE_OFFRES_GRID_PRIX_SOUHAITE_LABEL_TYPO: CSSProperties = {
  ...SUIVRE_OFFRES_GRID_CATALOGUE_LISTING_TITLE_TYPO,
  fontFamily: 'var(--font-playfair), var(--font-serif)',
};

/** Proche du prix grille catalogue, un peu plus petit que les 18px du catalogue. */
const SUIVRE_OFFRES_GRID_CATALOGUE_PRICE_TYPO: CSSProperties = {
  fontFamily: 'var(--font-inter), var(--font-sans)',
  fontSize: 16,
  fontWeight: 600,
  color: '#1d1d1f',
  lineHeight: 1.3,
};

export default function SuivreMesOffresPage() {
  const router = useRouter();
  const { user, isAuthenticated, isSeller, loading: authLoading } = useAuth();
  const [rows, setRows] = useState<SaleProposalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'oldest'>('recent');
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
  const [proposalToDeleteId, setProposalToDeleteId] = useState<string | null>(null);
  const [deleteProposalError, setDeleteProposalError] = useState<string | null>(null);
  const [deletingProposal, setDeletingProposal] = useState(false);
  const isNarrowViewport = useMatchMaxWidth(767);

  useEffect(() => {
    if (authLoading || !isAuthenticated || !user) return;
    if (isSeller) {
      router.replace('/vendeur');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchVisitorSaleProposals(user.uid);
        if (!cancelled) {
          setRows(data);
          setLoadError(null);
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Impossible de charger vos offres.';
        const isKnownConfigMessage =
          message.includes('Les tables des propositions de vente ne sont pas installées') ||
          message.includes('Récursion infinie des politiques RLS');
        if (!isKnownConfigMessage) {
          console.error(e);
        }
        if (!cancelled) {
          setRows([]);
          setLoadError(message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authLoading, isAuthenticated, isSeller, user, router]);

  useEffect(() => {
    if (!sortOpen) return;
    const onDown = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [sortOpen]);

  const filteredSorted = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = q ? rows.filter((r) => (r.title || '').toLowerCase().includes(q)) : [...rows];
    list.sort((a, b) => {
      const ta = new Date(a.created_at).getTime();
      const tb = new Date(b.created_at).getTime();
      return sortBy === 'recent' ? tb - ta : ta - tb;
    });
    return list;
  }, [rows, searchQuery, sortBy]);

  const openProposalDeleteModal = (proposalId: string) => {
    setProposalToDeleteId(proposalId);
    setDeleteProposalError(null);
  };

  const closeProposalDeleteModal = () => {
    if (deletingProposal) return;
    setProposalToDeleteId(null);
    setDeleteProposalError(null);
  };

  const handleConfirmDeleteProposal = async () => {
    if (!user?.uid || !proposalToDeleteId) return;
    setDeletingProposal(true);
    setDeleteProposalError(null);
    try {
      await deleteVisitorSaleProposal(user.uid, proposalToDeleteId);
      setRows((prev) => prev.filter((x) => x.id !== proposalToDeleteId));
      setProposalToDeleteId(null);
    } catch (e) {
      console.error(e);
      setDeleteProposalError(e instanceof Error ? e.message : 'Impossible de supprimer l’offre. Réessayez ou contactez le support.');
    } finally {
      setDeletingProposal(false);
    }
  };

  if (authLoading) {
    return (
      <div style={{ paddingTop: 'var(--header-height)', minHeight: '100vh' }}>
        <div className="mes-annonces-page-inner" style={{ maxWidth: 1100, margin: '0 auto', padding: '30px 24px 60px' }}>
          <div
            className="catalogue-results catalogue-results-grid suivre-mes-offres-catalogue-grid"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, minWidth: 0, alignItems: 'start' }}
          >
            {Array.from({ length: 6 }, (_, i) => (
              <article
                key={i}
                className="catalogue-skeleton-card"
                style={{
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  backgroundColor: '#fff',
                  borderRadius: CATALOGUE_GRID_CARD_RADIUS,
                  overflow: 'hidden',
                  boxShadow: CATALOGUE_GRID_CARD_SHADOW,
                  minWidth: 0,
                  ['--skeleton-index' as string]: i,
                }}
              >
                <div className="catalogue-skeleton" style={{ width: '100%', aspectRatio: '1' }} />
                <div
                  style={{
                    borderTop: '1px solid #e8e6e3',
                    padding: '14px 14px 10px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    minHeight: 'calc(112px + 2mm)',
                    backgroundColor: '#fff',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, height: 12 }}>
                    <div className="catalogue-skeleton" style={{ height: 12, width: '50%' }} />
                    <div className="catalogue-skeleton" style={{ height: 12, width: 60, flexShrink: 0 }} />
                  </div>
                  <div className="catalogue-skeleton" style={{ height: 16, width: '92%' }} />
                  <div style={{ display: 'flex', gap: '6px 12px', flexWrap: 'wrap', marginBottom: 5 }}>
                    <div className="catalogue-skeleton" style={{ height: 13, width: 60 }} />
                    <div className="catalogue-skeleton" style={{ height: 13, width: 70 }} />
                    <div className="catalogue-skeleton" style={{ height: 13, width: 55 }} />
                  </div>
                  <div style={{ marginTop: -5, minHeight: 24, display: 'flex', alignItems: 'center' }}>
                    <div className="catalogue-skeleton" style={{ height: 18, width: '38%' }} />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    router.replace('/connexion?redirect=/suivre-mes-offres');
    return null;
  }
  if (isSeller) return null;

  return (
    <div className="suivre-mes-offres-page" style={{ paddingTop: 'var(--header-height)', minHeight: '100vh' }}>
      <div className="mes-annonces-page-inner" style={{ maxWidth: 1100, margin: '0 auto', padding: '30px 24px 60px' }}>
        <div className="mes-annonces-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
          <div className="mes-annonces-title-block" style={{ flex: '1 1 auto', minWidth: 0 }}>
            <div className="mes-annonces-title-text-stack" style={{ flex: '1 1 auto', minWidth: 0 }}>
              <h1 style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: 28, fontWeight: 500, margin: '0 0 8px' }}>Suivre mes offres</h1>
              <p style={{ fontSize: 14, color: '#666', margin: 0, lineHeight: 1.45 }}>
                Suivez vos propositions de mise en vente
              </p>
            </div>
          </div>
          <div className="mes-annonces-header-actions" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 10 }}>
            <Link
              href="/proposer-vente"
              className="mes-annonces-deposer-link"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 20px',
                backgroundColor: '#000',
                color: '#fff',
                fontSize: 14,
                fontWeight: 500,
                borderRadius: 12,
                textDecoration: 'none',
              }}
            >
              <Package size={18} /> Proposer une pièce
            </Link>
          </div>
        </div>

        {loadError && (
          <div
            role="alert"
            style={{
              padding: 14,
              backgroundColor: '#fef2f2',
              color: '#991b1b',
              fontSize: 14,
              lineHeight: 1.5,
              borderRadius: 12,
              marginBottom: 20,
              border: '1px solid #fecaca',
            }}
          >
            {loadError}
          </div>
        )}

        {!loadError && !loading && (
          <div className="mes-annonces-search-row" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div className="mes-annonces-search-input-wrap" style={{ flex: 1, position: 'relative', minWidth: 0 }}>
              <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#86868b', pointerEvents: 'none' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher dans mes offres…"
                autoComplete="off"
                style={{
                  width: '100%',
                  height: 48,
                  padding: '0 16px 0 44px',
                  fontSize: 14,
                  border: '1px solid #d2d2d7',
                  borderRadius: 12,
                  backgroundColor: '#fff',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div className="mes-annonces-sort-dropdown" ref={sortRef} style={{ position: 'relative', flexShrink: 0 }}>
              <button
                type="button"
                onClick={() => setSortOpen((v) => !v)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  height: 48,
                  padding: '0 14px 0 16px',
                  border: '1px solid #d2d2d7',
                  borderRadius: 12,
                  backgroundColor: '#fff',
                  fontSize: 14,
                  color: '#1d1d1f',
                  cursor: 'pointer',
                  outline: 'none',
                  minWidth: 160,
                }}
              >
                <span style={{ flex: 1, textAlign: 'left' }}>{SORT_OPTIONS.find((o) => o.value === sortBy)?.label ?? 'Trier'}</span>
                <ChevronDown size={16} style={{ color: '#86868b', flexShrink: 0 }} />
              </button>
              {sortOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: 4,
                    backgroundColor: '#fff',
                    border: '1px solid #d2d2d7',
                    borderRadius: 12,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    zIndex: 9999,
                    overflow: 'hidden',
                  }}
                >
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setSortBy(opt.value);
                        setSortOpen(false);
                      }}
                      style={{
                        display: 'block',
                        width: '100%',
                        padding: '12px 16px',
                        border: 'none',
                        background: sortBy === opt.value ? '#f5f5f7' : '#fff',
                        fontSize: 14,
                        textAlign: 'left',
                        cursor: 'pointer',
                        color: '#1d1d1f',
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {loadError ? null : loading ? null : rows.length === 0 ? (
          <div style={{ padding: 60, border: '1px solid #eee', textAlign: 'center', borderRadius: 12 }}>
            <Package size={48} color="#ccc" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: 16, fontWeight: 500, margin: 0 }}>Aucune proposition</h3>
          </div>
        ) : filteredSorted.length === 0 ? (
          <div style={{ padding: 60, border: '1px solid #eee', textAlign: 'center', borderRadius: 12 }}>
            <p style={{ fontSize: 15, color: '#6e6e73' }}>Aucun résultat pour « {searchQuery.trim()} »</p>
          </div>
        ) : (
          <div
            className="catalogue-results catalogue-results-grid suivre-mes-offres-catalogue-grid"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, minWidth: 0, alignItems: 'start' }}
          >
            {filteredSorted.map((r) => {
              return (
                <article
                  key={r.id}
                  className="mes-annonces-card suivre-mes-offres-grid-card"
                  style={{
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: '#fff',
                    borderRadius: CATALOGUE_GRID_CARD_RADIUS,
                    overflow: 'hidden',
                    boxShadow: CATALOGUE_GRID_CARD_SHADOW,
                    minWidth: 0,
                  }}
                >
                  <div style={{ position: 'relative', width: '100%', aspectRatio: '1', backgroundColor: '#fff', overflow: 'hidden' }}>
                    <div style={SUIVRE_OFFRES_GRID_PHOTO_ACTION_WRAP}>
                      <Link
                        href={`/proposer-vente?modifier=${encodeURIComponent(r.id)}`}
                        onClick={(e) => e.stopPropagation()}
                        aria-label="Modifier l'offre"
                        style={SUIVRE_OFFRES_GRID_PHOTO_ACTION_BTN}
                      >
                        <SquarePen size={15} strokeWidth={2} aria-hidden />
                      </Link>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          openProposalDeleteModal(r.id);
                        }}
                        disabled={deletingProposal && proposalToDeleteId === r.id}
                        aria-label="Supprimer l'offre"
                        style={{
                          ...SUIVRE_OFFRES_GRID_PHOTO_ACTION_BTN,
                          cursor: deletingProposal && proposalToDeleteId === r.id ? 'not-allowed' : 'pointer',
                          opacity: deletingProposal && proposalToDeleteId === r.id ? 0.7 : 1,
                          border: '1px solid rgba(0,0,0,0.06)',
                        }}
                      >
                        <X size={15} strokeWidth={2} aria-hidden />
                      </button>
                    </div>
                    {r.photo_urls?.length ? (
                      <CatalogueCardPhotos
                        photos={r.photo_urls}
                        alt={r.title || ''}
                        sizes="(max-width: 768px) 50vw, (max-width: 1400px) 33vw, min(440px, 28vw)"
                      />
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: '#f5f5f7',
                        }}
                      >
                        <Package size={40} color="#ccc" strokeWidth={1.25} />
                      </div>
                    )}
                  </div>
                  <div
                    style={{
                      borderTop: '1px solid #e8e6e3',
                      padding: '14px 14px 10px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                      minWidth: 0,
                      backgroundColor: '#fff',
                      flex: 1,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, minWidth: 0 }}>
                      <h3
                        className="listing-grid-title"
                        title={r.title || ''}
                        style={{
                          ...SUIVRE_OFFRES_GRID_CATALOGUE_LISTING_TITLE_TYPO,
                          margin: 0,
                          minWidth: 0,
                          flex: '1 1 auto',
                          overflow: 'hidden',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {r.title}
                      </h3>
                    </div>
                    <ListingCaracteristiques
                      listing={saleProposalRowToListing(r)}
                      variant="homeFeatured"
                      className="catalogue-listing-caracteristiques"
                      allowMultiLineWrap={isNarrowViewport}
                    />
                    <div
                      className="sale-proposal-grid-price-date"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 10,
                        marginTop: -5,
                        minWidth: 0,
                      }}
                    >
                      <div
                        className="listing-grid-price suivre-mes-offres-grid-wish"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          minWidth: 0,
                          flex: '1 1 auto',
                        }}
                      >
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            whiteSpace: 'nowrap',
                            minWidth: 0,
                          }}
                        >
                          <span style={SUIVRE_OFFRES_GRID_PRIX_SOUHAITE_LABEL_TYPO}>Prix souhaité</span>
                          <span
                            style={{
                              ...SUIVRE_OFFRES_GRID_CATALOGUE_PRICE_TYPO,
                              transform: 'translateY(0.2mm)',
                            }}
                          >
                            {formatPrice(r.wish_price_cents / 100)}
                          </span>
                        </span>
                      </div>
                      <span
                        className="suivre-mes-offres-grid-meta-date"
                        style={{
                          ...SUIVRE_OFFRES_GRID_CARAC_TYPO,
                          lineHeight: 1.3,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          flexShrink: 0,
                          justifyContent: 'flex-end',
                          whiteSpace: 'nowrap',
                          transform: 'translateY(0.55mm)',
                        }}
                      >
                        <Calendar
                          size={SUIVRE_OFFRES_GRID_CARAC_ICON_SIZE}
                          color={SUIVRE_OFFRES_GRID_CARAC_ICON_COLOR}
                          style={{ flexShrink: 0, display: 'block', transform: 'translateY(-0.2mm)' }}
                          aria-hidden
                        />
                        {formatDateShort(new Date(r.created_at))}
                      </span>
                    </div>
                    <SaleProposalGridDescriptionAccordion
                      proposalId={r.id}
                      description={r.description}
                      packaging={r.packaging}
                    />
                    <div
                      className="suivre-mes-offres-vendeurs-grid-zone"
                      style={{
                        flex: 1,
                        minHeight: 0,
                        width: '100%',
                        borderTop: '1px solid #f0f0f0',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'stretch',
                        justifyContent: 'center',
                        padding: '8px 0 max(0px, calc(3px - 1.5mm))',
                        marginBottom: 'min(0px, calc(3px - 1.5mm))',
                        boxSizing: 'border-box',
                      }}
                    >
                      {r.invites && r.invites.length > 0 ? (
                        <InvitedSellersCatalogueLine invites={r.invites} />
                      ) : (
                        <span style={{ fontSize: 12, color: '#86868b', lineHeight: 1.25, textAlign: 'left' }}>
                          Aucun vendeur invité pour le moment
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {proposalToDeleteId && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)' }} onClick={closeProposalDeleteModal} aria-hidden />
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
            {deleteProposalError && (
              <p style={{ fontSize: 13, color: '#dc2626', marginBottom: 16, textAlign: 'center' }}>{deleteProposalError}</p>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={closeProposalDeleteModal}
                disabled={deletingProposal}
                style={{
                  flex: 1,
                  height: 44,
                  backgroundColor: '#fff',
                  color: '#1d1d1f',
                  fontSize: 14,
                  fontWeight: 500,
                  border: '1.5px solid #d2d2d7',
                  borderRadius: 10,
                  cursor: deletingProposal ? 'not-allowed' : 'pointer',
                  opacity: deletingProposal ? 0.7 : 1,
                }}
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmDeleteProposal()}
                disabled={deletingProposal}
                style={{
                  flex: 1,
                  height: 44,
                  backgroundColor: '#dc2626',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 500,
                  border: 'none',
                  borderRadius: 10,
                  cursor: deletingProposal ? 'not-allowed' : 'pointer',
                  opacity: deletingProposal ? 0.7 : 1,
                }}
              >
                {deletingProposal ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Noms des vendeurs invités ; retour à la ligne si besoin ; chaque nom lien vers le catalogue du vendeur. */
function InvitedSellersCatalogueLine({ invites }: { invites: NonNullable<SaleProposalRow['invites']> }) {
  const [sellers, setSellers] = useState<{ uid: string; companyName: string }[] | null>(null);
  const sellerIdsKey = invites.map((i) => i.seller_id).join('\0');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const rows = await Promise.all(
        invites.map(async (inv) => {
          const s = await getSellerData(inv.seller_id);
          const name = (s?.companyName || 'Vendeur').trim() || 'Vendeur';
          return { uid: inv.seller_id, companyName: name };
        })
      );
      if (!cancelled) setSellers(rows);
    })();
    return () => {
      cancelled = true;
    };
  }, [sellerIdsKey, invites]);

  const vendeursOuterStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    width: '100%',
    minWidth: 0,
    overflow: 'visible',
    /* Même base que <p className="listing-grid-vendeur" style={{ fontSize: 12, … }}> (catalogue grille) ; mobile 11px via globals */
    fontSize: 12,
    fontWeight: 400,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: '#86868b',
    lineHeight: 1.35,
  };

  const vendeursNamesStyle: CSSProperties = {
    flex: '1 1 auto',
    minWidth: 0,
    width: '100%',
    maxWidth: '100%',
    overflow: 'visible',
    whiteSpace: 'normal',
    wordBreak: 'break-word',
    overflowWrap: 'anywhere',
    textAlign: 'left',
    lineHeight: 1.35,
  };

  if (sellers === null) {
    return (
      <div className="suivre-mes-offres-vendeurs-outer listing-grid-vendeur" style={vendeursOuterStyle}>
        <span className="catalogue-listing-vendeur-nom-row suivre-mes-offres-vendeurs-ligne listing-grid-vendeur-nom" style={vendeursNamesStyle}>
          …
        </span>
      </div>
    );
  }

  const fullVendorsTitle = sellers.map((s) => s.companyName.toUpperCase()).join(' ; ');

  return (
    <div className="suivre-mes-offres-vendeurs-outer listing-grid-vendeur" style={vendeursOuterStyle} title={fullVendorsTitle}>
      <span className="catalogue-listing-vendeur-nom-row suivre-mes-offres-vendeurs-ligne listing-grid-vendeur-nom" style={vendeursNamesStyle}>
        {sellers.map((seller, i) => (
          <span key={seller.uid}>
            {i > 0 ? <span aria-hidden> ; </span> : null}
            <Link
              href={sellerCataloguePath(seller)}
              className="catalogue-listing-vendeur-nom suivre-mes-offres-seller-link"
              title={`Voir les annonces de ${seller.companyName}`}
              style={{
                display: 'inline',
                whiteSpace: 'normal',
                wordBreak: 'break-word',
                overflowWrap: 'anywhere',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                color: 'inherit',
                textDecoration: 'none',
                fontWeight: 400,
              }}
            >
              {seller.companyName.toUpperCase()}
            </Link>
          </span>
        ))}
      </span>
    </div>
  );
}
