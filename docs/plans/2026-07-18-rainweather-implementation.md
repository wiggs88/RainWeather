# RainWeather Implementation Plan

**Date:** 2026-07-18  
**Design:** `docs/plans/2026-07-18-rainweather-design.md`

## 1. Project foundation

Create a Vite React TypeScript application with a small, explicit dependency set:

- `react`, `react-dom`
- `ol`, `ol-mapbox-style`, `proj4`, `pako`
- `@fontsource-variable/roboto-mono`
- `vite-plugin-pwa`
- `vitest`, Testing Library, and `jsdom` for automated checks

Configure strict TypeScript, linting, test scripts, PWA metadata, and a production build. Establish global design tokens for the minimal dark visual system.

## 2. Domain model and fixtures

Create typed models for:

- Locations and geocoding results.
- Weather source freshness and precision.
- Observed, current, and forecast timeline points.
- Radar frames and map frame state.
- Rain-window summaries and confidence.
- Weather warnings and thunder markers.

Add representative fixtures for dry weather, continuous rain, a short dry gap, thunderstorms, stale data, and unavailable radar. These fixtures power UI development and unit tests before live integrations are complete.

## 3. Map-first application shell

Build the responsive layout:

- Full-viewport map surface.
- Compact top location/search bar.
- Location marker and recenter control.
- Mobile bottom timeline panel.
- Desktop side timeline panel.
- Source/freshness label and minimal error notice.

Apply self-hosted Roboto Mono, flat panels, one-pixel borders, subdued map colors, and weather-only accent colors. Verify keyboard focus and mobile touch targets.

## 4. Shared playback and timeline

Implement one playback controller shared by map and timeline:

- Play, pause, loop, and direct frame selection.
- Five-minute frame labels.
- Observed/now/forecast segmentation.
- Brief pause at the current-time boundary.
- Reduced-motion behavior.
- Page-visibility pause.

Build the local rain graph as an accessible scrubber. Selecting a graph segment updates the map frame and status text.

## 5. Weather source adapters

Implement isolated adapters with runtime validation and abortable requests:

- Open-Meteo geocoding.
- Open-Meteo DWD ICON-D2 15-minute forecast.
- Bright Sky DWD radar.
- Bright Sky DWD alerts where available.
- RainViewer frame metadata for degraded historical-radar fallback.

Keep API-specific response types inside the adapters. Convert all successful results into the common domain model.

## 6. DWD radar rendering

Define the DE1200 projection with Proj4. Request a bounded Bright Sky radar area around the selected location.

In a Web Worker:

- Decode base64 and zlib-compressed precipitation values.
- Convert values to an accessible cyan/blue/violet RGBA palette.
- Generate frame image data progressively.
- Return frame geometry and timestamps to the main thread.

Use OpenLayers image sources for accurate browser reprojection. Preload adjacent frames and swap sources without transition blur. Apply an OpenFreeMap vector style beneath the radar.

## 7. Rain-window engine

Normalize five-minute radar and 15-minute forecast data onto a common timeline. Implement pure functions for:

- Trace, light, moderate, and heavy precipitation categories.
- Neighborhood sampling.
- Current rain start/stop estimates.
- Consecutive-frame dry-window detection.
- Source handoff after radar nowcast ends.
- Confidence based on freshness, source, interpolation, and disagreement.

Unit-test all threshold boundaries and edge cases. Keep thresholds centralized for later real-world tuning.

## 8. Live-data orchestration and fallbacks

On location change, fetch radar, forecast, and alerts concurrently with cancellation of obsolete requests.

Fallback order:

1. Fresh Bright Sky radar plus Open-Meteo forecast.
2. RainViewer historical radar plus Open-Meteo forecast.
3. Open-Meteo forecast without radar animation.
4. Last successful cached data with a stale timestamp.

Persist the chosen location, cached response metadata, and user map preferences locally. Refresh radar on a five-minute cadence while the page is visible.

## 9. Verification

- Run type checking, linting, unit tests, and production build.
- Verify PWA manifest and service-worker output.
- Test compact mobile, tablet, and desktop layouts.
- Test keyboard timeline control and reduced motion.
- Simulate empty, stale, malformed, and slow source responses.
- Inspect live data for several German locations.
- Compare dry/rain timing with official DWD/WetterOnline radar during a live precipitation event.

## Initial file layout

```text
src/
  app/
    App.tsx
  components/
    LocationSearch.tsx
    RadarMap.tsx
    RainStatus.tsx
    Timeline.tsx
    WeatherPanel.tsx
  hooks/
    usePlayback.ts
    useWeatherData.ts
  radar/
    dwdProjection.ts
    palette.ts
    radar.worker.ts
  weather/
    brightSky.ts
    openMeteo.ts
    rainViewer.ts
    rainWindow.ts
    normalize.ts
    types.ts
  test/
    fixtures.ts
  styles/
    global.css
```
