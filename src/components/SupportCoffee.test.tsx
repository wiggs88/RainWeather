import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { SupportCoffee } from './SupportCoffee';

afterEach(cleanup);

describe('SupportCoffee', () => {
  it('opens the free-forever note from the coffee cup', () => {
    render(<SupportCoffee />);

    expect(screen.queryByText(/always be free/)).not.toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Support HOWDRY?!' }));

    expect(screen.getByRole('dialog')).toBeVisible();
    expect(screen.getByText(/I just want you to stay dry/)).toBeVisible();
    expect(screen.getByRole('link', { name: /Buy me a coffee/ })).toHaveAttribute(
      'href',
      expect.stringMatching(/^https:\/\/buy\.stripe\.com\//),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByText(/always be free/)).not.toBeVisible();
  });
});
