'use client';

import { logger } from '@/lib/logger';
import AdminNavigation from '@/components/admin/AdminNavigation';
import AdminDashboard from '@/components/admin/AdminDashboard';

interface AdminClientProps {
  // Reserved for future expansion
  className?: string;
}

export default function AdminClient({ className = '' }: AdminClientProps) {
  return (
    <div className={`min-h-screen bg-surface ${className}`}>
      <div className="flex">
        <AdminNavigation />
        <div className="flex-1 p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <div>
              <button
                onClick={() => logger.log('Dashboard refresh clicked')}
                className="px-4 py-2 bg-[var(--band-via)] text-white rounded hover:bg-[var(--band-from)] dark:bg-[var(--band-via)] dark:hover:bg-[var(--band-from)]"
              >
                Refresh Data
              </button>
            </div>
          </div>
          <AdminDashboard />
        </div>
      </div>
    </div>
  );
}
