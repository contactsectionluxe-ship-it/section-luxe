export type ConsentSource = 'accept_all' | 'reject_all' | 'customize';

export interface StoredCookieConsent {
  v: 1;
  analytics: boolean;
  marketing: boolean;
  policyVersion: number;
  updatedAt: string;
}
