import { Check, Copy, ExternalLink, Gamepad2 } from 'lucide-react';
import { useState } from 'react';
import type { SteamAnalysisResponse } from '../types/steam.ts';
import {
  formatHoursAndMinutes,
  formatHoursDecimal,
  formatUnixDate,
} from '../utils/formatters.ts';

interface ProfileSummaryCardProps {
  data: SteamAnalysisResponse;
}

export function ProfileSummaryCard({ data }: ProfileSummaryCardProps) {
  const { profile, identifiers, stats } = data;
  const [copiedId, setCopiedId] = useState(false);

  const memberSinceText =
    profile.memberSince || formatUnixDate(profile.timeCreated);

  const visibilityLabel =
    profile.visibilityState === 'public'
      ? 'Public Profile'
      : profile.visibilityState === 'friendsonly'
        ? 'Friends-Only Profile'
        : profile.visibilityState === 'private'
          ? 'Private Profile'
          : 'Profile Visibility Unknown';

  const handleCopyId64 = async () => {
    try {
      await navigator.clipboard.writeText(identifiers.steamId64);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 1800);
    } catch {
      // Clipboard blocked in restricted contexts
    }
  };

  return (
    <section id="overview" className="pb-4 sm:pb-6">
      <div className="bg-white dark:bg-[#131B26] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
        {/* Profile Header Row */}
        <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-4 min-w-0">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={`${profile.personaName} Steam avatar`}
                referrerPolicy="no-referrer"
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0 bg-slate-100 dark:bg-slate-800"
              />
            ) : (
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                <Gamepad2
                  className="w-7 h-7 text-slate-400 dark:text-slate-500"
                  aria-hidden="true"
                />
              </div>
            )}

            <div className="min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 truncate">
                  {profile.personaName}
                </h2>
              </div>

              {/* Unboxed metadata with typographic separators */}
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                <span
                  className={
                    profile.visibilityState === 'public'
                      ? 'text-emerald-700 dark:text-emerald-400 font-medium'
                      : profile.visibilityState === 'private' ||
                          profile.visibilityState === 'friendsonly'
                        ? 'text-amber-700 dark:text-amber-400 font-medium'
                        : ''
                  }
                >
                  {visibilityLabel}
                </span>
                {profile.steamLevel !== null && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">
                      Level {profile.steamLevel}
                    </span>
                  </>
                )}
                {memberSinceText && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>Joined {memberSinceText}</span>
                  </>
                )}
                {(profile.countryCode || profile.location) && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="truncate max-w-[200px]">
                      {profile.location || profile.countryCode}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopyId64}
              className="inline-flex items-center gap-1.5 min-h-[44px] px-3.5 py-2 text-xs font-mono text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors whitespace-nowrap"
            >
              {copiedId ? (
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" aria-hidden="true" />
              )}
              <span>{copiedId ? 'Copied ID64' : identifiers.steamId64}</span>
            </button>

            <a
              href={profile.profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open Steam profile in new tab"
              className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] px-3 py-2 text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors"
            >
              <ExternalLink className="w-4 h-4" aria-hidden="true" />
            </a>
          </div>
        </div>

        {/* 4-Column KPI Strip */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 sm:divide-x divide-slate-100 dark:divide-slate-800">
            <div className="p-4 sm:p-6">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Total Playtime
              </p>
              <p className="mt-1 font-mono tabular-nums text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
                {formatHoursDecimal(stats.totalMinutes)} h
              </p>
              <p className="mt-1 text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                {stats.totalDays.toLocaleString()} days ·{' '}
                {stats.totalMinutes.toLocaleString()} min
              </p>
            </div>

            <div className="p-4 sm:p-6 border-l border-slate-100 dark:border-slate-800 sm:border-l-0">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Played Games
              </p>
              <p className="mt-1 font-mono tabular-nums text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
                {stats.playedGamesCount.toLocaleString()}
                <span className="text-base sm:text-lg font-normal text-slate-400 dark:text-slate-500">
                  {' '}
                  / {stats.totalGamesOwned.toLocaleString()}
                </span>
              </p>
              <p className="mt-1 text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                {stats.playedPercentage}% touched ·{' '}
                {stats.unplayedGamesCount.toLocaleString()} unplayed
              </p>
            </div>

            <div className="p-4 sm:p-6">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Last 2 Weeks
              </p>
              <p className="mt-1 font-mono tabular-nums text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
                {formatHoursDecimal(stats.recent2WeeksMinutes)} h
              </p>
              <p className="mt-1 text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                {formatHoursAndMinutes(stats.recent2WeeksMinutes)} recent
              </p>
            </div>

            <div className="p-4 sm:p-6 border-l border-slate-100 dark:border-slate-800 sm:border-l-0">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Average / Played
              </p>
              <p className="mt-1 font-mono tabular-nums text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
                {formatHoursDecimal(stats.averageMinutesPerPlayedGame)} h
              </p>
              <p className="mt-1 text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                Median {formatHoursDecimal(stats.medianMinutesPerPlayedGame)} h
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
