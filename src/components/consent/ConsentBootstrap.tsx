import Script from 'next/script';
import { getConsentBootstrapInlineScript } from '@/lib/consent/bootstrapScript';

/** Défaut Consent Mode + relecture localStorage avant GTM (voir bootstrapScript). */
export function ConsentBootstrap() {
  return (
    <Script
      id="cookie-consent-bootstrap"
      strategy="beforeInteractive"
      dangerouslySetInnerHTML={{ __html: getConsentBootstrapInlineScript() }}
    />
  );
}
