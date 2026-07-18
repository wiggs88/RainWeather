# RainWeather Design

**Date:** 2026-07-18  
**Status:** Approved

## Product goal

RainWeather is a lightweight, browser-based weather application focused on one practical question: when can the user avoid the rain?

The initial release targets Germany and Central Europe. It combines animated precipitation radar with a location-specific rain timeline and plain-language estimates for rain ending, rain starting, and the next useful dry window. It must work well in desktop and mobile browsers and be installable as a progressive web app, without app-store packaging.

## Product principles

- Lead with the animated radar map and synchronized timeline.
- Prefer a small number of immediately useful facts over a broad weather dashboard.
- Clearly distinguish observed radar, the current time, and forecast data.
- Never present short-range precipitation timing as guaranteed.
- Continue working when an enhanced radar source is delayed or unavailable.
- Keep the first version entirely client-side: no account, database, or custom backend.

## Visual direction

The interface uses strict functional minimalism and self-hosted Roboto Mono typography.

- Near-black, off-white, and muted grey form the interface palette.
- Cyan and blue represent increasing rain intensity.
- Violet represents thunderstorms, severe precipitation, and warnings.
- Weather data is the only strongly colored part of the interface.
- Panels are flat, with restrained corner radii and one-pixel separators.
- Decorative gradients, heavy shadows, glass effects, and card grids are avoided.
- Small uppercase labels identify metadata; the main rain status is large and plain.
- The map style is subdued so precipitation remains visually dominant.
- Controls remain compact and secondary to the radar.

## Main experience

### Map

The animated map occupies most of the viewport. A compact location search sits above it. The selected location is marked precisely, with a control for browser geolocation and a small layer/opacity control.

The map animates five-minute precipitation frames. Past frames are labelled `RADAR`; the current boundary is labelled `NOW`; future frames are labelled `FORECAST`. Playback pauses briefly at the current boundary before continuing into forecast frames.

### Timeline panel

On mobile, the timeline is a fixed compact bottom panel that may expand for more detail. On desktop, it becomes a narrow side panel so the map remains visible.

The panel contains:

- Current rain state and estimated remaining duration.
- The next useful dry window.
- Play/pause control and selected frame time.
- A scrubbable time track synchronized with the map.
- A local precipitation-intensity graph.
- Thunder and official warning markers.
- Data freshness and confidence labels.

Scrubbing either the graph or time track changes the selected radar frame. Map autoplay advances the same shared timeline state.

## Technical architecture

### Application

- React and TypeScript provide the UI and state model.
- Vite builds a static browser application.
- A PWA manifest and service worker provide home-screen installation and a cached application shell.
- OpenLayers renders and reprojects weather imagery.
- `ol-mapbox-style` applies an OpenFreeMap vector basemap.
- Proj4 defines the DWD DE1200 polar stereographic projection.
- Pako decompresses Bright Sky radar frames.
- A Web Worker converts radar values into colored image frames without blocking interaction.

### Weather sources

1. Open-Meteo geocoding resolves place names and postal codes to coordinates.
2. Bright Sky supplies DWD radar data at 1 km spatial and five-minute temporal resolution, including its short forecast window.
3. Open-Meteo DWD ICON-D2 supplies stable 15-minute precipitation, shower, and lightning-potential data for the longer timeline.
4. RainViewer supplies historical radar tiles as a degraded map fallback when Bright Sky radar is unavailable.

No API key or server-side secret is required for the first release.

## Data flow

1. The user chooses a geocoded result or browser location.
2. The app stores the selection locally and centers the map.
3. Forecast and radar requests start concurrently.
4. The radar request covers only the useful region around the selected location.
5. A worker decompresses the radar records, maps precipitation values to RGBA pixels, and prepares frame images.
6. Forecast and radar records are normalized into a shared timeline model.
7. The rain-window engine samples a small neighborhood around the location, calculates continuous wet and dry periods, and attaches a confidence label.
8. The map, graph, status sentence, and warning markers all render from the same selected timeline instant.

## Rain-window rules

- Use a small neighborhood instead of a single radar pixel to reduce grid noise.
- Treat negligible traces separately from meaningful rain.
- Require several consecutive dry frames before announcing a dry window.
- Prefer radar nowcast for the immediate window when it is fresh.
- Use ICON-D2 as the stable fallback and for the period after radar nowcast ends.
- Reduce confidence when sources are stale, missing, interpolated, or disagree materially.
- Phrase estimates with `about`, `likely`, or a time range rather than certainty.

Thresholds will be centralized and covered by unit tests so they can be tuned after real-world comparison.

## Failure and fallback behavior

- If Bright Sky is delayed or empty, display RainViewer historical movement and use Open-Meteo for the future timeline.
- If map radar fails entirely, keep the basemap, marker, and forecast timeline visible.
- If Open-Meteo fails, keep fresh Bright Sky radar and clearly limit the shown horizon.
- If all remote requests fail, show the last cached successful data with its original update time.
- Never silently show stale information as current.
- Outside high-resolution DWD coverage, show the available Open-Meteo forecast with a lower-precision label.

## Performance

- Request a bounded radar region rather than the nationwide grid.
- Decode and color radar frames in a Web Worker.
- Preload the current, previous, and next frames first; prepare remaining frames progressively.
- Pause playback and refresh work while the page is hidden.
- Refresh radar no more than every five minutes and honor provider caching guidance.
- Keep map controls and React state updates isolated from frame rendering.

## Accessibility

- Encode intensity with graph height and text as well as color.
- Provide keyboard-operable playback and timeline controls.
- Use visible focus states and sufficient contrast.
- Respect reduced-motion preferences by disabling autoplay.
- Expose the selected time, rain intensity, and observed/forecast state to assistive technology.

## Testing

- Unit-test precipitation normalization, threshold behavior, dry-window detection, and confidence calculation.
- Test source adapters with recorded fixtures, including empty and stale responses.
- Test shared playback and scrubbing state independently from the map.
- Add responsive browser tests for compact mobile and desktop layouts.
- Verify the production build and PWA manifest.
- Manually compare several live German locations against DWD/WetterOnline during both dry and rainy conditions.

## Deferred work

- Native app-store packaging.
- User accounts and cloud-synced saved places.
- Push notifications.
- A self-hosted DWD ingestion service.
- Global provider optimization beyond the Open-Meteo/RainViewer fallback.
