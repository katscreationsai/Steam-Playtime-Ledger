import type { PlaytimeBracket, PlaytimeStats } from '../types/steam.ts';
import { formatHoursDecimal } from '../utils/formatters.ts';

interface PlaytimeAnalyticsProps {
  stats: PlaytimeStats;
  activeBracketId: PlaytimeBracket['id'] | null;
  onSelectBracket: (id: PlaytimeBracket['id'] | null) => void;
}

export function PlaytimeAnalytics({
  stats,
  activeBracketId,
  onSelectBracket,
}: PlaytimeAnalyticsProps) {
  const { platformTotals, brackets } = stats;
  const total = Math.max(1, platformTotals.totalMinutes);

  const platforms = [
    {
      key: 'windows',
      label: 'Windows',
      minutes: platformTotals.windowsMinutes,
      barClass: 'bg-blue-600 dark:bg-blue-500',
      dotClass: 'bg-blue-600 dark:bg-blue-500',
    },
    {
      key: 'deck',
      label: 'Steam Deck',
      minutes: platformTotals.deckMinutes,
      barClass: 'bg-emerald-600 dark:bg-emerald-500',
      dotClass: 'bg-emerald-600 dark:bg-emerald-500',
      note: 'Subset of Linux / SteamOS runtime',
    },
    {
      key: 'mac',
      label: 'macOS',
      minutes: platformTotals.macMinutes,
      barClass: 'bg-amber-600 dark:bg-amber-500',
      dotClass: 'bg-amber-600 dark:bg-amber-500',
    },
    {
      key: 'linux',
      label: 'Linux / SteamOS',
      minutes: platformTotals.linuxMinutes,
      barClass: 'bg-teal-600 dark:bg-teal-500',
      dotClass: 'bg-teal-600 dark:bg-teal-500',
    },
    {
      key: 'untracked',
      label: 'Legacy / Pre-2019 OS',
      minutes: platformTotals.untrackedMinutes,
      barClass: 'bg-slate-400 dark:bg-slate-600',
      dotClass: 'bg-slate-400 dark:bg-slate-600',
    },
  ];

  // For the stacked OS bar, exclude Deck because Deck is already counted inside Linux/Windows by Steam
  const osSegments = platforms.filter((p) => p.key !== 'deck' && p.minutes > 0);
  const maxBracketGames = Math.max(1, ...brackets.map((b) => b.gameCount));

  return (
    <section id="breakdown" className="pb-4 sm:pb-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Platform Breakdown Panel */}
        <div className="lg:col-span-6 bg-white dark:bg-[#131B26] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-baseline justify-between gap-4">
              <h3 className="font-display text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100">
                Platform Breakdown
              </h3>
              <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                {formatHoursDecimal(stats.totalMinutes)} h total
              </span>
            </div>

            {/* Proportional Stacked OS Bar */}
            <div
              className="mt-4 h-3 w-full rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 flex"
              role="img"
              aria-label="Playtime distribution across operating systems"
            >
              {osSegments.map((seg) => {
                const pct = (seg.minutes / total) * 100;
                return (
                  <div
                    key={seg.key}
                    style={{ width: `${Math.max(pct, 0.5)}%` }}
                    className={`${seg.barClass} h-full transition-all`}
                    title={`${seg.label}: ${formatHoursDecimal(seg.minutes)} h (${pct.toFixed(1)}%)`}
                  />
                );
              })}
            </div>

            <div className="mt-5 divide-y divide-slate-100 dark:divide-slate-800">
              {platforms.map((item) => {
                const pct = ((item.minutes / total) * 100).toFixed(1);
                return (
                  <div
                    key={item.key}
                    className="py-2.5 flex items-center justify-between gap-4 text-sm"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`w-2.5 h-2.5 rounded-sm shrink-0 ${item.dotClass}`}
                        aria-hidden="true"
                      />
                      <div className="min-w-0">
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {item.label}
                        </span>
                        {item.note && (
                          <span className="hidden sm:inline text-xs text-slate-400 dark:text-slate-500 ml-2">
                            ({item.note})
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0 font-mono tabular-nums">
                      <span className="text-slate-900 dark:text-slate-100 font-medium">
                        {formatHoursDecimal(item.minutes)} h
                      </span>
                      <span className="w-12 text-right text-xs text-slate-500 dark:text-slate-400">
                        {pct}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
            <span>Concentration:</span>
            <span className="font-mono tabular-nums text-slate-700 dark:text-slate-300">
              Top 1 game {stats.top1SharePercent}%
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums text-slate-700 dark:text-slate-300">
              Top 3 {stats.top3SharePercent}%
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums text-slate-700 dark:text-slate-300">
              Top 10 {stats.top10SharePercent}%
            </span>
          </div>
        </div>

        {/* Playtime Brackets Panel */}
        <div className="lg:col-span-6 bg-white dark:bg-[#131B26] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-baseline justify-between gap-4">
              <h3 className="font-display text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100">
                Playtime Brackets
              </h3>
              {activeBracketId ? (
                <button
                  type="button"
                  onClick={() => onSelectBracket(null)}
                  className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline underline-offset-2"
                >
                  Clear filter
                </button>
              ) : (
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Select a bracket to filter library
                </span>
              )}
            </div>

            <div className="mt-4 space-y-2">
              {brackets.map((b) => {
                const isActive = activeBracketId === b.id;
                const widthPct = (b.gameCount / maxBracketGames) * 100;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => onSelectBracket(isActive ? null : b.id)}
                    className={`w-full min-h-[44px] px-3 py-2 rounded-xl border text-left transition-colors flex flex-col justify-center gap-1.5 ${
                      isActive
                        ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/30 dark:border-blue-500'
                        : 'border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 text-xs sm:text-sm">
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {b.label}
                      </span>
                      <div className="flex items-center gap-3 font-mono tabular-nums text-xs">
                        <span className="text-slate-500 dark:text-slate-400">
                          {formatHoursDecimal(b.totalMinutes)} h
                        </span>
                        <span className="font-semibold text-slate-900 dark:text-slate-100 w-16 text-right">
                          {b.gameCount.toLocaleString()} {b.gameCount === 1 ? 'game' : 'games'}
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        style={{ width: `${b.gameCount > 0 ? Math.max(widthPct, 2) : 0}%` }}
                        className={`h-full rounded-full transition-all ${
                          isActive
                            ? 'bg-blue-600 dark:bg-blue-400'
                            : 'bg-slate-400 dark:bg-slate-600'
                        }`}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
