# Style rules

Values live in `packages/ui/src/tokens.css`; the reasons in `DESIGN.md`. This file turns both into rules you can check in a diff or a screenshot. Use tokens (or the Tailwind bridge names in brackets); never literal colours, radii or shadows in product code.

## Colour roles

| Role | Token [Tailwind] | Light | Dark |
| --- | --- | --- | --- |
| Page | `--background` [`bg-background`] | `#eceeeb` | Stormwall `#161a21` |
| Surface: panels, cards, tables | `--card` [`bg-card`] | `#f7f8f6` | `#1e232c` |
| Overlay: menus, dialogs | `--popover` [`bg-popover`] | `#fbfbfa` | `#232932` |
| Sunken: code, wells | `--muted`, `--fui-code` [`bg-muted`] | `#e1e4e1` | `#252b35`, `#1b2029` |
| Hover | `--accent` [`bg-accent`] | `#dde1de` | `#2b313b` |
| Hairline | `--border` [`border-border`] | `#cdd1cf` | `#2d333d` |
| Control boundary | `--fui-control-border` [`border-control-border`] | `#868d96` | `#5b6470` |
| Ink, primary button | `--foreground`, `--primary` [`text-foreground`, `bg-primary`] | `#161a21` | Cold bone `#e6e8e4` |
| Secondary ink | `--muted-foreground` [`text-muted-foreground`] | `#545b64` | `#a0a7af` |
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

- **Stormlight is the only interaction colour.** It marks focus, links, checked controls, the current navigation item and the first data series. Check: no blue (`--brand*`, `text-blue-*`, `#2…b3`-style literals) on decorative text, icons, headings, backgrounds, borders or illustrations.
- **Primary is ink.** `Button variant="default"` is ink on paper (paper on ink in dark). `variant="accent"` (Stormlight fill) at most once per view, only when one action must stand out.
- **Status travels with a word or icon** and uses the status inks, not the gem or Stormlight.
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
| Plex Sans Condensed 600 | `--fui-font-display` [`font-display`] | Hero headlines 40 to 80 px (line height 0.98, tracking -0.015em), page titles 24 px (documentation articles 36 px, 44 px from 1800 px), marketing section titles 28 px, index row names 22 px, the wordmark |
| Plex Sans | `--fui-font-sans` [`font-sans`] | Body and controls 14 px, metadata 12 px, subsections 16 px semibold |
| Plex Mono | `--fui-font-mono` [`font-mono`] | Code, commands, keys, identifiers. Not labels |
| Plex Serif | `--fui-font-serif` [`font-serif`] | Quotations only |

Scale tokens: `--fui-text-xs` 12, `sm` 14, `md` 16, `lg` 18, `xl` 20, `title` 24, `2xl` 30, `3xl` 36, `display` 48, `display-lg` 60 px. Weights 400, 500, 600.

- Numbers use tabular figures (shared components already do; add `tabular-nums` to hand-made figures).
- Headings use `text-wrap: balance` (`text-balance`).
- Sentence case everywhere: headings, buttons, menu items, table headers.
- Prose measure: descriptions stop at 68ch (`.fui-description`), docs prose at 80ch, a hero lead near 46ch.

## Space and density

- 4 px grid: `--fui-space-0-5` (2 px) to `--fui-space-24` (96 px). Tailwind's default spacing scale is also 4 px based; stay on it.
- Controls: 40 px (`--fui-control-height`), `sm` 32, `xs` 28, `lg` 44. Below 768 px or with a coarse pointer every control is 44 px, including segmented toggles and tabs, which are painted 44 px there (their group is then 50 px). A `Toolbar` pins its 44 px targets in px so 200 % text does not wrap it. Anything else that paints smaller than 44 px (an inline control in a dense line) takes `data-hit="44"`: an invisible pseudo-element grows the target, never the layout (no `overflow`, clip or contain on the same element).
- `data-density="compact"` on a container: controls 32 px, row padding 8 px. A composition choice for dense tables, not a stored preference.
- Header 56 px (`--fui-header-height`), sidebar 16rem (icon rail 3.5rem), page gutter 24 px (16 px below 768 px).
- Working sizes: body 14 px in apps; an operational page shows its data above the fold at 1440 x 900. Loose padding (48 px inside a panel, 24 px gaps between every control) is a defect.

## Shape

| Radius | Token [Tailwind] | For |
| --- | --- | --- |
| 3 px | `--fui-radius-xs` [`rounded-xs`] | Keys, badges, counts, tags, inline code |
| 4 px | `--fui-radius-sm` [`rounded-sm`] | Small parts: filter chips, menu items, tooltips |
| 5 px | `--fui-radius-md` [`rounded-md`] | Controls: buttons, inputs, selects |
| 6 px | `--fui-radius-lg` [`rounded-lg`], `--radius` | Containers: panels, cards, tables, alerts, state panels; also dropdown menus, popovers and the command palette |
| 8 px | `--fui-radius-xl` [`rounded-xl`] | Large overlays: dialogs, sheets, toasts, the sign-in card |

- Round (`--fui-radius-full`) only what is round by nature: radio, switch, avatar, status dot, progress and meter tracks, timeline dots, scrollbar thumbs.
- Check: no `rounded-2xl`, `rounded-3xl`, `rounded-4xl` (the bridge maps them to 12 to 24 px), no `rounded-full` on buttons, inputs, badges, chips or containers, no `border-radius` literal above 8 px.

## Surfaces and elevation

