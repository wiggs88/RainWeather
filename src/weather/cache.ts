import type { Location, WeatherSnapshot } from './types';

const SNAPSHOT_CACHE_KEY = 'rainweather.snapshot.v1';

export function readCachedSnapshot(location: Location): WeatherSnapshot | undefined {
  try {
    const raw = localStorage.getItem(SNAPSHOT_CACHE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as WeatherSnapshot;
    if (
      parsed.location?.id !== location.id ||
      !Array.isArray(parsed.timeline) ||
      parsed.timeline.length === 0 ||
      typeof parsed.updatedAt !== 'number'
    ) {
      return undefined;
    }

    return {
      ...parsed,
      radarFrames: [],
      radarMode: parsed.rainViewerFrames?.length ? 'history' : 'none',
      notices: ['Cached forecast — refresh for current data'],
    };
  } catch {
    return undefined;
  }
}

export function writeCachedSnapshot(snapshot: WeatherSnapshot): void {
  try {
    const serializable: WeatherSnapshot = {
      ...snapshot,
      radarFrames: [],
      radarMode: snapshot.rainViewerFrames.length ? 'history' : 'none',
    };
    localStorage.setItem(SNAPSHOT_CACHE_KEY, JSON.stringify(serializable));
  } catch {
    // Storage can be unavailable in private browsing or a restricted iframe.
  }
}
