import { AlertCircle, Clock, Gamepad2, Lock, Upload } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { GameDetailSheet } from './components/GameDetailSheet.tsx';
import { GamesLibrary } from './components/GamesLibrary.tsx';
import { IdConverterSection } from './components/IdConverterSection.tsx';
import { JsonImportModal } from './components/JsonImportModal.tsx';
import { LookupBar } from './components/LookupBar.tsx';
import { MobileBottomNav, type MobileTabId } from './components/MobileBottomNav.tsx';
import { PlaytimeAnalytics } from './components/PlaytimeAnalytics.tsx';
import { ProfileSummaryCard } from './components/ProfileSummaryCard.tsx';
import { TopNav } from './components/TopNav.tsx';
import type {
  HealthResponse,
  PlaytimeBracket,
  SteamAnalysisResponse,
  SteamGame,
} from './types/steam.ts';
import { downloadCsvReport, downloadSingleFileHtml } from './utils/exportReport.ts';

export default function App() {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<SteamAnalysisResponse | null>(null);
  const [selectedGame, setSelectedGame] = useState<SteamGame | null>(null);
  const [activeBracketId, setActiveBracketId] = useState<PlaytimeBracket['id'] | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [apiKeyConfigured, setApiKeyConfigured] = useState<boolean | null>(null);
  const [activeMobileTab, setActiveMobileTab] = useState<MobileTabId>('lookup');

  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const saved = window.localStorage.getItem('playtime-ledger-theme');
    if (saved === 'dark') return true;
    if (saved === 'light') return false;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    window.localStorage.setItem('playtime-ledger-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const runAnalysis = useCallback(async (inputValue: string) => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    setIsLoading(true);
    setError(null);
    setActiveBracketId(null);

    try {
      const res = await fetch('/api/steam/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to calculate Steam playtime.');
        return;
      }
      setAnalysis(data as SteamAnalysisResponse);

      // Update shareable URL parameter without reloading
      const nextUrl = new URL(window.location.href);
      nextUrl.searchParams.set('steam', trimmed);
      window.history.replaceState({}, '', nextUrl.toString());

      if ((data as SteamAnalysisResponse).stats) {
        setActiveMobileTab('overview');
      }
    } catch {
      setError('Unable to reach the Steam playtime backend. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then((d: HealthResponse) => setApiKeyConfigured(Boolean(d.apiKeyConfigured)))
      .catch(() => setApiKeyConfigured(null));

    const params = new URLSearchParams(window.location.search);
    const initialSteam = params.get('steam');
    if (initialSteam) {
      setQuery(initialSteam);
      void runAnalysis(initialSteam);
    }
  }, [runAnalysis]);

  const handleNavigate = (sectionId: string) => {
    if (sectionId === 'top' || sectionId === 'lookup') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setActiveMobileTab('lookup');
      return;
    }
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    if (
      sectionId === 'overview' ||
      sectionId === 'library' ||
      sectionId === 'identifiers'
    ) {
      setActiveMobileTab(sectionId);
    }
  };

  const hasStats = Boolean(analysis && analysis.status === 'ok' && analysis.stats);

  return (
    <div id="top" className="min-h-screen flex flex-col bg-[#F6F7F9] dark:bg-[#0B1117] text-slate-900 dark:text-slate-100">
      <TopNav
        hasResults={hasStats}
        onExportHtml={() => analysis && downloadSingleFileHtml(analysis)}
        onOpenImport={() => setIsImportOpen(true)}
        onNavigate={handleNavigate}
      />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 pb-24 md:pb-12">
        <LookupBar
          query={query}
          onQueryChange={setQuery}
          onSubmit={(override) => runAnalysis(override ?? query)}
          isLoading={isLoading}
          isDark={isDark}
          onToggleTheme={() => setIsDark((prev) => !prev)}
          onOpenImport={() => setIsImportOpen(true)}
        />

        {/* Server Key Notice (if not configured yet) */}
        {apiKeyConfigured === false && !analysis && !error && (
          <div className="mb-6 bg-white dark:bg-[#131B26] border border-amber-200 dark:border-amber-900/60 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertCircle
                className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Server Steam Web API key not configured
                </p>
                <p className="mt-0.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  Add <span className="font-mono">STEAM_API_KEY</span> in your server environment secrets to fetch full game libraries from <span className="font-mono">api.steampowered.com</span>. Profile resolution, ID conversion, and <span className="font-mono">GetOwnedGames</span> JSON import work immediately.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsImportOpen(true)}
              className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl shrink-0 whitespace-nowrap"
            >
              <Upload className="w-4 h-4" aria-hidden="true" />
              <span>Import JSON Snapshot</span>
            </button>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div
            role="alert"
            className="mb-6 bg-white dark:bg-[#131B26] border border-red-200 dark:border-red-900/60 rounded-2xl p-4 sm:p-5 flex items-start gap-3"
          >
            <AlertCircle
              className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <div>
              <p className="text-sm font-semibold text-red-700 dark:text-red-400">
                Lookup Failed
              </p>
              <p className="mt-0.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* Loading Skeleton */}
        {isLoading && (
          <div className="space-y-4 mb-6" aria-busy="true" aria-label="Loading Steam playtime">
            <div className="bg-white dark:bg-[#131B26] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-slate-200 dark:bg-slate-800" />
                <div className="space-y-2 flex-1">
                  <div className="h-5 w-48 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="h-4 w-64 bg-slate-100 dark:bg-slate-800/70 rounded" />
                </div>
              </div>
              <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-20 bg-slate-100 dark:bg-slate-800/70 rounded-xl" />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {!isLoading && analysis && (
          <>
            <ProfileSummaryCard data={analysis} />

            {/* Private games or Missing API Key state */}
            {analysis.status !== 'ok' && (
              <div className="mb-6 bg-white dark:bg-[#131B26] border border-amber-200 dark:border-amber-900/60 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <Lock
                    className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <div>
                    <h3 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100">
                      {analysis.status === 'private_games'
                        ? 'Steam Game Details Are Private'
                        : 'Server Steam API Key Required for Library Totals'}
                    </h3>
                    <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
                      {analysis.message}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsImportOpen(true)}
                  className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shrink-0 whitespace-nowrap"
                >
                  <Upload className="w-4 h-4" aria-hidden="true" />
                  <span>Import JSON</span>
                </button>
              </div>
            )}

            {analysis.status === 'ok' && analysis.stats && (
              <>
                <PlaytimeAnalytics
                  stats={analysis.stats}
                  activeBracketId={activeBracketId}
                  onSelectBracket={(id) => {
                    setActiveBracketId(id);
                    if (id) {
                      const el = document.getElementById('library');
                      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }}
                />
                <GamesLibrary
                  games={analysis.games}
                  brackets={analysis.stats.brackets}
                  activeBracketId={activeBracketId}
                  onClearBracket={() => setActiveBracketId(null)}
                  onSelectGame={setSelectedGame}
                  onExportCsv={() => downloadCsvReport(analysis)}
                  onExportHtml={() => downloadSingleFileHtml(analysis)}
                />
              </>
            )}
          </>
        )}

        {/* Initial Ready State (before first lookup) */}
        {!isLoading && !analysis && (
          <section className="pb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-[#131B26] border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
                <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                <h2 className="mt-3 font-display text-base font-semibold text-slate-900 dark:text-slate-100">
                  Complete Account Accounting
                </h2>
                <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
                  Totals every minute played across paid titles and free-to-play games, including unplayed backlog ratio and median session depth.
                </p>
              </div>

              <div className="bg-white dark:bg-[#131B26] border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
                <Gamepad2 className="w-5 h-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                <h2 className="mt-3 font-display text-base font-semibold text-slate-900 dark:text-slate-100">
                  OS & Steam Deck Telemetry
                </h2>
                <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
                  Splits total lifetime hours across Windows, Steam Deck, macOS, and Linux / SteamOS straight from Steam Web API records.
                </p>
              </div>

              <div className="bg-white dark:bg-[#131B26] border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
                <Upload className="w-5 h-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                <h2 className="mt-3 font-display text-base font-semibold text-slate-900 dark:text-slate-100">
                  Single-File HTML Export
                </h2>
                <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
                  Download a self-contained single-file HTML snapshot or CSV spreadsheet of your entire library to keep or share offline.
                </p>
              </div>
            </div>
          </section>
        )}

        <IdConverterSection activeIdentifiers={analysis?.identifiers ?? null} />
      </main>

      <footer className="hidden md:block border-t border-slate-200 dark:border-slate-800 py-6">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Playtime Ledger — Steam Playtime Calculator</span>
          <span>Powered by Steam Web API · Not affiliated with Valve Corporation</span>
        </div>
      </footer>

      <MobileBottomNav
        activeTab={activeMobileTab}
        hasResults={hasStats}
        onSelectTab={(tab) => handleNavigate(tab)}
      />

      <GameDetailSheet game={selectedGame} onClose={() => setSelectedGame(null)} />

      <JsonImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImported={(imported) => {
          setError(null);
          setActiveBracketId(null);
          setAnalysis(imported);
          setActiveMobileTab('overview');
        }}
      />
    </div>
  );
}
