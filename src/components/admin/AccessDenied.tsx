import React from 'react';
import { useRouter } from 'next/navigation';

export default function AccessDenied() {
  const router = useRouter();
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="text-center p-8 max-w-md">
        <div className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 p-4 rounded-lg mb-4">
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="mb-4">
            You don&#39;t have permission to access the admin area. This area is
            restricted to administrators only.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-[var(--band-via)] text-white rounded hover:bg-[var(--band-from)] dark:bg-[var(--band-via)] dark:hover:bg-[var(--band-from)] transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
