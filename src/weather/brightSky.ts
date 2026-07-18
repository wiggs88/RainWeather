import type { Location, WeatherAlert } from './types';

const BRIGHT_SKY_URL = 'https://api.brightsky.dev';

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

interface BrightSkyAlertRecord {
  id?: string;
  alert_id?: string;
  headline?: string;
  event?: string;
  description?: string;
  severity?: string;
}

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
    distance: '120000',
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
    return (data.alerts ?? []).slice(0, 3).map((alert, index) => {
      const normalizedSeverity = alert.severity?.toLowerCase();
      const severity = ['minor', 'moderate', 'severe', 'extreme'].includes(
        normalizedSeverity ?? '',
      )
        ? (normalizedSeverity as WeatherAlert['severity'])
        : 'unknown';

      return {
        id: alert.id ?? alert.alert_id ?? `alert-${index}`,
        headline: alert.headline ?? alert.event ?? 'Official weather warning',
        description: alert.description,
        severity,
      };
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    return [];
  }
}
