'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Loader2, Send } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { pickApiErrorBodyMessage } from '@/lib/user-facing-error';

export function Footer() {
  const { isAuthenticated } = useAuth();
  const year = new Date().getFullYear();
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStep, setNewsletterStep] = useState<'email' | 'consent'>('email');
  const [newsletterConsent, setNewsletterConsent] = useState(false);
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

  const resetNewsletterFlow = () => {
    setNewsletterStep('email');
    setNewsletterConsent(false);
  };

  /** Premier envoi : passage à l’étape consentement (sans appel API). */
  const handleNewsletterEmailStep = (e: React.FormEvent) => {
    e.preventDefault();
    const email = newsletterEmail.trim().toLowerCase();
    if (!email) return;
    if (newsletterMessageClearRef.current) {
      clearTimeout(newsletterMessageClearRef.current);
      newsletterMessageClearRef.current = null;
    }
    setNewsletterMessage(null);
    setNewsletterConsent(false);
    setNewsletterStep('consent');
  };

  /** Après case cochée : inscription effective. */
  const handleNewsletterConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = newsletterEmail.trim().toLowerCase();
    if (!email) return;
    if (!newsletterConsent) {
      if (newsletterMessageClearRef.current) {
        clearTimeout(newsletterMessageClearRef.current);
        newsletterMessageClearRef.current = null;
      }
      setNewsletterMessage({
        type: 'error',
        text: 'Veuillez cocher la case pour accepter l’utilisation de votre e-mail.',
      });
      clearNewsletterMessageLater();
      return;
    }
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
          resetNewsletterFlow();
          setNewsletterMessage({ type: 'info', text: 'Vous êtes déjà inscrit.' });
        } else {
          setNewsletterEmail('');
          resetNewsletterFlow();
          setNewsletterMessage({ type: 'success', text: 'Merci, votre inscription est enregistrée.' });
        }
        clearNewsletterMessageLater();
      } else {
        setNewsletterMessage({
          type: 'error',
          text: pickApiErrorBodyMessage(data, 'Une erreur est survenue.'),
        });
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
              <Link
                href={isAuthenticated ? '/proposer-piece' : '/connexion?redirect=/proposer-piece'}
                style={{ fontSize: 14, color: '#6e6e73' }}
              >
                Proposer ma pièce
              </Link>
              <Link href="/a-propos" style={{ fontSize: 14, color: '#6e6e73' }}>À propos</Link>
              <Link href="/contact" style={{ fontSize: 14, color: '#6e6e73' }}>Contact</Link>
            </nav>
          </div>

          {/* Colonne 4 : Newsletter */}
          <div className="footer-grid-newsletter">
            <h4 style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, color: '#86868b', marginBottom: 16 }}>
              Newsletter
            </h4>
            <p style={{ fontSize: 14, color: '#6e6e73', lineHeight: 1.5, marginBottom: 14 }}>
              Inscrivez-vous pour recevoir les actualités.
            </p>
            {newsletterStep === 'email' ? (
              <form onSubmit={handleNewsletterEmailStep} className="footer-newsletter-form">
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
                    disabled={!newsletterEmail.trim()}
                    className="footer-newsletter-submit"
                    aria-label="Continuer vers la confirmation d’acceptation"
                  >
                    <Send size={18} strokeWidth={2} className="footer-newsletter-submit-icon" aria-hidden />
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleNewsletterConfirm} className="footer-newsletter-form">
                <div className="footer-newsletter-field" style={{ marginBottom: 12 }}>
                  <input
                    type="email"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder="Votre email"
                    required
                    autoComplete="email"
                    className="footer-newsletter-input footer-newsletter-input--full"
                    aria-label="Adresse e-mail pour la newsletter"
                  />
                </div>
                <p style={{ fontSize: 13, color: '#6e6e73', lineHeight: 1.5, marginBottom: 12 }}>
                  Pour enregistrer votre inscription, merci d’accepter le traitement de votre adresse e-mail aux fins
                  d’envoi de la newsletter, conformément à notre politique de confidentialité.
                </p>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    fontSize: 13,
                    color: '#424245',
                    lineHeight: 1.45,
                    cursor: 'pointer',
                    marginBottom: 14,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={newsletterConsent}
                    onChange={(e) => setNewsletterConsent(e.target.checked)}
                    style={{ width: 18, height: 18, marginTop: 2, flexShrink: 0, accentColor: '#1d1d1f' }}
                  />
                  <span>
                    J’accepte que mon adresse e-mail soit utilisée pour recevoir la newsletter et les actualités
                    Section Luxe, et j’ai pris connaissance de la{' '}
                    <Link href="/politique-confidentialite" style={{ color: '#424245', textDecoration: 'underline', textUnderlineOffset: 2 }}>
                      politique de confidentialité
                    </Link>
                    .
                  </span>
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={resetNewsletterFlow}
                    disabled={newsletterLoading}
                    style={{
                      padding: '10px 16px',
                      fontSize: 14,
                      borderRadius: 8,
                      border: '1px solid #d2d2d7',
                      background: '#fff',
                      color: '#424245',
                      cursor: newsletterLoading ? 'not-allowed' : 'pointer',
                      opacity: newsletterLoading ? 0.6 : 1,
                    }}
                  >
                    Retour
                  </button>
                  <button
                    type="submit"
                    disabled={newsletterLoading || !newsletterEmail.trim()}
                    style={{
                      padding: '10px 18px',
                      fontSize: 14,
                      borderRadius: 8,
                      border: 'none',
                      background: '#1d1d1f',
                      color: '#fff',
                      cursor: newsletterLoading || !newsletterEmail.trim() ? 'not-allowed' : 'pointer',
                      opacity: newsletterLoading || !newsletterEmail.trim() ? 0.6 : 1,
                    }}
                  >
                    {newsletterLoading ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        <Loader2 size={16} strokeWidth={2} className="footer-newsletter-spin" aria-hidden />
                        Envoi…
                      </span>
                    ) : (
                      'Valider mon inscription'
                    )}
                  </button>
                </div>
              </form>
            )}
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

            <div style={{ marginTop: 'calc(18px + 1mm)' }}>
              <h4 style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, color: '#86868b', marginBottom: 16 }}>
                Partenariat
              </h4>
              <p style={{ fontSize: 14, color: '#6e6e73', lineHeight: 1.5, margin: 0 }}>
                Contactez-nous{' '}
                <Link
                  href={`/contact?objet=${encodeURIComponent('Demande de partenariat')}`}
                  style={{ color: '#6e6e73', textDecoration: 'underline', textUnderlineOffset: 2 }}
                >
                  ici
                </Link>{' '}
                pour toute demande de partenariat.
              </p>
            </div>
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
        .footer-newsletter-input.footer-newsletter-input--full {
          padding: 12px 14px;
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
