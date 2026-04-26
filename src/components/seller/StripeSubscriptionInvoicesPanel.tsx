'use client';

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, Search, Download } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getSession, getValidAccessTokenForFetch } from '@/lib/supabase/auth';

/** Renseigne le sous-titre « N facture(s) » sur Mon abonnement (évite un 2e fetch + 2e refreshSession). */
export type StripeSubscriptionInvoicesHeadlineMeta =
  | { kind: 'count'; count: number }
  | { kind: 'error'; message: string };

type StripeInvoiceRow = {
  id: string;
  number: string | null;
  status: string | null;
  created: number;
  total: number;
  currency: string;
  hostedInvoiceUrl: string | null;
  invoicePdf: string | null;
  productTitle?: string | null;
};

function formatPrice(cents: number, currency: string): string {
  const cur = (currency || 'eur').toUpperCase();
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: cur === 'EUR' ? 'EUR' : cur,
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }).format(d);
}

function statusLabel(status: string | null): string {
  switch (status) {
    case 'paid':
      return 'Payée';
    case 'open':
      return 'À payer';
    case 'draft':
      return 'Brouillon';
    case 'void':
      return 'Annulée';
    case 'uncollectible':
      return 'Impayée';
    default:
      return status || '—';
  }
}

function normalizeForSearch(s: string): string {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[-'\s]+/g, '');
}

type SortOrder = 'newest' | 'oldest' | 'priceAsc' | 'priceDesc';

function sortOrderLabel(order: SortOrder): string {
  switch (order) {
    case 'newest':
      return 'Plus récents';
    case 'oldest':
      return 'Plus anciens';
    case 'priceAsc':
      return 'Prix croissants';
    case 'priceDesc':
      return 'Prix décroissants';
    default:
      return 'Plus récents';
  }
}

function rowHref(inv: StripeInvoiceRow): string | null {
  return inv.hostedInvoiceUrl || inv.invoicePdf || null;
}

function InvoiceListSkeletonRows({ rowCount = 6 }: { rowCount?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {Array.from({ length: rowCount }, (_, i) => (
        <div
          key={i}
          className="mes-factures-invoice-row"
          style={{ borderBottom: i < rowCount - 1 ? '1px solid #e8e6e3' : 'none' }}
        >
          <div
            className="mes-factures-invoice-row__download"
            style={{
              width: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
            }}
          >
            <div className="catalogue-skeleton" style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0 }} />
          </div>
          <div className="mes-factures-invoice-row__main" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div className="catalogue-skeleton" style={{ height: 15, width: '70%', borderRadius: 4 }} />
            <div className="catalogue-skeleton" style={{ height: 13, width: '90%', borderRadius: 4 }} />
          </div>
          <div className="mes-factures-invoice-row__price">
            <div className="catalogue-skeleton" style={{ width: 72, height: 18, borderRadius: 4, flexShrink: 0 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Barre de recherche + filtres approximatifs + liste en squelette (chargement auth / panneau). */
export function StripeSubscriptionInvoicesPanelChromeSkeleton() {
  return (
    <div className="stripe-subscription-invoices-panel stripe-subscription-invoices-panel--embedded" style={{ width: '100%' }}>
      <div style={{ marginBottom: 16 }}>
        <div className="catalogue-skeleton" style={{ width: '100%', height: 48, borderRadius: 10 }} />
      </div>
      <div className="mes-factures-filtres-row" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <div className="catalogue-skeleton" style={{ height: 44, width: 100, borderRadius: 12, flexShrink: 0 }} />
        <div className="catalogue-skeleton" style={{ height: 44, width: 120, borderRadius: 12, flexShrink: 0 }} />
        <div className="catalogue-skeleton" style={{ height: 44, width: 120, borderRadius: 12, flexShrink: 0 }} />
        <div
          className="mes-factures-sort-dropdown"
          style={{ marginLeft: 'auto', flexShrink: 0 }}
        >
          <div className="catalogue-skeleton" style={{ height: 44, width: 168, borderRadius: 12 }} />
        </div>
      </div>
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: 18,
          boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
          border: '1px solid #e8e6e3',
          overflow: 'hidden',
        }}
      >
        <InvoiceListSkeletonRows />
      </div>
    </div>
  );
}

/** PDF facture Stripe en priorité, sinon page facture hébergée. */
function downloadHref(inv: StripeInvoiceRow): string | null {
  return inv.invoicePdf || inv.hostedInvoiceUrl || null;
}

/** Liste des factures d’abonnement Stripe (intégrée à Mon abonnement). */
export function StripeSubscriptionInvoicesPanel({
  onHeadlineMeta,
}: {
  onHeadlineMeta?: (meta: StripeSubscriptionInvoicesHeadlineMeta) => void;
}) {
  const router = useRouter();
  const { user, seller, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [invoicesLoading, setInvoicesLoading] = useState(true);
  const [invoices, setInvoices] = useState<StripeInvoiceRow[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [datePresetOpen, setDatePresetOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const headlineMetaRef = useRef(onHeadlineMeta);
  headlineMetaRef.current = onHeadlineMeta;

  const toYMD = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
  const setPresetCeMois = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    setDateFrom(toYMD(start));
    setDateTo(toYMD(now));
    setDatePresetOpen(false);
  };
  const setPresetCeTrimestre = () => {
    const now = new Date();
    const q = Math.floor(now.getMonth() / 3) + 1;
    const start = new Date(now.getFullYear(), (q - 1) * 3, 1);
    setDateFrom(toYMD(start));
    setDateTo(toYMD(now));
    setDatePresetOpen(false);
  };
  const setPresetCetteAnnee = () => {
    const now = new Date();
    setDateFrom(`${now.getFullYear()}-01-01`);
    setDateTo(toYMD(now));
    setDatePresetOpen(false);
  };

  useEffect(() => {
    if (!authLoading && (!user || !seller)) {
      router.push('/connexion');
      return;
    }
    if (!authLoading && user && (seller?.status === 'rejected' || seller?.status === 'banned')) {
      router.replace('/profil');
      return;
    }
    if (!authLoading) setLoading(false);
  }, [authLoading, user, seller, router]);

  useEffect(() => {
    if (!seller?.stripeCustomerRegistered || loading) {
      if (!loading && seller && !seller.stripeCustomerRegistered) {
        setInvoicesLoading(false);
        headlineMetaRef.current?.({ kind: 'count', count: 0 });
      }
      return;
    }

    let cancelled = false;
    setInvoicesLoading(true);
    setLoadError(null);
    (async () => {
      try {
        let accessToken = (await getSession())?.access_token ?? null;
        const doFetch = (token: string) =>
          fetch('/api/vendeur/abonnement/stripe-invoices', {
            headers: { Authorization: `Bearer ${token}` },
          });

        let r: Response;
        if (accessToken) {
          r = await doFetch(accessToken);
        } else {
          r = new Response('{}', { status: 401, headers: { 'Content-Type': 'application/json' } });
        }
        if (r.status === 401) {
          accessToken = (await getValidAccessTokenForFetch()) ?? null;
          if (accessToken) r = await doFetch(accessToken);
        }

        const data = (await r.json().catch(() => ({}))) as { invoices?: StripeInvoiceRow[]; error?: string };
        if (cancelled) return;

        if (!r.ok) {
          const msg = typeof data.error === 'string' ? data.error : 'Erreur de chargement';
          setLoadError(msg);
          setInvoices([]);
          headlineMetaRef.current?.({ kind: 'error', message: msg });
          return;
        }

        const list = Array.isArray(data.invoices) ? data.invoices : [];
        setInvoices(list);
        headlineMetaRef.current?.({ kind: 'count', count: list.length });
      } catch {
        if (!cancelled) {
          setLoadError('Erreur réseau');
          headlineMetaRef.current?.({ kind: 'error', message: 'Erreur réseau' });
        }
      } finally {
        if (!cancelled) setInvoicesLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [seller?.stripeCustomerRegistered, loading]);

  const filteredAndSortedInvoices = useMemo(() => {
    let list = invoices.map((inv) => ({
      ...inv,
      issuedAt: new Date(inv.created * 1000),
    }));
    if (dateFrom) {
      const from = new Date(dateFrom);
      from.setHours(0, 0, 0, 0);
      list = list.filter((inv) => inv.issuedAt >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      list = list.filter((inv) => inv.issuedAt <= to);
    }
    const q = normalizeForSearch(searchQuery.trim());
    if (q) {
      list = list.filter(
        (inv) =>
          (inv.number && normalizeForSearch(inv.number).includes(q)) ||
          (inv.productTitle && normalizeForSearch(inv.productTitle).includes(q)) ||
          normalizeForSearch(statusLabel(inv.status)).includes(q) ||
          normalizeForSearch(formatDate(inv.issuedAt)).includes(q) ||
          normalizeForSearch(String(inv.total)).includes(q),
      );
    }
    list.sort((a, b) => {
      if (sortOrder === 'newest') return b.issuedAt.getTime() - a.issuedAt.getTime();
      if (sortOrder === 'oldest') return a.issuedAt.getTime() - b.issuedAt.getTime();
      if (sortOrder === 'priceAsc') return a.total - b.total;
      if (sortOrder === 'priceDesc') return b.total - a.total;
      return b.issuedAt.getTime() - a.issuedAt.getTime();
    });
    return list;
  }, [invoices, dateFrom, dateTo, sortOrder, searchQuery]);

  if (authLoading || loading) {
    return <StripeSubscriptionInvoicesPanelChromeSkeleton />;
  }

  if (!user || !seller) return null;

  if (!seller.stripeCustomerRegistered) {
    return (
      <p
        style={{
          fontSize: 14,
          color: '#6e6e73',
          textAlign: 'center',
          lineHeight: 1.6,
          fontFamily: 'var(--font-inter), var(--font-sans)',
          padding: '8px 0 0',
        }}
      >
        Aucune facturation n’est associée à votre compte pour l’instant.
      </p>
    );
  }

  const panelBody = (
    <>
        <div style={{ marginBottom: 16, position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#86868b', pointerEvents: 'none' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher dans mes factures..."
            autoComplete="off"
            style={{
              width: '100%',
              padding: '12px 16px 12px 44px',
              fontSize: 15,
              border: '1px solid #d2d2d7',
              borderRadius: 10,
              backgroundColor: '#fff',
              outline: 'none',
            }}
          />
        </div>

        <div className="mes-factures-filtres-row" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <div className="mes-factures-filtres-left" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16, flex: 1, minWidth: 0 }}>
            <div className="mes-factures-filtres-dates" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => {
                    setDatePresetOpen((o) => !o);
                    setSortDropdownOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    height: 44,
                    padding: '0 12px',
                    border: '1px solid #d2d2d7',
                    borderRadius: 12,
                    backgroundColor: '#fff',
                    fontSize: 14,
                    color: '#1d1d1f',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ color: '#6e6e73' }}>Date</span>
                  <ChevronDown size={16} style={{ opacity: datePresetOpen ? 0.7 : 0.5 }} />
                </button>
                {datePresetOpen && (
                  <>
                    <div
                      role="button"
                      tabIndex={-1}
                      style={{ position: 'fixed', inset: 0, zIndex: 10 }}
                      onClick={() => setDatePresetOpen(false)}
                      onKeyDown={() => {}}
                      aria-label="Fermer"
                    />
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        marginTop: 4,
                        zIndex: 11,
                        backgroundColor: '#fff',
                        border: '1px solid #d2d2d7',
                        borderRadius: 12,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                        minWidth: 160,
                        overflow: 'hidden',
                      }}
                    >
                      <button
                        type="button"
                        onClick={setPresetCeMois}
                        style={{
                          display: 'block',
                          width: '100%',
                          padding: '10px 14px',
                          textAlign: 'left',
                          fontSize: 14,
                          color: '#1d1d1f',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        Ce mois
                      </button>
                      <button
                        type="button"
                        onClick={setPresetCeTrimestre}
                        style={{
                          display: 'block',
                          width: '100%',
                          padding: '10px 14px',
                          textAlign: 'left',
                          fontSize: 14,
                          color: '#1d1d1f',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          borderTop: '1px solid #e8e8ed',
                        }}
                      >
                        Ce trimestre
                      </button>
                      <button
                        type="button"
                        onClick={setPresetCetteAnnee}
                        style={{
                          display: 'block',
                          width: '100%',
                          padding: '10px 14px',
                          textAlign: 'left',
                          fontSize: 14,
                          color: '#1d1d1f',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          borderTop: '1px solid #e8e8ed',
                        }}
                      >
                        Cette année
                      </button>
                    </div>
                  </>
                )}
              </div>
              <label style={{ fontSize: 14, color: '#6e6e73' }}>Entre</label>
              <input
                type="date"
                className="mes-factures-date-input"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                title="jj/mm/aaaa"
                style={{
                  height: 44,
                  padding: '0 12px',
                  border: '1px solid #d2d2d7',
                  borderRadius: 12,
                  fontSize: 14,
                  color: '#1d1d1f',
                }}
              />
              <label style={{ fontSize: 14, color: '#6e6e73' }}>et</label>
              <input
                type="date"
                className="mes-factures-date-input"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                title="jj/mm/aaaa"
                style={{
                  height: 44,
                  padding: '0 12px',
                  border: '1px solid #d2d2d7',
                  borderRadius: 12,
                  fontSize: 14,
                  color: '#1d1d1f',
                }}
              />
            </div>
            <span
              className="mes-factures-filtres-reset-wrap"
              role="button"
              tabIndex={0}
              onClick={() => {
                setDateFrom('');
                setDateTo('');
                setSearchQuery('');
                setSortOrder('newest');
                setSortDropdownOpen(false);
                setDatePresetOpen(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setDateFrom('');
                  setDateTo('');
                  setSearchQuery('');
                  setSortOrder('newest');
                  setSortDropdownOpen(false);
                  setDatePresetOpen(false);
                }
              }}
              style={{
                fontSize: 14,
                color: '#6e6e73',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              <span className="mes-factures-reset-desktop">Réinitialiser les filtres</span>
              <span className="mes-factures-reset-mobile">Réinitialiser</span>
            </span>
          </div>
          <div className="mes-factures-sort-dropdown" style={{ position: 'relative', marginLeft: 'auto' }}>
            <button
              type="button"
              onClick={() => setSortDropdownOpen((o) => !o)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                height: 44,
                padding: '0 14px 0 16px',
                border: '1px solid #d2d2d7',
                borderRadius: 12,
                backgroundColor: '#fff',
                fontSize: 14,
                color: '#1d1d1f',
                cursor: 'pointer',
                minWidth: 160,
              }}
            >
              <span>{sortOrderLabel(sortOrder)}</span>
              <ChevronDown size={16} style={{ color: '#86868b' }} />
            </button>
            {sortDropdownOpen && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setSortDropdownOpen(false)} />
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: 4,
                    backgroundColor: '#fff',
                    border: '1px solid #d2d2d7',
                    borderRadius: 12,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    zIndex: 20,
                    overflow: 'hidden',
                    minWidth: 160,
                  }}
                >
                  {(['newest', 'oldest', 'priceAsc', 'priceDesc'] as const).map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setSortOrder(key);
                        setSortDropdownOpen(false);
                      }}
                      style={{
                        display: 'block',
                        width: '100%',
                        padding: '10px 14px',
                        border: 'none',
                        background: sortOrder === key ? '#f5f5f7' : 'transparent',
                        fontSize: 14,
                        color: '#1d1d1f',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontWeight: sortOrder === key ? 600 : 400,
                        borderTop: key !== 'newest' ? '1px solid #e8e8ed' : undefined,
                      }}
                    >
                      {sortOrderLabel(key)}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div style={{ backgroundColor: '#fff', borderRadius: 18, boxShadow: '0 4px 24px rgba(0,0,0,0.06)', border: '1px solid #e8e6e3', overflow: 'hidden' }}>
          {loadError ? (
            <div style={{ padding: '40px 32px', textAlign: 'center' }}>
              <p style={{ fontSize: 15, color: '#991b1b' }}>{loadError}</p>
            </div>
          ) : invoicesLoading ? (
            <InvoiceListSkeletonRows />
          ) : filteredAndSortedInvoices.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {filteredAndSortedInvoices.map((inv) => {
                const href = rowHref(inv);
                const dl = downloadHref(inv);
                const baseTitle = inv.number ? `Facture ${inv.number}` : `Facture d’abonnement`;
                const title =
                  inv.productTitle?.trim() ? `${baseTitle} - ${inv.productTitle.trim()}` : baseTitle;
                const subtitle = `${formatDate(inv.issuedAt)} · ${statusLabel(inv.status)}`;
                const iconSquareStyle: CSSProperties = {
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  backgroundColor: '#f5f5f7',
                  border: '1px solid #e8e6e3',
                  flexShrink: 0,
                };
                const downloadBtnStyle: CSSProperties = {
                  ...iconSquareStyle,
                  color: '#6e6e73',
                  textDecoration: 'none',
                };
                /** Colonne = largeur du bouton (40px), alignée à gauche : même logique que le padding droit après le prix. */
                const downloadColStyle: CSSProperties = {
                  flexShrink: 0,
                  width: 40,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                };
                const invoiceTitleTypography: CSSProperties = {
                  fontSize: 15,
                  fontWeight: 600,
                  color: '#1d1d1f',
                  fontFamily: 'var(--font-inter), var(--font-sans)',
                };
                const titleStyle: CSSProperties = {
                  ...invoiceTitleTypography,
                  margin: 0,
                  marginBottom: 1,
                };
                return (
                  <div
                    key={inv.id}
                    className={`mes-factures-invoice-row${!dl ? ' mes-factures-invoice-row--no-pdf' : ''}`}
                  >
                    <div className="mes-factures-invoice-row__download" style={downloadColStyle}>
                      {dl ? (
                        <a
                          href={dl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mes-factures-download-btn"
                          style={downloadBtnStyle}
                          title={inv.invoicePdf ? 'Télécharger la facture (PDF)' : 'Ouvrir la facture'}
                          aria-label={
                            inv.invoicePdf ? 'Télécharger le PDF de la facture' : 'Ouvrir la page de la facture'
                          }
                          onClick={(e) => {
                            e.preventDefault();
                            window.open(dl, '_blank', 'noopener,noreferrer');
                          }}
                        >
                          <span className="mes-factures-download-btn__icon" aria-hidden>
                            <Download size={18} strokeWidth={2} />
                          </span>
                          <span className="mes-factures-download-btn__label">Télécharger</span>
                        </a>
                      ) : null}
                    </div>
                    <div className="mes-factures-invoice-row__main">
                      {href ? (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mes-factures-title-link"
                          style={{
                            ...titleStyle,
                            textDecoration: 'none',
                            display: 'inline-block',
                            maxWidth: '100%',
                            wordBreak: 'break-word',
                          }}
                          title={title}
                          aria-label={`Voir la facture : ${title}`}
                        >
                          {title}
                        </a>
                      ) : (
                        <p style={titleStyle}>{title}</p>
                      )}
                      <p style={{ fontSize: 13, color: '#6e6e73', margin: 0 }}>{subtitle}</p>
                    </div>
                    <div className="mes-factures-invoice-row__price" style={invoiceTitleTypography}>
                      {formatPrice(inv.total, inv.currency)}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : searchQuery.trim() ? (
            <div style={{ padding: '40px 32px', textAlign: 'center' }}>
              <p style={{ fontSize: 15, color: '#6e6e73' }}>Aucun résultat pour « {searchQuery.trim()} »</p>
            </div>
          ) : dateFrom || dateTo ? (
            <div style={{ padding: '40px 32px', textAlign: 'center' }}>
              <p style={{ fontSize: 15, color: '#6e6e73' }}>Aucune facture sur la période sélectionnée.</p>
            </div>
          ) : (
            <div style={{ padding: '40px 32px', textAlign: 'center' }}>
              <p style={{ fontSize: 15, color: '#6e6e73' }}>Aucune facture.</p>
            </div>
          )}
        </div>
    </>
  );

  return (
    <div className="stripe-subscription-invoices-panel stripe-subscription-invoices-panel--embedded" style={{ width: '100%' }}>
      {panelBody}
    </div>
  );
}
