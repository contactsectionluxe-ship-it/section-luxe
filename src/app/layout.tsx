import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/hooks/useAuth';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { FirebaseWarning } from '@/components/FirebaseWarning';
import { ConsentBootstrap } from '@/components/consent/ConsentBootstrap';
import { GoogleTagManager, GoogleTagManagerNoscript } from '@/components/consent/GoogleTagManager';
import { CookieConsentProvider } from '@/components/consent/CookieConsentProvider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

const SITE_TITLE = 'Section Luxe | La vitrine des professionnels du luxe';
const SITE_DESCRIPTION =
  'Pièces de luxe de seconde main. Section Luxe réunit les annonces des vendeurs professionnels. Trouvez, comparez et choisissez la meilleure offre : sacs, vêtements, montres, bijoux, accessoires.';

export const metadata: Metadata = {
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  keywords: [
    'luxe occasion',
    'acheter luxe occasion',
    'vente luxe occasion',
    'annonces luxe',
    'luxe professionnel',
    'site vente luxe',
    'section luxe',
    'marketplace luxe',
    'luxe',
    'sacs',
    'montres',
    'bijoux',
    'mode',
  ],
  icons: {
    /** Favicon favoris / onglets : PNG carré à coins arrondis. */
    icon: [{ url: '/icon.png', sizes: '1024x1024', type: 'image/png' }],
    /** Écran d’accueil iOS, etc. : 180×180, même style. */
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${inter.variable} ${playfair.variable}`} data-scroll-behavior="smooth">
      <body className="min-h-screen flex flex-col antialiased font-sans">
        <GoogleTagManagerNoscript />
        <ConsentBootstrap />
        <GoogleTagManager />
        <AuthProvider>
          <CookieConsentProvider>
            <FirebaseWarning />
            <Header />
            <div className="site-main min-h-0 w-full min-w-0 flex-1" style={{ backgroundColor: '#fff' }}>
              {children}
            </div>
            <div style={{ flexShrink: 0 }}>
              <Footer />
            </div>
          </CookieConsentProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
