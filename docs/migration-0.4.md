# Adopting Fabrials UI 0.4 "Stormlight"

0.4 keeps the 0.3 public control names and adds the family frame: stone and
graphite neutrals, the IBM Plex superfamily, one interaction color, and a gem
that only signs the product mark. It does not change backend contracts, publish
to npm, or deploy applications.

## What changed

- Tokens in `packages/ui/src/tokens.css` keep the shadcn names. New names are
  `--brand*`, `--gem`, `--fui-*`, `--chart-6` and the state inks. Primary is ink,
  not a product color. Set `data-gem` on the document root.
- Fonts add local IBM Plex Mono and IBM Plex Serif next to Plex Sans. Interface
  numbers stay in Plex Sans with tabular figures.
- Components that used to require Tailwind (sidebar, command, popover, hover
  card, navigation menu, button group, input group, scroll area, carousel,
  spinner, toaster, chart legend) now use `fui-` classes.
- New exports: `ProductLockup`, `FabrialsGem`, `Stat`, `StatGroup`, `Sparkline`,
  `Meter`, `Snippet`, `CopyButton`, `Avatar`, `RadioGroup`, `Radio`,
  `ToggleGroup`, `ThemeSwitcher`, `Accordion`, `Breadcrumb`, `Pagination`,
  `DescriptionList`, `StatusDot`, `SiteHeader` and `AuthLayout`.
- `@fabrials/ui/tailwind.css` is the optional Tailwind v4 bridge. Delete host
  `@theme inline` color and radius blocks that repeat these tokens.

## Styling

Import once, in this order:

```css
@import "@fabrials/ui/tokens.css";
@import "@fabrials/ui/fonts.css";
@import "@fabrials/ui/styles.css";
@import "@fabrials/ai-ui/styles.css"; /* AI hosts only */
@import "@fabrials/ui/tailwind.css"; /* Tailwind v4 hosts only */
```

Both `.dark` and `[data-theme="dark"]` activate the dark tokens.
`data-density="compact"` still changes spacing without shrinking coarse-pointer
targets. Reduced motion sets the duration tokens to 0ms.

## Distribution

From this repository, after `bun run build`:

```sh
bun run vendor ai-relay --write
bun run vendor spanreed --write
bun run vendor open-email --write
bun run vendor grok-insider-web --write
bun run vendor web --write
bun run vendor fabrials-webmcp --write
bun run vendor ai-relay --check
```

`scripts/vendor.mjs` resolves consumers from the workspace root
(`<fabrials-ui>/../..`, or `FABRIALS_WORKSPACE`). Versioned directories are
`fabrials-ui-0.4.0` and, for AI hosts, `fabrials-ai-ui-0.4.0`. Open Email writes
`open-email/vendor` in the standalone repository and `apps/web/vendor` when the
enterprise layout is present. Point each consumer `package.json` at
`file:vendor/fabrials-ui-0.4.0` and run `bun install`. Do not edit the generated
copy.

Older `0.3.0` directories are left in place so a consumer can roll back by
restoring its dependency path. A check against 0.4 fails until that consumer's
0.4 distribution has been written.
