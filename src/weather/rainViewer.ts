import type { RainViewerFrame } from './types';

const RAIN_VIEWER_URL = 'https://api.rainviewer.com/public/weather-maps.json';

interface RainViewerResponse {
  host?: string;
  radar?: {
    past?: Array<{ time: number; path: string }>;
  };
}

export async function fetchRainViewerFrames(
  signal?: AbortSignal,
): Promise<RainViewerFrame[]> {
  const response = await fetch(RAIN_VIEWER_URL, { signal });
  if (!response.ok) throw new Error(`RainViewer request failed (${response.status})`);
  const data = (await response.json()) as RainViewerResponse;
  if (!data.host) return [];

  return (data.radar?.past ?? []).map((frame) => ({
    id: `rainviewer-${frame.time}`,
    timestamp: new Date(frame.time * 1000).toISOString(),
    epochMs: frame.time * 1000,
    tileTemplate: `${data.host}${frame.path}/256/{z}/{x}/{y}/2/1_1.png`,
  }));
}
