import { classifyPrecipitation } from './rainWindow';
import { phaseForTimestamp } from './normalize';
import type { Location, TimelinePoint } from './types';

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/dwd-icon';

export const DEFAULT_LOCATION: Location = {
  id: '2950159',
  name: 'Berlin',
  detail: 'Berlin, Germany',
  latitude: 52.52,
  longitude: 13.405,
  timezone: 'Europe/Berlin',
};

interface GeocodingResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
  timezone?: string;
}

interface GeocodingResponse {
  results?: GeocodingResult[];
}

interface DwdForecastResponse {
  timezone?: string;
  minutely_15?: {
    time?: string[];
    precipitation?: number[];
    rain?: number[];
    showers?: number[];
    lightning_potential?: number[];
  };
}

async function fetchJson<T>(url: URL, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`Weather request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}

export async function searchLocations(
  query: string,
  signal?: AbortSignal,
): Promise<Location[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const url = new URL(GEOCODING_URL);
  url.search = new URLSearchParams({
    name: trimmed,
    count: '6',
    language: navigator.language?.slice(0, 2) || 'en',
    format: 'json',
  }).toString();

  const data = await fetchJson<GeocodingResponse>(url, signal);
  return (data.results ?? []).map((result) => {
    const detailParts = [result.admin1, result.country].filter(
      (part, index, all) => part && all.indexOf(part) === index,
    );
    return {
      id: String(result.id),
      name: result.name,
      detail: detailParts.join(', '),
      latitude: result.latitude,
      longitude: result.longitude,
      timezone: result.timezone,
    };
  });
}

export async function fetchDwdForecast(
  location: Location,
  signal?: AbortSignal,
  nowMs = Date.now(),
): Promise<TimelinePoint[]> {
  const url = new URL(FORECAST_URL);
  url.search = new URLSearchParams({
    latitude: location.latitude.toString(),
    longitude: location.longitude.toString(),
    minutely_15: 'precipitation,rain,showers,lightning_potential',
    past_minutely_15: '8',
    forecast_minutely_15: '40',
    timezone: 'auto',
  }).toString();

  const data = await fetchJson<DwdForecastResponse>(url, signal);
  const series = data.minutely_15;
  const times = series?.time ?? [];
  const precipitation = series?.precipitation ?? [];
  const lightning = series?.lightning_potential ?? [];

  if (times.length === 0) {
    throw new Error('DWD forecast returned no timeline');
  }

  return times.map((timestamp, index) => {
    const epochMs = Date.parse(timestamp);
    const amount = Math.max(0, precipitation[index] ?? 0);
    const precipitationRate = amount * 4;
    const lightningPotential = Math.max(0, lightning[index] ?? 0);

    return {
      id: `icon-${epochMs}`,
      timestamp,
      epochMs,
      intervalMinutes: 15,
      phase: phaseForTimestamp(epochMs, nowMs),
      source: 'icon-d2',
      precipitationRate,
      precipitationAmount: amount,
      intensity: classifyPrecipitation(precipitationRate),
      thunderRisk: Math.min(1, lightningPotential / 5),
    };
  });
}
