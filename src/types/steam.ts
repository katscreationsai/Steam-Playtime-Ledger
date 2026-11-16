export type IdentifierFormat =
  | 'steamid64'
  | 'steamid2'
  | 'steamid3'
  | 'profile_url'
  | 'vanity_url'
  | 'vanity_name';

export interface SteamIdentifiers {
  input: string;
  detectedFormat: IdentifierFormat;
  steamId64: string;
  steamId2: string;
  steamId3: string;
  accountId: string;
  profileUrl: string;
  vanityName?: string;
}

export interface SteamProfile {
  steamId64: string;
  personaName: string;
  realName?: string;
  avatarUrl: string;
  profileUrl: string;
  visibilityState: 'public' | 'private' | 'friendsonly' | 'unknown';
  steamLevel: number | null;
  countryCode?: string;
  location?: string;
  timeCreated?: number | null;
  memberSince?: string;
  lastLogoff?: number | null;
  personaState?: number | null;
}

export interface SteamGame {
  appid: number;
  name: string;
  playtimeForever: number; // minutes
  playtime2Weeks: number; // minutes
  playtimeWindows: number; // minutes
  playtimeMac: number; // minutes
  playtimeLinux: number; // minutes
  playtimeDeck: number; // minutes
  rtimeLastPlayed: number; // unix seconds, 0 if unavailable
  iconUrl: string | null;
  headerUrl: string;
  storeUrl: string;
  sharePercent: number;
}

export interface PlatformBreakdown {
  windowsMinutes: number;
  macMinutes: number;
  linuxMinutes: number;
  deckMinutes: number;
  untrackedMinutes: number;
  totalMinutes: number;
}

export interface PlaytimeBracket {
  id: '1000plus' | '100to999' | '20to99' | '5to19' | 'under5' | 'unplayed';
  label: string;
  minMinutes: number;
  maxMinutes: number | null;
  gameCount: number;
  totalMinutes: number;
  shareOfGamesPercent: number;
  shareOfTimePercent: number;
}

export interface PlaytimeStats {
  totalMinutes: number;
  totalHours: number;
  totalDays: number;
  totalWeeks: number;
  totalYearsEquivalent: number;
  recent2WeeksMinutes: number;
  recent2WeeksHours: number;
  totalGamesOwned: number;
  playedGamesCount: number;
  unplayedGamesCount: number;
  playedPercentage: number;
  averageMinutesPerPlayedGame: number;
  averageMinutesPerOwnedGame: number;
  medianMinutesPerPlayedGame: number;
  top1SharePercent: number;
  top3SharePercent: number;
  top10SharePercent: number;
  platformTotals: PlatformBreakdown;
  brackets: PlaytimeBracket[];
}

export interface SteamAnalysisResponse {
  status: 'ok' | 'private_games' | 'missing_api_key';
  source: 'steam_web_api' | 'public_xml_only' | 'imported_json';
  message?: string;
  identifiers: SteamIdentifiers;
  profile: SteamProfile;
  stats: PlaytimeStats | null;
  games: SteamGame[];
  generatedAt: string;
}

export interface HealthResponse {
  ok: boolean;
  apiKeyConfigured: boolean;
}
