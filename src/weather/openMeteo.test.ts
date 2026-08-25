import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchForecast } from './openMeteo';
import type { Location } from './types';

const LOCATION: Location = {
  id: 'test',
  name: 'Test',
  detail: 'Test location',
  latitude: 52.52,
  longitude: 13.405,
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchForecast', () => {
  it('requests worldwide best-match data and parses 15-minute values', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        minutely_15: {
          time: [Date.parse('2026-07-20T12:00:00Z') / 1000],
          precipitation: [0],
          lightning_potential: [0],
          temperature_2m: [21.4],
        },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const points = await fetchForecast(
      LOCATION,
      undefined,
      Date.parse('2026-07-20T12:00:00'),
    );

    const requestedUrl = fetchMock.mock.calls[0][0] as URL;
    expect(requestedUrl.origin + requestedUrl.pathname).toBe(
      'https://api.open-meteo.com/v1/forecast',
    );
    expect(requestedUrl.searchParams.has('models')).toBe(false);
    expect(requestedUrl.searchParams.get('timeformat')).toBe('unixtime');
    expect(requestedUrl.searchParams.get('timezone')).toBe('GMT');
    expect(requestedUrl.searchParams.get('minutely_15')).toContain('temperature_2m');
    expect(points[0].temperatureC).toBe(21.4);
    expect(points[0].source).toBe('open-meteo');
  });
});
