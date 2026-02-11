import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/hooks/useAuth';
import { Header } from '@/components/layout/Header';
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

export const metadata: Metadata = {
  title: 'Section Luxe - Marketplace d\'articles de luxe',
  description:
    'Découvrez des articles de luxe d\'exception sur Section Luxe, la marketplace réservée aux vendeurs professionnels. Sacs, montres, bijoux et plus encore.',
  keywords: ['luxe', 'marketplace', 'sacs', 'montres', 'bijoux', 'mode', 'occasion', 'section luxe'],
  icons: { icon: '/icon.png' },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${inter.variable} ${playfair.variable}`}>
      <body className="min-h-screen flex flex-col antialiased font-sans">
        <AuthProvider>
          <FirebaseWarning />
          <Header />
          <div className="flex-1">{children}</div>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
