'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App error:', error);
  }, [error]);

  const isDev = process.env.NODE_ENV === 'development';

  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        fontFamily: 'var(--font-inter), system-ui, sans-serif',
      }}
    >
      <h1 style={{ fontSize: 20, fontWeight: 600, color: '#1d1d1f', marginBottom: 12 }}>
        Une erreur est survenue
      </h1>
      {isDev && (
        <pre
          style={{
            maxWidth: '100%',
            overflow: 'auto',
            padding: 16,
            backgroundColor: '#f5f5f7',
            borderRadius: 8,
            fontSize: 12,
            color: '#c00',
            marginBottom: 24,
            textAlign: 'left',
          }}
        >
          {error.message}
        </pre>
      )}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          type="button"
          onClick={reset}
          style={{
            padding: '12px 24px',
            backgroundColor: '#1d1d1f',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Réessayer
        </button>
        <Link
          href="/"
          style={{
            padding: '12px 24px',
            backgroundColor: '#fff',
            color: '#1d1d1f',
            border: '1.5px solid #d2d2d7',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 500,
            textDecoration: 'none',
          }}
        >
          Accueil
        </Link>
      </div>
    </div>
  );
}
