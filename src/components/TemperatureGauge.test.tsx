import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { TemperatureGauge } from './TemperatureGauge';

afterEach(cleanup);

describe('TemperatureGauge', () => {
  it('updates its value when the selected timeline temperature changes', () => {
    const { rerender } = render(<TemperatureGauge temperatureC={12.4} />);
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuenow', '12.4');
    expect(screen.getByText('12°')).toBeInTheDocument();

    rerender(<TemperatureGauge temperatureC={18.8} />);
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuenow', '18.8');
    expect(screen.getByText('19°')).toBeInTheDocument();
  });

  it('keeps a stable fallback when temperature is unavailable', () => {
    render(<TemperatureGauge />);
    expect(screen.getByRole('status')).toHaveAccessibleName('Temperature unavailable');
    expect(screen.getByText('—°')).toBeInTheDocument();
  });
});
