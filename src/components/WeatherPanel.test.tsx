import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PlaybackState } from '../hooks/usePlayback';
import type { TimelinePoint, WeatherSnapshot } from '../weather/types';
import { WeatherPanel } from './WeatherPanel';

afterEach(cleanup);

const point: TimelinePoint = {
  id: 'now',
  timestamp: '2026-07-20T12:00:00Z',
  epochMs: Date.parse('2026-07-20T12:00:00Z'),
  intervalMinutes: 15,
  phase: 'now',
  source: 'icon-d2',
  precipitationRate: 0,
  precipitationAmount: 0,
  temperatureC: 18.4,
  intensity: 'dry',
  thunderRisk: 0,
};

const snapshot: WeatherSnapshot = {
  location: {
    id: 'berlin',
    name: 'Berlin',
    detail: 'Berlin, Germany',
    latitude: 52.52,
    longitude: 13.405,
    timezone: 'Europe/Berlin',
  },
  timeline: [point],
  radarFrames: [],
  rainViewerFrames: [],
  alerts: [],
  summary: {
    headline: 'DRY FOR NOW',
    detail: 'No rain nearby',
    confidence: 'high',
    currentIntensity: 'dry',
  },
  updatedAt: Date.parse('2026-07-20T12:00:00Z'),
  radarMode: 'none',
  notices: [],
};

const playback: PlaybackState = {
  selectedIndex: 0,
  selectedPoint: point,
  isPlaying: false,
  setSelectedIndex: vi.fn(),
  togglePlayback: vi.fn(),
  jumpToNow: vi.fn(),
};

describe('WeatherPanel', () => {
  it('places the temperature gauge directly before the rain-intensity line', () => {
    const { container } = render(
      <WeatherPanel
        status="ready"
        snapshot={snapshot}
        playback={playback}
        onRefresh={vi.fn()}
      />,
    );

    const gauge = screen.getByRole('meter');
    const intensityLine = container.querySelector('.intensity-dot');
    const headlineRow = container.querySelector('.status-headline-row');

    expect(gauge.parentElement).toBe(headlineRow);
    expect(gauge.nextElementSibling).toBe(intensityLine);
    expect(screen.getByRole('heading', { name: 'DRY FOR NOW' })).toBeInTheDocument();
  });
});
