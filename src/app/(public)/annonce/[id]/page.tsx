import AnnonceListingPageClient from './AnnonceListingPageClient';

/** Route dynamique toujours résolue au runtime (évite 404 « page introuvable » sur /annonce/10K… en prod). */
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export default function AnnoncePage() {
  return <AnnonceListingPageClient />;
}
