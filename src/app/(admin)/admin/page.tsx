'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, CheckCircle, Clock, XCircle, Eye, ExternalLink, X } from 'lucide-react';
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
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

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
      setSelectedSeller(null);
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
      setSelectedSeller(null);
    } catch (error) {
      console.error('Error rejecting seller:', error);
    } finally {
      setActionLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div style={{ paddingTop: 'var(--header-height)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#888' }}>Chargement...</p>
      </div>
    );
  }

  if (!canAccessAdmin) return null;

  const filteredSellers = sellers.filter((s) => filter === 'all' || s.status === filter);

  return (
    <div style={{ paddingTop: 'var(--header-height)', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '30px 20px 60px' }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: 28, fontWeight: 500, marginBottom: 8 }}>
            Administration
          </h1>
          <p style={{ fontSize: 14, color: '#888' }}>Gestion des demandes vendeurs</p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 32 }}>
          <div style={{ padding: 16, border: '1px solid #eee', display: 'flex', alignItems: 'center', gap: 12 }}>
            <Users size={20} color="#666" />
            <div>
              <p style={{ fontSize: 20, fontWeight: 600 }}>{stats.total}</p>
              <p style={{ fontSize: 11, color: '#888' }}>Total</p>
            </div>
          </div>
          <div style={{ padding: 16, border: '1px solid #eee', display: 'flex', alignItems: 'center', gap: 12 }}>
            <Clock size={20} color="#d97706" />
            <div>
              <p style={{ fontSize: 20, fontWeight: 600 }}>{stats.pending}</p>
              <p style={{ fontSize: 11, color: '#888' }}>En attente</p>
            </div>
          </div>
          <div style={{ padding: 16, border: '1px solid #eee', display: 'flex', alignItems: 'center', gap: 12 }}>
            <CheckCircle size={20} color="#16a34a" />
            <div>
              <p style={{ fontSize: 20, fontWeight: 600 }}>{stats.approved}</p>
              <p style={{ fontSize: 11, color: '#888' }}>Validés</p>
            </div>
          </div>
          <div style={{ padding: 16, border: '1px solid #eee', display: 'flex', alignItems: 'center', gap: 12 }}>
            <XCircle size={20} color="#dc2626" />
            <div>
              <p style={{ fontSize: 20, fontWeight: 600 }}>{stats.rejected}</p>
              <p style={{ fontSize: 11, color: '#888' }}>Refusés</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {(['pending', 'approved', 'rejected', 'all'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '8px 16px',
                fontSize: 13,
                fontWeight: 500,
                backgroundColor: filter === f ? '#000' : '#fff',
                color: filter === f ? '#fff' : '#666',
                border: filter === f ? 'none' : '1px solid #ddd',
                cursor: 'pointer',
              }}
            >
              {f === 'all' && 'Tous'}
              {f === 'pending' && `En attente (${stats.pending})`}
              {f === 'approved' && 'Validés'}
              {f === 'rejected' && 'Refusés'}
            </button>
          ))}
        </div>

        {/* Sellers list */}
        {filteredSellers.length === 0 ? (
          <div style={{ padding: 60, border: '1px solid #eee', textAlign: 'center' }}>
            <p style={{ color: '#888' }}>Aucune demande</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filteredSellers.map((seller) => (
              <div key={seller.uid} style={{ padding: 16, border: '1px solid #eee' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                      <h3 style={{ fontSize: 15, fontWeight: 500 }}>{seller.companyName}</h3>
                      <span style={{
                        padding: '2px 8px',
                        fontSize: 11,
                        fontWeight: 500,
                        backgroundColor: seller.status === 'approved' ? '#dcfce7' : seller.status === 'pending' ? '#fef3c7' : '#fee2e2',
                        color: seller.status === 'approved' ? '#166534' : seller.status === 'pending' ? '#92400e' : '#991b1b',
                      }}>
                        {seller.status === 'approved' ? 'Validé' : seller.status === 'pending' ? 'En attente' : 'Refusé'}
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: '#888' }}>{seller.email}</p>
                    <p style={{ fontSize: 12, color: '#aaa', marginTop: 4 }}>Demande le {formatDate(seller.createdAt)}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setSelectedSeller(seller)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', border: '1px solid #ddd', backgroundColor: '#fff', fontSize: 13, cursor: 'pointer' }}>
                      <Eye size={14} /> Détails
                    </button>
                    {seller.status === 'pending' && (
                      <>
                        <button onClick={() => handleApprove(seller.uid)} style={{ padding: '8px 14px', backgroundColor: '#000', color: '#fff', border: 'none', fontSize: 13, cursor: 'pointer' }}>Valider</button>
                        <button onClick={() => handleReject(seller.uid)} style={{ padding: '8px 14px', backgroundColor: '#dc2626', color: '#fff', border: 'none', fontSize: 13, cursor: 'pointer' }}>Refuser</button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedSeller && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)' }} onClick={() => setSelectedSeller(null)} />
          <div style={{ position: 'relative', width: '100%', maxWidth: 500, maxHeight: '90vh', overflow: 'auto', backgroundColor: '#fff', padding: 24 }}>
            <button onClick={() => setSelectedSeller(null)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={20} />
            </button>
            <h2 style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: 20, marginBottom: 20 }}>Détails du vendeur</h2>

            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>Statut</p>
              <span style={{
                display: 'inline-block',
                padding: '4px 10px',
                fontSize: 12,
                fontWeight: 500,
                backgroundColor: selectedSeller.status === 'approved' ? '#dcfce7' : selectedSeller.status === 'pending' ? '#fef3c7' : '#fee2e2',
                color: selectedSeller.status === 'approved' ? '#166534' : selectedSeller.status === 'pending' ? '#92400e' : '#991b1b',
              }}>
                {selectedSeller.status === 'approved' ? 'Validé' : selectedSeller.status === 'pending' ? 'En attente' : 'Refusé'}
              </span>
            </div>

            <div style={{ padding: 16, backgroundColor: '#f8f8f8', marginBottom: 20 }}>
              <p style={{ marginBottom: 8 }}><span style={{ fontSize: 12, color: '#888' }}>Nom : </span>{selectedSeller.companyName}</p>
              <p style={{ marginBottom: 8 }}><span style={{ fontSize: 12, color: '#888' }}>Email : </span>{selectedSeller.email}</p>
              <p style={{ marginBottom: 8 }}><span style={{ fontSize: 12, color: '#888' }}>Téléphone : </span>{selectedSeller.phone}</p>
              <p><span style={{ fontSize: 12, color: '#888' }}>Adresse : </span>{selectedSeller.address}</p>
            </div>

            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>Description</p>
              <p style={{ fontSize: 14, color: '#555', lineHeight: 1.6 }}>{selectedSeller.description}</p>
            </div>

            <div style={{ marginBottom: 24 }}>
              <p style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>Documents</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <a
                  href={`/api/signed-document?url=${encodeURIComponent(selectedSeller.idCardFrontUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', backgroundColor: '#f5f5f5', fontSize: 13 }}
                >
                  <ExternalLink size={14} /> CNI (recto)
                </a>
                {selectedSeller.idCardBackUrl && (
                  <a
                    href={`/api/signed-document?url=${encodeURIComponent(selectedSeller.idCardBackUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', backgroundColor: '#f5f5f5', fontSize: 13 }}
                  >
                    <ExternalLink size={14} /> CNI (verso)
                  </a>
                )}
                <a
                  href={`/api/signed-document?url=${encodeURIComponent(selectedSeller.kbisUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', backgroundColor: '#f5f5f5', fontSize: 13 }}
                >
                  <ExternalLink size={14} /> KBIS
                </a>
              </div>
            </div>

            {selectedSeller.status === 'pending' && (
              <div style={{ display: 'flex', gap: 12, paddingTop: 20, borderTop: '1px solid #eee' }}>
                <button onClick={() => handleApprove(selectedSeller.uid)} disabled={actionLoading} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 0', backgroundColor: '#000', color: '#fff', border: 'none', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
                  <CheckCircle size={16} /> Valider
                </button>
                <button onClick={() => handleReject(selectedSeller.uid)} disabled={actionLoading} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 0', backgroundColor: '#dc2626', color: '#fff', border: 'none', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
                  <XCircle size={16} /> Refuser
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
