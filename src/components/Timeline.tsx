import { useRef, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import type { TimelinePoint } from '../weather/types';

interface TimelineProps {
  points: TimelinePoint[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  timezone?: string;
}

const timeFormatterCache = new Map<string, Intl.DateTimeFormat>();

function formatTime(epochMs: number, timezone?: string): string {
  const key = timezone || 'local';
  let formatter = timeFormatterCache.get(key);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: timezone,
    });
    timeFormatterCache.set(key, formatter);
  }
  return formatter.format(epochMs);
}

export function Timeline({ points, selectedIndex, onSelect, timezone }: TimelineProps) {
  const isScrubbing = useRef(false);
  if (points.length === 0) return <div className="timeline-empty" />;
  const nowIndex = Math.max(0, points.findIndex((point) => point.phase === 'now'));
  const selected = points[selectedIndex] ?? points[0];
  const totalMinutes = points.reduce((sum, point) => sum + point.intervalMinutes, 0);
  const startEpochMs = points[0].epochMs;
  const endEpochMs = points.at(-1)!.epochMs;
  const durationMs = Math.max(1, endEpochMs - startEpochMs);
  const selectedPosition = ((selected.epochMs - startEpochMs) / durationMs) * 100;
  const nowPosition = ((points[nowIndex].epochMs - startEpochMs) / durationMs) * 100;

  const selectAtPointer = (event: ReactPointerEvent<HTMLInputElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    if (bounds.width <= 0) return;
    const ratio = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
    const targetEpochMs = startEpochMs + ratio * durationMs;
    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;
    points.forEach((point, index) => {
      const distance = Math.abs(point.epochMs - targetEpochMs);
      if (distance < nearestDistance) {
        nearestIndex = index;
        nearestDistance = distance;
      }
    });
    onSelect(nearestIndex);
  };

  const startScrubbing = (event: ReactPointerEvent<HTMLInputElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    isScrubbing.current = true;
    event.currentTarget.focus();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    selectAtPointer(event);
  };

  const continueScrubbing = (event: ReactPointerEvent<HTMLInputElement>) => {
    if (!isScrubbing.current) return;
    selectAtPointer(event);
  };

  const stopScrubbing = (event: ReactPointerEvent<HTMLInputElement>) => {
    isScrubbing.current = false;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  };

  return (
    <section className="timeline" aria-label="Precipitation timeline">
      <div className="timeline-meta">
        <span>{selected.phase.toUpperCase()}</span>
        <strong>{formatTime(selected.epochMs, timezone)}</strong>
        <span>{selected.precipitationRate.toFixed(1)} MM/H</span>
      </div>
      <div className="timeline-chart">
        <div className="timeline-bars" aria-hidden="true">
          {points.map((point) => {
            const height = Math.max(4, Math.min(48, 4 + point.precipitationRate * 5.5));
            const style = {
              '--bar-height': `${height}px`,
              flexBasis: `${(point.intervalMinutes / totalMinutes) * 100}%`,
            } as CSSProperties;
            return (
              <span
                key={point.id}
                className={`timeline-bar intensity-${point.intensity}${
                  point.thunderRisk >= 0.25 ? ' has-thunder' : ''
                }`}
                style={style}
              />
            );
          })}
        </div>
        <span className="now-marker" style={{ left: `${nowPosition}%` }} aria-hidden="true" />
        <span
          className="selected-marker"
          style={{ left: `${selectedPosition}%` }}
          aria-hidden="true"
        />
        <input
          type="range"
          min={0}
          max={points.length - 1}
          step={1}
          value={selectedIndex}
          onChange={(event) => onSelect(Number(event.target.value))}
          onPointerDown={startScrubbing}
          onPointerMove={continueScrubbing}
          onPointerUp={stopScrubbing}
          onPointerCancel={stopScrubbing}
          aria-label="Select radar time"
          aria-valuetext={`${selected.phase}, ${formatTime(selected.epochMs, timezone)}, ${selected.precipitationRate.toFixed(1)} millimeters per hour`}
        />
      </div>
      <div className="timeline-times" aria-hidden="true">
        <span>{formatTime(points[0].epochMs, timezone)}</span>
        <span className="timeline-hint">DRAG · FUTURE →</span>
        <span>{formatTime(points.at(-1)!.epochMs, timezone)}</span>
      </div>
    </section>
  );
}
