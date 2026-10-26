import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { SupportCoffee } from './SupportCoffee';

afterEach(cleanup);

describe('SupportCoffee', () => {
  it('opens the free-forever note from the coffee cup', () => {
    render(<SupportCoffee placement="corner" />);

    expect(screen.queryByText(/always be free/)).not.toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Support HOWDRY?!' }));

    expect(screen.getByRole('heading', { name: 'Free, forever.' })).toBeVisible();
    expect(screen.getByText(/I just want you to stay dry/)).toBeVisible();
    // No payment link is configured yet.
    expect(screen.getByText('Coffee button coming soon')).toBeVisible();

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByText(/always be free/)).not.toBeVisible();
  });
});
