import { useEffect, useState } from 'react';
import { logger } from '@/lib/logger';

interface CatalogAchievement {
  id: string;
  achievementType: string;
  title: string;
  description: string;
  icon: string;
  maxProgress: number | null;
}

export type AwardFormData =
  | { achievementId: string; progress?: number; maxProgress?: number }
  | {
      achievementType: string;
      title: string;
      description: string;
      icon: string;
      progress?: number;
      maxProgress?: number;
    };

interface AwardAchievementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAward: (formData: AwardFormData) => Promise<void>;
}

export default function AwardAchievementModal({
  isOpen,
  onClose,
  onAward,
}: AwardAchievementModalProps) {
  const [mode, setMode] = useState<'catalog' | 'custom'>('catalog');
  const [catalog, setCatalog] = useState<CatalogAchievement[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);

  const [selectedId, setSelectedId] = useState('');
  const [progress, setProgress] = useState('');

  const [customTitle, setCustomTitle] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [customIcon, setCustomIcon] = useState('🏆');

  const [submitting, setSubmitting] = useState(false);

  // Reset the loading flag whenever the modal opens (adjusting state during
  // render rather than in the fetch effect).
  const [wasOpen, setWasOpen] = useState(isOpen);
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) setLoadingCatalog(true);
  }

  useEffect(() => {
    if (!isOpen) return;
    fetch('/api/achievements')
      .then((r) => r.json())
      .then((data) => {
        setCatalog(Array.isArray(data) ? data : []);
        if (Array.isArray(data) && data.length > 0) {
          setSelectedId(data[0].id);
        } else {
          setMode('custom');
        }
      })
      .catch((err) => logger.error('Error loading achievement catalog:', err))
      .finally(() => setLoadingCatalog(false));
  }, [isOpen]);

  if (!isOpen) return null;

  const selected = catalog.find((a) => a.id === selectedId);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      if (mode === 'catalog') {
        if (!selectedId) {
          alert('Please select an achievement');
          return;
        }
        await onAward({
          achievementId: selectedId,
          progress: progress ? Number(progress) : undefined,
          maxProgress: selected?.maxProgress ?? undefined,
        });
      } else {
        if (!customTitle.trim()) {
          alert('Please enter an achievement title');
          return;
        }
        await onAward({
          achievementType: 'manual',
          title: customTitle.trim(),
          description: customDescription.trim(),
          icon: customIcon.trim() || '🏆',
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-gray-800 dark:bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 className="text-xl font-bold mb-4 text-white dark:text-gray-900">
          Award Achievement
        </h3>

        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => setMode('catalog')}
            className={`px-3 py-1 rounded text-sm ${
              mode === 'catalog'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 dark:bg-gray-200 text-gray-300 dark:text-gray-700'
            }`}
          >
            From catalog
          </button>
          <button
            type="button"
            onClick={() => setMode('custom')}
            className={`px-3 py-1 rounded text-sm ${
              mode === 'custom'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 dark:bg-gray-200 text-gray-300 dark:text-gray-700'
            }`}
          >
            One-off / custom
          </button>
        </div>

        {mode === 'catalog' ? (
          loadingCatalog ? (
            <p className="text-gray-400 dark:text-gray-500 text-sm mb-4">
              Loading catalog...
            </p>
          ) : catalog.length === 0 ? (
            <p className="text-gray-400 dark:text-gray-500 text-sm mb-4">
              No achievements in the catalog yet. Use &quot;One-off / custom&quot;
              or create one first under Achievement Catalog.
            </p>
          ) : (
            <>
              <div className="mb-4">
                <label
                  className="block text-gray-300 dark:text-gray-700 text-sm font-bold mb-2"
                  htmlFor="achievementSelect"
                >
                  Achievement*
                </label>
                <select
                  id="achievementSelect"
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-600 dark:border-gray-300 rounded-md bg-white dark:bg-gray-700 text-white dark:text-gray-900"
                >
                  {catalog.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.icon} {a.title}
                    </option>
                  ))}
                </select>
                {selected?.description && (
                  <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                    {selected.description}
                  </p>
                )}
              </div>

              {selected?.maxProgress != null && (
                <div className="mb-6">
                  <label
                    className="block text-gray-300 dark:text-gray-700 text-sm font-bold mb-2"
                    htmlFor="progress"
                  >
                    Progress (out of {selected.maxProgress})
                  </label>
                  <input
                    type="number"
                    id="progress"
                    min="0"
                    max={selected.maxProgress}
                    value={progress}
                    onChange={(e) => setProgress(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-600 dark:border-gray-300 rounded-md bg-white dark:bg-gray-700 text-white dark:text-gray-900"
                  />
                </div>
              )}
            </>
          )
        ) : (
          <>
            <div className="mb-4">
              <label
                className="block text-gray-300 dark:text-gray-700 text-sm font-bold mb-2"
                htmlFor="title"
              >
                Achievement Title*
              </label>
              <input
                type="text"
                id="title"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-600 dark:border-gray-300 rounded-md bg-white dark:bg-gray-700 text-white dark:text-gray-900"
                required
              />
            </div>

            <div className="mb-4">
              <label
                className="block text-gray-300 dark:text-gray-700 text-sm font-bold mb-2"
                htmlFor="description"
              >
                Description
              </label>
              <textarea
                id="description"
                value={customDescription}
                onChange={(e) => setCustomDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-600 dark:border-gray-300 rounded-md bg-white dark:bg-gray-700 text-white dark:text-gray-900"
                rows={3}
              />
            </div>

            <div className="mb-6">
              <label
                className="block text-gray-300 dark:text-gray-700 text-sm font-bold mb-2"
                htmlFor="icon"
              >
                Icon (emoji)
              </label>
              <input
                type="text"
                id="icon"
                value={customIcon}
                onChange={(e) => setCustomIcon(e.target.value)}
                className="w-full px-3 py-2 border border-gray-600 dark:border-gray-300 rounded-md bg-white dark:bg-gray-700 text-white dark:text-gray-900"
              />
            </div>
          </>
        )}

        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-200 dark:text-gray-800 rounded hover:bg-gray-400 dark:hover:bg-gray-500"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Awarding...' : 'Award'}
          </button>
        </div>
      </div>
    </div>
  );
}
