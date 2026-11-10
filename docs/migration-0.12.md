# Migrating to 0.12

0.12 is additive: nothing is removed and nothing is renamed. A product on 0.11 can take it without changing a line. This note says what is new, what a product can now delete, and the few places where something looks or behaves differently. Each section below was written with the change it describes; the plan they follow is `docs/plan-0.12.md`.


## The chat pieces: right to left, forced colors, print

`@fabrials/ai-ui` adds no export here. Its stylesheet is corrected in place, and two components change one class name.

**Right to left.** Every rule that named a side of the screen is written in logical properties, so the chat pieces turn with `dir="rtl"`. In a left-to-right page nothing moves.

| Piece | In a right-to-left page |
| --- | --- |
| Markdown (`.fui-markdown`) | List markers and the quote's bar on the right, table heads read from the right, a task list's box before its text. Code blocks and inline code stay left to right; a code block's header follows the page (name at the right, copy at the left). KaTeX output (`.katex`, `.katex-display`) stays left to right |
| `ChatMessage`, `MessageActions` | The question sits at the left, the answer's actions start at the right edge |
| `ActivityDisclosure`, `ReasoningDisclosure`, `SearchStepsDisclosure` | The trigger hangs at the right, the body's rule and a search's rail are on the right, the live dot on the icon's left |
| `Sources`, `SourceCard`, search results | The stacked marks overlap leftwards. A host and a path are parts of an address: they stay left to right, the host before the path |
| `Attachments` | The remove key at the left of a tile, a chip and a row |
| `VoiceInputButton` | The recording dot on the mic's left |
| `AgentMark` (`scan`, `lines`, `type`), a document `GenerationFrame`, the arrow of a page a search opened | Mirrored: a scan sweeps, lines are read and a page is written from the right; the arrow points up and to the left |

As with `@fabrials/ui`, a right-to-left app sets both `dir="rtl"` on its root and `DirectionProvider direction="rtl"`.

**The chevron.** `Sources` and `ActivityDisclosure` (and the reasoning and search disclosures built on it) now draw their chevron with the class `fui-activity-chevron`. Before, they used `fui-disclosure-chevron`, the class of `@fabrials/ui`'s `Disclosure`, and the chat stylesheet styled that class on its own: with both stylesheets on a page, every `Disclosure` chevron was 14 px and faded to 60 % instead of 16 px.

- Looks different: a `Disclosure` on a page that also loads `@fabrials/ai-ui/styles.css` gets its 16 px chevron back. The chat pieces look as they did.
- A product that selects `.fui-disclosure-chevron` inside a sources or an activity trigger in its own CSS selects `.fui-activity-chevron` instead. A product that draws its own trigger with the old class inside `.fui-sources-trigger` or `.fui-activity-trigger` keeps the chat look.
- `tests/unit/stylesheet-collisions.test.ts` now fails when a class is defined on its own in both stylesheets, or when the chat stylesheet styles a class of `@fabrials/ui` outside one of its own pieces.

**Forced colors.** The older chat pieces get a form in system colours (Windows high contrast):

| Piece | Form |
| --- | --- |
| `CitationChip`, a source's number | An edge in the link's ink; the chip whose source is pointed at, and that source's card, carry a `Highlight` bar |
| The question's bubble | An edge |
| `ComposerToggle` pressed, `VoiceInputButton` recording | A `Highlight` edge and a bar under the label; the level dot is `Highlight` |
| `VoiceInputButton` in error, a failed attachment | A dashed edge |
| A tile's remove key | An edge around the disc |
| `ChatComposer` with focus in its field | A `Highlight` ring (its focus was a border colour and a shadow) |
| A search at work | The step it is on has a `Highlight` badge, the rail between steps is drawn, the live dot is `Highlight` |

