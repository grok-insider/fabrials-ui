# Migrating to 0.11 "Instrument with life"

0.11 keeps every 0.10 export and prop. The instrument stays (Stormlight, the dither, Plex, the mono label voice, data in dither) and loses its stiffness: things that belong together share one plate with soft corners, a state is a tint instead of a side bar, the lines that remain are soft, and the components move when people, data or agents do. Agents get their own pieces in `@fabrials/ai-ui`, and the system gets one light besides the dither: the working light, shown only while something works. `DESIGN.md` has the rules.

Re-vendor (`bun run vendor <product> --write`) or update `@fabrials/ui` and `@fabrials/ai-ui` to 0.11.0. Everything below follows without code changes unless it says otherwise.

## The look

| Area | 0.10 | 0.11 |
| --- | --- | --- |
| Radii | 3, 4, 5, 6, 8 px; plates square | 4 (keys), 6 (tags, small controls), 8 (controls), 10 (menus, popovers), 12 (plates), 16 (dialogs, sheets); `--fui-radius-2xl` is new and the Tailwind bridge's `rounded-2xl` is now that 16 px |
| Plates (`Card`, `Stat`, `StatGroup`, `Table`, code panels) | Square, `--fui-shadow-sm` | 12 px corners, `--fui-shadow-xs` and the top highlight |
| `StatGroup` | Boxes with full-height dividers | One plate; the figures are divided by soft lines that stop short of its edges |
| `Table` | Head on the card, hairlines between rows | The head is an inset band (`--fui-surface-inset`); rows divided by `--fui-separator`; hover `--fui-surface-hover`; selected rows tinted at `--fui-tint-strength` |
| `CardFooter`, `CardCaption` | A hairline above | No line: the content's padding is the space |
| `Alert` | Neutral plate with a 2 px tone bar | Tinted plate with an edge in its tone; no bar |
| Toasts | A 2 px tone bar | No bar; the icon carries the tone |
| `Badge` | 3 px tag, square dot | Soft 6 px tag tinted by its tone (`--fui-tint-strong`), round dot |
| `StatePanel` | Dashed outline | A soft inset surface; the error panel is tinted |
| Sidebar current row, vertical tabs | Hover fill and a bar | A raised key (`--fui-sidebar-active`: the card in light, the sidebar accent in dark) with a rounded Stormlight bar |
| `Item`, `DescriptionList`, `Accordion`, `SettingsSection` | `--border` between rows | `--fui-separator` (softer); the current row's bar is inset and rounded; an icon tile has no edge |
| `Meter`, `Progress` | Square tracks | Round tracks (the ruler keeps its ticks) |
| `Switch`, off, dark themes | A thumb in the surface colour, barely apart from its track (about 1:1) | A light thumb (`--fui-switch-thumb`), about 6:1 against the track; the light theme keeps its white thumb |
| `Dialog` | 8 px | 16 px |
| `CornerMarks`, `GridGuides` | On the plates that carry a page | Brand moments only (a landing hero, a sign-in figure) |

A host that wants a piece square again sets the token in its own CSS, for both themes (`--fui-radius-plate: 0`), and records the reason in its `DESIGN.md`.

## Motion

- `.fui-rise` (new utility class): what arrives after first paint rises 4 px out of a slight blur. Give each item `--fui-stagger` (its index in the batch); the delay stops growing after the eighth. `useArrivals(ids)` from `@fabrials/ai-ui` tells which items arrived after the first render.
- An accordion's body rises out of a slight blur as it opens.
- A `Card` with `interactive` lifts 1 px under the pointer. The new class `fui-card-link` on its one link stretches the link over the card, so the card is a single target.
- `--fui-ease-spring` is a small overshoot for what a hand moves.
- All of it is off under reduced motion.

## The working light

`WorkingLight` (new, `@fabrials/ui`) is a band of light that turns along the edge of the surface it sits in, with a soft bloom outside it. Render it as the last child of a positioned surface while something works, and remove it when the work ends; the surface must not clip its overflow. It is decorative: say the state in words too. Under reduced motion it is a still edge; forced colors hide it. `ShimmerText` gains `tone="light"`, which crosses a label with the same light. The light is painted from `--fui-light-1` to `-3` (Stormlight, zircon, amethyst).

## Agents (`@fabrials/ai-ui`)

New:

- `AgentThinking` and `AgentMark`: the line that says an agent is working (a mark in square cells, a label in the working light, the time taken).
- `TaskList`: the steps of a plan as they are worked through.
- `GenerationFrame`: a picture being made, from a field of dots to the image arriving through the dither.
- `ContextMeter`: how full a context window is, as one meter.
- `useWorkTime`, `formatWorkTime`, `formatTokens`, `useArrivals`.

Changed, visibly:

- `ChatComposer` shows the working light while `status` is `submitting` or `streaming`; `working={false}` keeps it still. Its corners are 12 px.
- `ReasoningDisclosure` and `SearchStepsDisclosure` count the time beside their label while live (`timer={false}` drops it); `ActivityDisclosure` does when given `timer`. Live labels carry the working light.
- `SearchStepsDisclosure` stacks the marks of the first four sources beside a step's count, and steps that arrive rise into place.
- `AttachmentItem` gains `progress` (0 to 1): an uploading grid tile draws a ring that closes as the file goes up and counts the percentage (a progressbar); at 100 % the count fades out. On a touch screen the remove key stays in view while a file uploads. A chip says the percentage. `Attachments` gains `size="sm"` (56 px tiles for a composer), and files that arrive rise into place.

## New tokens

`--fui-radius-2xl`, `--fui-ease-spring`, `--fui-tint-strength`, `--fui-tint-strong`, `--fui-tint-edge`, `--fui-surface-inset`, `--fui-surface-hover`, `--fui-separator`, `--fui-sidebar-active`, `--fui-switch-thumb`, `--fui-light-1`, `--fui-light-2`, `--fui-light-3`. The derived ones are declared on every theme scope, so a nested theme island computes them from its own surface.
