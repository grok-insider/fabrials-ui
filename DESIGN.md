# Fabrials design system

Fabrials UI 0.11 "Instrument with life" is the shared interface of the Fabrials products and the registry at ui.fabrials.com. This document is the brief: what the system looks like, why, and the rules a screen follows. Code is the source of truth for values (`packages/ui/src/tokens.css`); this file explains them. Explicit product decisions, recorded in that product's own `DESIGN.md`, win over it.

## Principles

1. **One interaction light.** Stormlight blue marks what you can act on and where you are: focus, links, checked controls, the active navigation item, the first data series. Nothing else is blue, apart from the working light while something works (principle 2).
2. **Light is dithered, or it is work.** Fabrials are gems that hold stormlight. On screen, brand light is an ordered dither on canvas. The one other light is the working light: while an agent works or something loads, a band of light turns along an edge or crosses a label, and it goes out when the work ends. Nothing else glows.
3. **Calm surfaces, grouped by space.** Screens read like good instruments: slate surfaces, plates with soft corners, text at working sizes. Things that belong together share one plate; space and a tint separate them before a line does, and the lines that remain are soft. One plate with soft dividers beats cards inside cards, and a state is a tint, not a box.
4. **Say what happened.** A stale value is not a fresh one; a configured connection is not a reachable one. Errors say what went wrong and what to do; empty states invite the next action.
5. **Accessible by default.** Every control has a name, a visible focus and a keyboard path. Colour always travels with text or a symbol.
6. **Small pieces, owned by the host.** Shared components present; products own routing, requests, authentication and storage. Compose small components instead of adding a universal one with dozens of flags.
7. **Built like an instrument, alive like one.** A screen reads like a calibrated device: a scale under a figure, captions that say what a figure shows, readings in the label voice. And it responds like one: what arrives rises into place, what you press goes down, what works carries light. Registration marks and the drawn grid are kept for brand moments.
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
| Thumb of an off switch | `--fui-switch-thumb` | the surface | ink at 66 % on the sunken track, so the state reads at about 6:1 |
| Soft divider (rows inside one plate) | `--fui-separator` | the hairline at 62 % on the surface | the same |
| Inset band (a table head, a well) | `--fui-surface-inset` | ink at 3.5 % on the surface | the same |
| Hover fill | `--fui-surface-hover` | ink at 4.5 % on the surface | the same |
| Marks and guides | `--fui-mark`, `--fui-guide` | ink at half, hairline at 75 % | the same |
| Ink | `--foreground`, `--primary` | `#0e1116` | Cold bone `#e8eae6` |
| Secondary ink | `--muted-foreground` | `#565d68` | `#9399a2` |
| Stormlight ink (text, focus) | `--brand-ink`, `--ring` | `#2459b3` | `#9cc4ff` |
| Stormlight fill | `--brand` | `#2a63c4` | `#8fb8f5` |

