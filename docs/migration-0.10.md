# Migrating to 0.10 "Instrument"

0.10 keeps every 0.9 export and prop. What changes is the look: Highstorm's rules stay (one interaction colour, light only as dither, nothing centred, indexes instead of card grids) and gain a voice. Screens read like calibrated instruments: deep Stormwall neutrals, square plates with registration marks, a second voice in Plex Mono for labels and readings, rulers under figures and data drawn in dither. The reasoning and the alternatives that were not chosen are in `docs/identity-proposals.md`.

## What changes on its own

Re-vendor (`bun run vendor <product> --write`) or update `@fabrials/ui` and `@fabrials/ai-ui` to 0.10.0, and these follow without code changes:

| Area | 0.9 | 0.10 |
| --- | --- | --- |
| Dark neutrals | Stormwall `#161a21` page, `#1e232c` card, `#2d333d` hairline | Deep Stormwall `#08090b` page, `#0e1014` card, `#14171c` overlay, `#1d2128` hairline, `#5e6672` control edge |
| Light neutrals | `#eceeeb` page, `#f7f8f6` card | `#f6f7f8` page, `#ffffff` card, `#e0e3e7` hairline, ink `#0e1116` |
| Containers | `Card`, `Stat`, `StatGroup`, `Table` with 6 px corners and a small shadow | Square plates (`--fui-radius-plate: 0`), hairline only, no resting shadow. Controls keep 5 px, overlays 6 and 8 px |
| Labels | Plex Sans 12 to 13 px | Plex Mono 11 px (`--fui-font-label`, `--fui-text-label`) for `Stat` labels, table heads, numeric cells, `DescriptionTerm`, the `PageHeader` eyebrow, sidebar group labels, chart axes and legends, ruler meters |
| Figures | `Stat` value 28 px Plex Sans | 40 px Plex Sans Condensed (`--fui-text-figure`), unit in mono |
| Page titles | 24 px | 32 px (`--fui-text-page`) |
| Charts | Bars and lines in the chart hues, rounded bar tops | `SeriesChart` draws the first series in Stormlight dither, the second and third in ink dither (half, a quarter) and square bars; axes in mono, a dashed grid. From the fourth series, and for any series with its own `color`, the hues stay |
| Dither | Ramps start from Stormwall | `STORM_RAMP` and `gemRamp` start from the deep neutrals |

All text keeps WCAG AA in both themes: body 16.5:1 dark and 17.6:1 light, secondary text on a card 6.6:1, links at least 6.7:1, control edges 3:1 or more.

## New pieces

| Export | Use |
| --- | --- |
| `CornerMarks` | Wraps a plate and draws a small cross on each corner. Use it on the plates that carry a page (the totals, the main chart, the main table, a hero figure), not on every box. Decorative and never focusable |
| `GridGuides` | The 12-column layout grid drawn as dashed guides behind a landing hero. First child of a positioned section; follows `--fui-page-padding`; hidden under 768 px, in forced colors and in print |
| `CardCaption` | A caption strip along the bottom of a card in the label voice: what the figure shows, then a reading |
| `Meter variant="ruler"` | A scale of ticks inked up to the value with a Stormlight mark at the value (`ticks`, default 40). Same `meter` role and tones |
| `Stat meter={{ value, max, label }}` | A ruler under a figure: a share of a total or a quota. `label` is its accessible name |
| `SeriesChart texture` | `"dither"` (default) or `"solid"` |
| Tokens | `--fui-font-label`, `--fui-text-label`, `--fui-leading-label`, `--fui-tracking-label`, `--fui-text-page`, `--fui-leading-page`, `--fui-text-figure`, `--fui-radius-plate`, `--fui-mark-size`, `--fui-mark`, `--fui-guide` |

The reference pages are the **Fabrials/Instrument** stories (Landing, Workspace, Pieces).

## What a host may need to change

- **A host that boxed things itself.** A product CSS rule that gave a `Card` or `Table` its own radius or shadow now fights the plates; delete it.
- **A chart whose colours mean something.** Pass `color` on those series (they stay solid), or `texture="solid"` to keep 0.9's hues for the whole chart.
- **A product that retints the neutrals** (Radiant's night sky) keeps its own values; check its dark theme against the new card and hairline, which are darker.
- **Literal Stormwall colours in a host** (`#161a21`, `#1e232c`, `#eceeeb`), usually in a dither ramp or an `<meta name="theme-color">`, should move to `#08090b`, `#0e1014` and `#f6f7f8`.
- **Visual references** of every screen with cards, stats, tables or charts change; review them, they are expected.

## Going back

Pin 0.9.0. To keep 0.9's rounded containers on 0.10, set `--fui-radius-plate: var(--fui-radius-lg)` on the root; to keep Plex Sans labels, `--fui-font-label: var(--fui-font-sans)`. The palette has no switch.
