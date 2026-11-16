export function formatHoursDecimal(minutes: number): string {
  const hours = minutes / 60;
  if (hours >= 1000) {
    return hours.toLocaleString('en-US', { maximumFractionDigits: 0 });
  }
  if (hours >= 10) {
    return hours.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  }
  return hours.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

export function formatHoursAndMinutes(minutes: number): string {
  const total = Math.max(0, Math.round(minutes));
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h.toLocaleString('en-US')}h`;
  return `${h.toLocaleString('en-US')}h ${m}m`;
}

export function formatMinutesExact(minutes: number): string {
  return `${Math.max(0, Math.round(minutes)).toLocaleString('en-US')} min`;
}

export function formatLastPlayed(unixSeconds: number): string {
  if (!unixSeconds || unixSeconds <= 0) return 'Never / Unknown';
  const date = new Date(unixSeconds * 1000);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatUnixDate(unixSeconds?: number | null): string | null {
  if (!unixSeconds || unixSeconds <= 0) return null;
  const date = new Date(unixSeconds * 1000);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function detectClientInputHint(value: string): string {
  const v = value.trim();
  if (!v) return 'Accepts Steam URL, SteamID64, SteamID2, SteamID3, or custom handle';
  if (/steamcommunity\.com\/profiles\/7656119\d{10}/i.test(v)) return 'Detected Steam Profile URL';
  if (/steamcommunity\.com\/id\/[a-zA-Z0-9_-]+/i.test(v)) return 'Detected Steam Vanity URL';
  if (/^7656119\d{10}$/.test(v)) return 'Detected SteamID64';
  if (/^STEAM_[01]:[01]:\d+$/i.test(v)) return 'Detected SteamID2';
  if (/^\[?U:1:\d+\]?$/i.test(v)) return 'Detected SteamID3';
  if (/^[a-zA-Z0-9_-]{2,64}$/.test(v)) return 'Detected Custom Vanity Handle';
  return 'Enter a valid Steam URL, SteamID, or custom handle';
}
