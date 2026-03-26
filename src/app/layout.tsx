import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/hooks/useAuth';
import { Header } from '@/components/layout/Header';
import { HeaderFallback } from '@/components/layout/HeaderFallback';
import { Footer } from '@/components/layout/Footer';
import { FirebaseWarning } from '@/components/FirebaseWarning';

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

const SITE_TITLE = 'Section Luxe - Trouver le meilleur du luxe - Annonces Luxe';
const SITE_DESCRIPTION =
  'Section Luxe référence les articles des vendeurs professionnels du luxe. Comparez, analysez et trouvez la meilleure offre parmi nos annonces luxe professionnel.';

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
  icons: { icon: '/icon.png' },
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
        <AuthProvider>
          <FirebaseWarning />
          <Suspense fallback={<HeaderFallback />}>
            <Header />
          </Suspense>
          <div className="flex-1" style={{ backgroundColor: '#fff' }}>{children}</div>
          <div style={{ flexShrink: 0 }}>
            <Footer />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
