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

## Sound

New. A clip, a recording and a reader, and one bus that keeps them from sounding at once. Nothing in the library asks the network for a clip, records or transcribes by itself: the host passes loader functions and receives a `Blob`.

| Export | What it is |
| --- | --- |
| `claimSound(owner, stop)`, `releaseSound(owner)`, `silenceAll(except?)`, `holdsSound(owner)` | The page's one sound. Whatever starts making or taking sound claims it and the holder before is stopped. `AudioPlayer` and `VideoPlayer` already paused each other this way; that mechanism is now the bus, so a player, a clip, a reader and the microphone all follow it. Plain functions, no React. |
| `useClipPlayer({ load, speeds, cache, onError })` | Plays clips the host loads. `state(ref)` is `"idle"`, `"loading"` or `"playing"`; `played(ref)`, `failure(ref?)`, `play`, `stop`, `toggle`, `retry`, `speed`, `setSpeed`, `speeds`. A load that comes back after a newer request never plays (it is kept), URLs are cached per clip and speed and revoked when the player goes, and a clip refused for the allowance is not asked for again. |
| `ClipButton` | One button for one clip: a speaker, a spinner while it loads, a square while it plays (`aria-pressed`). `clip`, `player` (or its own `load`), `speed`, `label`, `labels`, `size` (`sm`, `default`, `lg`), `iconOnly`, `labelContent`. The name never changes with the state, so a screen reader hears one button; once heard, the words become "Listen again". |
| `SpeedToggle` | The slow rendering: one key pressed while it is on (`variant="button"`), or a segment per speed (`variant="segmented"`). `labels`: `slow`, `normal`, and the control's name. Changing it stops what plays. |
| `ClipNote` | The line under a clip that failed: `role="status"` from the first paint, what happened, and a "Try again" key only when asking again can help (not for `unavailable`, and not for `quota`). |
| `useRecorder({ maxDurationMs, minDurationMs, mimeTypes, constraints, getStream, level, onLevel, onError })` | Records one take. `status` is `idle`, `requesting`, `recording`, `recorded`, `denied`, `no-microphone`, `unsupported`, `busy` or `error`; plus `elapsedMs`, `level`, `blob`, `url`, `durationMs`, `tooShort`, `autoStopped`, `failure`, `start`, `stop`, `reset`, `supported`. The take stays on the device with a URL to hear it; nothing leaves it. It stops itself at the limit, a take under the minimum is a mis-tap, an attempt counter drops a `getUserMedia` that resolves late, tracks are stopped and URLs revoked, and the microphone holds the sound bus while it listens. `getStream` brings a stream of the host's own (a test, another source). |
| `RecorderPanel` | The surface of a spoken answer: one polite status line (the ticking clock and the level meter are `aria-hidden`), a clock in the reader's digits with `dir="ltr"`, the take in the house `AudioPlayer`, and the keys of the step the person is on. `onSubmit(blob, take)`, `submitLabel`, `pending`, `slowAfterMs`, `action`, `fallback`, `showLevel`, `labels`. The focus follows the flow: Stop while recording, the primary action once there is a take, Record after a take is dropped. |
| `RecorderPanelView` | The same surface with every state given to it, so a host can show each one without a microphone. |
| `useSlow(active, afterMs)` | True once `active` has lasted; the time to say the work is still going. |
| `useSpeech({ loadClip, lang, rate, fallback, chunkSize, onError })` | Reads text aloud: the host's clips a chunk at a time, the browser's own voice when there is no loader or it fails (`fallback: "browser"`). `speaking`, `loading`, `currentId`, `speak(text, { id })`, `stop`. One reader at a time on the page, and clips are kept and their URLs revoked (the reference product leaked them). |
| `speakableText(markdown)`, `speechChunks(text, max)`, `matchVoice(voices, lang)` | Plain words for speech; a split at sentence ends (Latin, Arabic `؟` `۔`, Chinese and Japanese `。！？`), then commas, then spaces, never inside a word or a written character; and the browser's voice for a language. Pure, no directive. |
| `ClipError` | What a loader throws to say why there is no clip: `unavailable`, `rateLimited`, `quota`, `offline`, `failed`. `clipRetryable(kind)` and `clipFailureOfStatus(status)` help a loader built on a request. |

Changed:

- **`VoiceInputButton` is built on `useRecorder`**: one recorder in the house. Its props, markup, classes and behaviour are as they were. Two additions: `unsupportedFallback` (a node shown in a browser that cannot record, `null` by default, so nothing changes unless a host opts in — before it rendered nothing), and `labels.denied`, `noMicrophone`, `busy`, `interrupted`, `micFailed`, `recordingFailed` (English defaults keep the old wording).
- **`AudioPlayer` and `VideoPlayer`** follow the bus: same one-at-a-time behaviour, now shared with clips, the reader and the microphone, so an `AudioPlayer` starting stops a clip and a recording stops both.

