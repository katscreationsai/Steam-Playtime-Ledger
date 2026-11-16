import { ChevronRight, Download, FileSpreadsheet, Gamepad2, Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { PlaytimeBracket, SteamGame } from '../types/steam.ts';
import {
  formatHoursAndMinutes,
  formatHoursDecimal,
  formatLastPlayed,
} from '../utils/formatters.ts';

export type LibraryFilter = 'all' | 'played' | 'recent' | 'unplayed';
export type LibrarySort = 'time-desc' | 'time-asc' | 'recent-desc' | 'last-played' | 'name-asc';

interface GamesLibraryProps {
  games: SteamGame[];
  brackets: PlaytimeBracket[];
  activeBracketId: PlaytimeBracket['id'] | null;
  onClearBracket: () => void;
  onSelectGame: (game: SteamGame) => void;
  onExportCsv: () => void;
  onExportHtml: () => void;
}

function GameThumbnail({ game }: { game: SteamGame }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="w-16 h-8 sm:w-20 sm:h-9 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
        <Gamepad2 className="w-4 h-4 text-slate-400 dark:text-slate-500" aria-hidden="true" />
      </div>
    );
  }

  return (
    <img
      src={game.headerUrl}
      alt=""
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className="w-16 h-8 sm:w-20 sm:h-9 rounded-md object-cover border border-slate-200 dark:border-slate-700 shrink-0 bg-slate-100 dark:bg-slate-800"
    />
  );
}

