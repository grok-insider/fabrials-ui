# Adopting Fabrials UI 0.6

0.6 keeps every 0.5 export and token. It adds pieces for live monitoring
dashboards, first used by X Tracker. A host that stays on 0.5 changes nothing.

## New in `@fabrials/ui`

- `@fabrials/ui/dither`: a pure, server-safe ordered-dither engine.
  `ditherToRamp` (brightness onto a short colour ramp), `ditherChannels`
  (per-channel, keeps hues), `paintField` (a brightness field onto a ramp),
  `BAYER_8`, colour helpers (`hexToRgb`, `rgbToHex`, `mixHex`, `luma`,
  `sortByLuma`) and seeds (`seeded`, `seedFrom`).
- `DitherCanvas`: a decorative backdrop. Pass `ramp` (one list, or
  `{ light, dark }`) and `field`, a factory `(theme, size) => (u, v) => 0..1`.
  It paints once and repaints on resize, theme change (it watches the root
  `class`/`data-theme`) or a new `paintKey`. `stars` adds crisp dots in the
  dark theme; `fixed` pins it to the viewport. Functions cannot cross the
  server boundary, so hosts wrap it in their own client component.
- `ActivityStrip` and `activityLevel`: a row of intensity cells (5 levels of
  `--brand`, or a status `tone` per cell) with a required `caption` that
  becomes a screen-reader table.
- `Timeline` and `TimelineItem`: an event feed with a toned marker, title,
  time, actions and detail. `fresh` highlights an item once.
- `RelativeTime` and `formatRelativeTime`: "3 minutes ago" in any locale,
  refreshed while the page is visible, with the full date in the title.
- `NavTabs` and `NavTab`: link tabs with `aria-current`, a `count` and the
  host's link element through `render`.

## New in `@fabrials/ai-ui`

Nothing; the version moves with `@fabrials/ui`.

## 0.6.1

The package index barrels (`@fabrials/ui`, `@fabrials/ai-ui`) no longer carry
`"use client"`; each component module still does. A client-marked barrel made
Next.js keep every export in the page bundle, so importing one button shipped
the charts too (about 800 KB on Radiant's sign-in page). Nothing to change in
hosts; bundles just get smaller.
