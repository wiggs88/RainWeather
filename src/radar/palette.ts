function mix(start: number, end: number, amount: number): number {
  return Math.round(start + (end - start) * amount);
}

function mixColor(
  start: [number, number, number],
  end: [number, number, number],
  amount: number,
): [number, number, number] {
  return [
    mix(start[0], end[0], amount),
    mix(start[1], end[1], amount),
    mix(start[2], end[2], amount),
  ];
}

export function rateToRgba(rate: number): [number, number, number, number] {
  if (!Number.isFinite(rate) || rate < 0.1) return [0, 0, 0, 0];

  if (rate < 1.5) {
    const color = mixColor([88, 216, 245], [22, 140, 255], rate / 1.5);
    return [...color, Math.round(110 + Math.min(1, rate / 1.5) * 35)];
  }
  if (rate < 5) {
    const color = mixColor([22, 140, 255], [49, 85, 255], (rate - 1.5) / 3.5);
    return [...color, 170];
  }

  const color = mixColor([49, 85, 255], [179, 107, 255], Math.min(1, (rate - 5) / 15));
  return [...color, 210];
}
