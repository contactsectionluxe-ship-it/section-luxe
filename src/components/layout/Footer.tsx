'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Loader2, Send } from 'lucide-react';

export function Footer() {
  const year = new Date().getFullYear();
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [newsletterMessage, setNewsletterMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);
  const newsletterMessageClearRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearNewsletterMessageLater = () => {
    if (newsletterMessageClearRef.current) {
      clearTimeout(newsletterMessageClearRef.current);
      newsletterMessageClearRef.current = null;
    }
    newsletterMessageClearRef.current = setTimeout(() => {
      setNewsletterMessage(null);
      newsletterMessageClearRef.current = null;
    }, 5000);
  };

  useEffect(() => {
    return () => {
      if (newsletterMessageClearRef.current) clearTimeout(newsletterMessageClearRef.current);
    };
  }, []);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = newsletterEmail.trim().toLowerCase();
    if (!email) return;
    if (newsletterMessageClearRef.current) {
      clearTimeout(newsletterMessageClearRef.current);
      newsletterMessageClearRef.current = null;
    }
    setNewsletterMessage(null);
    setNewsletterLoading(true);
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        alreadySubscribed?: boolean;
        message?: string;
      };
      if (res.ok) {
        if (data.alreadySubscribed === true || data.message === 'Déjà inscrit') {
          setNewsletterMessage({ type: 'info', text: 'Vous êtes déjà inscrit.' });
        } else {
          setNewsletterEmail('');
          setNewsletterMessage({ type: 'success', text: 'Merci, votre demande est enregistrée.' });
        }
        clearNewsletterMessageLater();
      } else {
        setNewsletterMessage({ type: 'error', text: data.error || 'Une erreur est survenue.' });
        clearNewsletterMessageLater();
      }
    } catch {
      setNewsletterMessage({ type: 'error', text: 'Une erreur est survenue.' });
      clearNewsletterMessageLater();
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
              <div className="footer-newsletter-field">
                <input
                  type="email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="Votre email"
                  required
                  autoComplete="email"
                  className="footer-newsletter-input"
                  aria-label="Adresse e-mail pour la newsletter"
                />
                <button
                  type="submit"
                  disabled={newsletterLoading || !newsletterEmail.trim()}
                  className="footer-newsletter-submit"
                  aria-label="Envoyer l’inscription à la newsletter"
                >
                  {newsletterLoading ? (
                    <Loader2 size={18} strokeWidth={2} className="footer-newsletter-submit-icon footer-newsletter-spin" aria-hidden />
                  ) : (
                    <Send size={18} strokeWidth={2} className="footer-newsletter-submit-icon" aria-hidden />
                  )}
                </button>
              </div>
            </form>
            {newsletterMessage && (
              <p
                style={{
                  marginTop: 10,
                  fontSize: 13,
                  color:
                    newsletterMessage.type === 'success'
                      ? '#166534'
                      : newsletterMessage.type === 'info'
                        ? '#9a3412'
                        : '#dc2626',
                }}
              >
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
        .footer-newsletter-form { width: 100%; max-width: 100%; }
        .footer-newsletter-field {
          position: relative;
          width: 100%;
          max-width: 100%;
          border: 1px solid #d2d2d7;
          border-radius: 10px;
          background-color: #fff;
          overflow: hidden;
        }
        .footer-newsletter-field:focus-within {
          border-color: #aeaeb2;
        }
        .footer-newsletter-input {
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
          padding: 12px 46px 12px 14px;
          margin: 0;
          font-size: 14px;
          border: none;
          border-radius: 0;
          background-color: transparent;
          outline: none;
        }
        .footer-newsletter-submit {
          position: absolute;
          right: 0;
          top: 0;
          bottom: 0;
          width: 44px;
          margin: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          border: none;
          border-left: 1px solid;
          border-left-color: inherit;
          border-radius: 0;
          background-color: #e8e8ed;
          color: #424245;
          cursor: pointer;
          transition: background-color 0.15s, color 0.15s, opacity 0.15s;
        }
        .footer-newsletter-submit:hover:not(:disabled) {
          background-color: #dcdcde;
          color: #1d1d1f;
        }
        .footer-newsletter-submit:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .footer-newsletter-submit-icon {
          flex-shrink: 0;
        }
        @keyframes footer-newsletter-spin {
          to { transform: rotate(360deg); }
        }
        .footer-newsletter-spin {
          animation: footer-newsletter-spin 0.7s linear infinite;
        }
        @media (max-width: 900px) {
          .footer-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 32px !important; }
        }
        @media (max-width: 600px) {
          .footer-grid { grid-template-columns: 1fr 1fr !important; gap: 24px !important; }
          .footer-grid-brand { grid-column: 1 / -1 !important; }
          .footer-grid-newsletter { grid-column: 1 / -1 !important; }
          .footer-bottom { flex-direction: column !important; align-items: stretch !important; }
          .footer-bottom-nav { width: 100% !important; flex-direction: row !important; flex-wrap: wrap !important; }
        }
      `}} />
    </footer>
  );
}
