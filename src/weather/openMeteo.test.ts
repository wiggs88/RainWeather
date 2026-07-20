import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchDwdForecast } from './openMeteo';
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

describe('fetchDwdForecast', () => {
  it('requests and parses 15-minute temperature values', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        minutely_15: {
          time: ['2026-07-20T12:00'],
          precipitation: [0],
          lightning_potential: [0],
          temperature_2m: [21.4],
        },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const points = await fetchDwdForecast(
      LOCATION,
      undefined,
      Date.parse('2026-07-20T12:00:00'),
    );

    const requestedUrl = fetchMock.mock.calls[0][0] as URL;
    expect(requestedUrl.searchParams.get('minutely_15')).toContain('temperature_2m');
    expect(points[0].temperatureC).toBe(21.4);
  });
});
