# Fabrials design system

Version: 0.7.0 "Highstorm". 0.7 gives the family its brand: cold slate neutrals, IBM Plex Sans Condensed for display, crisper corners and a dithered storm (DitherScene, DitherBand, DitherGem) on landings, sign-in and product marks; no product consumes it yet. X Tracker and Radiant consume 0.6.2. AI Relay, the Spanreed desktop and fabrials.com consume 0.4; admin.fabrials.com, Open Mail and Ditox 0.3; ui.fabrials.com 0.5. ui.fabrials.com documents every `@fabrials/ui` control next to its WebMCP catalogue. Those design-system pages are live previews and usage notes, not registry install items. Distribution of `@fabrials/ui` remains a verified vendor copy, not an npm release.

## Identity

One family, one interaction light. Cold slate neutrals carry the screen (stormwall `#161a21` in dark, `#eceeeb` in light). IBM Plex Sans is the interface face, Plex Sans Condensed (500/600, `--fui-font-display`) sets page titles, hero headlines and the wordmark, Plex Mono is for code, keys and identifiers, and Plex Serif is for editorial quotes only. Numbers use Plex Sans with tabular figures. "Stormlight" (`--brand`, `--ring`, `--fui-focus`) is the only interaction color: focus, links, checked controls, the active navigation indicator and the first data series. Each product signs its mark with `data-gem` (`heliodor`, `sapphire`, `ruby`, `emerald`, `zircon`, `smokestone`, `stormlight`, `amethyst`). The gem colors `var(--gem)` and the lockup mark. It is never a status or a primary button.

Primary actions are ink on paper (paper on ink in dark mode). Success, warning and danger have their own inks. Corners are crisp: controls 5 px, containers 6 px, overlays 8 px; pills only for a passive label that must stand out. Prefer one panel with hairline dividers to cards inside cards. Preserve third-party provider marks and actual user content. No decorative gradients, glows, tracked uppercase eyebrows or perpetual motion.

## Dithering is the brand

A fabrial is a gem that holds stormlight; on screen, light only appears dithered (8×8 Bayer on canvas). Every product uses it in three places:

- **Landing hero and sign-in:** `DitherScene` paints the storm front (`variant="hero"` from the right, `variant="full"` behind a sign-in card). Text sits on the calm side or on a solid surface, never on dense dither.
- **Section and page bands:** `DitherBand` above a heading signs a page (a public stats page, a product overview). At most one per view.
- **Product marks:** `DitherGem gem="…"` in navigation, index rows and empty states. The gem colour is the product's gem and nothing else.

Ramps run from the surface behind the canvas to the brightest light (`order="ramp"`); the surface stop is read from `--fui-dither-bg` (set it to `var(--card)` on a card), else `--background`, so the dither fades into whatever it sits on. `STORM_RAMP`, `gemRamp`, `stormField`, `stormBandField` and `gemField` in `@fabrials/ui/dither` are the official ones; product-specific fields (X Tracker's telemetry, Radiant's night sky) stay in the product and use the same engine.

The source of truth is `packages/ui/src/tokens.css`. Its semantic color names remain compatible with existing shadcn hosts. Shared component styles use the `fui-` prefix in the `components` cascade layer and do not require Tailwind. Hosts import tokens, fonts and styles once. Tailwind v4 hosts may also import `@fabrials/ui/tailwind.css` for the theme bridge. Host overrides belong after shared styles and should express a documented product requirement, not restyle equivalent controls. Set `class="dark"` or `data-theme="dark"`, and `data-gem`, on the document root.

## Typography and density

Use the token font stack: Plex Sans for interface text, Plex Mono for code and identifiers, Plex Serif for editorial display. `fonts.css` ships each family in Latin, Latin Extended, Cyrillic and Vietnamese subsets (Sans also Greek), each face limited by `unicode-range`, so user content in those scripts renders in Plex. Use tabular numerals. Body and controls use 14px, supporting metadata 12px, subsection headings 16px and page headings 24px. Do not reduce essential text contrast to suggest hierarchy.

Spacing follows 4px increments. Standard controls are 40px; `data-density="compact"` uses 32px controls and tighter collection rows. Narrow/coarse-pointer layouts retain at least 44px control targets. Compact mode is a composition option, not a new stored user preference. Portaled menus and dialogs keep standard density. Avoid stacking a border around every label/control group.

## Composition

`WorkspaceShell` accepts navigation and header slots. Hosts own route resolution, active state, authentication, theme persistence, platform window chrome and native drag behavior. Shared components never import those implementations.

