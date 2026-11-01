'use client';

import { useEffect } from 'react';
import { signOut } from '@/lib/auth';

export default function LogoutPage() {
  useEffect(() => {
    // Shared with Header and profile settings — same implementation,
    // same destination (/auth).
    signOut();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted">
      <div className="p-8 bg-surface rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">Logging Out...</h1>
        <p>Please wait while we log you out.</p>
        <div className="mt-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand/40 mx-auto"></div>
        </div>
      </div>
    </div>
  );
}
