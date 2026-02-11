'use client';

import Link from 'next/link';

export default function AProposPage() {
  return (
    <div style={{ paddingTop: 'var(--header-height)', minHeight: '100vh' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '60px 24px 100px' }}>
        <p
          style={{
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: 2.5,
            textTransform: 'uppercase',
            color: '#86868b',
            marginBottom: 24,
          }}
        >
          À propos
        </p>
        <h1
          style={{
            fontFamily: 'var(--font-playfair), Georgia, serif',
            fontSize: 'clamp(32px, 5vw, 44px)',
            fontWeight: 500,
            lineHeight: 1.15,
            letterSpacing: '-0.02em',
            color: '#1d1d1f',
            marginBottom: 32,
          }}
        >
          Section Luxe
        </h1>
        <p style={{ fontSize: 17, color: '#6e6e73', lineHeight: 1.6, marginBottom: 24 }}>
          Section Luxe est la marketplace de référence dédiée aux articles de luxe. Nous mettons en relation des acheteurs exigeants avec des vendeurs professionnels certifiés : boutiques, dépôts-vente et maisons spécialisées.
        </p>
        <p style={{ fontSize: 17, color: '#6e6e73', lineHeight: 1.6, marginBottom: 24 }}>
          Notre engagement : une sélection soignée, une authenticité garantie et un accompagnement personnalisé pour que vous trouviez la pièce de luxe qui vous correspond.
        </p>
        <p style={{ fontSize: 17, color: '#6e6e73', lineHeight: 1.6, marginBottom: 48 }}>
          Que vous soyez collectionneur ou à la recherche d’un article d’exception, Section Luxe vous accompagne en toute confiance.
        </p>
        <Link
          href="/catalogue"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '14px 28px',
            backgroundColor: '#1d1d1f',
            color: '#fff',
            fontSize: 15,
            fontWeight: 500,
            borderRadius: 980,
          }}
        >
          Découvrir le catalogue
        </Link>
      </div>
    </div>
  );
}
