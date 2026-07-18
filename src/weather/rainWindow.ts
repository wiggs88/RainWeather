import type {
  Confidence,
  Intensity,
  RainSummary,
  TimelinePoint,
} from './types';

export const RAIN_RATE_THRESHOLDS = {
  dry: 0.1,
  trace: 0.3,
  light: 1.5,
  moderate: 5,
} as const;

const MIN_DRY_WINDOW_MINUTES = 15;

export function classifyPrecipitation(rateMmPerHour: number): Intensity {
  if (!Number.isFinite(rateMmPerHour) || rateMmPerHour < RAIN_RATE_THRESHOLDS.dry) {
    return 'dry';
  }
  if (rateMmPerHour < RAIN_RATE_THRESHOLDS.trace) return 'trace';
  if (rateMmPerHour < RAIN_RATE_THRESHOLDS.light) return 'light';
  if (rateMmPerHour < RAIN_RATE_THRESHOLDS.moderate) return 'moderate';
  return 'heavy';
}

function nearestPointIndex(points: TimelinePoint[], nowMs: number): number {
  let nearest = 0;
  let distance = Number.POSITIVE_INFINITY;

  for (let index = 0; index < points.length; index += 1) {
    const nextDistance = Math.abs(points[index].epochMs - nowMs);
    if (nextDistance < distance) {
      nearest = index;
      distance = nextDistance;
    }
  }

  return nearest;
}

function findDryRun(
  points: TimelinePoint[],
  startIndex: number,
): { startIndex: number; endIndex: number } | undefined {
  let runStart: number | undefined;
  let accumulatedMinutes = 0;

  for (let index = startIndex; index < points.length; index += 1) {
    const isDry = points[index].intensity === 'dry';
    if (!isDry) {
      runStart = undefined;
      accumulatedMinutes = 0;
      continue;
    }

    if (runStart === undefined) runStart = index;
    accumulatedMinutes += points[index].intervalMinutes;

    if (accumulatedMinutes >= MIN_DRY_WINDOW_MINUTES) {
      let endIndex = index + 1;
      while (endIndex < points.length && points[endIndex].intensity === 'dry') {
        endIndex += 1;
      }
      return { startIndex: runStart, endIndex: Math.min(endIndex, points.length - 1) };
    }
  }

  return undefined;
}

function confidenceFor(points: TimelinePoint[], currentIndex: number, nowMs: number): Confidence {
  const current = points[currentIndex];
  const ageMinutes = Math.abs(current.epochMs - nowMs) / 60_000;
  if (current.source === 'bright-sky' && ageMinutes <= 15) return 'high';
  if (current.source === 'bright-sky' || ageMinutes <= 30) return 'medium';
  return 'low';
}

function roundedMinutes(epochMs: number, nowMs: number): number {
  return Math.max(0, Math.round((epochMs - nowMs) / 300_000) * 5);
}

export function buildRainSummary(
  points: TimelinePoint[],
  nowMs = Date.now(),
): RainSummary {
  if (points.length === 0) {
    return {
      headline: 'NO FORECAST DATA',
      detail: 'Try refreshing in a moment.',
      confidence: 'low',
      currentIntensity: 'dry',
    };
  }

  const currentIndex = nearestPointIndex(points, nowMs);
  const current = points[currentIndex];
  const confidence = confidenceFor(points, currentIndex, nowMs);
  const dryRun = findDryRun(points, currentIndex);

  if (current.intensity !== 'dry') {
    if (!dryRun) {
      return {
        headline: 'RAIN CONTINUING',
        detail: 'No reliable dry gap in the visible forecast.',
        confidence,
        currentIntensity: current.intensity,
      };
    }

    const dryStart = points[dryRun.startIndex].epochMs;
    const dryEnd = points[dryRun.endIndex]?.epochMs ?? points.at(-1)!.epochMs;
    const minutes = roundedMinutes(dryStart, nowMs);

    return {
      headline: minutes <= 5 ? 'RAIN ENDING SOON' : `RAIN FOR ABOUT ${minutes} MIN`,
      detail: 'A useful dry window follows.',
      confidence,
      currentIntensity: current.intensity,
      nextChangeEpochMs: dryStart,
      dryWindowStartEpochMs: dryStart,
      dryWindowEndEpochMs: dryEnd,
    };
  }

  const nextWetIndex = points.findIndex(
    (point, index) => index > currentIndex && point.intensity !== 'dry',
  );

  if (nextWetIndex === -1) {
    return {
      headline: 'DRY FOR NOW',
      detail: 'No meaningful rain in the visible forecast.',
      confidence,
      currentIntensity: 'dry',
      dryWindowStartEpochMs: current.epochMs,
      dryWindowEndEpochMs: points.at(-1)!.epochMs,
    };
  }

  const rainStart = points[nextWetIndex].epochMs;
  const minutes = roundedMinutes(rainStart, nowMs);
  return {
    headline: minutes <= 5 ? 'RAIN STARTING SOON' : `DRY FOR ABOUT ${minutes} MIN`,
    detail: 'Rain is expected after this gap.',
    confidence,
    currentIntensity: 'dry',
    nextChangeEpochMs: rainStart,
    dryWindowStartEpochMs: current.epochMs,
    dryWindowEndEpochMs: rainStart,
  };
}
