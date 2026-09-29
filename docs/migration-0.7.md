# Adopting Fabrials UI 0.7 "Highstorm"

0.7 keeps every 0.6 export and token name. It changes how things look, so
check a host's screens after updating; nothing in its code has to change.

## What changes on screen

- **Neutrals** move from warm stone (oklch hue 85) to cold slate (hue ~255).
  Dark background is stormwall `#161a21`, light `#eceeeb`. Stormlight in dark
  mode is `#9cc4ff` for text and focus. Hosts that retint tokens (Radiant's
  night theme) keep their overrides.
- **Corners** are crisper: `--fui-radius-xs…xl` are 3/4/5/6/8 px (were
  4/6/8/12/16) and `--radius` is 6 px. Controls use 5 px, containers 6 px,
  overlays 8 px.
- **Display face:** IBM Plex Sans Condensed 500/600 ships in `fonts.css`
  (latin, latin-ext, cyrillic-ext, vietnamese) as `--fui-font-display`, and in
  the Tailwind bridge as `font-display`. `PageHeader` titles, `AuthLayout`
  titles and the `ProductLockup` wordmark use it.
- **SiteHeader** spans the window instead of a centred 80rem column; its
  content anchors to the left gutter. Pages follow the same rule (see
  DESIGN.md › Layout): no centred page columns.
- **Snippet** wraps long commands with a hanging indent instead of showing a
  horizontal scrollbar.
- **Badge** is a tag, not a pill: 3 px corners, a quieter tint with a hairline
  in its tone, tabular figures and a square status dot. Multi-select chips,
  sidebar and tab counts and the AI search-step badge get 3 px corners;
  FilterChip gets 4 px. Props are unchanged.

## New in `@fabrials/ui`

- `DitherScene` (`variant="hero" | "full"`, `seed`, `reveal`, `cell`): the
  storm front behind a landing hero or a sign-in page. Absolute; give the
  parent `position: relative`.
- `DitherBand` (`seed`, `cell`, height from `--fui-band-height`, default
  4.5rem): a cloud band that signs a section.
- `DitherGem` (`gem`, `size`, `cell`, `reveal`): a cut gem filled with
  dithered light, the product mark.
- `DitherCanvas` gains `order="ramp"` (keep the ramp's order: 0 is the first
  colour), `reveal` (ms, one-time; the field factory gets a third `progress`
  argument) and the `"background"` ramp stop, resolved from `--fui-dither-bg`
  or `--background`. Existing calls behave as before.
- `@fabrials/ui/dither`: `paintRampField`, `STORM_RAMP`, `gemRamp`,
  `GEM_HEX`, `stormField`, `stormBandField`, `gemField`, `fbm`,
  `valueNoise`, `DITHER_BACKGROUND`.

### Loading

- `Loading` (`when`, `label`) paints the real components it wraps as their
  own skeleton while data loads: text bars per line, blocks for media,
  neutral shapes for coloured controls, structure kept, colour removed.
  Only paint changes (its wrappers are `display: contents`), so nothing
  moves when loading ends. Content is inert while loading; a status message
  names what loads; the pulse follows reduced motion; server rendering works.
- `placeholderText(length, seed?)` and `placeholderList(count, make)` build
  invisible placeholder data; `useLoading()` tells a component it is inside a
  loading view; `data-skeleton="keep|hide|block|fill"` tunes a part.
- Tokens `--fui-skeleton` (bars, media) and `--fui-skeleton-surface` (filled
  shapes). The standalone `Skeleton` block now uses `--fui-skeleton-surface`.

### shadcn's names

So shadcn primitives map onto Fabrials controls one to one (and third-party
components can use the shims), 0.7 adds the parts shadcn names that were
missing: `DialogPortal`, `DialogOverlay`, `SheetFooter`,
`AlertDialogPortal`, `AlertDialogOverlay`, `AlertDialogMedia`,
`DropdownMenuPortal`, `DropdownMenuSub`, `DropdownMenuSubTrigger`,
`DropdownMenuSubContent`, `SelectLabel`, `SelectSeparator`,
`SelectScrollUpButton`, `SelectScrollDownButton`, `NativeSelectOption`,
`NativeSelectOptGroup`, `RadioGroupItem` (the same component as `Radio`),
`KbdGroup`, and the `icon-lg` button size. Nothing
existing changes.

### Docs pieces

- `CodePanel`: a code sample with its file name and icon, a copy button,
  line numbers, highlighted lines, boxed words and diff marks. It highlights
  TypeScript/JSX, JSON, shell, CSS and HTML itself (`highlightCode`, pure);
  pass Shiki output as children to use Shiki instead. Syntax colours are the
  new `--fui-syntax-*` tokens.
- `CodeTabs`: several versions of one sample in one frame.
- `PackageInstall`: one command in npm, pnpm, yarn and bun; the choice is
  shared by every instance on the page and can be remembered.
- `Files`, `Folder`, `File`: a file tree whose folders open and close.
- `RepoInfo`: a repository as a compact link with stars and forks; the host
  fetches the numbers.

## New in `@fabrials/ai-ui`

Nothing; the version moves with `@fabrials/ui`.

## Where to use the brand

See DESIGN.md › "Dithering is the brand": landing hero and sign-in get a
`DitherScene`, a public page may carry one `DitherBand`, and every product
shows its `DitherGem` next to its name.

## 0.7.1

The 0.7.1 changes (theme islands and the 44 px hit area of segmented controls)
were never published on their own. They ship with 0.8.0; read them in
[migration-0.8.md](migration-0.8.md#carried-over-from-071).
