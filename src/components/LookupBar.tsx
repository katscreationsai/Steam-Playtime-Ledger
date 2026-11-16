import { ArrowRight, Moon, Search, Sun, Upload, X } from 'lucide-react';
import { detectClientInputHint } from '../utils/formatters.ts';

interface LookupBarProps {
  query: string;
  onQueryChange: (val: string) => void;
  onSubmit: (queryOverride?: string) => void;
  isLoading: boolean;
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenImport: () => void;
}

const EXAMPLE_PROFILES = [
  { label: 'robinwalker', value: 'https://steamcommunity.com/id/robinwalker' },
  { label: 'palmdesert', value: 'https://steamcommunity.com/id/palmdesert' },
  { label: '76561197960287930', value: '76561197960287930' },
];

export function LookupBar({
  query,
  onQueryChange,
  onSubmit,
  isLoading,
  isDark,
  onToggleTheme,
  onOpenImport,
}: LookupBarProps) {
  const hint = detectClientInputHint(query);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <section id="lookup" className="pt-6 pb-4 sm:pt-10 sm:pb-6">
      <div className="bg-white dark:bg-[#131B26] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-5">
          <div className="min-w-0">
            <h1 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100 [text-wrap:balance] max-w-2xl">
              Calculate your total Steam playtime
            </h1>
            <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl">
              Sum hours across every owned and played Steam title, inspect Windows, macOS, Linux, and Steam Deck splits, or convert any Steam identifier.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start lg:self-end">
            <button
              type="button"
              onClick={onOpenImport}
              className="inline-flex items-center gap-2 min-h-[44px] px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              <Upload className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Import Steam JSON</span>
            </button>

            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
              className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] px-3 py-2 text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              {isDark ? (
                <Sun className="w-4 h-4" aria-hidden="true" />
              ) : (
                <Moon className="w-4 h-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        <form onSubmit={handleFormSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 min-w-0">
            <Search
              className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="https://steamcommunity.com/id/username or 7656119..."
              aria-label="Steam profile URL, SteamID, or custom handle"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              className="w-full min-h-[48px] pl-10 pr-10 py-2.5 text-sm sm:text-base font-mono bg-slate-50 dark:bg-[#0B1117] text-slate-900 dark:text-slate-100 placeholder:font-sans placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-colors"
            />
            {query && (
              <button
                type="button"
                onClick={() => onQueryChange('')}
                aria-label="Clear search input"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="inline-flex items-center justify-center gap-2 min-h-[48px] px-6 py-3 text-sm sm:text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] rounded-xl transition-all whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#131B26]"
          >
            <span>{isLoading ? 'Calculating...' : 'Calculate Playtime'}</span>
            <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
          </button>
        </form>

        <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
          <p className="truncate">{hint}</p>
          <div className="flex items-center flex-wrap gap-x-3 gap-y-1">
            <span className="text-slate-400 dark:text-slate-500">Examples:</span>
            {EXAMPLE_PROFILES.map((ex) => (
              <button
                key={ex.label}
                type="button"
                onClick={() => {
                  onQueryChange(ex.value);
                  onSubmit(ex.value);
                }}
                className="font-mono text-blue-600 dark:text-blue-400 hover:underline underline-offset-2 py-1 whitespace-nowrap"
              >
                {ex.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
