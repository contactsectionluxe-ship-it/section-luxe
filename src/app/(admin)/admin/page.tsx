'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Users, CheckCircle, Clock, XCircle, Eye, Search } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { isAdminEmail } from '@/lib/constants';
import { getAllSellers, getSellerStats, approveSeller, rejectSeller } from '@/lib/supabase/admin';
import { Seller } from '@/types';
import { formatDate } from '@/lib/utils';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const canAccessAdmin = isAdmin && isAdminEmail(user?.email);

  const [sellers, setSellers] = useState<Seller[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [searchQuery, setSearchQuery] = useState('');

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

  if (authLoading || loading) {
    return (
      <div style={{ paddingTop: 'var(--header-height)', minHeight: '100vh', backgroundColor: '#fbfbfb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
    approved: 'Validés',
    rejected: 'Refusés',
    all: 'Tous',
  } as const;

  return (
    <div style={{ paddingTop: 'var(--header-height)', minHeight: '100vh', backgroundColor: '#fbfbfb' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '30px calc(20px + 1cm - 0.5mm) 60px' }}>
        {/* Header — même style que Mes annonces */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: 28, fontWeight: 500, marginBottom: 8, color: '#1d1d1f' }}>
            Admin
          </h1>
          <p style={{ fontSize: 14, color: '#6e6e73' }}>Gestion des demandes vendeurs</p>
        </div>

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
        </div>

        {/* Filtres — boutons style vendeur */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {(['pending', 'approved', 'rejected', 'all'] as const).map((f) => (
            <button
              key={f}
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
              {filterLabels[f]}
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
                    : filter === 'pending'
                      ? 'Aucune demande en attente'
                      : 'Aucune demande'}
            </h3>
            <p style={{ fontFamily: 'var(--font-inter), var(--font-sans)', fontSize: 14, fontWeight: 400, color: '#6e6e73' }}>
              {q ? 'Modifiez votre recherche.' : filter === 'rejected' ? 'Aucune demande refusée actuellement.' : filter === 'approved' ? 'Aucun validé actuellement.' : filter === 'pending' ? "Vous n'avez aucune demande en attente à ce jour." : 'Aucune demande pour le moment.'}
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
                        backgroundColor: seller.status === 'approved' ? '#dcfce7' : seller.status === 'pending' ? '#fef3c7' : '#fee2e2',
                        color: seller.status === 'approved' ? '#166534' : seller.status === 'pending' ? '#92400e' : '#991b1b',
                      }}
                    >
                      {seller.status === 'approved' ? 'Validé' : seller.status === 'pending' ? 'En attente' : 'Refusé'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <Link
                      href={`/admin/vendeurs/${seller.uid}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
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
                      <Eye size={14} /> Détails
                    </Link>
                    {seller.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApprove(seller.uid)}
                          style={{
                            padding: '8px 14px',
                            backgroundColor: '#1d1d1f',
                            color: '#fff',
                            border: 'none',
                            fontSize: 13,
                            fontWeight: 500,
                            borderRadius: 8,
                            cursor: 'pointer',
                          }}
                        >
                          Valider
                        </button>
                        <button
                          onClick={() => handleReject(seller.uid)}
                          style={{
                            padding: '8px 14px',
                            backgroundColor: '#dc2626',
                            color: '#fff',
                            border: 'none',
                            fontSize: 13,
                            fontWeight: 500,
                            borderRadius: 8,
                            cursor: 'pointer',
                          }}
                        >
                          Refuser
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
