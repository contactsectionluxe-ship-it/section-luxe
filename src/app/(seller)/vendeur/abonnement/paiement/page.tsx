'use client';

import { Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Redirection : le paiement Stripe part depuis /vendeur/abonnement (même onglet). */
function AbonnementPaiementRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/vendeur/abonnement');
  }, [router]);

  return (
    <div style={{ paddingTop: 'var(--header-height)', minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ fontSize: 15, color: '#6e6e73' }}>Redirection…</p>
    </div>
  );
}

export default function AbonnementPaiementPage() {
  return (
    <Suspense
      fallback={
        <div style={{ paddingTop: 'var(--header-height)', minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ fontSize: 15, color: '#6e6e73' }}>Chargement…</p>
        </div>
      }
    >
      <AbonnementPaiementRedirect />
    </Suspense>
  );
}
