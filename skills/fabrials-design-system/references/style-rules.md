# Style rules

Values live in `packages/ui/src/tokens.css`; the reasons in `DESIGN.md`. This file turns both into rules you can check in a diff or a screenshot. Use tokens (or the Tailwind bridge names in brackets); never literal colours, radii or shadows in product code.

## Colour roles

| Role | Token [Tailwind] | Light | Dark |
| --- | --- | --- | --- |
| Page | `--background` [`bg-background`] | `#f6f7f8` | Deep Stormwall `#08090b` |
| Surface: plates (cards, stats, tables), panels | `--card` [`bg-card`] | `#ffffff` | `#0e1014` |
| Overlay: menus, dialogs | `--popover` [`bg-popover`] | `#ffffff` | `#14171c` |
| Sunken: code, wells | `--muted`, `--fui-code` [`bg-muted`] | `#eef0f2`, `#f0f2f4` | `#15181e`, `#0b0d10` |
| Hover | `--accent` [`bg-accent`] | `#e9ecef` | `#191d24` |
| Hairline: a plate's edge | `--border` [`border-border`] | `#e0e3e7` | `#1d2128` |
| Soft divider: rows inside one plate | `--fui-separator` | the hairline at 62 % on the surface | the same |
| Inset band, hover fill | `--fui-surface-inset`, `--fui-surface-hover` | ink at 3.5 % and 4.5 % on the surface | the same |
| Working light (only while something works) | `--fui-light-1`, `-2`, `-3` | Stormlight, zircon, amethyst | the same gems, lighter |
| Control boundary | `--fui-control-border` [`border-control-border`] | `#858d98` | `#5e6672` |
| Corner marks, grid guides (brand moments) | `--fui-mark`, `--fui-guide` | ink at half; hairline at 75 % | the same |
| Ink, primary button | `--foreground`, `--primary` [`text-foreground`, `bg-primary`] | `#0e1116` | Cold bone `#e8eae6` |
| Secondary ink | `--muted-foreground` [`text-muted-foreground`] | `#565d68` | `#9399a2` |
| Stormlight ink: links, focus, current item | `--brand-ink`, `--ring` [`text-brand-ink`] | `#2459b3` | `#9cc4ff` |
| Stormlight fill: checked controls, accent button | `--brand` [`bg-brand`] | `#2a63c4` | `#8fb8f5` |
| Selection and quiet Stormlight tints | `--brand-soft` [`bg-brand-soft`] | 10 % brand on card | 16 % brand on card |
| Status inks (text, icons) | `--fui-success-ink`, `--fui-warning-ink`, `--fui-danger-ink` [`text-success-ink`, `text-warning-ink`, `text-danger-ink`] | | |
| Status fills | `--success`, `--warning`, `--destructive` | | |
| Series | `--chart-1` … `--chart-6` | | |
| Sidebar surface | `--sidebar` and `--sidebar-*` [`bg-sidebar`] | | |
| Product mark | `--gem` (from `data-gem`) [`text-gem`] | | |
| Code syntax | `--fui-syntax-*` (muted gem inks) | | |

Rules:

