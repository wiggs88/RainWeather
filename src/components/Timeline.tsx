import {
  useRef,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
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
  const lastScrubbedIndex = useRef<number | undefined>(undefined);
  if (points.length === 0) return <div className="timeline-empty" />;
  const nowIndex = Math.max(0, points.findIndex((point) => point.phase === 'now'));
  const selected = points[selectedIndex] ?? points[0];
  const totalMinutes = points.reduce((sum, point) => sum + point.intervalMinutes, 0);
  const startEpochMs = points[0].epochMs;
  const endEpochMs = points.at(-1)!.epochMs;
  const durationMs = Math.max(1, endEpochMs - startEpochMs);
  const selectedPosition = ((selected.epochMs - startEpochMs) / durationMs) * 100;
  const nowPosition = ((points[nowIndex].epochMs - startEpochMs) / durationMs) * 100;

  const indexAtPointer = (event: ReactPointerEvent<HTMLDivElement>): number | undefined => {
    const bounds = event.currentTarget.getBoundingClientRect();
    if (bounds.width <= 0) return undefined;
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
    return nearestIndex;
  };

  const startScrubbing = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    const nextIndex = indexAtPointer(event);
    if (nextIndex === undefined) return;
    isScrubbing.current = true;
    lastScrubbedIndex.current = nextIndex;
    event.currentTarget.focus();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    onSelect(nextIndex);
  };

  const continueScrubbing = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isScrubbing.current) return;
    const nextIndex = indexAtPointer(event);
    if (nextIndex === undefined || nextIndex === lastScrubbedIndex.current) return;
    lastScrubbedIndex.current = nextIndex;
    onSelect(nextIndex);
  };

  const stopScrubbing = (event: ReactPointerEvent<HTMLDivElement>) => {
    isScrubbing.current = false;
    lastScrubbedIndex.current = undefined;
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    let nextIndex: number | undefined;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
      nextIndex = selectedIndex - 1;
    } else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
      nextIndex = selectedIndex + 1;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = points.length - 1;
    }
    if (nextIndex === undefined) return;
    event.preventDefault();
    onSelect(Math.max(0, Math.min(points.length - 1, nextIndex)));
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
        <div
          className="timeline-scrubber"
          role="slider"
          tabIndex={0}
          onPointerDown={startScrubbing}
          onPointerMove={continueScrubbing}
          onPointerUp={stopScrubbing}
          onPointerCancel={stopScrubbing}
          onLostPointerCapture={stopScrubbing}
          onKeyDown={handleKeyDown}
          aria-label="Select radar time"
          aria-orientation="horizontal"
          aria-valuemin={0}
          aria-valuemax={points.length - 1}
          aria-valuenow={selectedIndex}
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
