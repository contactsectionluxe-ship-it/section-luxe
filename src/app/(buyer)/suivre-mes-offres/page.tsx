'use client';

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Package, Search, ChevronDown, X, Calendar, SquarePen, Store } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import {
  deleteVisitorSaleProposal,
  fetchVisitorSaleProposals,
  saleProposalRowToListing,
  type SaleProposalRow,
} from '@/lib/supabase/saleProposals';
import { getSellerData } from '@/lib/supabase/auth';
import { formatPrice, formatDate } from '@/lib/utils';
import { CatalogueCardPhotos } from '@/components/CatalogueCardPhotos';
import { ListingCaracteristiques } from '@/components/ListingCaracteristiques';
import { ProposalDescriptionInfo } from '@/components/ProposalDescriptionInfo';
import { sellerCataloguePath } from '@/lib/sellerCatalogueUrl';

/** Même carte que le catalogue (vue liste). */
const CATALOGUE_LINE_CARD_SHADOW = '0 4px 24px rgba(0,0,0,0.06)';
const CATALOGUE_LINE_CARD_RADIUS = 18;

const SORT_OPTIONS = [
  { value: 'recent' as const, label: 'Plus récents' },
  { value: 'oldest' as const, label: 'Plus anciens' },
];

/** Même rendu typographique pour le prix souhaité (méta ligne catalogue). */
const SUIVRE_MES_OFFRES_MONTANT_STYLE: CSSProperties = {
  fontSize: 14,
  fontWeight: 400,
  color: '#6e6e73',
  margin: 0,
  lineHeight: 1.35,
  flexShrink: 0,
  fontFamily: 'var(--font-inter), var(--font-sans), system-ui, sans-serif',
};

/** Même principe que `ProposalDescriptionInfo` : icône en em, fond transparent, gris #6e6e73 */
const SUIVRE_OFFRES_CARD_ICON_BTN: CSSProperties = {
  flexShrink: 0,
  padding: '0 0 0.04em 0',
  margin: 0,
  border: 'none',
  borderRadius: 4,
  backgroundColor: 'transparent',
  color: '#6e6e73',
  boxSizing: 'border-box',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  lineHeight: 0,
  textDecoration: 'none',
  fontSize: 'inherit',
  transform: 'translateY(0.17em)',
  cursor: 'pointer',
};

const SUIVRE_OFFRES_CARD_ICON_SVG: CSSProperties = {
  width: '0.92em',
  height: '0.92em',
  display: 'block',
};

