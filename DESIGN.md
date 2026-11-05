# Fabrials design system

Fabrials UI 0.10 "Instrument" is the shared interface of the Fabrials products and the registry at ui.fabrials.com. This document is the brief: what the system looks like, why, and the rules a screen follows. Code is the source of truth for values (`packages/ui/src/tokens.css`); this file explains them. Explicit product decisions, recorded in that product's own `DESIGN.md`, win over it.

## Principles

1. **One interaction light.** Stormlight blue marks what you can act on and where you are: focus, links, checked controls, the active navigation item, the first data series. Nothing else is blue.
2. **Light only appears dithered.** Fabrials are gems that hold stormlight. On screen, brand light is an ordered dither on canvas, never a gradient or a glow.
3. **Quiet, dense and crisp.** Screens read like good instruments: slate surfaces, hairline dividers, small radii, text at working sizes. One panel with dividers beats cards inside cards.
4. **Say what happened.** A stale value is not a fresh one; a configured connection is not a reachable one. Errors say what went wrong and what to do; empty states invite the next action.
5. **Accessible by default.** Every control has a name, a visible focus and a keyboard path. Colour always travels with text or a symbol.
6. **Small pieces, owned by the host.** Shared components present; products own routing, requests, authentication and storage. Compose small components instead of adding a universal one with dozens of flags.
7. **Built like an instrument.** A screen reads like a calibrated device: square plates, registration marks on the plates that matter, a scale under a figure, captions that say what a figure shows. The construction is shown, quietly; it is what makes a Fabrials page recognisable.
8. **Synthetic data in public.** Stories, docs and previews never show real mail, credentials or account records.

## Colour

Deep Stormwall: cold slate taken almost to black in the dark theme and almost to white in the light one, so the content and Stormlight carry the contrast. The palette is the same in every product. Values below are the references; the tokens hold them in oklch. (0.7 to 0.9 used the lighter Stormwall `#161a21` and a grey `#eceeeb` page.)

| Role | Token | Light | Dark |
| --- | --- | --- | --- |
| Page | `--background` | `#f6f7f8` | Deep Stormwall `#08090b` |
| Surface (plates, panels) | `--card` | `#ffffff` | `#0e1014` |
| Overlay (menus, dialogs) | `--popover` | `#ffffff` | `#14171c` |
| Sunken (code, wells) | `--muted`, `--fui-code` | `#eef0f2`, `#f0f2f4` | `#15181e`, `#0b0d10` |
| Hover | `--accent` | `#e9ecef` | `#191d24` |
| Hairline | `--border` | `#e0e3e7` | `#1d2128` |
| Control boundary | `--fui-control-border` | `#858d98` | `#5e6672` |
| Marks and guides | `--fui-mark`, `--fui-guide` | ink at half, hairline at 75 % | the same |
| Ink | `--foreground`, `--primary` | `#0e1116` | Cold bone `#e8eae6` |
| Secondary ink | `--muted-foreground` | `#565d68` | `#9399a2` |
| Stormlight ink (text, focus) | `--brand-ink`, `--ring` | `#2459b3` | `#9cc4ff` |
| Stormlight fill | `--brand` | `#2a63c4` | `#8fb8f5` |

- **Primary actions are ink**: ink on paper in light mode, paper on ink in dark. Stormlight fills a button only when one action must stand out (`variant="accent"`).
- **60, 30, 10.** About 60 % of a screen is the Stormwall page; about 30 % is the storm-slate layer (plates, sidebar, hover, hairlines, secondary ink), a cool blue slate one step above the page; at most 10 % is colour that means something: Stormlight for interaction and the status inks. A screen that is mostly accent, or where status colours outnumber Stormlight, is wrong.
- **Status inks come from the gems, not the stock palette**: verdigris for success (oxidised emerald, hue 168), heliodor brass for warning (hue 70 to 82), garnet for danger (ruby, hue 24), each at a similar lightness and a restrained chroma, and each with a word or icon beside it (`--fui-success-ink`, `--fui-warning-ink`, `--fui-danger-ink`; fills `--success`, `--warning`, `--destructive`). No Tailwind green, amber or red. Chart hues follow the same family: Stormlight, verdigris, brass, garnet, amethyst, steel.
- **Crem** `#5a5247`, a warm stone, exists only inside the storm's dither ramp.
- Contrast is checked on the real surfaces: body and control text meet WCAG AA in both themes.

