import { describe, expect, it } from 'vitest';
import {
  buildRainSummary,
  classifyPrecipitation,
  formatDurationMinutes,
} from './rainWindow';
import type { TimelinePoint } from './types';

const NOW = Date.parse('2026-07-18T18:00:00Z');

function point(
  minutesFromNow: number,
  rate: number,
  source: TimelinePoint['source'] = 'bright-sky',
): TimelinePoint {
  const epochMs = NOW + minutesFromNow * 60_000;
  return {
    id: `${minutesFromNow}-${rate}`,
    timestamp: new Date(epochMs).toISOString(),
    epochMs,
    intervalMinutes: source === 'bright-sky' ? 5 : 15,
    phase: minutesFromNow === 0 ? 'now' : minutesFromNow < 0 ? 'observed' : 'forecast',
    source,
    precipitationRate: rate,
    precipitationAmount: rate / 12,
    intensity: classifyPrecipitation(rate),
    thunderRisk: 0,
  };
}

describe('classifyPrecipitation', () => {
  it('keeps negligible traces dry', () => {
    expect(classifyPrecipitation(0)).toBe('dry');
    expect(classifyPrecipitation(0.09)).toBe('dry');
    expect(classifyPrecipitation(Number.NaN)).toBe('dry');
  });

  it('classifies increasing rainfall', () => {
    expect(classifyPrecipitation(0.1)).toBe('trace');
    expect(classifyPrecipitation(0.3)).toBe('light');
    expect(classifyPrecipitation(1.5)).toBe('moderate');
    expect(classifyPrecipitation(5)).toBe('heavy');
  });
});

describe('formatDurationMinutes', () => {
  it('uses minutes below one hour', () => {
    expect(formatDurationMinutes(55)).toBe('55 MIN');
  });

  it('uses hours and remaining minutes from one hour onward', () => {
    expect(formatDurationMinutes(60)).toBe('1 HR');
    expect(formatDurationMinutes(95)).toBe('1 HR 35 MIN');
    expect(formatDurationMinutes(300)).toBe('5 HR');
  });
});

describe('buildRainSummary', () => {
  it('finds a useful dry window after current rain', () => {
    const points = [
      point(0, 2),
      point(5, 2),
      point(10, 1),
      point(15, 0),
      point(20, 0),
      point(25, 0),
      point(30, 0),
      point(35, 2),
    ];

    const summary = buildRainSummary(points, NOW);
    expect(summary.headline).toBe('RAIN FOR ABOUT 15 MIN');
    expect(summary.dryWindowStartEpochMs).toBe(NOW + 15 * 60_000);
    expect(summary.dryWindowEndEpochMs).toBe(NOW + 35 * 60_000);
    expect(summary.confidence).toBe('high');
  });

  it('ignores a dry gap shorter than fifteen minutes', () => {
    const points = [
      point(0, 2),
      point(5, 0),
      point(10, 0),
      point(15, 2),
      point(20, 0),
      point(25, 0),
      point(30, 0),
    ];

    const summary = buildRainSummary(points, NOW);
    expect(summary.dryWindowStartEpochMs).toBe(NOW + 20 * 60_000);
  });

  it('reports the next rain while it is currently dry', () => {
    const points = [point(0, 0), point(5, 0), point(10, 0), point(15, 1)];
    const summary = buildRainSummary(points, NOW);
    expect(summary.headline).toBe('DRY FOR ABOUT 15 MIN');
    expect(summary.nextChangeEpochMs).toBe(NOW + 15 * 60_000);
  });

  it('handles missing data without claiming a forecast', () => {
    expect(buildRainSummary([], NOW).headline).toBe('NO FORECAST DATA');
  });

  it('formats long rain windows in hours and minutes', () => {
    const points = [point(0, 0), point(60, 0), point(75, 1, 'open-meteo')];
    expect(buildRainSummary(points, NOW).headline).toBe('DRY FOR ABOUT 1 HR 15 MIN');
  });
});
