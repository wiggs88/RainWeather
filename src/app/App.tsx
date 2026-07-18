import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { LocationSearch } from '../components/LocationSearch';
import { WeatherPanel } from '../components/WeatherPanel';
import { usePlayback } from '../hooks/usePlayback';
import { useWeatherData } from '../hooks/useWeatherData';
import { DEFAULT_LOCATION } from '../weather/openMeteo';
import type { Location } from '../weather/types';

const LOCATION_STORAGE_KEY = 'rainweather.location.v1';
const RadarMap = lazy(() =>
  import('../components/RadarMap').then((module) => ({ default: module.RadarMap })),
);

function readStoredLocation(): Location {
  try {
    const raw = localStorage.getItem(LOCATION_STORAGE_KEY);
    if (!raw) return DEFAULT_LOCATION;
    const parsed = JSON.parse(raw) as Partial<Location>;
    if (
      typeof parsed.id === 'string' &&
      typeof parsed.name === 'string' &&
      typeof parsed.detail === 'string' &&
      typeof parsed.latitude === 'number' &&
      typeof parsed.longitude === 'number'
    ) {
      return parsed as Location;
    }
  } catch {
    // Ignore malformed user storage and use the safe default.
  }
  return DEFAULT_LOCATION;
}

export function App() {
  const [location, setLocation] = useState<Location>(readStoredLocation);
  const weather = useWeatherData(location);
  const activeSnapshot =
    weather.snapshot?.location.id === location.id ? weather.snapshot : undefined;
  const timeline = useMemo(() => activeSnapshot?.timeline ?? [], [activeSnapshot]);
  const playback = usePlayback(timeline);

  useEffect(() => {
    localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(location));
  }, [location]);

  return (
    <div className="app-shell">
      <a className="skip-link" href="#weather-panel">
        SKIP TO WEATHER TIMELINE
      </a>
      <LocationSearch location={location} onSelect={setLocation} />
      <main className="map-stage">
        <Suspense fallback={<div className="radar-map map-loading" aria-label="Loading map" />}>
          <RadarMap
            location={location}
            selectedPoint={playback.selectedPoint}
            radarFrames={activeSnapshot?.radarFrames ?? []}
            rainViewerFrames={activeSnapshot?.rainViewerFrames ?? []}
          />
        </Suspense>
        <div className="map-frame-label" aria-live="polite">
          <span>{playback.selectedPoint?.phase.toUpperCase() ?? 'LOADING'}</span>
          <strong>
            {activeSnapshot?.radarMode === 'nowcast'
              ? playback.selectedPoint?.mapFrameId
                ? 'RADAR FRAME'
                : 'MODEL TIMELINE'
              : activeSnapshot?.radarMode === 'history'
                ? 'HISTORICAL RADAR'
                : 'BASE MAP'}
          </strong>
        </div>
      </main>
      <WeatherPanel
        status={weather.status}
        snapshot={activeSnapshot}
        error={weather.error}
        playback={playback}
        onRefresh={weather.refresh}
      />
    </div>
  );
}
