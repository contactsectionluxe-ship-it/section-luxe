'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Package, Clock, Heart, MessageCircle, Phone, CheckCircle, Plus, X, XCircle, Trash2, ShoppingBag, ChevronDown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getSellerSalesStats, type SellerSalesStats, getSellerSalesEvolution, getMonthLabel, type MonthEvolution, getSellerDeletionsByReason, deleteListingDeletion, updateListingDeletionReason, type DeletionItem } from '@/lib/supabase/sales';
import { updateListing, deleteListing } from '@/lib/supabase/listings';
import { isSubscriptionLimitError } from '@/lib/subscription';

function formatAmountCents(cents: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(cents / 100);
}

function formatVenduLe(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `Vendu le ${day}/${month}/${year}`;
}

function formatReserveLe(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `Réservé le ${day}/${month}/${year}`;
}

function formatAmountChart(cents: number): string {
  const euros = Math.round(cents / 100);
  return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0, minimumFractionDigits: 0 }).format(euros)} €`;
}

/** Fausses données aléatoires sur 12 mois pour tester le graphique (mettre à false en prod). */
const USE_FAKE_EVOLUTION = false;

function buildFakeEvolution(): MonthEvolution[] {
  const now = new Date();
  const result: MonthEvolution[] = [];
  const volumes = [120, 0, 45, 180, 220, 95, 150, 195, 110, 75, 250, 165];
  const amounts = [85000000, 0, 45000000, 280000000, 165000000, 320000000, 190000000, 95000000, 410000000, 220000000, 380000000, 270000000];
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    result.push({
      year: d.getFullYear(),
      month: d.getMonth(),
      volume: volumes[i],
      amountCents: amounts[i],
    });
  }
  return result;
}

function MesVentesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, seller, loading: authLoading, isApprovedSeller } = useAuth();
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [stats, setStats] = useState<SellerSalesStats | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [datePresetOpen, setDatePresetOpen] = useState(false);
  const [evolution, setEvolution] = useState<MonthEvolution[]>([]);

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
  const [evolutionLoading, setEvolutionLoading] = useState(true);
  const [chartMode, setChartMode] = useState<'volume' | 'montant'>('volume');
  const [showVenduPopup, setShowVenduPopup] = useState(false);
  const [venduList, setVenduList] = useState<DeletionItem[]>([]);
  const [venduListLoading, setVenduListLoading] = useState(false);
  const [showReservePopup, setShowReservePopup] = useState(false);
  const [reserveList, setReserveList] = useState<DeletionItem[]>([]);
  const [depotInactiveLimiteBanner, setDepotInactiveLimiteBanner] = useState(false);
  const [reserveListLoading, setReserveListLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [reserveAction, setReserveAction] = useState<{ id: string; listingId: string; action: 'vendu' | 'annule' } | null>(null);
  const [reserveActionLoading, setReserveActionLoading] = useState(false);
  const [reserveHighlightId, setReserveHighlightId] = useState<string | null>(null);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const onMatch = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    setIsMobile(mq.matches);
    mq.addEventListener('change', onMatch);
    return () => mq.removeEventListener('change', onMatch);
  }, []);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && sessionStorage.getItem('listingDepotInactiveLimite') === '1') {
        sessionStorage.removeItem('listingDepotInactiveLimite');
        setDepotInactiveLimiteBanner(true);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!authLoading && (!user || !seller)) {
      router.push('/connexion');
      return;
    }
    if (!authLoading && user && (seller?.status === 'rejected' || seller?.status === 'banned')) {
      router.replace('/profil');
      return;
    }
    if (!authLoading) {
      setLoading(false);
    }
  }, [authLoading, user, seller, router]);

  useEffect(() => {
    const reserveId = searchParams.get('reserve');
    if (!reserveId || !user?.uid) return;
    setReserveHighlightId(reserveId);
    setShowReservePopup(true);
    setReserveListLoading(true);
    getSellerDeletionsByReason(user.uid, 'reserve', { dateFrom: dateFrom || undefined, dateTo: dateTo || undefined })
      .then(setReserveList)
      .finally(() => setReserveListLoading(false));
    router.replace('/vendeur/ventes', { scroll: false });
  }, [searchParams, user?.uid, dateFrom, dateTo, router]);

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
    if (USE_FAKE_EVOLUTION) {
      setTimeout(() => {
        if (!cancelled) {
          setEvolution(buildFakeEvolution());
          setEvolutionLoading(false);
        }
      }, 400);
      return () => { cancelled = true; };
    }
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
      <div className="mes-ventes-page-inner" style={{ maxWidth: 1200, margin: '0 auto', padding: '30px calc(20px + 1cm - 0.5mm) 60px' }}>
        {depotInactiveLimiteBanner ? (
          <div
            role="status"
            style={{
              marginBottom: 20,
              padding: '14px 16px',
              borderRadius: 12,
              border: '1px solid #bfdbfe',
              backgroundColor: '#eff6ff',
              color: '#1e3a5f',
              fontSize: 14,
              lineHeight: 1.5,
              fontFamily: 'var(--font-inter), var(--font-sans)',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 12,
              boxSizing: 'border-box',
            }}
          >
            <span>
              Votre annonce a été enregistrée <strong>inactive</strong> : vous aviez déjà atteint le nombre maximal
              d&apos;annonces actives pour votre formule. Désactivez une annonce en ligne pour pouvoir activer celle-ci.
            </span>
            <button
              type="button"
              onClick={() => setDepotInactiveLimiteBanner(false)}
              aria-label="Fermer"
              style={{
                flexShrink: 0,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                padding: 4,
                color: '#1e3a5f',
                lineHeight: 1,
              }}
            >
              <X size={18} />
            </button>
          </div>
        ) : null}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: 28, fontWeight: 500, marginBottom: 8, color: '#1d1d1f' }}>
              Mes ventes
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 14, color: '#666' }}>{seller.companyName}</span>
              {seller.status === 'approved' && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', backgroundColor: '#dcfce7', color: '#166534', fontSize: 12, fontWeight: 500, borderRadius: 8 }}>
                  <CheckCircle size={12} /> Validé
                </span>
              )}
              {seller.status === 'pending' && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', backgroundColor: '#fef3c7', color: '#92400e', fontSize: 12, fontWeight: 500, borderRadius: 8 }}>
                  <Clock size={12} /> En attente
                </span>
              )}
              {seller.status === 'rejected' && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', backgroundColor: '#fee2e2', color: '#991b1b', fontSize: 12, fontWeight: 500, borderRadius: 8 }}>
                  <XCircle size={12} /> Refusé
                </span>
              )}
            </div>
          </div>
          {isApprovedSeller && (
            <Link href="/vendeur/annonces/nouvelle?from=ventes" className="mes-ventes-deposer-link" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 20px', backgroundColor: '#000', color: '#fff', fontSize: 14, fontWeight: 500, borderRadius: 12 }}>
              <Plus size={18} /> Déposer une annonce
            </Link>
          )}
        </div>

        {seller.status === 'pending' && (
          <div
            style={{
              marginBottom: 32,
              padding: 16,
              borderRadius: 12,
              border: '1px solid #fde68a',
              backgroundColor: '#fffbeb',
              width: '100%',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 10,
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', backgroundColor: '#fef3c7', color: '#92400e', fontSize: 13, fontWeight: 600, borderRadius: 8 }}>
              <Clock size={14} /> En attente
            </span>
            <p style={{ fontSize: 14, color: '#92400e', margin: 0, lineHeight: 1.45, fontWeight: 500 }}>
              Demande en cours d&apos;étude
            </p>
            <p style={{ fontSize: 13, color: '#a16207', margin: 0, lineHeight: 1.5 }}>
              Notre équipe examine vos documents. Vous ne pouvez pas encore publier d&apos;annonces.
            </p>
          </div>
        )}

        <div
          style={
            seller.status === 'pending'
              ? { filter: 'blur(6px)', pointerEvents: 'none', userSelect: 'none', marginTop: -24 }
              : undefined
          }
        >
        {/* Filtres dates : Date (Ce mois / Ce trimestre / Cette année) + Entre … et … */}
        <div className="mes-ventes-filtres-row" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <div className="mes-ventes-filtres-left" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16, flex: 1, minWidth: 0 }}>
            <div className="mes-ventes-filtres-dates" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setDatePresetOpen((o) => !o)}
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
                        style={{ display: 'block', width: '100%', padding: '10px 14px', textAlign: 'left', fontSize: 14, color: '#1d1d1f', background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        Ce mois
                      </button>
                      <button
                        type="button"
                        onClick={setPresetCeTrimestre}
                        style={{ display: 'block', width: '100%', padding: '10px 14px', textAlign: 'left', fontSize: 14, color: '#1d1d1f', background: 'none', border: 'none', cursor: 'pointer', borderTop: '1px solid #e8e8ed' }}
                      >
                        Ce trimestre
                      </button>
                      <button
                        type="button"
                        onClick={setPresetCetteAnnee}
                        style={{ display: 'block', width: '100%', padding: '10px 14px', textAlign: 'left', fontSize: 14, color: '#1d1d1f', background: 'none', border: 'none', cursor: 'pointer', borderTop: '1px solid #e8e8ed' }}
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
                className="mes-ventes-date-input"
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
                className="mes-ventes-date-input"
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
            </div>
            <span className="mes-ventes-filtres-reset-wrap">
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); setDateFrom(''); setDateTo(''); setDatePresetOpen(false); }}
                style={{ fontSize: 14, color: '#6e6e73', cursor: 'pointer', textDecoration: 'underline', background: 'none', border: 'none', padding: 0, fontFamily: 'var(--font-inter), var(--font-sans)' }}
              >
                <span className="mes-ventes-reset-desktop">Réinitialiser les filtres</span>
                <span className="mes-ventes-reset-mobile">Réinitialiser</span>
              </button>
            </span>
          </div>
        </div>

        {/* Stats période : mêmes cases que Mes annonces (filtrées par dates) — icônes toujours visibles, seul le chiffre change */}
        <div className="mes-ventes-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
          <div style={{ padding: 16, border: '1px solid #e8e6e3', borderRadius: 12, backgroundColor: '#fff', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, backgroundColor: '#f5f5f7', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, flexShrink: 0 }}>
              <Package size={22} color="#6e6e73" />
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 11, color: '#888' }}><span className="mes-ventes-stat-desktop">Annonces publiées</span><span className="mes-ventes-stat-mobile">Annonces</span></p>
              <p style={{ fontSize: 22, fontWeight: 600, minHeight: 28, display: 'flex', alignItems: 'center' }}>
                {stats?.createdInPeriod ?? 0}
              </p>
            </div>
          </div>
          <div style={{ padding: 16, border: '1px solid #e8e6e3', borderRadius: 12, backgroundColor: '#fff', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, backgroundColor: '#f5f5f7', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, flexShrink: 0 }}>
              <Heart size={22} color="#6e6e73" />
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 11, color: '#888' }}><span className="mes-ventes-stat-desktop">Total likes</span><span className="mes-ventes-stat-mobile">Likes</span></p>
              <p style={{ fontSize: 22, fontWeight: 600, minHeight: 28, display: 'flex', alignItems: 'center' }}>
                {stats?.totalLikesInPeriod ?? 0}
              </p>
            </div>
          </div>
          <div style={{ padding: 16, border: '1px solid #e8e6e3', borderRadius: 12, backgroundColor: '#fff', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, backgroundColor: '#f5f5f7', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, flexShrink: 0 }}>
              <MessageCircle size={22} color="#6e6e73" />
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 11, color: '#888' }}><span className="mes-ventes-stat-desktop">Total messages</span><span className="mes-ventes-stat-mobile">Messages</span></p>
              <p style={{ fontSize: 22, fontWeight: 600, minHeight: 28, display: 'flex', alignItems: 'center' }}>
                {stats?.totalMessagesInPeriod ?? 0}
              </p>
            </div>
          </div>
          <div style={{ padding: 16, border: '1px solid #e8e6e3', borderRadius: 12, backgroundColor: '#fff', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, backgroundColor: '#f5f5f7', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, flexShrink: 0 }}>
              <Phone size={22} color="#6e6e73" />
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 11, color: '#888' }}><span className="mes-ventes-stat-desktop">Total appels</span><span className="mes-ventes-stat-mobile">Appels</span></p>
              <p style={{ fontSize: 22, fontWeight: 600, minHeight: 28, display: 'flex', alignItems: 'center' }}>
                {stats?.totalAppelsInPeriod ?? 0}
              </p>
            </div>
          </div>
        </div>

        {/* Stats : annonces mises en ligne / supprimées — icônes et textes statiques, seul le chiffre change */}
        <div className="mes-ventes-stats-deux-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 24 }}>
          <div style={{ padding: 20, border: '1px solid #e8e6e3', borderRadius: 12, backgroundColor: '#fff', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ width: 44, height: 44, backgroundColor: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10 }}>
                <CheckCircle size={22} color="#16a34a" />
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
              <div style={{ width: 44, height: 44, backgroundColor: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10 }}>
                <Clock size={22} color="#ea580c" />
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

        {/* Popup Articles vendus — taille adaptative, survol type sous-menu header (masqué quand popup Supprimer la vente ouverte) */}
        {showVenduPopup && !deleteConfirmId && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)' }} onClick={() => setShowVenduPopup(false)} aria-hidden />
            <div
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: 460,
                maxHeight: '85vh',
                minHeight: 200,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: '#fbfbfb',
                borderRadius: 18,
                boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ flexShrink: 0, padding: '20px 24px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <h2 style={{ flex: 1, minWidth: 0, fontFamily: 'var(--font-inter), var(--font-sans)', fontSize: 19, fontWeight: 600, margin: 0, color: '#0a0a0a', textAlign: 'center', paddingRight: 36 }}>
                  Articles vendus {dateFrom || dateTo ? 'sur la période' : ''}
                  </h2>
                  <button type="button" onClick={() => setShowVenduPopup(false)} style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: '#e8e8ed', borderRadius: 10, cursor: 'pointer', transition: 'background-color 0.15s' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#d2d2d7'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#e8e8ed'; }} aria-label="Fermer">
                    <X size={20} />
                </button>
                </div>
              </div>
              <div style={{ overflowY: 'auto', flex: 1, padding: 8, minHeight: 0 }}>
                {venduListLoading ? (
                  <p style={{ fontSize: 15, color: '#6e6e73', textAlign: 'center', padding: 32 }}>Chargement...</p>
                ) : venduList.length === 0 ? (
                  <p style={{ fontSize: 15, color: '#6e6e73', textAlign: 'center', padding: 32 }}>Aucun article vendu sur cette période.</p>
                ) : (
                  <ul style={{ listStyle: 'none', margin: 0, padding: '0 0 16px 0' }}>
                    {venduList.map((item) => (
                      <li key={item.id}>
                        <div
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e8e8ed'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: 12,
                            padding: '12px 14px',
                            borderRadius: 10,
                            cursor: 'default',
                            transition: 'background-color 0.15s',
                          }}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <span style={{ fontSize: 15, color: '#1d1d1f', fontWeight: 500, display: 'block' }}>{item.listingTitle || 'Sans titre'}</span>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                              <span style={{ fontSize: 14, color: '#86868b' }}>{item.amountCents != null ? formatAmountCents(item.amountCents) : '—'}</span>
                              <span style={{ fontSize: 13, color: '#86868b' }}>{formatVenduLe(item.deletedAt)}</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(item.id); }}
                            style={{ padding: 8, border: 'none', background: 'none', cursor: 'pointer', color: '#dc2626', display: 'flex', flexShrink: 0, borderRadius: 8, transition: 'background-color 0.15s' }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(220,38,38,0.1)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                            aria-label="Supprimer cette vente"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Popup de validation suppression vente — design Rendre visite au vendeur */}
        {deleteConfirmId && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)' }} onClick={() => !deleteLoading && setDeleteConfirmId(null)} aria-hidden />
            <div style={{ position: 'relative', width: '100%', maxWidth: 460, maxHeight: '90vh', overflow: 'auto', backgroundColor: '#fff', borderRadius: 18, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }} onClick={(e) => e.stopPropagation()}>
              <div style={{ padding: 20 }}>
                <div style={{ marginBottom: 12 }}>
                  <h2 style={{ fontFamily: 'var(--font-inter), var(--font-sans)', fontSize: 18, fontWeight: 600, margin: 0, color: '#0a0a0a', textAlign: 'center', paddingBottom: 12, borderBottom: '1px solid #e5e5e7' }}>
                    Supprimer la vente
                  </h2>
                </div>
                <p style={{ fontSize: 15, color: '#1d1d1f', fontWeight: 500, lineHeight: 1.5, marginTop: 2, marginBottom: 12, textAlign: 'center' }}>
                  Êtes-vous sûr de vouloir supprimer cette vente ?
                </p>
                <p style={{ fontSize: 14, color: '#6e6e73', lineHeight: 1.5, marginTop: 0, marginBottom: 20, textAlign: 'center', padding: '0 4px' }}>
                  Cette action est irréversible. Votre annonce est déjà supprimée ; elle ne sera plus considérée comme vendue.
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => !deleteLoading && setDeleteConfirmId(null)}
                    style={{ flex: 1, height: 44, backgroundColor: '#fff', color: '#1d1d1f', fontSize: 14, fontWeight: 500, border: '1px solid #d2d2d7', borderRadius: 10, cursor: deleteLoading ? 'not-allowed' : 'pointer' }}
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    disabled={deleteLoading || !user?.uid}
                    onClick={async () => {
                      if (!user?.uid || deleteLoading) return;
                      setDeleteLoading(true);
                      try {
                        await deleteListingDeletion(user.uid, deleteConfirmId);
                        setVenduList((prev) => prev.filter((i) => i.id !== deleteConfirmId));
                        const [newStats, newEvolution] = await Promise.all([
                          getSellerSalesStats(user.uid, { dateFrom: dateFrom || undefined, dateTo: dateTo || undefined }),
                          getSellerSalesEvolution(user.uid),
                        ]);
                        setStats(newStats);
                        setEvolution(newEvolution);
                        setDeleteConfirmId(null);
                      } catch (e) {
                        console.error('Suppression vente:', e);
                      } finally {
                        setDeleteLoading(false);
                      }
                    }}
                    style={{ flex: 1, height: 44, backgroundColor: '#dc2626', color: '#fff', fontSize: 14, fontWeight: 500, border: 'none', borderRadius: 10, cursor: deleteLoading ? 'not-allowed' : 'pointer', opacity: deleteLoading ? 0.7 : 1 }}
                  >
                    {deleteLoading ? 'Suppression...' : 'Supprimer'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Popup Articles réservés — même design que Articles vendus (masqué quand popup Vendu/Annulé ouverte) */}
        {showReservePopup && !reserveAction && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)' }} onClick={() => { setShowReservePopup(false); setReserveHighlightId(null); }} aria-hidden />
            <div
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: 460,
                maxHeight: '85vh',
                minHeight: 200,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: '#fbfbfb',
                borderRadius: 18,
                boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ flexShrink: 0, padding: '20px 24px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <h2 style={{ flex: 1, minWidth: 0, fontFamily: 'var(--font-inter), var(--font-sans)', fontSize: 19, fontWeight: 600, margin: 0, color: '#0a0a0a', textAlign: 'center', paddingRight: 36 }}>
                  Articles réservés {dateFrom || dateTo ? 'sur la période' : ''}
                  </h2>
                  <button type="button" onClick={() => { setShowReservePopup(false); setReserveHighlightId(null); }} style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: '#e8e8ed', borderRadius: 10, cursor: 'pointer', transition: 'background-color 0.15s' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#d2d2d7'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#e8e8ed'; }} aria-label="Fermer">
                    <X size={20} />
                </button>
                </div>
              </div>
              <div style={{ overflowY: 'auto', flex: 1, padding: 8, minHeight: 0 }}>
                {reserveListLoading ? (
                  <p style={{ fontSize: 15, color: '#6e6e73', textAlign: 'center', padding: 32 }}>Chargement...</p>
                ) : (() => {
                  const listToShow = reserveHighlightId ? reserveList.filter((i) => i.listingId === reserveHighlightId) : reserveList;
                  return listToShow.length === 0 ? (
                    <p style={{ fontSize: 15, color: '#6e6e73', textAlign: 'center', padding: 32 }}>Aucun article réservé sur cette période.</p>
                  ) : (
                  <ul style={{ listStyle: 'none', margin: 0, padding: '0 0 16px 0' }}>
                    {listToShow.map((item) => (
                      <li key={item.id}>
                        <div
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e8e8ed'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: 12,
                            padding: '12px 14px',
                            borderRadius: 10,
                            cursor: 'default',
                            transition: 'background-color 0.15s',
                          }}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <span style={{ fontSize: 15, color: '#1d1d1f', fontWeight: 500, display: 'block' }}>{item.listingTitle || 'Sans titre'}</span>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                              <span style={{ fontSize: 14, color: '#86868b' }}>{item.amountCents != null ? formatAmountCents(item.amountCents) : '—'}</span>
                              <span style={{ fontSize: 13, color: '#86868b' }}>{formatReserveLe(item.deletedAt)}</span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setReserveAction({ id: item.id, listingId: item.listingId, action: 'vendu' }); }}
                              style={{ padding: 8, border: 'none', background: 'none', cursor: 'pointer', color: '#16a34a', display: 'flex', borderRadius: 8, transition: 'background-color 0.15s' }}
                              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(22,163,74,0.1)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                              title="Article vendu"
                              aria-label="Article vendu"
                            >
                              <ShoppingBag size={18} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setReserveAction({ id: item.id, listingId: item.listingId, action: 'annule' }); }}
                              style={{ padding: 8, border: 'none', background: 'none', cursor: 'pointer', color: '#dc2626', display: 'flex', borderRadius: 8, transition: 'background-color 0.15s' }}
                              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(220,38,38,0.1)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                              title="Annuler la réservation"
                              aria-label="Annuler la réservation"
                            >
                              <XCircle size={18} />
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Popup confirmation action réservé : Vendu ou Annulé — même design que Supprimer la vente */}
        {reserveAction && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)' }} onClick={() => !reserveActionLoading && setReserveAction(null)} aria-hidden />
            <div style={{ position: 'relative', width: '100%', maxWidth: 460, maxHeight: '90vh', overflow: 'auto', backgroundColor: '#fff', borderRadius: 18, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }} onClick={(e) => e.stopPropagation()}>
              <div style={{ padding: 20 }}>
                <div style={{ marginBottom: 12 }}>
                  <h2 style={{ fontFamily: 'var(--font-inter), var(--font-sans)', fontSize: 18, fontWeight: 600, margin: 0, color: '#0a0a0a', textAlign: 'center', paddingBottom: 12, borderBottom: '1px solid #e5e5e7' }}>
                    {reserveAction.action === 'vendu' ? 'Article vendu' : 'Annuler la réservation'}
                  </h2>
                </div>
                <p style={{ fontSize: 15, color: '#1d1d1f', fontWeight: 500, lineHeight: 1.5, marginTop: 2, marginBottom: 12, textAlign: 'center' }}>
                  {reserveAction.action === 'vendu'
                    ? 'Êtes-vous sûr de passer cet article en vendu ?'
                    : 'Êtes-vous sûr de vouloir annuler la réservation ?'}
                </p>
                <p style={{ fontSize: 14, color: '#6e6e73', lineHeight: 1.5, marginTop: 0, marginBottom: 20, textAlign: 'center', padding: '0 4px' }}>
                  {reserveAction.action === 'vendu'
                    ? <>Cette action est irréversible. Vous pourrez le voir dans Articles vendu mais <strong>il sera supprimé de votre catalogue.</strong></>
                    : 'L\'article sera retiré de la liste des articles réservés et l\'annonce réapparaîtra dans votre catalogue.'}
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => !reserveActionLoading && setReserveAction(null)}
                    style={{ flex: 1, height: 44, backgroundColor: '#fff', color: '#1d1d1f', fontSize: 14, fontWeight: 500, border: '1px solid #d2d2d7', borderRadius: 10, cursor: reserveActionLoading ? 'not-allowed' : 'pointer' }}
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    disabled={reserveActionLoading || !user?.uid}
                    onClick={async () => {
                      if (!user?.uid || reserveActionLoading) return;
                      setReserveActionLoading(true);
                      try {
                        if (reserveAction.action === 'vendu') {
                          await updateListingDeletionReason(user.uid, reserveAction.id, 'vendu');
                          await deleteListing(reserveAction.listingId);
                          setReserveList((prev) => prev.filter((i) => i.id !== reserveAction.id));
                          const [newVenduList, newStats, newEvolution] = await Promise.all([
                            getSellerDeletionsByReason(user.uid, 'vendu', { dateFrom: dateFrom || undefined, dateTo: dateTo || undefined }),
                            getSellerSalesStats(user.uid, { dateFrom: dateFrom || undefined, dateTo: dateTo || undefined }),
                            getSellerSalesEvolution(user.uid),
                          ]);
                          setVenduList(newVenduList);
                          setStats(newStats);
                          setEvolution(newEvolution);
                        } else {
                          await updateListing(reserveAction.listingId, { isActive: true });
                          await deleteListingDeletion(user.uid, reserveAction.id);
                          setReserveList((prev) => prev.filter((i) => i.id !== reserveAction.id));
                          const [newStats, newEvolution] = await Promise.all([
                            getSellerSalesStats(user.uid, { dateFrom: dateFrom || undefined, dateTo: dateTo || undefined }),
                            getSellerSalesEvolution(user.uid),
                          ]);
                          setStats(newStats);
                          setEvolution(newEvolution);
                        }
                        setReserveAction(null);
                      } catch (e) {
                        if (isSubscriptionLimitError(e)) {
                          router.push('/vendeur/abonnement?limite=1');
                        } else {
                          console.error('Action réservation:', e);
                        }
                      } finally {
                        setReserveActionLoading(false);
                      }
                    }}
                    style={{ flex: 1, height: 44, fontSize: 14, fontWeight: 500, border: 'none', borderRadius: 10, cursor: reserveActionLoading ? 'not-allowed' : 'pointer', opacity: reserveActionLoading ? 0.7 : 1, backgroundColor: reserveAction.action === 'vendu' ? '#16a34a' : '#dc2626', color: '#fff' }}
                  >
                    {reserveActionLoading ? 'En cours...' : reserveAction.action === 'vendu' ? 'Article vendu' : 'Annuler la réservation'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Graphique évolution des ventes — 12 derniers mois */}
        <div style={{ backgroundColor: '#fff', borderRadius: 16, border: '1px solid #e8e6e3', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: 28, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
            <h2 style={{ fontFamily: 'var(--font-inter), var(--font-sans)', fontSize: 17, fontWeight: 600, margin: 0, color: '#1d1d1f' }}>
              <span className="mes-ventes-evolution-title-desktop">Évolution des ventes des 12 derniers mois</span>
              <span className="mes-ventes-evolution-title-mobile">Évolution des ventes</span>
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
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
            <div style={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#86868b', fontSize: 14 }}>
              Chargement du graphique...
            </div>
          ) : (() => {
            const chartEvolution = isMobile ? evolution.slice(-6) : evolution;
            const values = chartEvolution.map((m) => (chartMode === 'volume' ? m.volume : m.amountCents / 100));
            const maxVal = Math.max(1, ...values);
            const totalValues = values.reduce((a, b) => a + b, 0);
            const isEmpty = totalValues === 0;
            const chartHeight = 320;
            const n = chartEvolution.length;
            const niceCeil = (x: number, forMontant: boolean): number => {
              if (x <= 0) return 1;
              const mag = 10 ** Math.floor(Math.log10(x));
              const norm = x / mag;
              const steps = forMontant ? [1, 2, 3, 5, 10] : [1, 1.5, 2, 3, 5, 10];
              const step = steps.find((s) => s >= norm) || 10;
              return Math.ceil(norm / step) * step * mag;
            };
            let yMax = Math.max(1, niceCeil(maxVal, chartMode === 'montant'));
            if (chartMode === 'volume' && maxVal > 10 && maxVal <= 15) yMax = 20;
            const formatAxisValue = (v: number) => {
              if (chartMode === 'volume') return String(Math.round(v));
              if (v === 0) return '0';
              if (v >= 1_000_000) return `${(v / 1_000_000).toLocaleString('fr-FR', { maximumFractionDigits: 1, minimumFractionDigits: 0 })}M €`;
              if (v >= 1_000) {
                const k = v / 1_000;
                if (k === Math.round(k)) return `${k}K €`;
                return `${k.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}K €`;
              }
              if (chartMode === 'montant' && yMax >= 1_000) return `${(v / 1_000).toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}K €`;
              return `${Math.round(v)} €`;
            };
            const niceRound = (x: number): number => {
              if (x <= 0) return 0;
              const mag = 10 ** Math.floor(Math.log10(x));
              const norm = x / mag;
              const steps = [1, 1.5, 2, 2.5, 5, 7.5, 10];
              const step = steps.find((s) => s >= norm) || 10;
              return Math.round(norm / step) * step * mag;
            };
            const roundToQuarter = (x: number): number => {
              if (x <= 0) return 0;
              const mag = 10 ** Math.floor(Math.log10(x));
              const q = Math.round((x / mag) * 4) / 4;
              return q * mag;
            };
            let yTicks: number[];
            if (chartMode === 'volume' && yMax <= 4) {
              const step = 1;
              const arr: number[] = [0];
              for (let v = step; v < yMax; v += step) arr.push(v);
              arr.push(yMax);
              yTicks = [...new Set(arr)].sort((a, b) => a - b);
            } else if (chartMode === 'volume' && yMax <= 10) {
              yTicks = [0, 5, yMax];
              yTicks = [...new Set(yTicks)].filter((t) => t >= 0).sort((a, b) => a - b);
            } else {
              yTicks = [0, roundToQuarter(yMax * 0.25), roundToQuarter(yMax * 0.5), roundToQuarter(yMax * 0.75), yMax];
              yTicks = [...new Set(yTicks)].filter((t) => t >= 0).sort((a, b) => a - b);
            }
            const gridLines = yTicks.length - 1;
            const topHeadroom = 0.02;
            const dataHeight = 200 * (1 - topHeadroom);

            if (isEmpty) {
              return (
                <div style={{ height: chartHeight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <p style={{ fontSize: 14, color: '#86868b', margin: 0 }}>Aucune vente sur la période</p>
                </div>
              );
            }

            const plotHeight = chartHeight - 32;
            const valueToSvgY = (val: number) => 200 - (yMax > 0 ? (val / yMax) * dataHeight : 0);
            const xMargin = 2.5;
            const xRange = 100 - 2 * xMargin;
            const points = values.map((v, i) => {
              const x = n > 1 ? xMargin + (i / (n - 1)) * xRange : 50;
              const y = valueToSvgY(v);
              return { x, y, v };
            });
            const linePoints = points.map((p) => `${p.x},${p.y}`).join(' ');
            const tickValuesReversed = [...yTicks].reverse();
            const svgYForTicks = tickValuesReversed.map((t) => valueToSvgY(t));
            const tickTops = svgYForTicks.map((svgY) => 20 + (svgY / 200) * plotHeight);

            return (
              <div
                style={{
                  padding: chartMode === 'montant' ? '24px 20px 16px 72px' : '24px 20px 16px 52px',
                  position: 'relative',
                  borderRadius: 12,
                  backgroundColor: 'rgba(0,0,0,0.02)',
                }}
              >
                {/* Axe Y : 0, 1, 2, … max (pas de 1 quand max ≤ 10), avec le max sur la ligne du haut */}
                {yTicks.slice().reverse().map((tick, idx) => (
                  <div
                    key={tick}
                    style={{
                      position: 'absolute',
                      left: 16,
                      top: tickTops[idx],
                      transform: 'translateY(-50%)',
                      fontSize: 12,
                      color: '#8e8e93',
                      fontWeight: 400,
                      fontVariantNumeric: 'tabular-nums',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {formatAxisValue(tick)}
                  </div>
                ))}
                {/* Zone de dessin : grille légère + courbe + zone remplie */}
                <div style={{ position: 'relative', height: plotHeight }}>
                  <svg
                    viewBox="0 0 100 200"
                    preserveAspectRatio="none"
                    style={{ position: 'absolute', left: 0, right: 0, top: 0, height: plotHeight, width: '100%' }}
                  >
                    {/* Grille horizontale (0, 1, 2, … max, avec ligne du haut) */}
                    {svgYForTicks.map((y, i) => (
                      <line key={i} x1="0" y1={y} x2="100" y2={y} stroke="rgba(0,0,0,0.06)" strokeWidth="0.4" />
                    ))}
                  <defs>
                      <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#1d1d1f" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#1d1d1f" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                    {/* Zone dégradée sous la courbe (s'arrête au dernier mois avec données) */}
                    {points.length > 0 && (
                      <path
                        d={`M ${points[0].x},200 L ${linePoints.replace(/\s/g,' L ')} L ${points[points.length - 1].x},200 Z`}
                        fill="url(#chartGradient)"
                      />
                    )}
                    {/* Courbe principale */}
                    {points.length > 0 && (
                      <polyline
                        points={linePoints}
                        fill="none"
                        stroke="#1d1d1f"
                        strokeWidth="4"
                        strokeLinecap="butt"
                        strokeLinejoin="round"
                        vectorEffect="non-scaling-stroke"
                      />
                    )}
                    </svg>
                  {/* Ronds en HTML pour rester ronds (évite l'ovale dans le SVG étiré) */}
                  <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: plotHeight, pointerEvents: 'none' }}>
                    {points.map((p, i) => (
                        <div
                          key={i}
                          style={{
                            position: 'absolute',
                            left: `${p.x}%`,
                            top: `${(p.y / 200) * 100}%`,
                            transform: 'translate(-50%, -50%)',
                            width: 14,
                            height: 14,
                            borderRadius: '50%',
                            backgroundColor: '#1d1d1f',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <div style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: '#fff' }} />
                        </div>
                      ))}
                  </div>
                  {/* Valeurs au-dessus des points uniquement s'il y a des ventes */}
                  <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: plotHeight, pointerEvents: 'none' }}>
                    {chartEvolution.map((m, i) => {
                      const p = points[i];
                      const xPct = n > 1 ? xMargin + (i / (n - 1)) * xRange : 50;
                      const yPct = (200 - p.y) / 200;
                      return (
                        <div
                          key={`${m.year}-${m.month}`}
                          style={{
                            position: 'absolute',
                            left: `${xPct}%`,
                            top: `${(1 - yPct) * 100}%`,
                            transform: 'translate(-50%, -100%) translateY(-10px)',
                            padding: '4px 8px',
                            backgroundColor: '#fff',
                            borderRadius: 8,
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                            fontSize: 11,
                            fontWeight: 600,
                            color: '#1d1d1f',
                            fontVariantNumeric: 'tabular-nums',
                            whiteSpace: 'nowrap',
                            zIndex: 2,
                          }}
                        >
                          {chartMode === 'volume' ? p.v : formatAmountChart(m.amountCents)}
                        </div>
                      );
                    })}
                  </div>
                </div>
                {/* Labels des mois alignés aux points (moins d'espace aux bords) */}
                <div style={{ position: 'relative', height: 20, marginTop: 16 }}>
                  {chartEvolution.map((m, i) => (
                    <span
                      key={`${m.year}-${m.month}`}
                      style={{
                        position: 'absolute',
                        left: n > 1 ? `${xMargin + (i / (n - 1)) * xRange}%` : '50%',
                        transform: 'translateX(-50%)',
                        fontSize: 11,
                        color: '#8e8e93',
                        fontWeight: 400,
                        whiteSpace: 'nowrap',
                      }}
                    >
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
    </div>
  );
}

export default function MesVentesPage() {
  return (
    <Suspense fallback={
      <div style={{ paddingTop: 'var(--header-height)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontSize: 15, color: '#6e6e73' }}>Chargement...</p>
      </div>
    }>
      <MesVentesPageContent />
    </Suspense>
  );
}
