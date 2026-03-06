import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page introuvable | Section Luxe',
  description: 'La page que vous recherchez n\'existe pas ou a été déplacée. Retournez à l\'accueil ou parcourez le catalogue Section Luxe.',
  robots: 'noindex, follow',
};

export default function NotFound() {
  return (
    <main
      style={{
        paddingTop: 'var(--header-height)',
        minHeight: '100vh',
        backgroundColor: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        style={{
          maxWidth: 520,
          margin: '0 auto',
          textAlign: 'center',
        }}
      >
        <p
          style={{
            fontFamily: 'var(--font-inter), var(--font-sans)',
            fontSize: 14,
            fontWeight: 500,
            color: '#86868b',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: 12,
          }}
        >
          Erreur 404
        </p>
        <h1
          style={{
            fontFamily: 'var(--font-playfair), Georgia, serif',
            fontSize: 32,
            fontWeight: 500,
            color: '#1d1d1f',
            marginBottom: 16,
            lineHeight: 1.2,
          }}
        >
          Page introuvable
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-inter), var(--font-sans)',
            fontSize: 16,
            color: '#6e6e73',
            lineHeight: 1.6,
            marginBottom: 32,
          }}
        >
          La page que vous recherchez n&apos;existe pas, a été déplacée ou l&apos;adresse est incorrecte.
        </p>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
            justifyContent: 'center',
          }}
        >
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '14px 24px',
              backgroundColor: '#1d1d1f',
              color: '#fff',
              fontSize: 14,
              fontWeight: 500,
              borderRadius: 12,
              textDecoration: 'none',
            }}
          >
            Accueil
          </Link>
          <Link
            href="/catalogue"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '14px 24px',
              backgroundColor: '#fff',
              color: '#1d1d1f',
              fontSize: 14,
              fontWeight: 500,
              borderRadius: 12,
              border: '1px solid #d2d2d7',
              textDecoration: 'none',
            }}
          >
            Voir le catalogue
          </Link>
        </div>
      </div>
    </main>
  );
}
