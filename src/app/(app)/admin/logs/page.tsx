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
        return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200';
      case 'debug':
        return 'bg-gray-800 dark:bg-gray-100 text-gray-200 dark:text-gray-800';
      default:
        return 'bg-gray-800 dark:bg-gray-100 text-gray-200 dark:text-gray-800';
    }
  }
  return (
    <div className="min-h-screen bg-gray-900 dark:bg-gray-50">
      <div className="flex">
        <AdminNavigation />
        <div className="flex-1 p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 space-y-4 md:space-y-0">
            <h1 className="text-3xl font-bold dark:text-white">System Logs</h1>
            <div className="flex flex-wrap gap-2">
              {' '}
              <select
                value={logLevel}
                onChange={(e) => {
                  setLoading(true);
                  setLogLevel(
                    e.target.value as
                      | 'all'
                      | 'error'
                      | 'warn'
                      | 'info'
                      | 'debug'
                  );
                }}
                className="bg-white dark:bg-gray-700 border border-gray-600 dark:border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-gray-100 sm:text-sm"
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
                className="bg-white dark:bg-gray-700 border border-gray-600 dark:border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-gray-100 sm:text-sm"
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
                className="bg-white dark:bg-gray-700 border border-gray-600 dark:border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-gray-100 sm:text-sm"
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
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 dark:hover:bg-blue-800 disabled:bg-blue-300 dark:disabled:bg-blue-700"
              >
                {loading ? 'Loading...' : 'Refresh'}
              </button>
            </div>
          </div>{' '}
          <div className="bg-gray-800 dark:bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-700 dark:border-gray-200">
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                System Log Entries
              </h2>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                Showing {logs.length} logs from the past {days} days
                {logLevel !== 'all' && ` with level "${logLevel}"`}
                {source !== 'all' && ` from "${source}"`}
              </p>
            </div>

            {loading ? (
              <div className="p-8 flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 dark:border-blue-400"></div>
              </div>
            ) : logs.length === 0 ? (
              <div className="p-8 text-center text-gray-400 dark:text-gray-500">
                No log entries found matching your criteria.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700 dark:divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Timestamp
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Level
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Source
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Message
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User ID
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${getLevelColor(log.level)}`}
                          >
                            {log.level}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {log.source}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="max-w-lg truncate">{log.message}</div>
                          {log.details && (
                            <details className="mt-1">
                              <summary className="text-blue-600 cursor-pointer text-xs">
                                Show Details
                              </summary>
                              <div className="mt-2 text-xs bg-gray-50 p-2 rounded overflow-auto max-h-40">
                                <pre>{log.details}</pre>
                              </div>
                            </details>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {log.user_id ? (
                            <span className="font-mono text-xs">
                              {log.user_id.substring(0, 8)}...
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
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
