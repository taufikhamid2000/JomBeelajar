'use client';
// Import dynamic config to optimize build
import './config';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import AdminNavigation from '@/components/admin/AdminNavigation';

interface LogEntry {
  id: string;
  level: 'info' | 'error' | 'warn' | 'debug';
  message: string;
  details: string;
  created_at: string;
  user_id: string | null;
  source: string;
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [logLevel, setLogLevel] = useState<
    'all' | 'error' | 'warn' | 'info' | 'debug'
  >('all');
  const [days, setDays] = useState(7);
  const [source, setSource] = useState('all');

  // Bumped by the Refresh button to re-run the fetch effect.
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        // Calculate the date range for the query
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Build the query
        let query = supabase
          .from('system_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .gte('created_at', startDate.toISOString());

        if (logLevel !== 'all') {
          query = query.eq('level', logLevel);
        }

        if (source !== 'all') {
          query = query.eq('source', source);
        }

        // Execute the query
        const { data, error } = await query;

        if (error) {
          throw error;
        }
        setLogs(data || []);
      } catch (error) {
        logger.error('Error fetching logs:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [days, logLevel, source, reloadKey]);

  // Filter changes and Refresh re-run the effect above; the loading flag is
  // set here in the handlers so the effect only sets state asynchronously.
  const refreshLogs = () => {
    setLoading(true);
    setReloadKey((k) => k + 1);
  };

  // Function to get the appropriate color based on log level
  function getLevelColor(level: string): string {
    switch (level) {
      case 'error':
        return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
      case 'warn':
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200';
      case 'info':
        return 'bg-brand-soft dark:bg-[var(--band-via)] text-brand';
      case 'debug':
        return 'bg-surface text-strong';
      default:
        return 'bg-surface text-strong';
    }
  }
  return (
    <div className="min-h-screen bg-surface">
      <div className="flex">
        <AdminNavigation />
        <div className="flex-1 p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 space-y-4 md:space-y-0">
            <h1 className="text-3xl font-bold">System Logs</h1>
            <div className="flex flex-wrap gap-2">
              {' '}
              <select
                value={logLevel}
                onChange={(e) => {
                  setLoading(true);
                  setLogLevel(
                    e.target.value as
                      'all' | 'error' | 'warn' | 'info' | 'debug'
                  );
                }}
                className="bg-surface border border-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand/40 focus:border-brand/40 text-strong sm:text-sm"
              >
                <option value="all">All Levels</option>
                <option value="error">Errors</option>
                <option value="warn">Warnings</option>
                <option value="info">Info</option>
                <option value="debug">Debug</option>
              </select>
              <select
                value={days}
                onChange={(e) => {
                  setLoading(true);
                  setDays(Number(e.target.value));
                }}
                className="bg-surface border border-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand/40 focus:border-brand/40 text-strong sm:text-sm"
              >
                <option value={1}>Last 24 hours</option>
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
              </select>
              <select
                value={source}
                onChange={(e) => {
                  setLoading(true);
                  setSource(e.target.value);
                }}
                className="bg-surface border border-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand/40 focus:border-brand/40 text-strong sm:text-sm"
              >
                <option value="all">All Sources</option>
                <option value="server">Server</option>
                <option value="client">Client</option>
                <option value="database">Database</option>
                <option value="auth">Authentication</option>
              </select>
              <button
                onClick={refreshLogs}
                disabled={loading}
                className="bg-[var(--band-via)] text-white px-4 py-2 rounded hover:bg-[var(--band-from)] dark:hover:bg-[var(--band-from)] disabled:bg-brand-soft dark:disabled:bg-[var(--band-via)]"
              >
                {loading ? 'Loading...' : 'Refresh'}
              </button>
            </div>
          </div>{' '}
          <div className="bg-surface rounded-lg shadow">
            <div className="p-6 border-b border-border">
              <h2 className="text-lg font-medium text-strong">
                System Log Entries
              </h2>
              <p className="text-sm text-soft mt-1">
                Showing {logs.length} logs from the past {days} days
                {logLevel !== 'all' && ` with level "${logLevel}"`}
                {source !== 'all' && ` from "${source}"`}
              </p>
            </div>

            {loading ? (
              <div className="p-8 flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand/40"></div>
              </div>
            ) : logs.length === 0 ? (
              <div className="p-8 text-center text-soft">
                No log entries found matching your criteria.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-surface-2">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-soft uppercase tracking-wider">
                        Timestamp
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-soft uppercase tracking-wider">
                        Level
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-soft uppercase tracking-wider">
                        Source
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-soft uppercase tracking-wider">
                        Message
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-soft uppercase tracking-wider">
                        User ID
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-surface divide-y divide-border">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-surface-2">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-soft">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${getLevelColor(log.level)}`}
                          >
                            {log.level}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-soft">
                          {log.source}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="max-w-lg truncate">{log.message}</div>
                          {log.details && (
                            <details className="mt-1">
                              <summary className="text-brand cursor-pointer text-xs">
                                Show Details
                              </summary>
                              <div className="mt-2 text-xs bg-surface-2 p-2 rounded overflow-auto max-h-40">
                                <pre>{log.details}</pre>
                              </div>
                            </details>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-soft">
                          {log.user_id ? (
                            <span className="font-mono text-xs">
                              {log.user_id.substring(0, 8)}...
                            </span>
                          ) : (
                            <span className="text-soft">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div className="mt-6 text-right">
            <button
              onClick={() => {
                if (
                  confirm(
                    'Are you sure you want to clear the logs displayed? This cannot be undone.'
                  )
                ) {
                  // In a real application, this would call an API endpoint to clear logs
                  logger.log('Clear logs action requested');
                }
              }}
              className="text-red-600 hover:text-red-800"
            >
              Clear Displayed Logs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
