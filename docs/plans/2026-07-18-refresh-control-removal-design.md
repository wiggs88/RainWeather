# Refresh control removal

## Context

The playback row includes an unlabeled circular-arrow button. Although it manually refreshes weather data, its proximity to the animation controls makes it look like a radar-history or replay control.

## Decision

Remove the always-visible manual refresh button from the populated weather panel. Keep the existing automatic refresh every five minutes, refreshes caused by location changes, and the explicit `RETRY` action shown when weather data cannot load.

## Alternatives considered

- Add a visible `REFRESH` label: clearer, but still gives permanent space to a rarely needed action.
- Move refresh into a secondary menu: avoids clutter but introduces a menu for one action.
- Remove the redundant control: best fit for the app's minimal, mobile-first interface.

## Implementation

- Remove the refresh icon import and button markup from `WeatherPanel`.
- Keep the `onRefresh` prop because the error-state `RETRY` button uses it.
- Remove the now-unused `.refresh-button` CSS rule.
- Verify type checking, tests, production build, and the 375 px mobile layout.
