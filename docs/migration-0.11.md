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
- A single-choice `ToggleGroup`, the `ThemeSwitcher` and a segmented `TabsList` have one plate that slides to the choice: its leading edge leaves first and the trailing edge follows 70 ms later, so it stretches toward the choice and settles. The plate is placed by its edges (`--fui-toggle-x`, `--fui-toggle-r`, `--fui-toggle-y`, `--fui-toggle-h` on the group; `--fui-toggle-w` stays), and the group says which way it last moved in `data-direction` (left or right). A segmented `TabsList` renders a plate (`.fui-tabs-plate`, Base UI's tab indicator) instead of painting the active tab. The chosen theme's icon turns into place. Before, the toggle plate never slid in React's strict mode (development builds): the effect that readies it ran twice and lost its frame.
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

## Controls

- **`FilterChip`** is its name and value, then a clear key of its own behind a soft divider. Only the key is a control (before, the whole chip was the link or button); hovering it tints the key and draws the chip's edge. `className` goes on the chip, every other prop (`disabled`, `id`, `data-*`, a router link through `render`) on the key, and `clearLabel` names the key as before. A button chip fades out before `onRemove` runs (at once under reduced motion), runs it once, and moves focus to the next chip's key in its row (or the previous one); when the last one goes, the host moves focus. On touch the key reaches 44 px around its 28 px square and the chip keeps its size (before, the whole chip grew to 44 px). The markup changed: a host that styled `.fui-filter-chip` as the control, or `.fui-filter-chip-icon`, moves those rules to `.fui-filter-chip-remove`.
- **`MultiSelect`** is a Base UI Select with `multiple`: a listbox the arrows, Home, End and typing move through, where Enter or Space ticks a row and the popup stays open; Tab reaches Clear and Escape returns focus to the trigger. Each row has a checkbox's look. The trigger sums the value up as the placeholder, one name, or the first name with a soft count of the others (`+2`, read as "and 2 more"), instead of "N selected". It is as wide as its summary, from 10rem to 20rem, instead of filling its column; the popup is at least as wide as the trigger. Props are unchanged.
- **`Badge`** gains `size` (`sm` 18 px, `default` 20 px, `lg` 24 px), `pulse` (a live dot ripples; still under reduced motion and in a skeleton) and `render` (a link or a button: the pointer, a deeper tint under it, the focus ring; `aria-pressed` or `aria-current` keeps the deeper tint with an edge in its colour). An icon child is now a 12 px glyph (14 px in `lg`); before, an icon kept its own size, 24 px for a lucide icon. A number on its own (`3`, `99+`, `1,204`) is a count: centred in a tag at least as wide as it is tall (`data-count`). The markup of a badge without these is unchanged.
- **`FieldGroup layout="columns"`** fills its row with as many 15rem columns as fit (`auto-fill`, was `auto-fit`): in a wide form two fields keep a field's width and the free room stays at the end, instead of each taking half the row. In a pane narrower than about 31rem nothing changes.

## Progress

`Progress` is built on Base UI's progress, like `Meter`, and gains its variants. A bar with a `value` and an `aria-label` looks as before; what a host has to check is in the list after this one.

- `label` names the bar and puts the value at the end of its row; `hint` is the line under it (counts, the time left) and describes the bar; `showValue` shows or hides the value (shown with a label). `format` and `getAriaValueText` write the value another way, and `locale` (default `"en"`) is the language it is written in, so the server and the browser agree.
- `size` `sm`, `default`, `lg`: a 4, 6 or 8 px track.
- No `value`, or `null`: work whose total is not known yet. The working light crosses the track (a still dashed line under reduced motion and in forced colors); `success`, `warning` and `danger` paint it in their colour.
- `steps`: the track becomes that many segments that ink in order.
- `variant="ring"`: a circle of 16, 24 or 48 px that closes clockwise, with the label and hint beside it; at `lg` the value sits inside.
- shadcn's parts, `ProgressLabel`, `ProgressValue`, `ProgressTrack` and `ProgressIndicator`, are exported, so ui.fabrials.com now has a `progress` shim.

What a host checks:

- **The default `max` is 100** (a native `<progress>` defaulted to 1). `value={42}` without a `max` is now 42 %; before, it was a full bar. A bar that passes a fraction keeps working only with `max={1}`.
- **A bar without a value moves.** It was an empty track (a full one in Firefox). Leave the value out only while a total is on its way; a quota whose value is unknown is not work in progress: show the word ("Not reported") and no bar, or a `Meter`.
- **`<label for>` no longer names it**: it is a `div` with `role="progressbar"`. Use `label`, `ProgressLabel` or `aria-label`.
- **The markup changed**: `.fui-progress` is the whole part (label row, track, hint), the track is `.fui-progress-track` and the fill `.fui-progress-indicator`. A host rule that sized `.fui-progress` or styled `::-webkit-progress-value` moves to those.

`Meter` gains `locale` too, default `"en"`: before, its value was written in the runtime's language, which differed between the server and a browser in another language and broke hydration ("42%" against "42 %").

## Scroll area

- The thumb is round and slimmer (6 px in a 10 px bar, was 8 px and square), quiet at rest (`--fui-scrollbar-ink`, 18 %); it deepens while the pointer is over the region or it scrolls (30 %) and under the pointer (44 %).
- The region draws a focus ring when its viewport takes keyboard focus; before, the viewport removed its outline and a keyboard user saw nothing. The ring is the region's `outline`, inside its edge.
- `aria-label` and `aria-labelledby` name the viewport, which takes focus while the content overflows, and make it a `region`. Before, they went to Base UI's root, which is presentational, and the name was lost.
- While the content overflows vertically the viewport keeps 0.75rem clear at the end of its lines, so the bar no longer sits over words. A host that pads the viewport itself keeps its own padding.
- `fade` (new) fades the edges that have more behind them, up to 2rem and only as far as there is more, from Base UI's overflow measures; vertical and horizontal.
- In forced colors the thumb is CanvasText; before, its tint was forced away and it disappeared.

## Avatars

- **Initials on a colour of their own.** `AvatarFallback` sits its initials on a tint of one of the five data hues (`--chart-1` to `-5`), inked and edged in it, picked from the initials by `avatarTint` (new, FNV-1a, the same on the server and in the browser). Before, every fallback was the same grey on grey. `tint={false}` keeps the neutral surface; `--fui-avatar-tint` on the avatar sets a hue of your own. A fallback whose children are not a string is not tinted.
- **A group sizes its avatars.** `AvatarGroup size` now sizes the avatars inside it (it sized only the overlap and the count before); an avatar with its own `size` keeps it. The overlap of an `xs` group is 4 px (was 6 px), so its initials stay readable.
- **A count of one shows the face.** With `max`, a group that would hide a single person draws that face instead of "+1" (the same width).
- **The ring is the surface's colour.** Each face in a group, and a badge's edge, is ringed in `--fui-avatar-ring`: the page by default and the card's colour inside a `Card` (before, the page colour drew a visible ring on a card). Set it on a surface of your own.

## Image

- A frame whose `src` is not there yet (left out or empty) no longer renders an `<img>`: browsers drew their broken-image mark in its corner while it waited. It shows the quiet plate, and the picture comes in through the dither when the `src` arrives.

## Agents in motion

The agent pieces got a mark for each kind of work, words that settle into place and new ways to show a search, a picture or a document being made. Nothing changes without the new props; written from scratch, with ideas from other libraries' AI states (prompt-kit, motion-primitives, Magic UI, AI Elements, Perplexity, Claude Code), not their code.

- **`AgentThinking activity`**: `thinking` (default), `searching`, `reading`, `writing`, `running`, `rendering`, `uploading`. It picks the mark and, without a `label`, the words. `variant` still overrides the mark, and `AgentMark` gains `scan`, `lines`, `type`, `raster` and `fill`. `agentActivities` maps each activity to its mark and words.
- **Settling**: `AgentThinking status="done"` or `"failed"` (with `endedAt`) puts the light out, holds a tick or a cross drawn in the mark's cells (`AgentMark outcome`) and stops the time. Write the label in the past tense.
- **Words that change scramble into place** in `AgentThinking` and `ActivityDisclosure` (never on first paint, never looping, not under reduced motion). The activity label no longer fades in on every change. New in `@fabrials/ui`: `ScrambleText`, `useScramble`, `scrambleFrame`.
- **`TaskItem.activity`**: the running step's mark is its kind of work (a tool's orbit by default).
- **`ShimmerText variant="letters"`**: the light steps a letter at a time. Its letters are decoration; the words are read once from a visually hidden copy.
- **`ChatMessage streaming`**: a block caret of the working light at the end of the text, solid while words arrive and blinking when the stream waits; the message is `aria-busy` while it streams.
- **`Progress variant="scan"`** and **`SourceTally`** for a search: a strip of cells where the light hops across while results are not in, and the sources found so far as tiles with a count that settles.
- **`GenerationFrame effect`** (`ripple` by default, `refine`, `scan`) and **`kind="document"`** (rows written from the top). `children` show when it is done without a `src`; `doneLabel` now defaults to "Document ready" for a document.
- **`Spinner variant`**: `ring` (default), `dots`, `bars`, `grid`, `line`.
- The marks, the strips and the page that fill a cell at a time read one registered number (`@property`), as the working light already did. A browser without `@property` (Firefox before 128) flips them between two frames instead of stepping.

