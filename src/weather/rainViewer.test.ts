import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchRainViewerFrames } from './rainViewer';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchRainViewerFrames', () => {
  it('requests unsmoothed radar tiles for pixel rendering', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          host: 'https://tilecache.rainviewer.com',
          radar: { past: [{ time: 1_700_000_000, path: '/v2/radar/example' }] },
        }),
      }),
    );

    const [frame] = await fetchRainViewerFrames();
    expect(frame.tileTemplate).toBe(
      'https://tilecache.rainviewer.com/v2/radar/example/256/{z}/{x}/{y}/2/0_1.png',
    );
  });
});
