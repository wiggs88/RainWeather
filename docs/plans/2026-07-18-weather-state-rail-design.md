# Weather-state rail

## Goal

Restore the summary rail as a meaningful, correctly aligned precipitation indicator.

## Design

- Place the rail beside the headline and detail only.
- Remove the confidence label to reduce the capsule height.
- Let the content determine its height so the rail never enlarges the weather card.
- Reuse the normalized precipitation states: grey for dry, cyan for trace, blue for light, deep blue for moderate, and purple for heavy.
- Keep the written headline and precipitation values as the primary signal so the state does not depend on color alone.

## Rationale

Established weather products use ordered color scales tied to rainfall intensity. HOWDRY?! uses a reduced five-state version consistent with its radar and timeline palette, avoiding a second visual language.

## Verification

- Run TypeScript, unit tests, production build, and GitHub Pages build.
- Confirm the rail does not alter the summary row height.
