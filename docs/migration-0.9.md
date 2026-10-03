# Adopting Fabrials UI 0.9

0.9 keeps every 0.8 export, token and class name. Two things need a line changed in some hosts, and the rest is fixes that
make host workarounds deletable. Read "Hosts that must change" first.

## Hosts that must change

### `AuthLayout` is the page's `<main>`

`AuthLayout` used to render a `<div>` column, so every host that wanted a landmark wrapped it in its own `<main>`. The column is now
`<main class="fui-auth-main">` by default. A host that keeps its wrapper has two mains: axe reports `landmark-no-duplicate-main` and
`landmark-main-is-top-level`, and a screen reader lists two.

What changed in the markup, in order: the `aside` (when there is one) is a sibling of the column and stays outside it; inside the
column come the brand, the card, the footer note and the `actions` corner, so the corner is still the last tab stop. The corner is
`position: absolute` against the whole layout, as before: the column has no `position`, `contain`, `container-type`, `transform` or
`filter`, so nothing moved (the boxes of the layout, the column, the card, the aside and the corner are identical at 390 and 1440 px).

Two new props:

- `as?: "main" | "div"`, `"main"` by default. `as="div"` makes the column a plain `<div>`, for a host that keeps its own `<main>`.
- every other prop goes to the column (the landmark): `id` for a skip link, `aria-label`, `tabIndex`. `className` stays on the root.

For each host (read from its deployed branch, with the 0.8.2 vendor):

| Host | Where | What to do |
| --- | --- | --- |
| X Tracker | `src/app/signin/page.tsx`: `<main id="main">` around `AuthLayout` | Delete the wrapper and pass `id="main"` to `AuthLayout` (the skip link keeps its target), or pass `as="div"` and keep the wrapper. |
| AI Relay | `frontend/src/app/{login,setup,join}/page.tsx`: a bare `<main>` around `AuthLayout` | Delete the three wrappers. Assert `getByRole("main")` with a count of 1 on the three routes in the same commit. |
| Open Email | `apps/web/src/features/identity/sign-in.tsx`: `<main id="main" tabIndex={-1} className="app-public">` | Pass `as="div"` and nothing else changes. Unwrapping is optional: `id` and `tabIndex` can go to `AuthLayout`, but `className` would land on the root and `.app-public { outline: none }` belongs on the column then. |
| fabrials.com | `app/(session)/login/page.tsx`: no landmark at all | Nothing to change; the sign-in page gains its `<main>` and axe's `landmark-one-main` and `region` go quiet. Pass `id` if a skip link should reach it. |
| admin, Radiant, Spanreed desktop, Ditox | no `AuthLayout` | Nothing. |

The ui.fabrials.com demo of the layout sits inside the docs page's own `<main>` and passes `as="div"`.

## What the hosts gain

### Charts take keyboard focus visibly and have a name

Recharts paints a plot as `svg[role="application"][tabindex="0"]` so the arrows can move the tooltip. The package removed its outline
outright, so a keyboard user tabbing to a chart saw nothing. The outline is now removed only for focus that is not `:focus-visible`;
for the keyboard it is the 2 px `--fui-focus` ring, inset (`outline-offset: -2px`) because the panels that hold a chart clip their
overflow. The plot is named from `caption`, which `SeriesChart` already required for its hidden table. The rows of that table and of
the tooltip are keyed by position, so two rows that share a label (two weeks with the same weekday names, which is what `titleKey` is
for) no longer make React reuse the wrong one.

Deletable: a host rule that restored the plot's ring. AI Relay's `globals.css` has one, marked TEMPORARY, with an outer 2 px offset; as an unlayered host rule it would still win over the library's inset ring, so delete it when vendoring 0.9.

### `CommandTrigger fit`, and the launcher in a site header

The launcher fills its container (`inline-size: 100%`), right for a field-like launcher in a column and wrong in a group of automatic
width, where a percentage of a width that depends on the child is cyclic (the header of fabrials.com went from 57 to 105 px wide).
New additive prop `fit` sets `data-fit` and `inline-size: auto`. The actions of `SiteHeader` are such a group, so a launcher there is
`fit` without the prop.

Visible change in `SiteHeader`: under 40rem the launcher in `.fui-site-actions` is its icon (the accessible name stays), because
brand, launcher, appearance and menu do not fit one row of a phone; with the label the header measured 141 px tall at 390 px.

