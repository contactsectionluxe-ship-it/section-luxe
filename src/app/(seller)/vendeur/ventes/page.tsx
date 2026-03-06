'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Package, Clock, Heart, MessageCircle, Phone, CheckCircle, Plus, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getSellerSalesStats, type SellerSalesStats, getSellerSalesEvolution, getMonthLabel, type MonthEvolution, getSellerDeletionsByReason, type DeletionItem } from '@/lib/supabase/sales';

function formatAmountCents(cents: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(cents / 100);
}

export default function MesVentesPage() {
  const router = useRouter();
  const { user, seller, loading: authLoading, isApprovedSeller } = useAuth();
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [stats, setStats] = useState<SellerSalesStats | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [evolution, setEvolution] = useState<MonthEvolution[]>([]);
  const [evolutionLoading, setEvolutionLoading] = useState(true);
  const [chartMode, setChartMode] = useState<'volume' | 'montant'>('volume');
  const [showVenduPopup, setShowVenduPopup] = useState(false);
  const [venduList, setVenduList] = useState<DeletionItem[]>([]);
  const [venduListLoading, setVenduListLoading] = useState(false);
  const [showReservePopup, setShowReservePopup] = useState(false);
  const [reserveList, setReserveList] = useState<DeletionItem[]>([]);
  const [reserveListLoading, setReserveListLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || !seller)) {
      router.push('/connexion');
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [authLoading, user, seller, router]);

  useEffect(() => {
    if (!user?.uid) {
      setStatsLoading(false);
      return;
    }
    let cancelled = false;
    setStatsLoading(true);
    getSellerSalesStats(user.uid, {
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    })
      .then((data) => {
        if (!cancelled) setStats(data);
      })
      .catch((e) => {
        const msg = e?.message ?? (typeof e === 'string' ? e : String(e));
        console.error('Chargement stats ventes:', msg || e);
        if (!cancelled) {
          setStats({
            createdInPeriod: 0,
            deletedByReason: { vendu: 0, reserve: 0, erreur: 0, retire: 0, autre: 0 },
            totalAmountVenduCents: 0,
            totalAmountReserveCents: 0,
            activeInPeriod: 0,
            totalLikesInPeriod: 0,
            totalMessagesInPeriod: 0,
            totalAppelsInPeriod: 0,
          });
        }
      })
      .finally(() => {
        if (!cancelled) setStatsLoading(false);
      });
    return () => { cancelled = true; };
  }, [user?.uid, dateFrom, dateTo]);

  useEffect(() => {
    if (!user?.uid) {
      setEvolutionLoading(false);
      return;
    }
    let cancelled = false;
    setEvolutionLoading(true);
    getSellerSalesEvolution(user.uid)
      .then((data) => { if (!cancelled) setEvolution(data); })
      .catch(() => { if (!cancelled) setEvolution([]); })
      .finally(() => { if (!cancelled) setEvolutionLoading(false); });
    return () => { cancelled = true; };
  }, [user?.uid]);

  if (authLoading || loading) {
    return (
      <div style={{ paddingTop: 'var(--header-height)', minHeight: '100vh', backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontSize: 15, color: '#6e6e73' }}>Chargement...</p>
      </div>
    );
  }

  if (!user || !seller) return null;

  return (
    <div style={{ paddingTop: 'var(--header-height)', minHeight: '100vh', backgroundColor: '#ffffff' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '30px calc(20px + 1cm - 0.5mm) 60px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: 28, fontWeight: 500, marginBottom: 8, color: '#1d1d1f' }}>
              Mes ventes
            </h1>
            <p style={{ fontSize: 14, color: '#888', margin: 0 }}>
              Suivi des ventes
            </p>
          </div>
          {isApprovedSeller && (
            <Link href="/vendeur/annonces/nouvelle" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 20px', backgroundColor: '#000', color: '#fff', fontSize: 14, fontWeight: 500, borderRadius: 12 }}>
              <Plus size={18} /> Déposer une annonce
            </Link>
          )}
        </div>

        {/* Filtres dates (même style que Mes factures) */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16, marginBottom: 24 }}>
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
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); setDateFrom(''); setDateTo(''); }}
              style={{ fontSize: 14, color: '#6e6e73', cursor: 'pointer', textDecoration: 'underline', background: 'none', border: 'none', padding: 0, fontFamily: 'var(--font-inter), var(--font-sans)' }}
            >
              Réinitialiser les filtres
            </button>
          </div>
        </div>

        {/* Stats période : mêmes cases que Mes annonces (filtrées par dates) — icônes toujours visibles, seul le chiffre change */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
          <div style={{ padding: 16, border: '1px solid #e8e6e3', borderRadius: 12, backgroundColor: '#fff', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, backgroundColor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, flexShrink: 0 }}>
              <Package size={22} color="#666" />
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 11, color: '#888' }}>Annonces publiées</p>
              <p style={{ fontSize: 22, fontWeight: 600, minHeight: 28, display: 'flex', alignItems: 'center' }}>
                {stats?.createdInPeriod ?? 0}
              </p>
            </div>
          </div>
          <div style={{ padding: 16, border: '1px solid #e8e6e3', borderRadius: 12, backgroundColor: '#fff', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, backgroundColor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, flexShrink: 0 }}>
              <Heart size={22} color="#666" />
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 11, color: '#888' }}>Total likes</p>
              <p style={{ fontSize: 22, fontWeight: 600, minHeight: 28, display: 'flex', alignItems: 'center' }}>
                {stats?.totalLikesInPeriod ?? 0}
              </p>
            </div>
          </div>
          <div style={{ padding: 16, border: '1px solid #e8e6e3', borderRadius: 12, backgroundColor: '#fff', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, backgroundColor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, flexShrink: 0 }}>
              <MessageCircle size={22} color="#666" />
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 11, color: '#888' }}>Total messages</p>
              <p style={{ fontSize: 22, fontWeight: 600, minHeight: 28, display: 'flex', alignItems: 'center' }}>
                {stats?.totalMessagesInPeriod ?? 0}
              </p>
            </div>
          </div>
          <div style={{ padding: 16, border: '1px solid #e8e6e3', borderRadius: 12, backgroundColor: '#fff', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, backgroundColor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, flexShrink: 0 }}>
              <Phone size={22} color="#666" />
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 11, color: '#888' }}>Total appels</p>
              <p style={{ fontSize: 22, fontWeight: 600, minHeight: 28, display: 'flex', alignItems: 'center' }}>
                {stats?.totalAppelsInPeriod ?? 0}
              </p>
            </div>
          </div>
        </div>

        {/* Stats : annonces mises en ligne / supprimées — icônes et textes statiques, seul le chiffre change */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 24 }}>
          <div style={{ padding: 20, border: '1px solid #e8e6e3', borderRadius: 12, backgroundColor: '#fff', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ width: 44, height: 44, backgroundColor: '#f5f5f7', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10 }}>
                <CheckCircle size={22} color="#666" />
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowVenduPopup(true);
                  setVenduListLoading(true);
                  if (!user?.uid) return;
                  getSellerDeletionsByReason(user.uid, 'vendu', { dateFrom: dateFrom || undefined, dateTo: dateTo || undefined })
                    .then(setVenduList)
                    .finally(() => setVenduListLoading(false));
                }}
                style={{ padding: '8px 16px', fontSize: 14, fontWeight: 500, border: '1px solid #d2d2d7', borderRadius: 10, background: '#1d1d1f', color: '#fff', cursor: 'pointer' }}
              >
                Voir
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0 24px', alignItems: 'baseline' }}>
              <p style={{ fontSize: 12, color: '#888', margin: 0, marginBottom: 4 }}>Article vendu</p>
              <p style={{ fontSize: 12, color: '#888', margin: 0, marginBottom: 4, textAlign: 'right' }}>Montant</p>
              <p style={{ fontSize: 24, fontWeight: 600, color: '#1d1d1f', margin: 0, minHeight: 32, display: 'flex', alignItems: 'center' }}>
                {stats?.deletedByReason?.vendu ?? 0}
              </p>
              <p style={{ fontSize: 24, fontWeight: 600, color: '#1d1d1f', margin: 0, minHeight: 32, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                {formatAmountCents(stats?.totalAmountVenduCents ?? 0)}
              </p>
              <p style={{ fontSize: 12, color: '#86868b', marginTop: 4, marginBottom: 0 }}>
                sur la période
              </p>
              <p style={{ fontSize: 12, color: '#86868b', marginTop: 4, marginBottom: 0, textAlign: 'right' }}>sur la période</p>
            </div>
          </div>
          <div style={{ padding: 20, border: '1px solid #e8e6e3', borderRadius: 12, backgroundColor: '#fff', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ width: 44, height: 44, backgroundColor: '#f5f5f7', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10 }}>
                <Clock size={22} color="#666" />
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowReservePopup(true);
                  setReserveListLoading(true);
                  if (!user?.uid) return;
                  getSellerDeletionsByReason(user.uid, 'reserve', { dateFrom: dateFrom || undefined, dateTo: dateTo || undefined })
                    .then(setReserveList)
                    .finally(() => setReserveListLoading(false));
                }}
                style={{ padding: '8px 16px', fontSize: 14, fontWeight: 500, border: '1px solid #d2d2d7', borderRadius: 10, background: '#1d1d1f', color: '#fff', cursor: 'pointer' }}
              >
                Voir
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0 24px', alignItems: 'baseline' }}>
              <p style={{ fontSize: 12, color: '#888', margin: 0, marginBottom: 4 }}>Article réservé</p>
              <p style={{ fontSize: 12, color: '#888', margin: 0, marginBottom: 4, textAlign: 'right' }}>Montant</p>
              <p style={{ fontSize: 24, fontWeight: 600, color: '#1d1d1f', margin: 0, minHeight: 32, display: 'flex', alignItems: 'center' }}>
                {stats?.deletedByReason?.reserve ?? 0}
              </p>
              <p style={{ fontSize: 24, fontWeight: 600, color: '#1d1d1f', margin: 0, minHeight: 32, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                {formatAmountCents(stats?.totalAmountReserveCents ?? 0)}
              </p>
              <p style={{ fontSize: 12, color: '#86868b', marginTop: 4, marginBottom: 0 }}>
                sur la période
              </p>
              <p style={{ fontSize: 12, color: '#86868b', marginTop: 4, marginBottom: 0, textAlign: 'right' }}>sur la période</p>
            </div>
          </div>
        </div>

        {/* Popup Articles vendus sur la période */}
        {showVenduPopup && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: 'rgba(0,0,0,0.4)' }} onClick={() => setShowVenduPopup(false)}>
            <div style={{ backgroundColor: '#fff', borderRadius: 18, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', maxWidth: 480, width: '100%', maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid #e8e6e3' }}>
                <h3 style={{ fontFamily: 'var(--font-inter), var(--font-sans)', fontSize: 18, fontWeight: 600, margin: 0, color: '#1d1d1f' }}>
                  Articles vendus {dateFrom || dateTo ? 'sur la période' : ''}
                </h3>
                <button type="button" onClick={() => setShowVenduPopup(false)} style={{ padding: 8, border: 'none', background: 'none', cursor: 'pointer', color: '#86868b', display: 'flex' }} aria-label="Fermer">
                  <X size={22} />
                </button>
              </div>
              <div style={{ overflowY: 'auto', flex: 1, padding: 16 }}>
                {venduListLoading ? (
                  <p style={{ fontSize: 14, color: '#86868b', textAlign: 'center', padding: 24 }}>Chargement...</p>
                ) : venduList.length === 0 ? (
                  <p style={{ fontSize: 14, color: '#86868b', textAlign: 'center', padding: 24 }}>Aucun article vendu sur cette période.</p>
                ) : (
                  <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                    {venduList.map((item) => (
                      <li key={item.id} style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 14, color: '#1d1d1f', flex: 1, minWidth: 0 }}>{item.listingTitle || 'Sans titre'}</span>
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#1d1d1f', flexShrink: 0 }}>{item.amountCents != null ? formatAmountCents(item.amountCents) : '—'}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Popup Articles réservés sur la période */}
        {showReservePopup && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: 'rgba(0,0,0,0.4)' }} onClick={() => setShowReservePopup(false)}>
            <div style={{ backgroundColor: '#fff', borderRadius: 18, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', maxWidth: 480, width: '100%', maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid #e8e6e3' }}>
                <h3 style={{ fontFamily: 'var(--font-inter), var(--font-sans)', fontSize: 18, fontWeight: 600, margin: 0, color: '#1d1d1f' }}>
                  Articles réservés {dateFrom || dateTo ? 'sur la période' : ''}
                </h3>
                <button type="button" onClick={() => setShowReservePopup(false)} style={{ padding: 8, border: 'none', background: 'none', cursor: 'pointer', color: '#86868b', display: 'flex' }} aria-label="Fermer">
                  <X size={22} />
                </button>
              </div>
              <div style={{ overflowY: 'auto', flex: 1, padding: 16 }}>
                {reserveListLoading ? (
                  <p style={{ fontSize: 14, color: '#86868b', textAlign: 'center', padding: 24 }}>Chargement...</p>
                ) : reserveList.length === 0 ? (
                  <p style={{ fontSize: 14, color: '#86868b', textAlign: 'center', padding: 24 }}>Aucun article réservé sur cette période.</p>
                ) : (
                  <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                    {reserveList.map((item) => (
                      <li key={item.id} style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 14, color: '#1d1d1f', flex: 1, minWidth: 0 }}>{item.listingTitle || 'Sans titre'}</span>
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#1d1d1f', flexShrink: 0 }}>{item.amountCents != null ? formatAmountCents(item.amountCents) : '—'}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Graphique évolution des ventes — 12 derniers mois */}
        <div style={{ backgroundColor: '#fff', borderRadius: 12, border: '1px solid #e8e6e3', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', padding: 24, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
            <h2 style={{ fontFamily: 'var(--font-inter), var(--font-sans)', fontSize: 16, fontWeight: 400, margin: 0, color: '#888' }}>
              Évolution des ventes des 12 derniers mois
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={() => setChartMode('volume')}
              style={{
                padding: '8px 16px',
                fontSize: 14,
                fontWeight: 500,
                border: '1px solid #d2d2d7',
                borderRadius: 10,
                background: chartMode === 'volume' ? '#1d1d1f' : '#fff',
                color: chartMode === 'volume' ? '#fff' : '#1d1d1f',
                cursor: 'pointer',
              }}
            >
              Volume
            </button>
            <button
              type="button"
              onClick={() => setChartMode('montant')}
              style={{
                padding: '8px 16px',
                fontSize: 14,
                fontWeight: 500,
                border: '1px solid #d2d2d7',
                borderRadius: 10,
                background: chartMode === 'montant' ? '#1d1d1f' : '#fff',
                color: chartMode === 'montant' ? '#fff' : '#1d1d1f',
                cursor: 'pointer',
              }}
            >
              Montant
            </button>
            </div>
          </div>
          {evolutionLoading ? (
            <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#86868b', fontSize: 14 }}>
              Chargement du graphique...
            </div>
          ) : (() => {
            const chartHeight = 180;
            const values = evolution.map((m) => (chartMode === 'volume' ? m.volume : m.amountCents / 100));
            const maxVal = Math.max(1, ...values);
            const gridLines = 5;
            const n = evolution.length;
            const points = values.map((v, i) => {
              const x = n > 1 ? (i / (n - 1)) * 100 : 50;
              const y = chartHeight - (v / maxVal) * chartHeight;
              return `${x},${y}`;
            }).join(' ');
            const areaPoints = `0,${chartHeight} ${points} 100,${chartHeight}`;
            return (
              <div style={{ width: '100%' }}>
                <svg viewBox={`0 0 100 ${chartHeight}`} preserveAspectRatio="none" style={{ width: '100%', height: chartHeight, display: 'block' }}>
                  <defs>
                    <linearGradient id="chartGradient" x1="0" x2="0" y1="1" y2="0">
                      <stop offset="0%" stopColor="#1d1d1f" stopOpacity="0.12" />
                      <stop offset="100%" stopColor="#1d1d1f" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {/* Lignes de grille horizontales */}
                  {Array.from({ length: gridLines + 1 }).map((_, i) => (
                    <line key={i} x1="0" y1={(i / gridLines) * chartHeight} x2="100" y2={(i / gridLines) * chartHeight} stroke="#e5e5e7" strokeWidth="0.3" />
                  ))}
                  {/* Zone sous la courbe */}
                  {maxVal > 0 && <polygon points={areaPoints} fill="url(#chartGradient)" />}
                  {/* Courbe */}
                  {maxVal > 0 && <polyline points={points} fill="none" stroke="#1d1d1f" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" />}
                </svg>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                  {evolution.map((m) => (
                    <span key={`${m.year}-${m.month}`} style={{ fontSize: 11, color: '#86868b', flex: 1, textAlign: 'center', minWidth: 0 }}>
                      {getMonthLabel(m)}
                    </span>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>

      </div>
    </div>
  );
}
