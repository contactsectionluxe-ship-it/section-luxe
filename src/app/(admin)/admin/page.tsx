'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  Search,
  X,
  Mail,
  User,
  Store,
  Rocket,
  PlusCircle,
  Crown,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { isAdminEmail } from '@/lib/constants';
import { getAllSellers, getSellerStats, approveSeller, rejectSeller, suspendSeller, banSeller, unbanSeller } from '@/lib/supabase/admin';
import { Seller } from '@/types';
import { formatDate } from '@/lib/utils';

type AdminAccountStats = {
  visitorAccounts: number;
  sellerAccounts: number;
  subscriptionByTier: { start: number; plus: number; pro: number; other: number };
};

type AccountTab = 'visitors' | 'sellers' | 'start' | 'plus' | 'pro';

type VisitorAccountRow = {
  id: string;
  email: string;
  display_name: string;
  role: string;
  created_at: string;
};

type SellerAccountRow = {
  id: string;
  email: string;
  company_name: string;
  phone: string;
  status: string;
  subscription_tier: string | null;
  created_at: string;
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const canAccessAdmin = isAdmin && isAdminEmail(user?.email);

  const [sellers, setSellers] = useState<Seller[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0, suspended: 0, banned: 0 });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'suspended' | 'banned'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [suspendModal, setSuspendModal] = useState<{ open: boolean; sellerId: string; sellerName: string; days: number }>({ open: false, sellerId: '', sellerName: '', days: 7 });
  const [suspendDaysDropdownOpen, setSuspendDaysDropdownOpen] = useState(false);
  const [banModal, setBanModal] = useState<{ open: boolean; sellerId: string; sellerName: string }>({ open: false, sellerId: '', sellerName: '' });
  const [adminSection, setAdminSection] = useState<'vendeurs' | 'comptes' | 'newsletter'>('vendeurs');
  const [accountStats, setAccountStats] = useState<AdminAccountStats | null>(null);
  const [accountLoading, setAccountLoading] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [accountTab, setAccountTab] = useState<AccountTab>('visitors');
  const [accountListSearch, setAccountListSearch] = useState('');
  const [accountListItems, setAccountListItems] = useState<VisitorAccountRow[] | SellerAccountRow[]>([]);
  const [accountListLoading, setAccountListLoading] = useState(false);
  const [newsletterSubscribers, setNewsletterSubscribers] = useState<{ id: string; email: string; status: 'subscribed' | 'unsubscribed'; subscribed_at: string; unsubscribed_at: string | null }[]>([]);
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [newsletterError, setNewsletterError] = useState<string | null>(null);
  const [newsletterFilter, setNewsletterFilter] = useState<'all' | 'subscribed' | 'unsubscribed'>('subscribed');
  const [newsletterListSearch, setNewsletterListSearch] = useState('');

  const SUSPEND_DAY_OPTIONS = [
    { value: 1, label: '1 jour' },
    { value: 3, label: '3 jours' },
    { value: 7, label: '7 jours' },
    { value: 14, label: '14 jours' },
    { value: 30, label: '30 jours' },
  ];

  useEffect(() => {
    if (!authLoading && !canAccessAdmin) {
      router.push('/');
    }
  }, [authLoading, canAccessAdmin, router]);

  useEffect(() => {
    async function loadData() {
      try {
        const [sellersData, statsData] = await Promise.all([getAllSellers(), getSellerStats()]);
        setSellers(sellersData);
        setStats(statsData);
      } catch (error) {
        console.error('Error loading admin data:', error);
      } finally {
        setLoading(false);
      }
    }
    if (canAccessAdmin) loadData();
  }, [canAccessAdmin]);

  useEffect(() => {
    async function loadNewsletter() {
      if (!canAccessAdmin || adminSection !== 'newsletter') return;
      const { getSession } = await import('@/lib/supabase/auth');
      const session = await getSession();
      if (!session?.access_token) {
        setNewsletterError('Session expirée');
        setNewsletterLoading(false);
        return;
      }
      setNewsletterLoading(true);
      setNewsletterError(null);
      try {
        const res = await fetch('/api/admin/newsletter-subscribers', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setNewsletterError((data as { error?: string }).error || 'Erreur chargement');
          setNewsletterSubscribers([]);
        } else {
          setNewsletterSubscribers((data as { subscribers: typeof newsletterSubscribers }).subscribers || []);
        }
      } catch {
        setNewsletterError('Erreur réseau');
        setNewsletterSubscribers([]);
      } finally {
        setNewsletterLoading(false);
      }
    }
    loadNewsletter();
  }, [canAccessAdmin, adminSection]);

  useEffect(() => {
    async function loadAccountStats() {
      if (!canAccessAdmin || adminSection !== 'comptes') return;
      const { getSession } = await import('@/lib/supabase/auth');
      const session = await getSession();
      if (!session?.access_token) {
        setAccountError('Session expirée');
        setAccountLoading(false);
        return;
      }
      setAccountLoading(true);
      setAccountError(null);
      try {
        const res = await fetch('/api/admin/account-stats', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setAccountError((data as { error?: string }).error || 'Erreur chargement');
          setAccountStats(null);
        } else {
          setAccountStats(data as AdminAccountStats);
        }
      } catch {
        setAccountError('Erreur réseau');
        setAccountStats(null);
      } finally {
        setAccountLoading(false);
      }
    }
    void loadAccountStats();
  }, [canAccessAdmin, adminSection]);

  useEffect(() => {
    if (!canAccessAdmin || adminSection !== 'comptes') return;

    const controller = new AbortController();
    const t = setTimeout(() => {
      void (async () => {
        setAccountListLoading(true);
        try {
          const { getSession } = await import('@/lib/supabase/auth');
          const session = await getSession();
          if (!session?.access_token) {
            if (!controller.signal.aborted) setAccountListItems([]);
            return;
          }
          const res = await fetch(
            `/api/admin/account-list?category=${accountTab}&q=${encodeURIComponent(accountListSearch.trim())}`,
            {
              headers: { Authorization: `Bearer ${session.access_token}` },
              signal: controller.signal,
            }
          );
          const data = (await res.json().catch(() => ({}))) as { items?: unknown[] };
          if (!res.ok || controller.signal.aborted) {
            if (!controller.signal.aborted) setAccountListItems([]);
            return;
          }
          const items = Array.isArray(data.items) ? data.items : [];
          if (!controller.signal.aborted) {
            setAccountListItems(items as VisitorAccountRow[] | SellerAccountRow[]);
          }
        } catch {
          if (!controller.signal.aborted) setAccountListItems([]);
        } finally {
          if (!controller.signal.aborted) setAccountListLoading(false);
        }
      })();
    }, 280);

    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [canAccessAdmin, adminSection, accountTab, accountListSearch]);

  useEffect(() => {
    if (adminSection === 'comptes') {
      setAccountListLoading(true);
    } else {
      setAccountListLoading(false);
      setAccountListItems([]);
    }
  }, [adminSection]);

  const handleApprove = async (sellerId: string) => {
    setActionLoading(true);
    try {
      await approveSeller(sellerId);
      setSellers((prev) => prev.map((s) => (s.uid === sellerId ? { ...s, status: 'approved' } : s)));
      setStats((prev) => ({ ...prev, pending: prev.pending - 1, approved: prev.approved + 1 }));
    } catch (error) {
      console.error('Error approving seller:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (sellerId: string) => {
    setActionLoading(true);
    try {
      await rejectSeller(sellerId);
      setSellers((prev) => prev.map((s) => (s.uid === sellerId ? { ...s, status: 'rejected' } : s)));
      setStats((prev) => ({ ...prev, pending: prev.pending - 1, rejected: prev.rejected + 1 }));
    } catch (error) {
      console.error('Error rejecting seller:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const openSuspendModal = (sellerId: string, sellerName: string) => {
    setSuspendModal({ open: true, sellerId, sellerName, days: 7 });
  };

  const handleSuspendConfirm = async () => {
    const { sellerId, sellerName, days } = suspendModal;
    if (!sellerId || days < 1) return;
    setActionLoading(true);
    try {
      await suspendSeller(sellerId, days);
      const until = new Date();
      until.setDate(until.getDate() + days);
      setSellers((prev) => prev.map((s) => (s.uid === sellerId ? { ...s, status: 'suspended' as const, suspendedUntil: until } : s)));
      setStats((prev) => ({ ...prev, approved: prev.approved - 1, suspended: prev.suspended + 1 }));
      setSuspendModal((m) => ({ ...m, open: false }));
    } catch (error) {
      const message = error instanceof Error ? error.message : (error && typeof (error as { message?: string }).message === 'string' ? (error as { message: string }).message : 'Erreur lors de la suspension');
      console.error('Error suspending seller:', message);
      alert(message);
    } finally {
      setActionLoading(false);
    }
  };

  const openBanModal = (sellerId: string, sellerName: string) => {
    setBanModal({ open: true, sellerId, sellerName });
  };

  const handleBanConfirm = async () => {
    const { sellerId, sellerName } = banModal;
    if (!sellerId) return;
    setActionLoading(true);
    try {
      await banSeller(sellerId);
      setSellers((prev) => prev.map((s) => (s.uid === sellerId ? { ...s, status: 'banned' } : s)));
      const wasApproved = sellers.some((s) => s.uid === sellerId && s.status === 'approved');
      const wasSuspended = sellers.some((s) => s.uid === sellerId && s.status === 'suspended');
      setStats((prev) => ({
        ...prev,
        ...(wasApproved && { approved: prev.approved - 1 }),
        ...(wasSuspended && { suspended: prev.suspended - 1 }),
        banned: prev.banned + 1,
      }));
      setBanModal({ open: false, sellerId: '', sellerName: '' });
    } catch (error) {
      console.error('Error banning seller:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReactivate = async (sellerId: string) => {
    setActionLoading(true);
    try {
      await approveSeller(sellerId);
      setSellers((prev) => prev.map((s) => (s.uid === sellerId ? { ...s, status: 'approved' } : s)));
      setStats((prev) => ({ ...prev, suspended: prev.suspended - 1, approved: prev.approved + 1 }));
    } catch (error) {
      console.error('Error reactivating seller:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnban = async (sellerId: string) => {
    setActionLoading(true);
    try {
      await unbanSeller(sellerId);
      setSellers((prev) => prev.map((s) => (s.uid === sellerId ? { ...s, status: 'approved' } : s)));
      setStats((prev) => ({ ...prev, banned: prev.banned - 1, approved: prev.approved + 1 }));
    } catch (error) {
      console.error('Error unbanning seller:', error);
    } finally {
      setActionLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div style={{ paddingTop: 'var(--header-height)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontSize: 14, color: '#6e6e73' }}>Chargement...</p>
      </div>
    );
  }

  if (!canAccessAdmin) return null;

  const filteredByTab = sellers.filter((s) => filter === 'all' || s.status === filter);
  const q = searchQuery.trim().toLowerCase();
  const filteredSellers = q
    ? filteredByTab.filter(
        (s) =>
          (s.companyName && s.companyName.toLowerCase().includes(q)) ||
          (s.email && s.email.toLowerCase().includes(q)) ||
          (s.displayName && s.displayName.toLowerCase().includes(q))
      )
    : filteredByTab;

  const filterLabels = {
    pending: `En attente (${stats.pending})`,
    approved: `Validés (${stats.approved})`,
    rejected: `Refusés (${stats.rejected})`,
    suspended: `Suspendus (${stats.suspended})`,
    banned: `Bannis (${stats.banned})`,
    all: 'Tous',
  } as const;
  const filterLabelsShort = {
    pending: 'En attente',
    approved: 'Validés',
    rejected: 'Refusés',
    suspended: 'Suspendus',
    banned: 'Bannis',
    all: 'Tous',
  } as const;

  const newsletterStats = {
    total: newsletterSubscribers.length,
    subscribed: newsletterSubscribers.filter((s) => s.status === 'subscribed').length,
    unsubscribed: newsletterSubscribers.filter((s) => s.status === 'unsubscribed').length,
  };
  const newsletterRowsForTab =
    newsletterFilter === 'all' ? newsletterSubscribers : newsletterSubscribers.filter((s) => s.status === newsletterFilter);
  const newsletterSearchQ = newsletterListSearch.trim().toLowerCase();
  const filteredNewsletter = newsletterSearchQ
    ? newsletterRowsForTab.filter(
        (s) =>
          s.email.toLowerCase().includes(newsletterSearchQ) ||
          s.id.toLowerCase().includes(newsletterSearchQ)
      )
    : newsletterRowsForTab;

  const adminSubtitle =
    adminSection === 'vendeurs'
      ? 'Gestion des demandes vendeurs'
      : adminSection === 'comptes'
        ? 'Suivi des comptes visiteurs et vendeurs'
        : 'Inscriptions et désinscriptions newsletter';

  return (
    <div style={{ paddingTop: 'var(--header-height)', minHeight: '100vh' }}>
      <div className="admin-page-inner" style={{ maxWidth: 1100, margin: '0 auto', padding: '30px 24px 60px' }}>
        {/* Header — même style que Mes annonces */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: 28, fontWeight: 500, marginBottom: 8, color: '#1d1d1f' }}>
            Admin
          </h1>
          <p style={{ fontSize: 14, color: '#6e6e73', marginBottom: 16 }}>{adminSubtitle}</p>
          <div className="admin-section-tabs" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setAdminSection('vendeurs')}
              style={{
                padding: '10px 18px',
                fontSize: 14,
                fontWeight: 500,
                backgroundColor: adminSection === 'vendeurs' ? '#1d1d1f' : '#fff',
                color: adminSection === 'vendeurs' ? '#fff' : '#1d1d1f',
                border: adminSection === 'vendeurs' ? 'none' : '1px solid #d2d2d7',
                borderRadius: 12,
                cursor: 'pointer',
              }}
            >
              Demandes
            </button>
            <button
              type="button"
              onClick={() => setAdminSection('comptes')}
              style={{
                padding: '10px 18px',
                fontSize: 14,
                fontWeight: 500,
                backgroundColor: adminSection === 'comptes' ? '#1d1d1f' : '#fff',
                color: adminSection === 'comptes' ? '#fff' : '#1d1d1f',
                border: adminSection === 'comptes' ? 'none' : '1px solid #d2d2d7',
                borderRadius: 12,
                cursor: 'pointer',
              }}
            >
              Comptes
            </button>
            <button
              type="button"
              onClick={() => setAdminSection('newsletter')}
              style={{
                padding: '10px 18px',
                fontSize: 14,
                fontWeight: 500,
                backgroundColor: adminSection === 'newsletter' ? '#1d1d1f' : '#fff',
                color: adminSection === 'newsletter' ? '#fff' : '#1d1d1f',
                border: adminSection === 'newsletter' ? 'none' : '1px solid #d2d2d7',
                borderRadius: 12,
                cursor: 'pointer',
              }}
            >
              Newsletters
            </button>
          </div>
        </div>

        {/* Section Demandes */}
        {adminSection === 'vendeurs' && (
          <>
        {loading ? (
          <p style={{ color: '#6e6e73', marginBottom: 24 }}>Chargement...</p>
        ) : (
          <>
        {/* Stats — cartes comme Mes annonces */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 32 }}>
          <div style={{ padding: 16, border: '1px solid #e8e8ed', borderRadius: 12, backgroundColor: '#fff', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, backgroundColor: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10 }}>
              <Users size={22} color="#2563eb" />
            </div>
            <div>
              <p style={{ fontSize: 11, color: '#86868b', marginBottom: 2 }}>Total</p>
              <p style={{ fontSize: 22, fontWeight: 600, color: '#1d1d1f' }}>{stats.total}</p>
            </div>
          </div>
          <div style={{ padding: 16, border: '1px solid #e8e8ed', borderRadius: 12, backgroundColor: '#fff', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, backgroundColor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10 }}>
              <Clock size={22} color="#92400e" />
            </div>
            <div>
              <p style={{ fontSize: 11, color: '#86868b', marginBottom: 2 }}>En attente</p>
              <p style={{ fontSize: 22, fontWeight: 600, color: '#1d1d1f' }}>{stats.pending}</p>
            </div>
          </div>
          <div style={{ padding: 16, border: '1px solid #e8e8ed', borderRadius: 12, backgroundColor: '#fff', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, backgroundColor: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10 }}>
              <CheckCircle size={22} color="#166534" />
            </div>
            <div>
              <p style={{ fontSize: 11, color: '#86868b', marginBottom: 2 }}>Validés</p>
              <p style={{ fontSize: 22, fontWeight: 600, color: '#1d1d1f' }}>{stats.approved}</p>
            </div>
          </div>
          <div style={{ padding: 16, border: '1px solid #e8e8ed', borderRadius: 12, backgroundColor: '#fff', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, backgroundColor: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10 }}>
              <XCircle size={22} color="#991b1b" />
            </div>
            <div>
              <p style={{ fontSize: 11, color: '#86868b', marginBottom: 2 }}>Refusés</p>
              <p style={{ fontSize: 22, fontWeight: 600, color: '#1d1d1f' }}>{stats.rejected}</p>
            </div>
          </div>
          <div style={{ padding: 16, border: '1px solid #e8e8ed', borderRadius: 12, backgroundColor: '#fff', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, backgroundColor: '#f3e8ff', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10 }}>
              <Clock size={22} color="#6b21a8" />
            </div>
            <div>
              <p style={{ fontSize: 11, color: '#86868b', marginBottom: 2 }}>Suspendus</p>
              <p style={{ fontSize: 22, fontWeight: 600, color: '#1d1d1f' }}>{stats.suspended}</p>
            </div>
          </div>
          <div style={{ padding: 16, border: '1px solid #e8e8ed', borderRadius: 12, backgroundColor: '#fff', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, backgroundColor: '#1f2937', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10 }}>
              <XCircle size={22} color="#fff" />
            </div>
            <div>
              <p style={{ fontSize: 11, color: '#86868b', marginBottom: 2 }}>Bannis</p>
              <p style={{ fontSize: 22, fontWeight: 600, color: '#1d1d1f' }}>{stats.banned}</p>
            </div>
          </div>
        </div>

        {/* Filtres — boutons style vendeur */}
        <div className="admin-filters-row admin-vendeur-filters-row" style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {(['pending', 'approved', 'suspended', 'rejected', 'banned', 'all'] as const).map((f) => (
            <button
              key={f}
              className={f === 'all' ? 'admin-filter-btn admin-filter-all' : 'admin-filter-btn'}
              onClick={() => setFilter(f)}
              style={{
                padding: '10px 18px',
                fontSize: 14,
                fontWeight: 500,
                backgroundColor: filter === f ? '#1d1d1f' : '#fff',
                color: filter === f ? '#fff' : '#1d1d1f',
                border: filter === f ? 'none' : '1px solid #d2d2d7',
                borderRadius: 12,
                cursor: 'pointer',
                transition: 'background-color 0.2s, color 0.2s, border-color 0.2s',
              }}
            >
              {f === 'all' ? 'Tous' : <>{filterLabelsShort[f]} <span className="admin-filter-count">({stats[f]})</span></>}
            </button>
          ))}
        </div>

        <div style={{ marginBottom: 20, position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#86868b', pointerEvents: 'none' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher dans les vendeurs..."
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

        {/* Liste vendeurs — cartes comme les annonces */}
        {filteredSellers.length === 0 ? (
          <div style={{ padding: 60, border: '1px solid #e8e8ed', borderRadius: 12, textAlign: 'center', backgroundColor: '#fff' }}>
            <Users size={48} color="#d2d2d7" style={{ display: 'block', margin: '0 auto 16px' }} />
            <h3 style={{ fontFamily: 'var(--font-inter), var(--font-sans)', fontSize: 17, fontWeight: 600, marginBottom: 8, color: '#1d1d1f' }}>
              {q
                ? `Aucun résultat pour « ${searchQuery.trim()} »`
                : filter === 'rejected'
                  ? 'Aucun refusé'
                  : filter === 'approved'
                    ? 'Aucun validé'
                    : filter === 'suspended'
                      ? 'Aucun suspendu'
                      : filter === 'banned'
                        ? 'Aucun banni'
                        : filter === 'pending'
                          ? 'Aucune demande en attente'
                          : 'Aucune demande'}
            </h3>
            <p style={{ fontFamily: 'var(--font-inter), var(--font-sans)', fontSize: 14, fontWeight: 400, color: '#6e6e73' }}>
              {q ? 'Modifiez votre recherche.' : filter === 'rejected' ? 'Aucune demande refusée actuellement.' : filter === 'approved' ? 'Aucun validé actuellement.' : filter === 'suspended' ? 'Aucun vendeur suspendu.' : filter === 'banned' ? 'Aucun vendeur banni.' : filter === 'pending' ? "Vous n'avez aucune demande en attente à ce jour." : 'Aucune demande pour le moment.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
            {filteredSellers.map((seller) => (
              <div
                key={seller.uid}
                style={{
                  border: '1px solid #e8e8ed',
                  borderRadius: 12,
                  overflow: 'hidden',
                  backgroundColor: '#fff',
                  transition: 'box-shadow 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ padding: '20px 20px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ fontFamily: 'var(--font-inter), var(--font-sans)', fontSize: 17, fontWeight: 600, marginBottom: 6, color: '#1d1d1f' }}>{seller.companyName}</h3>
                      <p style={{ fontSize: 13, color: '#6e6e73', marginBottom: 4 }}>{seller.email}</p>
                      <p style={{ fontSize: 12, color: '#86868b' }}>Demande le {formatDate(seller.createdAt)}</p>
                    </div>
                    <span
                      style={{
                        padding: '4px 10px',
                        fontSize: 12,
                        fontWeight: 500,
                        borderRadius: 6,
                        flexShrink: 0,
                        backgroundColor: seller.status === 'approved' ? '#dcfce7' : seller.status === 'pending' ? '#fef3c7' : seller.status === 'suspended' ? '#ffedd5' : seller.status === 'banned' ? '#1f2937' : '#fee2e2',
                        color: seller.status === 'approved' ? '#166534' : seller.status === 'pending' ? '#92400e' : seller.status === 'suspended' ? '#c2410c' : seller.status === 'banned' ? '#fff' : '#991b1b',
                      }}
                    >
                      {seller.status === 'approved' ? 'Validé' : seller.status === 'pending' ? 'En attente' : seller.status === 'suspended' ? 'Suspendu' : seller.status === 'banned' ? 'Banni' : 'Refusé'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', width: '100%' }}>
                    <Link
                      href={`/admin/vendeurs/${seller.uid}`}
                      style={{
                        display: 'inline-flex',
                        flex: 1,
                        minWidth: 0,
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        padding: '6px 14px',
                        border: '1px solid #d2d2d7',
                        backgroundColor: '#fff',
                        fontSize: 13,
                        fontWeight: 500,
                        borderRadius: 8,
                        color: '#1d1d1f',
                        textDecoration: 'none',
                      }}
                    >
                      <Eye size={14} /> Détails
                    </Link>
                    {seller.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApprove(seller.uid)}
                          disabled={actionLoading}
                          style={{
                            flex: 1,
                            minWidth: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '6px 14px',
                            backgroundColor: '#1d1d1f',
                            color: '#fff',
                            border: 'none',
                            fontSize: 13,
                            fontWeight: 500,
                            borderRadius: 8,
                            cursor: actionLoading ? 'not-allowed' : 'pointer',
                          }}
                        >
                          Valider
                        </button>
                        <button
                          onClick={() => handleReject(seller.uid)}
                          disabled={actionLoading}
                          style={{
                            flex: 1,
                            minWidth: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '6px 14px',
                            backgroundColor: '#dc2626',
                            color: '#fff',
                            border: 'none',
                            fontSize: 13,
                            fontWeight: 500,
                            borderRadius: 8,
                            cursor: actionLoading ? 'not-allowed' : 'pointer',
                          }}
                        >
                          Refuser
                        </button>
                      </>
                    )}
                    {seller.status === 'approved' && (
                      <>
                        <button
                          onClick={() => openSuspendModal(seller.uid, seller.companyName)}
                          disabled={actionLoading}
                          style={{
                            flex: 1,
                            minWidth: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '6px 14px',
                            backgroundColor: '#c2410c',
                            color: '#fff',
                            border: 'none',
                            fontSize: 13,
                            fontWeight: 500,
                            borderRadius: 8,
                            cursor: actionLoading ? 'not-allowed' : 'pointer',
                          }}
                        >
                          Suspendre
                        </button>
                        <button
                          onClick={() => openBanModal(seller.uid, seller.companyName)}
                          disabled={actionLoading}
                          style={{
                            flex: 1,
                            minWidth: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '6px 14px',
                            backgroundColor: '#dc2626',
                            color: '#fff',
                            border: 'none',
                            fontSize: 13,
                            fontWeight: 500,
                            borderRadius: 8,
                            cursor: actionLoading ? 'not-allowed' : 'pointer',
                          }}
                        >
                          Bannir
                        </button>
                      </>
                    )}
                    {seller.status === 'suspended' && (
                      <>
                        <button
                          onClick={() => handleReactivate(seller.uid)}
                          disabled={actionLoading}
                          style={{
                            flex: 1,
                            minWidth: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '6px 14px',
                            backgroundColor: '#1d1d1f',
                            color: '#fff',
                            border: 'none',
                            fontSize: 13,
                            fontWeight: 500,
                            borderRadius: 8,
                            cursor: actionLoading ? 'not-allowed' : 'pointer',
                          }}
                        >
                          Réactiver
                        </button>
                        <button
                          onClick={() => openBanModal(seller.uid, seller.companyName)}
                          disabled={actionLoading}
                          style={{
                            flex: 1,
                            minWidth: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '6px 14px',
                            backgroundColor: '#dc2626',
                            color: '#fff',
                            border: 'none',
                            fontSize: 13,
                            fontWeight: 500,
                            borderRadius: 8,
                            cursor: actionLoading ? 'not-allowed' : 'pointer',
                          }}
                        >
                          Bannir
                        </button>
                      </>
                    )}
                    {seller.status === 'banned' && (
                      <button
                        onClick={() => handleUnban(seller.uid)}
                        disabled={actionLoading}
                        style={{
                          flex: 1,
                          minWidth: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '6px 14px',
                          backgroundColor: '#1d1d1f',
                          color: '#fff',
                          border: 'none',
                          fontSize: 13,
                          fontWeight: 500,
                          borderRadius: 8,
                          cursor: actionLoading ? 'not-allowed' : 'pointer',
                        }}
                      >
                        Réactiver
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
          </>
        )}
        </>
        )}

        {/* Section Comptes */}
        {adminSection === 'comptes' && (
          <>
            {accountError && (
              <div style={{ padding: 16, backgroundColor: '#fef2f2', borderRadius: 12, color: '#dc2626', marginBottom: 24 }}>
                {accountError}
              </div>
            )}
            {accountLoading && !accountStats && <p style={{ color: '#6e6e73', marginBottom: 16 }}>Chargement des statistiques…</p>}

            <div
              className="admin-account-stats-scroll"
              style={{
                marginBottom: 32,
                width: '100%',
                overflowX: 'auto',
                WebkitOverflowScrolling: 'touch',
              }}
            >
              <div
                className="admin-account-stats-grid"
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    (accountStats?.subscriptionByTier.other ?? 0) > 0
                      ? 'repeat(6, minmax(120px, 1fr))'
                      : 'repeat(5, minmax(120px, 1fr))',
                  gap: 12,
                  minWidth:
                    (accountStats?.subscriptionByTier.other ?? 0) > 0 ? 720 : 600,
                }}
              >
                <div style={{ padding: 16, border: '1px solid #e8e8ed', borderRadius: 12, backgroundColor: '#fff', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 44, height: 44, backgroundColor: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10 }}>
                    <User size={22} color="#0369a1" />
                  </div>
                  <div>
                    <p style={{ fontSize: 11, color: '#86868b', marginBottom: 2 }}>Visiteurs</p>
                    <p style={{ fontSize: 22, fontWeight: 600, color: '#1d1d1f' }}>
                      {accountLoading ? '—' : (accountStats?.visitorAccounts ?? '—')}
                    </p>
                  </div>
                </div>
                <div style={{ padding: 16, border: '1px solid #e8e8ed', borderRadius: 12, backgroundColor: '#fff', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 44, height: 44, backgroundColor: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10 }}>
                    <Store size={22} color="#5b21b6" />
                  </div>
                  <div>
                    <p style={{ fontSize: 11, color: '#86868b', marginBottom: 2 }}>Vendeurs</p>
                    <p style={{ fontSize: 22, fontWeight: 600, color: '#1d1d1f' }}>
                      {accountLoading ? '—' : (accountStats?.sellerAccounts ?? '—')}
                    </p>
                  </div>
                </div>
                <div style={{ padding: 16, border: '1px solid #e8e8ed', borderRadius: 12, backgroundColor: '#fff', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 44, height: 44, backgroundColor: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10 }}>
                    <Rocket size={22} color="#c2410c" />
                  </div>
                  <div>
                    <p style={{ fontSize: 11, color: '#86868b', marginBottom: 2 }}>Start</p>
                    <p style={{ fontSize: 22, fontWeight: 600, color: '#1d1d1f' }}>
                      {accountLoading ? '—' : (accountStats?.subscriptionByTier.start ?? '—')}
                    </p>
                  </div>
                </div>
                <div style={{ padding: 16, border: '1px solid #e8e8ed', borderRadius: 12, backgroundColor: '#fff', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 44, height: 44, backgroundColor: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10 }}>
                    <PlusCircle size={22} color="#15803d" />
                  </div>
                  <div>
                    <p style={{ fontSize: 11, color: '#86868b', marginBottom: 2 }}>Plus</p>
                    <p style={{ fontSize: 22, fontWeight: 600, color: '#1d1d1f' }}>
                      {accountLoading ? '—' : (accountStats?.subscriptionByTier.plus ?? '—')}
                    </p>
                  </div>
                </div>
                <div style={{ padding: 16, border: '1px solid #e8e8ed', borderRadius: 12, backgroundColor: '#fff', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 44, height: 44, backgroundColor: '#f3e8ff', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10 }}>
                    <Crown size={22} color="#7c3aed" />
                  </div>
                  <div>
                    <p style={{ fontSize: 11, color: '#86868b', marginBottom: 2 }}>Pro</p>
                    <p style={{ fontSize: 22, fontWeight: 600, color: '#1d1d1f' }}>
                      {accountLoading ? '—' : (accountStats?.subscriptionByTier.pro ?? '—')}
                    </p>
                  </div>
                </div>
                {(accountStats?.subscriptionByTier.other ?? 0) > 0 && (
                  <div style={{ padding: 16, border: '1px solid #e8e8ed', borderRadius: 12, backgroundColor: '#fff' }}>
                    <p style={{ fontSize: 11, color: '#86868b', marginBottom: 4 }}>Autre</p>
                    <p style={{ fontSize: 22, fontWeight: 600, color: '#1d1d1f' }}>{accountStats!.subscriptionByTier.other}</p>
                  </div>
                )}
              </div>
            </div>

            <div
              className="admin-filters-row admin-account-filters-row"
              style={{
                display: 'flex',
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: 8,
                alignItems: 'center',
                justifyContent: 'flex-start',
                marginBottom: 24,
              }}
            >
              {(
                [
                  [
                    { key: 'visitors' as const, label: 'Visiteurs', count: accountStats?.visitorAccounts },
                    { key: 'sellers' as const, label: 'Vendeurs', count: accountStats?.sellerAccounts },
                  ],
                  [
                    { key: 'start' as const, label: 'Start', count: accountStats?.subscriptionByTier.start },
                    { key: 'plus' as const, label: 'Plus', count: accountStats?.subscriptionByTier.plus },
                    { key: 'pro' as const, label: 'Pro', count: accountStats?.subscriptionByTier.pro },
                  ],
                ] as const
              ).map((group, groupIndex) => (
                <div
                  key={groupIndex}
                  className="admin-account-filters-group"
                  style={{ display: 'flex', flexWrap: 'nowrap', gap: 8 }}
                >
                  {group.map(({ key, label, count }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setAccountTab(key);
                        setAccountListItems([]);
                        setAccountListLoading(true);
                      }}
                      style={{
                        padding: '10px 18px',
                        fontSize: 14,
                        fontWeight: 500,
                        backgroundColor: accountTab === key ? '#1d1d1f' : '#fff',
                        color: accountTab === key ? '#fff' : '#1d1d1f',
                        border: accountTab === key ? 'none' : '1px solid #d2d2d7',
                        borderRadius: 12,
                        cursor: 'pointer',
                        transition: 'background-color 0.2s, color 0.2s, border-color 0.2s',
                      }}
                    >
                      {label}{' '}
                      <span className="admin-filter-count">
                        ({accountLoading && count === undefined ? '—' : count ?? '—'})
                      </span>
                    </button>
                  ))}
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 20, position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#86868b', pointerEvents: 'none' }} />
              <input
                type="text"
                value={accountListSearch}
                onChange={(e) => setAccountListSearch(e.target.value)}
                placeholder="Rechercher..."
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

            {accountListLoading && accountListItems.length === 0 ? (
              <p style={{ color: '#6e6e73', marginBottom: 24 }}>Chargement…</p>
            ) : accountTab === 'visitors' ? (
              accountListItems.length === 0 ? (
                <div style={{ padding: 60, border: '1px solid #e8e8ed', borderRadius: 12, textAlign: 'center', backgroundColor: '#fff' }}>
                  <User size={48} color="#d2d2d7" style={{ display: 'block', margin: '0 auto 16px' }} />
                  <h3 style={{ fontFamily: 'var(--font-inter), var(--font-sans)', fontSize: 17, fontWeight: 600, marginBottom: 8, color: '#1d1d1f' }}>
                    {accountListSearch.trim()
                      ? `Aucun résultat pour « ${accountListSearch.trim()} »`
                      : 'Aucun visiteur'}
                  </h3>
                  <p style={{ fontSize: 14, color: '#6e6e73' }}>
                    {accountListSearch.trim() ? 'Modifiez votre recherche.' : 'Tous les utilisateurs ont une fiche vendeur.'}
                  </p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
                  {(accountListItems as VisitorAccountRow[]).map((row) => (
                    <div
                      key={row.id}
                      style={{
                        border: '1px solid #e8e8ed',
                        borderRadius: 12,
                        padding: '20px',
                        backgroundColor: '#fff',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 17, fontWeight: 600, color: '#1d1d1f', marginBottom: 6 }}>{row.display_name || '—'}</p>
                          <p style={{ fontSize: 13, color: '#6e6e73', marginBottom: 4 }}>{row.email}</p>
                          <p style={{ fontSize: 12, color: '#86868b' }}>Inscrit le {formatDate(new Date(row.created_at))}</p>
                        </div>
                        <span
                          style={{
                            padding: '4px 10px',
                            fontSize: 12,
                            fontWeight: 500,
                            borderRadius: 6,
                            flexShrink: 0,
                            backgroundColor: '#f5f5f7',
                            color: '#424245',
                          }}
                        >
                          {row.role === 'admin' ? 'Admin' : row.role === 'seller' ? 'Vendeur' : 'Acheteur'}
                        </span>
                      </div>
                      <p style={{ fontSize: 11, color: '#86868b', fontFamily: 'ui-monospace, monospace', wordBreak: 'break-all' }}>{row.id}</p>
                    </div>
                  ))}
                </div>
              )
            ) : accountListItems.length === 0 ? (
              <div style={{ padding: 60, border: '1px solid #e8e8ed', borderRadius: 12, textAlign: 'center', backgroundColor: '#fff' }}>
                <Store size={48} color="#d2d2d7" style={{ display: 'block', margin: '0 auto 16px' }} />
                <h3 style={{ fontFamily: 'var(--font-inter), var(--font-sans)', fontSize: 17, fontWeight: 600, marginBottom: 8, color: '#1d1d1f' }}>
                  {accountListSearch.trim()
                    ? `Aucun résultat pour « ${accountListSearch.trim()} »`
                    : 'Aucune fiche vendeur dans cette catégorie'}
                </h3>
                <p style={{ fontSize: 14, color: '#6e6e73' }}>
                  {accountListSearch.trim() ? 'Modifiez votre recherche.' : 'Les vendeurs correspondants apparaîtront ici.'}
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
                {(accountListItems as SellerAccountRow[]).map((row) => {
                  const st = row.status;
                  const tierLabel =
                    row.subscription_tier === 'plus'
                      ? 'Plus'
                      : row.subscription_tier === 'pro'
                        ? 'Pro'
                        : row.subscription_tier === 'start' || row.subscription_tier == null
                          ? 'Start'
                          : String(row.subscription_tier);
                  return (
                    <div
                      key={row.id}
                      style={{
                        border: '1px solid #e8e8ed',
                        borderRadius: 12,
                        overflow: 'hidden',
                        backgroundColor: '#fff',
                      }}
                    >
                      <div style={{ padding: '20px 20px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <h3 style={{ fontFamily: 'var(--font-inter), var(--font-sans)', fontSize: 17, fontWeight: 600, marginBottom: 6, color: '#1d1d1f' }}>
                              {row.company_name}
                            </h3>
                            <p style={{ fontSize: 13, color: '#6e6e73', marginBottom: 4 }}>{row.email}</p>
                            {row.phone ? <p style={{ fontSize: 13, color: '#6e6e73', marginBottom: 4 }}>{row.phone}</p> : null}
                            <p style={{ fontSize: 12, color: '#86868b' }}>Fiche le {formatDate(new Date(row.created_at))}</p>
                          </div>
                          <span
                            style={{
                              padding: '4px 10px',
                              fontSize: 12,
                              fontWeight: 500,
                              borderRadius: 6,
                              flexShrink: 0,
                              backgroundColor:
                                st === 'approved' ? '#dcfce7' : st === 'pending' ? '#fef3c7' : st === 'suspended' ? '#ffedd5' : st === 'banned' ? '#1f2937' : '#fee2e2',
                              color:
                                st === 'approved' ? '#166534' : st === 'pending' ? '#92400e' : st === 'suspended' ? '#c2410c' : st === 'banned' ? '#fff' : '#991b1b',
                            }}
                          >
                            {st === 'approved'
                              ? 'Validé'
                              : st === 'pending'
                                ? 'En attente'
                                : st === 'suspended'
                                  ? 'Suspendu'
                                  : st === 'banned'
                                    ? 'Banni'
                                    : 'Refusé'}
                          </span>
                        </div>
                        <p style={{ fontSize: 12, color: '#86868b', marginBottom: 12 }}>
                          Abonnement : <strong style={{ color: '#1d1d1f' }}>{tierLabel}</strong>
                        </p>
                        <Link
                          href={`/admin/vendeurs/${row.id}`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                            padding: '8px 14px',
                            border: '1px solid #d2d2d7',
                            backgroundColor: '#fff',
                            fontSize: 13,
                            fontWeight: 500,
                            borderRadius: 8,
                            color: '#1d1d1f',
                            textDecoration: 'none',
                          }}
                        >
                          <Eye size={14} /> Détails vendeur
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Section Newsletters */}
        {adminSection === 'newsletter' && (
          <>
            {newsletterError && (
              <div style={{ padding: 16, backgroundColor: '#fef2f2', borderRadius: 12, color: '#dc2626', marginBottom: 24 }}>
                {newsletterError}
              </div>
            )}
            {/* Stats — cartes comme section Compte */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 32 }}>
              <div style={{ padding: 16, border: '1px solid #e8e8ed', borderRadius: 12, backgroundColor: '#fff', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, backgroundColor: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10 }}>
                  <Mail size={22} color="#2563eb" />
                </div>
                <div>
                  <p style={{ fontSize: 11, color: '#86868b', marginBottom: 2 }}>Total</p>
                  <p style={{ fontSize: 22, fontWeight: 600, color: '#1d1d1f' }}>{newsletterLoading ? '—' : newsletterStats.total}</p>
                </div>
              </div>
              <div style={{ padding: 16, border: '1px solid #e8e8ed', borderRadius: 12, backgroundColor: '#fff', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, backgroundColor: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10 }}>
                  <CheckCircle size={22} color="#166534" />
                </div>
                <div>
                  <p style={{ fontSize: 11, color: '#86868b', marginBottom: 2 }}>Inscrit</p>
                  <p style={{ fontSize: 22, fontWeight: 600, color: '#1d1d1f' }}>{newsletterLoading ? '—' : newsletterStats.subscribed}</p>
                </div>
              </div>
              <div style={{ padding: 16, border: '1px solid #e8e8ed', borderRadius: 12, backgroundColor: '#fff', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, backgroundColor: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10 }}>
                  <XCircle size={22} color="#dc2626" />
                </div>
                <div>
                  <p style={{ fontSize: 11, color: '#86868b', marginBottom: 2 }}>Désinscrit</p>
                  <p style={{ fontSize: 22, fontWeight: 600, color: '#1d1d1f' }}>{newsletterLoading ? '—' : newsletterStats.unsubscribed}</p>
                </div>
              </div>
            </div>
            <div className="admin-filters-row admin-newsletter-filters-row" style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
              {(['subscribed', 'unsubscribed', 'all'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setNewsletterFilter(f)}
                  style={{
                    padding: '10px 18px',
                    fontSize: 14,
                    fontWeight: 500,
                    backgroundColor: newsletterFilter === f ? '#1d1d1f' : '#fff',
                    color: newsletterFilter === f ? '#fff' : '#1d1d1f',
                    border: newsletterFilter === f ? 'none' : '1px solid #d2d2d7',
                    borderRadius: 12,
                    cursor: 'pointer',
                  }}
                >
                  {f === 'subscribed'
                    ? `Inscrits${newsletterFilter === 'subscribed' ? ` (${newsletterRowsForTab.length})` : ''}`
                    : f === 'unsubscribed'
                      ? `Désinscrits${newsletterFilter === 'unsubscribed' ? ` (${newsletterRowsForTab.length})` : ''}`
                      : `Tous${newsletterFilter === 'all' ? ` (${newsletterRowsForTab.length})` : ''}`}
                </button>
              ))}
            </div>
            <div style={{ marginBottom: 20, position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#86868b', pointerEvents: 'none' }} />
              <input
                type="text"
                value={newsletterListSearch}
                onChange={(e) => setNewsletterListSearch(e.target.value)}
                placeholder="Rechercher..."
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
            {newsletterLoading ? (
              <p style={{ color: '#6e6e73' }}>Chargement...</p>
            ) : filteredNewsletter.length === 0 ? (
              <div style={{ padding: 60, border: '1px solid #e8e8ed', borderRadius: 12, textAlign: 'center', backgroundColor: '#fff' }}>
                <Mail size={48} color="#d2d2d7" style={{ display: 'block', margin: '0 auto 16px' }} />
                <h3 style={{ fontFamily: 'var(--font-inter), var(--font-sans)', fontSize: 17, fontWeight: 600, marginBottom: 8, color: '#1d1d1f' }}>
                  {newsletterSearchQ && newsletterRowsForTab.length > 0
                    ? `Aucun résultat pour « ${newsletterListSearch.trim()} »`
                    : newsletterFilter === 'subscribed'
                      ? 'Aucun inscrit pour le moment.'
                      : newsletterFilter === 'unsubscribed'
                        ? 'Aucun désinscrit.'
                        : 'Aucun enregistrement.'}
                </h3>
                <p style={{ fontSize: 14, color: '#6e6e73' }}>
                  {newsletterSearchQ && newsletterRowsForTab.length > 0
                    ? 'Modifiez votre recherche.'
                    : 'Les inscriptions du footer apparaîtront ici.'}
                </p>
              </div>
            ) : (
              <div style={{ border: '1px solid #e8e8ed', borderRadius: 12, backgroundColor: '#fff', overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #e8e8ed', backgroundColor: '#fbfbfb' }}>
                        <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: '#1d1d1f' }}>Email</th>
                        <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: '#1d1d1f' }}>Statut</th>
                        <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: '#1d1d1f' }}>Inscrit le</th>
                        <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: '#1d1d1f' }}>Désinscrit le</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredNewsletter.map((s) => (
                        <tr key={s.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                          <td style={{ padding: '12px 16px', color: '#1d1d1f' }}>{s.email}</td>
                          <td style={{ padding: '12px 16px' }}>
                            <span
                              style={{
                                padding: '4px 10px',
                                borderRadius: 8,
                                fontSize: 12,
                                fontWeight: 500,
                                backgroundColor: s.status === 'subscribed' ? '#dcfce7' : '#f3f4f6',
                                color: s.status === 'subscribed' ? '#166534' : '#6b7280',
                              }}
                            >
                              {s.status === 'subscribed' ? 'Inscrit' : 'Désinscrit'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px', color: '#6e6e73' }}>{formatDate(new Date(s.subscribed_at))}</td>
                          <td style={{ padding: '12px 16px', color: '#6e6e73' }}>{s.unsubscribed_at ? formatDate(new Date(s.unsubscribed_at)) : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal suspension */}
      {suspendModal.open && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            backgroundColor: 'rgba(0,0,0,0.4)',
          }}
          onClick={() => !actionLoading && setSuspendModal((m) => ({ ...m, open: false }))}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 400,
              backgroundColor: '#fff',
              borderRadius: 16,
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
              padding: 24,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ flex: 1, fontFamily: 'var(--font-inter), var(--font-sans)', fontSize: 18, fontWeight: 600, margin: 0, color: '#1d1d1f', textAlign: 'center' }}>
                Suspendre le vendeur
              </h2>
              <button
                type="button"
                aria-label="Fermer"
                onClick={() => !actionLoading && setSuspendModal((m) => ({ ...m, open: false }))}
                style={{
                  width: 36,
                  height: 36,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: 'none',
                  background: '#f5f5f7',
                  borderRadius: 10,
                  cursor: actionLoading ? 'not-allowed' : 'pointer',
                }}
              >
                <X size={18} />
              </button>
            </div>
            <p style={{ fontSize: 14, color: '#6e6e73', marginBottom: 16, textAlign: 'justify' }}>
              <strong>{suspendModal.sellerName}</strong> ne pourra plus déposer d&apos;annonces pendant la période choisie et ses annonces seront désactivées jusqu&apos;à réactivation du compte.
            </p>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 8, color: '#333' }}>
              Nombre de jours
            </label>
            <style dangerouslySetInnerHTML={{ __html: '.admin-suspend-dropdown button:hover { background: #e8e8ed !important; }' }} />
            <div style={{ position: 'relative', marginBottom: 24 }}>
              <button
                type="button"
                onClick={() => setSuspendDaysDropdownOpen((o) => !o)}
                onBlur={() => setTimeout(() => setSuspendDaysDropdownOpen(false), 200)}
                style={{
                  width: '100%',
                  height: 50,
                  padding: '0 16px',
                  paddingRight: 40,
                  fontSize: 15,
                  border: '1px solid #d2d2d7',
                  borderRadius: 12,
                  boxSizing: 'border-box',
                  outline: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  color: suspendModal.days ? '#1d1d1f' : '#86868b',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2386868b' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 14px center',
                  backgroundColor: '#fff',
                }}
              >
                {SUSPEND_DAY_OPTIONS.find((o) => o.value === suspendModal.days)?.label ?? 'Sélectionner'}
              </button>
              {suspendDaysDropdownOpen && (
                <div
                  className="admin-suspend-dropdown"
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: 4,
                    maxHeight: 220,
                    overflowY: 'auto',
                    backgroundColor: '#fff',
                    border: '1px solid #d2d2d7',
                    borderRadius: 10,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    zIndex: 10,
                  }}
                >
                  {SUSPEND_DAY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setSuspendModal((m) => ({ ...m, days: opt.value }));
                        setSuspendDaysDropdownOpen(false);
                      }}
                      style={{
                        display: 'block',
                        width: '100%',
                        padding: '6px 12px',
                        textAlign: 'left',
                        fontSize: 15,
                        color: '#1d1d1f',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 12, width: '100%' }}>
              <button
                type="button"
                onClick={() => !actionLoading && setSuspendModal((m) => ({ ...m, open: false }))}
                style={{
                  flex: 1,
                  padding: '10px 20px',
                  fontSize: 14,
                  fontWeight: 500,
                  color: '#1d1d1f',
                  background: '#f5f5f7',
                  border: 'none',
                  borderRadius: 10,
                  cursor: actionLoading ? 'not-allowed' : 'pointer',
                }}
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSuspendConfirm}
                disabled={actionLoading}
                style={{
                  flex: 1,
                  padding: '10px 20px',
                  fontSize: 14,
                  fontWeight: 500,
                  color: '#fff',
                  background: '#c2410c',
                  border: 'none',
                  borderRadius: 10,
                  cursor: actionLoading ? 'not-allowed' : 'pointer',
                  opacity: actionLoading ? 0.7 : 1,
                }}
              >
                {actionLoading ? 'En cours...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal bannir */}
      {banModal.open && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            backgroundColor: 'rgba(0,0,0,0.4)',
          }}
          onClick={() => !actionLoading && setBanModal({ open: false, sellerId: '', sellerName: '' })}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 400,
              backgroundColor: '#fff',
              borderRadius: 16,
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
              padding: 24,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ flex: 1, fontFamily: 'var(--font-inter), var(--font-sans)', fontSize: 18, fontWeight: 600, margin: 0, color: '#1d1d1f', textAlign: 'center' }}>
                Bannir le vendeur
              </h2>
              <button
                type="button"
                aria-label="Fermer"
                onClick={() => !actionLoading && setBanModal({ open: false, sellerId: '', sellerName: '' })}
                style={{
                  width: 36,
                  height: 36,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: 'none',
                  background: '#f5f5f7',
                  borderRadius: 10,
                  cursor: actionLoading ? 'not-allowed' : 'pointer',
                }}
              >
                <X size={18} />
              </button>
            </div>
            <p style={{ fontSize: 14, color: '#6e6e73', marginBottom: 24, lineHeight: 1.5, textAlign: 'justify' }}>
              <strong>{banModal.sellerName}</strong> ne pourra plus déposer d&apos;annonces et ses annonces seront désactivées jusqu&apos;à nouvel ordre.
            </p>
            <div style={{ display: 'flex', gap: 12, width: '100%' }}>
              <button
                type="button"
                onClick={() => !actionLoading && setBanModal({ open: false, sellerId: '', sellerName: '' })}
                style={{
                  flex: 1,
                  padding: '10px 20px',
                  fontSize: 14,
                  fontWeight: 500,
                  color: '#1d1d1f',
                  background: '#f5f5f7',
                  border: 'none',
                  borderRadius: 10,
                  cursor: actionLoading ? 'not-allowed' : 'pointer',
                }}
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleBanConfirm}
                disabled={actionLoading}
                style={{
                  flex: 1,
                  padding: '10px 20px',
                  fontSize: 14,
                  fontWeight: 500,
                  color: '#fff',
                  background: '#dc2626',
                  border: 'none',
                  borderRadius: 10,
                  cursor: actionLoading ? 'not-allowed' : 'pointer',
                  opacity: actionLoading ? 0.7 : 1,
                }}
              >
                {actionLoading ? 'En cours...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
