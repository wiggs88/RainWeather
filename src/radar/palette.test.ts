import { describe, expect, it } from 'vitest';
import { rateToRgba } from './palette';

describe('rateToRgba', () => {
  it('keeps dry and invalid samples transparent', () => {
    expect(rateToRgba(0)).toEqual([0, 0, 0, 0]);
    expect(rateToRgba(Number.NaN)).toEqual([0, 0, 0, 0]);
  });

  it('moves from cool to warm colours as rain intensifies', () => {
    expect(rateToRgba(0.1)).toEqual([88, 216, 245, 130]);
    expect(rateToRgba(1)).toEqual([0, 119, 170, 175]);
    expect(rateToRgba(4)).toEqual([255, 238, 0, 215]);
    expect(rateToRgba(8)).toEqual([255, 149, 0, 225]);
    expect(rateToRgba(16)).toEqual([193, 0, 0, 235]);
    expect(rateToRgba(32)).toEqual([255, 108, 255, 240]);
    expect(rateToRgba(64)).toEqual([255, 255, 255, 245]);
  });
});
