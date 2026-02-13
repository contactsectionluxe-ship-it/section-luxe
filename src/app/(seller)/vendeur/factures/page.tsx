'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Download } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function FacturesPage() {
  const router = useRouter();
  const { user, seller, isSeller, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || !seller)) {
      router.push('/connexion');
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [authLoading, user, seller, router]);

  if (authLoading || loading) {
    return (
      <div style={{ paddingTop: 'var(--header-height)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#888' }}>Chargement...</p>
      </div>
    );
  }

  if (!user || !seller) return null;

  return (
    <div style={{ paddingTop: 'var(--header-height)', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '30px 20px 60px' }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: 28, fontWeight: 500, marginBottom: 8 }}>
            Mes factures
          </h1>
          <p style={{ fontSize: 14, color: '#888' }}>Consulter et télécharger les factures liées à la publication de vos annonces</p>
        </div>

        <div style={{ padding: 40, backgroundColor: '#fafafa', borderRadius: 16, textAlign: 'center' }}>
          <FileText size={48} color="#ccc" style={{ marginBottom: 16 }} />
          <p style={{ fontSize: 16, color: '#666', marginBottom: 8 }}>Aucune facture pour le moment</p>
          <p style={{ fontSize: 14, color: '#999' }}>
            Les factures seront disponibles ici une fois que vos annonces auront été publiées.
          </p>
        </div>
      </div>
    </div>
  );
}
