import { describe, expect, it } from 'vitest';
import { dwdSitesInBbox, isWithinDwdCoverage } from './coverage';

describe('isWithinDwdCoverage', () => {
  it.each([
    ['Frankfurt', 50.11, 8.68, true],
    ['Freiburg', 47.99, 7.85, true],
    ['Strasbourg', 48.58, 7.75, true],
    ['Salzburg', 47.8, 13.04, true],
    ['Paris', 48.85, 2.35, false],
    ['Amsterdam', 52.37, 4.9, false],
    ['Vienna', 48.21, 16.37, false],
    ['Milan', 45.46, 9.19, false],
  ])('%s → %s', (_name, lat, lon, expected) => {
    expect(isWithinDwdCoverage(lat, lon)).toBe(expected);
  });
});

describe('dwdSitesInBbox', () => {
  it('places Feldberg near Freiburg inside the Freiburg radar crop', () => {
    // Bright Sky's crop around Freiburg; Freiburg itself sits at ~(200, 200).
    const sites = dwdSitesInBbox([752, 171, 1152, 571]);
    const feldberg = sites[5];
    expect(feldberg.x).toBeGreaterThan(200);
    expect(feldberg.x).toBeLessThan(230);
    expect(Math.abs(feldberg.y - 200)).toBeLessThan(20);
  });
});