Deletable: a host override of the launcher's `inline-size` (X Tracker's `.fui-button.fui-command-trigger.xt-search-button
{ inline-size: auto }`: pass `fit`; its own phone rule is not needed inside a `SiteHeader`, which now does it), and a stand-in for the
launcher (fabrials.com's `PaletteButton` is a plain outline `Button` because `CommandTrigger` filled its container: it can be
`<CommandTrigger fit variant="outline" label="Search" keys={["mod", "K"]} />`, which is 44 px tall like the header's other controls
instead of the stand-in's 36).

### Forced colors (Windows high contrast)

Forced colors repaints every background in `Canvas` and drops every `box-shadow`. Measured before the change, these parts disappeared:
a switch's thumb, a meter and a progress bar, a badge's edge, an avatar, an activity cell, the checked radio's dot, a pressed toggle
and the legend keys of a chart. One block at the end of `styles.css` (four groups; every colour is a system colour):

1. Marks whose colour is the information keep it, with a `CanvasText` edge: chart swatch, badge dot, status dot, timeline dot.
2. Fills that say a state or an amount are `Highlight`: meter and progress (on an edged track), switch (off: a `CanvasText` thumb; on: a
   `Highlight` track with a `HighlightText` thumb), checked and mixed checkbox, the radio's dot, the tabs' bar (vertical lists too) and
   activity cells (a step of `Highlight` over `Canvas`, each with an edge).
3. Hairlines that were a `box-shadow` are an outline: badge, avatar, timeline marker, segmented groups. A pressed toggle and an active
   segmented tab are a 3 px `Highlight` bar under the label; a link tab list (no indicator element) draws its own 2 px bar.
4. Focus that was only a `box-shadow` gets a `Highlight` ring: an `InputGroup` and the wrapper of the command input.

Things the measurement decided, in case a host extends this: a chart's series need no rule (the UA gives `svg` `forced-color-adjust:
preserve-parent-color`, so SVG paint is not repainted), but the plot's text is `CanvasText` because it kept the theme's muted ink,
unreadable on a dark `Canvas` under a light theme. Pressed is not a `Highlight` fill behind the label: Chromium paints a `Canvas`
backplate behind text over any author background unless the element opts out of forcing, so the label read `HighlightText` on a white
box. And pressed is not an outline, which is the focus ring's own shape.

Deletable: the parts of a host's forced-colors block that do the same for these components (X Tracker's dots, pressed outlines and
activity cells). Spanreed desktop gets `Meter` and `Badge` in forced colors without a rule of its own.

### `NativeSelect`'s chevron

The chevron was an SVG data URI with a fixed warm grey: a `url()` cannot read a custom property, so it ignored dark mode and a host's
retint of `--muted-foreground`. It is two strokes of `linear-gradient` in `var(--muted-foreground)` now, placed again for `:dir(rtl)`
(the logical end, the left) and drawn by the browser itself in forced colors (`appearance: auto`).

Things a host may notice:

- The ink follows `--muted-foreground` (a little darker than the old grey in light, lighter in dark).
- A **disabled** or read-only select kept no chevron before (`.fui-input:disabled { background: var(--muted) }` is the `background`
  shorthand, and it reset the chevron's longhands); it keeps it now.
- The rule is `.fui-input.fui-native-select` (two classes) so it outranks that fill. A host override written as `.fui-native-select
  { background-image: … }` (one class) loses to it; write the override with the same two classes.

## Not in this release

- **The system theme in CSS** (`:root[data-theme="system"]` with `prefers-color-scheme`) was prepared and left out. It is not CSS only:
  `DitherCanvas` (`dither-canvas.tsx`) and `Toaster` (`toaster.tsx`) read the theme from `.dark` or `data-theme="dark"`, so a system
  dark page would paint the light dither ramp and light toasts on dark tokens, and both would need a `matchMedia` subscription. The
  library's `tailwind.css` declares no `dark` variant (each host declares its own, for example `apps/site/app/globals.css`), so there
  is nothing in the package to extend: a host that adopts the opt-in block later needs a `@custom-variant dark` with an `@media
  (prefers-color-scheme: dark)` branch under `:root[data-theme="system"]`. Until then a host that wants the system theme without a
  flash keeps applying `.dark` from a script in `<head>`.

## Internal

A guard in `tests/unit/literal-colours.test.ts` fails on a literal colour (`#hex`, `rgb()`, `hsl()`, `oklch()`, `lab()`, a `%23hex`
or `data:image` in a `url()`) in `styles.css` of both packages and in the components. `tokens.css` is out of its scope on purpose: the
`oklch` values there are the palette. Allowed: the moon's fixed night colours, shadow and highlight alphas of pure black or white, the
syntax inks `ai-ui` defines in its sheet, and the two files that paint SVG or canvas (`moon-phase.tsx`, `dither-canvas.tsx`).
