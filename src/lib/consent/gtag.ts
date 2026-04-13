'use client';

import type { StoredCookieConsent } from './types';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function ensureGtag(): void {
  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag !== 'function') {
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer!.push(args);
    };
  }
}

/** Met à jour Google Consent Mode v2 selon les préférences enregistrées. */
export function applyConsentToGtag(consent: StoredCookieConsent): void {
  ensureGtag();
  const a = consent.analytics ? 'granted' : 'denied';
  const m = consent.marketing ? 'granted' : 'denied';
  window.gtag!('consent', 'update', {
    analytics_storage: a,
    ad_storage: m,
    ad_user_data: m,
    ad_personalization: m,
    personalization_storage: m,
  });
  window.dataLayer!.push({
    event: 'cookie_consent_updated',
    analytics_enabled: consent.analytics,
    marketing_enabled: consent.marketing,
  });
}
