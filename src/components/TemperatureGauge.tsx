import type { CSSProperties } from 'react';

interface TemperatureGaugeProps {
  temperatureC?: number;
  epochMs?: number;
  timezone?: string;
}

const BASE_MIN_C = -20;
const BASE_MAX_C = 40;

function formatTime(epochMs: number, timezone?: string): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: timezone,
  }).format(epochMs);
}

export function TemperatureGauge({
  temperatureC,
  epochMs,
  timezone,
}: TemperatureGaugeProps) {
  const hasTemperature =
    typeof temperatureC === 'number' && Number.isFinite(temperatureC);
  const minC = hasTemperature ? Math.min(BASE_MIN_C, temperatureC) : BASE_MIN_C;
  const maxC = hasTemperature ? Math.max(BASE_MAX_C, temperatureC) : BASE_MAX_C;
  const position = hasTemperature
    ? ((temperatureC - minC) / (maxC - minC)) * 100
    : 0;
  const timeLabel =
    epochMs !== undefined ? ` at ${formatTime(epochMs, timezone)}` : '';
  const label = hasTemperature
    ? `Temperature${timeLabel}: ${temperatureC.toFixed(1)} degrees Celsius`
    : `Temperature${timeLabel} unavailable`;
  const markerStyle = {
    '--temperature-offset': `${position * 0.28}px`,
  } as CSSProperties;

  return (
    <div
      className={`temperature-gauge${hasTemperature ? '' : ' is-unavailable'}`}
      role={hasTemperature ? 'meter' : 'status'}
      aria-label={label}
      aria-valuemin={minC}
      aria-valuemax={maxC}
      aria-valuenow={hasTemperature ? temperatureC : undefined}
      aria-valuetext={hasTemperature ? `${temperatureC.toFixed(1)} degrees Celsius` : 'Unavailable'}
    >
      <span className="temperature-track" aria-hidden="true">
        <span className="temperature-marker" style={markerStyle} />
      </span>
      <span className="temperature-value" aria-hidden="true">
        {hasTemperature ? `${Math.round(temperatureC)}°` : '—°'}
      </span>
    </div>
  );
}
