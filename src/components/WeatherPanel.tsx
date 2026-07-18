import type { PlaybackState } from '../hooks/usePlayback';
import type {
  WeatherLoadStatus,
  WeatherSnapshot,
} from '../weather/types';
import { CrosshairIcon, PauseIcon, PlayIcon } from './Icons';
import { Timeline } from './Timeline';

interface WeatherPanelProps {
  status: WeatherLoadStatus;
  snapshot?: WeatherSnapshot;
  error?: string;
  playback: PlaybackState;
  onRefresh: () => void;
}

function formatTime(epochMs: number, timezone?: string): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: timezone,
  }).format(epochMs);
}

function formatUpdated(epochMs: number): string {
  return new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' }).format(
    Math.min(0, Math.round((epochMs - Date.now()) / 60_000)),
    'minute',
  );
}

export function WeatherPanel({
  status,
  snapshot,
  error,
  playback,
  onRefresh,
}: WeatherPanelProps) {
  if (!snapshot) {
    return (
      <aside className="weather-panel loading-panel" id="weather-panel" aria-live="polite">
        <span className="eyebrow">{status === 'error' ? 'SOURCE ERROR' : 'LOADING WEATHER'}</span>
        <h1>{status === 'error' ? 'DATA UNAVAILABLE' : 'CHECKING THE SKY'}</h1>
        <p>{error ?? 'Loading radar and high-resolution forecast…'}</p>
        {status === 'error' ? (
          <button className="text-button" type="button" onClick={onRefresh}>
            RETRY
          </button>
        ) : null}
      </aside>
    );
  }

  const { summary, location, alerts, notices } = snapshot;
  const windowText =
    summary.headline !== 'DRY FOR NOW' &&
    summary.dryWindowStartEpochMs &&
    summary.dryWindowEndEpochMs
      ? `${formatTime(summary.dryWindowStartEpochMs, location.timezone)}–${formatTime(
          summary.dryWindowEndEpochMs,
          location.timezone,
        )}`
      : undefined;
  const selected = playback.selectedPoint;
  const selectedHasRadar = Boolean(selected?.mapFrameId);
  const sourceLabel =
    snapshot.radarMode === 'nowcast'
      ? selectedHasRadar
        ? 'DWD RADAR / 5 MIN'
        : 'ICON-D2 MODEL'
      : snapshot.radarMode === 'history'
        ? 'RADAR HISTORY + ICON-D2'
        : 'ICON-D2 MODEL';
  const frameLabel =
    snapshot.radarMode === 'nowcast'
      ? selectedHasRadar
        ? 'RADAR FRAME'
        : 'MODEL TIMELINE'
      : snapshot.radarMode === 'history'
        ? 'HISTORICAL RADAR'
        : 'BASE MAP';

  return (
    <aside className="weather-panel" id="weather-panel" aria-live="polite">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">{location.name.toUpperCase()}</span>
          <p>{location.detail}</p>
        </div>
        <div className="source-state">
          <span>{sourceLabel}</span>
          <span>{formatUpdated(snapshot.updatedAt).toUpperCase()}</span>
        </div>
      </div>

      {alerts.length > 0 ? (
        <div className="alert-strip" role="alert">
          <span>OFFICIAL WARNING</span>
          <strong>{alerts[0].headline}</strong>
        </div>
      ) : null}

      <div className="status-controls">
        <div className="rain-status">
          <div className="status-headline-row">
            <span
              className={`intensity-dot intensity-${summary.currentIntensity}`}
              aria-hidden="true"
            />
            <div>
              <h1>{summary.headline}</h1>
              <p>
                {windowText ? `DRY WINDOW ${windowText}` : summary.detail.toUpperCase()}
              </p>
            </div>
          </div>
        </div>
        <div className="playback-row">
          <button
            className="icon-button playback-button"
            type="button"
            onClick={playback.togglePlayback}
            aria-label={playback.isPlaying ? 'Pause radar animation' : 'Play radar animation'}
          >
            {playback.isPlaying ? <PauseIcon /> : <PlayIcon />}
          </button>
          <button className="text-button now-button" type="button" onClick={playback.jumpToNow}>
            <CrosshairIcon />
            NOW
          </button>
        </div>
      </div>

      <Timeline
        points={snapshot.timeline}
        selectedIndex={playback.selectedIndex}
        onSelect={playback.setSelectedIndex}
        timezone={location.timezone}
      />

      <div className="radar-state" aria-live="polite">
        <span>{selected?.phase.toUpperCase() ?? 'LOADING'}</span>
        <strong>{frameLabel}</strong>
        <span>{sourceLabel}</span>
        <span>{formatUpdated(snapshot.updatedAt).toUpperCase()}</span>
      </div>

      <div className="panel-footer">
        <span>{selected?.thunderRisk && selected.thunderRisk >= 0.25 ? 'THUNDER RISK' : 'PRECIPITATION'}</span>
        <span>{notices[0] ?? 'DWD / OPEN-METEO'}</span>
      </div>
      <p className="attribution">
        © OpenFreeMap · © OpenStreetMap · Weather: DWD, Open-Meteo, RainViewer
      </p>
    </aside>
  );
}