- **Primary actions are ink**: ink on paper in light mode, paper on ink in dark. Stormlight fills a button only when one action must stand out (`variant="accent"`).
- **60, 30, 10.** About 60 % of a screen is the Stormwall page; about 30 % is the storm-slate layer (plates, sidebar, hover, hairlines, secondary ink), a cool blue slate one step above the page; at most 10 % is colour that means something: Stormlight for interaction and the status inks. A screen that is mostly accent, or where status colours outnumber Stormlight, is wrong.
- **Status inks come from the gems, not the stock palette**: verdigris for success (oxidised emerald, hue 168), heliodor brass for warning (hue 70 to 82), garnet for danger (ruby, hue 24), each at a similar lightness and a restrained chroma, and each with a word or icon beside it (`--fui-success-ink`, `--fui-warning-ink`, `--fui-danger-ink`; fills `--success`, `--warning`, `--destructive`). No Tailwind green, amber or red. Chart hues follow the same family: Stormlight, verdigris, brass, garnet, amethyst, steel.
- **A state is a tint.** A tinted surface mixes its tone into the card: an alert, a selected row and an error panel at `--fui-tint-strength` (8 % light, 12 % dark), a tag at `--fui-tint-strong` (13 %, 18 %), the edge at `--fui-tint-edge` (22 %, 28 %). The text on it is the tone's ink, so it keeps AA.
- **The working light** is three gems, `--fui-light-1` to `-3` (Stormlight, zircon, amethyst). It paints only `WorkingLight`, `ShimmerText tone="light"` and the agent pieces of `@fabrials/ai-ui` while they work.
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
- **Soft corners, one scale.** 4 px for keys, kbd and small marks; 6 px for tags, chips and small controls; 8 px for controls (buttons, fields, selects, segments); 10 px for menus, popovers and the command palette; 12 px for plates (cards, stats, stat groups, tables, code panels, alerts, state panels, toasts); 16 px for dialogs and sheets (`--fui-radius-xs` to `--fui-radius-2xl`, `--fui-radius-plate`). Dots, avatars, switches and meter tracks are round. Nothing rounder than 16 px except those.
- **Plates.** A plate is the surface, a hairline edge, 12 px corners and a soft resting elevation (`--fui-shadow-xs` and the top highlight). What belongs together shares one plate: a `StatGroup` is one plate whose figures are divided by soft lines that stop short of its edges; a table's head is an inset band inside its plate; a card's footer and caption sit on the plate with no line above them.
- **Tags.** Badges are soft tags: 6 px corners, a tint of their tone and the tone's ink, a round dot. The outline variant is the only one with an edge; solid is for the rare tag that must shout. Three sizes (18, 20 and 24 px); an icon is a 12 px glyph in the tag's ink before the word; a number on its own is a count, centred in a tag at least as wide as it is tall. A tag that is a link or a button deepens its tint under the pointer, and a pressed one keeps that tint with an edge in its colour.
- Separate with space first, a tint second and a soft line third. Do not box every label and control, and never put a plate inside a plate.

## Material

Components are not flat: they read as physical parts of an instrument. Depth comes only from a few shared recipes in `tokens.css` (adapted from Radix Themes, MIT):

| Recipe | Token | On |
| --- | --- | --- |
| Elevation | `--fui-shadow-xs` (controls and plates), `-sm` (a raised plate, a card under the pointer), `-md` (menus, popovers, toasts), `-lg` (dialogs, sheets) | Layered: a contact shadow, a short drop and a long soft one, darker in the dark theme |
| Key | `--fui-bevel` and `--fui-sheen` | Solid fills: primary and accent buttons, ticked checks and radios, a switch that is on. A light top edge, a dark bottom edge, a 10 to 16 % tonal sheen |
| Raised plate | `--fui-shadow-xs` and `--fui-highlight`, `--fui-sheen-soft` | Outline and destructive buttons, the chosen segment, a switch thumb, keycaps, the current row of a sidebar or a vertical tab rail (on `--fui-sidebar-active`) |
| Well | `--fui-shadow-well` | Fields, selects, unticked checks, a switch track, a segmented group: a soft inner shadow from the top |
| Pressed | `--fui-pressed` | A key while held: the bevel becomes an inner shadow and the key goes down 1 px |
| Focus | `--fui-focus-halo` | A field in focus: a Stormlight edge and a 3 px halo at 22 % |

- These tokens are the only gradients and the only shadows in the system, with one exception: the working light (`WorkingLight`, `ShimmerText tone="light"`), which exists only while something works. No other glow, no coloured shadow, no gradient as decoration or text, no glass blur.
- Forced colors drop every sheen and shadow; states keep their system-colour forms.
- Tables scroll inside their labelled region; the page never scrolls sideways.

## Instrument details

The small marks that make a screen look built rather than generated. Each has one job; none is decoration for its own sake.

| Piece | Where | Rules |
| --- | --- | --- |
| `CornerMarks` | Brand moments only: the hero figure of a landing, a figure on a sign-in page or a public stats page | A 9 px cross on each corner in `--fui-mark`, like registration marks around a print. Never on product screens, at most two per page |
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

