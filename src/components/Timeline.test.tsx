import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { TimelinePoint } from '../weather/types';
import { Timeline } from './Timeline';

const START = Date.parse('2026-07-18T20:00:00Z');

afterEach(cleanup);

function point(index: number, minutes = index * 15): TimelinePoint {
  const epochMs = START + minutes * 60_000;
  return {
    id: `point-${index}`,
    timestamp: new Date(epochMs).toISOString(),
    epochMs,
    intervalMinutes: 15,
    phase: index === 1 ? 'now' : index < 1 ? 'observed' : 'forecast',
    source: 'open-meteo',
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
    Object.defineProperty(slider, 'hasPointerCapture', {
      configurable: true,
      value: vi.fn(() => true),
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

  it('uses actual timestamps and ignores duplicate pointer frames', () => {
    const onSelect = vi.fn();
    const points = [point(0, 0), point(1, 5), point(2, 10), point(3, 25), point(4, 40)];
    render(
      <Timeline points={points} selectedIndex={0} onSelect={onSelect} timezone="UTC" />,
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

    fireEvent.pointerDown(slider, { pointerId: 2, pointerType: 'touch', clientX: 62.5 });
    fireEvent.pointerMove(slider, { pointerId: 2, pointerType: 'touch', clientX: 63 });
    fireEvent.pointerMove(slider, { pointerId: 2, pointerType: 'touch', clientX: 25 });

    expect(onSelect.mock.calls).toEqual([[3], [2]]);
  });

  it('stops updating after pointer cancellation', () => {
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

    fireEvent.pointerDown(slider, { pointerId: 3, pointerType: 'touch', clientX: 25 });
    fireEvent.pointerCancel(slider, { pointerId: 3, pointerType: 'touch', clientX: 25 });
    fireEvent.pointerMove(slider, { pointerId: 3, pointerType: 'touch', clientX: 100 });

    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('supports arrow and boundary keyboard controls', () => {
    const onSelect = vi.fn();
    render(
      <Timeline
        points={[0, 1, 2, 3, 4].map(point)}
        selectedIndex={2}
        onSelect={onSelect}
        timezone="UTC"
      />,
    );

    const slider = screen.getByRole('slider');
    fireEvent.keyDown(slider, { key: 'ArrowRight' });
    fireEvent.keyDown(slider, { key: 'ArrowLeft' });
    fireEvent.keyDown(slider, { key: 'Home' });
    fireEvent.keyDown(slider, { key: 'End' });

    expect(onSelect.mock.calls).toEqual([[3], [1], [0], [4]]);
  });
});
