'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, ChevronDown, Store, Calendar, Handbag, Package } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useMatchMaxWidth } from '@/hooks/useMatchMaxWidth';
import { PageLoader } from '@/components/ui';
import {
  deleteSellerOwnProposalInvite,
  fetchSellerInvitedProposals,
  saleProposalRowToListing,
  type InvitedProposalRow,
} from '@/lib/supabase/saleProposals';
import { getUserData } from '@/lib/supabase/auth';
import { getOrCreateProposalConversation } from '@/lib/supabase/messaging';
import { formatPrice, formatDateShort } from '@/lib/utils';
import { CatalogueCardPhotos } from '@/components/CatalogueCardPhotos';
import { ListingCaracteristiques, LISTING_CARACTERISTIQUES_COMPACT_TEXT_STYLE } from '@/components/ListingCaracteristiques';
import { SaleProposalGridDescriptionAccordion } from '@/components/sale-proposals/SaleProposalGridDescriptionAccordion';

/** Même grille que « Suivre mes offres » (`suivre-mes-offres/page.tsx`). */
const CATALOGUE_GRID_CARD_SHADOW = '0 4px 24px rgba(0,0,0,0.06)';
const CATALOGUE_GRID_CARD_RADIUS = 18;

const SOURCING_GRID_CARAC_TYPO = LISTING_CARACTERISTIQUES_COMPACT_TEXT_STYLE;
const SOURCING_GRID_CARAC_ICON_SIZE = 13.5;
const SOURCING_GRID_CARAC_ICON_COLOR = '#6e6e73';

const SOURCING_GRID_TITLE_TYPO: CSSProperties = {
  fontSize: 16,
  fontWeight: 500,
  color: '#1d1d1f',
  lineHeight: 1.3,
};

const SOURCING_GRID_PRIX_LABEL_TYPO: CSSProperties = {
  ...SOURCING_GRID_TITLE_TYPO,
  fontFamily: 'var(--font-playfair), var(--font-serif)',
};

const SOURCING_GRID_PRICE_TYPO: CSSProperties = {
  fontFamily: 'var(--font-inter), var(--font-sans)',
  fontSize: 16,
  fontWeight: 600,
  color: '#1d1d1f',
  lineHeight: 1.3,
};

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
          <PageLoader />
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
          <div
            className="catalogue-results catalogue-results-grid suivre-mes-offres-catalogue-grid"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, minWidth: 0, alignItems: 'start' }}
          >
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
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)' }} onClick={closeDeclineInviteModal} aria-hidden />
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: 440,
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
        </div>
      )}
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
  const p = row.proposal;
  const [contacting, setContacting] = useState(false);
  const isNarrowViewport = useMatchMaxWidth(767);

  const handleContact = useCallback(async () => {
    setContacting(true);
    try {
      await onContact();
    } finally {
      setContacting(false);
    }
  }, [onContact]);

  return (
    <article
      className="mes-annonces-card suivre-mes-offres-grid-card sourcing-grid-card"
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
        {p.photo_urls?.length ? (
          <CatalogueCardPhotos
            photos={p.photo_urls}
            alt={p.title || ''}
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
            title={p.title || ''}
            style={{
              ...SOURCING_GRID_TITLE_TYPO,
              margin: 0,
              minWidth: 0,
              flex: '1 1 auto',
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {p.title}
          </h3>
        </div>
        <ListingCaracteristiques
          listing={saleProposalRowToListing(p)}
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
            className="listing-grid-price"
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
              <span style={SOURCING_GRID_PRIX_LABEL_TYPO}>Prix souhaité</span>
              <span style={{ ...SOURCING_GRID_PRICE_TYPO, transform: 'translateY(0.2mm)' }}>
                {formatPrice(p.wish_price_cents / 100)}
              </span>
            </span>
          </div>
          <span
            style={{
              ...SOURCING_GRID_CARAC_TYPO,
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
              size={SOURCING_GRID_CARAC_ICON_SIZE}
              color={SOURCING_GRID_CARAC_ICON_COLOR}
              style={{ flexShrink: 0, display: 'block', transform: 'translateY(-0.2mm)' }}
              aria-hidden
            />
            {formatDateShort(new Date(p.created_at))}
          </span>
        </div>
        <SaleProposalGridDescriptionAccordion proposalId={p.id} description={p.description} packaging={p.packaging} />
        <div
          className="sourcing-grid-card-footer"
          style={{
            flex: 1,
            minHeight: 0,
            width: '100%',
            borderTop: '1px solid #f0f0f0',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
            justifyContent: 'center',
            gap: 6,
            padding: '8px 0 max(0px, calc(3px - 1.5mm))',
            marginBottom: 'min(0px, calc(3px - 1.5mm))',
            boxSizing: 'border-box',
          }}
        >
          {row.estimated_price_cents != null && (
            <span style={{ ...SOURCING_GRID_CARAC_TYPO, fontWeight: 500, color: '#1d1d1f' }}>
              Votre offre : {formatPrice(row.estimated_price_cents / 100)}
            </span>
          )}
          {row.seller_note?.trim() ? (
            <p
              style={{
                ...SOURCING_GRID_CARAC_TYPO,
                margin: 0,
                lineHeight: 1.35,
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
              title={row.seller_note}
            >
              {row.seller_note.trim()}
            </p>
          ) : null}
          <div style={{ display: 'flex', gap: 6, marginTop: 2, width: '100%' }}>
            <button
              type="button"
              disabled={contacting}
              onClick={() => void handleContact()}
              style={{
                flex: 1,
                minWidth: 0,
                minHeight: 32,
                height: 32,
                padding: '0 10px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: 1,
                backgroundColor: '#1d1d1f',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                fontWeight: 500,
                fontSize: 13,
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
                minWidth: 0,
                minHeight: 32,
                height: 32,
                padding: '0 10px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                backgroundColor: '#fff',
                color: '#dc2626',
                border: '1.5px solid #fecaca',
                borderRadius: 10,
                fontWeight: 500,
                fontSize: 13,
                cursor: contacting ? 'not-allowed' : 'pointer',
                opacity: contacting ? 0.6 : 1,
              }}
            >
              Supprimer
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