### Gems

Each product signs its mark with a gem, set as `data-gem` on the document root and drawn by `DitherGem` or `FabrialsGem`. The gem colours the mark and nothing else: never a status, a button or a link.

| Gem | Signs |
| --- | --- |
| Stormlight | The Fabrials house mark, Radiant |
| Heliodor | fabrials.com, Usage AI |
| Sapphire | Syl |
| Ruby | Spanreed (spanreeds are ruby fabrials) |
| Emerald | X Tracker |
| Zircon | Fabrials UI, Urithiru |
| Smokestone | News, guides |
| Amethyst | ai.fabrials.com |

## Typography

The IBM Plex superfamily, served locally by `fonts.css` in Latin, Latin Extended, Cyrillic and Vietnamese subsets (Sans also Greek), each face limited by `unicode-range` so a page only downloads what it uses.

| Role | Face | Use |
| --- | --- | --- |
| Display | Plex Sans Condensed 600 (`--fui-font-display`) | Hero headlines (40 to 96 px, line height 0.94 to 0.98), page titles (32 px in apps, `--fui-text-page`; 36 px, 44 px from 1800 px, for documentation articles), marketing section titles (28 to 30 px), figures (40 px, `--fui-text-figure`), the wordmark |
| Interface | Plex Sans | Body and controls 14 px, metadata 12 px, subsections 16 px |
| Label (readings) | Plex Mono 11 px (`--fui-font-label`, `--fui-text-label`) | The second voice: labels of figures, table heads, numeric cells, description terms, eyebrows, sidebar group labels, axes, legends, captions, units, identifiers and readings ("Synced 14:32 UTC"). Sentence case, never tracked uppercase |
| Code | Plex Mono | Code, commands and keys |
| Editorial | Plex Serif | Quotations only |

