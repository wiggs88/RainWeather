# Compact mobile panel and iOS search design

## Problems

- Mobile Safari zooms the page when focusing the 13 px location input and can leave the page magnified after search submission.
- The weather summary and playback controls occupy separate rows, making the bottom panel taller than necessary.
- Location, source, footer, and attribution details repeat information already available in the mobile search and map overlays.

## Selected design

### Prevent iOS focus zoom

Use a 16 px location input on screens narrower than 720 px. Restore the denser 13 px size on desktop. This avoids disabling pinch zoom or limiting user scaling.

### Inline mobile controls

Wrap the rain summary and playback controls in one status row. On mobile, place Play and NOW beside the summary while preserving 44 px touch targets and 8 px spacing. On desktop, retain the existing stacked panel layout.

### Denser information hierarchy

On mobile, hide the redundant panel heading and footer, reduce the weather headline to 22 px, keep the descriptive sentence to one line, shorten the timeline chart, and retain only a tiny attribution line on taller screens. Very short screens continue to hide attribution entirely.

## Alternatives considered

- Shrink the controls below 44 px: smaller visually, but unreliable and inaccessible on touch devices.
- Make the panel collapsible: frees more space but hides the primary rain-window answer and adds another control.
- Disable browser zoom in the viewport metadata: prevents the symptom but harms accessibility.

## Verification

- Confirm the mobile input computes to 16 px and the desktop input remains 13 px.
- Verify Play and NOW retain 44 px hit areas.
- Check the summary and timeline remain readable at 375 px.
- Run type checking, tests, builds, browser checks, and the GitHub Pages deployment.
