# Provenance of catalog additions

These controls were copied into `@fabrials/ui` on 2026-09-22 because a product
screen already imported them. Each source file starts with the same origin
note. Fabrials will modify the copies. ui.fabrials.com documents these
controls on `/components` and `/docs/<slug>`. Those pages are previews and
usage notes. They are not added to `public/r/*.json`. The installable
registry stays the WebMCP catalog.

The package already owned button, input, textarea, select, checkbox, switch,
label, dialog, sheet, dropdown menu, tooltip, badge, card, alert, separator,
skeleton, progress, table, tabs, combobox, and field. Those were not copied
again. Dropdown items accept the shadcn `variant="destructive"` alias in
addition to `destructive`, so Radiant menus can use the existing menu.

| File | Origin | Requested by |
| --- | --- | --- |
| `collapsible.tsx` | shadcn/ui (Base UI Collapsible) | Radiant chat (search, reasoning, sources, tools) |
| `scroll-area.tsx` | shadcn/ui (Base UI Scroll Area) | Radiant suggestions |
| `spinner.tsx` | shadcn/ui | Radiant login and composer |
| `button-group.tsx` | shadcn/ui (Base UI render helpers) | Radiant message actions |
| `input-group.tsx` | shadcn/ui | Radiant composer |
| `hover-card.tsx` | shadcn/ui (Base UI Preview Card) | Radiant composer, attachments, citations |
| `popover.tsx` | shadcn/ui (Base UI Popover) | Copied from the fabrials.com kit. No in-scope screen imports it yet. |
| `navigation-menu.tsx` | shadcn/ui (Base UI Navigation Menu) | fabrials.com header |
| `sidebar.tsx` | shadcn/ui sidebar | Radiant app shell and the ai-relay dashboard |
| `command.tsx` | shadcn/ui (cmdk) | Radiant composer |
| `carousel.tsx` | shadcn/ui (Embla Carousel) | Radiant inline citations |
| `toaster.tsx` | shadcn/ui sonner wrapper | Radiant and ai-relay toasts |
| `kbd.tsx` | Fabrials | Shortcut hint on the command palette. Not the Spectrum 3D keycap. |
| `number-ticker.tsx` | Spectrum UI number ticker (beUI, Apache-2.0) | ai-relay overview totals and Spanreed pool size |
| `chart.tsx` | shadcn/ui chart (Recharts), adapted to one series chart | ai-relay usage-by-model bars; Spanreed plan cost lines and model mix |

`class-variance-authority`, `cmdk`, `embla-carousel-react`, and `sonner` are
dependencies of this package. Hosts should not depend on them directly.
`motion` and `recharts` were added for the ticker and the series chart.
`@base-ui/react` and `lucide-react` stay package dependencies too. The
catalog source does not import Radix. `cmdk` 1.1.1 still depends on
`@radix-ui/react-dialog` for its own dialog primitive.

Left in the host on purpose:

- fabrials.com `bubble` and `message` are product composition, not catalog controls.
- Radiant chat keeps Streamdown and its Shiki highlighter; the chat presentation moved to `@fabrials/ai-ui` in 0.5.
- news-monitor, grok-desktop-portable, and the Ditox GUI were not switched in this pass.

## 0.5.0 additions from Radiant

These controls were moved out of the Radiant redesign on 2026-09-26 so other
products can reuse them. Radiant consumes them from the vendor copy.

| File | Origin | Requested by |
| --- | --- | --- |
| `ui/moon-phase.tsx` (`MoonPhase`, `Starfield`, `lunarPhase`) | Fabrials | Radiant sign-in page |
| `ui/confirm-dialog.tsx` | Fabrials | Radiant admin ban, restore and revoke |
| `ui/truncated-text.tsx` | Fabrials | Radiant sidebar chat titles |
| `ui/settings-section.tsx` | Fabrials | Radiant settings |
| `ui/filter-chip.tsx` | Fabrials | Radiant admin filters |
| `ui/file-thumb.tsx` | Fabrials | Radiant admin files |
| `ui/recency.ts` (`groupByRecency`) | Fabrials | Radiant sidebar chat groups |
| `ui/suggestion-card.tsx` | Vercel AI Elements suggestion (Apache-2.0) | Radiant new-chat screen |
| `ui/shimmer-text.tsx` | Vercel AI Elements shimmer (Apache-2.0), now pure CSS | Radiant reasoning and media labels |
| `ai-ui/chat-message.tsx` | Vercel AI Elements message (Apache-2.0) | Radiant messages and action row |
| `ai-ui/attachments.tsx` | Vercel AI Elements attachments (Apache-2.0) | Radiant composer files |
| `ai-ui/code-block.tsx` and `.fui-markdown` | Vercel AI Elements code block (Apache-2.0) and Radiant markdown styles | Radiant answers |
| `ai-ui/activity.tsx` | Vercel AI Elements reasoning (Apache-2.0) and Radiant activity rows | Radiant thinking and web search |
| `ai-ui/citations.tsx` | Vercel AI Elements sources (Apache-2.0) and Radiant citation chips | Radiant inline citations |
| `ai-ui/composer.tsx` | Vercel AI Elements prompt input (Apache-2.0), reduced to a shell | Radiant composer |
| `ai-ui/voice-input.tsx` | Fabrials (Radiant dictation) | Radiant composer mic |
| `ai-ui/chat-icons.tsx` | Lucide icon paths (ISC) | Keeps ai-ui free of an icon dependency |

`MoonPhase` and `Starfield` are decorative sign-in and landing effects. They
are the documented exception to the no-glow and no-perpetual-motion rule and
stop animating under reduced motion.

## 0.6 additions (2026-09-27)

| File | Origin | Requested by |
| --- | --- | --- |
| `dither.ts` | Fabrials: Radiant's `src/lib/dither.ts` (packed `ditherToRamp`, `ditherChannels`) merged with X Tracker's helpers (`mixHex`, `sortByLuma`, `seeded`) | X Tracker backdrops; Radiant can move to it later |
| `dither-canvas.tsx` | Fabrials: generalised from Radiant's `DitherBackdrop` and X Tracker's sign-in sky | X Tracker shell, account banners and empty states |
| `activity-strip.tsx` | Fabrials | X Tracker posts per day and hour of day |
| `timeline.tsx` | Fabrials, after the WebMCP `ExecutionLog` rows | X Tracker live activity |
| `relative-time.tsx` | Fabrials | X Tracker feeds |
| `nav-tabs.tsx` | Fabrials, styled like `TabsList variant="underline"` | X Tracker account sections |

## Fonts

`packages/ui/fonts/` holds IBM Plex (SIL Open Font License 1.1, `OFL.txt`) as
published by Fontsource: IBM Plex Sans variable (`wght` 100–700, 3.201), Plex
Mono 400/500/600 (2.3) and Plex Serif 400/500 (2.6). The files without a subset
suffix are the Fontsource `latin` subsets; since 0.6.2 the `-latin-ext`,
`-cyrillic`, `-cyrillic-ext`, `-vietnamese` and (Sans only) `-greek` files come
from the same Fontsource releases, byte for byte, and `src/fonts.css` gives each
one the Fontsource `unicode-range`. X Tracker asked for them: it shows Polish
posts, whose letters (`ż`, `ł`, `ę`…) Latin-1 does not cover.
