import { Check, Copy } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { SteamIdentifiers } from '../types/steam.ts';

interface IdConverterSectionProps {
  activeIdentifiers: SteamIdentifiers | null;
}

export function IdConverterSection({ activeIdentifiers }: IdConverterSectionProps) {
  const [input, setInput] = useState('');
  const [converted, setConverted] = useState<SteamIdentifiers | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (activeIdentifiers && activeIdentifiers.accountId !== '0') {
      setConverted(activeIdentifiers);
      setInput(activeIdentifiers.steamId64);
      setError(null);
    }
  }, [activeIdentifiers]);

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmed = input.trim();
    if (!trimmed) return;

    try {
      const res = await fetch(`/api/steam/convert-id?query=${encodeURIComponent(trimmed)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Unable to convert identifier.');
        return;
      }
      if (!data.identifiers) {
        setError(
          'Enter a numeric SteamID64, SteamID2 (STEAM_0:x:y), SteamID3 ([U:1:x]), or /profiles/ URL to convert locally, or use Calculate Playtime above for vanity URLs.'
        );
        return;
      }
      setConverted(data.identifiers);
    } catch {
      setError('Failed to connect to the conversion service.');
    }
  };

  const handleCopy = async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1600);
    } catch {
      // Clipboard API unavailable
    }
  };

  const rows = converted
    ? [
        { key: 'id64', label: 'SteamID64', value: converted.steamId64 },
        { key: 'id2', label: 'SteamID2', value: converted.steamId2 },
        { key: 'id3', label: 'SteamID3', value: converted.steamId3 },
        { key: 'account', label: 'Account ID', value: converted.accountId },
        { key: 'url', label: 'Profile Permalink', value: converted.profileUrl },
      ]
    : [];

  return (
    <section id="identifiers" className="pb-8">
      <div className="bg-white dark:bg-[#131B26] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-display text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100">
              Steam ID Format Converter
            </h3>
            <p className="mt-0.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Convert seamlessly between SteamID64, SteamID2 (STEAM_0:x:y), SteamID3 ([U:1:x]), and profile permalinks.
            </p>
          </div>

          <form onSubmit={handleConvert} className="flex items-center gap-2 w-full md:w-auto md:min-w-[360px]">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="STEAM_0:0:84901 or [U:1:169802]"
              aria-label="Steam ID to convert"
              className="flex-1 min-w-0 min-h-[44px] px-3 py-2 text-xs sm:text-sm font-mono bg-slate-50 dark:bg-[#0B1117] text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <button
              type="submit"
              className="min-h-[44px] px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white rounded-xl transition-colors whitespace-nowrap shrink-0"
            >
              Convert
            </button>
          </form>
        </div>

        {error && (
          <p className="mt-3 text-xs text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        )}

        {converted && (
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {rows.map((row) => (
              <div
                key={row.key}
                className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0B1117] border border-slate-100 dark:border-slate-800 min-w-0"
              >
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    {row.label}
                  </p>
                  <p className="mt-0.5 text-xs sm:text-sm font-mono text-slate-900 dark:text-slate-100 truncate">
                    {row.value}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(row.key, row.value)}
                  aria-label={`Copy ${row.label}`}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 rounded-lg shrink-0 transition-colors"
                >
                  {copiedKey === row.key ? (
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
