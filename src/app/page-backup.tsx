'use client';

import dynamic from 'next/dynamic';

const HomeContent = dynamic(() => import('@/components/HomeContent'), {
  ssr: false,
  loading: () => (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: 32, height: 32, border: '3px solid #e8e6e3', borderTopColor: '#1d1d1f', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  ),
});

export default function HomePage() {
  return (
    <div>
      <HomeContent />
    </div>
  );
}
