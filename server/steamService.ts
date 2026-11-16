import type {
  IdentifierFormat,
  PlatformBreakdown,
  PlaytimeBracket,
  PlaytimeStats,
  SteamAnalysisResponse,
  SteamGame,
  SteamIdentifiers,
  SteamProfile,
} from '../src/types/steam.ts';

const STEAM_ID64_BASE = 76561197960265728n;

export interface ParsedSteamInput {
  raw: string;
  format: IdentifierFormat;
  steamId64?: string;
  vanityName?: string;
}

export function deriveSteamIdentifiers(
  steamId64: string,
  rawInput: string,
  format: IdentifierFormat,
  vanityName?: string
): SteamIdentifiers {
  const id64 = BigInt(steamId64);
  const accountIdBig = id64 - STEAM_ID64_BASE;
  const y = accountIdBig % 2n;
  const z = (accountIdBig - y) / 2n;

  return {
    input: rawInput,
    detectedFormat: format,
    steamId64,
    steamId2: `STEAM_0:${y.toString()}:${z.toString()}`,
    steamId3: `[U:1:${accountIdBig.toString()}]`,
    accountId: accountIdBig.toString(),
    profileUrl: `https://steamcommunity.com/profiles/${steamId64}`,
    vanityName,
  };
}

export function parseSteamInput(rawInput: string): ParsedSteamInput {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    throw new Error('Please enter a Steam profile URL, SteamID, or custom handle.');
  }

  // Match full Steam profile URL with numeric SteamID64
  const profileUrlMatch = trimmed.match(
    /(?:https?:\/\/)?(?:www\.)?steamcommunity\.com\/profiles\/(7656119\d{10})(?:[/?#].*)?$/i
  );
  if (profileUrlMatch) {
    return {
      raw: trimmed,
      format: 'profile_url',
      steamId64: profileUrlMatch[1],
    };
  }

  // Match full Steam vanity URL
  const vanityUrlMatch = trimmed.match(
    /(?:https?:\/\/)?(?:www\.)?steamcommunity\.com\/id\/([a-zA-Z0-9_-]{2,64})(?:[/?#].*)?$/i
  );
  if (vanityUrlMatch) {
    return {
      raw: trimmed,
      format: 'vanity_url',
      vanityName: vanityUrlMatch[1],
    };
  }

  // Match raw SteamID64 (17 digits starting with 7656119)
  if (/^7656119\d{10}$/.test(trimmed)) {
    return {
      raw: trimmed,
      format: 'steamid64',
      steamId64: trimmed,
    };
  }

  // Match SteamID2: STEAM_0:0:11101 or STEAM_1:1:11101
  const steam2Match = trimmed.match(/^STEAM_[01]:([01]):(\d+)$/i);
  if (steam2Match) {
    const y = BigInt(steam2Match[1]);
    const z = BigInt(steam2Match[2]);
    const id64 = STEAM_ID64_BASE + z * 2n + y;
    return {
      raw: trimmed,
      format: 'steamid2',
      steamId64: id64.toString(),
    };
  }

  // Match SteamID3: [U:1:22202] or U:1:22202
  const steam3Match = trimmed.match(/^\[?U:1:(\d+)\]?$/i);
  if (steam3Match) {
    const accountId = BigInt(steam3Match[1]);
    const id64 = STEAM_ID64_BASE + accountId;
    return {
      raw: trimmed,
      format: 'steamid3',
      steamId64: id64.toString(),
    };
  }

  // Treat clean alphanumeric/underscore/hyphen handle as custom vanity URL name
  if (/^[a-zA-Z0-9_-]{2,64}$/.test(trimmed)) {
    return {
      raw: trimmed,
      format: 'vanity_name',
      vanityName: trimmed,
    };
  }

  throw new Error(
    'Unrecognized Steam identifier. Enter a Steam URL (steamcommunity.com/id/... or /profiles/...), SteamID64, SteamID2, SteamID3, or vanity handle.'
  );
}

function extractXmlTag(xml: string, tag: string): string | undefined {
  const regex = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const match = xml.match(regex);
  if (!match) return undefined;
  let value = match[1].trim();
  const cdataMatch = value.match(/^<!\[CDATA\[([\s\S]*?)\]\]>$/);
  if (cdataMatch) {
    value = cdataMatch[1];
  }
  return value || undefined;
}

async function fetchPublicXmlProfile(
  vanityOrId: { steamId64?: string; vanityName?: string }
): Promise<{ profile: SteamProfile; steamId64: string; vanityName?: string } | null> {
  const targetUrl = vanityOrId.steamId64
    ? `https://steamcommunity.com/profiles/${encodeURIComponent(vanityOrId.steamId64)}/?xml=1`
    : `https://steamcommunity.com/id/${encodeURIComponent(vanityOrId.vanityName || '')}/?xml=1`;

  const response = await fetch(targetUrl, {
    headers: { 'User-Agent': 'PlaytimeLedger/1.0' },
  });
  if (!response.ok) return null;
  const text = await response.text();
  if (!text.includes('<profile>')) return null;

  const steamId64 = extractXmlTag(text, 'steamID64');
  if (!steamId64 || !/^7656119\d{10}$/.test(steamId64)) return null;

  const personaName = extractXmlTag(text, 'steamID') || steamId64;
  const avatarUrl =
    extractXmlTag(text, 'avatarFull') ||
    extractXmlTag(text, 'avatarMedium') ||
    extractXmlTag(text, 'avatarIcon') ||
    '';
  const privacyRaw = (extractXmlTag(text, 'privacyState') || 'unknown').toLowerCase();
  const visibilityState: SteamProfile['visibilityState'] =
    privacyRaw === 'public'
      ? 'public'
      : privacyRaw === 'friendsonly'
        ? 'friendsonly'
        : privacyRaw === 'private'
          ? 'private'
          : 'unknown';

  const customUrl = extractXmlTag(text, 'customURL') || vanityOrId.vanityName;
  const memberSince = extractXmlTag(text, 'memberSince');
  const location = extractXmlTag(text, 'location');
  const realName = extractXmlTag(text, 'realname');

  return {
    steamId64,
    vanityName: customUrl,
    profile: {
      steamId64,
      personaName,
      realName,
      avatarUrl,
      profileUrl: customUrl
        ? `https://steamcommunity.com/id/${customUrl}`
        : `https://steamcommunity.com/profiles/${steamId64}`,
      visibilityState,
      steamLevel: null,
      location,
      memberSince,
    },
  };
}

export interface RawSteamGame {
  appid: number;
  name?: string;
  playtime_forever?: number;
  playtime_2weeks?: number;
  playtime_windows_forever?: number;
  playtime_mac_forever?: number;
  playtime_linux_forever?: number;
  playtime_deck_forever?: number;
  rtime_last_played?: number;
  img_icon_url?: string;
}

export function buildPlaytimeAnalytics(rawGames: RawSteamGame[]): {
  games: SteamGame[];
  stats: PlaytimeStats;
} {
  const totalMinutes = rawGames.reduce((acc, g) => acc + (Number(g.playtime_forever) || 0), 0);
  const recent2WeeksMinutes = rawGames.reduce(
    (acc, g) => acc + (Number(g.playtime_2weeks) || 0),
    0
  );

  const normalizedGames: SteamGame[] = rawGames
    .map((g) => {
      const appid = Number(g.appid);
      const playtimeForever = Math.max(0, Number(g.playtime_forever) || 0);
      const playtime2Weeks = Math.max(0, Number(g.playtime_2weeks) || 0);
      const playtimeWindows = Math.max(0, Number(g.playtime_windows_forever) || 0);
      const playtimeMac = Math.max(0, Number(g.playtime_mac_forever) || 0);
      const playtimeLinux = Math.max(0, Number(g.playtime_linux_forever) || 0);
      const playtimeDeck = Math.max(0, Number(g.playtime_deck_forever) || 0);
      const rtimeLastPlayed = Math.max(0, Number(g.rtime_last_played) || 0);
      const iconHash = typeof g.img_icon_url === 'string' && g.img_icon_url.trim() ? g.img_icon_url.trim() : null;

      return {
        appid,
        name: g.name?.trim() || `Steam App ${appid}`,
        playtimeForever,
        playtime2Weeks,
        playtimeWindows,
        playtimeMac,
        playtimeLinux,
        playtimeDeck,
        rtimeLastPlayed,
        iconUrl: iconHash
          ? `https://media.steampowered.com/steamcommunity/public/images/apps/${appid}/${iconHash}.jpg`
          : null,
        headerUrl: `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${appid}/header.jpg`,
        storeUrl: `https://store.steampowered.com/app/${appid}/`,
        sharePercent: totalMinutes > 0 ? Number(((playtimeForever / totalMinutes) * 100).toFixed(2)) : 0,
      };
    })
    .sort((a, b) => b.playtimeForever - a.playtimeForever || a.name.localeCompare(b.name));

  const playedGames = normalizedGames.filter((g) => g.playtimeForever > 0);
  const playedGamesCount = playedGames.length;
  const totalGamesOwned = normalizedGames.length;
  const unplayedGamesCount = totalGamesOwned - playedGamesCount;
  const playedPercentage =
    totalGamesOwned > 0 ? Number(((playedGamesCount / totalGamesOwned) * 100).toFixed(1)) : 0;

  const averageMinutesPerPlayedGame =
    playedGamesCount > 0 ? Math.round(totalMinutes / playedGamesCount) : 0;
  const averageMinutesPerOwnedGame =
    totalGamesOwned > 0 ? Math.round(totalMinutes / totalGamesOwned) : 0;

  let medianMinutesPerPlayedGame = 0;
  if (playedGamesCount > 0) {
    const sortedAsc = [...playedGames].sort((a, b) => a.playtimeForever - b.playtimeForever);
    const mid = Math.floor(sortedAsc.length / 2);
    medianMinutesPerPlayedGame =
      sortedAsc.length % 2 === 0
        ? Math.round((sortedAsc[mid - 1].playtimeForever + sortedAsc[mid].playtimeForever) / 2)
        : sortedAsc[mid].playtimeForever;
  }

  const sumTop = (n: number) =>
    normalizedGames.slice(0, n).reduce((acc, g) => acc + g.playtimeForever, 0);

  const top1SharePercent =
    totalMinutes > 0 ? Number(((sumTop(1) / totalMinutes) * 100).toFixed(1)) : 0;
  const top3SharePercent =
    totalMinutes > 0 ? Number(((sumTop(3) / totalMinutes) * 100).toFixed(1)) : 0;
  const top10SharePercent =
    totalMinutes > 0 ? Number(((sumTop(10) / totalMinutes) * 100).toFixed(1)) : 0;

  let windowsMinutes = 0;
  let macMinutes = 0;
  let linuxMinutes = 0;
  let deckMinutes = 0;
  let untrackedMinutes = 0;

  for (const g of normalizedGames) {
    windowsMinutes += g.playtimeWindows;
    macMinutes += g.playtimeMac;
    linuxMinutes += g.playtimeLinux;
    deckMinutes += g.playtimeDeck;
    const trackedSum = g.playtimeWindows + g.playtimeMac + g.playtimeLinux;
    if (g.playtimeForever > trackedSum) {
      untrackedMinutes += g.playtimeForever - trackedSum;
    }
  }

  const platformTotals: PlatformBreakdown = {
    windowsMinutes,
    macMinutes,
    linuxMinutes,
    deckMinutes,
    untrackedMinutes,
    totalMinutes,
  };

  const bracketDefs: Array<{
    id: PlaytimeBracket['id'];
    label: string;
    minMinutes: number;
    maxMinutes: number | null;
    match: (mins: number) => boolean;
  }> = [
    {
      id: '1000plus',
      label: '1,000h+',
      minMinutes: 60000,
      maxMinutes: null,
      match: (m) => m >= 60000,
    },
    {
      id: '100to999',
      label: '100–999h',
      minMinutes: 6000,
      maxMinutes: 59999,
      match: (m) => m >= 6000 && m < 60000,
    },
    {
      id: '20to99',
      label: '20–99h',
      minMinutes: 1200,
      maxMinutes: 5999,
      match: (m) => m >= 1200 && m < 6000,
    },
    {
      id: '5to19',
      label: '5–19h',
      minMinutes: 300,
      maxMinutes: 1199,
      match: (m) => m >= 300 && m < 1200,
    },
    {
      id: 'under5',
      label: 'Under 5h',
      minMinutes: 1,
      maxMinutes: 299,
      match: (m) => m > 0 && m < 300,
    },
    {
      id: 'unplayed',
      label: 'Unplayed (0h)',
      minMinutes: 0,
      maxMinutes: 0,
      match: (m) => m === 0,
    },
  ];

  const brackets: PlaytimeBracket[] = bracketDefs.map((def) => {
    const matching = normalizedGames.filter((g) => def.match(g.playtimeForever));
    const bucketMinutes = matching.reduce((acc, g) => acc + g.playtimeForever, 0);
    return {
      id: def.id,
      label: def.label,
      minMinutes: def.minMinutes,
      maxMinutes: def.maxMinutes,
      gameCount: matching.length,
      totalMinutes: bucketMinutes,
      shareOfGamesPercent:
        totalGamesOwned > 0 ? Number(((matching.length / totalGamesOwned) * 100).toFixed(1)) : 0,
      shareOfTimePercent:
        totalMinutes > 0 ? Number(((bucketMinutes / totalMinutes) * 100).toFixed(1)) : 0,
    };
  });

  const totalHours = Number((totalMinutes / 60).toFixed(1));
  const totalDays = Number((totalMinutes / 1440).toFixed(1));
  const totalWeeks = Number((totalMinutes / 10080).toFixed(2));
  const totalYearsEquivalent = Number((totalMinutes / 525600).toFixed(3));

  return {
    games: normalizedGames,
    stats: {
      totalMinutes,
      totalHours,
      totalDays,
      totalWeeks,
      totalYearsEquivalent,
      recent2WeeksMinutes,
      recent2WeeksHours: Number((recent2WeeksMinutes / 60).toFixed(1)),
      totalGamesOwned,
      playedGamesCount,
      unplayedGamesCount,
      playedPercentage,
      averageMinutesPerPlayedGame,
      averageMinutesPerOwnedGame,
      medianMinutesPerPlayedGame,
      top1SharePercent,
      top3SharePercent,
      top10SharePercent,
      platformTotals,
      brackets,
    },
  };
}

export async function analyzeSteamPlaytime(
  rawInput: string,
  apiKey: string | undefined
): Promise<SteamAnalysisResponse> {
  const parsed = parseSteamInput(rawInput);

  // If STEAM_API_KEY is missing, resolve public XML profile so user still gets ID conversion & profile metadata
  if (!apiKey || !apiKey.trim()) {
    const xmlResult = await fetchPublicXmlProfile({
      steamId64: parsed.steamId64,
      vanityName: parsed.vanityName,
    });

    if (!xmlResult && !parsed.steamId64) {
      throw new Error(
        `Could not resolve vanity handle "${parsed.vanityName}" without a Steam Web API key. Verify the custom URL or configure STEAM_API_KEY on the server.`
      );
    }

    const steamId64 = xmlResult?.steamId64 || parsed.steamId64!;
    const vanityName = xmlResult?.vanityName || parsed.vanityName;
    const identifiers = deriveSteamIdentifiers(steamId64, parsed.raw, parsed.format, vanityName);

    const profile: SteamProfile = xmlResult?.profile || {
      steamId64,
      personaName: vanityName || steamId64,
      avatarUrl: '',
      profileUrl: identifiers.profileUrl,
      visibilityState: 'unknown',
      steamLevel: null,
    };

    return {
      status: 'missing_api_key',
      source: 'public_xml_only',
      message:
        'STEAM_API_KEY is not configured on the server. Profile identifiers were resolved, but fetching the full game library from api.steampowered.com requires STEAM_API_KEY in server environment secrets (or use Import Steam JSON).',
      identifiers,
      profile,
      stats: null,
      games: [],
      generatedAt: new Date().toISOString(),
    };
  }

  const trimmedKey = apiKey.trim();
  let steamId64 = parsed.steamId64;
  const vanityName = parsed.vanityName;

  if (!steamId64 && vanityName) {
    const resolveUrl = `https://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key=${encodeURIComponent(
      trimmedKey
    )}&vanityurl=${encodeURIComponent(vanityName)}`;
    const res = await fetch(resolveUrl);
    if (res.status === 403) {
      throw new Error('Steam Web API rejected the configured STEAM_API_KEY (403 Forbidden).');
    }
    if (!res.ok) {
      throw new Error(`Steam ResolveVanityURL failed with HTTP ${res.status}.`);
    }
    const data = (await res.json()) as {
      response?: { success?: number; steamid?: string; message?: string };
    };
    if (data.response?.success !== 1 || !data.response.steamid) {
      throw new Error(
        `No Steam profile found for vanity handle "${vanityName}". Check spelling or enter a numeric SteamID64.`
      );
    }
    steamId64 = data.response.steamid;
  }

  if (!steamId64) {
    throw new Error('Unable to determine SteamID64.');
  }

  const identifiers = deriveSteamIdentifiers(steamId64, parsed.raw, parsed.format, vanityName);

  // Fetch PlayerSummaries, SteamLevel, OwnedGames, and RecentlyPlayedGames in parallel
  const summaryUrl = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${encodeURIComponent(
    trimmedKey
  )}&steamids=${encodeURIComponent(steamId64)}`;
  const levelUrl = `https://api.steampowered.com/IPlayerService/GetSteamLevel/v1/?key=${encodeURIComponent(
    trimmedKey
  )}&steamid=${encodeURIComponent(steamId64)}`;
  const ownedUrl = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${encodeURIComponent(
    trimmedKey
  )}&steamid=${encodeURIComponent(
    steamId64
  )}&include_appinfo=1&include_played_free_games=1&format=json`;
  const recentUrl = `https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v0001/?key=${encodeURIComponent(
    trimmedKey
  )}&steamid=${encodeURIComponent(steamId64)}&format=json`;

  const [summaryRes, levelRes, ownedRes, recentRes] = await Promise.all([
    fetch(summaryUrl),
    fetch(levelUrl),
    fetch(ownedUrl),
    fetch(recentUrl),
  ]);

  if (summaryRes.status === 403 || ownedRes.status === 403) {
    throw new Error('Steam Web API rejected the configured STEAM_API_KEY (403 Forbidden).');
  }

  if (!summaryRes.ok) {
    throw new Error(`Steam GetPlayerSummaries failed with HTTP ${summaryRes.status}.`);
  }

  const summaryJson = (await summaryRes.json()) as {
    response?: {
      players?: Array<{
        steamid: string;
        personaname: string;
        realname?: string;
        avatarfull?: string;
        avatarmedium?: string;
        profileurl?: string;
        communityvisibilitystate?: number;
        loccountrycode?: string;
        timecreated?: number;
        lastlogoff?: number;
        personastate?: number;
      }>;
    };
  };

  const player = summaryJson.response?.players?.[0];
  if (!player) {
    throw new Error(`Steam profile ${steamId64} was not found.`);
  }

  let steamLevel: number | null = null;
  if (levelRes.ok) {
    const levelJson = (await levelRes.json()) as { response?: { player_level?: number } };
    if (typeof levelJson.response?.player_level === 'number') {
      steamLevel = levelJson.response.player_level;
    }
  }

  const visibilityState: SteamProfile['visibilityState'] =
    player.communityvisibilitystate === 3
      ? 'public'
      : player.communityvisibilitystate === 2
        ? 'friendsonly'
        : player.communityvisibilitystate === 1
          ? 'private'
          : 'unknown';

  const profile: SteamProfile = {
    steamId64,
    personaName: player.personaname || steamId64,
    realName: player.realname,
    avatarUrl: player.avatarfull || player.avatarmedium || '',
    profileUrl: player.profileurl || identifiers.profileUrl,
    visibilityState,
    steamLevel,
    countryCode: player.loccountrycode,
    timeCreated: player.timecreated ?? null,
    lastLogoff: player.lastlogoff ?? null,
    personaState: player.personastate ?? null,
  };

  const ownedJson = ownedRes.ok
    ? ((await ownedRes.json()) as {
        response?: { game_count?: number; games?: RawSteamGame[] };
      })
    : { response: undefined };

  const recentJson = recentRes.ok
    ? ((await recentRes.json()) as {
        response?: { total_count?: number; games?: RawSteamGame[] };
      })
    : { response: undefined };

  const ownedGames = ownedJson.response?.games;

  if (!ownedGames || (ownedGames.length === 0 && ownedJson.response?.game_count === undefined)) {
    return {
      status: 'private_games',
      source: 'steam_web_api',
      message:
        'This Steam account has Game Details set to Private or Friends-Only. Steam hides owned games and playtime until Privacy Settings → My Profile → Game details is set to Public.',
      identifiers,
      profile,
      stats: null,
      games: [],
      generatedAt: new Date().toISOString(),
    };
  }

  // Merge any 2-week stats or recent F2P titles not present in ownedGames
  const byAppId = new Map<number, RawSteamGame>();
  for (const g of ownedGames) {
    byAppId.set(Number(g.appid), g);
  }
  for (const rg of recentJson.response?.games || []) {
    const existing = byAppId.get(Number(rg.appid));
    if (!existing) {
      byAppId.set(Number(rg.appid), rg);
    } else if (!existing.playtime_2weeks && rg.playtime_2weeks) {
      existing.playtime_2weeks = rg.playtime_2weeks;
    }
  }

  const { games, stats } = buildPlaytimeAnalytics(Array.from(byAppId.values()));

  return {
    status: 'ok',
    source: 'steam_web_api',
    identifiers,
    profile,
    stats,
    games,
    generatedAt: new Date().toISOString(),
  };
}

export function analyzeImportedGamesJson(
  payload: unknown,
  label = 'Imported Steam Library'
): SteamAnalysisResponse {
  let rawGames: RawSteamGame[] | null = null;

  if (Array.isArray(payload)) {
    rawGames = payload as RawSteamGame[];
  } else if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;
    if (obj.response && typeof obj.response === 'object') {
      const resp = obj.response as Record<string, unknown>;
      if (Array.isArray(resp.games)) {
        rawGames = resp.games as RawSteamGame[];
      }
    } else if (Array.isArray(obj.games)) {
      rawGames = obj.games as RawSteamGame[];
    }
  }

  if (!rawGames) {
    throw new Error(
      'Invalid JSON structure. Expected Steam GetOwnedGames JSON ({ "response": { "games": [...] } }) or a games array.'
    );
  }

  const validGames = rawGames.filter(
    (g) => g && typeof g === 'object' && typeof g.appid === 'number'
  );

  if (validGames.length === 0) {
    throw new Error('No valid Steam game records with numeric appid were found in the JSON.');
  }

  const { games, stats } = buildPlaytimeAnalytics(validGames);
  const placeholderId = '76561197960265728';

  return {
    status: 'ok',
    source: 'imported_json',
    identifiers: {
      input: label,
      detectedFormat: 'steamid64',
      steamId64: placeholderId,
      steamId2: 'STEAM_0:0:0',
      steamId3: '[U:1:0]',
      accountId: '0',
      profileUrl: 'https://steamcommunity.com',
    },
    profile: {
      steamId64: placeholderId,
      personaName: label,
      avatarUrl: '',
      profileUrl: 'https://steamcommunity.com',
      visibilityState: 'public',
      steamLevel: null,
    },
    stats,
    games,
    generatedAt: new Date().toISOString(),
  };
}
