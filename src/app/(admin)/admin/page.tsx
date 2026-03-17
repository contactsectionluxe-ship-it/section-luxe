'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Users, CheckCircle, Clock, XCircle, Eye, Search, X, Mail } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { isAdminEmail } from '@/lib/constants';
import { getAllSellers, getSellerStats, approveSeller, rejectSeller, suspendSeller, banSeller, unbanSeller } from '@/lib/supabase/admin';
import { Seller } from '@/types';
import { formatDate } from '@/lib/utils';

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
  const [adminSection, setAdminSection] = useState<'vendeurs' | 'newsletter'>('vendeurs');
  const [newsletterSubscribers, setNewsletterSubscribers] = useState<{ id: string; email: string; status: 'subscribed' | 'unsubscribed'; subscribed_at: string; unsubscribed_at: string | null }[]>([]);
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [newsletterError, setNewsletterError] = useState<string | null>(null);
  const [newsletterFilter, setNewsletterFilter] = useState<'all' | 'subscribed' | 'unsubscribed'>('subscribed');

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
  const filteredNewsletter = newsletterFilter === 'all' ? newsletterSubscribers : newsletterSubscribers.filter((s) => s.status === newsletterFilter);

  return (
    <div style={{ paddingTop: 'var(--header-height)', minHeight: '100vh' }}>
      <div className="admin-page-inner" style={{ maxWidth: 1200, margin: '0 auto', padding: '30px calc(20px + 1cm - 0.5mm) 60px' }}>
        {/* Header — même style que Mes annonces */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: 28, fontWeight: 500, marginBottom: 8, color: '#1d1d1f' }}>
            Admin
          </h1>
          <p style={{ fontSize: 14, color: '#6e6e73', marginBottom: 16 }}>Gestion des demandes vendeurs</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
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
              Demande vendeur
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
              Newsletter
            </button>
          </div>
        </div>

        {/* Section Demande vendeur */}
        {adminSection === 'vendeurs' && (
          <>
        {loading ? (
          <p style={{ color: '#6e6e73', marginBottom: 24 }}>Chargement...</p>
        ) : (
          <>
        {/* Stats — cartes comme Mes annonces */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 40 }}>
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
        <div className="admin-filters-row" style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
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
        <style dangerouslySetInnerHTML={{ __html: '@media (max-width: 767px) { .admin-filter-count { display: none; } }' }} />

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

        {/* Section Newsletter */}
        {adminSection === 'newsletter' && (
          <>
            {newsletterError && (
              <div style={{ padding: 16, backgroundColor: '#fef2f2', borderRadius: 12, color: '#dc2626', marginBottom: 24 }}>
                {newsletterError}
              </div>
            )}
            {/* Stats — cartes comme Demande vendeur */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 40 }}>
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
            <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
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
                  {f === 'subscribed' ? `Inscrits${newsletterFilter === 'subscribed' ? ` (${filteredNewsletter.length})` : ''}` : f === 'unsubscribed' ? `Désinscrits${newsletterFilter === 'unsubscribed' ? ` (${filteredNewsletter.length})` : ''}` : `Tous${newsletterFilter === 'all' ? ` (${filteredNewsletter.length})` : ''}`}
                </button>
              ))}
            </div>
            {newsletterLoading ? (
              <p style={{ color: '#6e6e73' }}>Chargement...</p>
            ) : filteredNewsletter.length === 0 ? (
              <div style={{ padding: 60, border: '1px solid #e8e8ed', borderRadius: 12, textAlign: 'center', backgroundColor: '#fff' }}>
                <Mail size={48} color="#d2d2d7" style={{ display: 'block', margin: '0 auto 16px' }} />
                <h3 style={{ fontFamily: 'var(--font-inter), var(--font-sans)', fontSize: 17, fontWeight: 600, marginBottom: 8, color: '#1d1d1f' }}>
                  {newsletterFilter === 'subscribed' ? 'Aucun inscrit pour le moment.' : newsletterFilter === 'unsubscribed' ? 'Aucun désinscrit.' : 'Aucun enregistrement.'}
                </h3>
                <p style={{ fontSize: 14, color: '#6e6e73' }}>
                  Les inscriptions du footer apparaîtront ici.
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
