import type { NextConfig } from "next";

/** Headers de sécurité pour un déploiement professionnel (anti-piratage, XSS, clickjacking, etc.) */
const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  /** Pas de X-Frame-Options: DENY ici : il empêche Tag Assistant / test d’installation GTM (iframe). On utilise frame-ancestors (CSP). */
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self), interest-cohort=()' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://www.googletagmanager.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.api.gouv.fr https://geo.api.gouv.fr https://api-adresse.data.gouv.fr https://api.stripe.com https://r.stripe.com https://m.stripe.network https://merchant-ui-api.stripe.com https://errors.stripe.com https://hooks.stripe.com https://www.google-analytics.com https://*.google-analytics.com https://analytics.google.com https://www.googletagmanager.com https://*.googletagmanager.com",
      "frame-src 'self' https://www.google.com https://maps.google.com https://js.stripe.com https://hooks.stripe.com https://www.googletagmanager.com",
      "worker-src 'self' blob:",
      "frame-ancestors 'self' https://tagassistant.google.com https://www.googletagmanager.com",
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
    proxyClientMaxBodySize: '50mb',
  },
  images: {
    /** Largeurs générées pour `/_next/image` : pas intermédiaires + plafond 4096 px pour hero / bannières Retina. */
    deviceSizes: [
      640, 750, 828, 1080, 1200, 1440, 1600, 1920, 2048, 2560, 2880, 3840, 4096,
    ],
    /** Vignettes catalogue / cartes : évite de monter trop vite à 640 px quand la case affiche ~240–400 px (même qualité, moins d’octets). */
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384, 432, 480, 512, 576, 640, 768],
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co', pathname: '/storage/v1/object/public/**' },
    ],
    /** Qualités autorisées pour `<Image quality={…}>` (hero 100, listings 92, défaut 75). */
    qualities: [75, 92, 100],
    /** AVIF/WebP en priorité : meilleure qualité par octet pour le même poids que du JPEG. */
    formats: ['image/avif', 'image/webp'],
    /** Cache long des variantes optimisées (répétitions / navigation : pas de re-téléchargement inutile). */
    minimumCacheTTL: 60 * 60 * 24 * 30,
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
      {
        source: '/mes-propositions-vente',
        destination: '/propositions',
        permanent: true,
      },
      {
        source: '/mes-propositions/:proposalId',
        destination: '/propositions/:proposalId',
        permanent: true,
      },
      {
        source: '/mes-propositions',
        destination: '/propositions',
        permanent: true,
      },
      {
        source: '/suivre-mes-offres/:proposalId',
        destination: '/propositions/:proposalId',
        permanent: true,
      },
      {
        source: '/suivre-mes-offres',
        destination: '/propositions',
        permanent: true,
      },
      {
        source: '/proposer-vente',
        destination: '/proposer-piece',
        permanent: true,
      },
      {
        source: '/vendeur',
        destination: '/vendeur/annonces',
        permanent: true,
      },
      {
        source: '/vendeur/factures',
        destination: '/vendeur/abonnement',
        permanent: false,
      },
      {
        source: '/vendeur/factures/:id',
        destination: '/vendeur/abonnement',
        permanent: false,
      },
      {
        source: '/vendeur/abonnement/factures-stripe',
        destination: '/vendeur/abonnement',
        permanent: false,
      },
    ];
  },
  poweredByHeader: false,
  compress: true,
};

export default nextConfig;
