'use client';

import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type MouseEvent as ReactMouseEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Package, Plus, Search, ChevronDown, X, Calendar } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { deleteVisitorSaleProposal, fetchVisitorSaleProposals, type SaleProposalRow } from '@/lib/supabase/saleProposals';
import { formatPrice, formatDate } from '@/lib/utils';
import { CatalogueCardPhotos } from '@/components/CatalogueCardPhotos';
import { PortalModal } from '@/components/ui/PortalModal';

const SORT_OPTIONS = [
  { value: 'recent' as const, label: 'Plus récents' },
  { value: 'oldest' as const, label: 'Plus anciens' },
];

function SuivreMesOffresListSkeleton() {
  return (
    <div className="mes-annonces-list-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, minWidth: 0, alignItems: 'start' }}>
      {Array.from({ length: 8 }, (_, i) => (
        <div
          key={i}
          className="catalogue-skeleton-card"
          style={{
            border: '1px solid #e8e6e3',
            borderRadius: 12,
            overflow: 'hidden',
            backgroundColor: '#fff',
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            display: 'flex',
            flexDirection: 'column',
            ['--skeleton-index' as string]: i,
          }}
        >
          <div className="catalogue-skeleton" style={{ width: '100%', aspectRatio: '1', borderRadius: 0 }} />
          <div style={{ borderTop: '1px solid #e8e6e3', padding: '16px 16px 12px', display: 'flex', flexDirection: 'column', gap: 8, minHeight: 88, backgroundColor: '#fff' }}>
            <div className="catalogue-skeleton" style={{ height: 20, width: '85%' }} />
            <div className="catalogue-skeleton" style={{ height: 24, width: '45%' }} />
            <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
              <div className="catalogue-skeleton" style={{ height: 14, width: 48 }} />
              <div className="catalogue-skeleton" style={{ height: 14, width: 72 }} />
            </div>
          </div>
          <div style={{ padding: '0 16px 16px', display: 'flex', gap: 8 }}>
            <div className="catalogue-skeleton" style={{ flex: 1, height: 36, borderRadius: 6 }} />
            <div className="catalogue-skeleton" style={{ flex: 1, height: 36, borderRadius: 6 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

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
      <div className="suivre-mes-offres-page" style={{ paddingTop: 'var(--header-height)', minHeight: '100vh' }}>
        <div className="mes-annonces-page-inner" style={{ maxWidth: 1100, margin: '0 auto', padding: '30px 24px 60px' }}>
          <SuivreMesOffresListSkeleton />
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
            <div className="mes-annonces-header-icons-mobile-wrap">
              <Link
                href="/proposer-vente"
                className="mes-annonces-deposer-icon-mobile"
                aria-label="Proposer une pièce"
                title="Proposer une pièce"
                style={{
                  display: 'none',
                  flexShrink: 0,
                  width: 44,
                  height: 44,
                  padding: 0,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#000',
                  color: '#fff',
                  borderRadius: 12,
                  textDecoration: 'none',
                  boxSizing: 'border-box',
                }}
              >
                <Plus size={22} strokeWidth={2} />
              </Link>
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
              <Plus size={18} strokeWidth={2} /> Proposer une pièce
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

        {loadError ? null : loading ? (
          <SuivreMesOffresListSkeleton />
        ) : rows.length === 0 ? (
          <div style={{ padding: 60, border: '1px solid #eee', textAlign: 'center', borderRadius: 12 }}>
            <Package size={48} color="#ccc" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: 16, fontWeight: 500, margin: 0 }}>Aucune proposition</h3>
          </div>
        ) : filteredSorted.length === 0 ? (
          <div style={{ padding: 60, border: '1px solid #eee', textAlign: 'center', borderRadius: 12 }}>
            <p style={{ fontSize: 15, color: '#6e6e73' }}>Aucun résultat pour « {searchQuery.trim()} »</p>
          </div>
        ) : (
          <div className="mes-annonces-list-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, minWidth: 0, alignItems: 'start' }}>
            {filteredSorted.map((r) => (
              <SuivreMesOffresProposalCard
                key={r.id}
                row={r}
                deletingProposal={deletingProposal}
                proposalToDeleteId={proposalToDeleteId}
                onOpenDelete={() => openProposalDeleteModal(r.id)}
              />
            ))}
          </div>
        )}
      </div>

      <PortalModal open={!!proposalToDeleteId} onClose={closeProposalDeleteModal} zIndex={120}>
          <div
            style={{
              width: '100%',
              maxWidth: 410,
              margin: '0 auto',
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
      </PortalModal>
    </div>
  );
}

function SuivreMesOffresProposalCard({
  row: r,
  deletingProposal,
  proposalToDeleteId,
  onOpenDelete,
}: {
  row: SaleProposalRow;
  deletingProposal: boolean;
  proposalToDeleteId: string | null;
  onOpenDelete: () => void;
}) {
  const router = useRouter();

  const goToDetail = (e: ReactMouseEvent<HTMLElement>) => {
    if ((e.target as HTMLElement).closest('button, a')) return;
    router.push(`/suivre-mes-offres/${r.id}`);
  };

  return (
    <div
      className="mes-annonces-card"
      role="button"
      tabIndex={0}
      onClick={goToDetail}
      onKeyDown={(e: KeyboardEvent<HTMLElement>) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (!(e.target as HTMLElement).closest('button, a')) router.push(`/suivre-mes-offres/${r.id}`);
        }
      }}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid #eee',
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#fff',
        minWidth: 0,
        cursor: 'pointer',
        transition: 'box-shadow 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{ position: 'relative', width: '100%', aspectRatio: '1', backgroundColor: '#fff', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 8, left: 8, zIndex: 10 }}>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onOpenDelete();
            }}
            disabled={deletingProposal && proposalToDeleteId === r.id}
            aria-label="Supprimer l'offre"
            style={{
              padding: 4,
              width: 22,
              height: 22,
              boxSizing: 'border-box',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              borderRadius: 4,
              backgroundColor: '#f0f0f0',
              color: '#1d1d1f',
              cursor: deletingProposal && proposalToDeleteId === r.id ? 'not-allowed' : 'pointer',
              opacity: deletingProposal && proposalToDeleteId === r.id ? 0.7 : 1,
            }}
          >
            <X size={14} strokeWidth={2.5} aria-hidden />
          </button>
        </div>
        {r.photo_urls?.length ? (
          <CatalogueCardPhotos photos={r.photo_urls} alt={r.title || ''} sizes="(max-width: 768px) 50vw, 25vw" />
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
      <div style={{ borderTop: '1px solid #e8e6e3', padding: '16px 16px 12px', backgroundColor: '#fff' }}>
        <div style={{ marginBottom: 8 }}>
          <h3
            className="listing-grid-title mes-annonces-grid-title"
            title={r.title || ''}
            style={{
              fontSize: 15,
              fontWeight: 500,
              color: '#1d1d1f',
              margin: '0 0 4px 0',
              minWidth: 0,
              overflow: 'hidden',
              lineHeight: 1.3,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {r.title}
          </h3>
          <p style={{ fontSize: 11, color: '#888', margin: '0 0 2px', fontWeight: 400 }}>Prix souhaité</p>
          <p style={{ fontSize: 18, fontWeight: 600, color: '#000', margin: 0 }}>{formatPrice(r.wish_price_cents / 100)}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, color: '#888' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Calendar size={12} aria-hidden />
            {formatDate(new Date(r.created_at))}
          </span>
        </div>
      </div>
      <div className="mes-annonces-card-actions" style={{ padding: '0 16px 16px' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link
            href={`/proposer-vente?modifier=${encodeURIComponent(r.id)}`}
            onClick={(e) => e.stopPropagation()}
            style={{
              flex: 1,
              padding: '8px 14px',
              border: '1px solid #ddd',
              fontSize: 13,
              textAlign: 'center',
              borderRadius: 6,
              color: '#1d1d1f',
              textDecoration: 'none',
            }}
          >
            Modifier
          </Link>
          <Link
            href={`/suivre-mes-offres/${r.id}`}
            onClick={(e) => e.stopPropagation()}
            style={{
              flex: 1,
              padding: '8px 14px',
              backgroundColor: '#000',
              color: '#fff',
              fontSize: 13,
              textAlign: 'center',
              borderRadius: 6,
              textDecoration: 'none',
            }}
          >
            Détails
          </Link>
        </div>
      </div>
    </div>
  );
}
