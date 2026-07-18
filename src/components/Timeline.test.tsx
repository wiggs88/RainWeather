import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { TimelinePoint } from '../weather/types';
import { Timeline } from './Timeline';

const START = Date.parse('2026-07-18T20:00:00Z');

function point(index: number): TimelinePoint {
  const epochMs = START + index * 15 * 60_000;
  return {
    id: `point-${index}`,
    timestamp: new Date(epochMs).toISOString(),
    epochMs,
    intervalMinutes: 15,
    phase: index === 1 ? 'now' : index < 1 ? 'observed' : 'forecast',
    source: 'icon-d2',
    precipitationRate: index,
    precipitationAmount: index / 4,
    intensity: index > 2 ? 'light' : 'dry',
    thunderRisk: 0,
  };
}

describe('Timeline', () => {
  it('scrubs across the full chart with pointer movement', () => {
    const onSelect = vi.fn();
    render(
      <Timeline
        points={[0, 1, 2, 3, 4].map(point)}
        selectedIndex={1}
        onSelect={onSelect}
        timezone="UTC"
      />,
    );

    const slider = screen.getByRole('slider');
    Object.defineProperty(slider, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({ left: 0, right: 100, width: 100, top: 0, bottom: 50, height: 50 }),
    });
    Object.defineProperty(slider, 'setPointerCapture', {
      configurable: true,
      value: vi.fn(),
    });
    Object.defineProperty(slider, 'releasePointerCapture', {
      configurable: true,
      value: vi.fn(),
    });

    fireEvent.pointerDown(slider, { pointerId: 1, pointerType: 'touch', clientX: 25 });
    fireEvent.pointerMove(slider, { pointerId: 1, pointerType: 'touch', clientX: 100 });
    fireEvent.pointerUp(slider, { pointerId: 1, pointerType: 'touch', clientX: 100 });

    expect(onSelect).toHaveBeenCalledWith(1);
    expect(onSelect).toHaveBeenLastCalledWith(4);
  });
});
