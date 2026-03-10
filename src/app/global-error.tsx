'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global error:', error);
  }, [error]);

  const isDev = process.env.NODE_ENV === 'development';

  return (
    <html lang="fr">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', padding: 24 }}>
        <div
          style={{
            maxWidth: 560,
            margin: '40px auto',
            padding: 24,
          }}
        >
          <h1 style={{ fontSize: 22, fontWeight: 600, color: '#1d1d1f', marginBottom: 16 }}>
            Une erreur est survenue
          </h1>
          {isDev && (
            <pre
              style={{
                overflow: 'auto',
                padding: 16,
                backgroundColor: '#f5f5f7',
                borderRadius: 8,
                fontSize: 12,
                color: '#c00',
                marginBottom: 24,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {error.message}
            </pre>
          )}
          <p style={{ color: '#6e6e73', marginBottom: 24 }}>
            Rechargez la page ou retournez à l&apos;accueil.
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
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
            <a
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
                display: 'inline-block',
              }}
            >
              Accueil
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
