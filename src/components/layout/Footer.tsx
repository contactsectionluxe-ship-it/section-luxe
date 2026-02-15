'use client';

import Link from 'next/link';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer style={{ borderTop: '1px solid rgba(0,0,0,0.06)', padding: '60px 24px 40px', backgroundColor: '#fbfbfb' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 48,
            marginBottom: 48,
          }}
        >
          <div>
            <Link
              href="/"
              style={{
                fontFamily: 'var(--font-playfair), Georgia, serif',
                fontSize: 18,
                fontWeight: 600,
                color: '#1d1d1f',
              }}
            >
              Section Luxe
            </Link>
            <p style={{ marginTop: 14, fontSize: 14, color: '#6e6e73', lineHeight: 1.5 }}>
              La marketplace de référence pour les articles de luxe d'exception.
            </p>
          </div>

          <div>
            <h4 style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, color: '#86868b', marginBottom: 16 }}>
              Catégories
            </h4>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Link href="/catalogue?category=sacs" style={{ fontSize: 14, color: '#6e6e73' }}>Sac</Link>
              <Link href="/catalogue?category=montres" style={{ fontSize: 14, color: '#6e6e73' }}>Montres</Link>
              <Link href="/catalogue?category=bijoux" style={{ fontSize: 14, color: '#6e6e73' }}>Bijoux</Link>
              <Link href="/catalogue?category=vetements" style={{ fontSize: 14, color: '#6e6e73' }}>Vêtements</Link>
            </nav>
          </div>

          <div>
            <h4 style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, color: '#86868b', marginBottom: 16 }}>
              Vendeurs
            </h4>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Link href="/inscription-vendeur" style={{ fontSize: 14, color: '#6e6e73' }}>Devenir vendeur</Link>
              <Link href="/vendeur" style={{ fontSize: 14, color: '#6e6e73' }}>Mes annonces</Link>
            </nav>
          </div>

          <div>
            <h4 style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, color: '#86868b', marginBottom: 16 }}>
              Aide
            </h4>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Link href="#" style={{ fontSize: 14, color: '#6e6e73' }}>Contact</Link>
              <Link href="#" style={{ fontSize: 14, color: '#6e6e73' }}>FAQ</Link>
              <Link href="#" style={{ fontSize: 14, color: '#6e6e73' }}>CGV</Link>
            </nav>
          </div>
        </div>

        <div style={{ paddingTop: 24, borderTop: '1px solid rgba(0,0,0,0.06)', textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: '#86868b' }}>© {year} Section Luxe. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}
