'use client';

import { AlertTriangle } from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabase/client';

export function FirebaseWarning() {
  if (isSupabaseConfigured) return null;

  return (
    <div className="bg-amber-50 border-b border-amber-200">
      <div className="container py-3">
        <div className="flex items-center gap-3 text-amber-800">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm">
            <strong>Supabase non configuré.</strong>{' '}
            Modifiez le fichier <code className="bg-amber-100 px-1 rounded">.env.local</code>{' '}
            avec vos clés Supabase pour activer toutes les fonctionnalités.
          </p>
        </div>
      </div>
    </div>
  );
}
