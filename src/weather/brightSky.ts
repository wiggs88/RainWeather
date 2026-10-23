import type { Location, WeatherAlert } from './types';

const BRIGHT_SKY_URL = 'https://api.brightsky.dev';
const RADAR_DISTANCE_METERS = 200_000;
const SEVERITY_RANK: Record<WeatherAlert['severity'], number> = {
  extreme: 4,
  severe: 3,
  moderate: 2,
  minor: 1,
  unknown: 0,
};
const DWD_WARNINGS_URL: Record<AlertLanguage, string> = {
  en: 'https://www.dwd.de/EN/weather/warnings/warnings_node.html',
  de: 'https://www.dwd.de/DE/wetter/warnungen/warnWetter_node.html',
};

function preferredAlertLanguage(): AlertLanguage {
  return navigator.language?.toLowerCase().startsWith('de') ? 'de' : 'en';
}

function parseEpochMs(value?: string | null): number | undefined {
  const epochMs = value ? Date.parse(value) : Number.NaN;
  return Number.isFinite(epochMs) ? epochMs : undefined;
}

export function normalizeBrightSkyAlerts(
  records: BrightSkyAlertRecord[],
  language: AlertLanguage = 'en',
): WeatherAlert[] {
  const fallback: AlertLanguage = language === 'en' ? 'de' : 'en';
  const text = (
    record: BrightSkyAlertRecord,
    field: 'headline' | 'event' | 'description' | 'instruction',
  ) => record[`${field}_${language}`]?.trim() || record[`${field}_${fallback}`]?.trim() || undefined;

  return records
    .map((record, index): WeatherAlert => {
      const normalizedSeverity = record.severity?.toLowerCase() ?? '';
      const severity =
        normalizedSeverity in SEVERITY_RANK
          ? (normalizedSeverity as WeatherAlert['severity'])
          : 'unknown';
      return {
        id: String(record.alert_id ?? record.id ?? `alert-${index}`),
        headline: text(record, 'headline') ?? 'Official weather warning',
        event: text(record, 'event'),
        description: text(record, 'description'),
        instruction: text(record, 'instruction'),
        severity,
        onsetEpochMs: parseEpochMs(record.onset),
        expiresEpochMs: parseEpochMs(record.expires),
        sourceUrl: DWD_WARNINGS_URL[language],
      };
    })
    .sort(
      (a, b) =>
        SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity] ||
        (a.onsetEpochMs ?? 0) - (b.onsetEpochMs ?? 0),
    );
}

export interface BrightSkyRadarRecord {
  timestamp: string;
  source: string;
  precipitation_5: string;
}

export interface BrightSkyRadarResponse {
  radar: BrightSkyRadarRecord[];
  bbox?: [number, number, number, number] | null;
  latlon_position?: { x: number; y: number } | null;
}

type AlertLanguage = 'en' | 'de';

// Bright Sky serves DWD warnings with English and German text side by side.
type BrightSkyAlertRecord = {
  id?: number | string;
  alert_id?: string;
  severity?: string;
  onset?: string | null;
  expires?: string | null;
} & Partial<
  Record<
    `${'headline' | 'event' | 'description' | 'instruction'}_${AlertLanguage}`,
    string | null
  >
>;

interface BrightSkyAlertsResponse {
  alerts?: BrightSkyAlertRecord[];
}

async function fetchJson<T>(url: URL, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`Bright Sky request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}

export async function fetchBrightSkyRadar(
  location: Location,
  signal?: AbortSignal,
  nowMs = Date.now(),
): Promise<BrightSkyRadarResponse> {
  const url = new URL('/radar', BRIGHT_SKY_URL);
  url.search = new URLSearchParams({
    lat: location.latitude.toString(),
    lon: location.longitude.toString(),
    distance: RADAR_DISTANCE_METERS.toString(),
    date: new Date(nowMs - 60 * 60_000).toISOString(),
    last_date: new Date(nowMs + 2 * 60 * 60_000).toISOString(),
    format: 'compressed',
    tz: location.timezone || 'Europe/Berlin',
  }).toString();

  const data = await fetchJson<BrightSkyRadarResponse>(url, signal);
  if (!Array.isArray(data.radar) || data.radar.length === 0) {
    throw new Error('Bright Sky radar is temporarily unavailable');
  }
  if (!data.bbox || !data.latlon_position) {
    throw new Error('Bright Sky radar returned incomplete geometry');
  }
  return data;
}

export async function fetchBrightSkyAlerts(
  location: Location,
  signal?: AbortSignal,
): Promise<WeatherAlert[]> {
  const url = new URL('/alerts', BRIGHT_SKY_URL);
  url.search = new URLSearchParams({
    lat: location.latitude.toString(),
    lon: location.longitude.toString(),
  }).toString();

  try {
    const data = await fetchJson<BrightSkyAlertsResponse>(url, signal);
    return normalizeBrightSkyAlerts(data.alerts ?? [], preferredAlertLanguage());
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    return [];
  }
}
