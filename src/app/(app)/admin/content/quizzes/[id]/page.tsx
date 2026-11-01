'use client';
// Import dynamic config to optimize build
import './config';

import { useParams } from 'next/navigation';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminQuizContentRedirect() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const quizId = params?.id;

  useEffect(() => {
    // Redirect to the new audit page
    if (quizId) {
      router.replace(`/admin/quizzes/${quizId}/audit`);
    } else {
      router.replace('/admin/quizzes');
    }
  }, [quizId, router]);

  return (
    <div className="flex justify-center items-center min-h-screen bg-surface">
      <div className="text-center p-8 bg-surface rounded-lg shadow-md max-w-md">
        <div className="mb-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand/40 mx-auto"></div>
        </div>
        <h2 className="text-xl font-semibold text-strong mb-2">
          Redirecting to Audit System
        </h2>
        <p className="text-soft">
          Quiz editing has been replaced with the new audit system. Redirecting
          you to the audit page...
        </p>
      </div>
    </div>
  );
}
