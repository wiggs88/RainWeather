# Compact desktop weather panel

## Goal

Make the desktop weather UI behave like the mobile layout: a compact, content-sized capsule at the bottom of the map instead of a full-height right rail.

## Design

- Center a maximum 680px-wide weather capsule along the bottom edge on desktop.
- Reuse the compact mobile status/control row and hide secondary heading/footer metadata.
- Keep playback controls at least 44px tall for mouse, keyboard, and touch access.
- Reduce the desktop timeline to 42px and start its graph and markers lower within that area.
- Allow the map to use the full viewport width and position the selected location above the bottom capsule.
- Place the radar-frame label immediately above the capsule so it does not compete with the timeline.

## Verification

- Run the production build and lint checks.
- Verify the layout at mobile, tablet, and wide desktop widths.
- Confirm timeline click, drag, and keyboard interaction remain available.