const SUIVRE_OFFRES_CARD_ICON_SVG_DELETE: CSSProperties = {
  width: '1.02em',
  height: '1.02em',
  display: 'block',
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
            className="catalogue-results catalogue-results-line suivre-mes-offres-catalogue-line"
            style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}
          >
            {Array.from({ length: 5 }, (_, i) => (
              <article
                key={i}
                className="catalogue-line-card catalogue-skeleton-card"
                style={{
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'row',
                  backgroundColor: '#fff',
                  borderRadius: CATALOGUE_LINE_CARD_RADIUS,
                  overflow: 'hidden',
                  boxShadow: CATALOGUE_LINE_CARD_SHADOW,
                  minHeight: 48,
                  minWidth: 0,
                }}
              >
                <div className="catalogue-line-photo">
                  <div className="catalogue-skeleton" style={{ width: '100%', height: '100%', minHeight: 40 }} />
                </div>
                <div
                  className="catalogue-line-content"
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '0 12px 2px 12px',
                    minWidth: 0,
                    overflow: 'hidden',
                  }}
                >
                  <div className="catalogue-line-title-block" style={{ paddingBottom: 2, minWidth: 0 }}>
                    <div className="catalogue-skeleton" style={{ height: 18, width: '75%', maxWidth: 400, marginBottom: 6 }} />
                    <div className="catalogue-skeleton" style={{ height: 12, width: '40%', maxWidth: 180, marginBottom: 6 }} />
                    <div className="catalogue-skeleton" style={{ height: 18, width: 100 }} />
                  </div>
                  <div
                    className="catalogue-listing-vendeur-block"
                    style={{ borderTop: '1px solid #e8e6e3', paddingTop: 6, paddingBottom: 4, marginTop: 2 }}
                  >
                    <div className="catalogue-skeleton" style={{ height: 12, width: '55%' }} />
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
            className="catalogue-results catalogue-results-line suivre-mes-offres-catalogue-line"
            style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}
          >
            {filteredSorted.map((r) => {
              return (
              <article
                key={r.id}
                className="catalogue-line-card mes-annonces-card"
                style={{
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'row',
                  backgroundColor: '#fff',
                  borderRadius: CATALOGUE_LINE_CARD_RADIUS,
                  overflow: 'hidden',
                  boxShadow: CATALOGUE_LINE_CARD_SHADOW,
                  minHeight: 48,
                  minWidth: 0,
                }}
              >
                <div
                  className="catalogue-line-photo"
                  style={{
                    position: 'relative',
                    backgroundColor: '#fff',
                    overflow: 'hidden',
                  }}
                >
                  {r.photo_urls?.length ? (
                    <CatalogueCardPhotos photos={r.photo_urls} alt={r.title || ''} sizes="(max-width: 768px) 42vw, 200px" />
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
                      <Package size={28} color="#ccc" strokeWidth={1.25} />
                    </div>
                  )}
                </div>
                <div
                  className="catalogue-line-content"
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-start',
                    alignSelf: 'stretch',
                    padding: '0 12px 0 12px',
                    minWidth: 0,
                    minHeight: 0,
                    overflow: 'hidden',
                  }}
                >
                  <div className="catalogue-line-title-block" style={{ paddingBottom: 0, minWidth: 0, overflow: 'visible', flexShrink: 0 }}>
                    <div style={{ fontSize: 18, width: '100%', minWidth: 0, marginBottom: 6 }}>
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 8,
                          maxWidth: '100%',
                          minWidth: 0,
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'baseline',
                            gap: '0.28em',
                            minWidth: 0,
                            flex: '1 1 auto',
                            overflow: 'hidden',
                          }}
                        >
                          <h3
                            title={r.title || ''}
                            className="catalogue-line-title"
                            style={{
                              fontSize: 'inherit',
                              fontWeight: 600,
                              color: '#1d1d1f',
                              margin: 0,
                              flex: '0 1 auto',
                              minWidth: 0,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              lineHeight: 1.3,
                            }}
                          >
                            {r.title}
                          </h3>
                          <ProposalDescriptionInfo description={r.description} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                          <Link
                            href={`/proposer-vente?modifier=${encodeURIComponent(r.id)}`}
                            onClick={(e) => e.stopPropagation()}
                            aria-label="Modifier l'offre"
                            className="suivre-mes-offres-card-action-btn"
                            style={SUIVRE_OFFRES_CARD_ICON_BTN}
                          >
                            <SquarePen strokeWidth={2} aria-hidden style={SUIVRE_OFFRES_CARD_ICON_SVG} />
                          </Link>
                          <button
                            type="button"
                            className="suivre-mes-offres-card-action-btn"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              openProposalDeleteModal(r.id);
                            }}
                            disabled={deletingProposal && proposalToDeleteId === r.id}
                            aria-label="Supprimer l'offre"
                            style={{
                              ...SUIVRE_OFFRES_CARD_ICON_BTN,
                              cursor: deletingProposal && proposalToDeleteId === r.id ? 'not-allowed' : 'pointer',
                              opacity: deletingProposal && proposalToDeleteId === r.id ? 0.7 : 1,
                            }}
                          >
                            <X strokeWidth={2} aria-hidden style={SUIVRE_OFFRES_CARD_ICON_SVG_DELETE} />
                          </button>
                        </div>
                      </div>
                    </div>
                    <ListingCaracteristiques
                      listing={saleProposalRowToListing(r)}
                      variant="lineCatalogue"
                      className="catalogue-listing-caracteristiques"
                    />
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 3,
                        marginTop: 18,
                        marginBottom: 8,
                        minWidth: 0,
                        maxWidth: '100%',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          flexWrap: 'nowrap',
                          minWidth: 0,
                          maxWidth: '100%',
                          overflow: 'hidden',
                          whiteSpace: 'nowrap',
                          textOverflow: 'ellipsis',
                          fontSize: 14,
                          color: '#6e6e73',
                          lineHeight: 1.35,
                          fontWeight: 400,
                        }}
                      >
                        <Calendar size={15} color="#6e6e73" style={{ flexShrink: 0 }} />
                        <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          Demande faite le {formatDate(new Date(r.created_at))}
                        </span>
                        <span style={{ flexShrink: 0, color: '#6e6e73' }}> - </span>
                        <span style={{ flexShrink: 0, color: '#6e6e73' }}>Prix souhaité</span>
                        <p className="catalogue-listing-prix suivre-mes-offres-meta-prix" style={SUIVRE_MES_OFFRES_MONTANT_STYLE}>
                          {formatPrice(r.wish_price_cents / 100)}
                        </p>
                      </div>
                      <div
                        className="catalogue-listing-vendeur-block"
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 4,
                          alignItems: 'stretch',
                          minWidth: 0,
                          maxWidth: '100%',
                          paddingTop: 0,
                          paddingBottom: 2,
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            flexWrap: 'nowrap',
                            minWidth: 0,
                            fontSize: 14,
                            color: '#6e6e73',
                            lineHeight: 1.35,
                            fontWeight: 400,
                          }}
                        >
                          <Store size={15} color="#6e6e73" style={{ flexShrink: 0 }} aria-hidden />
                          <span>Vendeurs sélectionnés :</span>
                        </div>
                        <div
                          style={{
                            paddingLeft: 19,
                            minWidth: 0,
                            maxWidth: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            boxSizing: 'border-box',
                          }}
                        >
                          {r.invites && r.invites.length > 0 ? (
                            <InvitedSellersCatalogueLine invites={r.invites} />
                          ) : (
                            <span style={{ fontSize: 13, color: '#86868b', lineHeight: 1.25 }}>
                              Aucun vendeur invité pour le moment
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div
                    className="suivre-mes-offres-disclaimer-bas"
                    style={{
                      marginTop: 'auto',
                      borderTop: '1px solid #e8e6e3',
                      paddingTop: 6,
                      paddingBottom: 6,
                      marginBottom: 0,
                      width: '100%',
                      maxWidth: '100%',
                      flexShrink: 0,
                      alignSelf: 'stretch',
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        paddingBottom: 0,
                        fontSize: 11.5,
                        fontWeight: 400,
                        color: '#86868b',
                        lineHeight: 1.4,
                        maxWidth: '100%',
                      }}
                    >
                      La plateforme a pour unique but de mettre en relation vendeurs et acheteurs; toute transaction est sous la
                      responsabilité exclusive des deux parties.
                    </p>
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
                  borderRadius: 980,
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
                  borderRadius: 980,
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

/** Noms des vendeurs invités : une ligne, style catalogue ; chaque nom lien vers le catalogue du vendeur. */
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
    alignItems: 'center',
    flex: '1 1 0%',
    minWidth: 0,
    overflow: 'hidden',
  };

  const ellipsisInnerStyle: CSSProperties = {
    display: 'block',
    flex: '1 1 0%',
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontSize: 13,
    fontWeight: 400,
    color: '#86868b',
    lineHeight: 1.25,
  };

  if (sellers === null) {
    return (
      <div className="suivre-mes-offres-vendeurs-outer" style={vendeursOuterStyle}>
        <span className="catalogue-listing-vendeur-nom-row suivre-mes-offres-vendeurs-ligne" style={{ ...ellipsisInnerStyle, letterSpacing: 0.5 }}>
          …
        </span>
      </div>
    );
  }

  const fullVendorsTitle = sellers.map((s) => s.companyName.toUpperCase()).join(' ; ');

  return (
    <div className="suivre-mes-offres-vendeurs-outer" style={vendeursOuterStyle} title={fullVendorsTitle}>
      <span className="catalogue-listing-vendeur-nom-row suivre-mes-offres-vendeurs-ligne" style={ellipsisInnerStyle}>
        {sellers.map((seller, i) => (
          <span key={seller.uid}>
            {i > 0 ? <span aria-hidden> ; </span> : null}
            <Link
              href={sellerCataloguePath(seller)}
              className="catalogue-listing-vendeur-nom suivre-mes-offres-seller-link"
              title={`Voir les annonces de ${seller.companyName}`}
              style={{
                display: 'inline',
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