- **Stormlight is the only interaction colour.** It marks focus, links, checked controls, the current navigation item (a 2 px `--fui-bar` bar on the inline-start edge, or on the header hairline for the current link of `AppHeader`) and the first data series. Check: no blue (`--brand*`, `text-blue-*`, `#2…b3`-style literals) on decorative text, icons, headings, backgrounds, borders or illustrations.
- **Primary is ink.** `Button variant="default"` is ink on paper (paper on ink in dark). `variant="accent"` (Stormlight fill) at most once per view, only when one action must stand out.
- **Status travels with a word or icon** and uses the status inks (verdigris, brass, garnet), not the gem or Stormlight.
- **60, 30, 10.** Page about 60 %, storm-slate layer (plates, sidebar, hover, hairlines) about 30 %, meaningful colour (Stormlight and status) at most 10 %. Check: no stock palette colours (`#22c55e`, `#ef4444`, `#f59e0b` and their Tailwind names) anywhere; status colour never outweighs Stormlight on a screen.
- **Crem** `#5a5247` exists only inside the storm's dither ramp. Check: it never appears in CSS or components.
- **Contrast.** Body and control text meet WCAG AA on the real surface in both themes. Hierarchy comes from size, weight and `--muted-foreground`, never from fading essential text further.
- **Both themes are designed.** Dark is not inverted light: the tokens differ per theme. A product that retints (Radiant's night sky) does it in its global CSS for both themes and records it in its `DESIGN.md`.

## Gems

A gem signs a product's mark and nothing else: never a status, a button, a link or a chart colour. Set it once on the root (`data-gem`); draw it with `DitherGem`, `FabrialsGem` or `ProductLockup`.

| Gem | Signs |
| --- | --- |
| Stormlight | The Fabrials house mark, Radiant |
| Heliodor | fabrials.com, Usage AI |
| Sapphire | Syl |
| Ruby | Spanreed |
| Emerald | X Tracker |
| Zircon | Fabrials UI, Urithiru |
| Smokestone | News, guides |
| Amethyst | ai.fabrials.com |

## Typography

IBM Plex, served locally by `fonts.css`.

| Face | Token [Tailwind] | Use |
| --- | --- | --- |
| Plex Sans Condensed 600 | `--fui-font-display` [`font-display`] | Hero headlines 40 to 96 px (line height 0.94 to 0.98, tracking -0.02em), page titles 32 px (`--fui-text-page`; documentation articles 36 px, 44 px from 1800 px), marketing section titles 28 to 30 px, figures 40 px (`--fui-text-figure`), index row names 22 px, the wordmark |
| Plex Sans | `--fui-font-sans` [`font-sans`] | Body and controls 14 px, metadata 12 px, subsections 16 px semibold |
| Plex Mono, label voice | `--fui-font-label` [`font-label`] at `--fui-text-label` 11 px | Labels of figures, table heads, numeric cells, description terms, eyebrows, sidebar group labels, axes, legends, captions, units, identifiers, readings. Muted ink, sentence case |
| Plex Mono | `--fui-font-mono` [`font-mono`] | Code, commands, keys |
| Plex Serif | `--fui-font-serif` [`font-serif`] | Quotations only |

Scale tokens: `--fui-text-label` 11, `xs` 12, `sm` 14, `md` 16, `lg` 18, `xl` 20, `title` 24, `2xl` 30, `page` 32, `3xl` 36, `figure` 40, `display` 48, `display-lg` 60 px. Weights 400, 500, 600.

- A value and its label never share a face: the label is mono 11 px, the value condensed (figures) or sans (cells hold mono numerals).

- Numbers use tabular figures (shared components already do; add `tabular-nums` to hand-made figures).
- Headings use `text-wrap: balance` (`text-balance`).
- Sentence case everywhere: headings, buttons, menu items, table headers.
- Prose measure: descriptions stop at 68ch (`.fui-description`), docs prose at 80ch, a hero lead near 46ch.

## Space and density

- 4 px grid: `--fui-space-0-5` (2 px) to `--fui-space-24` (96 px). Tailwind's default spacing scale is also 4 px based; stay on it.
- Controls: 40 px (`--fui-control-height`), `sm` 32, `xs` 28, `lg` 44. Below 768 px or with a coarse pointer every control is 44 px, including segmented toggles and tabs, which keep their painted size and get a 44 px hit area there (an invisible pseudo-element: their group and a header holding a theme switcher do not grow; `size="lg"` paints the whole 44 px). A `Toolbar` pins its 44 px targets in px so 200 % text does not wrap it. Anything else that paints smaller than 44 px (an inline control in a dense line) takes `data-hit="44"` (`"y"` block-wise only, for a control between two fields; `"end"` block-wise and past the end edge only, for an icon button at the end of a group): an invisible pseudo-element grows the target, never the layout (no `overflow`, clip or contain on the same element).
- `data-density="compact"` on a container: controls 32 px, row padding 8 px. A composition choice for dense tables, not a stored preference.
- Header 56 px (`--fui-header-height`), sidebar 16rem (icon rail 3.5rem), page gutter 24 px (16 px below 768 px).
- Working sizes: body 14 px in apps; an operational page shows its data above the fold at 1440 x 900. Loose padding (48 px inside a panel, 24 px gaps between every control) is a defect.

## Shape

| Radius | Token [Tailwind] | For |
| --- | --- | --- |
| 4 px | `--fui-radius-xs` [`rounded-xs`] | Keys, kbd, inline code, small marks |
| 6 px | `--fui-radius-sm` [`rounded-sm`] | Tags (`Badge`), counts, filter chips, menu items, tooltips, small buttons |
| 8 px | `--fui-radius-md` [`rounded-md`] | Controls: buttons, inputs, selects, segments, sidebar rows |
| 10 px | `--fui-radius-lg` [`rounded-lg`], `--radius` | Dropdown menus, popovers, the command palette |
| 12 px | `--fui-radius-xl` [`rounded-xl`], `--fui-radius-plate` [`rounded-plate`] | Plates: `Card`, `Stat`, `StatGroup`, `Table`, code panels, alerts, state panels, toasts and host panels that hold figures |
| 16 px | `--fui-radius-2xl` [`rounded-2xl`] | Dialogs and sheets, the sign-in card |

- Round (`--fui-radius-full`) only what is round by nature: radio, switch, avatar, status and badge dots, progress and meter tracks, timeline dots, scrollbar thumbs, the play key.
- Check: no `rounded-3xl`, `rounded-4xl`, no `rounded-full` on buttons, inputs, badges, chips or containers, no `border-radius` literal above 16 px.

## Surfaces and elevation

- Group with space first, a tint second and a soft line third (`--fui-separator` between rows of one plate; `--border` is the plate's own edge). What belongs together shares one plate; never a plate inside a plate.
- A state is a tint of its tone mixed into the card (`--fui-tint-strength`, tags `--fui-tint-strong`, edges `--fui-tint-edge`), with the tone's ink for its text and icon. No coloured side bars.
- A band inside a plate (a table head, a toolbar well) is `--fui-surface-inset`; a hover fill is `--fui-surface-hover`.
- Depth comes from the material tokens only (`DESIGN.md` › Material): elevation `--fui-shadow-xs/sm/md/lg`, keys `--fui-bevel` + `--fui-sheen`, raised parts `--fui-highlight` + `--fui-sheen-soft`, wells `--fui-shadow-well`, `--fui-pressed`, `--fui-focus-halo`. Plates rest on `--fui-shadow-xs` and the highlight; overlays on `-md` and `-lg`. Check: no hand-made `box-shadow` or gradient in product code.
- Do not box every label and control. A form is fields on a surface, not a card per field.

## Motion

- Durations `--fui-duration-fast` 100 ms, `--fui-duration` 150 ms, `--fui-duration-slow` 240 ms; eases `--fui-ease`, `--fui-ease-out`, and `--fui-ease-spring` for what a hand moves. All become 0 under `prefers-reduced-motion: reduce`.
- Motion answers what a person did, what the data did or what an agent is doing: opening, expanding, choosing (a sliding segment), pressing (1 px down), checking (a drawn tick), a level or number or reading changing (a sweeping ruler, rolling digits, a settling `Readout`), media arriving after the view (`data-fui-reveal`), things arriving after the view (`.fui-rise`, staggered with `--fui-stagger`), a card that is a link lifting 1 px under the pointer.
- No enter animations on the first paint of a screen people repeat all day; no scroll-triggered reveals.
- One orchestrated moment per page at most: `DitherScene` `reveal` (on by default) or a large `DitherGem` `reveal`. Painted once; never again on that page.
- Continuous motion only for real loading and an agent at work: `Spinner` (the pixel ring), the `Loading` pulse, `Skeleton` shimmer, `ShimmerText`, `Button loading`, `WorkingLight`, the agent indicators of `@fabrials/ai-ui`. `StatusDot pulse` only while something is live or in progress. `MoonPhase` and `Starfield` only on sign-in and landing.
- Custom keyframes sit inside `@media (prefers-reduced-motion: no-preference)` or stop under `reduce`.

## Dithering

- Brand light is an 8x8 Bayer dither on canvas (`@fabrials/ui/dither`), dots 2 to 4 CSS px, fading into the surface behind it (`--fui-dither-bg`, else `--background`).
- `DitherScene` on the landing hero and sign-in only; `DitherBand` at most once per view; `DitherGem` for product marks at 16, 20, 28 or 40 px.
- Text sits on the calm side of a scene or on a solid surface, never on dense dither. Dithering stays off controls and body text.
- A canvas repaints only on resize, theme change or new data. It never loops.
- Data is dithered: `SeriesChart` paints the first series in Stormlight dither and the next two in ink dither. Pass `color` only when the colour means something (a provider's brand, a status).

## Instrument details

- `CornerMarks` only in brand moments: the hero figure of a landing, a figure on a sign-in or public stats page. Check: none on product screens, two per page at most, never around controls, never nested.
- `GridGuides` only behind a landing hero, first child of a positioned section. Check: no text or control sits under a guide without its own surface or enough contrast.
- `CardCaption` on a plate that shows a figure: what it shows, then a reading. Check: the reading is a fact ("Peak 244 on Nov 4"), not a slogan.
- `Meter variant="ruler"` or `Stat meter` under a figure that is a share or a level. Check: the ruler has an accessible name.

## Copy

- Plain verbs in sentence case, from the user's side. An action keeps its name through the flow ("Revoke key", then "Key revoked").
- Errors: what happened and how to fix it, no apology. Empty states: what to do next. Stale data says it is stale; a configured connection is not called reachable.
- No marketing filler in product screens; one line of description under a title is enough.

## Anti-slop rules

The owner rejects the generic AI-generated look. Each rule has a check.

1. **No centred content layouts.** Page containers, heroes and sections anchor to the left gutter. Check: no `mx-auto`, `margin-inline: auto`, `margin: 0 auto`, `justify-center`/`items-center` on a page column, no `text-center` hero or section. Centring is allowed inside a component (an empty state in a bounded region, a toast on a phone).
2. **No pill clutter.** Badges, counts and chips are soft 6 px tags tinted by their tone, with a round dot. Check: no `rounded-full` badge or chip; at most one pill per view, only for a passive label that must stand out; not every row carries a badge.
3. **No card grid of identical cards.** Products and features are index rows (mark, name, one line, link). Check: no `grid-cols-3` of cards with an icon, title, blurb and "Learn more"; no bento layouts.
4. **No cards in cards.** Check: a `Card` or bordered box never contains another bordered box; group with space and soft dividers inside one plate.
5. **No eyebrow ALL-CAPS labels.** Check: no `uppercase`, no `tracking-wide`/`wider`/`widest`, no small coloured label above a heading. `PageHeader` `eyebrow` is sentence-case context (a period, a source, a breadcrumb) in the label voice and secondary ink.
6. **No `→` appended to buttons or links.** Check: no `→`, `↗`, `»` or trailing `ArrowRight`/`ArrowUpRight`/`ChevronRight` icons in button or link labels; the label names the destination. Arrows that carry meaning are fine: previous/next pager, back to top, a trend in `Stat`, a disclosure chevron.
7. **No gradient or glow decoration.** Check: no `bg-gradient-*`, `linear-gradient`/`radial-gradient` backgrounds, gradient text (`bg-clip-text text-transparent`), blurred colour blobs, coloured `drop-shadow` or neon borders. Brand light appears only as dither. The exceptions are the package's material tokens (`--fui-sheen`, `--fui-sheen-soft`) inside controls, the skeleton shimmer, and the working light (`WorkingLight`, `ShimmerText tone="light"`, the agent indicators), which shows only while something works.
8. **Soft plates.** Check: plates have 12 px corners (`--fui-radius-plate`), a hairline edge and the plate elevation; rows inside them are divided by `--fui-separator`; no thick or coloured borders or side bars on content.
9. **One orchestrated motion per page.** Check: at most one `reveal`; no stagger-in on first paint, no floating elements, parallax, looping marquees or text that animates itself outside a working state; the only hover lift is a `Card` that is a link. Effects copied from animation libraries (React Bits and similar) are refused: their licences rarely allow a library to redistribute them, and their defaults break these rules; take the idea, write it with the motion tokens.
10. **Reduced motion respected.** Check: with `prefers-reduced-motion: reduce` nothing moves except state changes; every custom animation has a reduced-motion path.
11. **Both themes designed.** Check: screenshots of light and dark both read well; no literal `#hex`, `rgb()`, `hsl()` or Tailwind palette colours (`bg-slate-900`, `text-blue-600`) in product code.
12. **One radius scale.** Check: radii only from the table above.
13. **One accent.** Check: no second accent colour, no gem-coloured buttons or links, no single headline word in another colour.
14. **Density.** Check: records are rows in a `Table`; controls are 40 px; body text is 14 px in apps; no hero-sized type inside app screens.

A quick scan (hits are candidates to review, not verdicts; `ChevronRight` in a file tree or `text-center` inside a `StatePanel` is fine):

```sh
rg -n --glob '*.{tsx,jsx,ts,css}' \
  -e 'mx-auto|margin-inline:\s*auto|margin:\s*0 auto|text-center' \
  -e 'rounded-(3xl|4xl|full)' \
  -e 'uppercase|tracking-(wide|wider|widest)' \
  -e 'gradient|bg-clip-text|drop-shadow|blur-(xl|2xl|3xl)' \
  -e 'animate-(pulse|bounce|ping)|infinite' \
  -e '→|↗|»|ArrowRight|ArrowUpRight' \
  -e '#[0-9a-fA-F]{6}\b|rgb\(|hsl\(|(bg|text|border)-(slate|gray|zinc|blue|indigo|violet|purple|sky)-[0-9]' \
  src app components
```