export function GamesLibrary({
  games,
  brackets,
  activeBracketId,
  onClearBracket,
  onSelectGame,
  onExportCsv,
  onExportHtml,
}: GamesLibraryProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<LibraryFilter>('all');
  const [sort, setSort] = useState<LibrarySort>('time-desc');
  const [visibleLimit, setVisibleLimit] = useState(75);

  const activeBracket = brackets.find((b) => b.id === activeBracketId) || null;

  const filteredGames = useMemo(() => {
    const q = search.trim().toLowerCase();

    const list = games.filter((g) => {
      if (activeBracket) {
        if (g.playtimeForever < activeBracket.minMinutes) return false;
        if (activeBracket.maxMinutes !== null && g.playtimeForever > activeBracket.maxMinutes) {
          return false;
        }
      } else {
        if (filter === 'played' && g.playtimeForever <= 0) return false;
        if (filter === 'unplayed' && g.playtimeForever > 0) return false;
        if (filter === 'recent' && g.playtime2Weeks <= 0) return false;
      }

      if (q) {
        const matchesName = g.name.toLowerCase().includes(q);
        const matchesId = String(g.appid).includes(q);
        if (!matchesName && !matchesId) return false;
      }

      return true;
    });

    const sorted = [...list];
    if (sort === 'time-desc') {
      sorted.sort((a, b) => b.playtimeForever - a.playtimeForever || a.name.localeCompare(b.name));
    } else if (sort === 'time-asc') {
      sorted.sort((a, b) => a.playtimeForever - b.playtimeForever || a.name.localeCompare(b.name));
    } else if (sort === 'recent-desc') {
      sorted.sort((a, b) => b.playtime2Weeks - a.playtime2Weeks || b.playtimeForever - a.playtimeForever);
    } else if (sort === 'last-played') {
      sorted.sort((a, b) => b.rtimeLastPlayed - a.rtimeLastPlayed || b.playtimeForever - a.playtimeForever);
    } else if (sort === 'name-asc') {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    }

    return sorted;
  }, [games, search, filter, sort, activeBracket]);

  const filteredTotalMinutes = useMemo(
    () => filteredGames.reduce((acc, g) => acc + g.playtimeForever, 0),
    [filteredGames]
  );

  const visibleGames = filteredGames.slice(0, visibleLimit);
  const hasMore = filteredGames.length > visibleLimit;

  return (
    <section id="library" className="pb-6">
      <div className="bg-white dark:bg-[#131B26] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
        {/* Header + Export Controls */}
        <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100">
              Game Library Ledger
            </h3>
            <p className="mt-0.5 text-xs sm:text-sm font-mono tabular-nums text-slate-500 dark:text-slate-400">
              Showing {filteredGames.length.toLocaleString()} of {games.length.toLocaleString()} titles ·{' '}
              {formatHoursDecimal(filteredTotalMinutes)} h subtotal
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onExportCsv}
              className="inline-flex items-center gap-1.5 min-h-[44px] px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors whitespace-nowrap"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>Export CSV</span>
            </button>
            <button
              type="button"
              onClick={onExportHtml}
              className="inline-flex items-center gap-1.5 min-h-[44px] px-3.5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>Single-File HTML</span>
            </button>
          </div>
        </div>

        {/* Search, Filter Tabs, Sort */}
        <div className="p-4 sm:px-6 sm:py-4 border-b border-slate-100 dark:border-slate-800 flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1 min-w-0">
            <Search
              className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setVisibleLimit(75);
              }}
              placeholder="Filter games by title or AppID..."
              aria-label="Filter games by title or AppID"
              className="w-full min-h-[44px] pl-10 pr-10 py-2 text-sm bg-slate-50 dark:bg-[#0B1117] text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="Clear game search"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {activeBracket ? (
              <button
                type="button"
                onClick={onClearBracket}
                className="inline-flex items-center gap-2 min-h-[44px] px-3.5 py-2 text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl whitespace-nowrap"
              >
                <span>Bracket: {activeBracket.label}</span>
                <X className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            ) : (
              <div
                role="tablist"
                aria-label="Filter library by play status"
                className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-[#0B1117] rounded-xl overflow-x-auto max-w-full"
              >
                {(
                  [
                    { id: 'all', label: 'All' },
                    { id: 'played', label: 'Played' },
                    { id: 'recent', label: '2 Weeks' },
                    { id: 'unplayed', label: 'Unplayed' },
                  ] as const
                ).map((tab) => {
                  const active = filter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => {
                        setFilter(tab.id);
                        setVisibleLimit(75);
                      }}
                      className={`min-h-[36px] px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                        active
                          ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            )}

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as LibrarySort)}
              aria-label="Sort games"
              className="min-h-[44px] px-3 py-2 text-xs sm:text-sm font-medium bg-slate-50 dark:bg-[#0B1117] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="time-desc">Most Played</option>
              <option value="recent-desc">Most Recent (2 Weeks)</option>
              <option value="last-played">Last Played Date</option>
              <option value="time-asc">Least Played</option>
              <option value="name-asc">Title A–Z</option>
            </select>
          </div>
        </div>

        {/* Empty Filter State */}
        {visibleGames.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
              No games match the current filter
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Try clearing your search query or switching to All games.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setFilter('all');
                onClearBracket();
              }}
              className="mt-4 min-h-[44px] px-4 py-2 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 rounded-xl"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <>
            {/* Desktop High-Density Data Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-50/70 dark:bg-[#0B1117]/60">
                    <th className="py-2.5 pl-6 pr-3 w-12 font-mono">#</th>
                    <th className="py-2.5 px-3">Game</th>
                    <th className="py-2.5 px-3 text-right">Playtime</th>
                    <th className="py-2.5 px-3 text-right">Exact</th>
                    <th className="py-2.5 px-3 text-right">2 Weeks</th>
                    <th className="py-2.5 px-3 text-right">Share</th>
                    <th className="py-2.5 pl-3 pr-6 text-right">Last Played</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                  {visibleGames.map((game, idx) => (
                    <tr
                      key={game.appid}
                      onClick={() => onSelectGame(game)}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onSelectGame(game);
                        }
                      }}
                      className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 focus-visible:outline-none focus-visible:bg-blue-50/60 dark:focus-visible:bg-blue-950/30 transition-colors"
                    >
                      <td className="py-2 pl-6 pr-3 font-mono tabular-nums text-xs text-slate-400 dark:text-slate-500">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <GameThumbnail game={game} />
                          <div className="min-w-0">
                            <p className="font-medium text-slate-900 dark:text-slate-100 truncate max-w-md">
                              {game.name}
                            </p>
                            <p className="text-xs font-mono text-slate-400 dark:text-slate-500">
                              AppID {game.appid}
                              {game.playtimeDeck > 0 && ` · Deck ${formatHoursDecimal(game.playtimeDeck)}h`}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-2 px-3 text-right font-mono tabular-nums font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        {formatHoursDecimal(game.playtimeForever)} h
                      </td>
                      <td className="py-2 px-3 text-right font-mono tabular-nums text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {formatHoursAndMinutes(game.playtimeForever)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono tabular-nums text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {game.playtime2Weeks > 0 ? `${formatHoursDecimal(game.playtime2Weeks)} h` : '—'}
                      </td>
                      <td className="py-2 px-3 text-right font-mono tabular-nums text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {game.sharePercent.toFixed(1)}%
                      </td>
                      <td className="py-2 pl-3 pr-6 text-right text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {formatLastPlayed(game.rtimeLastPlayed)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Touch-Optimized Tap Rows */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {visibleGames.map((game, idx) => (
                <button
                  key={game.appid}
                  type="button"
                  onClick={() => onSelectGame(game)}
                  className="w-full min-h-[64px] px-4 py-3 flex items-center justify-between gap-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 active:bg-slate-100 dark:active:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <GameThumbnail game={game} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {game.name}
                      </p>
                      <p className="mt-0.5 text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400 truncate">
                        #{idx + 1} · {formatHoursAndMinutes(game.playtimeForever)} · {game.sharePercent.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="font-mono tabular-nums text-sm font-bold text-slate-900 dark:text-slate-100">
                      {formatHoursDecimal(game.playtimeForever)} h
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400" aria-hidden="true" />
                  </div>
                </button>
              ))}
            </div>

            {/* Pagination / Load More */}
            {hasMore && (
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setVisibleLimit((prev) => prev + 100)}
                  className="w-full sm:w-auto min-h-[44px] px-5 py-2 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors"
                >
                  Show 100 More ({(filteredGames.length - visibleLimit).toLocaleString()} remaining)
                </button>
                <button
                  type="button"
                  onClick={() => setVisibleLimit(filteredGames.length)}
                  className="w-full sm:w-auto min-h-[44px] px-5 py-2 text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline underline-offset-2"
                >
                  Show All {filteredGames.length.toLocaleString()}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
