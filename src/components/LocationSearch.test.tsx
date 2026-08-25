import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { searchLocations } from '../weather/openMeteo';
import type { Location } from '../weather/types';
import { LocationSearch } from './LocationSearch';

vi.mock('../weather/openMeteo', () => ({
  searchLocations: vi.fn(),
}));

const berlin: Location = {
  id: 'berlin',
  name: 'Berlin',
  detail: 'Berlin, Germany',
  latitude: 52.52,
  longitude: 13.405,
};

const cardiff: Location = {
  id: 'cardiff',
  name: 'Cardiff',
  detail: 'Wales, United Kingdom',
  latitude: 51.4816,
  longitude: -3.1791,
};

const caerphilly: Location = {
  id: 'caerphilly',
  name: 'Caerphilly',
  detail: 'Wales, United Kingdom',
  latitude: 51.5788,
  longitude: -3.218,
};

const mockedSearchLocations = vi.mocked(searchLocations);

async function finishDebounce() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(250);
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  mockedSearchLocations.mockReset();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('LocationSearch', () => {
  it('searches after two characters and a short debounce', async () => {
    mockedSearchLocations.mockResolvedValue([cardiff]);
    render(<LocationSearch location={berlin} onSelect={vi.fn()} />);

    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'C' } });
    await finishDebounce();
    expect(mockedSearchLocations).not.toHaveBeenCalled();

    fireEvent.change(input, { target: { value: 'Ca' } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(249);
    });
    expect(mockedSearchLocations).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(mockedSearchLocations).toHaveBeenCalledWith('Ca', expect.any(AbortSignal));
    expect(screen.getByRole('option', { name: /Cardiff/i })).toBeInTheDocument();
  });

  it('keeps only results from the latest query', async () => {
    const requests = new Map<string, (locations: Location[]) => void>();
    mockedSearchLocations.mockImplementation(
      (query) => new Promise<Location[]>((resolve) => requests.set(query, resolve)),
    );
    render(<LocationSearch location={berlin} onSelect={vi.fn()} />);

    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'Ca' } });
    await finishDebounce();
    fireEvent.change(input, { target: { value: 'Car' } });
    await finishDebounce();

    await act(async () => requests.get('Car')?.([cardiff]));
    await act(async () => requests.get('Ca')?.([caerphilly]));

    expect(screen.getByRole('option', { name: /Cardiff/i })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /Caerphilly/i })).not.toBeInTheDocument();
  });

  it('supports arrow selection, Enter, and Escape', async () => {
    mockedSearchLocations.mockResolvedValue([cardiff, caerphilly]);
    const onSelect = vi.fn();
    render(<LocationSearch location={berlin} onSelect={onSelect} />);

    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'Ca' } });
    await finishDebounce();
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.submit(input.closest('form')!);

    expect(onSelect).toHaveBeenCalledWith(caerphilly);
    expect(input).toHaveValue('');

    fireEvent.change(input, { target: { value: 'Ca' } });
    await finishDebounce();
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('keeps GO as an immediate search fallback', async () => {
    mockedSearchLocations.mockResolvedValue([cardiff]);
    render(<LocationSearch location={berlin} onSelect={vi.fn()} />);

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Cardiff' } });
    fireEvent.click(screen.getByRole('button', { name: 'GO' }));
    await act(async () => Promise.resolve());

    expect(mockedSearchLocations).toHaveBeenCalledTimes(1);
    expect(mockedSearchLocations).toHaveBeenCalledWith('Cardiff', expect.any(AbortSignal));
  });
});
