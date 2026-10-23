import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { WeatherAlert } from '../weather/types';
import { WeatherAlertCallout } from './WeatherAlertCallout';

afterEach(cleanup);

const alert: WeatherAlert = {
  id: 'gale',
  headline: 'Official WARNING of GALE-FORCE GUSTS',
  event: 'gale-force gusts',
  description: 'There is a risk of gale-force gusts (level 2 of 4).',
  instruction: 'Secure free-standing objects.',
  severity: 'moderate',
  expiresEpochMs: Date.now() + 60 * 60_000,
  sourceUrl: 'https://www.dwd.de/EN/weather/warnings/warnings_node.html',
};

describe('WeatherAlertCallout', () => {
  it('renders nothing without alerts', () => {
    const { container } = render(<WeatherAlertCallout alerts={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the warning in a bubble that opens the full details', () => {
    render(<WeatherAlertCallout alerts={[alert]} timezone="Europe/Berlin" />);

    const bubble = screen.getByRole('button', { name: /^Moderate warning: Gale-force gusts, until .*Show details$/ });
    expect(screen.queryByText(/Level 2 of 4/)).not.toBeVisible();

    fireEvent.click(bubble);

    expect(screen.getByRole('heading', { name: 'Weather warning' })).toBeVisible();
    expect(screen.getByText(/Level 2 of 4/)).toBeVisible();
    expect(screen.getByText('Secure free-standing objects')).toBeVisible();
    expect(screen.getByRole('link', { name: /DWD/ })).toHaveAttribute('href', alert.sourceUrl);

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByText(/Level 2 of 4/)).not.toBeVisible();
  });
});
