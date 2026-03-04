'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AccessibiliteAccentRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/accessibilite');
  }, [router]);
  return null;
}
