import { describe, expect, it } from 'vitest';
import { mergeTimeline, radarSampleToTimelinePoint } from './normalize';
import { classifyPrecipitation } from './rainWindow';
import type { TimelinePoint } from './types';

const NOW = Date.parse('2026-07-18T18:00:00Z');

function forecast(minutes: number): TimelinePoint {
  const epochMs = NOW + minutes * 60_000;
  return {
    id: `forecast-${minutes}`,
    timestamp: new Date(epochMs).toISOString(),
    epochMs,
    intervalMinutes: 15,
    phase: 'forecast',
    source: 'icon-d2',
    precipitationRate: 1,
    precipitationAmount: 0.25,
    intensity: classifyPrecipitation(1),
    thunderRisk: 0,
  };
}

describe('mergeTimeline', () => {
  it('uses radar throughout its window and forecast after it', () => {
    const radar = [-5, 0, 5].map((minutes) =>
      radarSampleToTimelinePoint(
        `radar-${minutes}`,
        new Date(NOW + minutes * 60_000).toISOString(),
        2,
        NOW,
      ),
    );
    const merged = mergeTimeline(radar, [-15, 0, 15, 30].map(forecast), NOW);

    expect(merged.map((point) => point.id)).toEqual([
      'forecast--15',
      'radar--5',
      'radar-0',
      'radar-5',
      'forecast-15',
      'forecast-30',
    ]);
    expect(merged.find((point) => point.phase === 'now')?.id).toBe('radar-0');
  });

  it('returns forecast-only data when radar is unavailable', () => {
    const merged = mergeTimeline([], [forecast(0), forecast(15)], NOW);
    expect(merged).toHaveLength(2);
    expect(merged[0].phase).toBe('now');
  });
});
