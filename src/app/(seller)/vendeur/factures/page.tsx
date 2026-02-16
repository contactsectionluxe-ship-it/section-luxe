'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FileText, ChevronDown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getSellerInvoices, ensureInvoicesForActiveListings, type SellerInvoice } from '@/lib/supabase/invoices';

function formatPrice(cents: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(cents / 100);
}

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }).format(d);
}

type SortOrder = 'newest' | 'oldest';

export default function FacturesPage() {
  const router = useRouter();
  const { user, seller, isSeller, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<SellerInvoice[]>([]);
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || !seller)) {
      router.push('/connexion');
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [authLoading, user, seller, router]);

  useEffect(() => {
    if (!user?.uid) return;
    let cancelled = false;
    (async () => {
      try {
        await ensureInvoicesForActiveListings(user.uid);
        if (cancelled) return;
        const list = await getSellerInvoices(user.uid);
        if (cancelled) return;
        setInvoices(list);
      } catch (e) {
        console.error('Chargement factures', e);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.uid]);

  const filteredAndSortedInvoices = useMemo(() => {
    let list = [...invoices];
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
    list.sort((a, b) =>
      sortOrder === 'newest'
        ? b.issuedAt.getTime() - a.issuedAt.getTime()
        : a.issuedAt.getTime() - b.issuedAt.getTime()
    );
    return list;
  }, [invoices, dateFrom, dateTo, sortOrder]);

  if (authLoading || loading) {
    return (
      <div style={{ paddingTop: 'var(--header-height)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fbfbfb' }}>
        <p style={{ fontSize: 15, color: '#6e6e73' }}>Chargement...</p>
      </div>
    );
  }

  if (!user || !seller) return null;

  return (
    <div style={{ paddingTop: 'var(--header-height)', minHeight: '100vh', backgroundColor: '#fbfbfb' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '30px calc(20px + 1cm - 0.5mm) 60px' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: 28, fontWeight: 500, marginBottom: 8, color: '#1d1d1f' }}>
            Mes factures
          </h1>
          <p style={{ fontSize: 14, color: '#888' }}>
            {invoices.length === 0
              ? 'Consulter et télécharger les factures liées à la publication de vos annonces'
              : `${filteredAndSortedInvoices.length} ${filteredAndSortedInvoices.length === 1 ? 'facture' : 'factures'} (émetteur : Section luxe)`}
          </p>
        </div>

        {invoices.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <div style={{ position: 'relative' }}>
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
                <span>{sortOrder === 'newest' ? 'Plus récents' : 'Plus anciens'}</span>
                <ChevronDown size={16} style={{ color: '#86868b' }} />
              </button>
              {sortDropdownOpen && (
                <>
                  <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setSortDropdownOpen(false)} />
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
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
                    <button
                      type="button"
                      onClick={() => { setSortOrder('newest'); setSortDropdownOpen(false); }}
                      style={{
                        display: 'block',
                        width: '100%',
                        padding: '10px 14px',
                        border: 'none',
                        background: sortOrder === 'newest' ? '#f5f5f7' : 'transparent',
                        fontSize: 14,
                        color: '#1d1d1f',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontWeight: sortOrder === 'newest' ? 600 : 400,
                      }}
                    >
                      Plus récents
                    </button>
                    <button
                      type="button"
                      onClick={() => { setSortOrder('oldest'); setSortDropdownOpen(false); }}
                      style={{
                        display: 'block',
                        width: '100%',
                        padding: '10px 14px',
                        border: 'none',
                        background: sortOrder === 'oldest' ? '#f5f5f7' : 'transparent',
                        fontSize: 14,
                        color: '#1d1d1f',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontWeight: sortOrder === 'oldest' ? 600 : 400,
                      }}
                    >
                      Plus anciens
                    </button>
                  </div>
                </>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <label style={{ fontSize: 14, color: '#6e6e73' }}>Entre</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
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
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                style={{
                  height: 44,
                  padding: '0 12px',
                  border: '1px solid #d2d2d7',
                  borderRadius: 12,
                  fontSize: 14,
                  color: '#1d1d1f',
                }}
              />
              <span
                role="button"
                tabIndex={0}
                onClick={() => { setDateFrom(''); setDateTo(''); setSortOrder('newest'); setSortDropdownOpen(false); }}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setDateFrom(''); setDateTo(''); setSortOrder('newest'); setSortDropdownOpen(false); } }}
                style={{
                  fontSize: 14,
                  color: '#6e6e73',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Réinitialiser les filtres
              </span>
            </div>
          </div>
        )}

        <div style={{ backgroundColor: '#fff', borderRadius: 18, boxShadow: '0 4px 24px rgba(0,0,0,0.06)', border: '1px solid #e8e6e3', overflow: 'hidden' }}>
          {filteredAndSortedInvoices.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {filteredAndSortedInvoices.map((inv) => (
                <Link
                  key={inv.id}
                  href={`/vendeur/factures/${inv.id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    padding: '18px 24px',
                    borderBottom: '1px solid #e8e6e3',
                    textDecoration: 'none',
                    color: 'inherit',
                    cursor: 'pointer',
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      backgroundColor: '#f5f5f7',
                      border: '1px solid #e8e6e3',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <FileText size={22} color="#6e6e73" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 15, fontWeight: 600, color: '#1d1d1f', margin: 0, marginBottom: 2 }}>
                      {inv.listingTitle || 'Annonce'}
                    </p>
                    <p style={{ fontSize: 13, color: '#6e6e73', margin: 0 }}>
                      {inv.invoiceNumber} · {formatDate(inv.issuedAt)} · Émetteur : {inv.issuer}
                    </p>
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 600, color: '#1d1d1f', flexShrink: 0 }}>
                    {formatPrice(inv.amountCents)}
                  </div>
                </Link>
              ))}
            </div>
          ) : invoices.length === 0 ? (
            <div style={{ padding: '56px 32px', textAlign: 'center' }}>
              <div
                style={{
                  width: 72,
                  height: 72,
                  margin: '0 auto 24px',
                  borderRadius: '50%',
                  backgroundColor: '#f5f5f7',
                  border: '1px solid #e8e6e3',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FileText size={32} color="#86868b" />
              </div>
              <h2 style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: 20, fontWeight: 500, marginBottom: 8, color: '#1d1d1f' }}>
                Aucune facture pour le moment
              </h2>
            </div>
          ) : (
            <div style={{ padding: '40px 32px', textAlign: 'center' }}>
              <p style={{ fontSize: 15, color: '#6e6e73' }}>
                Aucune facture sur la période sélectionnée. Modifiez les dates ou réinitialisez les filtres.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