Motion answers what a person did, what the data did or what an agent is doing, like an instrument responding to its controls: opening, expanding, choosing, confirming, a value arriving, work in progress. Durations are 100, 150 and 240 ms (`--fui-duration-fast`, `--fui-duration`, `--fui-duration-slow`) on a quick-out ease (`--fui-ease-out`); things a hand moves (a thumb, a tile landing) may overshoot a little on `--fui-ease-spring`. All of it drops to 0 under reduced motion, where every state still shows at once.

The vocabulary (0.11, "instrument with life"), each tied to one cause:

| Cause | Motion | Where |
| --- | --- | --- |
| A choice in a single-choice group | The plate slides to the new item, its leading edge first, and settles; a chosen theme's icon turns into place | `ToggleGroup`, `ThemeSwitcher`, segmented `Tabs`; the `Tabs` underline slides |
| A filter cleared | The chip fades and shrinks a little before it goes; focus moves to the next chip | `FilterChip` |
| Something is live | The dot ripples outward while it lasts, and stops with it | `StatusDot pulse`, `Badge dot pulse` |
| A press | The key goes down 1 px while held | `Button` |
| A check | The tick is drawn | `Checkbox` |
| A level changes | The ruler inks its ticks in order and its mark travels | `Meter variant="ruler"`, `Stat meter` |
| A task advances | The fill eases to the new amount; segments ink in order; a ring closes | `Progress` (`steps`, `variant="ring"`) |
| Work whose total is not known yet | The working light crosses the track, or turns round the ring; a dashed line or ring holds still under reduced motion | `Progress` without a value |
| A number changes | The digits roll like an odometer | `NumberTicker` |
| A reading changes | The characters cycle for 240 ms and settle left to right | `Readout` |
| Something arrives after the view is shown | It rises 4 px out of a slight blur; a list staggers its items by 45 ms, up to the eighth | `.fui-rise` with `--fui-stagger`; an agent's steps, search results, attachment tiles |
| Media or data arrives after the view is shown | It appears through a 2 px dither in four steps | `FileThumb`; any host element with `data-fui-reveal="in"` |
| Busy | A ring of square cells lights in turn | `Spinner`, `Button loading`, `StatePanel` loading, loading toasts |
| An agent works | The working light turns along the edge of what it works on, a band of light crosses its label, its indicator ripples, and the time it has taken counts up | `WorkingLight`, `ShimmerText tone="light"`, the agent pieces of `@fabrials/ai-ui` |
| Opening and closing | Overlays fade, scale and slide 4 px from their trigger's side and leave faster (100 ms); dialogs grow from 96 %; an accordion's body rises out of a slight blur as its panel grows | Menus, popovers, tooltips, dialogs, sheets, accordions |
| A pointer over a card that is a link | The card lifts 1 px and its shadow deepens | `Card` with `interactive` |
| Holding a switch | The thumb stretches while held and springs across | `Switch` |
| A tick | The check or dot pops in from 60 % | `Checkbox`, `Radio` |

- Continuous motion is reserved for genuine loading indicators, an agent at work, a `Progress` whose total is not known yet, and a `StatusDot` or `Badge` dot with `pulse` while something is live or in progress. Each stops when the work does.
- A page may have one orchestrated moment: `DitherScene` and a large `DitherGem` accept `reveal`, so the storm rolls in or the gem fills with light once on first paint. Never again, and not under reduced motion.
- A `TimelineItem` marked `fresh` highlights once when a live item arrives.
- `MoonPhase` and `Starfield` are the sign-in exception inherited from Radiant; they stop under reduced motion.
- Nothing moves on its own and nothing reacts to scroll. Arrivals rise only when they arrive after the view is shown: the first paint of a screen people revisit all day, a cached image and a value present at first render show at once, with no cascade.
- Effects from animation libraries (React Bits and the like) are ideas, not code: their licences rarely allow redistribution in a library, and their defaults (perpetual motion, glow, stagger on load) break these rules.

## Loading states

A loading view is the finished view painted as its own skeleton. Wrap the real components in `Loading` and render them with placeholder data (`placeholderText`, `placeholderList`) while the data loads; turn it off when the data arrives.

