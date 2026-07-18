import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

const common = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

export function SearchIcon(props: IconProps) {
  return (
    <svg {...common} {...props}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

export function LocationIcon(props: IconProps) {
  return (
    <svg {...common} {...props}>
      <circle cx="12" cy="12" r="3" />
      <circle cx="12" cy="12" r="7" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    </svg>
  );
}

export function PlayIcon(props: IconProps) {
  return (
    <svg {...common} {...props}>
      <path d="m9 6 9 6-9 6Z" />
    </svg>
  );
}

export function PauseIcon(props: IconProps) {
  return (
    <svg {...common} {...props}>
      <path d="M9 7v10M15 7v10" />
    </svg>
  );
}

export function RefreshIcon(props: IconProps) {
  return (
    <svg {...common} {...props}>
      <path d="M19 7v4h-4" />
      <path d="M5.7 17A8 8 0 1 0 6 6.7L5 9" />
    </svg>
  );
}

export function CrosshairIcon(props: IconProps) {
  return (
    <svg {...common} {...props}>
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
      <circle cx="12" cy="12" r="4" />
    </svg>
  );
}
