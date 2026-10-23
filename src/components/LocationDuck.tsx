import type { CSSProperties } from 'react';
import type { Intensity } from '../weather/types';

interface LocationDuckProps {
  intensity?: Intensity;
}

// Drop columns are relative to the 21px duck. Drops above the umbrella stop at
// the canopy; the ones beside it fall past the duck.
const DROPS = [
  { x: -12, delay: 0, short: false },
  { x: 24, delay: 0.35, short: false },
  { x: 2, delay: 0.6, short: true },
  { x: -7, delay: 0.85, short: false },
  { x: 29, delay: 0.15, short: false },
  { x: 11, delay: 0.5, short: true },
  { x: -16, delay: 0.7, short: false },
  { x: 16, delay: 0.95, short: true },
  { x: 33, delay: 0.55, short: false },
  { x: 6, delay: 0.25, short: true },
  { x: -3, delay: 0.1, short: true },
  { x: 15, delay: 0.8, short: true },
];

const DROP_COUNT: Record<Intensity, number> = {
  dry: 0,
  trace: 3,
  light: 6,
  moderate: 9,
  heavy: DROPS.length,
};

export function LocationDuck({ intensity = 'dry' }: LocationDuckProps) {
  const drops = DROPS.slice(0, DROP_COUNT[intensity]);
  const base = import.meta.env.BASE_URL;

  return (
    <div className={`location-duck${drops.length > 0 ? ' is-raining' : ''}`} aria-hidden="true">
      {drops.map((drop) => (
        <i
          key={drop.x}
          className={`duck-drop${drop.short ? ' is-short' : ''}`}
          style={
            {
              '--x': `${drop.x}px`,
              '--delay': `${drop.delay}s`,
              // Resting spot for reduced motion, spread out like a frozen frame.
              '--rest': `${Math.round(drop.short ? -27 + drop.delay * 8 : -24 + drop.delay * 44)}px`,
            } as CSSProperties
          }
        />
      ))}
      {drops.length > 0 ? (
        <img className="duck-umbrella" src={`${base}umbrella.png`} alt="" width={21} height={20} />
      ) : null}
      <img className="duck-sprite" src={`${base}duck.png`} alt="" width={21} height={21} />
    </div>
  );
}
