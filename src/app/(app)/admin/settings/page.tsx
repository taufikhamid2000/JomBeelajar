'use client';
// Import dynamic config to optimize build
import './config';

// Import dynamic config to optimize build
import './config';

import { useState } from 'react';
import AdminNavigation from '@/components/admin/AdminNavigation';
import { logger } from '@/lib/logger';

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<
    'general' | 'gamification' | 'notifications'
  >('general');
  const [saving, setSaving] = useState(false);

  // General settings
  const [siteName, setSiteName] = useState('JomBeelajar');
  const [siteDescription, setSiteDescription] = useState(
    'Interactive educational platform'
  );

  // Gamification settings
  const [baseXpPerQuiz, setBaseXpPerQuiz] = useState(10);
  const [xpPerCorrectAnswer, setXpPerCorrectAnswer] = useState(5);
  const [levelThreshold, setLevelThreshold] = useState(100);

  async function saveGeneralSettings() {
    try {
      setSaving(true);

      // Simulate API call to save settings
      // In a real app, you'd save to your database
      await new Promise((resolve) => setTimeout(resolve, 1000));

      logger.log('General settings saved successfully');

      // Optionally update site config in database
      // const { error } = await supabase
      //   .from('site_config')
      //   .update({ name: siteName, description: siteDescription })
      //   .eq('id', 'general');
    } catch (error) {
      logger.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  }

  async function saveGamificationSettings() {
    try {
      setSaving(true);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Here you would save to your database
      logger.log('Gamification settings saved successfully');
    } catch (error) {
      logger.error('Error saving gamification settings:', error);
    } finally {
      setSaving(false);
    }
  }
  return (
    <div className="min-h-screen bg-gray-900 dark:bg-gray-50">
      <div className="flex">
        <AdminNavigation />
        <div className="flex-1 p-8">
          <h1 className="text-3xl font-bold mb-6 dark:text-white">Settings</h1>

          <div className="bg-gray-800 dark:bg-white rounded-lg shadow">
            {' '}
            <div className="border-b border-gray-700 dark:border-gray-200">
              <nav className="-mb-px flex">
                <button
                  onClick={() => setActiveTab('general')}
                  className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                    activeTab === 'general'
                      ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-300'
                      : 'border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  General
                </button>
                <button
                  onClick={() => setActiveTab('gamification')}
                  className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                    activeTab === 'gamification'
                      ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-300'
                      : 'border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  Gamification
                </button>{' '}
                <button
                  onClick={() => setActiveTab('notifications')}
                  className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                    activeTab === 'notifications'
                      ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-300'
                      : 'border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  Notifications
                </button>
              </nav>
            </div>{' '}
            <div className="p-6">
              {activeTab === 'general' && (
                <div>
                  <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                    General Settings
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="site-name"
                        className="block text-sm font-medium text-gray-300 dark:text-gray-700"
                      >
                        Site Name
                      </label>
                      <input
                        type="text"
                        id="site-name"
                        className="mt-1 block w-full border border-gray-600 dark:border-gray-300 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={siteName}
                        onChange={(e) => setSiteName(e.target.value)}
                      />
                    </div>
                    <div>
                      {' '}
                      <label
                        htmlFor="site-description"
                        className="block text-sm font-medium text-gray-300 dark:text-gray-700"
                      >
                        Site Description
                      </label>
                      <textarea
                        id="site-description"
                        rows={3}
                        className="mt-1 block w-full border border-gray-600 dark:border-gray-300 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={siteDescription}
                        onChange={(e) => setSiteDescription(e.target.value)}
                      />
                    </div>{' '}
                    <div className="flex justify-end">
                      <button
                        type="button"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        onClick={saveGeneralSettings}
                        disabled={saving}
                      >
                        {saving ? 'Saving...' : 'Save Settings'}
                      </button>
                    </div>
                  </div>
                </div>
              )}{' '}
              {activeTab === 'gamification' && (
                <div>
                  <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                    Gamification Settings
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="base-xp"
                        className="block text-sm font-medium text-gray-300 dark:text-gray-700"
                      >
                        Base XP per Quiz Completion
                      </label>
                      <input
                        type="number"
                        id="base-xp"
                        className="mt-1 block w-full border border-gray-600 dark:border-gray-300 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={baseXpPerQuiz}
                        onChange={(e) =>
                          setBaseXpPerQuiz(Number(e.target.value))
                        }
                      />
                    </div>
                    <div>
                      {' '}
                      <label
                        htmlFor="correct-answer-xp"
                        className="block text-sm font-medium text-gray-300 dark:text-gray-700"
                      >
                        XP per Correct Answer
                      </label>
                      <input
                        type="number"
                        id="correct-answer-xp"
                        className="mt-1 block w-full border border-gray-600 dark:border-gray-300 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={xpPerCorrectAnswer}
                        onChange={(e) =>
                          setXpPerCorrectAnswer(Number(e.target.value))
                        }
                      />
                    </div>
                    <div>
                      {' '}
                      <label
                        htmlFor="level-threshold"
                        className="block text-sm font-medium text-gray-300 dark:text-gray-700"
                      >
                        XP Threshold per Level
                      </label>
                      <input
                        type="number"
                        id="level-threshold"
                        className="mt-1 block w-full border border-gray-600 dark:border-gray-300 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={levelThreshold}
                        onChange={(e) =>
                          setLevelThreshold(Number(e.target.value))
                        }
                      />
                      <p className="mt-2 text-sm text-gray-500">
                        Users will level up after earning this amount of XP per
                        level.
                      </p>
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        onClick={saveGamificationSettings}
                        disabled={saving}
                      >
                        {saving ? 'Saving...' : 'Save Settings'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {activeTab === 'notifications' && (
                <div className="text-center py-8">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">
                    Notification Settings
                  </h2>
                  <p className="text-gray-500">
                    Notification settings will be implemented soon.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
