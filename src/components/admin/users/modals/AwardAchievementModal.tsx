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
      <div className="bg-surface rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 className="text-xl font-bold mb-4 text-strong">
          Award Achievement
        </h3>

        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => setMode('catalog')}
            className={`px-3 py-1 rounded text-sm ${
              mode === 'catalog'
                ? 'bg-[var(--band-via)] text-white'
                : 'bg-muted text-soft'
            }`}
          >
            From catalog
          </button>
          <button
            type="button"
            onClick={() => setMode('custom')}
            className={`px-3 py-1 rounded text-sm ${
              mode === 'custom'
                ? 'bg-[var(--band-via)] text-white'
                : 'bg-muted text-soft'
            }`}
          >
            One-off / custom
          </button>
        </div>

        {mode === 'catalog' ? (
          loadingCatalog ? (
            <p className="text-soft text-sm mb-4">Loading catalog...</p>
          ) : catalog.length === 0 ? (
            <p className="text-soft text-sm mb-4">
              No achievements in the catalog yet. Use &quot;One-off /
              custom&quot; or create one first under Achievement Catalog.
            </p>
          ) : (
            <>
              <div className="mb-4">
                <label
                  className="block text-soft text-sm font-bold mb-2"
                  htmlFor="achievementSelect"
                >
                  Achievement*
                </label>
                <select
                  id="achievementSelect"
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md bg-surface text-strong"
                >
                  {catalog.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.icon} {a.title}
                    </option>
                  ))}
                </select>
                {selected?.description && (
                  <p className="mt-1 text-xs text-soft">
                    {selected.description}
                  </p>
                )}
              </div>

              {selected?.maxProgress != null && (
                <div className="mb-6">
                  <label
                    className="block text-soft text-sm font-bold mb-2"
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
                    className="w-full px-3 py-2 border border-border rounded-md bg-surface text-strong"
                  />
                </div>
              )}
            </>
          )
        ) : (
          <>
            <div className="mb-4">
              <label
                className="block text-soft text-sm font-bold mb-2"
                htmlFor="title"
              >
                Achievement Title*
              </label>
              <input
                type="text"
                id="title"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-surface text-strong"
                required
              />
            </div>

            <div className="mb-4">
              <label
                className="block text-soft text-sm font-bold mb-2"
                htmlFor="description"
              >
                Description
              </label>
              <textarea
                id="description"
                value={customDescription}
                onChange={(e) => setCustomDescription(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-surface text-strong"
                rows={3}
              />
            </div>

            <div className="mb-6">
              <label
                className="block text-soft text-sm font-bold mb-2"
                htmlFor="icon"
              >
                Icon (emoji)
              </label>
              <input
                type="text"
                id="icon"
                value={customIcon}
                onChange={(e) => setCustomIcon(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-surface text-strong"
              />
            </div>
          </>
        )}

        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-muted text-strong rounded hover:bg-muted"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-4 py-2 bg-[var(--band-via)] text-white rounded hover:bg-[var(--band-from)] dark:bg-[var(--band-via)] dark:hover:bg-[var(--band-from)] disabled:opacity-50"
          >
            {submitting ? 'Awarding...' : 'Award'}
          </button>
        </div>
      </div>
    </div>
  );
}
