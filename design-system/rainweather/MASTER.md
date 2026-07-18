# RainWeather Design System

> The approved product design overrides generated style suggestions. Use this file as the UI source of truth.

## Character

RainWeather is a precise, minimal weather instrument. The map and precipitation data are the visual focus. The interface must not resemble a marketing page, generic dashboard, or collection of cards.

## Typography

- Use self-hosted **Roboto Mono Variable** for every interface element.
- Body text is at least `16px` on mobile.
- Metadata uses uppercase text, `11px–12px`, weight 500, and `0.08em` letter spacing.
- Primary weather status uses fluid type between `24px` and `40px`, weight 500, and tight line height.
- Use tabular numerals for all times and measurements.

## Palette

| Token | Value | Use |
|---|---:|---|
| Canvas | `#090B0D` | Application background |
| Surface | `#101316` | Solid controls and panels |
| Surface raised | `#15191D` | Active and expanded states |
| Border | `#2A3036` | One-pixel separators |
| Text | `#F2F5F7` | Primary content |
| Muted | `#9099A1` | Labels and metadata |
| Faint | `#596169` | Inactive ticks and controls |
| Light rain | `#58D8F5` | Trace/light precipitation |
| Rain | `#168CFF` | Moderate precipitation |
| Heavy rain | `#3155FF` | Heavy precipitation |
| Thunder | `#B36BFF` | Thunder/severe weather |
| Warning | `#FFB45C` | Data or official warnings |

Color is not the only intensity signal. Graph height, labels, patterns, and accessible text must carry the same meaning.

## Geometry and effects

- Use a `4px` base spacing unit.
- Compact controls use `8px` corner radii; primary panels use `12px`.
- Use one-pixel borders instead of card shadows.
- Avoid decorative gradients, glass blur, organic shapes, textures, and floating-card stacks.
- Hover and focus states may change border, text, or background color without moving layout.
- UI transitions last `150–220ms` and use ease-out.

## Layout

- The map fills the viewport beneath the controls.
- On mobile, search floats at the top and the timeline panel is fixed to the bottom.
- On desktop, the timeline panel becomes a `360–400px` right-side rail.
- Maintain at least `12px` from viewport edges and safe-area insets.
- Reserve panel space during loading to avoid layout jumps.
- Do not introduce horizontal page scrolling at any supported width.

## Interaction

- Every touch target is at least `44×44px`, with `8px` between adjacent targets.
- Every interactive control has a visible `:focus-visible` state.
- Timeline scrubbing is keyboard and pointer operable.
- Autoplay pauses when the page is hidden.
- `prefers-reduced-motion: reduce` disables autoplay and nonessential transitions.
- Icon-only controls use consistent inline SVG and an accessible name.

## Map treatment

- Use the OpenFreeMap Positron style as a base, restyled or filtered toward the dark canvas.
- Reduce POI prominence and keep road/place labels subordinate to radar.
- Keep the selected location marker visually distinct from the precipitation palette.
- Radar opacity is high enough to read movement while retaining geographic context.
- Clearly label selected frames as `RADAR`, `NOW`, or `FORECAST`.

## Anti-patterns

- No emojis as interface icons.
- No marketing hero, CTA, feature grid, or navigation clutter.
- No generic weather-card grid.
- No hidden input labels or placeholder-only forms.
- No tiny map buttons.
- No layout-shifting hover animations.
- No stale data presented as current.
- No claims of exact certainty for precipitation timing.

## Verification widths

- `375px` compact mobile
- `768px` tablet
- `1024px` small desktop
- `1440px` large desktop
