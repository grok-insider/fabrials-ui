---
name: fabrials-design-system
description: Build, restyle or review React interfaces in the Fabrials house style (Fabrials UI 0.11 "Instrument with life", the successor of 0.10 "Instrument" and 0.7 "Highstorm"), in Fabrials products that use @fabrials/ui or @fabrials/ai-ui and in apps that install from the ui.fabrials.com shadcn registry. Use for page layout, components, tokens, theming, on-screen copy and UI QA. Not for backend-only work, and not for a product whose own DESIGN.md or owner has chosen a different look.
---

# Fabrials design system

Fabrials UI 0.11 "Instrument with life" (Highstorm's rules with a voice: deep Stormwall neutrals, soft 12 px plates grouped by space, states as tints, a mono label voice, dithered data, motion that answers, and a working light for agents) is one house style for every Fabrials product and for apps that install from ui.fabrials.com. Reproduce it; do not invent a style per screen. This file is the operating guide; the detail lives in `references/`.

## Sources of truth

Resolve this skill directory's real path (`readlink -f`, it is usually a symlink). The design-system repository is two directories above it. Read from that repository:

| What | Where |
| --- | --- |
| The brief: principles, colour, type, shape, dithering, motion, layout, voice | `DESIGN.md` |
| Token values (oklch, both themes, density, breakpoints, reduced motion) | `packages/ui/src/tokens.css` |
| Component source and exports | `packages/ui/src/*.tsx`, `packages/ui/src/index.ts`, `packages/ai-ui/src/index.tsx` |
| Catalogue: what each component is for, its exports and notes | `apps/site/lib/ui-catalog.ts` (packages), `apps/site/lib/catalog.ts` (registry blocks) |
| Reference layouts | `stories/instrument.stories.tsx` + `instrument.css` (landing, product overview, pieces), `stories/highstorm.stories.tsx` + `highstorm.css` (sign-in), `apps/site/app/page.tsx`, `apps/site/components/docs/` |
| Component usage in context | Storybook (`bun run storybook`, port 6041), `apps/site/components/ui-demos*.tsx` |
| Upgrading or adopting a version | `docs/migration-<version>.md`, one per version from 0.7 to 0.12 (why 0.10 looks as it does: `docs/identity-proposals.md`) |
| What products have asked for, and what a product can delete after upgrading | `docs/requests.md` |
| Registry, shims, adopting a component from another library | `docs/registry.md` |

The Patterns stories (`stories/patterns.stories.tsx`: PublicSite, Settings, Console, SignIn) are safe references for page composition: the layout rules have not changed since 0.7, and they render in the current look.

Precedence: the user's explicit instruction, then the product's own `AGENTS.md` and `DESIGN.md`, then the design-system `DESIGN.md`, then this skill. When this skill and `DESIGN.md` disagree, `DESIGN.md` wins; say so in your report. Code wins over prose for values: read the token or the component instead of guessing.

Without a local checkout (an outside app), the repository is public at https://github.com/grok-insider/fabrials-ui (same paths as above); also read https://ui.fabrials.com/docs/design (the same `DESIGN.md`), https://ui.fabrials.com/llms.txt and https://ui.fabrials.com/r/registry.json. Registry entries install `@fabrials/ui` from npm.

## Instrument in operational rules

1. **One interaction colour.** Stormlight (`--brand-ink`, `--ring`, `--brand`) marks focus, links, checked controls, the current navigation item and the first data series. Nothing else is blue. Primary buttons are ink (`variant="default"`); `variant="accent"` only when one action must stand out.
2. **Light is dithered, or it is work.** Brand light comes only from `DitherScene`, `DitherBand` and `DitherGem` (canvas, 8x8 Bayer). The one other light is the working light (`WorkingLight`, `ShimmerText tone="light"`, the agent indicators of `@fabrials/ai-ui`), shown only while an agent works or something loads. No other gradients, glows, blurred blobs or gradient text.
3. **Nothing is centred on the page.** Headers span the window; content anchors to the left gutter (`--fui-page-padding`) with a reading max-width and no `margin-inline: auto`. Wide screens keep the free space on the right or give it to panels. Centring is only for small things inside a component.
4. **Indexes, not card grids.** Lists of products or features are rows: mark, name, one line, a link. One plate with soft dividers beats cards inside cards.
5. **Soft plates, grouped by space, dense.** Plates (`Card`, `Stat`, `StatGroup`, `Table`, alerts, state panels) have 12 px corners, a hairline edge and a soft resting shadow; what belongs together shares one plate, divided by soft lines (`--fui-separator`). Keys 4, tags 6, controls 8, menus 10, plates 12, dialogs 16 px. A state is a tint, never a coloured side bar. Controls 40 px, body 14 px, metadata 12 px.
6. **Tags, not pills.** `Badge` is a soft 6 px tag tinted by its tone, with a round dot. Counts and chips are tags too. A pill only for one passive label that must stand out.
7. **Sentence case, plain words.** No tracked uppercase eyebrows, no word of a headline in another colour, no `→` or arrow icons appended to buttons or links. Plex Sans Condensed 600 is for hero headlines, page titles, marketing section titles, figures and the wordmark only.
8. **Gems sign marks only.** Each product has one gem (`data-gem` on the root, `DitherGem`/`FabrialsGem`/`ProductLockup`). A gem never colours a status, button or link.
9. **Motion answers a person.** 100/150/240 ms, zero under reduced motion. One orchestrated moment per page at most (a `DitherScene` or large `DitherGem` `reveal`). Continuous motion only for real loading indicators.
10. **Say what happened.** Stale is not fresh, configured is not reachable. Errors say what went wrong and what to do; empty states offer the next action; every pattern covers loading, empty, error and long content.
11. **Accessible by default.** Every control has a name, a visible 2 px Stormlight focus and a keyboard path; colour always travels with a word or symbol; AA contrast in both themes.
12. **Both themes are designed.** Light (`#f6f7f8` page, white plates) and dark (Deep Stormwall `#08090b`, plates `#0e1014`) are each checked; no literal colours, only tokens.
13. **Built like an instrument, alive like one.** Figures end in a `CardCaption`; a share or level gets a ruler (`Stat meter`, `Meter variant="ruler"`); a landing hero draws its grid (`GridGuides`) and its figure carries `CornerMarks` (brand moments only, never product screens). What arrives after first paint rises (`.fui-rise`); what works carries light. Labels and readings speak in the label voice (Plex Mono 11 px, muted); a value and its label never share a face. Charts are dithered.

The full list with checks: [references/style-rules.md](references/style-rules.md).

## Decision flow for a UI task

1. **Read the context.** The product's `AGENTS.md` and `DESIGN.md`; the installed version (`vendor/fabrials-ui-<version>` in a Fabrials product, `package.json` elsewhere). An older version is not permission to migrate; migrating is the product's decision and follows the migration notes from its version up (`docs/migration-<version>.md`, one per version). Until then the product follows the `DESIGN.md` shipped inside its vendored copy.
2. **Name the surface.** Landing, product index, docs, app workspace, settings, sign-in, or a state (empty, loading, error). Each has a recipe in [references/layout.md](references/layout.md); start from it instead of a blank page.
3. **Pick components before writing markup.** Patterns first (`PageHeader`, `SectionHeader`, `CollectionToolbar`, `Table`, `BulkActions`, `StatePanel`, `SettingsSection`), then controls. See [references/components.md](references/components.md). Do not rebuild a control the package has; do not add a universal component with many flags.
4. **Compose with tokens.** Spacing on the 4 px grid (`--fui-space-*`), radii from `--fui-radius-*`, colours from roles. In Tailwind hosts use the bridge (`bg-card`, `text-muted-foreground`, `text-brand-ink`, `font-display`, `font-label`, `rounded-md`, `rounded-plate`, `px-(--fui-page-padding)`).
5. **Write the copy.** Sentence case, names people recognise, an action keeps its name through the flow ("Revoke key", then "Key revoked"). English unless the product decides otherwise.
6. **Cover the states.** Loading (a first load is the real view inside `<Loading when label>` with placeholder data; a refresh keeps the last value), empty, error, stale, offline, long content, narrow screen.
7. **Verify** with [references/checklist.md](references/checklist.md). Report what you did not test.

## Where code belongs

- Generic presentation: `@fabrials/ui`. Provider, quota, migration and chat presentation: `@fabrials/ai-ui`. Network clients, routing, authentication, theme storage, native window chrome and product policy: the host.
- A Fabrials product consumes a verified copy made by `bun run vendor <product> --write` in the design-system repo. Never edit a `vendor/` copy; change the package, build it, re-vendor.
- A missing generic piece is added to the package with a story, a keyboard test and a visual reference, using shadcn's part names where shadcn has them. A product-only exception is recorded in that product's `DESIGN.md`.
- Nothing is installed from another component library through the registry. When a product needs a component another library offers, adopt it into the package in the Fabrials style (story, keyboard test, visual reference); adapted code keeps its license notice beside it and in `THIRD_PARTY.md`.

## Setting an app up

Fabrials products import the vendored packages. Any other React 19 app with shadcn uses the registry:

```sh
npx shadcn@latest init https://ui.fabrials.com/r/init.json      # new app: Base UI style, @fabrials registry, palette, styles
npx shadcn@latest add https://ui.fabrials.com/r/styles.json     # existing app: styles only, palette unchanged
npx shadcn@latest add @fabrials/button @fabrials/mcp-dashboard  # shims and blocks by name
```

CSS, once, in this order; theme and gem on the root element:

```css
@import "@fabrials/ui/tokens.css";
@import "@fabrials/ui/fonts.css";
@import "@fabrials/ui/styles.css";
@import "@fabrials/ai-ui/styles.css"; /* only with AI pieces */
@import "@fabrials/ui/tailwind.css";  /* only in Tailwind 4 hosts, after tokens */
```

```html
<html class="dark" data-gem="ruby">
```

Shared components use `fui-` classes in the `components` layer and work without Tailwind. Host overrides come after them and express a documented product requirement, not a restyle. Do not read `localStorage` or browser globals while rendering shared components. New code imports from `@fabrials/ui` directly, even where a shim exists.

## Other design skills

Generic skills (`shadcn-ui`, `frontend-design`, `ui-ux-pro-max`, `taste-design` and similar) are supporting material only. Their defaults lose to this system wherever they conflict. Common conflicts to reject: centred hero and centred page columns, bento or feature-card grids, rounded-2xl cards, pill badges, gradient or glow accents, perpetual micro-motion, uppercase eyebrows, a second accent colour, arrow-suffixed calls to action, looser padding than the tokens.

## Safety and scope

- Stories, docs, previews, screenshots and test data are synthetic. Never show real mail, credentials, keys or account records.
- Approval to style a screen is not approval to mutate accounts, publish to npm, push or deploy. Commit only what the task asks.
- Visual checks run in an isolated browser (the pinned Playwright container, or a clean headless context). Never resize or emulate a viewport in the owner's desktop browser window.
- For headed tests on the owner's Hyprland host, inspect workspaces first and use an empty one; do not move existing windows; close your test windows and return to the previous workspace unless the owner has moved elsewhere.

## References

- [references/layout.md](references/layout.md): page anatomy recipes (site header, landing hero, product index, docs, app workspace, settings, sign-in, states, responsive rules).
- [references/components.md](references/components.md): which component for which job, with imports, including `@fabrials/ai-ui` and the registry's WebMCP and MCP blocks.
- [references/style-rules.md](references/style-rules.md): tokens and the anti-slop rules as checks.
- [references/checklist.md](references/checklist.md): QA before calling UI work done.
