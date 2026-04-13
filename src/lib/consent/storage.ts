'use client';

import { CONSENT_POLICY_VERSION, CONSENT_STORAGE_KEY } from './constants';
import type { StoredCookieConsent } from './types';

export function readStoredConsent(): StoredCookieConsent | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as Partial<StoredCookieConsent>;
    if (
      o.v !== 1 ||
      typeof o.analytics !== 'boolean' ||
      typeof o.marketing !== 'boolean' ||
      typeof o.updatedAt !== 'string' ||
      o.policyVersion !== CONSENT_POLICY_VERSION
    ) {
      return null;
    }
    return o as StoredCookieConsent;
  } catch {
    return null;
  }
}

export function writeStoredConsent(
  analytics: boolean,
  marketing: boolean
): StoredCookieConsent {
  const value: StoredCookieConsent = {
    v: 1,
    analytics,
    marketing,
    policyVersion: CONSENT_POLICY_VERSION,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(value));
  return value;
}