Use `PageHeader`, `SectionHeader`, `CollectionToolbar`, `Table`, `BulkActions` and `StatePanel` before inventing another page pattern. Show bulk actions only after selection begins. Keep filters close to their collection and primary actions close to the task they perform. Normal connectivity is quiet; stale/offline/error states state what happened and what the user can do.

The shell is not a mandatory universal layout: mail retains its resizable three panes; desktop retains native window behavior. Marketing compositions stay in the host. They may import tokens and generic controls; they do not become a `WorkspaceShell`.

## Components and state

The catalogue lives in Storybook (`bun run storybook`, localhost:6041) and is documented at ui.fabrials.com. Stories and docs use synthetic data, never mail, credentials or account records captured from production.

- Controls: Button (including `accent`, `xs` and `loading`), Input, Textarea, Field, Label, Checkbox, Switch, Select, RadioGroup, ToggleGroup and ThemeSwitcher.
- Overlays: Dialog, AlertDialog, SheetContent, DropdownMenu, Tooltip, Popover, HoverCard and Command. These render from `fui-` styles without a Tailwind host.
- Collections: Table, Tabs, Badge, Progress, Skeleton, Card, Accordion, Breadcrumb, Pagination, DescriptionList, Kbd, NumberTicker and SeriesChart.
- Data: Stat, StatGroup, Sparkline, Meter and StatusDot. Color always has a text or symbol companion.
- Brand and chrome: ProductLockup, FabrialsGem, Avatar, Snippet, CopyButton, SiteHeader and AuthLayout.
- Patterns: WorkspaceShell, Sidebar, PageHeader, SectionHeader, CollectionToolbar, BulkActions and StatePanel.
- Added in 0.5: ConfirmDialog, TruncatedText, SettingsSection, FilterChip, FileThumb, SuggestionCard, ShimmerText and `groupByRecency`; `MoonPhase` and `Starfield` for sign-in and landing surfaces.
- Added in 0.7, the brand: `DitherScene`, `DitherBand`, `DitherGem`; `DitherCanvas` gains `order`, `reveal` and a `"background"` ramp stop. `Snippet` wraps long commands instead of scrolling.
- Added in 0.6, for live dashboards: `DitherCanvas` (a static ordered-dither background; the pure engine is `@fabrials/ui/dither`), `ActivityStrip` (intensity cells with a screen-reader table), `Timeline`/`TimelineItem` (event feed with a one-off `fresh` highlight), `RelativeTime` and `NavTabs`/`NavTab` (link tabs; the host passes its link through `render`).
- `@fabrials/ai-ui` chat pieces (0.5): ChatMessage and message actions, ChatComposer, CodeBlock with `.fui-markdown`, citations and sources, activity disclosures, attachments and VoiceInputButton.

Use named exports for React server/client compatibility. Shared interactive entries retain `use client`; tokens and styles have no React dependency. Each control keeps Base UI/native semantics and an accessible name. Form validation belongs to the host; `Field` connects the label, hint and error with the control.

Every new pattern needs normal, loading, empty, error and long-content cases where applicable. A stale observation is not a fresh value; a configured connection is not proven reachability. Color always has a textual or symbolic companion.

## Theme, accessibility and motion

Light, dark and system themes share semantic names. Hosts apply `.dark` to the document root and keep their existing preference storage. Do not read localStorage or browser globals during shared-component rendering.

Focus is a visible 2px outline with offset. Preserve keyboard traversal, Escape handling and focus restoration through Base UI. Use AA contrast for meaningful text and controls; verify actual surfaces, not token values in isolation. Check 390/768/1440 widths and 200% text/viewport zoom. Data tables can scroll inside their labeled region; the page must not overflow horizontally.

Motion uses the 140ms feedback token. Continuous motion is reserved for genuine loading indicators and stops under reduced motion. A page may have one orchestrated moment: `DitherScene` and a large `DitherGem` accept `reveal` (the storm rolls in, the gem fills with light) once on first paint, never again and not under reduced motion. The one sanctioned exception is `MoonPhase`/`Starfield` on sign-in and landing surfaces; they also stop under reduced motion. `DitherCanvas` is the sanctioned texture: it paints once (again only on resize, theme or data change), never loops, and sits behind panels, never directly under body text. A `TimelineItem` marked `fresh` highlights once when a live item arrives; nothing loops. Do not add enter animations to frequently repeated navigation.

## Extending the system

Generic presentation belongs in `@fabrials/ui`; provider, quota, migration and consumption components belong in `@fabrials/ai-ui`. The latter depends on the former. Network clients and product policy remain in their applications. Do not add a universal component controlled by dozens of product flags; compose smaller pieces.

Describe a justified exception in the consuming product's design document. Add a story, keyboard test and visual reference before extending a public variant. Update the package version and migration notes when changing a public contract. Never hand-edit generated vendor copies.
