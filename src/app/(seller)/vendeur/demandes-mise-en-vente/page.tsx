'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MessageCircle, Search, ChevronDown, Store, Calendar, Info, Handbag, Package } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { PageLoader } from '@/components/ui';
import { fetchSellerInvitedProposals, updateSellerProposalOffer, type InvitedProposalRow } from '@/lib/supabase/saleProposals';
import { getUserData } from '@/lib/supabase/auth';
import { getOrCreateProposalConversation } from '@/lib/supabase/messaging';
import {
  formatPrice,
  formatDate,
  parseListingPriceInputToNumber,
  sanitizeListingPriceInputWhileTyping,
} from '@/lib/utils';
import { CatalogueCardPhotos } from '@/components/CatalogueCardPhotos';

/** Aligné sur « Suivre mes offres » (vue liste catalogue). */
const CATALOGUE_LINE_CARD_SHADOW = '0 4px 24px rgba(0,0,0,0.06)';
const CATALOGUE_LINE_CARD_RADIUS = 18;

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

  const saveOffer = async (proposalId: string, priceInput: string, note: string) => {
    if (!user) return;
    const n = parseListingPriceInputToNumber(priceInput);
    try {
      await updateSellerProposalOffer(user.uid, proposalId, {
        estimatedPriceCents: n != null ? Math.round(n * 100) : null,
        sellerNote: note.trim() || null,
      });
      setRows((prev) =>
        prev.map((r) =>
          r.proposal_id === proposalId
            ? {
                ...r,
                estimated_price_cents: n != null ? Math.round(n * 100) : null,
                seller_note: note.trim() || null,
                updated_at: new Date().toISOString(),
              }
            : r,
        ),
      );
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Enregistrement impossible');
    }
  };

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

  if (authLoading) {
    return (
      <div className="sourcing-page" style={{ paddingTop: 'var(--header-height)', minHeight: '100vh' }}>
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
                Propositions de particuliers qui vous ont sélectionné — estimation indicative, note et messagerie.
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
            className="catalogue-results catalogue-results-line suivre-mes-offres-catalogue-line"
            style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}
          >
            {filteredSorted.map((row) => (
              <SourcingProposalCard key={row.proposal_id} row={row} onSave={saveOffer} onMessage={() => void openMessage(row)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SourcingProposalCard({
  row,
  onSave,
  onMessage,
}: {
  row: InvitedProposalRow;
  onSave: (proposalId: string, price: string, note: string) => void | Promise<void>;
  onMessage: () => void | Promise<void>;
}) {
  const p = row.proposal;
  const [price, setPrice] = useState(
    row.estimated_price_cents != null ? String(Math.round(row.estimated_price_cents / 100)) : '',
  );
  const [note, setNote] = useState(row.seller_note || '');
  const [saving, setSaving] = useState(false);
  const [messaging, setMessaging] = useState(false);

  useEffect(() => {
    setPrice(row.estimated_price_cents != null ? String(Math.round(row.estimated_price_cents / 100)) : '');
    setNote(row.seller_note || '');
  }, [row.estimated_price_cents, row.seller_note, row.proposal_id]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await onSave(row.proposal_id, price, note);
    } finally {
      setSaving(false);
    }
  }, [onSave, row.proposal_id, price, note]);

  const handleMessage = useCallback(async () => {
    setMessaging(true);
    try {
      await onMessage();
    } finally {
      setMessaging(false);
    }
  }, [onMessage]);

  const inputStyle: CSSProperties = {
    width: '100%',
    height: 40,
    padding: '0 12px',
    borderRadius: 10,
    border: '1px solid #d2d2d7',
    fontSize: 14,
    boxSizing: 'border-box',
    outline: 'none',
  };

  return (
    <article
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
        {p.photo_urls?.length ? (
          <CatalogueCardPhotos photos={p.photo_urls} alt={p.title || ''} sizes="(max-width: 768px) 42vw, 200px" />
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
          justifyContent: 'space-between',
          padding: '0 12px 2px 12px',
          minWidth: 0,
          overflow: 'hidden',
        }}
      >
        <div className="catalogue-line-title-block" style={{ paddingBottom: 2, minWidth: 0, overflow: 'hidden' }}>
          <h3
            title={p.title || ''}
            className="catalogue-line-title"
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: '#1d1d1f',
              margin: 0,
              marginBottom: 6,
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              lineHeight: 1.3,
            }}
          >
            {p.title}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8, minWidth: 0, maxWidth: '100%' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                flexWrap: 'nowrap',
                minWidth: 0,
                maxWidth: '100%',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                fontSize: 12,
                color: '#6e6e73',
                lineHeight: 1.25,
              }}
            >
              <Calendar size={13} color="#6e6e73" style={{ flexShrink: 0 }} />
              <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                Demande du {formatDate(new Date(p.created_at))}
              </span>
              <span style={{ flexShrink: 0, color: '#86868b' }}> — </span>
              <span style={{ flexShrink: 0, fontWeight: 500, color: '#86868b' }}>Prix souhaité</span>
              <p
                className="catalogue-listing-prix"
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: '#1d1d1f',
                  margin: 0,
                  lineHeight: 1.25,
                  flexShrink: 0,
                }}
              >
                {formatPrice(p.wish_price_cents / 100)}
              </p>
            </div>
            {p.description ? (
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  color: '#6e6e73',
                  lineHeight: 1.4,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {p.description}
              </p>
            ) : null}
          </div>

          <div style={{ marginTop: 4, marginBottom: 8, position: 'relative', maxWidth: '100%' }}>
            <Info size={14} color="#86868b" style={{ position: 'absolute', left: 0, top: 0.5 }} aria-hidden />
            <p
              style={{
                margin: 0,
                paddingLeft: 20,
                fontSize: 11,
                fontWeight: 400,
                color: '#86868b',
                lineHeight: 1.45,
                maxWidth: '100%',
              }}
            >
              Votre estimation est indicative et pourra être ajustée après vérification du produit en boutique.
            </p>
          </div>

          <div
            className="sourcing-card-fields"
            style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-end', marginTop: 4, marginBottom: 4 }}
          >
            <div style={{ flex: '1 1 120px', minWidth: 0 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: '#86868b', marginBottom: 4 }}>Estimation (€)</label>
              <input
                type="text"
                inputMode="numeric"
                value={price}
                onChange={(e) => setPrice(sanitizeListingPriceInputWhileTyping(e.target.value))}
                placeholder="Ex. 1200"
                style={inputStyle}
              />
            </div>
            <div style={{ flex: '2 1 180px', minWidth: 0 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: '#86868b', marginBottom: 4 }}>Note (optionnel)</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Précision pour le particulier"
                style={inputStyle}
              />
            </div>
          </div>
        </div>
        <div
          className="catalogue-listing-vendeur-block sourcing-card-actions"
          style={{
            borderTop: '1px solid #e8e6e3',
            paddingTop: 8,
            paddingBottom: 6,
            marginTop: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            flexWrap: 'wrap',
            minHeight: 28,
            backgroundColor: '#fff',
            width: '100%',
            minWidth: 0,
          }}
        >
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleSave()}
            style={{
              height: 40,
              padding: '0 18px',
              backgroundColor: '#000',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              fontWeight: 500,
              fontSize: 14,
              cursor: saving ? 'wait' : 'pointer',
              opacity: saving ? 0.85 : 1,
            }}
          >
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
          <button
            type="button"
            disabled={messaging}
            onClick={() => void handleMessage()}
            style={{
              height: 40,
              padding: '0 16px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              backgroundColor: '#fff',
              color: '#1d1d1f',
              border: '1px solid #d2d2d7',
              borderRadius: 12,
              fontWeight: 500,
              fontSize: 14,
              cursor: messaging ? 'wait' : 'pointer',
            }}
          >
            <MessageCircle size={18} />
            Message
          </button>
        </div>
      </div>
    </article>
  );
}
