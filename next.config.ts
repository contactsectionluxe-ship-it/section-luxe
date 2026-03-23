import type { NextConfig } from "next";

/** Headers de sécurité pour un déploiement professionnel (anti-piratage, XSS, clickjacking, etc.) */
const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self), interest-cohort=()' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.api.gouv.fr https://geo.api.gouv.fr https://api-adresse.data.gouv.fr https://api.stripe.com https://r.stripe.com https://m.stripe.network https://merchant-ui-api.stripe.com https://errors.stripe.com https://hooks.stripe.com",
      "frame-src 'self' https://www.google.com https://maps.google.com https://js.stripe.com https://hooks.stripe.com",
      "worker-src 'self' blob:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self' https://hooks.stripe.com",
    ].join('; '),
  },
];

const nextConfig: NextConfig = {
  /** Cache de build hors iCloud : évite l’erreur 500 quand le projet est dans iCloud (fichiers non synchronisés). */
  distDir: process.env.VERCEL ? '.next' : '.nosync/.next',
  experimental: {
    serverActions: { bodySizeLimit: '50mb' },
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co', pathname: '/storage/v1/object/public/**' },
    ],
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
  /** Anciens liens /produit/… → /annonce/… */
  async redirects() {
    return [
      {
        source: '/produit/:id',
        destination: '/annonce/:id',
        permanent: true,
      },
    ];
  },
  poweredByHeader: false,
  compress: true,
};

export default nextConfig;