## Image viewer

- **The wheel zooms by steps around the pointer**, in and out, from fitted to twice the real size (never less than four times fitted, so a small picture can be looked into). A notch of a mouse wheel is a quarter more or less; a trackpad moves smoothly and a pinch follows the fingers. Before, the wheel only went to the real size and a plain wheel at real size scrolled. A sideways scroll still scrolls a zoomed picture.
- **Zoomed, drag with the left button to look around**, at any level; a click without moving fits the picture again. Before, a click at real size did nothing (the release was reported on the stage).
- A click, Z or the zoom key still go to the real size around the point pressed and back. A picture no larger than the stage goes to twice its size; its key is then called `labels.enlarge` ("Zoom in"). New keys: + and − step, 0 fits.
- The level shows beside the zoom key as a share of the real size (`labels.zoom`, `(percent) => "64%"` by default). `ViewerLabels` gains `enlarge` and `zoom`; `labels` stays partial.
- **A fitted picture taller than the stage is no longer cut off at the bottom.** Its row in the stage grew to the picture's height, so `max-height` had nothing to hold it to; at 1440 × 900 a 2400 × 1500 picture lost 76 px, and in a 2560 × 1315 window it showed at its real size, lost 321 px and could not zoom.
- Zoomed, the stage takes every touch (`touch-action: none`): one finger looks around and two zoom, without the page zooming.
- New helpers in `media-logic`: `zoomLimit`, `wheelScale`, `stepScale`, `pinchScale`, `scrollToKeep` and `ZOOM_STEP`. `wheelIntent` and `pinchIntent` are deprecated; they still work.

## New tokens

`--fui-radius-2xl`, `--fui-ease-spring`, `--fui-tint-strength`, `--fui-tint-strong`, `--fui-tint-edge`, `--fui-surface-inset`, `--fui-surface-hover`, `--fui-separator`, `--fui-sidebar-active`, `--fui-switch-thumb`, `--fui-light-1`, `--fui-light-2`, `--fui-light-3`. The derived ones are declared on every theme scope, so a nested theme island computes them from its own surface.
