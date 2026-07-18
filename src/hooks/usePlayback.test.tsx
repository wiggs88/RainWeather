import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { TimelinePoint } from '../weather/types';
import { usePlayback } from './usePlayback';

const NOW = Date.parse('2026-07-18T20:00:00Z');

function point(index: number, mapFrame = false): TimelinePoint {
  const epochMs = NOW + (index - 2) * 5 * 60_000;
  return {
    id: `point-${index}`,
    timestamp: new Date(epochMs).toISOString(),
    epochMs,
    intervalMinutes: 5,
    phase: index === 2 ? 'now' : index < 2 ? 'observed' : 'forecast',
    source: mapFrame ? 'bright-sky' : 'icon-d2',
    precipitationRate: 0,
    precipitationAmount: 0,
    intensity: 'dry',
    thunderRisk: 0,
    mapFrameId: mapFrame ? `frame-${index}` : undefined,
  };
}

describe('usePlayback', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn().mockImplementation(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });
  });

  afterEach(() => vi.useRealTimers());

  it('loops autoplay inside the radar frame window', () => {
    const points = [point(0), point(1, true), point(2, true), point(3, true), point(4)];
    const { result } = renderHook(() => usePlayback(points));

    expect(result.current.selectedIndex).toBe(2);
    expect(result.current.isPlaying).toBe(true);

    act(() => vi.advanceTimersByTime(1100));
    expect(result.current.selectedIndex).toBe(3);

    act(() => vi.advanceTimersByTime(480));
    expect(result.current.selectedIndex).toBe(1);
  });

  it('manual selection pauses playback', () => {
    const points = [point(0), point(1, true), point(2, true), point(3, true)];
    const { result } = renderHook(() => usePlayback(points));

    act(() => result.current.setSelectedIndex(0));
    expect(result.current.selectedIndex).toBe(0);
    expect(result.current.isPlaying).toBe(false);
  });
});
