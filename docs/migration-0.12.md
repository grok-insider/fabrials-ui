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
