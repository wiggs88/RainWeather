# Mobile interaction and radar coverage design

## Problems

- The mobile weather card uses too much of the map viewport.
- Playback controls feel visually oversized even though their 44 px touch targets are appropriate.
- The timeline's visible playhead does not match the native range input's small, invisible drag thumb, making scrubbing unreliable on touch screens.
- Bright Sky radar is requested only 120 km around the selected location, so zooming out exposes the static image boundary.

## Selected design

### Compact mobile card

Remove the mobile minimum height, tighten padding and vertical rhythm, reduce the graph height, and visually simplify the playback controls while preserving 44 px touch targets. Hide redundant location/source rows on short phone viewports; the search bar and map status already expose that context.

### Direct timeline scrubbing

Keep the native range input for keyboard and assistive-technology support, but map pointer positions across the entire chart to timeline indices. Capture the pointer during a drag, use `touch-action: pan-y` to avoid fighting vertical browser gestures, add a visible handle to the selected marker, and label the lower edge as past-to-future.

### Wider DWD radar frame

Increase the Bright Sky radar crop from 120 km to 200 km in every direction. Bright Sky documents 200 km as its default radar distance; this yields a 400 km-wide frame, enough for normal zoom-out around a local area without introducing zoom-triggered network requests. RainViewer remains the historical fallback.

## Alternatives considered

- Smaller than 44 px controls: visually compact, but poor touch accessibility.
- Native transparent range input only: minimal code, but retains the current mismatch between the visible marker and the real touch thumb.
- Refetch radar after every zoom: removes most boundaries, but increases API load, decoding work, battery use, and animation churn.
- RainViewer tiles for every frame: globally seamless, but sacrifices the DWD two-hour nowcast used by the app's core forecast.

## Verification

- Add interaction tests for tap and drag selection.
- Run type checking, all tests, and both local and Pages production builds.
- Inspect the rendered mobile card, scrub into the forecast, zoom the map out, and check browser warnings/errors.
- Push and verify the new GitHub Pages deployment.