- Text becomes a bar per line, as long as the text; icons, images and charts become blocks; coloured controls become neutral solid shapes; borders, tables and cards stay as structure; colour is removed entirely, so a loading view never shows a state it does not have yet.
- Only paint changes and the wrappers are `display: contents`, so nothing moves when loading ends, at any width and with any content. Keep placeholder lengths and row counts close to the real data.
- The content is inert while loading and a status message names what loads (`label`). Keep the control that starts a refresh outside `Loading`.
- The pulse is the one continuous motion and stops under reduced motion.
- Tune a part with `data-skeleton`: `keep` (paint as usual), `hide`, `block`, `fill`.
- Use a Spinner or a button's `loading` for an action in progress, Progress when the amount is known (and, without a value, for the moment before a total arrives), and the standalone Skeleton block only where no component exists yet.

## Layout and composition

- **Product screens** read as an instrument panel: a `PageHeader` with a mono eyebrow (the period or source), then the totals as one `StatGroup` with rulers, the main chart and the main table as plates, captions on figures. No corner marks or guides on product screens. They use `WorkspaceShell` with navigation and header slots when they need a shell; hosts own routing, active state, authentication, theme storage and native window chrome. Mail keeps its resizable panes; desktop keeps native window behaviour.
- **Page patterns** come first: `PageHeader`, `SectionHeader`, `CollectionToolbar`, `Table`, `BulkActions`, `StatePanel`. Bulk actions appear once selection begins. Filters live next to their collection; primary actions next to their task.
- **Nothing is centred on the page.** Headers span the window; content anchors to the same left gutter (`--fui-page-padding`), with a maximum width for reading but no `margin-inline: auto`. On a wide screen the free space stays on the right. Centring is for small things inside a component (an empty state, a toast on a phone), never for a page column. Two frames are the exceptions: documentation uses three columns (a sidebar panel reaching the left edge, the article, the page index) whose outer columns share the extra width, and a sign-in `AuthLayout` without an aside centres its card; with the storm aside the card anchors left.
- **Landings** are left-aligned and asymmetric: `GridGuides` behind the hero, the headline and one command or action on the left (columns 1 to 6), the storm as a captioned plate with corner marks on the right (columns 8 to 12). This hero is the brand moment; the sections below it use plain plates. Lists of products or features are indexes (rows with a mark, a name, one line and a link), not grids of identical cards. Numbered markers only for real sequences. Marketing compositions stay in the host and may use tokens and controls; they never become a `WorkspaceShell`.
- **Navigation** that will grow groups its items: fabrials.com's Products menu groups tools by how people use them (install, hosted, developers, open data), each with its gem.

## Content and voice

Write from the user's side: name things by what people recognise, in plain verbs and sentence case. An action keeps its name through the flow ("Revoke key", then "Key revoked"). Errors state what happened and how to fix it, without apologising. Empty states say what to do next. Product interfaces are in English unless the product decides otherwise.

## Components

The catalogue lives in Storybook (`bun run storybook`, port 6041) and at ui.fabrials.com. Each main component has a page in both: the component in context, then every way of using it as a live demo over its code (the examples live once, in `apps/site/components/examples`), and in Storybook a playground of its props with their documentation read from the types.

