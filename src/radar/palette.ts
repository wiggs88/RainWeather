type Rgba = [number, number, number, number];

// Shared cool-to-warm radar language, aligned with the published RainViewer
// Universal Blue progression and common mm/h intensity bands.
const INTENSITY_BANDS: ReadonlyArray<{ maxRate: number; color: Rgba }> = [
  { maxRate: 0.5, color: [88, 216, 245, 130] },
  { maxRate: 1, color: [0, 163, 224, 155] },
  { maxRate: 2, color: [0, 119, 170, 175] },
  { maxRate: 4, color: [0, 85, 136, 190] },
  { maxRate: 8, color: [255, 238, 0, 215] },
  { maxRate: 16, color: [255, 149, 0, 225] },
  { maxRate: 32, color: [193, 0, 0, 235] },
  { maxRate: 64, color: [255, 108, 255, 240] },
  { maxRate: Number.POSITIVE_INFINITY, color: [255, 255, 255, 245] },
];

export function rateToRgba(rate: number): Rgba {
  if (!Number.isFinite(rate) || rate < 0.1) return [0, 0, 0, 0];
  return INTENSITY_BANDS.find((band) => rate < band.maxRate)!.color;
}
