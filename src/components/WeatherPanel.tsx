import type { PlaybackState } from '../hooks/usePlayback';
import { formatClockTime as formatTime } from '../weather/format';
import type {
  WeatherLoadStatus,
  WeatherSnapshot,
} from '../weather/types';
import { CrosshairIcon, PauseIcon, PlayIcon } from './Icons';
import { TemperatureGauge } from './TemperatureGauge';
import { SupportCoffee } from './SupportCoffee';
import { WeatherAlertCallout } from './WeatherAlertCallout';
import { Timeline } from './Timeline';

interface WeatherPanelProps {
  status: WeatherLoadStatus;
  snapshot?: WeatherSnapshot;
  error?: string;
  playback: PlaybackState;
  onRefresh: () => void;
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
    summary.nextChangeEpochMs !== undefined &&
    summary.dryWindowStartEpochMs !== undefined &&
    summary.dryWindowEndEpochMs !== undefined
      ? `${formatTime(summary.dryWindowStartEpochMs, location.timezone)}–${formatTime(
          summary.dryWindowEndEpochMs,
          location.timezone,
        )}`
      : undefined;
  const selected = playback.selectedPoint;
  const selectedHasRadar = Boolean(selected?.mapFrameId);
  const selectedHasRainViewer =
    snapshot.radarMode === 'history' && selected?.phase !== 'forecast';
  const sourceLabel =
    snapshot.radarMode === 'nowcast'
      ? selectedHasRadar
        ? 'DWD RADAR / 5 MIN'
        : 'OPEN-METEO MODEL'
      : snapshot.radarMode === 'history'
        ? selectedHasRainViewer
          ? 'RAINVIEWER RADAR'
          : 'OPEN-METEO MODEL'
        : 'OPEN-METEO MODEL';
  const frameLabel =
    snapshot.radarMode === 'nowcast'
      ? selectedHasRadar
        ? 'RADAR FRAME'
        : 'MODEL TIMELINE'
      : snapshot.radarMode === 'history'
        ? selectedHasRainViewer
          ? 'HISTORICAL RADAR'
          : 'MODEL TIMELINE'
        : 'BASE MAP';

  return (
    <aside
      className={`weather-panel${alerts.length > 0 ? ' has-alert' : ''}`}
      id="weather-panel"
      aria-live="polite"
    >
      <WeatherAlertCallout alerts={alerts} timezone={location.timezone} />

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

      <div className="status-controls">
        <div className="rain-status">
          <div className="status-headline-row">
            <TemperatureGauge
              temperatureC={selected?.temperatureC}
              epochMs={selected?.epochMs}
              timezone={location.timezone}
            />
            <span
              className={`intensity-dot intensity-${summary.currentIntensity}`}
              aria-hidden="true"
            />
            <div className="status-copy">
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
      <div className="panel-meta">
        <p className="attribution">
          © OpenFreeMap · © OpenStreetMap · Weather: DWD, Open-Meteo, RainViewer
        </p>
        <SupportCoffee placement="panel" />
      </div>
    </aside>
  );
}
