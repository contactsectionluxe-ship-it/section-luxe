import { Suspense } from 'react';
import { ProposerVenteAuthSkeleton, ProposerVenteFormClient } from '@/components/proposition-vente/ProposerVenteFormClient';

export default function ProposerVentePage() {
  return (
    <Suspense fallback={<ProposerVenteAuthSkeleton />}>
      <ProposerVenteFormClient />
    </Suspense>
  );
}