**Print.** Message actions and the streaming caret are not printed, the question loses its bubble, a message is kept on one page when it fits, and code wraps instead of running off the sheet (a code block's copy and download keys are not printed).

**Pointer.** The message actions brighten under the pointer only where there is one (`@media (hover: hover)`), so a tap no longer leaves an action highlighted.

Nothing to delete in a product unless it carried its own right-to-left overrides for these pieces (`[dir="rtl"] .fui-markdown ul { padding-right: … }` and the like): those can go.

## Sidebar

New, all optional:

| Piece | What it does |
| --- | --- |
| `SidebarProvider navigationKey` | Any value that changes when the person navigates (the host's pathname). When it changes, the phone sheet closes. The library imports no router; the first value closes nothing. |
| `SidebarClose` | The close key of the phone sheet: 44 px, named by the sidebar's `labels.close` (default "Close navigation") or its own `label`. Put it in the `SidebarHeader`; it draws nothing while the sidebar is not a sheet. |
| `Sidebar sheetCloseButton` | Puts that key in a row of its own at the top of the sheet (off by default), for a header with no room for it. |
| `Sidebar labels.close` | The close key's name. `title` and `description` are as before. |
| `Sidebar side="start"` and `"end"` | The inline start or end edge: the other edge in a right-to-left page. `"left"` (the default) and `"right"` stay physical. The phone sheet, the border, the rail and the fold follow. |
| `SidebarSearch` | A `SearchInput` at the sidebar's size (magnifier, clear key, Escape clears), with `dir="auto"`. Hidden while the sidebar is folded to icons. `SidebarInput` stays. |
| `useIsMobile(breakpoint = 768)`, `useMediaQuery(query, serverValue = false)` | The check the sidebar makes, exported. Both read through `useSyncExternalStore`: the server and the hydrating render answer the server value, a render that starts in the browser the real one. |
| `--fui-sidebar-active-ink` | The label of the current row (default `--sidebar-accent-foreground`). |
| `--fui-sidebar-active-icon` | Its icon (default: the ink; in a `size="touch"` row, the muted ink it always had). |
| `--fui-sidebar-active-shadow` | Its shadow (default: the raised key's). `none` flattens it. |
| `--fui-sidebar-active-bar` | The colour of its 2 px bar (default `--brand-ink`). `transparent` hides it; forced colors show it in `Highlight` whatever the token says. |

The four tokens are read with a fallback and defined nowhere, so they can be set on any element (the page, the provider, one sidebar) and follow the theme and gem in force there. `--fui-sidebar-active` (the fill) is as before.

What a product can delete:

- The effect that closes the sheet on a route change (`useEffect(() => setOpenMobile(false), [pathname])`): pass `navigationKey={pathname}` to the provider.
- Its own close button in the sheet's header, and the `isMobile` check around it: `<SidebarClose />`.
- Rules that move the focus ring inside the rows and the actions (`outline-offset: -2px`).
- Rules that restyle the current row (its fill, ink, icon, shadow, `::before { content: none }`) and the forced-colors rule that brings the bar back: set the tokens.
- A `top:` on `.fui-sidebar-menu-action` that re-centred it for a different row height.
- Its own `useIsMobile` hook, and a search field assembled from `SidebarInput`, an icon and a clear button.

What looks or behaves differently:

- The focus ring of every row size, of sub rows, of `SidebarMenuAction` and of `SidebarGroupAction` is drawn inside the element (`outline-offset: -2px`). It was drawn outside and the scroll area clipped it. `size="touch"` rows are unchanged.
- `SidebarMenuAction` and a floating `SidebarMenuBadge` are centred on their row whatever its height: on a phone, where rows are 44 px, they sat 7 px from the top. `SidebarMenuItem` is now a one-column grid so that they can be placed against the row and not against the item (which also holds a sub menu). A host rule that sets `top` on the action still wins and is no longer needed.
- Under a coarse pointer the two action keys have a 44 px target around the 20 px they paint, and a group label that has a `SidebarGroupAction` beside it is 44 px tall.
- The action, the group action, the floating badge and the sub menu's indent use logical properties: in a right-to-left page they are at the left. The default trigger icon is mirrored there.
- `SidebarRail` of a `side="right"` sidebar is on its inner (left) edge; it was drawn on the outer one. A `side="left"` sidebar in a right-to-left page keeps its border on its inner edge.
- A collapsed row's tooltip opens away from the sidebar: to the left for a right-hand sidebar. It was always to the right.
- The classes `group/sidebar-wrapper`, `group/menu-item`, `peer/menu-button` and `group/menu-button` are gone from the markup. They styled nothing without Tailwind; a Tailwind host that wrote variants against them (`group-hover/menu-item:…`) selects the `fui-` class or the `data-slot` instead. `group` and `peer` on the sidebar itself stay.
- With `useSyncExternalStore`, a page rendered only in the browser draws the phone sheet from its first paint; before, it drew the desktop sidebar for one frame.

## Right to left elsewhere

Logical properties where a physical one put something on the wrong side of a right-to-left page. Nothing changes in a left-to-right page.

- `Timeline`: the rail between markers and the actions at the end of a header.
- `SuggestionCard`, `Files` rows: text aligns to the start; a `Files` row's indent, its note and its chevron (mirrored while closed) follow the direction.
- The skip link, `BulkActions`, `SidePanelHeader` and the image viewer's bar: their start padding and position.
- `Switch`: the thumb travels towards the inline end (it moved off the track in a right-to-left page).
- `PaginationPrevious` and `PaginationNext`: the chevrons are mirrored.
- A loading field's placeholder bar starts at the inline start.
- `Snippet`: the command reads left to right in any page, as `CodePanel` already did, so its copy key at the right never covers the start of a line.

Left physical on purpose: positions measured in script (`--active-tab-left`, `--fui-toggle-x`), centring (`left: 50%`), safe-area insets (`env(safe-area-inset-left)`), the chevron of `NativeSelect` (already placed again for right to left), and code, which is always left to right.

## Carousel

- **Keys.** The carousel no longer takes the arrow keys from what is inside a slide: a field, a slider, tabs or a nested carousel keep theirs. It answers when focus is on the region itself (now a tab stop, `tabIndex={0}`; pass `tabIndex={-1}` to leave it out of the tab order) or on one of its two keys.
- A horizontal carousel answers Left and Right, the other way round in a right-to-left page; a vertical one answers Up and Down (it answered Left and Right). Home and End go to the first and the last slide. A key with Alt, Ctrl, Meta or Shift is left to the browser.
- **Right to left.** Embla gets `direction` from `DirectionProvider` (`opts.direction` still wins), the keys sit at the inline start and end, and their chevrons are mirrored.
- **`labels`**: `{ previous, next, slide }`, English by default ("Previous slide", "Next slide", `(index, count) => "3 of 7"`). Each slide is named by its place once the carousel has mounted, unless it has an `aria-label` or `aria-labelledby` of its own.
- **A name for the region.** `aria-label` or `aria-labelledby` on `Carousel`; without one, a development build warns in the console. Nothing is thrown.
- At the first and the last slide the key is off (`aria-disabled`) but keeps focus, so a person who pressed Next to the end is not dropped out of the carousel. It was `disabled`, which lost focus.
- Under reduced motion a slide arrives at once (`duration: 0`).
- The region's focus ring is drawn inside its viewport.

A product can delete: a wrapper that stopped arrow keys from reaching the carousel (`onKeyDown={(event) => event.stopPropagation()}` around a field in a slide), and its own visually hidden names for the two keys.

## Server and client

Until 0.11 the build wrote `"use client"` on top of every module except ten it knew by name. A formatter such as `formatBytes` therefore lived in a client module, and a Server Component that called it failed at render: on the server a client module's exports are references, not functions. Components without a hook were client components for the same reason.

From 0.12 a built module is a client module when its source starts with `"use client"`, and only then. Every source file was checked: it has the directive if it calls a hook, creates a context, handles an event, reads `window`, `document` or `navigator`, imports a client library (Base UI, cmdk, Embla, Motion, Recharts, Sonner, react-resizable-panels) or hands a function to a component; otherwise it has none. `tests/unit/client-boundaries.test.ts` keeps it that way and builds both packages to check the result.

Nothing changes for a client component: every import path and every export is where it was.

What a Server Component can now call (all from `@fabrials/ui` unless noted):

| Helpers | Now defined in | Still exported from |
| --- | --- | --- |
| `formatBytes`, `formatRelativeTime`, `formatAbsoluteTime`, `fileTypeLabel` | `format.ts` | `file-size`, `relative-time`, `file-thumb` |
| `avatarInitials`, `avatarTint` | `avatar-initials.ts` | `avatar` |
| `toISODate`, `parseISODate`, `isSameDay`, `matchesDate`, `firstDayOfWeek` | `dates.ts` | `calendar` |
| `acceptsFile`, `sortFiles` | `file-accept.ts` | `dropzone` |
| `placeholderText`, `placeholderList` | `placeholder.ts` | `loading` |
| `groupByRecency`, `recencyGroupFor`, `languageMark`, `activityLevel`, `formatClock` and the rest of `media-logic` | unchanged | unchanged |
| `@fabrials/ai-ui`: `hostnameFromUrl`, `sourcePath`, `formatTokens`, `codeFilename`, `attachmentCategory`, `formatBytes` | `format.ts` | `citations`, `agent`, `code-block`, `attachments` |

What now renders on the server, with no JavaScript of its own, when a Server Component imports it: `Card` and its parts, `Alert` and its parts, `Separator`, `Skeleton`, `StatGroup`, `StatusDot`, `DescriptionList` and its parts (moved out of `display` and `data`, which still export them), `Timeline`, `TimelineItem`, `ActivityStrip`, `CommandTrigger`, `CommandOptionList`, `CommandOption`, `StatusPopover`, and the ones that already had no directive in their source: `Kbd`, `KbdGroup`, `Spinner`, `PixelSpinner`, `WorkingLight`, `ShimmerText`, `SuggestionCard`, `SuggestionGrid`, `FabrialsGem`, `ProductLockup`, `FieldSet` and its parts, `FileSize`, `CornerMarks`, `GridGuides`, `LanguageIcon`; in `@fabrials/ai-ui`, `ProviderIcon`, `MigrationReviewDetails` and the icons. `ActivityStrip` can now take `formatValue` from a Server Component, which a client component could not.

Still client components, on purpose: `Badge` (it renders as a link or a button through `useRender`), `Table` (its scroll region), `Tabs`, `Stat` (it draws `Meter` and `Sparkline`), `Meter`, `IconButton` (a Base UI trigger clones it and its props must reach the inner button), `Disclosure` (it opens itself when a field inside is invalid), `ButtonGroup`, `DitherScene`, `DitherBand`, `DitherGem`, and the page patterns in `patterns` (`PageHeader`, `StatePanel`…), which share a module with the bulk-action context.

What a product can delete: a `"use client"` wrapper written only to call one of the helpers above, and local copies of them. Radiant has `formatBytes` twice (`lib/admin-view.ts`, `components/lang/recordings/format.ts`) and its own initials (`components/app/initials.ts`, `components/admin/admin-format.ts`); check their output against `formatBytes(locale, bytes)` and `avatarInitials(name)` before swapping, since rounding and the fallback differ.

What behaves differently:

- The index sources (`packages/ui/src/index.ts`, `packages/ai-ui/src/index.tsx`) no longer start with `"use client"`. The built indexes never did, so nothing changes for a product on the package or a vendored copy.
- `@fabrials/ai-ui`'s `formatBytes(bytes)` takes an optional second argument, `formatBytes(bytes, locale)`. Without a locale it prints what it always has ("1.5 KB", "16 KB", "" for an unknown size). With one it is `@fabrials/ui`'s `formatBytes(locale, bytes)` ("1.5 kB", "1,5 kB"), still "" for an unknown size. It is deprecated in favour of the generic one.
- Three `@fabrials/ai-ui` modules that used hooks without saying so (`consumption`, `synchronized-accounts`, `synchronized-consumption`) and two of `@fabrials/ui` (`button-group`, `disclosure`) now carry the directive in their source. Their built files already had it.

For whoever builds the packages: `scripts/build.mjs` exports `bundle(name, outDir)` and `isClientSource(code)`, and runs the full build only when it is the script node was started with.

## Combobox

`Combobox` was an object of Base UI's parts with five of them restyled; a page wired the portal, the positioner and the popup itself, a Server Component could not reach into the object, and shadcn's combobox had no shim. 0.12 adds flat parts under shadcn's names. The object still works.

```tsx
<Combobox items={workspaces}>
  <ComboboxInput id="workspace" placeholder="Choose one" showClear />
  <ComboboxContent>
    <ComboboxEmpty>No matches.</ComboboxEmpty>
    <ComboboxList>{(item: string) => <ComboboxItem key={item} value={item}>{item}</ComboboxItem>}</ComboboxList>
  </ComboboxContent>
</Combobox>
```

| Part | What it is |
| --- | --- |
| `Combobox`, `ComboboxRoot` | The root: Base UI's props (`items`, `multiple`, `value`, `onValueChange`, `disabled`…). `Combobox` is shadcn's name for it and also still carries the dotted parts. |
| `ComboboxInput` | The field: the input in its box with the key that opens the list. `showTrigger` (default true), `showClear` (default false: the key that empties the field, present while there is a value), `triggerLabel` ("Show options"), `clearLabel` ("Clear"). `className` goes to the box, every other prop to the input. The list opens under the box. |
| `ComboboxContent` | The portal, the positioner and the popup. `side` ("bottom"), `align` ("start"), `sideOffset` (6), `alignOffset`, `anchor`; the rest goes to the popup. At least as wide as the field. |
| `ComboboxList`, `ComboboxItem` | The options; an item carries the tick of the chosen ones. `ComboboxItem disabled` for a row that cannot be chosen. |
| `ComboboxEmpty` | The sentence for no matches: a polite live region that stays mounted. Put it before the list. |
| `ComboboxGroup`, `ComboboxLabel`, `ComboboxCollection`, `ComboboxSeparator` | Grouped lists. |
| `ComboboxChips`, `ComboboxChip`, `ComboboxChipsInput`, `ComboboxValue` | Several values: the box of chips (the field and the list's anchor), one chip with its remove key (`showRemove`, `removeLabel`, "Remove" by default: pass the value's name, "Remove billing"), and the input after them. |
| `ComboboxTrigger`, `ComboboxClear` | The two keys on their own, for a field you compose yourself. Give each an `aria-label`. |
| `useComboboxAnchor` | A ref for the element the list opens under when that is not its own field (shadcn's examples pass it to `ComboboxChips` and to `ComboboxContent anchor`; with these parts the box of chips is already the anchor). |

Keyboard, as Base UI gives it: typing filters; ArrowDown opens the list on its first row and the arrows move the highlight while focus stays in the input; Enter chooses and closes, or, with `multiple` and no query, ticks the row and keeps the list open; Escape closes the list and keeps the value, and Escape again with the list closed empties the field; in a multiple combobox ArrowLeft walks the chips (ArrowRight in right to left), Backspace on a chip or in the empty input removes one. The two keys of the field are for the pointer (they are not tab stops).

Worth knowing:

- While the list is open Base UI hides everything but the input and the list from assistive technology, a `<label for>` included. Browsers still name the input from it; an automated check may not. An input with a placeholder, an `aria-label` or `aria-labelledby` passes either way.
- The list is a portal in `<body>`: in a right-to-left app it reads right to left when the direction is on the root element (`<html dir="rtl">`), which is where an app puts it.
- Before hydration Base UI renders the trigger key as if it were the combobox (`role="combobox"`, a tab stop); it corrects itself when the input mounts.

What a product can delete: the portal, positioner and popup wiring around `Combobox.Popup`, and its own tick and clear button. `apps/site` gains the `combobox` shim (47 shims), so shadcn code that imports `@/components/ui/combobox` runs on these parts.

What looks or behaves differently: nothing for code that uses `Combobox.Root`, `Combobox.Input` and the other dotted parts; they are the same components and are marked `@deprecated` one by one. `Combobox` itself is now a component (the root) with those parts on it, where it was a plain object.

## Small foundations

Nine small pieces that Radiant (and other products) had written for themselves, now in `@fabrials/ui`. They are all new exports; nothing existing changes its behaviour. Hooks and components live in client modules; every pure helper lives in a module without `"use client"`, so a Server Component can call it.

### `LocalTime`, `formatLocalTime`, `useHydrated`

`<LocalTime value={sentAt} format="message" />` renders a `<time dateTime>` in the reader's own zone and locale. A server knows neither, so until the page has hydrated the element is a hidden stand-in of the same shape (the same instant in UTC, in `locale` or English, `visibility: hidden`, `aria-hidden`): nothing moves when the real text arrives, and the server's clock is never shown. It renders nothing for an empty or invalid value.

| Prop | What it does |
| --- | --- |
| `value` | A `Date`, an ISO string or a timestamp; `null`, `undefined`, `""` or an invalid date render nothing. |
| `format` | `"time"` (09:31), `"message"` (the time today, "Sep 26, 09:31" on another day, with the year in another year), `"dateTime"` (default), `"date"`, `"shortDate"` (the year only when it is not this year), or `Intl.DateTimeFormat` options. The hour has two digits in a 24-hour locale and one in a 12-hour one ("9:31 AM"). |
| `locale` | Default: the reader's own. Pass the page's language when the server knows it; the stand-in then has exactly the final shape. |
| `timeZone` | Fixes the zone. The text is then the same on the server and in the browser, so it is rendered at once with no stand-in; without `locale` it is in English. |
| `now` | The clock `message` and `shortDate` compare with (a fixed one for tests and screenshots). |
| `prefix` | Words before the time, inside the same element ("Sent "). |
| `title`, `titleFormat` | The tooltip: your own text, `false` for none, or by default the full date and time (`titleFormat`, default full date and long time). |

`formatLocalTime(value, format, { locale, timeZone, now })` is the same formatting as a pure function (`time-format.ts`, no directive); it returns `""` for an invalid value. `localTimeIso(value)` gives the ISO instant or `null`. `useHydrated()` is `false` on the server and during hydration and `true` afterwards.

`RelativeTime` stays what it was ("3 minutes ago", ticking). Use `LocalTime` for an absolute time.

Radiant can delete `components/app/local-time.tsx` and `lib/time-format.ts`. Three differences from its version: `title` is text or `false`, and the format of the tooltip moved to `titleFormat`; `message` adds the year when the day is in another year; and the hour of `time` and `message` has one digit in a 12-hour locale.

### `useHotkeys`, `matchHotkey`, `isTypingTarget`, `ariaKeyshortcuts`

```tsx
useHotkeys({
  "1": () => pick(0),
  Enter: check,
  "mod+k": { handler: openSearch, whenTyping: true },
});
```

One hook with the guards every key handler of a screen needs. A key is ignored:

- while text is being composed (an IME) and when another handler already called `preventDefault`;
- with a modifier the hotkey does not list (`"1"` does not answer Ctrl+1);
- while it repeats (`ignoreRepeat`, default true; `repeat: true` on one binding for a stepper);
- while a field has focus (`ignoreWhenTyping`, default true: inputs, `textarea`, `select`, editable regions, `role="textbox|combobox|searchbox|spinbutton"`; radios and sliders count as fields because the arrows and digits are theirs; `whenTyping: true` on one binding for Escape or a chord);
- Enter and Space on a button, a link, `summary` or another control that uses them (`ignoreOnControls`, default true; a string is your own selector; `onControls: true` on one binding);
- outside `scope` (a ref: only while focus is inside it; default the whole document);
- anywhere inside `[data-hotkeys="off"]`, always;
- when `enabled` is false.

A key that fires gets `preventDefault()` (`preventDefault: false` to leave it). Handlers are always the latest ones, so they may close over state. Hotkeys are written `"Enter"`, `"Space"`, `"ArrowLeft"`, `"1"`, `"mod+k"` (Ctrl or ⌘), `"shift+?"`. Shift is compared for letters and named keys; a digit or a symbol is the character the layout produced, however it was reached (1 is Shift+& on a French keyboard). A letter also matches its physical key on a layout of another script.

The pure half is in `hotkeys.ts` (no directive): `matchHotkey(event, combo)`, `parseHotkey(combo)`, `isTypingTarget(target)`, `isControlTarget(target, selector?)`, `HOTKEY_CONTROLS`, and `ariaKeyshortcuts("mod+k")`, which gives `"Control+K Meta+K"` for the `aria-keyshortcuts` attribute.

Radiant can delete `typingTarget` and `useDigitKeys` (`components/lang/exercise/choice.tsx`), the key effects of `review-session.tsx` and `session/player.tsx`, and `inReportPanel` (`report/state.ts`): the report control carries `data-hotkeys="off"` instead of `data-report-problem`. Its lesson screen lets Enter go on from a radio drawn as a button; that is `ignoreOnControls: 'a[href], summary, button:not([role="radio"])'`.

### `useElementSize`

`const { ref, width, height } = useElementSize<HTMLDivElement>()` gives the size of an element's content box, kept current by a `ResizeObserver`: 0 by 0 on the server and until measured, rounded to device pixels, and it re-renders only when the size changes. Pass your own ref as the first argument to measure an element you already hold. `{ measure }` as the second reads another box (`clientWidth`, a scroll size). `SeriesChart` now measures its frame with it; what it measures and when did not change.

Radiant can delete `features/core/use-width.ts` (`useElementWidth(ref, fallback)` becomes `useElementSize(ref).width || fallback`).

### `ErrorBoundary`, `ErrorBoundaryFallback`

```tsx
<ErrorBoundary resetKey={spec.id} onError={report}>
  <Diagram spec={spec} />
</ErrorBoundary>
```

| Prop | What it does |
| --- | --- |
| `fallback` | A node, or `({ error, reset }) => node`. Default: `ErrorBoundaryFallback`, an inline `StatePanel state="error"` with "Try again". |
| `resetKey` | When it changes, the children get a fresh attempt. |
| `onError(error, info)` | For the host's reporting. |
| `onReset()` | Called when "Try again" (or a fallback's `reset`) clears the error. |
| `labels` | `{ title, description, retry }` of the default fallback. English defaults. |
| `headingLevel` | Of the default fallback's title: 2, 3 (default) or 4. |

After "Try again", focus goes to the start of the restored part (focusable for that one visit) instead of falling to the top of the page; if the part is still broken, focus stays on the button. A custom fallback manages its own focus. `ErrorBoundaryFallback` can be used alone, for a route's error file: `<ErrorBoundaryFallback reset={reset} />`.

Radiant can delete `features/core/error-boundary.tsx`. Its `onError` received a message; this one receives the error and React's info.

### `@fabrials/ui/export`

A new subpath (also exported from the index), with no directive: `downloadFile(name, data, type?)`, `serializeSvg(svg, { background, width, height })`, `svgToPng(svg, { scale = 2, background })`, `fileStem(title, fallback, maxLength = 60)`, `copyImage(source)` and `copyText(text)`. They work on what is already in the page and never read the network. Called without a browser they throw (or reject with) an `ExportError` whose `code` is `no-dom`, `unsupported`, `refused` or `invalid`.

- `serializeSvg` writes the computed paint on every element in plain sRGB, so token colours survive in a file; web fonts and the HTML inside a `foreignObject` do not travel.
- `svgToPng` takes an element (serialised first) or a string, and returns a PNG blob `scale` times the drawing's size.
- `fileStem` keeps letters and digits of any language, turns everything else into one hyphen, lowers the case and caps the length: `fileStem("Ventas / Q3 — «مبيعات» 2026", "chart")` is `ventas-q3-مبيعات-2026`.
- `copyImage` takes a blob or the address of a picture and writes PNG to the clipboard (another type is redrawn through a canvas). A picture from another origin must allow CORS. Call it from the click itself.

Radiant can delete `features/core/export.ts` (keeping its own `parseFenceMeta`) and the `copyImage` of `components/chat/generated-media.tsx`. The argument order of `downloadFile` is the name first, and `svgToPng` takes its background in an options object.

### `useResolvedTokens`, `resolveColor`

`const { theme, colors, fontSans, fontMono } = useResolvedTokens(CHART_TOKENS, ref)` gives tokens as `#rrggbb` (`#rrggbbaa` when not opaque) for what cannot read a custom property: a canvas, a chart library, a diagram renderer. Names are custom properties or any CSS colour. They are resolved for `ref`'s element (default: the root), so a part with its own theme gets its own colours, and again when the theme, the system scheme or a style above the element changes. The object keeps its identity until a value really changes, and is empty on the server. `resolveColor(value, element?)` is the single conversion (`oklch()`, `color-mix()`, `var(--token)`, `currentColor`); `colorToRgba(value)` gives bytes. `CHART_TOKENS` is the list `--chart-1` … `--chart-6`.

Radiant can delete `features/core/renderer-theme.ts`; its fixed fields become the names it asks for (`colors["--card"]`, …).

### `ForeignText`, `Bdi`, `dirOf`, `scriptDirection`, `isolate`, `interpolate`

- `<ForeignText lang="ar">كتاب</ForeignText>` renders `<bdi lang dir>`: a fragment in another language, isolated from the line around it, in its own direction. `dir` comes from `lang`, else from the first letter of a string child, else `auto`. `as` picks another element.
- `<Bdi>` is for text whose language nobody knows (a name, a title): `dir="auto"`.
- `dirOf("ar-EG")` is `"rtl"`: by script subtag when the tag has one, else by language, with the few whose script follows the country (`pa-PK`). The tables are fixed, so the server and the browser agree.
- `scriptDirection(text)` is the direction of the first letter, or `undefined` when there is none.
- `isolate(text)` wraps a string in U+2068 … U+2069 for places that take only a string: an `aria-label`, a `title`, a toast.
- `interpolate("The word {word} means {meaning}", { word: <ForeignText lang="ar">كتاب</ForeignText>, meaning })` returns keyed nodes for a translated message with markup in it. A string slot is wrapped in `<bdi>`; a placeholder with no slot stays as written.

These components have no hooks and no directive: they render on the server.

Radiant can replace `targetTag` and `textTag` of `exercise/lang-text.ts` with `dirOf`, and `isolate` of `import/api.ts`. Its `ForeignText` that finds quoted fragments in a note by script (`lib/lang/foreign.ts`) is a different tool and stays in the product.

### `Announcer`, `useAnnounce`

`<Announcer>` near the root renders one polite and one assertive live region, always in the page and only clipped from view. `const announce = useAnnounce()` then says a sentence without moving focus: `announce("Draft saved")`, `announce("The connection was lost", { assertive: true })`. The same sentence twice is read twice (the region is emptied and filled a frame later), and a message leaves the region after `clearAfter` milliseconds (default 7000, 0 keeps it). Without an `Announcer` above, `useAnnounce` speaks through a pair of regions of its own at the end of the body.

Radiant's step players can drop their own `aria-live` regions and call `announce`.

## States and time

Five pieces of `@fabrials/ui` for the moments a screen is in a state or on a clock: a question asked in place, a countdown, the theme choice, a page that is only a state, and the sticky bar of a step. All new; nothing existing changes.

### `InlineConfirm` and `useInlineConfirm`

A confirmation that is not a dialog: the question is rendered where you put it and the page stays usable around it. Use `ConfirmDialog` when everything must stop until the answer.

- It is a `group` named by its `title` and described by its `description`. It is not an `alertdialog`: that role promises a modal, and this is not one.
- When it opens, the safe answer (cancel) takes focus without the browser's own jump, then the block scrolls into view with the height of a sticky `ActionBar` and of the on-screen keyboard kept free under it.
- Escape is the safe answer, and it stops there: a sheet around the question stays open.
- When it closes, on the next frame, focus goes back to the control that had it before, or to `returnFocusRef`. If the host moved focus somewhere itself, it is left there.
- `onConfirm` may return a promise. While it is pending the answer shows its spinner and ignores a second press, the safe answer and Escape wait, and both buttons stay in the tab order. A rejection, or `{ ok: false, error }` (the `ConfirmResult` of `ConfirmDialog`), is shown as an alert inside the question, which stays open.
- `acknowledgement` adds a box that must be ticked. The answer is never disabled: pressed with the box empty, it shows `acknowledgement.error` and moves focus to the box.

| Prop | |
| --- | --- |
| `open`, `defaultOpen`, `onOpenChange` | Closed, it renders nothing |
| `title`, `description` | The question and its detail. `headingLevel` makes the title a heading; without it the title is a paragraph |
| `confirmLabel`, `pendingLabel`, `cancelLabel` | `cancelLabel` is "Cancel" by default |
| `onConfirm({ acknowledged })`, `onCancel` | As above |
| `destructive` | The danger tint, and the destructive button |
| `pending`, `error`, `fallbackError` | For a host that owns the request: its state shown the same way as a promise's |
| `acknowledgement` | `{ label, required = true, error = "Tick the box to continue", onCheckedChange }` |
| `acknowledgementKey` | A new value empties the box (what is agreed to changed) |
| `returnFocusRef` | Where focus goes on closing, when it is not the control that had it |
| `autoFocus` | `false` for a question already on the page when it loads: no focus move, no scroll |
| `children` | Extra content between the question and the answers (reasons, a choice) |

`useInlineConfirm()` returns `{ open, setOpen, triggerProps, confirmProps }` for the usual case where the control that asks is somewhere else (in the bar) than the question (above it): spread `triggerProps` on the button (it gets `aria-expanded` and takes focus back) and `confirmProps` on `InlineConfirm`. There is no `InlineConfirmTrigger` component.

Radiant can delete its copies (`session/confirm-finish.tsx`, `session/skip-step.tsx`, `placement/confirm.tsx`, `exam/exam-confirm.tsx`, the two questions of `conversation/end-controls.tsx`, the agreement part of `recordings/keep-recording.tsx`) and the `.lang-session-confirm` rules. What differs from them: the title and description are tied to the group by id in every case, focus returns on the next frame instead of in a microtask, and the block reads the bar's height from a CSS variable instead of measuring `.lang-session-bar`.

### `Countdown`, `useCountdown` and the clock functions

`<Countdown deadline={closesAt} offset={offset} onDone={close} />` counts to a deadline. Every reading is `deadline - now`, never a count, so a tab that slept, a slow phone or a clock that was set back shows the right time; `offset` corrects this device's clock against the server's.

- The digits are a `timer` named by `label` ("Time left"); a timer is not announced as it ticks. A separate polite region speaks once when a mark is passed (ten, five, two and one minute by default: "5 minutes left") and once at the end ("Time is up"). Words come from `labels.left(seconds, locale)` and `labels.done`.
- Seconds are rounded up: `0:00` means the time is up.
- Tones `calm`, `low` (five minutes or less) and `urgent` (one minute or less) are a tint, an edge and an icon; `thresholds` moves them and `tone` overrides them. Nothing flashes. In forced colors the edge is plain, dashed and heavy.
- The clock is pinned left to right, in tabular figures in the label voice, in the digits of `locale` (English digits by default, so a server and a browser write the same).
- On a server and while hydrating it shows `placeholder` (`--:--`).
- `onDone` is called once per deadline, also when the deadline had already passed on mount.
- Other props: `format` (`"auto"`, `"mm:ss"`, `"h:mm:ss"` or a function of the seconds), `hideLabel`, `size` (`"md"`, `"sm"`), `marks`, `now` (a fixed moment: the clock holds still, for a paused exam, a story or a test).

`useCountdown(deadline, { offset, marks, tick, precision, thresholds, now })` returns `{ remainingMs, seconds, done, tone, crossed }`. All countdowns share one timer; it also reads the clock when the page is shown again, when the window takes focus and on `pageshow`. It renders once a second; `precision` (with `tick`) makes it finer. `crossed` is the mark passed most recently while the hook was watching (0 for the end).

The arithmetic is exported from a module without `"use client"`, for a server or a test: `deadlineTime`, `clockOffset(serverNow, receivedAt)`, `remainingMs(deadline, offset, now)`, `wholeSeconds`, `crossedMark(previous, current, marks)`, `toneOf(seconds, thresholds)`, `formatCountdown(ms, locale, { format, round })`, `COUNTDOWN_MARKS`, `COUNTDOWN_THRESHOLDS`. The formatter is `formatCountdown`, not `formatClock`: that name is the media player's, which takes seconds and rounds down.

Radiant can delete `exam/exam-timer.tsx`, `exam/use-countdown.ts`, the countdown half of `exam/clock.ts` (`clockOffset`, `remainingMs`, `wholeSeconds`, `MARKS`, `crossedMark`, `toneOf`) and the `.lang-exam-timer` rules; the polling helpers of `clock.ts` are Radiant's own.

### `ThemeProvider`, `useTheme` and `themeInitScript`

The library had the control (`ThemeSwitcher`) and the CSS (`.dark`, `data-theme`); the host had to write the storage. Now:

```tsx
// app/layout.tsx (a Server Component)
<head>
  <meta name="theme-color" content="#f6f7f8" />
  <script dangerouslySetInnerHTML={{ __html: themeInitScript({ themeColor }) }} />
</head>
<body>
  <ThemeProvider themeColor={themeColor}>{children}</ThemeProvider>
</body>

// anywhere below
const { theme, resolvedTheme, setTheme } = useTheme();
<ThemeSwitcher value={theme} onValueChange={setTheme} />
```

- `theme` is the choice (`"system"`, `"light"`, `"dark"`); `resolvedTheme` is what is painted. On a server, "system" resolves to "light".
- The choice is read from `localStorage` through `useSyncExternalStore`, never during render; a server renders `defaultTheme`. Other tabs follow through the `storage` event. While the choice is "system" the provider follows the device.
- Applying a theme sets, on `<html>`: with `attribute="class"` (the default) the class `dark` or `light`; with `attribute="data-theme"` the choice itself, so "system" keeps following in CSS. It also sets `color-scheme`, and, when `themeColor` is given, the content of `<meta name="theme-color">` (the one without a `media` attribute; it is created when missing).
- Storage that throws (private mode, a full quota) is swallowed: the choice lives in memory for the page.
- Props: `defaultTheme` ("system"), `storageKey` ("theme"), `attribute`, `themeColor`, `disableTransitionOnChange`, `target` (a ref to the element that carries the theme instead of `<html>`).
- `themeInitScript(options)` returns the text of a script that does the same before the first paint. It takes the same four options; put it in `<head>` after the `theme-color` meta. The script is the source text of `themeRuntime`, the function the provider calls, so the two cannot disagree. It comes from a module without `"use client"`, so a Server Component can call it. A host with a Content Security Policy gives the script element its nonce.
- `useTheme` throws outside a provider.

Radiant can delete `components/theme-provider.tsx` and `lib/theme-script.ts`. Two differences to check: Radiant's default was "dark" (pass `defaultTheme="dark"` to both), and the class mode now also sets `light` on the root in the light theme (the tokens treat it as the default theme).

### `StatePage`, `ErrorState`, `BackButton`

- `StatePage` is a whole page that is only a state, outside the app shell: not found, gone, a root error, offline. A `<main>` (`as="div"` where the host has one) at least the height of the viewport, clear of the safe areas, with `brand` (a link home) at the top start, then `code` (a short reading such as "404" in the label voice), `title` (`headingLevel`, 1 by default), `description`, `actions` and `children`. The content is anchored to the page gutter in the upper third, as the house layout rule asks; `align="center"` is there for a product that centres its states. `--fui-state-page-size` changes the minimum height.
- `ErrorState` is a `StatePanel state="error"` for a route or a region that failed: `onRetry` shows "Try again" (`retrying` loads it), `homeHref` shows a link home (`homeLabel`), `actions` adds more, and `error` or `reference` shows "Reference abc123" with a copy key. Only `error.digest` is read; an error's message is never shown. Words come from `title`, `description` and `labels` (`title`, `description`, `retry`, `home`, `reference(id)`, `copyReference`, `copied`). The other `StatePanel` props (`headingLevel`, `size`, `variant`, `align`) pass through.
- `BackButton` goes back in history and, when there is none (a page opened in a new tab), to `fallbackHref` ("/"): through `onNavigate(href)` when the host gives its router, else with a page load. With `render={<a href="…" />}` it is a link, the href is the fallback, and a modified click is left to the browser. Its arrow turns round in right to left. It takes `variant` ("outline" by default) and `size` like `Button`; its text is its children ("Go back").

Radiant can delete `app/missing-page.tsx` (its night-sky backdrop stays Radiant's: pass it as a child or keep a wrapper), `app/route-error-state.tsx` and `app/history-back-button.tsx`.

### `ActionBar` and `useViewportInsets`

- `ActionBar` is the bar of a step, a form or a player. It sticks to the block end of the nearest scroll container, over a hairline, with the safe area in its padding. `start` and `end` are its two slots and `children` sit between them; when the bar is narrower than 26rem the `end` slot takes a full row and its buttons share it. With `aria-label` it is a `group`; it is never a toolbar by itself, because its controls keep their own tab stops (pass `role` to change that).
- It measures itself and publishes `--fui-action-bar-size` on its parent (or `containerRef`), without rendering again. `InlineConfirm` reads it for its scroll margin; a host can use it the same way (`scroll-margin-block-end: var(--fui-action-bar-size)`).
- A card around the bar must clip with `overflow: clip`, not `hidden`: `hidden` makes the card a scroll container and the bar would stick to the card instead of the page.
- `useViewportInsets({ target, threshold })` publishes `--fui-keyboard-inset` on the root (or `target`): how much of the layout viewport the on-screen keyboard covers, from `visualViewport`. It is 0 where the browser shrinks the layout viewport itself; changes of 120 px or less are browser toolbars and are ignored. `ActionBar` rises by it and `InlineConfirm` scrolls clear of it. A bar inside a scroll container that does not reach the bottom of the window sets `--fui-keyboard-inset: 0px` on that container. `keyboardInset(innerHeight, viewportHeight, offsetTop, threshold)` is the arithmetic.

Radiant can delete `conversation/use-dock.ts` and the `.lang-session-bar` rules, and read the two variables instead of `--lang-dock` and `--lang-keyboard`.

## Surfaces, targets and scroll regions

Fixes to what exists in `@fabrials/ui` (plan A2, without the sidebar, the carousel and the right-to-left pass, which have their own sections).

### One surface for everything that floats

Four tokens in `tokens.css`, declared on every theme scope, with the values every overlay drew in 0.11:

| Token | Default | Read by |
| --- | --- | --- |
| `--fui-overlay-surface` | `var(--popover)` | `background` |
| `--fui-overlay-border` | `var(--border)` | the 1 px edge |
| `--fui-overlay-shadow` | `var(--fui-shadow-md), var(--fui-highlight)` | `box-shadow` |
| `--fui-overlay-filter` | `none` | `backdrop-filter` |

They are read by the menu and the context menu, the lists of `Select`, `Combobox` and `MultiSelect` (`.fui-menu`), the popover, the hover card, `StatusPopover`, the date pickers and `NavSwitcher` (`.fui-popover`), the navigation menu, the chart tip and the command palette. The tooltip keeps `--fui-tooltip` and `--fui-tooltip-foreground`.

Three surfaces have tokens of their own. None of them is declared: each falls back, so a host that sets the four above reaches them too.

| Token | Falls back to | Surface |
| --- | --- | --- |
| `--fui-dialog-surface`, `-border`, `-filter` | the overlay token | `Dialog`, `AlertDialog`, `Sheet`, the command dialog |
| `--fui-dialog-shadow` | `var(--fui-shadow-lg), var(--fui-highlight)` (the command dialog: `var(--fui-shadow-overlay), var(--fui-highlight)`) | the same |
| `--fui-toast-surface`, `-border`, `-shadow`, `-filter` | the overlay token | toasts |
| `--fui-chart-tip-shadow` | `var(--fui-shadow-md)` (it never had the top highlight) | the chart tip |

A product that frosts its overlays sets them once per theme, where it sets its colours:

```css
:root {
  --fui-overlay-surface: color-mix(in oklab, var(--popover) 88%, transparent);
  --fui-overlay-border: color-mix(in oklab, var(--foreground) 16%, transparent);
  --fui-overlay-shadow: 0 18px 44px -20px oklch(0.45 0.09 255 / 35%);
  --fui-overlay-filter: blur(20px) saturate(1.4);
  --fui-dialog-shadow: var(--fui-overlay-shadow);
}
```

What a product can delete: its rule over `.fui-menu`, `.fui-popover`, `.fui-dialog`, `.fui-command`, `.fui-nav-menu-popup`, `.fui-hover-card`, `.fui-multi-select-popup` and `.fui-chart-tip`, the same block for the toaster, and the test that kept the list complete (Radiant: the "Floating surfaces" section of `globals.css`). `tests/unit/overlay-tokens.test.ts` holds the list here and fails when a rule paints a surface with `--popover` directly.

Looks the same; two rules changed so that a see-through surface is not laid twice: a command palette inside a dialog or a popover has no background of its own, and the footer of a dialog with a `DialogBody` has none either, except in a short window, where it sticks over the scrolling body and takes the dialog's surface.

### Buttons

- `Button size="touch"`: at least 44 px tall on every pointer and in every density, with the padding and the type of the default size. `IconButton size="touch"` is the 44 px square (`Button size="icon-touch"`). For screens where every action is a learner's or a phone's; a product can delete the class it added for this.
- `Button loadingLabel`: what the button says while `loading`, in place of its children ("Saving"). The width follows the text. `IconButton` does not take it.

### Popover

- `PopoverClose` (new export). With no `render` it is the corner key a dialog has: a ghost X named by `label` (default "Close"), which stays in the corner while the popover scrolls. Put it last in `PopoverContent`, so focus lands on the content first; a `PopoverHeader` leaves it room. With `render` it is your own element with only the closing behaviour (`<PopoverClose render={<Button variant="secondary" />}>Done</PopoverClose>`).
- A popover and a hover card are never taller than the room Base UI measured for them (`max-block-size: var(--available-height)`) and scroll inside. Before, a tall popover in a short window ran off the screen. Menus and select lists already did this; `NavSwitcher` keeps its own limit.
- Behaves differently: `.fui-popover` now has `overflow-y: auto`, so something that was drawn outside the popover's box from inside it is clipped.

### Scroll regions

`Table`, `CodePanel`, `CodeTabs`, `Snippet` and ai-ui's `CodeBlock` were a tab stop always. They are one only while their content overflows, as `ScrollArea` has been since 0.11: Tab no longer stops on a table or a code sample that fits. The server renders no `tabindex`; it is set after the first measure and follows every resize. The region role and label of `Table` and `CodeBlock` stay.

- `useOverflowTabStop(ref)` (new export) returns `0` while the element overflows and `undefined` otherwise, for a product's own scroll region. `overflows(node)` is the measure it uses.
- A test that asserted `tabindex="0"` on these in server markup must drop it.

### Fonts and layers

- `--fui-font-fallback`: a slot in `--fui-font-sans`, `--fui-font-display` and `--fui-font-mono` (and so in `--fui-font-label`), after the Plex faces and before the generic families, for a script Plex lacks. Set it on the root element, where the stacks are computed: `:root { --fui-font-fallback: "IBM Plex Sans Arabic"; }` (or the variable of a `next/font` face, when that variable is on `<html>`). Unset, the slot holds the generic family that stood there, so the computed stacks are the ones of 0.11. A product can delete its own copy of the two stacks.
- `@fabrials/ui/layers.css` (new export) is one line, `@layer theme, base, components, utilities;`. A Tailwind host imports it first, so the order of the layers does not depend on the order in which the bundler emits the other imports.

### Safe areas

With `viewport-fit=cover`, on a device with a notch or a home indicator:

- A `Sheet` pads its top and bottom, and the side it is docked to, by the inset when the inset is larger than its padding; its corner X moves down with it. A sheet with a `DialogBody` adds the inset around its bars. A sheet with `padding="none"` is left alone and can read `--fui-sheet-safe-block-start` and `--fui-sheet-safe-block-end` (the insets, less the sheet's own `--fui-sheet-inset-block-*`). The sheet of `SidePanel` pads its top and bottom.
- Sticky `SiteHeader` and `AppHeader`, and the `WorkspaceShell` header, pad their top.
- The toaster keeps its stack inside the insets, at the top and at the bottom.
- The sticky footer of a dialog in a short window pads its bottom.

Every rule is a `max()` or an `env()` with a 0 fallback: nothing moves where the inset is 0.

### Housekeeping

- `.fui-sparkline-area` and `.fui-spin` are gone from the stylesheet: nothing in the packages drew them. (`@keyframes fui-spin` stays.)
- `class-variance-authority` is no longer a dependency of `@fabrials/ui`: nothing imported it. A product that relied on getting it through the package installs it itself.
- `Toaster` no longer types `richColors` and `icons` (`FabrialsToasterProps`): it always dropped them. Passing them is now a type error; remove them.
- `CollectionToolbar`: under 40rem of window the search takes the whole row and the filters and actions go under it. Before, a short action could share the row and squeeze the field.
- `StatePanel` takes `children`, drawn under the description and before the actions (suggestions as chips under an empty state), in a wrapping row that centres with `align="center"`.