- Separate with space and hairlines (`border-border`, 1 px) before adding a border around anything. One panel with dividers, not cards inside cards.
- Shadows belong to overlays (`--fui-shadow-overlay`). The package's own cards carry a faint `--fui-shadow-sm`; do not add larger shadows to page content.
- Do not box every label and control. A form is fields on a surface, not a card per field.

## Motion

- Durations `--fui-duration-fast` 100 ms, `--fui-duration` 150 ms, `--fui-duration-slow` 240 ms; ease `--fui-ease`. All become 0 under `prefers-reduced-motion: reduce`.
- Motion answers what a person did: opening, expanding, confirming. No enter animations on navigation people repeat all day; no scroll-triggered reveals.
- One orchestrated moment per page at most: `DitherScene` `reveal` (on by default) or a large `DitherGem` `reveal`. Painted once; never again on that page.
- Continuous motion only for real loading: `Spinner`, the `Loading` pulse, `Skeleton` shimmer, `ShimmerText`, `Button loading`. `StatusDot pulse` only while something is live or in progress. `MoonPhase` and `Starfield` only on sign-in and landing.
- Custom keyframes sit inside `@media (prefers-reduced-motion: no-preference)` or stop under `reduce`.

## Dithering

- Brand light is an 8x8 Bayer dither on canvas (`@fabrials/ui/dither`), dots 2 to 4 CSS px, fading into the surface behind it (`--fui-dither-bg`, else `--background`).
- `DitherScene` on the landing hero and sign-in only; `DitherBand` at most once per view; `DitherGem` for product marks at 16, 20, 28 or 40 px.
- Text sits on the calm side of a scene or on a solid surface, never on dense dither. Dithering stays off controls and body text.
- A canvas repaints only on resize, theme change or new data. It never loops.

## Copy

- Plain verbs in sentence case, from the user's side. An action keeps its name through the flow ("Revoke key", then "Key revoked").
- Errors: what happened and how to fix it, no apology. Empty states: what to do next. Stale data says it is stale; a configured connection is not called reachable.
- No marketing filler in product screens; one line of description under a title is enough.

## Anti-slop rules

The owner rejects the generic AI-generated look. Each rule has a check.

1. **No centred content layouts.** Page containers, heroes and sections anchor to the left gutter. Check: no `mx-auto`, `margin-inline: auto`, `margin: 0 auto`, `justify-center`/`items-center` on a page column, no `text-center` hero or section. Centring is allowed inside a component (an empty state in a bounded region, a toast on a phone).
2. **No pill clutter.** Badges, counts and chips are 3 to 4 px tags; a badge dot is square. Check: no `rounded-full` badge or chip; at most one pill per view, only for a passive label that must stand out; not every row carries a badge.
3. **No card grid of identical cards.** Products and features are index rows (mark, name, one line, link). Check: no `grid-cols-3` of cards with an icon, title, blurb and "Learn more"; no bento layouts.
4. **No cards in cards.** Check: a `Card` or bordered box never contains another bordered box; group with hairlines inside one panel.
5. **No eyebrow ALL-CAPS labels.** Check: no `uppercase`, no `tracking-wide`/`wider`/`widest`, no small coloured label above a heading. `PageHeader` `eyebrow` is sentence-case context in secondary ink (a breadcrumb).
6. **No `→` appended to buttons or links.** Check: no `→`, `↗`, `»` or trailing `ArrowRight`/`ArrowUpRight`/`ChevronRight` icons in button or link labels; the label names the destination. Arrows that carry meaning are fine: previous/next pager, back to top, a trend in `Stat`, a disclosure chevron.
7. **No gradient or glow decoration.** Check: no `bg-gradient-*`, `linear-gradient`/`radial-gradient` backgrounds, gradient text (`bg-clip-text text-transparent`), blurred colour blobs, coloured `drop-shadow` or neon borders. Light appears only as dither. (Skeleton shimmer is a loading indicator, not decoration.)
8. **Hairline panels.** Check: dividers are 1 px `--border`; containers are `rounded-lg` with a hairline; no thick or coloured borders on content.
9. **One orchestrated motion per page.** Check: at most one `reveal`; no stagger-in lists, hover lifts, floating elements, parallax or looping marquees.
10. **Reduced motion respected.** Check: with `prefers-reduced-motion: reduce` nothing moves except state changes; every custom animation has a reduced-motion path.
11. **Both themes designed.** Check: screenshots of light and dark both read well; no literal `#hex`, `rgb()`, `hsl()` or Tailwind palette colours (`bg-slate-900`, `text-blue-600`) in product code.
12. **Crisp corners.** Check: radii only from the table above.
13. **One accent.** Check: no second accent colour, no gem-coloured buttons or links, no single headline word in another colour.
14. **Density.** Check: records are rows in a `Table`; controls are 40 px; body text is 14 px in apps; no hero-sized type inside app screens.

A quick scan (hits are candidates to review, not verdicts; `ChevronRight` in a file tree or `text-center` inside a `StatePanel` is fine):

```sh
rg -n --glob '*.{tsx,jsx,ts,css}' \
  -e 'mx-auto|margin-inline:\s*auto|margin:\s*0 auto|text-center' \
  -e 'rounded-(2xl|3xl|4xl|full)' \
  -e 'uppercase|tracking-(wide|wider|widest)' \
  -e 'gradient|bg-clip-text|drop-shadow|blur-(xl|2xl|3xl)' \
  -e 'animate-(pulse|bounce|ping)|infinite' \
  -e '→|↗|»|ArrowRight|ArrowUpRight' \
  -e '#[0-9a-fA-F]{6}\b|rgb\(|hsl\(|(bg|text|border)-(slate|gray|zinc|blue|indigo|violet|purple|sky)-[0-9]' \
  src app components
```
