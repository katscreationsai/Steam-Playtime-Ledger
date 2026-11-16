import { ExternalLink, Gamepad2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { SteamGame } from '../types/steam.ts';
import {
  formatHoursAndMinutes,
  formatHoursDecimal,
  formatLastPlayed,
  formatMinutesExact,
} from '../utils/formatters.ts';

interface GameDetailSheetProps {
  game: SteamGame | null;
  onClose: () => void;
}

export function GameDetailSheet({ game, onClose }: GameDetailSheetProps) {
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [game?.appid]);

  useEffect(() => {
    if (!game) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [game, onClose]);

  if (!game) return null;

  const platforms = [
    { label: 'Windows', minutes: game.playtimeWindows },
    { label: 'Steam Deck', minutes: game.playtimeDeck },
    { label: 'macOS', minutes: game.playtimeMac },
    { label: 'Linux / SteamOS', minutes: game.playtimeLinux },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="game-detail-title"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-lg bg-white dark:bg-[#131B26] border-t sm:border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Mobile Drag Handle */}
        <div className="sm:hidden pt-3 pb-1 flex justify-center">
          <div className="w-10 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
        </div>

        {/* Game Banner */}
        <div className="relative aspect-[460/215] w-full bg-slate-100 dark:bg-slate-800 shrink-0">
          {!imgFailed ? (
            <img
              src={game.headerUrl}
              alt={`${game.name} Steam artwork`}
              referrerPolicy="no-referrer"
              onError={() => setImgFailed(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-400 dark:text-slate-500">
              <Gamepad2 className="w-10 h-10" aria-hidden="true" />
              <span className="text-xs font-mono">AppID {game.appid}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close game details"
            className="absolute top-3 right-3 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
          <div className="absolute bottom-3 left-4 right-4 text-white">
            <h3
              id="game-detail-title"
              className="font-display text-lg sm:text-xl font-bold truncate"
            >
              {game.name}
            </h3>
            <p className="text-xs font-mono text-white/80">
              AppID {game.appid} · {game.sharePercent.toFixed(2)}% of total account playtime
            </p>
          </div>
        </div>

        {/* Telemetry Details */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0B1117] border border-slate-100 dark:border-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-400">Total Playtime</p>
              <p className="mt-1 font-mono tabular-nums text-xl font-bold text-slate-900 dark:text-slate-100">
                {formatHoursDecimal(game.playtimeForever)} h
              </p>
              <p className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                {formatHoursAndMinutes(game.playtimeForever)} ({formatMinutesExact(game.playtimeForever)})
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0B1117] border border-slate-100 dark:border-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-400">Recent 2 Weeks</p>
              <p className="mt-1 font-mono tabular-nums text-xl font-bold text-slate-900 dark:text-slate-100">
                {formatHoursDecimal(game.playtime2Weeks)} h
              </p>
              <p className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                Last played {formatLastPlayed(game.rtimeLastPlayed)}
              </p>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
              Playtime by Platform
            </h4>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl px-3.5">
              {platforms.map((p) => (
                <div
                  key={p.label}
                  className="py-2.5 flex items-center justify-between text-sm"
                >
                  <span className="text-slate-700 dark:text-slate-300">{p.label}</span>
                  <span className="font-mono tabular-nums text-slate-900 dark:text-slate-100">
                    {formatHoursDecimal(p.minutes)} h{' '}
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      ({p.minutes.toLocaleString()} min)
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sticky Sheet Footer */}
        <div className="p-4 sm:px-6 pb-safe border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <a
            href={game.storeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors"
          >
            <span>View on Steam Store</span>
            <ExternalLink className="w-4 h-4" aria-hidden="true" />
          </a>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