Numbers use tabular figures. Headings wrap with `text-wrap: balance`. Copy is sentence case; no tracked uppercase eyebrows, no single word in a headline set in another colour, no arrows appended to link or button text. Arrows that show a direction (a pager's Previous and Next, a disclosure) are fine. Do not lower the contrast of essential text to make hierarchy.

## Space, density and shape

- Spacing follows a 4 px grid (`--fui-space-*`).
- Controls are 40 px (`--fui-control-height`); small 32, extra small 28, large 44. `data-density="compact"` tightens controls to 32 px and collection rows, as a composition choice, not a stored preference. Narrow screens and coarse pointers keep 44 px targets.
- **Plates are square.** Cards, stats, stat groups and tables are plates: a hairline, the surface, no corner radius (`--fui-radius-plate: 0`) and a soft resting elevation (`--fui-shadow-sm`). Everything else keeps crisp corners: 3 px for keys and badges, 4 px for small parts and tooltips, 5 px for controls, 6 px for menus, popovers and the command palette, 8 px for dialogs, sheets, toasts and the sign-in card (`--fui-radius-xs` to `--fui-radius-xl`). Tailwind's `rounded-2xl` and larger are not part of the system. Badges, counts and chips are tags with those 3 to 4 px corners, and a badge's status dot is square, like one pixel of the dither; `StatusDot` stays a round light. Pills are only for a passive label that must stand out.
- Separate with space and hairlines before borders. Do not box every label and control.

## Material

Components are not flat: they read as physical parts of an instrument. Depth comes only from a few shared recipes in `tokens.css` (adapted from Radix Themes, MIT):

| Recipe | Token | On |
| --- | --- | --- |
| Elevation | `--fui-shadow-xs` (controls), `-sm` (plates), `-md` (menus, popovers, toasts), `-lg` (dialogs, sheets) | Layered: a contact shadow, a short drop and a long soft one, darker in the dark theme |
| Key | `--fui-bevel` and `--fui-sheen` | Solid fills: primary and accent buttons, ticked checks and radios, a switch that is on. A light top edge, a dark bottom edge, a 10 to 16 % tonal sheen |
| Raised plate | `--fui-shadow-xs` and `--fui-highlight`, `--fui-sheen-soft` | Outline and destructive buttons, the chosen segment, a switch thumb, keycaps |
| Well | `--fui-shadow-well` | Fields, selects, unticked checks, a switch track, a segmented group: a soft inner shadow from the top |
| Pressed | `--fui-pressed` | A key while held: the bevel becomes an inner shadow and the key goes down 1 px |
| Focus | `--fui-focus-halo` | A field in focus: a Stormlight edge and a 3 px halo at 22 % |

- These tokens are the only gradients and the only shadows in the system. No glow, no coloured shadow, no gradient as decoration or text, no glass blur.
- Forced colors drop every sheen and shadow; states keep their system-colour forms.
- Tables scroll inside their labelled region; the page never scrolls sideways.

## Instrument details

The small marks that make a screen look built rather than generated. Each has one job; none is decoration for its own sake.

| Piece | Where | Rules |
| --- | --- | --- |
| `CornerMarks` | Around the plates that carry a page: the totals, the main chart, the main table, a hero figure | A 9 px cross on each corner in `--fui-mark`. Not on every box: three or four per screen at most |
| `GridGuides` | Behind a landing hero | The 12-column grid as dashed guides in `--fui-guide`, aligned to `--fui-page-padding`. Off under 768 px, in forced colors and in print. Text and controls sit above them |
| `CardCaption` | The last row of a plate that shows a figure or a chart | What the figure shows on the start side ("Last 14 days, local time."), a reading on the end side ("Peak 244 on Nov 4"). "Fig. 1." numbering only where a page shows several figures |
| `Meter variant="ruler"` and `Stat meter` | Under a figure that is a share or a level (unread of total, quota, disk) | Ticks every unit, taller every 5 and 10; inked up to the value; one Stormlight mark at the value; warning and danger tones colour the mark |
| The label voice | Everywhere a value is labelled or read | Plex Mono 11 px, muted ink. A value and its label never share a face |

## Dithering is the brand

Brand light is an 8×8 Bayer dither painted on a canvas (`@fabrials/ui/dither`). Each dot takes one colour of a short ramp that runs from the surface behind the canvas to the brightest light, so the dither fades into whatever it sits on. In the light theme the ramp runs toward dark slate with Stormlight at its core.

Three pieces use it, and every product uses them in these places:

| Piece | Where | Rules |
| --- | --- | --- |
| `DitherScene` | Landing hero: `variant="full"` inside a captioned plate with `CornerMarks` on the right (or `variant="hero"`, the front entering from the right); sign-in (`variant="full"`, or inside the `AuthLayout` aside) | Text sits on the calm side or on a solid surface, never on dense dither |
| `DitherBand` | Above a page or section heading that carries the brand (a public stats page, a product overview) | At most one per view |
| `DitherGem` | Product marks in navigation, index rows, empty states; large beside a hero | Sized 16, 20, 28 or 40 px; the gem is the product's |

- The ramp's first stop is `"background"`: `DitherCanvas` reads it from `--fui-dither-bg` (set it to `var(--card)` when the canvas sits on a card), else `--background`.
- `STORM_RAMP`, `gemRamp`, `stormField`, `stormBandField` and `gemField` are the official ramps and fields. A product may add its own field (X Tracker's telemetry, Radiant's night sky) on the same engine.
- A canvas paints once and repaints only on resize, theme change or new data. It never loops.
- Dots are 2 to 4 CSS pixels. Dithering stays off controls and body text.
- **Data is dithered too.** `SeriesChart` paints bars in 2 px ordered patterns: the first series dense in Stormlight, the second and third in ink at half and a quarter. A chart reads in greyscale and in print, and the data carries the same material as the brand. Series whose colour means something pass `color` and stay solid.

## Motion

Motion answers what a person did or what the data did, like an instrument responding to its controls: opening, expanding, choosing, confirming, a value arriving. Durations are 100, 150 and 240 ms (`--fui-duration-fast`, `--fui-duration`, `--fui-duration-slow`) with a quick-out ease, and all drop to 0 under reduced motion, where every state still shows at once.

The vocabulary (0.10, "living instrument"), each tied to one cause:

| Cause | Motion | Where |
| --- | --- | --- |
| A choice in a single-choice group | The indicator slides to the new item | `ToggleGroup`, `ThemeSwitcher`; the `Tabs` underline |
| A press | The key goes down 1 px while held | `Button` |
| A check | The tick is drawn | `Checkbox` |
| A level changes | The ruler inks its ticks in order and its mark travels | `Meter variant="ruler"`, `Stat meter` |
| A number changes | The digits roll like an odometer | `NumberTicker` |
| A reading changes | The characters cycle for 240 ms and settle left to right | `Readout` |
| Media or data arrives after the view is shown | It appears through a 2 px dither in four steps | `FileThumb`; any host element with `data-fui-reveal="in"` |
| Busy | A ring of square cells lights in turn (the only motion that loops) | `Spinner`, `Button loading`, `StatePanel` loading, loading toasts |
| Opening and closing | Overlays fade, scale and slide 4 px from their trigger's side on a quick-out curve (`--fui-ease-out`, 240 ms) and leave faster (100 ms); dialogs grow from 96 %; panels grow to their height | Menus, popovers, tooltips, dialogs, sheets, accordions |
| Holding a switch | The thumb stretches while held and springs across | `Switch` |
| A tick | The check or dot pops in from 60 % | `Checkbox`, `Radio` |

- Continuous motion is reserved for genuine loading indicators, and for a `StatusDot` with `pulse` while something is live or in progress.
- A page may have one orchestrated moment: `DitherScene` and a large `DitherGem` accept `reveal`, so the storm rolls in or the gem fills with light once on first paint. Never again, and not under reduced motion.
- A `TimelineItem` marked `fresh` highlights once when a live item arrives.
- `MoonPhase` and `Starfield` are the sign-in exception inherited from Radiant; they stop under reduced motion.
- Nothing moves on its own, nothing enters in a cascade on load, nothing reacts to scroll, nothing lifts on hover. No enter animations on navigation people repeat all day; a cached image or a value present at first render shows at once.
- Effects from animation libraries (React Bits and the like) are ideas, not code: their licences rarely allow redistribution in a library, and their defaults (perpetual motion, glow, stagger) break these rules.

## Loading states

A loading view is the finished view painted as its own skeleton. Wrap the real components in `Loading` and render them with placeholder data (`placeholderText`, `placeholderList`) while the data loads; turn it off when the data arrives.

- Text becomes a bar per line, as long as the text; icons, images and charts become blocks; coloured controls become neutral solid shapes; borders, tables and cards stay as structure; colour is removed entirely, so a loading view never shows a state it does not have yet.
- Only paint changes and the wrappers are `display: contents`, so nothing moves when loading ends, at any width and with any content. Keep placeholder lengths and row counts close to the real data.
- The content is inert while loading and a status message names what loads (`label`). Keep the control that starts a refresh outside `Loading`.
- The pulse is the one continuous motion and stops under reduced motion.
- Tune a part with `data-skeleton`: `keep` (paint as usual), `hide`, `block`, `fill`.
- Use a Spinner or a button's `loading` for an action in progress, Progress when the amount is known, and the standalone Skeleton block only where no component exists yet.

## Layout and composition

- **Product screens** read as an instrument panel: a `PageHeader` with a mono eyebrow (the period or source), then the totals as one `StatGroup` with rulers, the main chart and the main table as plates, each of those three inside `CornerMarks`, captions on figures. They use `WorkspaceShell` with navigation and header slots when they need a shell; hosts own routing, active state, authentication, theme storage and native window chrome. Mail keeps its resizable panes; desktop keeps native window behaviour.
- **Page patterns** come first: `PageHeader`, `SectionHeader`, `CollectionToolbar`, `Table`, `BulkActions`, `StatePanel`. Bulk actions appear once selection begins. Filters live next to their collection; primary actions next to their task.
- **Nothing is centred on the page.** Headers span the window; content anchors to the same left gutter (`--fui-page-padding`), with a maximum width for reading but no `margin-inline: auto`. On a wide screen the free space stays on the right. Centring is for small things inside a component (an empty state, a toast on a phone), never for a page column. Two frames are the exceptions: documentation uses three columns (a sidebar panel reaching the left edge, the article, the page index) whose outer columns share the extra width, and a sign-in `AuthLayout` without an aside centres its card; with the storm aside the card anchors left.
- **Landings** are left-aligned and asymmetric: `GridGuides` behind the hero, the headline and one command or action on the left (columns 1 to 6), the storm as a captioned plate with corner marks on the right (columns 8 to 12). Lists of products or features are indexes (rows with a mark, a name, one line and a link), not grids of identical cards. Numbered markers only for real sequences. Marketing compositions stay in the host and may use tokens and controls; they never become a `WorkspaceShell`.
- **Navigation** that will grow groups its items: fabrials.com's Products menu groups tools by how people use them (install, hosted, developers, open data), each with its gem.

## Content and voice

Write from the user's side: name things by what people recognise, in plain verbs and sentence case. An action keeps its name through the flow ("Revoke key", then "Key revoked"). Errors state what happened and how to fix it, without apologising. Empty states say what to do next. Product interfaces are in English unless the product decides otherwise.

## Components

The catalogue lives in Storybook (`bun run storybook`, port 6041) and at ui.fabrials.com, where every control has a page with a live preview and its import.

- **Controls:** Button (`default`, `accent`, `outline`, `secondary`, `ghost`, `destructive`, `link`; sizes `xs` to `lg` and `icon-*`; `loading`), Input, Textarea (`autoResize`), SearchInput, PasswordInput, NumberField, Slider, InputOTP, Field, Label, Checkbox, Switch, Select, RadioGroup, NativeRadioGroup, ToggleGroup, ThemeSwitcher, MultiSelect, Combobox, IconButton, FileInput, Toolbar, FieldSet.
- **Overlays:** Dialog, AlertDialog, Sheet, DropdownMenu (with submenus), Tooltip, Popover, StatusPopover, HoverCard, Command (with CommandTrigger), ConfirmDialog (and `useConfirm` for a confirm you can await). They render from `fui-` styles without Tailwind.
- **Collections:** Table, Tabs (vertical rail, scrolling strip), NavTabs, Item (records as rows), Badge, Progress, Skeleton, Card, Accordion (rows for a stack of tools), Disclosure, Breadcrumb, Pagination, DescriptionList, Kbd and KbdGroup.
- **Data:** Stat (with `meter`), StatGroup, Sparkline (scanline fill), Meter (`variant="ruler"`; threshold notches on the bar), StatusDot, Readout, NumberTicker, SeriesChart, ActivityStrip, Timeline, RelativeTime.
- **Docs pieces:** CodePanel, CodeTabs, PackageInstall, Files/Folder/File and RepoInfo. Syntax uses the muted `--fui-syntax-*` inks, never Stormlight.
- **Brand and chrome:** CornerMarks, GridGuides, CardCaption, DitherScene, DitherBand, DitherGem, DitherCanvas, ProductLockup, FabrialsGem, Avatar, Snippet, CopyButton, SiteHeader, AuthLayout, MoonPhase, Starfield.
- **Patterns:** WorkspaceShell, AppHeader, Sidebar (menu rows work without a shell), NavSwitcher, ResizablePanelGroup, PageHeader, SectionHeader, CollectionToolbar, BulkActions, StatePanel, SettingsSection, FilterChip, FileThumb, SuggestionCard, TruncatedText, ShimmerText.
- **Loading:** `Loading` with `placeholderText`, `placeholderList` and `useLoading` (see Loading states).
- **`@fabrials/ai-ui`:** provider, quota, history and migration presentation, and the chat pieces (ChatMessage, ChatComposer, CodeBlock with `.fui-markdown`, citations, activity, attachments, VoiceInputButton).

Every pattern covers its normal, loading, empty, error and long-content cases; the loading case is the pattern inside `Loading`. Use named exports; interactive modules carry `"use client"`, tokens and styles need no React. Controls keep Base UI or native semantics; form validation belongs to the host, and `Field` connects label, hint and error.

## Accessibility

Focus is a visible 2 px outline with an offset, in Stormlight. Base UI keeps keyboard traversal, Escape and focus return; do not break them when composing. Check both themes at 390, 768 and 1440 px and at 200 % text size. The visual suite runs axe on its stories in both themes and three widths; it does not replace using the screen with a keyboard.

- **Forced colors** (Windows high contrast) repaint every background in Canvas and drop every shadow, so a state is never only a fill or a `box-shadow`: the packages carry one block that gives meters, switches, badges, legend keys and pressed segments a form in system colors (`Highlight`, `CanvasText`). A pressed or active item is a bar under its label: not an outline (that is the focus ring's shape) and not a `Highlight` fill behind the text (Chromium paints a Canvas backplate behind text over an author background).
- **A page is a landmark.** `AuthLayout` is the sign-in page's `<main>`; a host that already renders one passes `as="div"`.

## Using the system in a product

Import once, in this order, and set the theme and gem on the root element:

```css
@import "@fabrials/ui/tokens.css";
@import "@fabrials/ui/fonts.css";
@import "@fabrials/ui/styles.css";
@import "@fabrials/ai-ui/styles.css"; /* products with AI pieces */
@import "@fabrials/ui/tailwind.css"; /* Tailwind 4 products */
```

```html
<html class="dark" data-gem="ruby">
```

Shared styles use the `fui-` prefix in the `components` cascade layer and work without Tailwind. Host overrides come after them and express a documented product requirement, not a restyle of an equivalent control. A product that retints tokens (Radiant's night sky) does it in its global CSS for both themes and records it in its own `DESIGN.md`. Do not read `localStorage` or browser globals while rendering shared components.

Fabrials products consume a verified copy (`bun run vendor <product> --write`), never edited by hand. Other apps install from the registry.

Serve `fonts.css` and the font files as files. A bundler that inlines small assets (Bun 1.4 inlines anything under 128 KB as base64) puts all 39 faces into the stylesheet and defeats `unicode-range`; copy `dist/fonts` and link `fonts.css` instead (Palanaeum does).

For a system theme with no script, set `data-theme="system"` on the root (and no `.dark` class): tokens, dither canvases and toasts follow `prefers-color-scheme`. A Tailwind host covers it in its dark variant:

```css
@custom-variant dark {
  &:where(.dark, .dark *, [data-theme="dark"], [data-theme="dark"] *) { @slot; }
  @media (prefers-color-scheme: dark) {
    &:where([data-theme="system"], [data-theme="system"] *) { @slot; }
  }
}
```

## The registry and other libraries

ui.fabrials.com publishes a shadcn registry with two kinds of entry:

- **Fabrials components:** the controls above, and the WebMCP and MCP blocks. `init` sets an app up with the palette; `styles` imports the CSS without changing the palette.
- **Shims:** shadcn primitives backed by Fabrials controls, generated for every primitive `@fabrials/ui` covers completely, so code written for shadcn gets Fabrials controls.
The registry does not republish other libraries. When a product needs a component another library offers, the system adopts it: the piece is rewritten into the packages to this document (tokens, material, motion, keyboard and both themes), with a story, a keyboard test and a visual reference, so every product gets one version that looks and behaves like the rest. A technique or recipe adapted from a permissively licensed project (MIT, Apache-2.0, ISC, BSD) keeps its notice beside the code and in `THIRD_PARTY.md`; a project under extra terms (Commons Clause and the like) is only studied, never copied.

## Extending the system

- Generic presentation belongs in `@fabrials/ui`; provider, quota, migration and chat presentation in `@fabrials/ai-ui`, which depends on it. Network clients and product policy stay in products.
- A new public component or variant needs a story, a keyboard test and a visual reference. Where shadcn has a name for the part, use it: that is what lets the shim cover it.
- Changing a public contract means a version bump and a note in `docs/migration-<version>.md`.
- A product's justified exception goes in that product's `DESIGN.md`, not here.
