import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { LocationDuck } from './LocationDuck';

afterEach(cleanup);

describe('LocationDuck', () => {
  it('shows just the duck when it is dry', () => {
    const { container } = render(<LocationDuck intensity="dry" />);

    expect(container.querySelector('.duck-umbrella')).toBeNull();
    expect(container.querySelectorAll('.duck-drop')).toHaveLength(0);
  });

  it('adds an umbrella and more rain as intensity rises', () => {
    const { container, rerender } = render(<LocationDuck intensity="light" />);
    const light = container.querySelectorAll('.duck-drop').length;

    rerender(<LocationDuck intensity="heavy" />);

    expect(container.querySelector('.duck-umbrella')).not.toBeNull();
    expect(light).toBeGreaterThan(0);
    expect(container.querySelectorAll('.duck-drop').length).toBeGreaterThan(light);
  });
});
