import { Suspense } from 'react';
import { ProposerVenteFormClient } from '@/components/proposition-vente/ProposerVenteFormClient';
import { PageLoader } from '@/components/ui';

export default function ProposerVentePage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <ProposerVenteFormClient />
    </Suspense>
  );
}
