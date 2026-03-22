'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, Search, Download, Eye } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getValidAccessTokenForFetch } from '@/lib/supabase/auth';

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
      return 'Prix croissant';
    case 'priceDesc':
      return 'Prix décroissant';
    default:
      return 'Plus récents';
  }
}

function rowHref(inv: StripeInvoiceRow): string | null {
  return inv.hostedInvoiceUrl || inv.invoicePdf || null;
}

/** PDF facture Stripe en priorité, sinon page facture hébergée. */
function downloadHref(inv: StripeInvoiceRow): string | null {
  return inv.invoicePdf || inv.hostedInvoiceUrl || null;
}

export type StripeSubscriptionInvoicesPanelVariant = 'page' | 'embedded';

export function StripeSubscriptionInvoicesPanel({
  variant = 'page',
}: {
  variant?: StripeSubscriptionInvoicesPanelVariant;
}) {
  const embedded = variant === 'embedded';
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
      }
      return;
    }

    let cancelled = false;
    setInvoicesLoading(true);
    setLoadError(null);
    (async () => {
      try {
        const accessToken = await getValidAccessTokenForFetch();
        if (!accessToken) {
          router.push('/connexion');
          return;
        }
        const r = await fetch('/api/vendeur/abonnement/stripe-invoices', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const data = (await r.json().catch(() => ({}))) as { invoices?: StripeInvoiceRow[]; error?: string };
        if (cancelled) return;
        if (!r.ok) {
          setLoadError(typeof data.error === 'string' ? data.error : 'Erreur de chargement');
          setInvoices([]);
          return;
        }
        setInvoices(Array.isArray(data.invoices) ? data.invoices : []);
      } catch {
        if (!cancelled) setLoadError('Erreur réseau');
      } finally {
        if (!cancelled) setInvoicesLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [seller?.stripeCustomerRegistered, loading, router]);

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
    if (embedded) {
      return (
        <p
          style={{
            textAlign: 'center',
            padding: '32px 16px',
            fontSize: 15,
            color: '#6e6e73',
            fontFamily: 'var(--font-inter), var(--font-sans)',
          }}
        >
          Chargement...
        </p>
      );
    }
    return (
      <div style={{ paddingTop: 'var(--header-height)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontSize: 15, color: '#6e6e73' }}>Chargement...</p>
      </div>
    );
  }

  if (!user || !seller) return null;

  if (!seller.stripeCustomerRegistered) {
    if (embedded) {
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
          Aucune facturation Stripe n’est associée à votre compte pour l’instant. Les factures apparaîtront après souscription à Plus ou Pro.
        </p>
      );
    }
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
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {Array.from({ length: 6 }, (_, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    padding: '18px 24px',
                    borderBottom: i < 5 ? '1px solid #e8e6e3' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <div className="catalogue-skeleton" style={{ width: 48, height: 48, borderRadius: 12, flexShrink: 0 }} />
                    <div className="catalogue-skeleton" style={{ width: 48, height: 48, borderRadius: 12, flexShrink: 0 }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div className="catalogue-skeleton" style={{ height: 15, width: '70%', borderRadius: 4 }} />
                    <div className="catalogue-skeleton" style={{ height: 13, width: '90%', borderRadius: 4 }} />
                  </div>
                  <div className="catalogue-skeleton" style={{ width: 72, height: 18, borderRadius: 4, flexShrink: 0 }} />
                </div>
              ))}
            </div>
          ) : filteredAndSortedInvoices.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {filteredAndSortedInvoices.map((inv) => {
                const href = rowHref(inv);
                const dl = downloadHref(inv);
                const baseTitle = inv.number ? `Facture ${inv.number}` : `Facture d’abonnement`;
                const title =
                  inv.productTitle?.trim() ? `${baseTitle} - ${inv.productTitle.trim()}` : baseTitle;
                const subtitle = `${formatDate(inv.issuedAt)} · ${statusLabel(inv.status)}`;
                const rowStyle: CSSProperties = {
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: '18px 24px',
                  borderBottom: '1px solid #e8e6e3',
                };
                const iconSquareStyle: CSSProperties = {
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  backgroundColor: '#f5f5f7',
                  border: '1px solid #e8e6e3',
                  flexShrink: 0,
                };
                const downloadBtnStyle: CSSProperties = {
                  ...iconSquareStyle,
                  color: '#6e6e73',
                  textDecoration: 'none',
                };
                const viewIconInner = <Eye size={22} color="#6e6e73" strokeWidth={2} aria-hidden />;
                return (
                  <div key={inv.id} style={rowStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      {dl ? (
                        <a
                          href={dl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={downloadBtnStyle}
                          title={inv.invoicePdf ? 'Télécharger la facture (PDF)' : 'Ouvrir la facture'}
                          aria-label={
                            inv.invoicePdf ? 'Télécharger le PDF de la facture' : 'Ouvrir la page de la facture'
                          }
                        >
                          <Download size={22} strokeWidth={2} aria-hidden />
                        </a>
                      ) : null}
                      {href ? (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ ...iconSquareStyle, color: '#6e6e73', textDecoration: 'none', cursor: 'pointer' }}
                          title="Voir la facture"
                          aria-label="Voir la facture"
                        >
                          {viewIconInner}
                        </a>
                      ) : (
                        <div style={iconSquareStyle}>{viewIconInner}</div>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 15, fontWeight: 600, color: '#1d1d1f', margin: 0, marginBottom: 2 }}>{title}</p>
                      <p style={{ fontSize: 13, color: '#6e6e73', margin: 0 }}>{subtitle}</p>
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 600, color: '#1d1d1f', flexShrink: 0 }}>
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

  if (embedded) {
    return (
      <div className="stripe-subscription-invoices-panel stripe-subscription-invoices-panel--embedded" style={{ width: '100%' }}>
        {panelBody}
      </div>
    );
  }

  const pageSubtitle =
    invoicesLoading
      ? 'Chargement des factures...'
      : loadError
        ? loadError
        : `${filteredAndSortedInvoices.length} ${filteredAndSortedInvoices.length === 1 ? 'facture' : 'factures'}`;

  return (
    <div style={{ paddingTop: 'var(--header-height)', minHeight: '100vh' }}>
      <div className="mes-factures-page-inner" style={{ maxWidth: 1200, margin: '0 auto', padding: '30px calc(20px + 1cm - 0.5mm) 60px' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: 28, fontWeight: 500, marginBottom: 8, color: '#1d1d1f' }}>
            Mes factures
          </h1>
          <p style={{ fontSize: 14, color: '#888' }}>{pageSubtitle}</p>
        </div>
        {panelBody}
      </div>
    </div>
  );
}
