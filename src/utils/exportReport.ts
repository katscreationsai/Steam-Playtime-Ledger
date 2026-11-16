import type { SteamAnalysisResponse } from '../types/steam.ts';
import { formatHoursAndMinutes, formatHoursDecimal, formatLastPlayed } from './formatters.ts';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function downloadCsvReport(data: SteamAnalysisResponse): void {
  const headers = [
    'Rank',
    'AppID',
    'Game Name',
    'Playtime (Hours)',
    'Playtime (Minutes)',
    'Recent 2 Weeks (Hours)',
    'Share of Total (%)',
    'Windows (Minutes)',
    'macOS (Minutes)',
    'Linux (Minutes)',
    'Steam Deck (Minutes)',
    'Last Played',
  ];

  const rows = data.games.map((g, idx) => [
    idx + 1,
    g.appid,
    `"${g.name.replace(/"/g, '""')}"`,
    (g.playtimeForever / 60).toFixed(2),
    g.playtimeForever,
    (g.playtime2Weeks / 60).toFixed(2),
    g.sharePercent.toFixed(2),
    g.playtimeWindows,
    g.playtimeMac,
    g.playtimeLinux,
    g.playtimeDeck,
    `"${formatLastPlayed(g.rtimeLastPlayed)}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, `steam-playtime-${slugify(data.profile.personaName)}.csv`);
}

export function downloadSingleFileHtml(data: SteamAnalysisResponse): void {
  if (!data.stats) return;
  const { profile, identifiers, stats, games } = data;
  const safeName = escapeHtml(profile.personaName);
  const gamesJson = JSON.stringify(
    games.map((g, index) => ({
      rank: index + 1,
      appid: g.appid,
      name: g.name,
      minutes: g.playtimeForever,
      recentMinutes: g.playtime2Weeks,
      share: g.sharePercent,
      win: g.playtimeWindows,
      mac: g.playtimeMac,
      linux: g.playtimeLinux,
      deck: g.playtimeDeck,
      lastPlayed: formatLastPlayed(g.rtimeLastPlayed),
    }))
  ).replace(/</g, '\\u003c');

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${safeName} — Steam Playtime Ledger</title>
  <style>
    :root {
      color-scheme: light dark;
      --bg: #f6f7f9;
      --surface: #ffffff;
      --border: #e2e8f0;
      --text: #0f172a;
      --muted: #64748b;
      --accent: #1a65d6;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #0b1117;
        --surface: #131b26;
        --border: #1e293b;
        --text: #f1f5f9;
        --muted: #94a3b8;
        --accent: #3b82f6;
      }
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.5;
      padding: 20px 16px 48px;
    }
    .container { max-width: 1080px; margin: 0 auto; }
    .card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 16px;
    }
    .header { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 16px; align-items: center; }
    h1 { margin: 0 0 4px; font-size: 1.5rem; }
    .meta { color: var(--muted); font-size: 0.875rem; font-family: ui-monospace, monospace; }
    .kpis {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
      gap: 12px;
      margin-bottom: 16px;
    }
    .kpi { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 14px 16px; }
    .kpi-label { font-size: 0.75rem; color: var(--muted); margin-bottom: 4px; }
    .kpi-value { font-size: 1.5rem; font-weight: 700; font-variant-numeric: tabular-nums; font-family: ui-monospace, monospace; }
    .kpi-sub { font-size: 0.75rem; color: var(--muted); margin-top: 2px; }
    .toolbar { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 12px; }
    input, select {
      background: var(--surface);
      color: var(--text);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 10px 12px;
      font-size: 0.875rem;
      min-height: 44px;
    }
    input { flex: 1 1 240px; }
    table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
    th, td { padding: 10px 12px; border-bottom: 1px solid var(--border); text-align: left; }
    th { font-size: 0.75rem; color: var(--muted); font-weight: 600; }
    .num { text-align: right; font-family: ui-monospace, monospace; font-variant-numeric: tabular-nums; white-space: nowrap; }
    .table-wrap { overflow-x: auto; }
    a { color: var(--accent); text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card header">
      <div>
        <h1>${safeName} — Steam Playtime Report</h1>
        <div class="meta">SteamID64 ${escapeHtml(identifiers.steamId64)} · ${escapeHtml(identifiers.steamId2)} · Generated ${escapeHtml(new Date(data.generatedAt).toLocaleString())}</div>
      </div>
      <div class="meta">${stats.playedGamesCount} played / ${stats.totalGamesOwned} owned</div>
    </div>

    <div class="kpis">
      <div class="kpi">
        <div class="kpi-label">Total Playtime</div>
        <div class="kpi-value">${formatHoursDecimal(stats.totalMinutes)} h</div>
        <div class="kpi-sub">${stats.totalDays} days (${formatHoursAndMinutes(stats.totalMinutes)})</div>
      </div>
      <div class="kpi">
        <div class="kpi-label">Played Games</div>
        <div class="kpi-value">${stats.playedGamesCount.toLocaleString()}</div>
        <div class="kpi-sub">${stats.playedPercentage}% of ${stats.totalGamesOwned.toLocaleString()} owned</div>
      </div>
      <div class="kpi">
        <div class="kpi-label">Last 2 Weeks</div>
        <div class="kpi-value">${formatHoursDecimal(stats.recent2WeeksMinutes)} h</div>
        <div class="kpi-sub">${formatHoursAndMinutes(stats.recent2WeeksMinutes)}</div>
      </div>
      <div class="kpi">
        <div class="kpi-label">Average / Played</div>
        <div class="kpi-value">${formatHoursDecimal(stats.averageMinutesPerPlayedGame)} h</div>
        <div class="kpi-sub">Median ${formatHoursDecimal(stats.medianMinutesPerPlayedGame)} h</div>
      </div>
    </div>

    <div class="card">
      <div class="toolbar">
        <input id="q" type="search" placeholder="Filter ${games.length.toLocaleString()} games by title or AppID..." />
        <select id="filter">
          <option value="all">All Games</option>
          <option value="played">Played Only</option>
          <option value="unplayed">Unplayed (0h)</option>
        </select>
        <select id="sort">
          <option value="time-desc">Most Played</option>
          <option value="time-asc">Least Played</option>
          <option value="name-asc">Name A–Z</option>
        </select>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Title</th>
              <th class="num">Total Hours</th>
              <th class="num">Minutes</th>
              <th class="num">2 Weeks</th>
              <th class="num">Share</th>
              <th>Last Played</th>
            </tr>
          </thead>
          <tbody id="rows"></tbody>
        </table>
      </div>
    </div>
  </div>
  <script>
    const GAMES = ${gamesJson};
    const qEl = document.getElementById('q');
    const filterEl = document.getElementById('filter');
    const sortEl = document.getElementById('sort');
    const rowsEl = document.getElementById('rows');

    function esc(s) {
      return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
    }

    function render() {
      const q = qEl.value.trim().toLowerCase();
      const f = filterEl.value;
      const s = sortEl.value;

      let list = GAMES.filter(g => {
        if (f === 'played' && g.minutes <= 0) return false;
        if (f === 'unplayed' && g.minutes > 0) return false;
        if (q && !g.name.toLowerCase().includes(q) && !String(g.appid).includes(q)) return false;
        return true;
      });

      if (s === 'time-desc') list.sort((a,b) => b.minutes - a.minutes);
      else if (s === 'time-asc') list.sort((a,b) => a.minutes - b.minutes);
      else if (s === 'name-asc') list.sort((a,b) => a.name.localeCompare(b.name));

      rowsEl.innerHTML = list.map(g => \`
        <tr>
          <td class="num">\${g.rank}</td>
          <td><a href="https://store.steampowered.com/app/\${g.appid}/" target="_blank" rel="noopener">\${esc(g.name)}</a></td>
          <td class="num">\${(g.minutes / 60).toFixed(1)} h</td>
          <td class="num">\${g.minutes.toLocaleString()}</td>
          <td class="num">\${g.recentMinutes > 0 ? (g.recentMinutes / 60).toFixed(1) + ' h' : '—'}</td>
          <td class="num">\${g.share.toFixed(2)}%</td>
          <td>\${esc(g.lastPlayed)}</td>
        </tr>
      \`).join('');
    }

    qEl.addEventListener('input', render);
    filterEl.addEventListener('change', render);
    sortEl.addEventListener('change', render);
    render();
  </script>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
  triggerDownload(blob, `steam-playtime-${slugify(profile.personaName)}.html`);
}

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'profile'
  );
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
