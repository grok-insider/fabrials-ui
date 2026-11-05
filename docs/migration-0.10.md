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

## Motion, details and fixes

0.10 also gives the components a living-instrument motion and a detail pass (see `DESIGN.md` › Motion):

- `Spinner`, `Button loading`, the `StatePanel` loading icon and loading toasts draw a ring of square cells (it was a rotating arc). `Spinner` keeps its props and `role="status"`.
- A single-choice `ToggleGroup` (and `ThemeSwitcher`) keeps one indicator that slides to the pressed item; it sets `--fui-toggle-x/y/w/h` on the group. A multiple group keeps per-item fills.
- `Checkbox` draws its check; a ruler `Meter` inks its ticks in order; `Button` goes down 1 px while pressed.
- `Readout` (new): a mono reading that settles when its value changes; assistive technology reads the final text.
- A `FileThumb` image that arrives after mount appears through a 2 px dither. Hosts can do the same on their own media with `data-fui-reveal="pending"` at mount and `"in"` on load.
- Details: square meter and progress tracks with threshold notches on an automatic meter; scanline sparklines; alerts and toasts are neutral plates with a 2 px tone bar; keycaps in mono; page numbers in mono with a Stormlight underline; a mono slash between breadcrumbs (pass `children` to `BreadcrumbSeparator` for the old chevron); square timeline markers, tab indicator, code panels, state panels, carousel controls and scroll thumbs.
- Fixes asked by products: a table region is positioned (hidden cells no longer widen a phone page); a native select in `CollectionToolbar` filters sizes to its options; a `SectionHeader` title is as wide as its text; a non-modal sheet carries `data-modal="false"`; `SectionHeader`'s heading block has the class `fui-section-heading`.
- `data-theme="system"` on the root follows the operating system with no script (tokens, dither canvases, toasts, the AI syntax inks). `DESIGN.md` has the Tailwind dark variant that covers it.

## Colour family and layout fixes (later on 0.10)

- The storm-slate layer: dark plates `#0d1219`, overlays and wells `#131921`, hairline `#1e252f`, sidebar `#040609`; light page `#f5f7f9`, wells `#ebf0f5`, hairline `#dae0e7`. A cool blue slate one step above the page, after the 60-30-10 split.
- Status and chart colours come from the gems: verdigris success, brass warning, garnet danger, with chart hues Stormlight, verdigris, brass, garnet, amethyst and steel. Contrast: status inks 6.1:1 or more on a light plate and 8.3:1 or more on a dark one; chart hues 3.4:1 or more on their plate.
- A `ToggleGroup` is as wide as its items in any parent (it stretched in a grid column); a card with a header or content is a flex column and keeps its `CardFooter` or `CardCaption` on its bottom edge; `CardFooter` has no tinted band.

## Material (later on 0.10)

Components are no longer flat (`DESIGN.md` › Material; recipes adapted from Radix Themes, MIT): solid buttons and ticked checks are keys with a bevel and a sheen, outline buttons and the chosen segment are raised, fields and segmented groups are wells, plates rest on `--fui-shadow-sm`, overlays have deeper layered shadows and arrive from their trigger's side on `--fui-ease-out`, a held switch thumb stretches. New tokens: `--fui-shadow-well`, `--fui-bevel`, `--fui-sheen`, `--fui-sheen-soft`, `--fui-pressed`, `--fui-focus-halo`, `--fui-ease-out`; `--fui-shadow-xs/sm/md/lg` and `--fui-highlight` have new values. A host that set `box-shadow` or `background-image` on a package control replaces what the package paints; prefer the tokens.

## The registry no longer offers other libraries (later on 0.10)

ui.fabrials.com stops republishing Kibo UI and Magic UI (`kibo-*`, `magicui-*` registry items, the `/libraries` pages, the upstream sync and the license gate). No Fabrials product used them. An app that installed one keeps its copied source; it just gets no updates from this registry. The Fabrials pieces that cover them: `Files` (file tree), `ActivityStrip` (contribution graph), `Timeline` (event list) and `Dropzone` (dropped files). From now on a component a product needs from another library is adopted into the packages in the Fabrials style (`docs/registry.md`).

## New components (later on 0.10)

The pieces products kept rebuilding by hand, added with stories, keyboard tests and visual references. Nothing existing changes.

