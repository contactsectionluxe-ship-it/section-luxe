'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type MouseEvent as ReactMouseEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, ChevronDown, Store, Calendar, Handbag, Package } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import {
  deleteSellerOwnProposalInvite,
  fetchSellerInvitedProposals,
  type InvitedProposalRow,
} from '@/lib/supabase/saleProposals';
import { getUserData } from '@/lib/supabase/auth';
import { getOrCreateProposalConversation } from '@/lib/supabase/messaging';
import { formatPrice, formatDate } from '@/lib/utils';
import { CatalogueCardPhotos } from '@/components/CatalogueCardPhotos';
import { PortalModal } from '@/components/ui/PortalModal';

const SORT_OPTIONS = [
  { value: 'recent' as const, label: 'Plus récents' },
  { value: 'oldest' as const, label: 'Plus anciens' },
];

export default function SourcingPage() {
  const router = useRouter();
  const { user, seller, isApprovedSeller, loading: authLoading } = useAuth();
  const [rows, setRows] = useState<InvitedProposalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'oldest'>('recent');
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
  const [declineInviteRow, setDeclineInviteRow] = useState<InvitedProposalRow | null>(null);
  const [decliningInvite, setDecliningInvite] = useState(false);
  const [declineInviteError, setDeclineInviteError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !user || !seller || !isApprovedSeller) return;
    const tier = seller.subscriptionTier;
    if (tier !== 'plus' && tier !== 'pro') {
      router.replace('/vendeur');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchSellerInvitedProposals(user.uid);
        if (!cancelled) {
          setRows(data);
          setLoadError(null);
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Impossible de charger les demandes.';
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
  }, [authLoading, user, seller, isApprovedSeller, router]);

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
    let list = q ? rows.filter((r) => (r.proposal.title || '').toLowerCase().includes(q)) : [...rows];
    list.sort((a, b) => {
      const ta = new Date(a.proposal.created_at).getTime();
      const tb = new Date(b.proposal.created_at).getTime();
      return sortBy === 'recent' ? tb - ta : ta - tb;
    });
    return list;
  }, [rows, searchQuery, sortBy]);

  const openMessage = async (row: InvitedProposalRow) => {
    if (!user || !seller) return;
    try {
      const buyer = await getUserData(row.proposal.visitor_id);
      const conv = await getOrCreateProposalConversation({
        proposalId: row.proposal.id,
        listingTitle: row.proposal.title,
        listingPhoto: row.proposal.photo_urls?.[0] || '',
        buyerId: row.proposal.visitor_id,
        buyerName: buyer?.displayName?.trim() || 'Particulier',
        sellerId: user.uid,
        sellerName: seller.companyName,
      });
      router.push(`/messages/${conv.id}`);
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : 'Impossible d’ouvrir la conversation');
    }
  };

  const closeDeclineInviteModal = () => {
    if (decliningInvite) return;
    setDeclineInviteRow(null);
    setDeclineInviteError(null);
  };

  const handleConfirmDeclineInvite = async () => {
    if (!user?.uid || !declineInviteRow) return;
    setDecliningInvite(true);
    setDeclineInviteError(null);
    try {
      await deleteSellerOwnProposalInvite(user.uid, declineInviteRow.proposal_id);
      setRows((prev) => prev.filter((r) => r.proposal_id !== declineInviteRow.proposal_id));
      setDeclineInviteRow(null);
    } catch (e) {
      console.error(e);
      setDeclineInviteError(
        e instanceof Error ? e.message : 'Impossible de retirer cette proposition. Réessayez ou exécutez la migration SQL « sale_proposal_invites_seller_delete » sur Supabase.',
      );
    } finally {
      setDecliningInvite(false);
    }
  };

  if (authLoading) {
    return (
      <div className="sourcing-page" style={{ paddingTop: 'var(--header-height)', minHeight: '100vh' }}>
        <div className="mes-annonces-page-inner" style={{ maxWidth: 1100, margin: '0 auto', padding: '30px 24px 60px' }}>
          <SourcingListSkeleton />
        </div>
      </div>
    );
  }

  if (!user || !seller || !isApprovedSeller) {
    router.replace('/connexion');
    return null;
  }
  if (seller.subscriptionTier !== 'plus' && seller.subscriptionTier !== 'pro') {
    return null;
  }

  return (
    <div className="sourcing-page" style={{ paddingTop: 'var(--header-height)', minHeight: '100vh' }}>
      <div className="mes-annonces-page-inner" style={{ maxWidth: 1100, margin: '0 auto', padding: '30px 24px 60px' }}>
        <div
          className="mes-annonces-header"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}
        >
          <div className="mes-annonces-title-block" style={{ flex: '1 1 auto', minWidth: 0 }}>
            <div className="mes-annonces-title-text-stack" style={{ flex: '1 1 auto', minWidth: 0 }}>
              <h1 style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: 28, fontWeight: 500, margin: '0 0 8px' }}>
                Sourcing
              </h1>
              <p style={{ fontSize: 14, color: '#666', margin: 0, lineHeight: 1.45 }}>
                Gérez vos propositions reçues
              </p>
            </div>
          </div>
          <div className="mes-annonces-header-actions" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 10 }}>
            <Link
              href="/vendeur"
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
              <Store size={18} /> Espace vendeur
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
                placeholder="Rechercher dans le sourcing…"
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
          <SourcingListSkeleton />
        ) : rows.length === 0 ? (
          <div style={{ padding: 60, border: '1px solid #eee', textAlign: 'center', borderRadius: 12 }}>
            <Handbag size={48} color="#ccc" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: 16, fontWeight: 500, margin: 0 }}>Aucune demande</h3>
            <p style={{ fontSize: 14, color: '#6e6e73', marginTop: 8, marginBottom: 0 }}>Les propositions des particuliers apparaîtront ici.</p>
          </div>
        ) : filteredSorted.length === 0 ? (
          <div style={{ padding: 60, border: '1px solid #eee', textAlign: 'center', borderRadius: 12 }}>
            <p style={{ fontSize: 15, color: '#6e6e73' }}>Aucun résultat pour « {searchQuery.trim()} »</p>
          </div>
        ) : (
          <div className="mes-annonces-list-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, minWidth: 0, alignItems: 'start' }}>
            {filteredSorted.map((row) => (
              <SourcingProposalCard
                key={row.proposal_id}
                row={row}
                onContact={() => void openMessage(row)}
                onRequestDecline={() => {
                  setDeclineInviteError(null);
                  setDeclineInviteRow(row);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {declineInviteRow && (
      <PortalModal open={true} onClose={closeDeclineInviteModal} zIndex={120}>
          <div
            style={{
              width: '100%',
              maxWidth: 440,
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
              Retirer de votre sourcing
            </h2>
            <p style={{ fontSize: 14, color: '#6e6e73', lineHeight: 1.5, marginTop: 16, marginBottom: 8, textAlign: 'center' }}>
              Cette proposition disparaît uniquement de <strong style={{ fontWeight: 600, color: '#1d1d1f' }}>votre</strong> page Sourcing. Les autres vendeurs invités et le particulier ne sont pas affectés.
            </p>
            <p
              style={{
                fontSize: 13,
                color: '#1d1d1f',
                lineHeight: 1.4,
                marginTop: 0,
                marginBottom: 20,
                textAlign: 'center',
                fontFamily: 'var(--font-playfair), var(--font-serif)',
              }}
            >
              {declineInviteRow.proposal.title}
            </p>
            {declineInviteError && (
              <p style={{ fontSize: 13, color: '#dc2626', marginBottom: 16, textAlign: 'center' }}>{declineInviteError}</p>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={closeDeclineInviteModal}
                disabled={decliningInvite}
                style={{
                  flex: 1,
                  height: 44,
                  backgroundColor: '#fff',
                  color: '#1d1d1f',
                  fontSize: 14,
                  fontWeight: 500,
                  border: '1.5px solid #d2d2d7',
                  borderRadius: 10,
                  cursor: decliningInvite ? 'not-allowed' : 'pointer',
                  opacity: decliningInvite ? 0.7 : 1,
                }}
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmDeclineInvite()}
                disabled={decliningInvite}
                style={{
                  flex: 1,
                  height: 44,
                  backgroundColor: '#dc2626',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 500,
                  border: 'none',
                  borderRadius: 10,
                  cursor: decliningInvite ? 'not-allowed' : 'pointer',
                  opacity: decliningInvite ? 0.7 : 1,
                }}
              >
                {decliningInvite ? 'Suppression…' : 'Supprimer'}
              </button>
            </div>
          </div>
      </PortalModal>
      )}
    </div>
  );
}

function SourcingListSkeleton() {
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

function SourcingProposalCard({
  row,
  onContact,
  onRequestDecline,
}: {
  row: InvitedProposalRow;
  onContact: () => void | Promise<void>;
  onRequestDecline: () => void;
}) {
  const router = useRouter();
  const p = row.proposal;
  const [contacting, setContacting] = useState(false);

  const handleContact = useCallback(async () => {
    setContacting(true);
    try {
      await onContact();
    } finally {
      setContacting(false);
    }
  }, [onContact]);

  const goToDetail = useCallback(
    (e: ReactMouseEvent<HTMLElement>) => {
      if ((e.target as HTMLElement).closest('button')) return;
      router.push(`/vendeur/demandes-mise-en-vente/${row.proposal_id}`);
    },
    [router, row.proposal_id],
  );

  return (
    <div
      className="mes-annonces-card"
      role="button"
      tabIndex={0}
      onClick={goToDetail}
      onKeyDown={(e: KeyboardEvent<HTMLElement>) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (!(e.target as HTMLElement).closest('button')) router.push(`/vendeur/demandes-mise-en-vente/${row.proposal_id}`);
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
        {p.photo_urls?.length ? (
          <CatalogueCardPhotos
            photos={p.photo_urls}
            alt={p.title || ''}
            sizes="(max-width: 768px) 50vw, 25vw"
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
      <div style={{ borderTop: '1px solid #e8e6e3', padding: '16px 16px 12px', backgroundColor: '#fff' }}>
        <div style={{ marginBottom: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3
              className="listing-grid-title mes-annonces-grid-title"
              title={p.title || ''}
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
              {p.title}
            </h3>
            <p style={{ fontSize: 11, color: '#888', margin: '0 0 2px', fontWeight: 400 }}>Prix souhaité</p>
            <p style={{ fontSize: 18, fontWeight: 600, color: '#000', margin: 0 }}>{formatPrice(p.wish_price_cents / 100)}</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, color: '#888' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Calendar size={12} aria-hidden />
            {formatDate(new Date(p.created_at))}
          </span>
        </div>
      </div>
      <div className="mes-annonces-card-actions" style={{ padding: '0 16px 16px' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 0 }}>
          <button
            type="button"
            disabled={contacting}
            onClick={() => void handleContact()}
            style={{
              flex: 1,
              padding: '8px 14px',
              backgroundColor: '#000',
              color: '#fff',
              fontSize: 13,
              textAlign: 'center',
              borderRadius: 6,
              border: 'none',
              fontWeight: 500,
              cursor: contacting ? 'wait' : 'pointer',
              opacity: contacting ? 0.85 : 1,
            }}
          >
            Contacter
          </button>
          <button
            type="button"
            onClick={onRequestDecline}
            disabled={contacting}
            style={{
              flex: 1,
              padding: '8px 14px',
              border: '1px solid #ddd',
              fontSize: 13,
              textAlign: 'center',
              borderRadius: 6,
              color: '#dc2626',
              backgroundColor: '#fff',
              fontWeight: 500,
              cursor: contacting ? 'not-allowed' : 'pointer',
              opacity: contacting ? 0.6 : 1,
            }}
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}
