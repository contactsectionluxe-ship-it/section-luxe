'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { isAdminEmail } from '@/lib/constants';
import { formatDate } from '@/lib/utils';

type Subscriber = {
  id: string;
  email: string;
  status: 'subscribed' | 'unsubscribed';
  subscribed_at: string;
  unsubscribed_at: string | null;
  created_at: string;
  updated_at: string;
};

export default function AdminNewsletterPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const canAccessAdmin = !!user && user.role === 'admin' && isAdminEmail(user.email);

  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'subscribed' | 'unsubscribed'>('subscribed');

  useEffect(() => {
    if (!authLoading && !canAccessAdmin) {
      router.push('/');
    }
  }, [authLoading, canAccessAdmin, router]);

  useEffect(() => {
    async function load() {
      if (!canAccessAdmin) return;
      const { getSession } = await import('@/lib/supabase/auth');
      const session = await getSession();
      if (!session?.access_token) {
        setError('Session expirée');
        setLoading(false);
        return;
      }
      try {
        const params = filter !== 'all' ? `?status=${filter}` : '';
        const res = await fetch(`/api/admin/newsletter-subscribers${params}`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError((data as { error?: string }).error || 'Erreur chargement');
          setSubscribers([]);
        } else {
          setError(null);
          setSubscribers((data as { subscribers: Subscriber[] }).subscribers || []);
        }
      } catch (e) {
        setError('Erreur réseau');
        setSubscribers([]);
      } finally {
        setLoading(false);
      }
    }
    setLoading(true);
    load();
  }, [canAccessAdmin, filter]);

  if (!authLoading && !canAccessAdmin) return null;

  return (
    <div style={{ paddingTop: 'var(--header-height)', minHeight: '100vh' }}>
      <div className="admin-page-inner" style={{ maxWidth: 900, margin: '0 auto', padding: '30px 24px 60px' }}>
        <div style={{ marginBottom: 24 }}>
          <Link href="/admin" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#6e6e73', marginBottom: 12 }}>
            <ArrowLeft size={18} /> Retour Admin
          </Link>
          <h1 style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: 28, fontWeight: 500, marginBottom: 8, color: '#1d1d1f' }}>
            Newsletter
          </h1>
          <p style={{ fontSize: 14, color: '#6e6e73' }}>
            Inscrits et désinscrits pour l’envoi des actualités Section Luxe.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {(['subscribed', 'unsubscribed', 'all'] as const).map((f) => (
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
              }}
            >
              {f === 'subscribed' ? `Inscrits${filter === 'subscribed' ? ` (${subscribers.length})` : ''}` : f === 'unsubscribed' ? `Désinscrits${filter === 'unsubscribed' ? ` (${subscribers.length})` : ''}` : `Tous${filter === 'all' ? ` (${subscribers.length})` : ''}`}
            </button>
          ))}
        </div>

        {error && (
          <div style={{ padding: 16, backgroundColor: '#fef2f2', borderRadius: 12, color: '#dc2626', marginBottom: 24 }}>
            {error}
          </div>
        )}

        {loading ? (
          <p style={{ color: '#6e6e73' }}>Chargement...</p>
        ) : subscribers.length === 0 ? (
          <div style={{ padding: 48, border: '1px solid #e8e8ed', borderRadius: 12, textAlign: 'center', backgroundColor: '#fff' }}>
            <Mail size={40} color="#d2d2d7" style={{ marginBottom: 12 }} />
            <p style={{ fontSize: 15, color: '#6e6e73' }}>
              {filter === 'subscribed' ? 'Aucun inscrit pour le moment.' : filter === 'unsubscribed' ? 'Aucun désinscrit.' : 'Aucun enregistrement.'}
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
                  {subscribers.map((s) => (
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
      </div>
    </div>
  );
}
