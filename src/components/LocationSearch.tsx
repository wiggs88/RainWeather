import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from 'react';
import { searchLocations } from '../weather/openMeteo';
import type { Location } from '../weather/types';
import { LocationIcon, SearchIcon } from './Icons';

interface LocationSearchProps {
  location: Location;
  onSelect: (location: Location) => void;
}

const SEARCH_DELAY_MS = 250;
const RESULTS_ID = 'location-results';

export function LocationSearch({ location, onSelect }: LocationSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Location[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [message, setMessage] = useState<string>();
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isDismissed, setIsDismissed] = useState(false);
  const searchController = useRef<AbortController | undefined>(undefined);
  const searchTimer = useRef<number | undefined>(undefined);
  const searchSequence = useRef(0);

  const runSearch = useCallback(async (nextQuery: string) => {
    searchController.current?.abort();
    const controller = new AbortController();
    searchController.current = controller;
    const sequence = ++searchSequence.current;
    setIsSearching(true);
    setMessage(undefined);

    try {
      const nextResults = await searchLocations(nextQuery, controller.signal);
      if (controller.signal.aborted || sequence !== searchSequence.current) return;
      setResults(nextResults);
      setActiveIndex(nextResults.length > 0 ? 0 : -1);
      if (nextResults.length === 0) setMessage('NO LOCATIONS FOUND');
    } catch (error) {
      if (
        sequence === searchSequence.current &&
        !(error instanceof DOMException && error.name === 'AbortError')
      ) {
        setResults([]);
        setActiveIndex(-1);
        setMessage('SEARCH UNAVAILABLE');
      }
    } finally {
      if (!controller.signal.aborted && sequence === searchSequence.current) {
        setIsSearching(false);
      }
    }
  }, []);

  useEffect(() => {
    if (searchTimer.current !== undefined) window.clearTimeout(searchTimer.current);
    searchController.current?.abort();
    searchSequence.current += 1;

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setMessage(undefined);
      setIsSearching(false);
      setActiveIndex(-1);
      return;
    }

    searchTimer.current = window.setTimeout(() => {
      searchTimer.current = undefined;
      void runSearch(trimmed);
    }, SEARCH_DELAY_MS);

    return () => {
      if (searchTimer.current !== undefined) window.clearTimeout(searchTimer.current);
    };
  }, [query, runSearch]);

  useEffect(
    () => () => {
      searchController.current?.abort();
      if (searchTimer.current !== undefined) window.clearTimeout(searchTimer.current);
    },
    [],
  );

  const selectResult = (result: Location) => {
    searchController.current?.abort();
    onSelect(result);
    setQuery('');
    setResults([]);
    setMessage(undefined);
    setActiveIndex(-1);
    setIsDismissed(true);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (activeIndex >= 0 && results[activeIndex]) {
      selectResult(results[activeIndex]);
      return;
    }
    const trimmed = query.trim();
    if (trimmed.length < 2) return;
    if (searchTimer.current !== undefined) {
      window.clearTimeout(searchTimer.current);
      searchTimer.current = undefined;
    }
    setIsDismissed(false);
    void runSearch(trimmed);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      setIsDismissed(true);
      setActiveIndex(-1);
      return;
    }
    if (results.length === 0) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setIsDismissed(false);
      setActiveIndex((current) => (current + 1) % results.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setIsDismissed(false);
      setActiveIndex((current) => (current <= 0 ? results.length - 1 : current - 1));
    }
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

  const showResults =
    !isDismissed && query.trim().length >= 2 && (isSearching || results.length > 0 || Boolean(message));

  return (
    <header className="location-shell">
      <div className="brand" aria-label="HOWDRY?!">
        <span className="brand-mark" aria-hidden="true" />
        <span>HOWDRY?!</span>
      </div>
      <form className="location-search" onSubmit={handleSubmit} role="search">
        <label className="sr-only" htmlFor="location-query">
          Search city or postal code
        </label>
        <SearchIcon />
        <input
          id="location-query"
          value={query}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showResults}
          aria-controls={RESULTS_ID}
          aria-activedescendant={activeIndex >= 0 ? `location-option-${activeIndex}` : undefined}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsDismissed(false);
            setActiveIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsDismissed(false)}
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

      {showResults ? (
        <div className="search-results" id={RESULTS_ID} role="listbox" aria-live="polite">
          {isSearching ? <p className="search-message">SEARCHING…</p> : null}
          {!isSearching && message ? <p className="search-message">{message}</p> : null}
          {!isSearching && results.map((result, index) => (
            <button
              id={`location-option-${index}`}
              key={result.id}
              type="button"
              role="option"
              aria-selected={index === activeIndex}
              className={index === activeIndex ? 'is-active' : undefined}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => selectResult(result)}
            >
              <strong>{result.name}</strong>
              <span>{result.detail}</span>
            </button>
          ))}
        </div>
      ) : null}
    </header>
  );
}
