'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import Link from 'next/link';
import { CONSENT_POLICY_VERSION } from '@/lib/consent/constants';
import { applyConsentToGtag } from '@/lib/consent/gtag';
import { readStoredConsent, writeStoredConsent } from '@/lib/consent/storage';
import type { ConsentSource, StoredCookieConsent } from '@/lib/consent/types';

type CookieConsentContextValue = {
  openPreferences: () => void;
  /** Préférences actuelles si déjà enregistrées (même version politique). */
  stored: StoredCookieConsent | null;
};

const CookieConsentContext = createContext<CookieConsentContextValue | null>(null);

export function useCookieConsent(): CookieConsentContextValue {
  const ctx = useContext(CookieConsentContext);
  if (!ctx) {
    throw new Error('useCookieConsent doit être utilisé dans CookieConsentProvider');
  }
  return ctx;
}

async function logConsentServer(
  analytics: boolean,
  marketing: boolean,
  source: ConsentSource
): Promise<void> {
  try {
    await fetch('/api/consent/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        policyVersion: CONSENT_POLICY_VERSION,
        analytics,
        marketing,
        source,
      }),
    });
  } catch {
    /* trace best-effort */
  }
}

export function CookieConsentProvider({ children }: { children: React.ReactNode }) {
  const [consentChecked, setConsentChecked] = useState(false);
  const [stored, setStored] = useState<StoredCookieConsent | null>(null);
  const [bannerOpen, setBannerOpen] = useState(false);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [draftAnalytics, setDraftAnalytics] = useState(false);
  const [draftMarketing, setDraftMarketing] = useState(false);

  useEffect(() => {
    const s = readStoredConsent();
    setStored(s);
    setBannerOpen(!s);
    if (s) {
      applyConsentToGtag(s);
    }
    setConsentChecked(true);
  }, []);

  const openPreferences = useCallback(() => {
    const s = readStoredConsent();
    setDraftAnalytics(s?.analytics ?? false);
    setDraftMarketing(s?.marketing ?? false);
    setPrefsOpen(true);
  }, []);

  const closePrefs = useCallback(() => setPrefsOpen(false), []);

  useEffect(() => {
    if (!prefsOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closePrefs();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [prefsOpen, closePrefs]);

  const persist = useCallback(
    (analytics: boolean, marketing: boolean, source: ConsentSource) => {
      const next = writeStoredConsent(analytics, marketing);
      setStored(next);
      applyConsentToGtag(next);
      setBannerOpen(false);
      setPrefsOpen(false);
      void logConsentServer(analytics, marketing, source);
    },
    []
  );

  const handleAcceptAll = useCallback(() => {
    persist(true, true, 'accept_all');
  }, [persist]);

  const handleRejectAll = useCallback(() => {
    persist(false, false, 'reject_all');
  }, [persist]);

  const handleSaveCustom = useCallback(() => {
    persist(draftAnalytics, draftMarketing, 'customize');
  }, [draftAnalytics, draftMarketing, persist]);

  const ctx = useMemo(
    () => ({ openPreferences, stored }),
    [openPreferences, stored]
  );

  const showBanner = consentChecked && bannerOpen && !prefsOpen;

  return (
    <CookieConsentContext.Provider value={ctx}>
      {children}

      {prefsOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cookie-prefs-title"
          className="fixed inset-0 z-[10000] flex items-end justify-center sm:items-center p-4 sm:p-6"
          style={{ backgroundColor: 'rgba(15, 15, 15, 0.45)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) closePrefs();
          }}
        >
          <div
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#fdfcfb',
              border: '1px solid rgba(0,0,0,0.08)',
              boxShadow: '0 24px 48px rgba(0,0,0,0.12)',
            }}
          >
            <div style={{ padding: '28px 28px 20px' }}>
              <h2
                id="cookie-prefs-title"
                className="font-serif text-[1.35rem] font-normal tracking-tight"
                style={{ color: '#1d1d1f', margin: 0 }}
              >
                Préférences cookies
              </h2>
              <p style={{ marginTop: 12, fontSize: 14, lineHeight: 1.55, color: '#6e6e73' }}>
                Choisissez les finalités pour lesquelles vous acceptez le dépôt et la lecture de traceurs.
                Les cookies strictement nécessaires au fonctionnement du site restent actifs.{' '}
                <Link
                  href="/politique-confidentialite"
                  className="underline underline-offset-2"
                  style={{ color: '#424245' }}
                  onClick={closePrefs}
                >
                  Politique de confidentialité
                </Link>
              </p>

              <ul style={{ marginTop: 22, listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <li
                  style={{
                    padding: '14px 16px',
                    borderRadius: 10,
                    border: '1px solid rgba(0,0,0,0.06)',
                    backgroundColor: '#fff',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                    <div>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#1d1d1f' }}>Nécessaires</p>
                      <p style={{ margin: '6px 0 0', fontSize: 13, color: '#86868b', lineHeight: 1.45 }}>
                        Sécurité, session, mémorisation de ce choix.
                      </p>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#86868b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Toujours actif
                    </span>
                  </div>
                </li>
                <li
                  style={{
                    padding: '14px 16px',
                    borderRadius: 10,
                    border: '1px solid rgba(0,0,0,0.06)',
                    backgroundColor: '#fff',
                  }}
                >
                  <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                    <div>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#1d1d1f' }}>Mesure d’audience</p>
                      <p style={{ margin: '6px 0 0', fontSize: 13, color: '#86868b', lineHeight: 1.45 }}>
                        Statistiques de fréquentation (ex. Google Analytics si configuré).
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={draftAnalytics}
                      onChange={(e) => setDraftAnalytics(e.target.checked)}
                      style={{ width: 18, height: 18, accentColor: '#1d1d1f' }}
                      aria-label="Accepter la mesure d’audience"
                    />
                  </label>
                </li>
                <li
                  style={{
                    padding: '14px 16px',
                    borderRadius: 10,
                    border: '1px solid rgba(0,0,0,0.06)',
                    backgroundColor: '#fff',
                  }}
                >
                  <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                    <div>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#1d1d1f' }}>Publicité & personnalisation</p>
                      <p style={{ margin: '6px 0 0', fontSize: 13, color: '#86868b', lineHeight: 1.45 }}>
                        Publicité, remarketing et contenus personnalisés liés aux partenaires.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={draftMarketing}
                      onChange={(e) => setDraftMarketing(e.target.checked)}
                      style={{ width: 18, height: 18, accentColor: '#1d1d1f' }}
                      aria-label="Accepter la publicité et la personnalisation"
                    />
                  </label>
                </li>
              </ul>
            </div>
            <div
              style={{
                padding: '16px 28px 24px',
                display: 'flex',
                flexWrap: 'wrap',
                gap: 10,
                justifyContent: 'flex-end',
                borderTop: '1px solid rgba(0,0,0,0.06)',
              }}
            >
              <button
                type="button"
                onClick={closePrefs}
                style={{
                  padding: '10px 18px',
                  fontSize: 14,
                  borderRadius: 8,
                  border: '1px solid #d2d2d7',
                  background: '#fff',
                  color: '#1d1d1f',
                  cursor: 'pointer',
                }}
              >
                {bannerOpen ? 'Retour' : 'Fermer'}
              </button>
              <button
                type="button"
                onClick={handleSaveCustom}
                style={{
                  padding: '10px 20px',
                  fontSize: 14,
                  borderRadius: 8,
                  border: 'none',
                  background: '#1d1d1f',
                  color: '#fff',
                  cursor: 'pointer',
                }}
              >
                Enregistrer mes choix
              </button>
            </div>
          </div>
        </div>
      )}

      {showBanner && (
        <div
          role="dialog"
          aria-labelledby="cookie-banner-title"
          aria-modal="false"
          className="fixed bottom-0 left-0 right-0 z-[9999] flex justify-center p-4 sm:p-5"
          style={{ pointerEvents: 'none' }}
        >
          <div
            className="w-full max-w-4xl"
            style={{
              pointerEvents: 'auto',
              backgroundColor: '#fdfcfb',
              border: '1px solid rgba(0,0,0,0.08)',
              borderRadius: 14,
              boxShadow: '0 -4px 32px rgba(0,0,0,0.08)',
            }}
          >
            <div style={{ padding: '22px 24px 20px' }}>
              <h2
                id="cookie-banner-title"
                className="font-serif text-xl sm:text-2xl font-normal tracking-tight"
                style={{ color: '#1d1d1f', margin: 0 }}
              >
                Cookies sectionluxe.com
              </h2>
              <p
                className="text-[12px] leading-[1.55] sm:text-sm"
                style={{ marginTop: 10, color: '#6e6e73' }}
              >
                Section Luxe utilise des cookies pour personnaliser le contenu et vous offrir une expérience sur mesure.
                Vous pouvez gérer vos préférences et en savoir plus en cliquant sur{' '}
                <Link href="/politique-confidentialite" className="underline underline-offset-2" style={{ color: '#424245' }}>
                  Politique de confidentialité
                </Link>
                .
              </p>
              <div
                className="flex w-full flex-col gap-[10px] sm:flex-row sm:flex-wrap sm:items-center sm:justify-end"
                style={{ marginTop: 18 }}
              >
                <button
                  type="button"
                  onClick={handleRejectAll}
                  className="order-3 w-full sm:order-none sm:w-auto"
                  style={{
                    padding: '10px 18px',
                    fontSize: 14,
                    borderRadius: 8,
                    border: '1px solid #d2d2d7',
                    background: '#fff',
                    color: '#1d1d1f',
                    cursor: 'pointer',
                  }}
                >
                  Tout refuser
                </button>
                <button
                  type="button"
                  className="order-2 w-full sm:order-none sm:w-auto"
                  onClick={() => {
                    const s = readStoredConsent();
                    setDraftAnalytics(s?.analytics ?? false);
                    setDraftMarketing(s?.marketing ?? false);
                    setPrefsOpen(true);
                  }}
                  style={{
                    padding: '10px 18px',
                    fontSize: 14,
                    borderRadius: 8,
                    border: '1px solid #1d1d1f',
                    background: 'transparent',
                    color: '#1d1d1f',
                    cursor: 'pointer',
                  }}
                >
                  Personnaliser
                </button>
                <button
                  type="button"
                  onClick={handleAcceptAll}
                  className="order-1 w-full sm:order-none sm:w-auto"
                  style={{
                    padding: '10px 20px',
                    fontSize: 14,
                    borderRadius: 8,
                    border: 'none',
                    background: '#1d1d1f',
                    color: '#fff',
                    cursor: 'pointer',
                  }}
                >
                  Tout accepter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </CookieConsentContext.Provider>
  );
}
