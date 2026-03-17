'use client';

import Link from 'next/link';
import { useState } from 'react';

export function Footer() {
  const year = new Date().getFullYear();
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [newsletterMessage, setNewsletterMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = newsletterEmail.trim().toLowerCase();
    if (!email) return;
    setNewsletterMessage(null);
    setNewsletterLoading(true);
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setNewsletterEmail('');
        setNewsletterMessage({ type: 'success', text: 'Merci, votre inscription est enregistrée.' });
      } else {
        setNewsletterMessage({ type: 'error', text: (data as { error?: string }).error || 'Une erreur est survenue.' });
      }
    } catch {
      setNewsletterMessage({ type: 'error', text: 'Une erreur est survenue.' });
    } finally {
      setNewsletterLoading(false);
    }
  };

  return (
    <footer style={{ borderTop: '1px solid rgba(0,0,0,0.06)', padding: '80px 24px 40px', backgroundColor: '#fbfbfb' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div
          className="footer-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr 1.5fr',
            gap: 48,
            marginBottom: 48,
            alignItems: 'start',
          }}
        >
          {/* Colonne 1 : Logo + slogan */}
          <div className="footer-grid-brand">
            <Link href="/" style={{ display: 'inline-block' }}>
              <img src="/logo.png" alt="Section Luxe" style={{ height: 20, width: 'auto', display: 'block' }} />
            </Link>
            <p className="footer-grid-brand-desc" style={{ marginTop: 3, fontSize: 14, color: '#6e6e73', lineHeight: 1.5 }}>
              Le luxe, en un seul regard.
            </p>
          </div>

          {/* Colonne 2 : Catégories */}
          <div>
            <h4 style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, color: '#86868b', marginBottom: 16 }}>
              Catégories
            </h4>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Link href="/catalogue?category=sacs" style={{ fontSize: 14, color: '#6e6e73' }}>Sacs</Link>
              <Link href="/catalogue?category=vetements" style={{ fontSize: 14, color: '#6e6e73' }}>Vêtements</Link>
              <Link href="/catalogue?category=chaussures" style={{ fontSize: 14, color: '#6e6e73' }}>Chaussures</Link>
              <Link href="/catalogue?category=accessoires" style={{ fontSize: 14, color: '#6e6e73' }}>Accessoires</Link>
              <Link href="/catalogue?category=bijoux" style={{ fontSize: 14, color: '#6e6e73' }}>Bijoux</Link>
              <Link href="/catalogue?category=montres" style={{ fontSize: 14, color: '#6e6e73' }}>Montres</Link>
            </nav>
          </div>

          {/* Colonne 3 : Section */}
          <div>
            <h4 style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, color: '#86868b', marginBottom: 16 }}>
              Section
            </h4>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Link href="/catalogue" style={{ fontSize: 14, color: '#6e6e73' }}>Catalogue</Link>
              <Link href="/catalogue?condition=occasion" style={{ fontSize: 14, color: '#6e6e73' }}>Occasion</Link>
              <Link href="/catalogue?condition=new" style={{ fontSize: 14, color: '#6e6e73' }}>Neuf</Link>
              <Link href="/a-propos" style={{ fontSize: 14, color: '#6e6e73' }}>À propos</Link>
              <Link href="/contact" style={{ fontSize: 14, color: '#6e6e73' }}>Contact</Link>
              <Link href="/favoris" style={{ fontSize: 14, color: '#6e6e73' }}>Favoris</Link>
              <Link href="/messages" style={{ fontSize: 14, color: '#6e6e73' }}>Messages</Link>
            </nav>
          </div>

          {/* Colonne 4 : Newsletter */}
          <div className="footer-grid-newsletter">
            <h4 style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, color: '#86868b', marginBottom: 16 }}>
              Newsletter
            </h4>
            <p style={{ fontSize: 14, color: '#6e6e73', lineHeight: 1.5, marginBottom: 14 }}>
              Inscrivez-vous pour recevoir les actualités Section Luxe.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="footer-newsletter-form">
              <input
                type="email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="Votre email"
                required
                style={{
                  width: '100%',
                  maxWidth: '100%',
                  padding: '12px 14px',
                  fontSize: 14,
                  border: '1px solid #d2d2d7',
                  borderRadius: 10,
                  backgroundColor: '#fff',
                  outline: 'none',
                  boxSizing: 'border-box',
                  marginBottom: 10,
                }}
              />
              <button
                type="submit"
                disabled={newsletterLoading}
                style={{
                  padding: '10px 20px',
                  fontSize: 14,
                  fontWeight: 500,
                  color: '#fff',
                  backgroundColor: '#1d1d1f',
                  border: 'none',
                  borderRadius: 10,
                  cursor: newsletterLoading ? 'not-allowed' : 'pointer',
                  opacity: newsletterLoading ? 0.7 : 1,
                }}
              >
                {newsletterLoading ? 'Envoi...' : "S'inscrire"}
              </button>
            </form>
            {newsletterMessage && (
              <p style={{ marginTop: 10, fontSize: 13, color: newsletterMessage.type === 'success' ? '#166534' : '#dc2626' }}>
                {newsletterMessage.text}
              </p>
            )}
          </div>
        </div>

        <div className="footer-bottom" style={{ paddingTop: 24, borderTop: '1px solid rgba(0,0,0,0.06)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <nav className="footer-bottom-nav" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 20px' }}>
            <Link href="/accessibilite" style={{ fontSize: 13, color: '#86868b' }}>Accessibilité</Link>
            <Link href="/mentions-legales" style={{ fontSize: 13, color: '#86868b' }}>Mentions légales</Link>
            <Link href="/cgu" style={{ fontSize: 13, color: '#86868b' }}>Conditions générales</Link>
            <Link href="/politique-confidentialite" style={{ fontSize: 13, color: '#86868b' }}>Politique de confidentialité et cookies</Link>
          </nav>
          <p style={{ fontSize: 13, color: '#86868b', margin: 0 }}>© {year} Section Luxe. Tous droits réservés.</p>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 900px) {
          .footer-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 32px !important; }
        }
        @media (max-width: 600px) {
          .footer-grid { grid-template-columns: 1fr 1fr !important; gap: 24px !important; }
          .footer-grid-brand { grid-column: 1 / -1 !important; }
          .footer-grid-newsletter { grid-column: 1 / -1 !important; }
          .footer-newsletter-form { display: flex !important; gap: 8px !important; align-items: stretch !important; }
          .footer-newsletter-form input { margin-bottom: 0 !important; flex: 1 !important; min-width: 0 !important; }
          .footer-newsletter-form button { flex-shrink: 0 !important; }
          .footer-bottom { flex-direction: column !important; align-items: stretch !important; }
          .footer-bottom-nav { width: 100% !important; flex-direction: row !important; flex-wrap: wrap !important; }
        }
      `}} />
    </footer>
  );
}
