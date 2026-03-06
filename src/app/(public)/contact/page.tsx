'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: 50,
  padding: '0 16px',
  fontSize: 15,
  border: '1px solid #d2d2d7',
  borderRadius: 12,
  boxSizing: 'border-box',
  outline: 'none',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 14,
  fontWeight: 500,
  marginBottom: 8,
  color: '#333',
};

export default function ContactPage() {
  const { user } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!user) return;
    const updates: { name?: string; email?: string } = {};
    if (user.displayName?.trim()) updates.name = user.displayName.trim();
    if (user.email?.trim()) updates.email = user.email.trim();
    if (Object.keys(updates).length > 0) {
      setForm((prev) => ({ ...prev, ...updates }));
    }
  }, [user]);

  useEffect(() => {
    if (success) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [success]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.email.trim() || !form.message.trim()) {
      setError('L\'email et le message sont obligatoires.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          subject: form.subject.trim() || 'Demande de contact',
          message: form.message.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data.error as string) || 'L\'envoi a échoué. Réessayez plus tard.');
        return;
      }
      setSuccess(true);
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch {
      setError('Une erreur est survenue. Réessayez plus tard.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ paddingTop: 'var(--header-height)', minHeight: '100vh', backgroundColor: '#fff' }}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '0.5cm 24px 80px' }}>
        {/* Titre centré — même design que Déposer une annonce */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <h1
            style={{
              fontFamily: 'var(--font-playfair), Georgia, serif',
              fontSize: 28,
              fontWeight: 500,
              marginBottom: 8,
              color: '#1d1d1f',
              letterSpacing: '-0.02em',
            }}
          >
            Contact
          </h1>
          <p style={{ fontSize: 15, color: '#6e6e73' }}>
            Une question ? Écrivez-nous.
          </p>
        </div>

        {/* Carte blanche — même style que le formulaire Déposer une annonce */}
        <div style={{ backgroundColor: '#fff', padding: '32px 28px', borderRadius: 18, boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
          <p style={{ fontSize: 15, color: '#6e6e73', lineHeight: 1.6, marginBottom: 24 }}>
            Pour toute demande, utilisez le formulaire ci-dessous ou écrivez-nous à{' '}
            <a
              href="mailto:contact.sectionluxe@gmail.com"
              style={{ color: '#6e6e73', textDecoration: 'none' }}
            >
              contact.sectionluxe@gmail.com
            </a>
            .
          </p>

          {success ? (
            <div
              style={{
                padding: 14,
                backgroundColor: '#f0fdf4',
                color: '#166534',
                fontSize: 14,
                marginBottom: 24,
                borderRadius: 12,
              }}
            >
              Votre message a bien été envoyé. Nous vous répondrons dans les meilleurs délais.
            </div>
          ) : null}

          {error ? (
            <div style={{ padding: 14, backgroundColor: '#fef2f2', color: '#dc2626', fontSize: 13, marginBottom: 20, borderRadius: 12 }}>
              {error}
            </div>
          ) : null}

          {!success && (
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 20 }}>
                <label htmlFor="contact-name" style={labelStyle}>
                  Nom
                </label>
                <input
                  id="contact-name"
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Votre nom"
                  style={inputStyle}
                />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label htmlFor="contact-email" style={labelStyle}>
                  Email <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  id="contact-email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder="votre@email.fr"
                  style={inputStyle}
                />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label htmlFor="contact-subject" style={labelStyle}>
                  Sujet
                </label>
                <input
                  id="contact-subject"
                  type="text"
                  value={form.subject}
                  onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
                  placeholder="Ex. Partenariat, Support..."
                  style={inputStyle}
                />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label htmlFor="contact-message" style={labelStyle}>
                  Message <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <textarea
                  id="contact-message"
                  required
                  value={form.message}
                  onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                  placeholder="Votre message..."
                  rows={5}
                  style={{
                    ...inputStyle,
                    height: 'auto',
                    padding: 16,
                    resize: 'vertical',
                    minHeight: 120,
                  }}
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  width: '100%',
                  height: 50,
                  backgroundColor: '#1d1d1f',
                  color: '#fff',
                  fontSize: 15,
                  fontWeight: 500,
                  border: 'none',
                  borderRadius: 12,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                }}
              >
                {submitting ? 'Envoi en cours...' : 'Envoyer'}
              </button>
            </form>
          )}

        </div>

        <p style={{ textAlign: 'center', marginTop: 28, fontSize: 15, color: '#6e6e73' }}>
          <Link href="/" style={{ color: '#1d1d1f', fontWeight: 500 }}>Retour à l&apos;accueil</Link>
        </p>
      </div>
    </div>
  );
}
