import { useRef, useState, type FormEvent } from 'react';
import { searchLocations } from '../weather/openMeteo';
import type { Location } from '../weather/types';
import { LocationIcon, SearchIcon } from './Icons';

interface LocationSearchProps {
  location: Location;
  onSelect: (location: Location) => void;
}

export function LocationSearch({ location, onSelect }: LocationSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Location[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [message, setMessage] = useState<string>();
  const searchController = useRef<AbortController | undefined>(undefined);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (query.trim().length < 2) return;
    searchController.current?.abort();
    const controller = new AbortController();
    searchController.current = controller;
    setIsSearching(true);
    setMessage(undefined);

    try {
      const nextResults = await searchLocations(query, controller.signal);
      setResults(nextResults);
      if (nextResults.length === 0) setMessage('NO LOCATIONS FOUND');
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        setMessage('SEARCH UNAVAILABLE');
      }
    } finally {
      if (!controller.signal.aborted) setIsSearching(false);
    }
  };

  const selectResult = (result: Location) => {
    onSelect(result);
    setQuery('');
    setResults([]);
    setMessage(undefined);
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setMessage('LOCATION NOT SUPPORTED');
      return;
    }

    setMessage('LOCATING…');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        onSelect({
          id: `geo-${latitude.toFixed(4)}-${longitude.toFixed(4)}`,
          name: 'Current location',
          detail: `${latitude.toFixed(3)}, ${longitude.toFixed(3)}`,
          latitude,
          longitude,
        });
        setMessage(undefined);
        setResults([]);
      },
      () => setMessage('LOCATION PERMISSION DENIED'),
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 300_000 },
    );
  };

  return (
    <header className="location-shell">
      <div className="brand" aria-label="RainWeather">
        <span className="brand-mark" aria-hidden="true" />
        <span>RAINWEATHER</span>
      </div>
      <form className="location-search" onSubmit={handleSubmit} role="search">
        <label className="sr-only" htmlFor="location-query">
          Search city or postal code
        </label>
        <SearchIcon />
        <input
          id="location-query"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={`${location.name.toUpperCase()} — SEARCH AREA`}
          autoComplete="off"
          enterKeyHint="search"
        />
        <button className="search-submit" type="submit" disabled={isSearching}>
          {isSearching ? '…' : 'GO'}
        </button>
      </form>
      <button
        className="icon-button locate-button"
        type="button"
        onClick={useCurrentLocation}
        aria-label="Use current location"
      >
        <LocationIcon />
      </button>

      {results.length > 0 || message ? (
        <div className="search-results" aria-live="polite">
          {message ? <p className="search-message">{message}</p> : null}
          {results.map((result) => (
            <button key={result.id} type="button" onClick={() => selectResult(result)}>
              <strong>{result.name}</strong>
              <span>{result.detail}</span>
            </button>
          ))}
        </div>
      ) : null}
    </header>
  );
}
