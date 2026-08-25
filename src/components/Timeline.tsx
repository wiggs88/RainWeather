import {
  useEffect,
  useRef,
  useState,
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

interface ScrubGeometry {
  pointerId: number;
  left: number;
  width: number;
  startEpochMs: number;
  durationMs: number;
  epochs: number[];
}

interface ScrubTarget {
  index: number;
  position: number;
}

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
  const [scrubPosition, setScrubPosition] = useState<number>();
  const scrubGeometry = useRef<ScrubGeometry | undefined>(undefined);
  const pendingScrub = useRef<ScrubTarget | undefined>(undefined);
  const animationFrame = useRef<number | undefined>(undefined);
  const lastScrubbedIndex = useRef<number | undefined>(undefined);
  const lastGestureIndex = useRef<number | undefined>(undefined);

  useEffect(
    () => () => {
      if (animationFrame.current !== undefined) {
        window.cancelAnimationFrame(animationFrame.current);
      }
    },
    [],
  );

  useEffect(() => {
    if (
      !scrubGeometry.current &&
      lastGestureIndex.current !== undefined &&
      selectedIndex !== lastGestureIndex.current
    ) {
      lastGestureIndex.current = undefined;
      setScrubPosition(undefined);
    }
  }, [selectedIndex]);

  useEffect(() => {
    if (!scrubGeometry.current) {
      lastGestureIndex.current = undefined;
      setScrubPosition(undefined);
    }
  }, [points]);

  if (points.length === 0) return <div className="timeline-empty" />;
  const nowIndex = Math.max(0, points.findIndex((point) => point.phase === 'now'));
  const selected = points[selectedIndex] ?? points[0];
  const startEpochMs = points[0].epochMs;
  const endEpochMs = points.at(-1)!.epochMs;
  const durationMs = Math.max(1, endEpochMs - startEpochMs);
  const selectedPosition = ((selected.epochMs - startEpochMs) / durationMs) * 100;
  const nowPosition = ((points[nowIndex].epochMs - startEpochMs) / durationMs) * 100;

  const targetAtClientX = (
    clientX: number,
    geometry: ScrubGeometry,
  ): ScrubTarget | undefined => {
    if (geometry.width <= 0) return undefined;
    const ratio = Math.max(0, Math.min(1, (clientX - geometry.left) / geometry.width));
    const targetEpochMs = geometry.startEpochMs + ratio * geometry.durationMs;
    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;
    geometry.epochs.forEach((epochMs, index) => {
      const distance = Math.abs(epochMs - targetEpochMs);
      if (distance < nearestDistance) {
        nearestIndex = index;
        nearestDistance = distance;
      }
    });
    return { index: nearestIndex, position: ratio * 100 };
  };

  const commitScrub = (target: ScrubTarget) => {
    setScrubPosition(target.position);
    lastGestureIndex.current = target.index;
    if (target.index === lastScrubbedIndex.current) return;
    lastScrubbedIndex.current = target.index;
    onSelect(target.index);
  };

  const flushPendingScrub = () => {
    animationFrame.current = undefined;
    const target = pendingScrub.current;
    pendingScrub.current = undefined;
    if (target) commitScrub(target);
  };

  const startScrubbing = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const geometry: ScrubGeometry = {
      pointerId: event.pointerId,
      left: bounds.left,
      width: bounds.width,
      startEpochMs,
      durationMs,
      epochs: points.map((point) => point.epochMs),
    };
    const target = targetAtClientX(event.clientX, geometry);
    if (!target) return;
    scrubGeometry.current = geometry;
    lastScrubbedIndex.current = undefined;
    event.currentTarget.focus();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    commitScrub(target);
  };

  const continueScrubbing = (event: ReactPointerEvent<HTMLDivElement>) => {
    const geometry = scrubGeometry.current;
    if (!geometry || event.pointerId !== geometry.pointerId) return;
    const target = targetAtClientX(event.clientX, geometry);
    if (!target) return;
    pendingScrub.current = target;
    if (animationFrame.current === undefined) {
      animationFrame.current = window.requestAnimationFrame(flushPendingScrub);
    }
  };

  const stopScrubbing = (
    event: ReactPointerEvent<HTMLDivElement>,
    commitFinalPosition: boolean,
  ) => {
    const geometry = scrubGeometry.current;
    if (!geometry || event.pointerId !== geometry.pointerId) return;
    if (animationFrame.current !== undefined) {
      window.cancelAnimationFrame(animationFrame.current);
      animationFrame.current = undefined;
    }
    pendingScrub.current = undefined;
    if (commitFinalPosition) {
      const target = targetAtClientX(event.clientX, geometry);
      if (target) commitScrub(target);
    }
    scrubGeometry.current = undefined;
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
    lastGestureIndex.current = undefined;
    setScrubPosition(undefined);
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
          {points.map((point, index) => {
            const height = Math.max(4, Math.min(48, 4 + point.precipitationRate * 5.5));
            const left = ((point.epochMs - startEpochMs) / durationMs) * 100;
            const nextPoint = points[index + 1];
            const nextLeft = nextPoint
              ? ((nextPoint.epochMs - startEpochMs) / durationMs) * 100
              : 100;
            const style = {
              '--bar-height': `${height}px`,
              left: `${left}%`,
              width: nextPoint ? `max(1px, calc(${nextLeft - left}% - 1px))` : '1px',
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
          style={{ left: `${scrubPosition ?? selectedPosition}%` }}
          aria-hidden="true"
        />
        <div
          className="timeline-scrubber"
          role="slider"
          tabIndex={0}
          onPointerDown={startScrubbing}
          onPointerMove={continueScrubbing}
          onPointerUp={(event) => stopScrubbing(event, true)}
          onPointerCancel={(event) => stopScrubbing(event, false)}
          onLostPointerCapture={(event) => stopScrubbing(event, false)}
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