- **Inputs:** `SearchInput` (clear button, Escape, key hint, loading), `PasswordInput` (reveal toggle, Caps Lock warning, hidden again on submit), `NumberField` (Base UI, steppers, units), `Slider` (Base UI, ranges, ruler marks; the `slider` shim), `InputOTP` with `InputOTPGroup`, `InputOTPSlot` and `InputOTPSeparator` (Base UI's OTP field; the `input-otp` shim), and `Textarea autoResize minRows maxRows`. `DirectionProvider` and `useDirection` are Base UI's, re-exported (the `direction` shim): a right-to-left app wraps its root in `DirectionProvider direction="rtl"` as well as setting `dir`, or Base UI's sliders, menus and tabs keep left-to-right keys and positions.
- **Dates:** `Calendar` with `CalendarDayButton` (written for this system with react-day-picker's prop names, so the `calendar` shim replaces the site's react-day-picker copy), `DatePicker`, `DateRangePicker`, and the helpers `toISODate`, `parseISODate`, `matchesDate`, `isSameDay` and `firstDayOfWeek`. Pass `locale` when the page is rendered on the server.
- **Lists and panels:** `ListBox` (single or multiple choice with the keyboard, type-ahead, `onAction`, and `virtual` to draw only the rows on screen), `VirtualList` (a plain list of measured rows), `SidePanel` with its header, title, description, close, body and footer (docked and resizable, a sheet on a phone), `ContextMenu` with every shadcn part (the `context-menu` shim), and `Dropzone` with `acceptsFile` and `sortFiles` (it replaces the Kibo UI dropzone the registry used to offer).
- **People and images:** `Avatar` sizes `xs` and `xl`, `AvatarGroup` (with `max` and a named count), `AvatarGroupCount` and `AvatarBadge` (the `avatar` shim), `AspectRatio` (the `aspect-ratio` shim), `Image`, `MediaGrid` and `ImageViewer`, assimilated from X Tracker's media image, mosaic and lightbox (zoom to real size and back, look around, swipe, a strip of neighbours). The gesture and player rules are exported from `media-logic` (`wheelIntent`, `pinchIntent`, `swipeStep`, `scrollForFocus`, `formatClock`, `keyAction`…). New tokens `--fui-media-scrim`, `--fui-media-scrim-strong`, `--fui-media-ink` and `--fui-viewer-backdrop` are the same in both themes, because photos do not change with the theme.
- **Players:** `VideoPlayer`, `AudioPlayer` and `AnimatedImage`, assimilated from X Tracker's player: our controls over the browser's element, the keys people know (Space or K, J, L, the arrows, M, F, C, < and >, Home, End, digits), one video at a time, a resting bar, captions, speed, picture in picture and full screen; animations move only while on screen, in front and with motion allowed, and always have a pause button. `ImageViewer` draws video and GIF items with `renderMedia`. `mayAnimate` and `playbackProblem` join the media rules.
- **Documents:** `Spreadsheet`, a read-only workbook viewer (sticky letters and row numbers, frozen panes, merged cells, the address and contents of the active cell, sheet tabs, only the visible cells drawn), with `cellText`, `cellAddress`, `columnName` and the `Workbook` types. A new subpath, `@fabrials/ui/spreadsheet`, reads CSV, TSV and .xlsx in the browser with no dependency (`readSpreadsheet`, `readXlsx`, `csvToSheet`, `parseCsv`, `SpreadsheetError`): values, shared and inline strings, formulas' last results, both date systems, the common number formats, column widths, merges and frozen panes; the old .xls and protected workbooks are refused with a reason. A PDF viewer was considered and left out on purpose: pdf.js is about 1.5 MB, and the owner chose not to carry it.

## What a host may need to change

- **A host that boxed things itself.** A product CSS rule that gave a `Card` or `Table` its own radius or shadow now fights the plates; delete it.
- **A chart whose colours mean something.** Pass `color` on those series (they stay solid), or `texture="solid"` to keep 0.9's hues for the whole chart.
- **A product that retints the neutrals** (Radiant's night sky) keeps its own values; check its dark theme against the new card and hairline, which are darker.
- **Literal Stormwall colours in a host** (`#161a21`, `#1e232c`, `#eceeeb`), usually in a dither ramp or an `<meta name="theme-color">`, should move to `#08090b`, `#0e1014` and `#f6f7f8`.
- **Hosts that worked around the fixed gaps** can delete their rules: Palanaeum's `.fui-filters > .fui-native-select` and `.fui-table-scroll { position: relative }`, Open Email's `inline-size: fit-content` on section titles and its class check for non-modal sheets (`[data-modal="false"]`).
- **Visual references** of every screen with cards, stats, tables or charts change; review them, they are expected.

## Going back

Pin 0.9.0. To keep 0.9's rounded containers on 0.10, set `--fui-radius-plate: var(--fui-radius-lg)` on the root; to keep Plex Sans labels, `--fui-font-label: var(--fui-font-sans)`. The palette has no switch.
