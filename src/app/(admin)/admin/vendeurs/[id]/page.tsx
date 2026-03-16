'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, ExternalLink, XCircle, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { isAdminEmail } from '@/lib/constants';
import { getSellerById, approveSeller, rejectSeller, suspendSeller, banSeller, unbanSeller } from '@/lib/supabase/admin';
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
  const [suspendModalOpen, setSuspendModalOpen] = useState(false);
  const [suspendDays, setSuspendDays] = useState(7);
  const [suspendDaysDropdownOpen, setSuspendDaysDropdownOpen] = useState(false);
  const descriptionRef = useRef<HTMLParagraphElement>(null);

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

  const handleSuspendConfirm = async () => {
    if (!seller || suspendDays < 1) return;
    setActionLoading(true);
    try {
      await suspendSeller(seller.uid, suspendDays);
      const until = new Date();
      until.setDate(until.getDate() + suspendDays);
      setSeller((s) => (s ? { ...s, status: 'suspended' as const, suspendedUntil: until } : null));
      setSuspendModalOpen(false);
      router.push('/admin');
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleBan = async () => {
    if (!seller) return;
    setActionLoading(true);
    try {
      await banSeller(seller.uid);
      setSeller((s) => (s ? { ...s, status: 'banned' } : null));
      router.push('/admin');
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReactivate = async () => {
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

  const handleUnban = async () => {
    if (!seller) return;
    setActionLoading(true);
    try {
      await unbanSeller(seller.uid);
      setSeller((s) => (s ? { ...s, status: 'approved' } : null));
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
              backgroundColor: seller.status === 'approved' ? '#dcfce7' : seller.status === 'pending' ? '#fef3c7' : seller.status === 'suspended' ? '#f3e8ff' : seller.status === 'banned' ? '#1f2937' : '#fee2e2',
              color: seller.status === 'approved' ? '#166534' : seller.status === 'pending' ? '#92400e' : seller.status === 'suspended' ? '#6b21a8' : seller.status === 'banned' ? '#fff' : '#991b1b',
            }}
          >
            {seller.status === 'approved' ? 'Validé' : seller.status === 'pending' ? 'En attente' : seller.status === 'suspended' ? 'Suspendu' : seller.status === 'banned' ? 'Banni' : 'Refusé'}
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
                padding: '8px 0',
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
                padding: '8px 0',
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
        {seller.status === 'approved' && (
          <div style={{ display: 'flex', gap: 12, paddingTop: 20, borderTop: '1px solid #e8e8ed' }}>
            <button
              onClick={() => setSuspendModalOpen(true)}
              disabled={actionLoading}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '8px 0',
                backgroundColor: '#c2410c',
                color: '#fff',
                border: 'none',
                fontSize: 14,
                fontWeight: 500,
                borderRadius: 12,
                cursor: actionLoading ? 'not-allowed' : 'pointer',
                opacity: actionLoading ? 0.7 : 1,
              }}
            >
              Suspendre
            </button>
            <button
              onClick={handleBan}
              disabled={actionLoading}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '8px 0',
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
              Bannir
            </button>
          </div>
        )}
        {seller.status === 'suspended' && (
          <div style={{ display: 'flex', gap: 12, paddingTop: 20, borderTop: '1px solid #e8e8ed' }}>
            <button
              onClick={handleReactivate}
              disabled={actionLoading}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '8px 0',
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
              <CheckCircle size={16} /> Réactiver
            </button>
            <button
              onClick={handleBan}
              disabled={actionLoading}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '8px 0',
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
              Bannir
            </button>
          </div>
        )}
        {seller.status === 'banned' && (
          <div style={{ display: 'flex', gap: 12, paddingTop: 20, borderTop: '1px solid #e8e8ed' }}>
            <button
              onClick={handleUnban}
              disabled={actionLoading}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '8px 0',
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
              <CheckCircle size={16} /> Réactiver le compte
            </button>
          </div>
        )}

        {/* Modal suspension */}
        {suspendModalOpen && seller && (
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
            onClick={() => !actionLoading && setSuspendModalOpen(false)}
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
                <h2 style={{ fontFamily: 'var(--font-inter), var(--font-sans)', fontSize: 18, fontWeight: 600, margin: 0, color: '#1d1d1f' }}>
                  Suspendre le vendeur
                </h2>
                <button
                  type="button"
                  aria-label="Fermer"
                  onClick={() => !actionLoading && setSuspendModalOpen(false)}
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
              <p style={{ fontSize: 14, color: '#6e6e73', marginBottom: 16 }}>
                <strong>{seller.companyName}</strong> ne pourra plus déposer d&apos;annonces pendant la période choisie.
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
                    color: suspendDays ? '#1d1d1f' : '#86868b',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2386868b' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 14px center',
                    backgroundColor: '#fff',
                  }}
                >
                  {SUSPEND_DAY_OPTIONS.find((o) => o.value === suspendDays)?.label ?? 'Sélectionner'}
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
                          setSuspendDays(opt.value);
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
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => !actionLoading && setSuspendModalOpen(false)}
                  style={{
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
                  {actionLoading ? 'Suspension...' : 'Confirmer la suspension'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
