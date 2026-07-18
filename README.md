# HOWDRY?!

A minimal, map-first rain radar for mobile and desktop browsers. HOWDRY?! combines animated DWD radar with a local precipitation timeline to estimate when rain will start, stop, and leave a useful dry window.

## Features

- Animated five-minute DWD radar frames around the selected location.
- Synchronized map playback and precipitation scrubber.
- Plain-language rain and dry-window estimates.
- Germany/Central Europe forecast from DWD ICON-D2 through Open-Meteo.
- City and postal-code search plus optional browser geolocation.
- Historical radar fallback through RainViewer.
- Cached last successful forecast and installable PWA shell.
- Responsive, keyboard-accessible, reduced-motion-aware interface.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

## Verify

```bash
npm run typecheck
npm test
npm run build
npm run preview
```

## Data sources

- [Bright Sky](https://brightsky.dev/) provides a JSON interface to DWD open radar and warning data.
- [Open-Meteo](https://open-meteo.com/en/docs/dwd-api) provides DWD ICON-D2 forecast data and geocoding.
- [RainViewer](https://www.rainviewer.com/api/weather-maps-api.html) provides degraded historical radar fallback tiles.
- [OpenFreeMap](https://openfreemap.org/) and OpenStreetMap provide the basemap.

The hosted Open-Meteo free API is limited to non-commercial use under its current terms. Provider attribution is displayed in the interface. Weather timing is an estimate and should not be treated as a safety guarantee.

## Architecture

The app is a static React/TypeScript PWA built with Vite. OpenLayers reprojects the DWD DE1200 radar grid in the browser. Radar decompression and color conversion run in a Web Worker. API-specific responses are normalized into one shared timeline that drives the map, scrubber, status, and rain-window engine.

See [the approved design](docs/plans/2026-07-18-rainweather-design.md) and [implementation plan](docs/plans/2026-07-18-rainweather-implementation.md).