A product can delete: its own audio-note components, its silence helper (Radiant's `components/lang/exercise/silence.ts`), its clip cache and turn counter, its recorder state machine, its slow-work timer, and its speech chunker. What stays the product's: the loader functions (its own routes), what it does with a recording, and its strings.

Nothing looks different on a page that uses none of this. A page that uses a player now also goes quiet when a clip starts, which is the same rule it already followed with another player.

## Answers and steps

Five new pieces for a screen that asks something and shows something in steps, and two new ways to draw `Progress`. All in `@fabrials/ui`; nothing that existed changed behaviour.

### `ChoiceGroup`, `ChoiceOption`

The answers to a question as tiles. One answer is a Base UI radio group (the arrow keys move the pick, Tab enters at it, the form gets the value); `multiple` makes it a group of checkboxes (each its own tab stop, Space ticks it, one value each under `name`).

| Prop | What it does |
| --- | --- |
| `markers` | `letters` (A, B, C; default), `numbers` (1, 2, 3, in `locale`'s digits) or `none`, in a small keycap, which is `aria-hidden` |
| `shortcuts` | Off by default. The marker's key picks its option from anywhere on the page that is not a text field: digit 1 to 9, or A to Z beside letters. It selects, or toggles in a `multiple` group, and moves focus to the option. Announced through `aria-keyshortcuts` |
| `orientation`, `columns`, `size` | A stack (default), a row that wraps, at most `columns` columns as many as fit (an option is never narrower than 12rem), and `sm`, `default` or `lg` |
| `result` | `correct` or `incorrect` on the group: it becomes read-only and the picked option is marked. Per option: `correct`, `incorrect` or `missed` |
| `readOnly` | Focusable and readable, not changeable. On by itself once the group or one of its options has a `result` |
| `labels` | The words spoken after a marked option's name: `correct` ("Correct"), `incorrect` ("Your answer, incorrect"), `missed` ("Correct answer"), `ruledOut` ("Ruled out") |

`ChoiceOption` takes `value` (required), `description` (a second line that describes the option and stays out of its name), `ruledOut` (stays where it was, struck through, `aria-disabled`, passed over by the arrows and without its key) and `result`.

- An option's name is its own content: an answer in another language keeps its `lang`, and there is no `aria-label` over the text.
- A marked option shows an icon **and** a word to a screen reader; the tints come from the success and danger tones, and in forced colors the edge says it: a `Highlight` edge and keycap when a pick, a solid, a double and a dashed `CanvasText` edge for right, wrong and missed.
- Give the group a name with `aria-labelledby` (the question) or `aria-label`.

### `ChoiceFeedback`

What became of an answer, under its group: an `Alert` in the tone of the verdict (`correct`, `incorrect`, `partial`, `neutral`) with the tone's icon and its word ("Correct", "Not quite", "Partly right"; `title` replaces it, `null` leaves it out). Always `role="status"`, never an alert: a wrong answer is not an emergency. If `Alert` is all you need, use `Alert` with `variant="success"` or `"destructive"` and mount it when the answer is checked.

### `RevealCard`, `RatingBar`

| Prop | What it does |
| --- | --- |
| `front`, `back` | The question, always shown; the answer, shown once revealed |
| `revealed`, `defaultRevealed`, `onRevealedChange` | Controlled or not |
| `label` | Names the card for a screen reader ("Card 3 of 20"); the card is a focus target (`tabIndex={-1}`) and its ref exposes `focus()`, so a session brings focus back to it |
| `revealLabel`, `revealKeyLabel` | The button's words and the key printed beside them (hidden where nothing hovers) |
| `shortcuts` | On by default: Space reveals from the card, from its button or from the page itself, never from a field or another control, and once per press (holding the key does not toggle it, and its repeats do not scroll the page). Off where several cards share a screen |
| `children` | What follows the answer once it shows: a `RatingBar`, a Next button |

The answer sits in a container with `aria-live="polite"` that exists, empty, before the reveal, so the answer is announced; it rises in (`.fui-rise`) and nothing moves under reduced motion. There is no flip: both sides stay in the layout.

`RatingBar` takes `options: { value, label, hint?, tone?, shortcut? }[]`, `onRate(value)`, `label` (which names the group), `disabled`, `pending`, `shortcuts` (digit keys, from anywhere but a field, default on), `once` (default on: one rating until the bar is mounted again or `resetKey` changes; `false` for a rating a person may change) and `resetKey`. Each rating is a button with its key, its word and what it means; the meaning goes under a narrow container (22rem) and the keys where nothing hovers; 44 px on coarse pointers.

### `StepControls`, `useStepPlayer`

`useStepPlayer({ count, index?, defaultIndex, onIndexChange, playing?, defaultPlaying, onPlayingChange, speed?, defaultSpeed = 1, onSpeedChange, interval = 1200, loop })` returns `{ index, playing, speed, atStart, atEnd, next, previous, goTo, play, pause, toggle, restart, setSpeed }`, plus `count`. It advances on a timer (the interval divided by the speed), stops at the end (or goes round with `loop`), waits while the page is hidden, and a step taken by hand pauses it. `stepPlayerReducer` is the pure state machine behind it.

`StepControls` is a `Toolbar` (one tab stop, the arrow keys and Home and End between the keys): previous, play or pause (Replay at the end), next, an optional reset, "Step 3 of 12" in the label voice in the reader's digits, an optional set of speeds, and `children` for one more key. Spread `<StepControls {...player} />` or pass plain props; the play key shows when `toggle` (or `play` and `pause`) is given, so previous and next alone make a pager. The counter is not a live region: the step is announced when a key changes it, and when playing pauses or ends — never on every tick. Chevrons are mirrored in a right-to-left page.

### `Progress` `segments` and `marks`

Two props on `Progress`; without them it is exactly as it was.

| Prop | What it does |
| --- | --- |
| `segments` | A track of named parts, each as wide as its `weight` (default 1) in its own state: `done`, `current`, `todo`, `correct`, `incorrect`, `skipped`. The whole is still a `progressbar`; its value is the number of settled parts and its value text names the current one ("Step 3 of 8, Listening", `labels.step`, `labels.settled`), unless `value` or `getAriaValueText` say otherwise. Each part has `aria-current="step"` when current and a spoken "Listening, current" |
| `onSegmentSelect` | Makes each part a button that calls back with its place. Then the parts are a toolbar (one tab stop, the arrows and Home and End, named by `label` or `aria-label`) and no longer a progressbar |
| `marks` | Ticks across the track of an ordinary bar at their `value`, measured from the start of the track (so a right-to-left page mirrors them), each with a `label` that is spoken as part of the bar's description and, with `caption`, shown under the bar at the tick |
| `labels` | `step`, `settled`, `segment` and `segments` |

States read apart without colour: done is the fill, to do the empty track, current stands taller with an edge, correct is the success fill, incorrect is dashed and skipped dotted. In forced colors each is a `Highlight` fill, a pattern or an edge. One bar uses one ladder: `done`/`current`/`todo` for the parts of a plan, or `correct`/`incorrect`/`skipped` for the questions of a quiz (there, a done part and a right one would both be a solid fill, since they never share a bar).

### `MarkedText`, `AnnotationList`, `TextDiff`

| Prop | What it does |
| --- | --- |
| `MarkedText` `text`, `ranges` | `ranges` are `{ start, end, id?, severity?, label? }` in UTF-16 code units. Out-of-range ranges are clamped, a range is widened to whole characters (never cutting an emoji, a joined emoji or a letter from its accent), and where two overlap the later keeps what is left; a range with nothing left draws no mark and the others keep their numbers. `severity` is `error` (solid line), `warning` (dashed) or `note` (dotted) |
| | Each mark has a spoken prefix ("Mistake 1: "), an `aria-hidden` number that matches its note, and is described by the element of its range's `id`. `lang`, `dir`, `labelLang`, `labelDir` and `locale` are props |
| `AnnotationList` `items` | The notes under the text: `{ id?, number?, severity?, title?, before?, after?, children? }`. `before` and `after` are quoted in the marked text's `lang`/`dir` as "old, an arrow, new" |
| `TextDiff` `before`, `after` or `parts`, `legend` | A word diff (`Intl.Segmenter`, LCS) into `<del>` and `<ins>` with spoken "Removed" and "Added", or parts computed elsewhere (a letter-level diff). A removal is struck through and an addition underlined, so it reads without colour |

`segmentText`, `placeRanges`, `diffWords`, `wordTokens` and `graphemeBoundaries` are exported from `@fabrials/ui` for a host that wants to place or compare text itself.

### What a product can delete

- Radiant's `components/lang/exercise/choice.tsx` and the option list of `features/quiz/view.tsx` (the radios there have no arrow keys; these do), its `placement/yesno.tsx` (two `ChoiceOption`s in a `ChoiceGroup` named `numbers`).
- `components/lang/review/review-card.tsx` as the card's shell and the key handling of `review/review-session.tsx` (Space, the rating digits, the double-rate guard, focus back to the card): `RevealCard` + `RatingBar` + `useStepPlayer` keep the behaviour and the guards. The weaker `learn/review-session.tsx` has an `aria-label` over the whole card that hides its text from a screen reader; do not copy that.
- The players of `features/algorithm/view.tsx` and `features/simulation/view.tsx`: `useStepPlayer` + `StepControls`.
- `components/lang/session/progress.tsx`, `placement/progress.tsx` and the strip of `features/quiz/view.tsx`: `Progress` with `segments` (and `onSegmentSelect` for the strip).
- `components/lang/write/marked-text.tsx`, the list of `correction-view.tsx`, and `Diff`/`Marked` in `exercise/feedback.tsx`.

### Looks or behaves differently

- Nothing in a product changes until it adopts a piece. The styles are one new block at the end of `styles.css`.
- One bar answers to the digit keys at a time: two `RatingBar`s with `shortcuts` on the same screen each prevent the other's default, so the first in the document takes the key. Leave the keys off the bar that is not on screen.
- `useHotkeys` (B1) will replace the private helper these pieces use for the same guards (modifiers, IME, key repeat, typing targets, `data-hotkeys="off"`); until then a key that acts from anywhere ignores fields, editable text and the roles that take text, and islands that opted out.

## ImageViewer and MediaGrid

The viewer is the same component it was; what is new is the wiring a page with many pictures would otherwise write, and a few things a phone gallery does that it did not. Nothing changes unless you ask for it: no existing prop, label or reference changed.

```tsx
<ImageViewerProvider label="Photos">
  <ImageViewerGroup name="message-1">
    {photos.map((photo) => (
      <ZoomableImage key={photo.src} src={photo.thumb} full={photo.src} alt={photo.alt} ratio="4 / 3" />
    ))}
  </ImageViewerGroup>
</ImageViewerProvider>
```

- **`ImageViewerProvider`** renders one viewer for everything below it. It takes the viewer's own props (`label`, `labels`, `thumbnails`, `renderMedia`, `actions`, `zoomOn`, `compact`, `dragToClose`, `onNearEnd`).
- **`useImageViewer()`** gives `{ open(items, index = 0, { returnFocus }), close(), isOpen }`; it is `null` outside a provider, so a piece can fall back instead of drawing a control that does nothing.
- **`ZoomableImage`** is an `Image` (same frame, ratio, dither reveal and error plate) that opens the provider's viewer when pressed. Inside a provider it is a real button named "Open {alt}" (`labels.open(alt)`).
- **`ImageViewerGroup name="…"`**: every `ZoomableImage` in the same group opens the viewer at its own place, with the pictures of the group beside it. Use one per message or per result set. Without a group, a picture opens alone.
- **Outside a provider `ZoomableImage` is a plain image**, not a disabled control.

| `ImageViewer` prop | What it does |
| --- | --- |
| `dragToClose` (default `true`) | A finger or a pen on a fitted picture drags it down; past 96 px, or on a quick flick, letting go closes the viewer; under that it springs back. A sideways drag still moves to the neighbour, a mouse drag does not close. The stage takes the touch while the picture is fitted (`touch-action: none`). |
| `zoomOn` (`"click"` by default, `"double"`) | With `"double"`, two taps or two clicks zoom around the point pressed and one click does nothing; a single tap of a finger shows and hides the bars. |
| `actions` (`["download"]` by default) | Keys of the bar that act on the picture, in order. `"copy"` puts the picture on the clipboard (`copyImage` from `@fabrials/ui/export`) and says so in a polite region; it is drawn only where the browser can copy a picture. |
| `compact` (default `false`) | Under 48rem the zoom level leaves the bar, and with eight items or fewer dots stand for the strip. Previous and Next stay for assistive technology. |
| `returnFocus` | A ref to the element focus goes back to on close; what was focused on open is the default. |

- **`ViewerItem`** gains `downloadName` (the name the download saves), `credit` (a node), `sourceUrl` and `sourceLabel`: the credit is a line in the label voice under the caption, with the source as a link ("Photo: Ada Rivera · unsplash.com"), `dir="auto"` and `rel="noreferrer noopener"`.
- **`thumb`** now also stands under the picture while the full one loads, at the place and size the picture will take (from `width` and `height`, or as large as the stage allows), blurred by 6 px and at 60 % — the dither reveal of `Image` is for a picture arriving into a frame, not for one already framed. It is replaced without a jump. The spinner stays for an item with no thumbnail.
- **The next and previous pictures are asked for once each** when an item is shown, and never on a connection that saves data.
- **Safe areas**: the viewer pads by `env(safe-area-inset-*)` through `max()`, so nothing moves where the inset is 0.
- The zoom, the swipe and the close gesture now decide their axis from the first 10 px (`dragAxis`): a drag that is more vertical is a drag down, otherwise a swipe.

New pure helpers in `media-logic`: `dragAxis`, `dragDown`, `closesOnRelease`, `isDoubleTap`, `preloadTargets`, `galleryLayout`, `unbrokenSet`, with `AXIS_SLOP`, `CLOSE_DISTANCE`, `FLICK_SPEED`, `FLICK_DISTANCE`, `DOUBLE_TAP_TIME` and `DOUBLE_TAP_DISTANCE`.

### `MediaGrid`

The mosaic of four is unchanged. `layout="gallery"` draws up to eight tiles: one, two or three in a row; four as two by two; five around a large lead tile; six as three by two; seven and eight in four columns. In a container narrower than 30rem there are two columns, and an odd count lets the first tile span both.

| `MediaGrid` prop | What it does |
| --- | --- |
| `layout` (`"grid"` by default, `"gallery"`) | The mosaic of four, or the gallery of up to eight. |
| `max` | How many tiles are drawn: four in a grid, eight in a gallery. Past that the last tile says "+N". |
| `caption` | The grid's name, for a screen reader; the grid becomes a `figure role="group"`. |
| `footer` | A `figcaption` under the tiles: where they come from. |
| `empty` | What to draw when every tile failed and `hideBroken` took them all. |
| `hideBroken` (default `false`) | A tile whose picture fails leaves the grid, the "+N" count and the viewer's set. |
| `onItemError(item, index)` | Called for each picture that fails. |
| `referrerPolicy` | Passed to every picture. |
| `openWith="viewer"` | Pressing a tile opens the nearest `ImageViewerProvider` on the unbroken set at that place. `onOpen` still wins when both are given. |

- **`MediaGridItem`** gains `caption` (a line over the foot of the tile, in the label voice on a scrim, on hover and on keyboard focus, always on a touch screen), `credit`, `sourceUrl`, `sourceLabel`, `downloadName`, `download`, `width` and `height` — the whole item is what the viewer receives, so a gallery and its viewer say the same thing.
- A tile that is a button describes itself with its caption (`aria-describedby`), and the caption is not part of its accessible name.

Radiant can delete `components/chat/image-lightbox.tsx` and `components/chat/image-results.tsx` once it migrates (the gallery it built is `layout="gallery"` with `hideBroken`, its lightbox is the provider, and `messageGallery` in `chat-transcript.tsx` is the group), and every hand-rolled `MAX_SCALE`/`CLOSE_DRAG_PX`/`SWIPE_PX` in them. Its look stays its own.

## Words and locale

Every word a component says on its own is now a prop with the English default it always had, counts go through `Intl.PluralRules`, and a product can set the whole set once for its page. Nothing changes for a product that changes nothing: the defaults are the words 0.11 printed.

### `plural`, `formatCount`, `localeTag`

From `@fabrials/ui`, in `plural.ts` with no directive, so a Server Component can call them.

- `plural(count, forms, locale = "en")` picks `zero`, `one`, `two`, `few`, `many` or `other` with the locale's `Intl.PluralRules` (cached per locale) and replaces `{count}` with the number in that locale's digits. A category a language does not have falls back to `other`. `plural(5, { one: "{count} source", other: "{count} sources" }, "ar")` gives the Arabic `many` form; `plural(1204, forms, "es")` writes `1.204`.
- `formatCount(count, locale = "en")` is the number alone, grouped and in the locale's digits.
- `localeTag(locale)` turns any `Intl.LocalesArgument` (a tag, an `Intl.Locale`, a list) into the one tag the APIs that insist on a string need, `"en"` when there is none.

### `LabelsProvider`, `useLabels`, `useLocale`, `useProvidedLocale`

```tsx
<LabelsProvider locale="es" labels={{ chart: { only: "Solo" }, codePanel: { copy: "Copiar el código" } }}>
  <App />
</LabelsProvider>
```

| Piece | What it does |
| --- | --- |
| `LabelsProvider labels={…} locale={…}` | Sets the words, by component scope, and the locale for everything inside. Nested providers merge: a scope given again is merged key by key over the outer one, a key set to `undefined` is not given and never hides the layer below. |
| `useLabels(scope, defaults, own?)` | What a component reads: `{ ...defaults, ...provider[scope], ...own }`, so the component's own `labels` prop always wins. The result keeps its identity while the three inputs do; pass `defaults` as a module constant. |
| `useLocale(own?)` | The component's `locale` prop, else the provider's, else `"en"`. |
| `useProvidedLocale(own?)` | The same, but `undefined` instead of `"en"`: for a component whose "no locale" is not a locale's (`NumberTicker` prints plain digits). |
| `FabrialsLabels` (type) | The registry: one optional key per scope. `@fabrials/ai-ui` adds its own by declaration merging, so `labels={{ search: {…} }}` is typed wherever the token appears. |

The provider is a client component, and a function cannot cross from a Server Component: render it in a client module of the product, next to the other providers. The components that already rendered on the server still do (they take plain props).

### `labels` props

Each one is `Partial<…>` of its scope, English by default, and reads the provider under itself.

| Component | Scope and keys |
| --- | --- |
| `SeriesChart` | `chart`: `label`, `hide(series)`, `show(series)`, `showOnly(series)`, `only`, `showAll`, `noValue`, `total`. Plus `locale`, which formats the values when there is no `yFormat`. |
| `CodePanel`, `CodeTabs`, `PackageInstall` | `codePanel`: `copy`, `copied`, `copyFailed`, `code`, `examples`, `packageManager`. |
| `CopyButton`, `Snippet` | `copyButton`: `copy`, `copied`; `snippet`: `copy`. Their `label`/`copiedLabel`/`copyLabel` props still win. |
| `MultiSelect` | `multiSelect`: `placeholder`, `more(count, locale)`, `clear(label)`. The `placeholder` prop wins; `clear` receives the caller's label as written (only the English default lowercases it) and `locale` sets the spoken count's digits. |
| `RepoInfo` | `repoInfo`: `stars(count, locale)`, `forks(count, locale)`, both through `plural`. `locale` (default `"en"`) sets the compact number beside them. |
| `FilterChip` | `filterChip`: `clear(label, value)`. `clearLabel` still wins. |
| `Table` | `table`: `region(name?)`, the name of the scroll region. `regionLabel` still wins. |
| `Calendar` | `calendar`: `previousMonth`, `nextMonth`. `previousMonthLabel` and `nextMonthLabel` still win. |
| `DatePicker`, `DateRangePicker` | `datePicker`: `placeholder`, `clear`, `rangePlaceholder`, `clearRange`. The props still win. |
| `ImageViewer`, `Spreadsheet`, `TaskList`, `ThemeSwitcher`, `ErrorBoundaryFallback` | `imageViewer`, `spreadsheet`, `taskList`, `themeSwitcher`, `errorBoundary`: their existing `labels` props now also read the provider, under the prop. |
| `@fabrials/ai-ui` `SearchStepsDisclosure`, `SearchStepList`, `SourceTally` | `search`: `searching`, `reading`, `searched`, `searches(count, locale)`, `sources(count, locale)`, `searchedWeb`, `readPage`, `opened(host)`, `showQueries`, `hideQueries`, `reviewing`. |
| `Sources`, `SourceCard`, `CitationChip` | `sources`: `source(number)`, `citation(number, title)`, `count(count, locale)`. |
| `Attachments`, `AttachmentChip` | `attachments`: `label`, `uploading`, `uploadingName(name)`, `uploadingPercent(percent)`, `failed`, `remove(name)`. `removeLabel` and `label` still win. |
| `AgentThinking` | `agent`: the word of each activity, used when it is given no `label`. |
| `ReasoningDisclosure` | `reasoning`: `thinking`, `brief`, `thoughtFor(seconds)`. |
| `ContextMeter` | `contextMeter`: `label`, `unit`, `free`, `of(used, limit)`. The `label` and `unit` props win. |
| `GenerationFrame` | `generation`: `queued`, `image`, `document`, `imageFailed`, `documentFailed`, `imageReady`, `documentReady`. `label` and `doneLabel` win. |
| `CodeBlock` | `codeBlock`: `copy`, `copied`, `download`, `region(name)`. `copyLabel`, `copiedLabel` and `downloadLabel` win. |

The exported helpers keep their signatures and add the words at the end: `searchLabel(phase, sourceCount, searchCount, labels?, locale?)`, `searchDoneLabel(sourceCount, searchCount, labels?, locale?)`, `searchStepLabel(step, labels?)`, `searchStepKindLabel(step, labels?)`, `sourcesLabel(count, labels?, locale?)`, `attachmentDetail(item, locale?)`. `formatPercent(percent, locale)` (from `@fabrials/ai-ui`'s `format.ts`, and from `attachments`) writes a whole percentage in the locale's form, `"36%"`, `"36 %"`, `"٣٦٪"`.

A code panel's copy result is no longer a sentence that its CSS inspects: `data-state` is `"copied"` or `"failed"`, and the words come from `labels.copied` and `labels.copyFailed`. A product that styled that status by its text can style it by the state.

### One locale, one default

`locale?: Intl.LocalesArgument` everywhere: a tag, an `Intl.Locale`, or a list. Without one a component asks the provider and then uses `"en"`.

- `Calendar`, `DatePicker`, `DateRangePicker` and `Spreadsheet` used to default to the runtime's locale. They default to `useLocale()` → `"en"`, so the server and the browser draw the same month and the same numbers. **This looks different in a product whose page is not in English**: pass `locale={navigator.language}` after hydration, or set the provider's `locale`, and the old behaviour is back.
- `Meter`, `RelativeTime` (and `FileSize` through its own prop) defaulted to `"en"` already; they now read the provider too.
- `NumberTicker` took `locale: boolean`, meaning "use the device's locale". It now takes a locale as well: `locale="de"`, or the provider's. `locale={true}` still means the device's (deprecated: the server cannot know it and the text changes when the page hydrates) and `locale={false}` keeps the digits plain inside a provider. With no locale at all it keeps printing plain digits, as before.
- `groupByRecency` and `recencyGroupFor` take `locale` as an `Intl.LocalesArgument` and still default to `"en-US"`.
- File sizes keep their old English text unless a locale is given, here or by the provider (`"1.5 KB"` without one, `"1,5 kB"` with `es`): `attachmentDetail(item)` is what it was.

### What a product can delete

Its own copies of these sentences: the chart's legend and table words, the code panel's copy labels, the multi-select summary, the repository counts, the filter chip's clear key, the search and source sentences of the chat, the upload states, the context window's readings and the generation frame's status sentences. Radiant, in particular, builds several of them by string concatenation in its components; they become one provider.

## Artifacts: the frame, the viewport, a tool call and the follow-ups

Four pieces for an answer that draws something, runs a tool or offers what to ask next. All four are new exports; nothing existing changes.

### `ArtifactFrame` (`@fabrials/ai-ui`)

The plate around a rendered thing inside an answer: a header with the notation and the title, a toolbar (source, copy, the downloads the rendering offers, full screen), a body of reserved height, and a failure that shows the reason and the source instead of an empty box.

```tsx
<ArtifactFrame kind="Chart" title="Sign-ups" source={source} pending={!data} ratio={2}>
  {({ expanded, onReady, onError, onExport }) => (
    <TheChart expanded={expanded} onReady={onReady} onError={onError} onExport={onExport} />
  )}
</ArtifactFrame>
```

| Prop | What it does |
| --- | --- |
| `kind`, `title` | A short word for the notation in the label voice ("Diagram", "Chart") and the title, isolated with `<bdi>` so a title in another script keeps its own direction. |
| `source`, `sourceLanguage`, `sourceExtension` | The text the drawing was made from, its language for highlighting and the extension a downloaded source takes (from the language when not given: `xml`, `mmd`, `py`…). With a source there is a source toggle, a copy and a source download. |
| `status` | `loading`, `ready` or `error`, when the host knows. Without it the status follows `pending`, `streaming` and what the children said. |
| `pending`, `streaming` | The rendering has not arrived (`pending`: loading until `slot.onReady`), or its source is still arriving (`streaming`: a failure is held back and the label says "Drawing…"). |
| `error`, `onRetry` | A reason the host already knows, and the key that tries again. A child that throws is caught inside the frame and shown the same way; a new `source` clears the failure. |
| `minHeight`, `ratio` | The height both the skeleton and the body keep, so nothing shifts when the drawing arrives. Default `10rem`. |
| `contentDir` | The direction of the rendering area: left to right by default, whatever the answer's language. |
| `fullScreen`, `zoomable`, `zoomableLabel` | Full screen (on): a dialog near the window that renders the children again with `slot.expanded`, inside `ZoomPan` when `zoomable`. |
| `view`, `defaultView`, `onViewChange` | The source view, controlled or not. |
| `actions`, `labels` | The host's own keys at the end of the toolbar, and every word. |

The children are a render function given `{ expanded, onError, onExport, onReady }`: `onExport({ svg, png })` with what a download can offer (a PNG is made from the SVG at twice the size when only an SVG was offered), `onReady()` once the drawing is worth showing, `onError(reason)`. Plain children are accepted too, and then there are no downloads and no ready state. The slot keeps its identity between renders, so a renderer can register in an effect.

`useAsyncRender(loader, deps)` is the hook the same frame is built for: `{ status, value, error, retry }`, with the load cancelled when the deps change, the previous value kept while the next one runs, and an answer to a replaced run dropped. `asyncRenderReducer`, `deriveArtifactStatus`, `downloadFormats`, `reasonText` and `sourceExtensionFor` are exported for hosts that keep their own state.

**Note for a host**: the frame is a size container (its toolbar folds its lesser keys into one menu below 34rem), so it takes its width from its parent. Put it in a block, not in a place where it is shrunk to fit: a size container measured without its contents would be nothing but its borders.

### `ZoomPan` (`@fabrials/ui`)

A viewport that zooms and pans anything, on the same maths as `ImageViewer`.

| Prop | What it does |
| --- | --- |
| `minScale`, `maxScale`, `defaultScale` | The range and where it starts. 1 is the content laid out as wide as the viewport. Default 1 to 4. |
| `scale`, `onScaleChange` | Controlled scale. |
| `interactive` | Default `true`. `false` makes it an ordinary box: no key, no wheel, no touch, no controls. Use it for a drawing inside a page that scrolls, and make it interactive in the full-screen view. |
| `wheel` | `ctrl` (default): a plain turn of the wheel scrolls the page and Ctrl or ⌘ with it, or a pinch, zooms. `zoom`: every turn zooms, for a view that owns the screen. |
| `label`, `labels`, `controls` | The region's name, every word, and the keys under the viewport (zoom out, the level, zoom in, Fit). |
| `ref` | `{ zoomTo(scale, at?), fit(), reset() }`. |

- The wheel steps the same on every device (a notch is a quarter) and zooms around the pointer, which stays under it; two fingers pinch; a drag pans once there is more to see, and a click that did not move still reaches a control inside the content.
- With focus: `+` and `=` zoom in, `-` zooms out, `0` fits, `Home` goes back to the start, and the arrows pan where there is more that way (otherwise they scroll the page as usual).
- The content is drawn at its natural layout and enlarged by a transform inside a box of the enlarged size: the scroll bars, the keys and momentum scrolling are the browser's own, any content works (a table does not reflow) and a drawing is rasterised again at the new size, so it stays sharp. The box keeps the height the content has at scale 1, so zooming does not make the frame grow.
- A touch screen keeps its one-finger scroll (`touch-action: pan-x pan-y`), and nothing is animated.

Radiant can replace the `pan`/`zoom` of its plots' full-screen view with this; the rest of its `feature-frame` becomes `ArtifactFrame`.

### `ToolCall` (`@fabrials/ai-ui`)

A tool call in an answer, on `ActivityDisclosure`: `name`, `state` (`pending`, `running`, `done`, `error`, `denied`), `input` and `output` (strings or JSON, shown as highlighted JSON in a code well, capped in height), `error`, `duration`, `icon`, `defaultOpen`, `labels`.

- The state is said in words with the library's mark: an orbit while it runs, a tick or a cross when it settles, and a still mark while it waits. Never a stock colour.
- It opens by itself only on error, where the reason is what a reader wants first. `duration` adds the time ("Ran search_docs in 1.2s").
- `toolCallLabel(state, name, duration, labels)` and `toolPayload(value)` are exported for hosts that render their own row.

Radiant can delete `components/ai-elements/tool.tsx` and `features/core/tool-part.tsx`.

### `SuggestionChips` (`@fabrials/ai-ui`)

Follow-ups under an answer: `items` (`{ id, label, value?, lang? }`), `onSelect(item)`, `disabled`, `label` (the group's name, "Follow-ups" by default) and `labels`; also `icon(item)`.

- A wrapping row of soft tags that are buttons (6 px corners, a tint of the muted ink, a deeper tint under the pointer), with `dir="auto"` and `lang` per chip.
- One tab stop: the arrows move between them (following the direction), Home and End go to the ends; a disabled group blocks every chip, and 44 px tall on a coarse pointer.
- A chip that arrives after the first paint rises into place, staggered; under reduced motion it is simply there.

Radiant can delete `features/core/study-chips.tsx`.

## Conversation

The log a chat fills, written without `use-stick-to-bottom`: it opens at the latest message, stays there while an answer arrives, lets go the moment the reader scrolls away, and keeps a rail of their own messages. `@fabrials/ai-ui` had every piece of a chat message but no container for them; this is that container, and it is what Radiant built `components/ai-elements/conversation.tsx` for.

```tsx
<Conversation stickKey={messages.length}>
  <ConversationContent measure>
    {messages.map((message) => (
      <ChatMessage from={message.role} id={message.id} key={message.id}>
        …
      </ChatMessage>
    ))}
  </ConversationContent>
  <ConversationCheckpoints />
  <ConversationScrollButton />
  <ConversationFooter>
    <ChatComposer onSubmit={send} />
  </ConversationFooter>
</Conversation>
```

The parent needs a height: the conversation fills it.

### `Conversation`

| Prop | What it does |
| --- | --- |
| `anchor` | `"end"` (default) opens at the latest message and follows it. `"start"` is an ordinary scroller for a transcript read from the top; the jump key and the rail still work. |
| `stickKey` | Any value that changes when the reader sends a message: the conversation jumps to the end and follows it again, even if they had scrolled away. Sent before the next paint, not after it. |
| `threshold` | How near the end still counts as being there, in px. Default 48. |
| `actionsRef` | Receives `scrollToEnd({ behavior })` and `scrollToMessage(id \| element, { behavior, align, offset })`. |

How it behaves, and what it replaces:

- **It opens at the end without animating there.** The first position is set before the first paint and with `behavior: "auto"`: a smooth scroll from the top is outrun by content that keeps rendering (markdown, code, pictures).
- **Growth is followed, not animated.** A `ResizeObserver` on the content and one on the log keep the end in view: instantly while an answer streams, one placement per frame at most, never a smooth scroll per token. Pictures that load late and change a height are covered by the same observer.
- **The reader lets go at once.** A wheel up, a finger dragging down the screen, PageUp, ArrowUp, Home or a selection inside the log unlocks before the scroll it causes, so growth that lands in the same frame does not pull the view back under their hand. A scroll event moving away from the end also unlocks, unless it is a scroll of ours (recognised by the position it was sent to) or a pixel or two of the layout settling. Returning to the end locks again, and `stickKey` or `scrollToEnd()` locks from anywhere.
- **The viewport changing size stays at the end** while it follows: the window, the on-screen keyboard, the composer growing.
- No timers: Radiant's `ConversationScrollToLatest` re-asserted the end at 0, 120, 300, 600 and 1000 ms. The observer makes that unnecessary.
- `prefers-reduced-motion: reduce` turns every scroll of ours into an instant one.

### `ConversationContent`

The log: `role="log"`, `aria-label` from `label` (default "Conversation"), `aria-live="off"` unless `live="polite"`. **Nothing is announced by default**: a streaming answer read token by token is noise. Announce the finished answer from the host (`useAnnounce`), or let `ChatMessage`'s own state speak.

It is a tab stop only while it overflows, so the keyboard can scroll it, and its ring is drawn on the conversation, inside its edge, above the content (the scroll region would paint over an outline on itself). `overscroll-behavior: contain`, a thin scrollbar in the ink's tint, `scrollbar-gutter: stable`.

`measure` (off by default) and `align`:

| Prop | What it does |
| --- | --- |
| `measure` | Inside it, an answer is as wide as its text up to `--fui-chat-measure` (52rem) and takes the whole column when it holds a table, a `<pre>`, a `<figure>`, a `.katex-display` or anything marked `data-wide`. A reader's bubble stops at 80% of the column, or 40rem. |
| `align` | `"start"` (default) keeps the column at the start edge, padded by the page gutter. `"center"` centres it, capped at the measure plus two gutters: a chat column is the one recognised exception to the house's rule that nothing is centred, and a product chooses it. |
| `columnClassName` | A class for the column that holds the messages; the root is the scroll container. |

The measure reads through container queries, never viewport media queries, and it changes nothing without `measure`: the rules only apply under `.fui-conversation-content[data-measure]`.

### `ConversationScrollButton`

The way back to the latest message: there only while the reader is away from the end, with its count of messages that arrived meanwhile (or a dot when only an answer grew) and a name that says so — "Jump to latest", "Jump to latest, 3 new messages" (`labels.jump`, `labels.unread(count)`, `labels.fresh`, plurals through `Intl.PluralRules`). `align="center"` (default) or `"end"`. It rises in and out in 150 ms, never under reduced motion, and is 44 px on a coarse pointer. A press does not take focus from the composer; pressed from the keyboard, focus goes to the log.

### `ConversationCheckpoints`

The rail of the reader's own messages on the end side: one small marker each, the one being read current (`aria-current`), a press brings its message to the top with 16 px of air. One tab stop, the arrow keys between markers, Home and End to the ends, and a preview on hover and on focus ("Message 3 of 12" and two lines of it, `dir="auto"`).

- **Messages register themselves.** `<ConversationCheckpoint>` wraps one; `useConversationCheckpoint({ id, label })` returns a ref to put on your own. `selector` (default `[data-role="user"]`) finds the ones a `ChatMessage from="user"` already marks, so the usual case needs no wiring at all.
- A rail with fewer than two checkpoints is not there. It keeps to 70% of the log's height, packing its markers closer as the conversation grows rather than overflowing, and it is hidden below a 40rem container (where it would sit over the words) and on coarse pointers (where a 3 px tick cannot be hit).
- `labels`: `{ rail, position(index, count), jump(index, count, preview) }`.

### `ConversationEmpty`, `ConversationFooter`, `useConversation`

- `ConversationEmpty` is what a thread shows before its first message: a line (`title`, default "No messages yet", a paragraph, not a heading), a `description` and an optional `icon`, centred because it is the only thing in a large box.
- `ConversationFooter` is the composer's dock at the end of the log, clear of the device's safe area. It publishes its height as `--fui-conversation-footer-size`, which the jump key and the rail stand on, and the last lines of the log fade out above it (the column reserves that band, so no line is ever under the fade). `fade={false}` ends them at a hard edge.
- `useConversation()` gives `{ atEnd, locked, unread, hasNew, scrollToEnd, scrollToMessage }` to anything inside the conversation.

### What Radiant can delete

- `components/ai-elements/conversation.tsx` and the `use-stick-to-bottom` dependency (`StickToBottom`, `ConversationScrollToLatest`, and the re-assert timers).
- The `chat-layout` measure rules and `CHAT_COLUMN`/`COMPOSER_COLUMN` for the message column: `ConversationContent measure` does it, and `align="center"` keeps the centred column it has today.
- `.thin-scrollbar` in `app/globals.css`: the log carries its own thin bar.
- Its checkpoint rail, which reads `[data-role="user"], .is-user` from the DOM on every mutation and is desktop-only: the rail here registers its messages, packs, and hides by container width instead.

### What looks different

- The jump key is a control key (8 px corners), not a circle: the house's radii stop at 16 px and rings are for dots and avatars.
- The rail has no panel, blur or border: it is the ticks alone, so it never covers the words with a surface.
- Its markers are 24 px wide on a fine pointer and the rail is not offered on touch, where the list scrolls anyway.

## Accounts and usage

The family of `@fabrials/ai-ui` for accounts, usage, history, API keys and migration — sixteen exports written in September, with no story, no test and no way to translate them. 0.12 adds no piece and changes no default: it makes the sixteen fit a host's outline, language and skin. A product that passes nothing sees the same markup and the same words, byte for byte, which is what `tests/unit/accounts.test.tsx` checks against 28 baseline renders taken from 0.11.

### What each export gained

Every component now takes:

- **`labels`** — one object per component, of English by default, with every visible word, `aria-label`, summary and table header in it. A label that interpolates or counts is a function, so a language can put its parts in its own order; counts choose their form through `Intl.PluralRules` (`plural(count, { one, other }, locale)`). The defaults live together in `accounts-labels.ts` and are exported (`providerCardLabels`, `resetInventoryLabels`, …) so a host can spread one and translate it. Nested pieces take theirs one level down: `SynchronizedAccountsLabels.provider`, `ProviderCardLabels.reset`, `BalanceCardLabels.status`, `ResetInventoryLabels.status` and `.expiry`, `HostedMigrationLabels.reviewLabels`, and the `fieldsLabels` and `accountsLabels` props of `ApiKeyForm` and `LinkedAccountUsage`.
- **`className`** merged on the root and **`...props`** spread on it, so `id`, `data-*`, `aria-*` and `ref` reach the element.
- **`headingLevel`** (1–6) where the piece renders a heading, defaulting to what it rendered before (2, and 1 for `HostedMigration` and `SynchronizedConsumption`). Nested headings follow it (`SynchronizedAccounts`'s log, `HostedMigration`'s sections, `PrivateHistoryView`'s empty state). `SynchronizedAccounts` also takes `providerHeadingLevel`, because the provider's name inside an account stayed a level two on purpose: a host that wants it under its own title says so.
- **`locale`** (`Intl.LocalesArgument`) wherever a number, a date, a duration or a currency is written. When it is given, all of that piece's formatting uses it; when it is not, nothing changes.

Two components render several blocks side by side rather than one element: `ConsumptionView` and `SynchronizedConsumption`. Without a `className` or any other prop they still render those blocks exactly where the host put them (a grid or a stack of the host's own); give them one and the blocks sit inside a single element that carries it.

`ConsumptionView` also takes `viewLabels` from `SynchronizedConsumption`, and its three maps (`groupOptions`, `groupHeadings`, `states`) may be given in part.

### Server and browser can disagree

Some formatting reads the runtime locale — the language of the machine or the browser — and a server and a browser rarely agree on it. Those pieces write a date, a number or a time differently on the server and after hydration:

| Piece | What it writes with the runtime locale today |
| --- | --- |
| `SynchronizedAccounts` | the reading's date and time (`toLocaleString`), the token counts, the daily table |
| `ObservationStatus` | the hour of a reading (`toLocaleTimeString`) |
| `ResetInventory`, `ProviderCard` | the `title` of a reset date |
| `ConsumptionView` | every number and every currency amount |
| `ProviderCard` | the date a quota resets |

Others are fixed to English and do not disagree: `BalanceCard` (US currency, `en-US`), `PrivateHistoryView` and `HostedMigration` (`en`). Passing `locale` makes a piece write in the language the page is in, on both sides, and is what a host with a translated `labels` object wants: `labels` and `locale` go together.

A clock is the other half of the same problem: `useClock` reads `Date.now()`, which a server cannot. `ResetInventory` and `SynchronizedAccounts` now take `now` and `HostedMigration` takes `now` too, so a test, a story or a server-rendered page can fix the moment instead of reading the wall clock.

### Markup changes

The default render is unchanged. Three things a host will see once it uses the new props:

- A level other than the default now styles the same: the account family's rules address any heading (`:is(h1, h2, h3, h4, h5, h6)`) instead of `h1`, `h2` and `h3`, so a level-three title keeps the card's title size.
- **A failure says its reason, not "Error: " in front of it.** `ApiKeyForm`, `HostedMigration`, `PrivateHistoryView` and `SynchronizedConsumption` showed `String(error)`, which for a thrown `Error` reads "Error: the provider refused the key". They show the error's own message now. Only the failed state moves; nothing else does.
- Dead rules went (`.fb-empty`, `.fb-table-scroll`, `.fb-source-selection`), the rules of the family use logical properties only, and a `@media (forced-colors: active)` block gives the hovered migration row an outline and the reset warning the system's own ink. `fb-table-layout` is still written by `ConsumptionView` and styled by nobody: it does nothing.

### What a product can delete

A product that translates these screens no longer needs a wrapper component to rename "Quota reading" or to reformat a date: it passes `labels` and `locale`. A product that composes its own provider card from `fb-` classes loses nothing: the classes and their names are as they were.

What stays the product's: the data (`MetricLine.label` is the provider's own word, not the library's), the money's currency (USD here), and which reading is authoritative.

## Uploads, a pill that picks, and reading an answer aloud

Five pieces for the composer of a chat product: the files it holds and their way up, the panel that says files can be dropped, a pill that picks a value, a pill that opens a menu, and a key that reads an answer aloud.

### `useAttachments` (`@fabrials/ai-ui`)

The library draws attachments and now also keeps their state, but it never uploads: the host passes the function, and no URL or `fetch` is written into the package.

```tsx
const files = useAttachments({
  upload: (file, { signal, onProgress }) => api.upload(file, { signal, onProgress }),
  accept: "image/*,.pdf",
  maxSize: 20_000_000,
  maxFiles: 8,
});
```

| Option | What it does |
| --- | --- |
| `upload(file, { signal, onProgress })` | The host's uploader, returning whatever it wants as a result (an id, a URL, a part). `onProgress` takes 0 to 1. Aborting `signal` gives the file up. |
| `accept`, `maxSize`, `maxFiles` | The same rules `sortFiles` applies. A refused file is reported, never silently dropped. |
| `concurrency` | Uploads in flight at once. Three by default. |
| `onReject({ file, reason })` | A file that was not added, with `reason` `"type"`, `"size"` or `"count"`. Every one is reported; the accepted files still go up. |
| `onError(error, { id, name })` | An upload that failed, for a toast. The item says so too. |
| `pageDrop` | Take a file dropped anywhere on the page. Otherwise spread `dropProps` on the area that takes one. |
| `labels` | `failed` (why an upload failed when it threw nothing readable) and `uploadFailed(names)`, the one sentence `waitForUploads` rejects with. |
| `name` | The name of the hidden file input, for a form. |

| Return | What it is |
| --- | --- |
| `entries` | Every file with what happened to it: `id`, `file`, `name`, `mediaType`, `size`, `url` (an object URL for a picture or a video), `status` (`pending`, `uploading`, `done`, `failed`), `progress`, `error`, `result`. |
| `items` | The same files in the shape `<Attachments items>` takes. |
| `add(files)`, `remove(id)`, `removeLast()`, `retry(id)`, `clear()` | `add` returns `{ ids, rejected }`. `remove` aborts the upload, revokes the preview and ignores the result that comes back late. `removeLast` is the composer's Backspace. `retry` uploads a failed file again. |
| `waitForUploads()` | Waits for the files there are at that moment and resolves `{ ids, results, items }` for exactly that snapshot; a file added while it waits goes with the next message. It rejects with one `AttachmentsError` naming every file that failed (`error.failed` is `[{ id, name, error }]`). |
| `uploading` | Some file is queued or on its way up. |
| `inputProps`, `openPicker()` | For a hidden `<input type="file">`: it empties its value after a pick, so the same file can be picked twice. |
| `dropProps`, `paste` | `onDragOver`/`onDrop` for the area that takes a drop, and `onPaste` for a field that takes a pasted screenshot. Both ignore a dragged link, a selection of text and a clipboard with no file. |

The pure half is in `attachments-logic.ts` (no directive, so a test or a worker can call it): `reduceAttachments` (the state of each file, which ignores anything about a file that is gone), `createLimiter(limit)` (at most *n* at once, in order, a finishing task handing its slot straight on), `toAttachmentItems`, `isUploading`, `hasPreview`, `clampProgress`, `uploadErrorText`, `AttachmentsError`, `failureMessage`, `DEFAULT_ATTACHMENT_LABELS`.

Something to know: `AttachmentItem` speaks three states (`ready`, `uploading`, `error`), while a file has four — a queued one is its own state. `items` is the view, so a queued file looks busy there; `entries` is what a host reads to know the difference.

A product can delete its own `useComposerFiles` (Radiant: `components/chat/composer-attachments.tsx`), its `acceptComposerFiles`, its `createLimiter` and its whole-page drop listeners. The uploader and its route stay the product's.

### `DropOverlay` (`@fabrials/ui`)

The panel over the piece of screen that takes a drop: it never covers the window, it takes no pointer events, it is `aria-hidden` while it is not there and a polite region says when it appeared (a drag cannot be heard).

| Prop | What it does |
| --- | --- |
| `children` | What it covers. |
| `label`, `description` | The words in the middle, and the line under them. |
| `refusedLabel` | What it says when the dragged files are not accepted ("That kind of file is not accepted"). |
| `scope` | `"self"` watches this area; `"page"` watches the whole page, for a chat that takes a file anywhere. |
| `accept` | Used to say "not accepted" while a drag is over. A drag shows the kinds of its files and never their names, so a list of extensions cannot be judged and lets the drag through. |
| `active`, `refused` | Shown or hidden by the host instead of by a drag: a story, or a host that watches its own drags. |
| `disabled`, `onDrop(files)`, `className`, `id` | |

`carriesFiles(types)` and `draggedFilesRefused(kinds, accept)` are exported for a host that drives `active`/`refused` itself. The drag is counted by depth, not tested with `relatedTarget`, so crossing a child does not flicker.

Give the overlay's `onDrop` **or** the hook's `pageDrop`, not both, or a drop is added twice.

A product can delete its own chat drop zone (Radiant: `components/chat/chat-drop-zone.tsx`).

### `ComposerSelect` and `ComposerMenu` (`@fabrials/ai-ui`)

A composer has pills that toggle (`ComposerToggle`) and act (`ComposerButton`); now one picks and one opens a menu, in the same pill.

| `ComposerSelect` | |
| --- | --- |
| `value`, `onValueChange` | |
| `options` | `{ value, label, hint?, icon? }`: two lines in the list, with the mark and a tick on the one in use. |
| `label` | What is being picked. The pill's accessible name is `"Reasoning effort: High"`; `labels.name(label, value)` writes it otherwise. |
| `icon`, `formatValue(option)`, `defaultValue`, `disabled`, `defaultOpen`, `name`, `id`, `className` | `defaultValue` (the first option when not given) is the value that is not worth a tint: away from it the pill carries the pressed pill's tint. |

| `ComposerMenu` | |
| --- | --- |
| `label` | The pill's name, and its title while it is the mark alone. |
| `icon`, `text` | The mark, and the words beside it. Without `text` it is the icon alone, as a "More" key is. |
| `menuLabel` | The menu's own name, when the pill's is not enough. |
| `align`, `side`, `disabled`, `children` | The children are menu items: `DropdownMenuItem`, `DropdownMenuCheckboxItem`, `DropdownMenuRadioItem`, `DropdownMenuLabel` inside a `DropdownMenuGroup`, separators. |

Both are built on the library's `Select` and `DropdownMenu`, so typeahead, the arrows, Home and End, Enter and Escape come with them. In a narrow composer (a `.fui-composer` under 22rem — a container query, not the window) the select keeps its mark and drops its words; its name still says the value.

`.fui-composer` is now a container (`container: fui-composer / inline-size`), which changes nothing on screen.

The open list of a select is a story of its own (`Tests/Composer 0.12` › `Open`): a select is modal, so a page that opens one and keeps it open is inert around it.

A product can delete the copied pill class (Radiant: the same string in `composer-controls.tsx` and `composer-immersion.tsx`) and its `Select`/`DropdownMenu` restyling.

### `ReadAloudAction` (`@fabrials/ai-ui`)

A message action, the same look as copy, that reads an answer aloud: `text` (markdown, read as plain words through `speakableText`), `lang`, `loadClip` (the host's loader, from `useSpeech`), `labels` (`read`, `stop`), `id`, `speech` (a reader the host already has, or a fixed one for a bench), `className`.

It is `aria-pressed` while it reads, shows a spinner while the first piece loads, and the same key stops it. One reader sounds at a time on the page and it stops when it leaves the screen, because that is `useSpeech`'s job. In a browser that cannot speak and with no loader it draws nothing — there is never a key that does nothing.

A product can delete its own read-aloud action (Radiant: `features/core/read-aloud.tsx`); the loader's route stays the product's.

## The shell: pictures in the dither, the account row and the bar of a sidebar app, a title renamed in place, and a keyboard

Five additions for an app shell, all `@fabrials/ui` and all optional. Nothing that exists changes behaviour: every existing dither reference stays pixel-identical, and `Sidebar` gained two parts and one prop.

### `DitherCanvas`: a scene the host paints, or a picture

The canvas took a per-pixel brightness `field`. It now also takes a scene drawn with Canvas 2D, or a picture. Both are read back and dithered onto the same ramp, with the same 8×8 Bayer order and the same `order`, so a scene sits on the brand material as the storm does.

| Prop | What it does |
| --- | --- |
| `paint` | `(context, size, theme) => void`: gradients and shapes at the canvas's working resolution (one pixel per dot). The canvas starts filled with the surface behind it, so anything left unpainted is the background. Keep the function stable (memoise it, or use `paintKey`) or every render repaints |
| `source` | A picture, or its address. A string is loaded with `crossOrigin="anonymous"`; an `<img>` still loading is waited for; a `CanvasImageSource` already decoded is drawn at once |
| `fit` | `cover` (default) or `contain` |
| `tone` | `{ min, max, contrast, desaturate }`: the luminance range the picture is mapped into, so the text over it keeps its contrast. `min`/`max` are luminances 0–255 (the picture's own range by default), `contrast` stretches around the middle (1 by default) |
| `mode` | `ramp` (default): the picture in mono through the ramp. `channels`: each colour channel dithered to `levels` steps, kept in a range a background can be read on — `tone.min`/`max` are that range, `6…80` in the dark theme and `182…250` in the light one unless given |
| `levels` | Steps per channel in `channels` mode (5 by default) |
| `after` | `(context, size, theme) => void`, drawn after the dithering: crisp single-pixel details a dot would swallow (stars) |
| `onError` | `(reason: "load" \| "tainted") => void`, once per picture. A picture that fails to load, or comes from another origin without CORS, leaves the plain surface and never throws |

`field` is still the first way in and is unchanged; `paint` is used when there is no `source`, and `source` wins when both are given. `reveal` still animates a field (not a scene or a picture). A canvas with a `source` stays invisible until the picture has arrived, so no half-painted box is ever shown.

The pure half is in `@fabrials/ui/dither` (no directive, as `luma` and `ditherToRamp` already were): `toneLuma(value, tone)`, `desaturate(rgb, amount)`, `coverFit(source, target)`, `containFit(source, target)`, `ditherLumaToRamp(data, width, ramp)`, and `luma` takes three channels as well as a colour.

Radiant can delete `components/app/dither-backdrop.tsx`, `lib/backdrop.ts` (the palettes stay Radiant's: pass them as `paint` and `ramp`) and the image half of `lib/chat-background.ts`; its night sky becomes a `paint` function. Two differences from its version: the surface behind the canvas is `--fui-dither-bg`, not a palette argument, and a picture in `channels` mode is squeezed into the theme's range by default (pass `tone={{ min: 0, max: 255 }}` for the whole one).

### `SidebarAccount`

The row at the foot of a sidebar: the picture (or its initials), the name and a second line, and a menu above it.

| Prop | What it does |
| --- | --- |
| `name`, `email`, `image` | Who it is. The initials of the name, or of the email when there is no name, stand in for the picture |
| `active` | The row is the page the person is on: the plate of a current navigation row |
| `theme`, `onThemeChange` | Given, the menu ends with a labelled group of three: System, Light, Dark (`ThemePreference`, ready for a `ThemeProvider`: `theme={theme} onThemeChange={setTheme}`) |
| `children` | The menu's items: your links, your "Sign out" as `DropdownMenuItem`s |
| `labels` | `trigger(name)` ("Account menu for Ada"), `account` ("Account"), `theme`, `system`, `light`, `dark` |
| `menuSide`, `menuAlign`, `className`, `menuClassName` | Above the row and aligned to its start by default |

The row is 44 px, 48 px on a phone, and its name keeps its own direction (`dir="auto"`). Folded to icons, only the picture shows and a tooltip says whose it is. It needs a `SidebarProvider` above it (it reads the sidebar's state for the tooltip). `useSidebarSide()` gives the edge the sidebar is on, for a part of your own that opens away from it.

### `SidebarInsetHeader`, `SidebarInsetHeaderActions`, `SidebarInsetContent`, and `SidebarInset frame`

- `SidebarInsetHeader` is the 56 px bar at the top of the inset: a 44 px `SidebarTrigger`, a `title` that truncates (an `h1`–`h4` only when `headingLevel` says so, a plain element otherwise), the actions slot, and `end` for one primary action. A hairline and the surface: no blur, and the notch's inset at the top. `visibility` is `"mobile"` by default, so the bar is drawn only where the sidebar is the phone sheet; `"always"` draws a section title with actions of its own at every width.
- `SidebarInsetHeaderActions` puts its children in that slot from anywhere inside the inset (a page deep in the app adds its key to the phone's bar without knowing where the bar is).
- `SidebarInset frame` makes the inset a column of the window's height (`100dvh`) whose `SidebarInsetContent` scrolls, so a header stays while the page moves and a composer or an `ActionBar` can dock at the foot. `skipLabel` (and `contentId`, default `main-content`) adds the skip link `WorkspaceShell` has, first in the inset; the content part takes the id and is focusable for it.
- `SidebarInsetContent` is a tab stop only while it has more than it shows (as `ScrollArea` is), so the keys can scroll it and Tab does not stop on a box that fits.

Radiant can delete `components/app/mobile-header.tsx` (its `MobileHeaderTitle` becomes `title`, its button an `end`), the `data-slot="mobile-header-actions"` element and the hand-written portal, and the `flex h-svh min-h-0 flex-col overflow-hidden` + `overflow-y-auto` pair of `app/(app)/layout.tsx`. Its title is derived from the route in the product, which stays the product's.

### `EditableText`

A title renamed where it is read.

| Prop | What it does |
| --- | --- |
| `value`, `onCommit(next)` | The text, and what to do with the trimmed replacement. A promise keeps it pending until it settles; a rejection puts the old text back |
| `onError(error)` | What a refused commit says |
| `pending` | For a host that owns the request: its commit has not settled |
| `editing`, `defaultEditing`, `onEditingChange` | Controlled or not |
| `startOn` | `"none"` (a trigger or the host's menu item only, the default), `"doubleClick"` or `"click"` on the text itself; a focused text also opens with Enter or F2 |
| `showTrigger`, `triggerLabel` | A pencil beside the text ("Rename") |
| `label`, `placeholder`, `maxLength`, `selectOnEdit`, `dir` | The field. `dir` is `auto`, so a title in any script reads the right way round, and the text is selected as the field takes focus |
| `pendingLabel`, `truncate`, `className`, `fieldClassName`, `style` | "Saving"; the tooltip on a text that is cut short |

Enter commits, Escape cancels (and stops there, so a sheet around it stays open), leaving the field commits, and a text that came out empty or unchanged calls nobody. The blur those first two cause does not commit a second time, and an Enter in an IME composition is the IME's. When editing ends, the focus goes back to what started it — the pencil, or the text itself, made focusable for that moment. In a row that is a link, the field's clicks and keys stay the field's: the row does not navigate while it is being renamed.

Radiant can delete the rename half of `components/app/app-sidebar.tsx` (its draft, `ignoreNextBlur`, the two effects, the `Input`, the "Rename" item handler) and the `TruncatedText` wrapper around a chat title.

One difference from Radiant's version: it replaced the whole row with a field; here the field sits inside the row, so the row's own size and icon stay put.

### `OnScreenKeyboard`, `useOnScreenKeyboard`, `insertAtCaret`, `backspaceAtCaret`, `neighbourKey`

A keyboard for a script the device's own keyboard lacks. The layout is the host's data: the package ships no language.

- `rows` is an array of rows of keys: `{ value, label?, name?, width?, kind?, lang?, id? }`, where `kind` is `char` (default), `space`, `enter` (both of which write their text), or `backspace` (a whole cluster, repeated while held), or `shift`/`custom` (the host's own: they call `onKey` and write nothing).
- `target` is a ref to the field the keys type into; `onKey(key, { row, column })` hears every press first. With a target, a key writes at the caret, replaces the selection and dispatches a real `input` event, so a React-controlled field updates; with no target the host does it all in `onKey`.
- It is one toolbar with one tab stop: the arrows move by where the keys are on screen (`neighbourKey`), Home and End stay in the row, and Enter or Space types the key in focus. A press with a finger or the pointer never takes the focus from the field, so the caret stays where the person left it.
- Keys are at least 44 px under a finger and never smaller than 32 px; the gaps give way first on a narrow keyboard.
- `useOnScreenKeyboard({ storageKey, defaultOpen })` returns `{ open, setOpen, toggle, inputProps }`: open by itself where the pointer is a finger, held open or shut by the person from then on, remembered in `localStorage` (read outside render, with an in-memory fallback). `inputProps` goes on the field and hides the device's own keyboard while this one is up.

The pure half: `caret.ts` (`insertAtCaret`, `backspaceAtCaret`, and `backspaceAtCaretWithoutSegmenter` for a runtime without `Intl.Segmenter`) and `key-nav.ts` (`neighbourKey`, with `KeyBox`).

Radiant can delete `components/lang/keyboard/arabic-keyboard.tsx`, `keyboard/caret.ts` and the dock half of `exercise/text-field.tsx` (`useArabicDock`, the remembered key, `inputMode="none"`, the toggle); its layout data (`keyboard/layout.ts`, `keys.ts`) becomes the rows it passes, and its Arabic messages become `name`s.

Differences from Radiant's copy: the keyboard no longer assumes Arabic or right to left (`dir` and `label` are props), the layers and the vowel-mark row are the host's data rather than the component's state, and `insertAtCaret`/`backspaceAtCaret` are unchanged in behaviour but take `(value, selectionStart, selectionEnd, text)` as plain values.

### Looks or behaves differently

- Nothing, for a page that uses none of this. The styles are one new block at the end of `styles.css`.
- `DitherCanvas` now paints a plain surface when it has no `field`, no `paint` and no `source` (before, an empty canvas). With a `source`, the canvas stays at 0 opacity until the picture arrives.
- `SidebarInset` renders a context provider around its children (no extra element), and `SidebarInsetContent` is a new part: neither changes the markup of a sidebar that does not use them.

## Controls: a notice that asks again, a count, a field, a slider and a legend

Everything here is additive: a component that is given none of the new props renders exactly the markup and the pixels it
rendered at 0.11. Two exceptions are named at the end.

### `Alert` (`@fabrials/ui`)

| Prop | What it does |
| --- | --- |
| `onRetry` | `() => void \| Promise<void>`. Draws "Try again" in the alert's action place. A promise keeps the action busy until it settles, and shows it by itself. |
| `retrying` | The busy state, when the host owns it. |
| `revealOnMount` | The alert appeared after the first paint (an answer came back, a step failed): it scrolls itself into view, keeping clear of a sticky header above it and of an `ActionBar` below. |
| `tone` | `neutral`, `info`, `success`, `warning`, `danger`: the same five looks as `variant`, under the name the rest of 0.12 uses for a status. **`tone` wins when both are given**; nothing is deprecated. |
| `labels` | `{ retry, retrying }`, English defaults; a `LabelsProvider` sets them for every alert (scope `alert`). |

- While it retries, the action is `aria-disabled` and keeps its focus: the keyboard stays where the person left it, the same
  action is not run twice, and the alert's own live region reads the new words when they arrive. `Alert` stays renderable
  from a Server Component; with `onRetry` it comes from a client module, as any handler does.
- **Do not pass `onRetry` when asking again cannot help** (a daily allowance already spent). Say what still works and what
  returns when, and leave the action out.

Radiant can replace the ten hand-made banners that carry a retry (`lang/session/notices.tsx`, `lang/exam/exam-problem.tsx`,
`lang/perception/problem-note.tsx`, `lang/write/correction-view.tsx`).

### `Input`, `Textarea`: `count`

```tsx
<Textarea count={{ max: 280 }} />                       {/* characters, soft */}
<Input count={{ max: 12, soft: false }} />              {/* stops at 12 */}
<Textarea count={{ max: 20, unit: "words" }} />
<Textarea count={{ unit: "graphemes" }} />
<Textarea count={true} />                               {/* a bare counter */}
```

- The counter sits under the field in the label voice, with the reader's digits, and the field names it with
  `aria-describedby` (merged with any description it already had).
- **A soft limit never truncates.** Past it the counter turns to the danger ink and says how far ("12 over"), and a polite
  region that is always in the page reads the crossing once — nine tenths, the last one, past it — and once again when the
  text comes back under it. Not on every keystroke.
- `soft: false` sets `maxlength`, which stops characters. Words and graphemes cannot be stopped by an input: the counter
  counts them and says so, and the limit is the host's to enforce.
- `characters` is UTF-16 units, like `maxlength` and like a text engine's own limit. `words` and `graphemes` go through
  `Intl.Segmenter` (a Chinese sentence is many words, an emoji joined of four code points is one grapheme), with a plain
  whitespace count where the browser has no segmenter.
- `countText(value, unit, locale)`, `countLevel`, `countMilestone`, `countLimit` and `CountLabels` are exported, so a host
  can count the same way in its own box or check the limit before sending.

Radiant can delete `lib/lang/write/limits.ts` and the counter block of `write/text-editor.tsx`.

### `Field`, and the field parts

- `Field` (the render prop) gains `required` (an asterisk, plus the word "required" for a screen reader), `optional` (the
  word "optional" in muted ink), `className` on its root and `labels` (scope `field`). `required` wins when both are given.
- `FieldContent`, `FieldLabel`, `FieldDescription`, `FieldError`, `FieldTitle` and `FieldSeparator` (a new module,
  `field-parts.tsx`) draw the same plate, label, description and error one piece at a time, for a field laid out around
  other things. `Field` accepts them instead of a function child; `useField()` gives `{ id, descriptionId, errorId,
  describedBy, invalid }`, so the control is described by what is really there and marked invalid when an error is.
- `FieldTitle` is a name that is not a form label; `FieldSeparator` is a rule that can hold a word.
- The `field` shim of shadcn now generates, with all ten of its names.

### `Slider`, `SliderGroup`

| Prop | What it does |
| --- | --- |
| `label` | The name in front of the track. With it the slider is a row of label · track · value, and the name is the thumb's. |
| `unit` | Said and written after the value ("40 rows"), including in `aria-valuetext`. |
| `format` | `(value) => string`, or `Intl.NumberFormat` options (which `format` also took before this release). |
| `onValueCommitted` | Base UI's: once when a drag ends or a key is released, not once per pixel. |
| `locale` | The digits of the value and of the reading. |

- Without `format`, the value is written with the decimals its `step` needs (0.25 → two), and the drawn value is
  `aria-hidden` because the thumb already speaks it.
- `SliderGroup` puts several sliders on one grid: names and values line up column by column (a subgrid row each, with each
  row's own grid where subgrid is missing). Under 28rem of the group's own width each name goes above its track;
  `columns="auto"` fills the room in columns of at least 14rem.

Radiant can replace the hand-made `input[type=range]` rows of `features/plot/view.tsx` and
`features/simulation/view.tsx`.

### `ChartLegend`, `LegendItem`, `Swatch`, `ColorRamp`

- `ChartLegend` is the row under a chart; `LegendItem` is one key: `label`, `color`, `pattern` (`solid`, `dashed`,
  `dither`), `hidden`, and — when the host wants it — `onToggle` (a button with `aria-pressed`, as the chart's own legend
  is) and `onOnly`. A host can draw the same legend beside its own visual, static or working.
- `Swatch` paints a key: a solid square, a dashed rule, or the house's 2 px ordered dither in SVG cells (a paint the chart
  defines, `url(#…)`, is drawn as it is, so a legend beside a chart matches its series exactly).
- `ColorRamp` is a continuous legend: `min`, `max`, `stops` (token colours), `steps` (8 to 12 cells, 10 by default), `marks`
  (ticks with a label), `label`, `format` and `labels`. **The bar is painted in cells, sampled across the stops, never as a
  smooth gradient:** a ramp that encodes a value is data, and the house paints data in steps. A screen reader hears "from 0
  to 100" instead of the bar.
- `SeriesChart` itself draws exactly what it drew at 0.11; its legend is now those parts.

Radiant can replace the legends of `features/plot/view.tsx`, `features/map/view.tsx` and
`features/periodic-table/view.tsx`, whose `.map-legend-bar` is a CSS gradient.

### `Toggle`, and the class-name helpers

- `Toggle` is one key that stays on, on its own: `pressed`/`defaultPressed`/`onPressedChange`, `size` (`sm` 26 px,
  `default` 34 px, `lg` 44 px on every pointer), `variant` (`default`, `outline`, or `plain` for a key whose look is the
  host's `className`). It is the same Base UI toggle a `ToggleGroupItem` is.
- `toggleVariants`, `badgeVariants` and `tabsListVariants` (`variants.ts`, no directive, so a Server Component can call them)
  return the classes of a `Toggle`, a `Badge` and a `TabsList` for the props given, for a link, a cell or a tab a host draws
  itself. A `Badge` keeps its own single class and its `data-` attributes, which stay the source of its look; the class hooks
  are guarded so they never reach it.
- `badge`, `tabs`, `toggle` and `field` now generate as shadcn shims (`apps/site/components/ui/`).

`ComposerToggle` is built on `Toggle` with `variant="plain"`, so there is one implementation of a pressed key. Its classes
(`fui-composer-pill`), `aria-pressed` and `data-state` are what they were; Base UI's own `data-pressed` is now on it too, for
anyone styling by state.

### `GenerationFrame` (`@fabrials/ai-ui`)

| Prop | What it does |
| --- | --- |
| `actions` | `["download", "copy"]` for the built-in keys, or any node. Shown over the finished picture when the pointer is on it or the keyboard is in it, and always where there is no hover. |
| `downloadName` | The name the built-in download saves under (`<a download>`). |
| `kind="video"` | A `<video controls playsInline>` with `src` and `poster`, in the same queued, generating and failed states; the words say "Making the video" and "Video ready". |
| `onOpen` | Makes the finished picture a button named "Open", to open it in a viewer. |
| `prompt`, `showPrompt` | What was asked for, shown under the working field while it is made, cut to two lines and in its own direction (`dir="auto"`). |

- The copy key appears only where the browser has an image clipboard, and the result is announced; the keys are 44 px on a
  coarse pointer and kept out of a print.

Radiant can replace `components/chat/generated-media.tsx`.

### Two changes that are visible

- **A disabled slider** no longer fades its name and its value to 50 %: the track is dimmed and the words stay in the muted
  ink. Half of the muted ink over a card is under the contrast a value has to keep, and a value that is off is still read.
  Only disabled sliders are affected.
- **A `TabsList`** now carries `fui-tabs-list-segmented` beside `data-variant="segmented"`. The attributes still select the
  look; a host rule that keys on the class alone now matches.

## NumberTicker without a dependency

`NumberTicker` was the only piece of `@fabrials/ui` that used `motion`, so every product that installed the package installed `motion`, `framer-motion`, `motion-dom` and `motion-utils` (about 17 MB of `node_modules`) for one counter. The roll is now a CSS transition on the column of digits, the way `Readout` settles its characters: the package carries no animation library at all.

### The API is the same

| Prop | Same as before |
| --- | --- |
| `value`, `pad`, `duration`, `stagger`, `startOnView`, `prefix`, `suffix`, `blur`, `className`, `digitClassName`, `locale`, `format` | Unchanged in name, type, default and meaning. |
| `...props`, `style` | New, and additive: `id`, `data-*`, `aria-*` and `ref` now reach the root span. `style` is merged after the ticker's own custom property, so a host can also override the length. |

What a person sees is the same: a column of 0-9 per digit that turns into place, the columns 40 ms apart, a length of 0.9 s, once when six tenths of it have come into view (or at once with `startOnView={false}`), and again whenever `value` changes. The number read by assistive technology is the final one from the first frame; the turning digits are `aria-hidden`.

### What changed inside

- The column's position is an inline `transform: translateY()` and the sheet transitions it inside `@media (prefers-reduced-motion: no-preference)` with `--fui-ticker-duration` (the `duration` prop, from the root), `--fui-ease-out` — the same curve `motion` was given — and `--fui-ticker-delay` (the stagger, per digit). A change of value retargets the transition, so an interrupted roll carries on from where the digits are.
- `useInView` became a small `IntersectionObserver` at the same threshold, and the first roll is started by one `requestAnimationFrame`: the columns are painted at rest and then asked to move, exactly as the `motion` version did, so the first paint is the same number of columns at rest.
- Reduced motion is read with `useSyncExternalStore` and a server snapshot of `false`, so the markup the server sends always matches the first client paint; under reduced motion the columns are not built at all (as before) and the value is there at once.
- `blur` fades each column from `blur(10px)` with `element.animate()` (the Web Animations API, part of the browser) for the same 320 ms, since a CSS transition cannot restart itself on a change. Nothing is left running when it ends.

### What is no longer installed

`motion` is gone from `packages/ui/package.json` and from the package's entry in `bun.lock`, and `tests/unit/boundaries.test.ts` no longer allows the import. The repository's lockfile still lists `motion`, because the docs site gets it from `fumadocs-ui`; the package does not.

**A product that imported `motion` itself and relied on it being there through `@fabrials/ui` must add it to its own dependencies.** `@fabrials/ui` never documented that dependency, but npm hoisting made it reachable for some hosts.

### What a product can delete

Nothing in its own code: the props are the same. A product that added `motion` to its `package.json` only to keep the ticker's peer resolve can drop it.

### What looks different

Nothing at rest, and the roll is the same curve and the same length. Three things are visible in the markup if a product styles it:

- The digit span carries `--fui-ticker-delay` and the root carries `--fui-ticker-duration`; `motion`'s generated inline styles are gone (`transform: none` at rest, as before).
- With `blur`, the column no longer keeps an inline `filter: blur(0px)` after the fade; the animation ends and the property goes back to what the host sets.
- The first paint of a number is still the value at rest (all columns at zero), which is what the server has always sent; nothing about that changed.

## Callouts, an edited message and a stamp in the reader's zone

Three pieces for the small things an answer is made of, and one new subpath. All additive: nothing existing changes and nothing is renamed.

### `MarkdownCallout` and `.fui-callout` (`@fabrials/ai-ui`)

The note, tip and warning of an answer — GitHub's `> [!NOTE]` and the kinds a lesson adds.

```tsx
<MarkdownCallout kind="warning" title="Check the deployment first">
  <p>Three steps, in this order:</p>
  <ol>…</ol>
</MarkdownCallout>
```

| Prop | What it does |
| --- | --- |
| `kind` | `note`, `tip`, `important`, `warning`, `caution`, `example`, `definition`, `summary` or `question`. An alias from another document (`info`, `hint`, `danger`, `error`, `key`, `key-idea`, `remember`, `mistake`, `common-mistake`, `pitfall`, `def`) resolves to its kind at runtime. |
| `title` | In place of the kind's own word. Its text names the callout for a screen reader (`aria-labelledby` on the title), so a custom title needs nothing else. |
| `icon` | A mark of your own, or `false` for none. The default is the kind's own glyph (Lucide's, ISC, copied as `chat-icons` does, so the package keeps no icon dependency). |
| `labels` | The nine titles, over the provider's (`markdownCallout`) and under `title`. Defaults: Note, Tip, Important, Warning, Caution, Example, Definition, Summary, Question. |

Every kind settles on one of the house tones, and the plate is a tint of it — never a coloured side bar:

| Kind | Tone |
| --- | --- |
| `note`, `example`, `question` | neutral (the muted ink) |
| `tip`, `summary` | success (verdigris) |
| `important`, `definition` | info (Stormlight) |
| `warning` | warning (brass) |
| `caution` | danger (garnet) |

- A tinted plate: `--fui-tint-strength` into the surface, an edge at `--fui-tint-edge`, the title and the icon in the tone's ink, 12 px corners. The body keeps the answer's own typography (`.fui-markdown`), so a nested list, a table or a code block inside looks like the rest of the answer; only the rhythm and the room are the callout's.
- `role="note"`, named by the title; the icon is decorative. The title row carries `dir="auto"`, so an Arabic title mirrors with its mark; the body's own paragraphs carry theirs (see `textDirection`).
- Forced colors: the tint becomes `Canvas`, the edge and the words `CanvasText`, and the mark keeps its ink. Printed: the tint goes, the edge and the words stay, and a callout never splits across pages.
- **A host's own renderer writes the markup**, with no React at all — the classes are the whole contract:

```html
<aside class="fui-callout" data-kind="warning" role="note" aria-label="Warning">
  <p class="fui-callout-title" dir="auto">
    <span aria-hidden="true" class="fui-callout-icon"><svg …></svg></span>
    Warning
  </p>
  <div class="fui-callout-body"><p>…</p></div>
</aside>
```

The same classes with `data-kind` set are all the styling needs; `aria-label` is how that markup names itself when the title is not on the page as an id.

### `@fabrials/ai-ui/markdown`

A subpath of pure functions a host wires into its own markdown pipeline (a remark plugin, a string pass before `dangerouslySetInnerHTML`, a build step). It imports nothing at all: not `remark`, not `mdast`, not even `@fabrials/ui`, so a Node renderer can use it without React.

| Export | What it does |
| --- | --- |
| `calloutOf(text)` | Reads the first line of a blockquote: `"[!TIP]"`, `"[!TIP] A title"`, `"> [!warning] Body"`, any case. Returns `{ kind, title, rest }` (the title trimmed or `null`, the remaining lines as they were) or `null`, which is what keeps a plain quote a quote. |
| `calloutKind(word)` | The kind a word names, or `null`. |
| `CALLOUT_KINDS` | The nine kinds, in the order the catalogue lists them. |
| `textDirection(text)` | `"rtl"`, `"ltr"` or `null` from the first strong letter, as `dir="auto"` decides it — with code spans, fences, mathematics, tags and URLs left out. This is what keeps "an Arabic paragraph that opens with a URL or a number" laid out right to left. |
| `normalizeMath(markdown)` | Rewrites `\(…\)` to `$…$`, and `\[…\]` or a bare `\begin{align}` to `$$…$$`, never inside code, never for a currency (`"$5 and $10"`) and never for an escaped citation (`\[3\]`). Running it twice changes nothing more. |

- `textDirection` keeps its own twenty lines of the first-strong-letter rule rather than importing `scriptDirection` from `@fabrials/ui` (`scriptDirection` counts the letters of inline code, which is exactly what a paragraph's direction must not do). A unit test holds the two together on prose.
- `speakableText` is in `@fabrials/ui`, not here.
- Radiant can wire `remarkCallouts` and `remarkBidi` to these two functions and drop its own `segments.ts`, `callouts.ts`, `bidi.ts` and `normalize-math.ts`.

### `EditableMessage` and `EditMessageAction` (`@fabrials/ai-ui`)

A sent message edited where it stands, in the bubble it replaces.

| Prop | What it does |
| --- | --- |
| `value` | The message as it was sent. The draft starts from it; sending it back unchanged is not a change. |
| `onSubmit(next)` | Sends the trimmed draft, as a value or a promise. While the promise waits the key is busy and the field read only; a rejection shows the reason in `role="alert"`, keeps the draft and does not close the editor. |
| `onCancel` | Escape, the Cancel key, or whatever the host does. |
| `label` | The field's name. Default "Edit message". |
| `hint` | A line under the field, in the host's words. There is no default sentence: what sending costs (that it replaces the replies after it) is the host's to say. |
| `submitLabel`, `cancelLabel` | Default "Save and send" and "Cancel". |
| `pending` | The host is sending: the key is busy, the field read only, the form `aria-busy`. |
| `error` | A failure the host already knows, shown where a refused send is. |
| `maxLength`, `autoFocus`, `returnFocusRef` | The field's limit; whether it takes focus when it appears (on by default: with the caret at the end of the message); and where focus goes when the editor closes after a cancel or a send. A host that keeps several editors open passes `autoFocus={false}`. |
| `labels` | The four reasons: `{ empty, unchanged, pending, failed }`. |

- Enter is a new line and Ctrl or ⌘ with Enter sends, and a key pressed while an input method is composing never sends. An empty draft, or the message as it was, cannot be sent — the key keeps focus with `aria-disabled` and the hint says why in words ("Type a message to send.", "Change the message to send it."), pointed at by `aria-describedby`, rather than a greyed key with no reason.
- Escape stops propagating, so a sheet or a dialog around it does not also close.
- `EditMessageAction` is the key of the action row: a `MessageAction` with a pencil and the name "Edit" (44 px on a coarse pointer, like every message action).

### `MessageTimestamp date` (`@fabrials/ai-ui`)

`MessageTimestamp` takes the instant of a message and formats it in the reader's zone and language, through `LocalTime`.

| Prop | What it does |
| --- | --- |
| `date` | `Date | string | number`. Rendered in the reader's zone and locale; until the page has hydrated, a hidden stand-in of the same shape, so nothing moves and the server's zone is never shown. It wins over `dateTime` and `label`. |
| `locale`, `timeZone` | The reader's language (the provider's, else the browser's), and a zone the host fixes for a screenshot, a transcript or an export. A fixed zone is rendered at once, hidden by nothing. |
| `format` | `"message"` (default: "09:31" today, "Sep 26, 09:31" another day), `"time"` or `"dateTime"`. The tooltip is always the whole date and time. |

`dateTime`, `label` and `detail` keep working exactly as before, byte for byte, for a host that formats its own label; `date` is only what a host adds when it has the instant.

### What Radiant can delete

- `components/ai-elements/callout.tsx` and the `.md-callout` rules in `app/features.css`.
- `lib/markdown/{callouts,bidi,normalize-math,segments}.ts` and the three remark plugins that use them: `calloutKind`, `calloutOf`, `textDirection` and `normalizeMath` replace them.
- `components/chat/message-timestamp.tsx` (the wrapper around `useHydrated` and `formatTime`) and its `invisible` class: `MessageTimestamp date` does it.
- The editing branch of `components/chat/chat-thread.tsx` (`ThreadMessage` while `editing`), including its own `form`, key handler and hint line.

### What looks different

- A callout has no coloured side bar and no large radius: it is a plate with an edge in its tone, 12 px corners, and the tone's ink on the title and the icon.
- The teaching kinds stay quiet: a note, an example and a question are neutral, so colour keeps meaning something.
- The editor is the bubble: the same muted fill, the same 10 px corners and the same cap, so opening it does not reflow the thread; its focus is a Stormlight edge and a halo on the plate, as the composer draws it.
