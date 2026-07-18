import { classifyPrecipitation } from './rainWindow';
import type { TimelinePoint, TimelinePhase } from './types';

export function phaseForTimestamp(epochMs: number, nowMs: number): TimelinePhase {
  const delta = epochMs - nowMs;
  if (Math.abs(delta) <= 150_000) return 'now';
  return delta < 0 ? 'observed' : 'forecast';
}

export function mergeTimeline(
  radarPoints: TimelinePoint[],
  forecastPoints: TimelinePoint[],
  nowMs = Date.now(),
): TimelinePoint[] {
  if (radarPoints.length === 0) {
    return markNearestAsNow(forecastPoints, nowMs);
  }

  const sortedRadar = [...radarPoints].sort((a, b) => a.epochMs - b.epochMs);
  const firstRadar = sortedRadar[0].epochMs;
  const lastRadar = sortedRadar.at(-1)!.epochMs;
  const merged = [
    ...forecastPoints.filter((point) => point.epochMs < firstRadar),
    ...sortedRadar,
    ...forecastPoints.filter((point) => point.epochMs > lastRadar),
  ].sort((a, b) => a.epochMs - b.epochMs);

  return markNearestAsNow(merged, nowMs);
}

function markNearestAsNow(points: TimelinePoint[], nowMs: number): TimelinePoint[] {
  if (points.length === 0) return [];
  let nearestIndex = 0;
  let nearestDistance = Number.POSITIVE_INFINITY;
  points.forEach((point, index) => {
    const distance = Math.abs(point.epochMs - nowMs);
    if (distance < nearestDistance) {
      nearestIndex = index;
      nearestDistance = distance;
    }
  });

  return points.map((point, index) => ({
    ...point,
    phase: index === nearestIndex ? 'now' : phaseForTimestamp(point.epochMs, nowMs),
  }));
}

export function radarSampleToTimelinePoint(
  id: string,
  timestamp: string,
  precipitationRate: number,
  nowMs = Date.now(),
): TimelinePoint {
  const epochMs = Date.parse(timestamp);
  return {
    id,
    timestamp,
    epochMs,
    intervalMinutes: 5,
    phase: phaseForTimestamp(epochMs, nowMs),
    source: 'bright-sky',
    precipitationRate,
    precipitationAmount: precipitationRate / 12,
    intensity: classifyPrecipitation(precipitationRate),
    thunderRisk: 0,
    mapFrameId: id,
  };
}
