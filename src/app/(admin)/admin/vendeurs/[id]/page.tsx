'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, ExternalLink, XCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { isAdminEmail } from '@/lib/constants';
import { getSellerById, approveSeller, rejectSeller } from '@/lib/supabase/admin';
import { Seller } from '@/types';

export default function AdminSellerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params?.id === 'string' ? params.id : '';
  const { user, isAdmin, loading: authLoading } = useAuth();
  const canAccessAdmin = isAdmin && isAdminEmail(user?.email);

  const [seller, setSeller] = useState<Seller | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [descriptionOverflows, setDescriptionOverflows] = useState(false);
  const descriptionRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (!authLoading && !canAccessAdmin) {
      router.push('/');
    }
  }, [authLoading, canAccessAdmin, router]);

  useEffect(() => {
    if (!id || !canAccessAdmin) return;
    let cancelled = false;
    getSellerById(id).then((data) => {
      if (!cancelled) {
        setSeller(data ?? null);
      }
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [id, canAccessAdmin]);

  useLayoutEffect(() => {
    if (!seller || descriptionExpanded) {
      setDescriptionOverflows(false);
      return;
    }
    const el = descriptionRef.current;
    if (!el) return;
    setDescriptionOverflows(el.scrollHeight > el.clientHeight);
  }, [seller?.uid, seller?.description, descriptionExpanded]);

  const handleApprove = async () => {
    if (!seller) return;
    setActionLoading(true);
    try {
      await approveSeller(seller.uid);
      setSeller((s) => (s ? { ...s, status: 'approved' } : null));
      router.push('/admin');
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!seller) return;
    setActionLoading(true);
    try {
      await rejectSeller(seller.uid);
      setSeller((s) => (s ? { ...s, status: 'rejected' } : null));
      router.push('/admin');
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div style={{ paddingTop: 'var(--header-height)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontSize: 14, color: '#6e6e73' }}>Chargement...</p>
      </div>
    );
  }

  if (!canAccessAdmin) return null;
  if (!seller) {
    return (
      <div style={{ paddingTop: 'var(--header-height)', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <p style={{ fontSize: 14, color: '#6e6e73' }}>Vendeur introuvable</p>
        <Link href="/admin" style={{ fontSize: 14, color: '#1d1d1f', textDecoration: 'underline' }}>Retour à l’admin</Link>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: 'var(--header-height)', minHeight: '100vh' }}>
      <div className="admin-page-inner" style={{ maxWidth: 600, margin: '0 auto', padding: '30px calc(20px + 1cm - 0.5mm) 60px' }}>
        <Link
          href="/admin"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 14,
            color: '#6e6e73',
            textDecoration: 'none',
            marginBottom: 24,
          }}
        >
          <ArrowLeft size={18} /> Retour à l’admin
        </Link>

        <h1 style={{ fontFamily: 'var(--font-inter), var(--font-sans)', fontSize: 24, fontWeight: 600, color: '#1d1d1f', marginBottom: 24 }}>
          Détails « {seller.displayName || seller.companyName} »
        </h1>

        <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, color: '#86868b' }}>Statut</span>
          <span
            style={{
              padding: '4px 10px',
              fontSize: 12,
              fontWeight: 500,
              borderRadius: 6,
              backgroundColor: seller.status === 'approved' ? '#dcfce7' : seller.status === 'pending' ? '#fef3c7' : '#fee2e2',
              color: seller.status === 'approved' ? '#166534' : seller.status === 'pending' ? '#92400e' : '#991b1b',
            }}
          >
            {seller.status === 'approved' ? 'Validé' : seller.status === 'pending' ? 'En attente' : 'Refusé'}
          </span>
        </div>

        <div style={{ padding: 16, backgroundColor: '#f5f5f7', borderRadius: 12, marginBottom: 20 }}>
          <p style={{ marginBottom: 10, fontSize: 14, color: '#1d1d1f' }}>
            <span style={{ fontSize: 12, color: '#86868b', display: 'block', marginBottom: 2 }}>Nom de la société</span>
            {seller.companyName}
          </p>
          <p style={{ marginBottom: 10, fontSize: 14, color: '#1d1d1f' }}>
            <span style={{ fontSize: 12, color: '#86868b', display: 'block', marginBottom: 2 }}>SIRET</span>
            {seller.siret || '—'}
          </p>
          <p style={{ marginBottom: 10, fontSize: 14, color: '#1d1d1f' }}>
            <span style={{ fontSize: 12, color: '#86868b', display: 'block', marginBottom: 2 }}>Adresse</span>
            {[seller.address, seller.postcode, seller.city].filter(Boolean).join(', ') || '—'}
          </p>
          <p style={{ marginBottom: 10, fontSize: 14, color: '#1d1d1f' }}>
            <span style={{ fontSize: 12, color: '#86868b', display: 'block', marginBottom: 2 }}>Prénom / Nom</span>
            {seller.displayName || '—'}
          </p>
          <p style={{ marginBottom: 10, fontSize: 14, color: '#1d1d1f' }}>
            <span style={{ fontSize: 12, color: '#86868b', display: 'block', marginBottom: 2 }}>Email</span>
            {seller.email}
          </p>
          <p style={{ marginBottom: 0, fontSize: 14, color: '#1d1d1f' }}>
            <span style={{ fontSize: 12, color: '#86868b', display: 'block', marginBottom: 2 }}>Téléphone</span>
            {seller.phone}
          </p>
        </div>

        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 12, color: '#86868b', marginBottom: 8 }}>Description</p>
          <p
            ref={descriptionRef}
            style={{
              fontSize: 14,
              color: '#1d1d1f',
              lineHeight: 1.6,
              ...(descriptionExpanded
                ? {}
                : { overflow: 'hidden', display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2 }),
            }}
          >
            {seller.description}
            {descriptionOverflows && !descriptionExpanded && (
              <>
                {' '}
                <button
                  type="button"
                  onClick={() => setDescriptionExpanded(true)}
                  style={{
                    padding: 0,
                    border: 'none',
                    background: 'none',
                    fontSize: 14,
                    lineHeight: 1.6,
                    color: '#1d1d1f',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    font: 'inherit',
                  }}
                >
                  Voir plus
                </button>
              </>
            )}
          </p>
          {descriptionExpanded && (
            <button
              type="button"
              onClick={() => setDescriptionExpanded(false)}
              style={{
                marginTop: 6,
                padding: 0,
                border: 'none',
                background: 'none',
                fontSize: 14,
                color: '#1d1d1f',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Voir moins
            </button>
          )}
        </div>

        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 12, color: '#86868b', marginBottom: 12 }}>Documents</p>
          <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <a
              href={`/api/signed-document?url=${encodeURIComponent(seller.idCardFrontUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '10px 14px',
                backgroundColor: '#f5f5f7',
                fontSize: 13,
                borderRadius: 8,
                color: '#1d1d1f',
                textDecoration: 'none',
              }}
            >
              <ExternalLink size={14} /> {seller.idRectoType === 'passeport' ? 'Passeport' : 'CNI recto'}
            </a>
            {seller.idCardBackUrl && (
              <a
                href={`/api/signed-document?url=${encodeURIComponent(seller.idCardBackUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '10px 14px',
                  backgroundColor: '#f5f5f7',
                  fontSize: 13,
                  borderRadius: 8,
                  color: '#1d1d1f',
                  textDecoration: 'none',
                }}
              >
                <ExternalLink size={14} /> CNI verso
              </a>
            )}
            <a
              href={`/api/signed-document?url=${encodeURIComponent(seller.kbisUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '10px 14px',
                backgroundColor: '#f5f5f7',
                fontSize: 13,
                borderRadius: 8,
                color: '#1d1d1f',
                textDecoration: 'none',
              }}
            >
              <ExternalLink size={14} /> KBIS
            </a>
          </div>
        </div>

        {seller.status === 'pending' && (
          <div style={{ display: 'flex', gap: 12, paddingTop: 20, borderTop: '1px solid #e8e8ed' }}>
            <button
              onClick={handleApprove}
              disabled={actionLoading}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '12px 0',
                backgroundColor: '#1d1d1f',
                color: '#fff',
                border: 'none',
                fontSize: 14,
                fontWeight: 500,
                borderRadius: 12,
                cursor: actionLoading ? 'not-allowed' : 'pointer',
                opacity: actionLoading ? 0.7 : 1,
              }}
            >
              <CheckCircle size={16} /> Valider
            </button>
            <button
              onClick={handleReject}
              disabled={actionLoading}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '12px 0',
                backgroundColor: '#dc2626',
                color: '#fff',
                border: 'none',
                fontSize: 14,
                fontWeight: 500,
                borderRadius: 12,
                cursor: actionLoading ? 'not-allowed' : 'pointer',
                opacity: actionLoading ? 0.7 : 1,
              }}
            >
              <XCircle size={16} /> Refuser
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
