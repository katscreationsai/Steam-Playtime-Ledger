import { FileUp, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { SteamAnalysisResponse } from '../types/steam.ts';

interface JsonImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImported: (data: SteamAnalysisResponse) => void;
}

export function JsonImportModal({
  isOpen,
  onClose,
  onImported,
}: JsonImportModalProps) {
  const [label, setLabel] = useState('');
  const [rawJson, setRawJson] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    if (!label) {
      setLabel(file.name.replace(/\.json$/i, ''));
    }
    try {
      const text = await file.text();
      setRawJson(text);
    } catch {
      setError('Unable to read the selected file.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!rawJson.trim()) {
      setError('Paste a Steam GetOwnedGames JSON payload or upload a .json file.');
      return;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawJson);
    } catch {
      setError('Invalid JSON syntax. Verify the pasted text is valid JSON.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/steam/parse-json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payload: parsed,
          label: label.trim() || 'Imported Steam Library',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not parse Steam library JSON.');
        return;
      }
      onImported(data as SteamAnalysisResponse);
      onClose();
    } catch {
      setError('Failed to reach the calculation server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-modal-title"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-xl bg-white dark:bg-[#131B26] border-t sm:border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        <div className="sm:hidden pt-3 pb-1 flex justify-center">
          <div className="w-10 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
        </div>

        <div className="px-4 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
          <div>
            <h3
              id="import-modal-title"
              className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100"
            >
              Import Steam Library JSON
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Analyze a saved <span className="font-mono">GetOwnedGames/v1</span> response offline.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close import dialog"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label
                htmlFor="import-label"
                className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5"
              >
                Profile Label (optional)
              </label>
              <input
                id="import-label"
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="My Steam Library"
                className="w-full min-h-[44px] px-3 py-2 text-sm bg-slate-50 dark:bg-[#0B1117] text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div className="shrink-0 flex items-end">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors"
              >
                <FileUp className="w-4 h-4" aria-hidden="true" />
                <span>Choose .json File</span>
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="import-json-text"
              className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5"
            >
              GetOwnedGames JSON Payload
            </label>
            <textarea
              id="import-json-text"
              rows={7}
              value={rawJson}
              onChange={(e) => setRawJson(e.target.value)}
              placeholder='{"response": {"game_count": 2, "games": [{"appid": 440, "name": "Team Fortress 2", "playtime_forever": 12450}]}}'
              className="w-full p-3 text-xs font-mono bg-slate-50 dark:bg-[#0B1117] text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {error && (
            <p className="text-xs text-red-600 dark:text-red-400" role="alert">
              {error}
            </p>
          )}

          <div className="pt-2 pb-safe flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="min-h-[44px] px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl"
            >
              {isSubmitting ? 'Calculating...' : 'Calculate JSON'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
