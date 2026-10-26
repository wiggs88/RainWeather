import { useCallback, useEffect, useRef, useState } from 'react';
import { isWithinDwdCoverage } from '../radar/coverage';
import { decodeBrightSkyRadar } from '../radar/decode';
import { fetchBrightSkyAlerts, fetchBrightSkyRadar } from '../weather/brightSky';
import { readCachedSnapshot, writeCachedSnapshot } from '../weather/cache';
import { mergeTimeline } from '../weather/normalize';
import { fetchForecast } from '../weather/openMeteo';
import { buildRainSummary } from '../weather/rainWindow';
import { fetchRainViewerFrames } from '../weather/rainViewer';
import type { Location, WeatherLoadStatus, WeatherSnapshot } from '../weather/types';

interface WeatherDataState {
  status: WeatherLoadStatus;
  snapshot?: WeatherSnapshot;
  error?: string;
  refresh: () => void;
}

const REFRESH_INTERVAL_MS = 5 * 60_000;

export function useWeatherData(location: Location): WeatherDataState {
  const [status, setStatus] = useState<WeatherLoadStatus>('idle');
  const [snapshot, setSnapshot] = useState<WeatherSnapshot>();
  const [error, setError] = useState<string>();
  const [refreshKey, setRefreshKey] = useState(0);
  const objectUrls = useRef<string[]>([]);
  const lastLoadStartedAt = useRef(0);
  const refresh = useCallback(() => setRefreshKey((value) => value + 1), []);

  useEffect(() => {
    const refreshIfStale = () => {
      if (
        document.visibilityState === 'visible' &&
        Date.now() - lastLoadStartedAt.current >= REFRESH_INTERVAL_MS
      ) {
        refresh();
      }
    };
    // Timers are throttled while the app is backgrounded, so also catch up
    // as soon as it becomes visible again.
    const interval = window.setInterval(refreshIfStale, REFRESH_INTERVAL_MS);
    document.addEventListener('visibilitychange', refreshIfStale);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', refreshIfStale);
    };
  }, [refresh]);

  useEffect(() => {
    const controller = new AbortController();
    const nowMs = Date.now();
    lastLoadStartedAt.current = nowMs;
    const cached = readCachedSnapshot(location);
    if (cached) setSnapshot(cached);
    setStatus('loading');
    setError(undefined);

    const forecastPromise = fetchForecast(location, controller.signal, nowMs);
    const inDwdCoverage = isWithinDwdCoverage(location.latitude, location.longitude);
    const radarPromise = inDwdCoverage
      ? fetchBrightSkyRadar(location, controller.signal, nowMs).then((response) =>
          decodeBrightSkyRadar(response, controller.signal, nowMs),
        )
      : Promise.reject(new Error('Outside German radar coverage'));
    const rainViewerPromise = fetchRainViewerFrames(controller.signal);
    const alertsPromise = fetchBrightSkyAlerts(location, controller.signal);

    void Promise.allSettled([
      forecastPromise,
      radarPromise,
      rainViewerPromise,
      alertsPromise,
    ]).then(([forecastResult, radarResult, rainViewerResult, alertsResult]) => {
      if (controller.signal.aborted) {
        // A superseded load may still have finished decoding; free its frames.
        if (radarResult.status === 'fulfilled') {
          radarResult.value.frames.forEach((frame) => URL.revokeObjectURL(frame.imageUrl));
        }
        return;
      }

      const forecast = forecastResult.status === 'fulfilled' ? forecastResult.value : [];
      const radar = radarResult.status === 'fulfilled' ? radarResult.value : undefined;
      const rainViewer =
        rainViewerResult.status === 'fulfilled' ? rainViewerResult.value : [];
      const alerts = alertsResult.status === 'fulfilled' ? alertsResult.value : [];

      if (forecast.length === 0 && !radar) {
        const reason =
          forecastResult.status === 'rejected' && forecastResult.reason instanceof Error
            ? forecastResult.reason.message
            : 'Weather sources are temporarily unavailable';
        if (cached) {
          setSnapshot(cached);
          setStatus('ready');
          setError(reason);
        } else {
          setStatus('error');
          setError(reason);
        }
        return;
      }

      objectUrls.current.forEach((url) => URL.revokeObjectURL(url));
      objectUrls.current = radar?.frames.map((frame) => frame.imageUrl) ?? [];

      const timeline = mergeTimeline(radar?.timeline ?? [], forecast, nowMs).filter(
        (point) =>
          point.epochMs >= nowMs - 60 * 60_000 &&
          point.epochMs <= nowMs + 6 * 60 * 60_000,
      );
      const notices: string[] = [];
      if (!radar) {
        notices.push(
          rainViewer.length > 0
            ? inDwdCoverage
              ? 'Local nowcast unavailable — using RainViewer radar history'
              : 'Outside German radar range — using European radar from RainViewer'
            : 'Local radar unavailable — showing forecast timeline',
        );
      }
      if (forecast.length === 0) notices.push('Longer forecast unavailable');
      if (!radar && rainViewer.length === 0) notices.push('Radar animation unavailable');

      const nextSnapshot: WeatherSnapshot = {
        location,
        timeline,
        radarFrames: radar?.frames ?? [],
        rainViewerFrames: rainViewer,
        alerts,
        summary: buildRainSummary(timeline, nowMs),
        updatedAt: Date.now(),
        radarMode: radar ? 'nowcast' : rainViewer.length > 0 ? 'history' : 'none',
        notices,
      };
      setSnapshot(nextSnapshot);
      writeCachedSnapshot(nextSnapshot);
      setStatus('ready');
    });

    return () => controller.abort();
  }, [location, refreshKey]);

  useEffect(
    () => () => {
      objectUrls.current.forEach((url) => URL.revokeObjectURL(url));
    },
    [],
  );

  return { status, snapshot, error, refresh };
}