- **Controls:** Button (`default`, `accent`, `outline`, `secondary`, `ghost`, `destructive`, `link`; sizes `xs` to `lg` and `icon-*`; `loading`), Input, Textarea (`autoResize`), SearchInput, PasswordInput, NumberField, Slider, InputOTP, Calendar, DatePicker, DateRangePicker, Dropzone, Field, Label, Checkbox, Switch, Select, RadioGroup, NativeRadioGroup, ToggleGroup, ThemeSwitcher, MultiSelect, Combobox, IconButton, FileInput, Toolbar, FieldSet.
- **Overlays:** Dialog, AlertDialog, Sheet, DropdownMenu (with submenus), ContextMenu, ImageViewer (a dark stage in both themes), Tooltip, Popover, StatusPopover, HoverCard, Command (with CommandTrigger), ConfirmDialog (and `useConfirm` for a confirm you can await). They render from `fui-` styles without Tailwind.
- **Collections:** Table, Tabs (vertical rail, scrolling strip), NavTabs, Item (records as rows), ListBox (rows people choose from; `virtual` for thousands), VirtualList, Spreadsheet (a read-only workbook; `@fabrials/ui/spreadsheet` reads CSV and .xlsx), Badge, Progress, Skeleton, Card, Accordion (rows for a stack of tools), Disclosure, Breadcrumb, Pagination, DescriptionList, Kbd and KbdGroup.
- **Data:** Stat (with `meter`), StatGroup, Sparkline (scanline fill), Meter (`variant="ruler"`; threshold notches on the bar), StatusDot, Readout, NumberTicker, SeriesChart, ActivityStrip, Timeline, RelativeTime.
- **Docs pieces:** CodePanel, CodeTabs, PackageInstall, Files/Folder/File and RepoInfo. Syntax uses the muted `--fui-syntax-*` inks, never Stormlight.
- **Media:** Image, AspectRatio, MediaGrid, ImageViewer, VideoPlayer, AudioPlayer, AnimatedImage (a GIF or a silent loop that moves only on screen and can always be paused); Avatar sizes `xs` to `xl`, AvatarGroup with a count, AvatarBadge.
- **Brand and chrome:** CornerMarks, GridGuides, CardCaption, DitherScene, DitherBand, DitherGem, DitherCanvas, ProductLockup, FabrialsGem, Avatar, Snippet, CopyButton, SiteHeader, AuthLayout, MoonPhase, Starfield.
- **Patterns:** WorkspaceShell, AppHeader, Sidebar (menu rows work without a shell), SidePanel (a docked detail pane, a sheet on a phone), NavSwitcher, ResizablePanelGroup, PageHeader, SectionHeader, CollectionToolbar, BulkActions, StatePanel, SettingsSection, FilterChip, FileThumb, SuggestionCard, TruncatedText, ShimmerText (`tone="light"` for an agent at work), WorkingLight.
- **Loading:** `Loading` with `placeholderText`, `placeholderList` and `useLoading` (see Loading states).
- **`@fabrials/ai-ui`:** provider, quota, history and migration presentation, the chat pieces (ChatMessage, ChatComposer, CodeBlock with `.fui-markdown`, citations, activity, attachments, VoiceInputButton), and the agent at work: AgentThinking and AgentMark, TaskList, GenerationFrame, ContextMeter. These carry the working light only while they work, say their state in words (a polite status) and hold still under reduced motion.

Every pattern covers its normal, loading, empty, error and long-content cases; the loading case is the pattern inside `Loading`. Use named exports; interactive modules carry `"use client"`, tokens and styles need no React. Controls keep Base UI or native semantics; form validation belongs to the host, and `Field` connects label, hint and error.

## Accessibility

Focus is a visible 2 px outline with an offset, in Stormlight. Base UI keeps keyboard traversal, Escape and focus return; do not break them when composing. Check both themes at 390, 768 and 1440 px and at 200 % text size. The visual suite runs axe on its stories in both themes and three widths; it does not replace using the screen with a keyboard.

- **Forced colors** (Windows high contrast) repaint every background in Canvas and drop every shadow, so a state is never only a fill or a `box-shadow`: the packages carry one block that gives meters, switches, badges, legend keys and pressed segments a form in system colors (`Highlight`, `CanvasText`). A pressed or active item is a bar under its label: not an outline (that is the focus ring's shape) and not a `Highlight` fill behind the text (Chromium paints a Canvas backplate behind text over an author background).
- **A page is a landmark.** `AuthLayout` is the sign-in page's `<main>`; a host that already renders one passes `as="div"`.
- **Right to left** takes two settings from the same value: `dir="rtl"` on the root turns the layout (the components use logical CSS), and `DirectionProvider direction="rtl"` turns Base UI's behaviour (slider thumbs and their arrow keys, menus, tabs, toolbars). With only the attribute, a slider draws its thumb a thumb's width off the end of its fill and its arrows run the wrong way.

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
