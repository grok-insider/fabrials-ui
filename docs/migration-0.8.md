# Adopting Fabrials UI 0.8

0.8 keeps every 0.7 export, token and class name. It adds public API (the pieces
Open Email had to build itself while moving to Highstorm) and folds in what was
prepared as 0.7.1, which was never published. Nothing in a host has to change to
update; each entry below says which host workaround the new piece makes
deletable.

## Carried over from 0.7.1

### Theme islands

`.light` and `[data-theme="light"]` now scope the light palette next to `:root`
(dark already had `.dark` and `[data-theme="dark"]`). A light island inside a
dark root, such as a preview of how a logo looks in the other theme, resets to
light instead of inheriting dark. A product that draws a gem inside an island
sets `data-gem` on the island's own root, because `[data-gem]` selectors match
only the element that carries them. Additive: nothing changes for a page that
sets the theme on `<html>` only.

### Touch targets of segmented controls

`Toggle` (and so `ToggleGroup` and `ThemeSwitcher`) and the tabs of a segmented
`TabsList` were 38 px tall on touch and narrow screens, because they sit inside a
group with 3 px of padding. Their hit area is now extended by that padding to
44 px with a pseudo-element, so nothing in the layout moves. Nothing to change in
hosts; a host that worked around it (a min-height override on the toggles) can
drop the override. A form row that wants the painted control at 44 px takes
`size="lg"` (see "Toggles and segments" below).

## New in `@fabrials/ui` 0.8

### Controls

Every entry names the host workaround it makes deletable. Nothing here changes an
existing export except the two called out under "Changed behaviour".

#### `IconButton`

`IconButton({ label, tooltip = true, shortcut?, textName?, size = "icon-lg", variant = "ghost", loading?, ...ButtonProps })`.
A 44 px icon-only button named by `label` (`aria-label`, or a hidden text node with
`textName`), with a tooltip on hover and on keyboard focus and, with `shortcut`, flat
`Kbd`s in it and `aria-keyshortcuts`. It spreads its props on the `Button`, so a Base UI
trigger can `render` it. The tooltip wrapper stays mounted when the button is disabled.
Deletable: a product's own `ui/icon-button.tsx` (Tooltip + Button + `aria-label`).

#### `Toolbar`, `ToolbarGroup`, `ToolbarSeparator`, `ToolbarButton`

One tab stop for a row of controls over Base UI's toolbar: Tab enters and leaves once,
the arrows, Home and End move between the items (Base UI provides the arrows only; Home
and End are added here). `Toolbar` and `ToolbarGroup` require a name. `variant="bar"` is the
page background between two hairlines with its icons on the page gutter, `sticky` keeps it
under the top of its scroll container. A disabled `ToolbarButton` stays in the arrow order
(`aria-disabled`, no click). `ToolbarButton` is named by a text node (`textContent`
equals the action) with a tooltip; `reveal="early" | "middle" | "late"` shows the label from a
container width of 40, 52 and 76 rem, and `tier="low"` (hidden below 34 rem, for an overflow menu)
or `tier="overflow"` (the menu's trigger, only there below 34 rem) fold actions away. Hidden
items leave the arrow-key order, so the toolbar never loses its tab stop to an item nobody
can see. Deletable: `role="group"` clusters with every button tabbable, the reader's
`ToolbarButton` and its `.reader-action`, `.reader-label`, `[data-reveal]`, `[data-tier]` and
`.oe-sep` rules, and the pinned 44 px rules of `.reader-toolbar`.

The thresholds are measured on the toolbar's own content box (`bar`), or on the nearest
size container above a `plain` one (`contain={false}`), not on a named pane container.

#### `FileInput`

`FileInput({ label, name, accept, onFilesChange, fileName?, onClear?, clearLabel?, description?, error?, variant, size, ...inputProps })`:
a label styled as a `Button` over a visually hidden real input, the chosen name, an optional
clear action (the picker is emptied so the same file can be chosen again) and a description
and error read with the input. The browser's "Choose File" text is never shown.
Deletable: `ui/file-button.tsx` and `.oe-file-button`.

#### `Disclosure`, `DisclosureSummary`, `DisclosurePanel`

A styled native `details`: a 44 px summary with a chevron (`end` or `start`, RTL-aware), a
`count` slot inside the summary, sizes `sm` (quiet, invisible 44 px target), `md`, `lg`, a panel that
stays mounted, no JavaScript, exact on the server. It opens itself when a field inside
fails validation (`revealInvalid`). Deletable: the `details > summary` rules for the reader
header, the conversation, the tool blocks, the search filters and the offline page, and the
`onInvalidCapture` handler of the label form.

#### `FieldSet`, `FieldLegend`, `FieldGroup`

A real fieldset (`min-inline-size: 0`, `disabled` passes through to native controls only), a legend
styled as a subsection title (`variant="title" | "label"`) with a hairline above drawn on the legend
(`divider`, left out for the first fieldset of a container), and a grid of fields
(`layout="columns"` reflows by container). Deletable: `.contacts-fieldset`, `.contacts-name > legend`
and the other hand-made fieldset and legend rules.

#### `NativeRadio`, `NativeRadioGroup`; `NativeCheckbox` `indeterminate` and `label`

`NativeRadioGroup({ legend, hideLegend?, layout = "stack" | "grid" })` is a fieldset with a legend;
a disabled fieldset disables every native radio. `NativeRadio` takes an optional `label` that
wraps the input in a 44 px row. `NativeCheckbox` gains `indeterminate` (applied as the element
property after mount and after every render and change, so a click that leaves the host's state
unchanged does not lose it; the ref is merged) and the same `label`. Under `Loading`, native boxes become
the same neutral shapes as the Base UI ones, with no tick, dash or dot. Deletable: the swatch picker's
`<input type="radio">` with a host class, the `.oe-check` label rule, and the `useEffect` that sets
`indeterminate` on the select-all box.

#### Toggles and segments: `size="lg"`

`ToggleGroup` (and so `ThemeSwitcher`) gains `size="lg"`, a painted toggle of a whole control height
(40 px, 44 on touch), and `ThemeSwitcher` gains a `size` prop (default `sm`, as before). The default and `sm` sizes
keep their painted height everywhere and reach 44 px on touch with the invisible hit-area extension of 0.7.1, so a
header with a theme switcher keeps its width at 390 px. Deletable: the product overrides that raise `.fui-toggle` to
40 or 44 px (Open Email's settings rule becomes `size="lg"`).

### Feedback, state and text

#### `StatePanel` `size`, `variant` and `fill`

`size="sm"` is 16 px of padding (also when centred) for a drawer, a popover, a sidebar or a list slot, with the same
icon and text; `variant="inline"` drops the border and the tint (an overlay, a palette) while the icon and `role`
still carry the state; `fill` takes the height of a region that has one and centres the content. `StatePanel` now
spreads the remaining `div` props (`id`, `tabIndex`, `ref`, `role`, `aria-*`). Deletable: `.fui-state-panel.oe-state`
(patterns.css), `.fui-state-panel.pane-placeholder` (list.css) and the `ui/empty-state.tsx` class.

#### `ConfirmDialog` `finalFocus`, optional `description`, `useConfirm`, `ConfirmProvider`

`finalFocus` is Base UI's option with the outcome as a second argument
(`(closeType, "confirmed" | "dismissed") => element`); a function that returns nothing or `null` keeps the default,
which differs from a bare Base UI function returning `undefined` (that means "do not move focus"). It is also accepted
by `ConfirmActionButton`. A confirmed action that removes its trigger names the element that now holds the result, and
Cancel and Escape still return to the trigger. `description` is now optional. `useConfirm()` returns
`(options) => Promise<boolean>` backed by `ConfirmDialog`: `true` on confirm; `false` for Cancel, Escape, the backdrop
and an unmounted provider; questions asked while one is open wait their turn; focus returns to the control that asked.
Without a `ConfirmProvider` it is `window.confirm` (title and description as text, or `fallbackText`). It is for flows
that can await: a guard that must answer synchronously (back, forward, unload) keeps the native confirm. Deletable:
the AlertDialog parts composed by hand in `features/contacts/delete-panel.tsx`.

#### `RelativeTime` deterministic mode

`absoluteFormat` (`Intl.DateTimeFormatOptions`, or `(date, now) => options` to drop the year when it is this year),
`now` (a number is a fixed instant and stops the timer; a function is read at every tick) and `timeZone`. No timer runs
in absolute mode or with a fixed `now`; the exact instant is in `title` (full date, time and zone). With a `timeZone`
the text and the title are identical on the server and in the browser, and `suppressHydrationWarning` is not set;
without one the browser's zone is used and hydration differs (the title, and the text of an absolute date, depend on
the zone even with a fixed `now`), so `timeZone` is required whenever a deterministic time is server-rendered. `formatAbsoluteTime` is the same as a
function, and `formatRelativeTime` accepts `timeZone`. Deletable: `features/mail/message-date.ts`,
`features/mail/tool-time.tsx` and the exact dates of the offline page (the per-row year rule is a function you keep).

#### `Kbd mod`, `KbdGroup sequence`, `useModifierKey`

`useModifierKey()` is `"Ctrl"` on the server and at first render and `"⌘"` on Apple platforms after hydration (no
mismatch); `<Kbd mod />` prints it. `KbdGroup sequence separator="then"` puts the word between the keys, muted
(`separator` is copy: translate it). Deletable: `ui/use-modifier-key.ts` and `.command-then` in command.css.

#### `Alert layout="inline"`

A slim notice: from 48rem of the alert's own width the title and description share a line and the action sits at the
end; narrower it stacks like the default. It measures itself (a `container`), so it fills its container: give it
`flex: 1` in a flex row. Not for status that refreshes periodically. Deletable: `.app-notices` and the notice rules in
frame.css.

#### `Badge` data colour, `dotColor`, `truncate`, hollow dot

`--fui-badge-solid` (tint, hairline, dot) and `--fui-badge-ink` (text) are public properties, set on the badge itself
(a class or `style`: the badge declares them, so an ancestor's value does not reach it). The neutral dot was
hard-coded to the muted ink and defeated `--fui-badge-solid`; it now follows it, with the same default. `dotColor`
recolours the dot alone (`--fui-badge-dot`), `dot="hollow"` draws an outline dot (an archived item) and `truncate`
shrinks the tag to its container with an ellipsis, the text in the title; `--fui-badge-max` caps it. Deletable: the
`::before` dot, the variable override and the ellipsis rules of `.label-chip` (labels.css), and `.contacts-label`.

#### `IconButton` and `ToolbarButton` shortcut sequences (fix to batch 1)

`shortcut` also accepts `{ keys: ["g", "i"], sequence: true, separator? }` for keys pressed one after the other: the
tooltip renders `KbdGroup sequence` ("g then i") and no `aria-keyshortcuts` is emitted, because that attribute has no
sequence syntax (a string or array is still a chord, "Control+K"). Before this, a sequence could only be passed as an
array and was announced as the chord "g+i".

#### `avatarInitials`, `formatBytes`, `FileSize`, `data-hit="44"`

`avatarInitials(value, fallback?, locale?)` and `formatBytes(locale, bytes)` are `platform/format.ts`'s `initials` and
`formatBytes` (same arguments and results, except that English prints "812 B" and "0 B" where the host printed
"812 byte"; `formatBytes` also goes up to terabytes and throws a `RangeError`).
`FileSize` renders a size without ever throwing. `[data-hit="44"]` grows a small control's target to 44 px with a
pseudo-element (deletable: `.oe-hit`). `formatMinutes` stays a host helper.

### Structure and navigation

#### `Item`, `ItemGroup` and the row parts

A record row for master-detail panes, with shadcn's part names (`Item`, `ItemGroup`, `ItemMedia`, `ItemContent`,
`ItemTitle`, `ItemDescription`, `ItemActions`, `ItemHeader`, `ItemFooter`, `ItemSeparator`) and the hooks Open Email's
`.oe-row*` rules had. `ItemGroup` is a `ul` and the size container its rows answer to; `Item` is a `li` in it and a
`div` alone. `stretch` makes the link or button of the title cover the whole row (`ItemLink`, or a link inside
`ItemTitle`); `ItemActions`, `ItemControl` and `ItemCheck` sit above it as separate targets; `current` is the soft
Stormlight fill with a 2 px bar (`--fui-bar`, a new token), `selected` the fill without the bar (a checked native
checkbox inside an `ItemCheck` does it without JavaScript), `unread` weight 600 with `ItemUnread` for the square.
The focus ring is drawn on the link's `::after` inside the row, so a scrolling parent never clips it. The row root
carries only the row (44 px minimum, a hairline below, hover, fills); the slots lay themselves out only when they are
direct children, so a row that draws its own grid inside (a message row) is untouched. Renames: `.oe-row` to `Item`
with `stretch`, `.oe-row-link` to `ItemLink`, `.oe-row-check` to `ItemCheck`, `.oe-row-control` to `ItemControl`,
`.oe-unread` to `ItemUnread`. Deletable: the `.oe-row*` and `.oe-unread` rules of `patterns.css`.

#### `AppHeader` and its parts

`AppHeader({ brand, navigation, command, actions, sticky })` is one 56 px row with a hairline, no blur, its content on
the page gutter. Parts: `AppHeaderBrand` (44 px link that grows into the gutter), `AppHeaderLogo`, `AppHeaderNav`,
`AppHeaderLink` (`current`: full ink and a 2 px bar on the hairline), `AppHeaderAction` (a ghost `Button`),
`AppHeaderLabel`, `AppHeaderCaret`, `AppHeaderPlaceholder`. Modes are container queries on the header (compact below
48rem, wide from 72rem, the name gives way at 24rem, two rows at 19rem). The command slot is the size container
`command` with a definite width in every mode (44 px, then 14, 18 and 22rem): Firefox and WebKit size the actions
cluster from its content and ignore a flex-basis, which made the header overflow. Deletable: the header rules of
`frame.css` (`.app-header*`, `.app-brand*`, `.app-nav*`, the account and preferences trigger sizing) and
`ui/app-header.tsx`.

#### Sidebar menu without a provider; shortcut and labels

`SidebarMenu`, `SidebarMenuItem`, `SidebarMenuButton` and `SidebarMenuBadge` render without a `SidebarProvider`
(expanded, not mobile). `SidebarMenuButton` gains `size="touch"` (a 44 px target around a 40 px band, the focus ring
inside the band, muted icons; `depth` indents nested rows), and `SidebarMenuBadge` is a `span`: inside the button it
is a count in the row and part of the link's name. `SidebarProvider` gains `keyboardShortcut` (`string | false`,
default `"b"`) and `persist` (`false` writes no cookie); the shortcut is now ignored while a person types in a
field or an editor (it used to swallow Ctrl+B in every editor). `Sidebar` takes `labels`, `SidebarTrigger` and
`SidebarRail` take `label`. **Visual change:** the active bar of every size is the 2 px Stormlight ink bar
(`--brand-ink`, inline-start) instead of a 3 px `--brand` bar on the left edge. Deletable: `ui/nav-row.tsx` and the
`.oe-nav-row*` rules of `navigation.css`.

#### `ResizablePanelGroup`, `ResizablePanel`, `ResizableHandle`

Highstorm resizable panes over `react-resizable-panels` **4.12.4, now a dependency of `@fabrials/ui`** (a product
that re-vendors 0.8 installs it; Open Email already has it). The handle is a 1 px hairline with a 3 px Stormlight
line on hover, drag and keyboard focus, transparent when disabled. `resizeTargetMinimumSize` defaults to 10 px for a
mouse and 24 px for touch. The double-click lesson is built in: the library resets a layout when a double click lands
anywhere in a handle's hit target and does not call that a user interaction, so a host that saves in `onLayoutChanged`
kept the stale layout; the group now reports the reset with `meta.isUserInteraction` true, whatever element was hit.
Names follow shadcn (`ResizablePanelGroup` accepts `direction`, `ResizableHandle` accepts `withHandle`), so the
shadcn `resizable` shim now exists. Deletable: `ui/primitives/resizable.tsx`, `.oe-resize-handle`, and the
`onDoubleClick` persistence code of `ui/mail-pane-layout.tsx`.

#### `NavSwitcher`

A trigger that names the current entity (mark, title, description, a tag, chevrons; `layout="block"` or `"inline"`)
and a popover that is a `nav` list of links (`NavSwitcherItem` with `current`, a status `description`, a `tag`; a
separator; a `footer` that stays under the scrolling list). It opens on the current link and Escape returns focus to
the trigger. Deletable: the markup and `.connection-switcher-*` rules of `features/identity/connection-navigation.tsx`.

#### `SettingsSection` follows its container; heading controls

The section is now the size container and an inner `.fui-settings-section-layout` is the grid: two columns (13rem and
the rest) from 36rem of the SECTION's own width, one column below it, instead of a viewport media query at 768 px.
`layout="stacked"` opts out. **The section is no longer the grid:** a host rule that set `grid-template-columns`, `gap` or `align-items` on `.fui-settings-section` (to stack it or to change the columns) now does nothing and must target `.fui-settings-section-layout`; `padding`, `border-top` and `margin` on the section still apply. Any product that restyled sections, not only Open Email, should search for `.fui-settings-section` in its CSS. The section takes its width from its parent (`inline-size: 100%`), so keep it in a block,
grid or column flex parent. **Visual change:** a section in a narrow sheet on a wide screen is now stacked (it used to
be two columns), and one in a dialog narrower than 36rem too. `PageHeader`, `SectionHeader` and `SettingsSection` take
`headingLevel` (1 to 4; the look does not change with the level), `headingRef` and `headingProps` (`tabIndex`, `id`,
`data-*`; a custom `id` keeps `aria-labelledby` right); a focused heading shows a Stormlight ring. Deletable: the
container overrides of `settings.css`, `tools-shell.css` and `offline.css`, and hand-made headings with the `fui-`
classes.

#### Tabs: a vertical rail and a scrolling strip

`Tabs orientation="vertical"` makes a rail (the list on the sidebar surface, the current row `--sidebar-accent`, a 2 px
Stormlight bar on the inline-start edge). `TabsList scrollable` (`true`, or `"narrow"` below 48rem) keeps one line that
scrolls sideways without a scrollbar, snaps to the tabs and keeps the selected tab in view by scrolling its own box
(never the page; right to left works), only when the selection changes. `Tabs` now renders a `fui-tabs` class on its
root. **Visual change:** the underline indicator is anchored to the active tab's own bottom edge, so a list that wraps
onto two rows underlines the right one; a single row is pixel-identical. Deletable: the rail and strip rules keyed on
`data-layout` in `settings.css` and the `keepInView` ref callback.

### Overlays, commands and auth

#### `DialogBody`, `DialogFooter`, `DialogActions`; `DialogContent` `size`, `close`, `padding`, `keepMounted`

A `DialogBody` as a direct child of `DialogContent` gives a dialog a fixed header, a body that is the only scroller and a
fixed footer (`:has(> .fui-dialog-body)`, so a dialog without one keeps the plain padded box and no existing dialog
changes). A long title wraps inside the header instead of pushing the actions away. `close="footer"` draws no X and puts
a Close button first in `DialogFooter` (`showCloseButton` on `DialogFooter` is shadcn's name for the same), so the primary
action ends at the inline end. `DialogActions` portals actions into that footer from a stateful child (a form under the
body); nothing renders until the footer has mounted, so the server output is empty. Under 34rem of dialog the footer
wraps: the secondary buttons share rows and the ink action, last as in the tab order, takes the full row at the bottom under
the thumb; every button is 44 px; in a window under 30rem tall the dialog scrolls as a whole and only
the footer sticks; full-screen dialogs keep the safe areas. `size` is `default` (32rem), `wide` (46rem), `settings` (62 by
42rem, 72 by 48 from 100rem) or `full-narrow` (default width, the whole screen below 48rem; `wide` and `settings` are
the whole screen there too). `DialogBody scroll={false}` lets a settings rail and panels scroll themselves.
`padding="none"` and `keepMounted` (the dialog stays in the DOM, `hidden`, while closed) are new too, and `DialogContent`
carries `data-size`, `data-padding` and `data-close`. `Dialog`, `AlertDialog` and `Sheet` no longer close on Escape during
an IME composition. **Two small visual changes:** the corner X is placed with `inset-inline-end` (it was `right`, which was
wrong in right-to-left), and `AlertDialogFooter` is a plain function (was the `DialogFooter` alias, so `showCloseButton`
does not apply to it). Deletable: `ui/dialog.tsx`'s `DialogActions`, `FooterSlot` and the IME guard, `data-fixed-footer`
and `.dialog-body`, `.dialog-footer`, `.dialog-footer-slot` in `patterns.css`, the header, body and footer rules of
`assistant.css`, and the size and header rules of `settings.css`.

#### Non-modal `Sheet`, `SheetBody`, `keepMounted` on popovers and menus

`Sheet` is now a component, not an alias of `Dialog`: `modal={false}` is a drawer beside the page (no scrim, no focus
trap, the page stays usable, an outside press does not close it because `disablePointerDismissal` defaults to true, Escape
and the close control do and focus returns to the trigger); `modal="trap-focus"` traps focus but leaves the page usable.
The gap entry put `modal` on `SheetContent`; Base UI reads it on the root, so it is on `Sheet` and `SheetContent` follows.
`PopoverContent`, `DropdownMenuContent` and `DropdownMenuSubContent` take `keepMounted`; `.fui-dialog`, `.fui-backdrop`,
`.fui-positioner`, `.fui-popover` and `.fui-menu` are `display: none !important` while `[hidden]`.

#### `Accordion variant="rows"`, `AccordionTrigger` `headingLevel`, `headingRef`, `icon`, `aside`

A stack of independent tools: 44 px header rows (icon, title, tags, chevron), the open row marked like the current item
(accent fill and a 2 px bar), bodies that stay mounted while closed (`keepMounted` defaults to true in this variant only;
the default accordion is unchanged). `aside` (tags, counts) sits outside the trigger, describes it (`aria-describedby`)
and is not part of its name; the trigger's `::after` stretches over the row, so the tags and the chevron ignore the pointer
and the ring is drawn inside the row. `headingLevel` (2 to 4) and `headingRef` (the heading takes `tabIndex={-1}` and hands
focus to the trigger) replace hand-made headings. Base UI's accordion has no arrow-key roving: each trigger is a tab stop.
A row whose expansion lives in the URL (the host's `href` mode) is a link, not an accordion trigger, and stays host code.
Deletable: `ToolSection` (`ui/workspace-tools.tsx`) and `.tool-section*` in `tools-shell.css`.

#### `BulkActions keepMounted`

At a count of 0 the region stays in the DOM: the actions are `hidden` and the `role="status"` span stays, visually hidden
(clipped, not `display: none`), so a change from 0 to 1 is announced by a live region that already existed. Without the prop
nothing renders at 0, as before. Deletable: the always-mounted markup of `features/mail/bulk-bar.tsx` (the phone overflow
menu of the product lane is host layout and stays).

#### `CommandTrigger`, `CommandOptionList`, `CommandOption`; the command dialog

`CommandTrigger` is the launcher: a secondary button with the 3:1 control boundary, a label, `KbdGroup` keys
(`keys={["mod", "K"]}`, the modifier resolved after hydration, `aria-keyshortcuts` derived and constant), icon-only in a
container named `command` under 12rem (the `AppHeader` slot) or with `compact`, key hint hidden on coarse pointers. The
gap entry proposed an outline button; the host's secondary look with `--fui-control-border` is kept. `CommandOptionList`
and `CommandOption` are the rows of a listbox that is not cmdk (`active`, `disabled`, `detail`, `group`, `reason`, `keys`;
the group slot is `.fui-command-option-group` because `.fui-command-group` is cmdk's group wrapper). **Visual changes:**
the cmdk `CommandItem` selected row now has the 2 px Stormlight bar and a square start edge (it had the fill only);
`.fui-command-dialog` has 6 px corners, the overlay shadow and highlight, and `--fui-command-top: min(14dvh, 9rem)`
places it and limits its height (it was `14vh` and no limit). Deletable: the markup of the launcher and `.commands-trigger*`,
`.command-option*` and `.command-then` in `command.css`, and the dialog overrides there.

#### `AuthLayout` `actions` and `align`

`actions` is a corner control at the inline end of the top edge, after the card in the DOM (the first tab stop is the
sign-in action). `align="auto"` (default) follows DESIGN.md: with an `aside`, the card anchors to the inline start of its
column from 1024 px (48 px from the storm's hairline); without one it centres. `start` anchors at every width, `center`
centres beside an aside. **Visual change:** 0.7.0 centred the card in its column beside the storm, contradicting DESIGN.md;
the code now matches it, so every sign-in that has an `aside` (the Highstorm and Patterns stories, fabrials.com) shifts
the card to the start of its column; pass `align="center"` to keep the old look. Deletable: `.app-public-corner` and the
absolutely positioned `PublicPreferences` wrapper.

#### `StatusPopover`

An icon, or an icon and a word, that opens a popover named by its title with what to do about it; `attention` tints the
trigger with a status ink; `compact` hides the label visually and keeps it in the name. Deletable: `ui/status-details.tsx`
and `.status-details*` in `navigation.css` (the pane-mode label hiding becomes `compact`).

#### `DescriptionList layout="auto"`

Follows the list's own width: stacked under 30rem, a 8 to 11rem term column from it. The list is a size container, so it
must fill its parent's width. Deletable: the `@container tool` rules for `.fui-description-list` in `tools-shell.css` and
`.offline-envelope` in `offline.css`.

### Changed behaviour

- `StatePanel`, `RelativeTime` and `Badge` markup changes only when the new props are used, except `RelativeTime`,
  which now carries `data-mode` and skips `suppressHydrationWarning` in deterministic mode.

- `NativeCheckbox` accepts `label`, `labelClassName` and `indeterminate`; without them its markup is
  unchanged (`type="checkbox"` is still accepted).
- **Sidebar active bar**: 2 px `--brand-ink` on the inline-start edge in every size (was 3 px `--brand` on the left).
- **`SettingsSection`** answers to its container (36rem), and its DOM gains one wrapper (`.fui-settings-section-layout`).
- **Tabs**: the underline indicator follows the active tab's own edge; `Tabs` has a `fui-tabs` class.
- `PageHeader` and `SectionHeader` headings now carry `fui-page-title` and `fui-section-title` classes (their
  element-based styles still apply).
- `SidebarMenuBadge` is a `span` (was a `div`).
- **New dependency**: `react-resizable-panels` 4.12.4.
- **`Dialog`, `AlertDialog` and `Sheet` are components** (they were aliases of the Base UI roots); the props and the
  shadcn names are unchanged, and Escape during an IME composition is ignored.
- **`.fui-dialog-close`** is placed with `inset-inline-end`; **`AuthLayout`** anchors its card to the start beside an aside;
  cmdk's selected `CommandItem` has the 2 px bar; `.fui-command-dialog` has 6 px corners and a maximum height.

## 0.8.1: the fifteen requests Open Email still had after 0.8.0

0.8.1 keeps every 0.8.0 export, token and class name, and adds what Open Email's adoption of 0.8.0 still had to carry as host code (`docs/fabrials-ui-gaps.md` in that repository lists them). Everything is optional: without the new prop or attribute, markup and geometry are those of 0.8.0. The exceptions are the CSS fixes listed under "Changed behaviour" below.

### Overlays and dialogs

#### `SheetContent` container, logical sides, offsets; `Sheet` `closeOnEscape`

`SheetContent side` also takes `start` and `end` (logical: the other edge in a right-to-left page; `left` and `right` stay physical). `container` portals the sheet next to its trigger, so the tab order is the trigger and then the sheet (hold the element in state when the sheet can be open on the first render: a ref object is still empty then and the sheet falls back to the body; Base UI leaves its empty portal element in the container, which a flex or grid `gap` there will notice). Four documented properties place a sheet without host JavaScript or `!important`: `--fui-sheet-inset-block-start` and `--fui-sheet-inset-block-end` (default `0px`; a drawer under an app header sets the first), `--fui-sheet-z` (default one above the overlay level) and `--fui-sheet-width` (default `26rem`, still capped at the window). `Sheet closeOnEscape="focus-inside"` closes the sheet on Escape only when focus is inside it, so a drawer that stays open beside the page is not closed by an Escape meant for the editor next to it; Escape from inside still returns focus to the trigger. A Base UI menu, popover or dialog opened inside the sheet takes that Escape first; a hand-built listbox that is not a Base UI popup does not, so it must stop the event itself. `initialFocus={false}` leaves focus on the trigger when the sheet opens. Deletable: the fixed-position, inset, z-index and width plumbing of a hand-made drawer, and its own Escape handler.

#### A sheet as an in-page drawer: what to expect

Open Email's tools drawer (`Sheet modal={false}`, `keepMounted`, `closeOnEscape="focus-inside"`, `container`, `initialFocus={false}`) found five things a host should know before it swaps a hand-made drawer for a sheet. None of them is a defect to fix in the package; each is how the parts work.

- **State is `[data-open]`, not `hidden`.** A kept-mounted sheet gets `hidden` and `display: none` only after its exit transition ends, so anything keyed to `:not([hidden])` reacts late. React to `[data-open]`, which clears on the first closing frame.
- **It is a dialog to the page and to assistive technology.** The popup is `role="dialog"` without `aria-modal`, named by `SheetTitle` (`render={<p />}` keeps the title out of the heading outline). It is not a landmark, and a non-modal sheet looks the same in the DOM as a modal one (`.fui-dialog[data-open]`), so code that asks "is a dialog open?" must exclude the drawer by a class of its own.
- **It takes the dialog typography** (14 px, line height 1.5, tabular figures, antialiased). A drawer that should follow the page's text resets `font: inherit` on itself.
- **Its content mounts a few commits after the component that renders it**, because Base UI portals it. A parent whose mount effect needs a ref to an element inside the sheet (a deep link that focuses a heading) must wait until the sheet has mounted; hold the `container` element in state, and expose a "ready" flag from the component that renders the sheet.
- **A non-modal popup renders four `aria-hidden` focus guards while it is open.** axe flags them (`aria-hidden-focus`) in WebKit; exclude `span[data-base-ui-focus-guard][aria-hidden="true"]` from the scan, as for dialogs.

#### `closeVariant` on `DialogFooter` and `DialogContent`

The Close that `close="footer"` draws is `secondary` by default. `closeVariant="outline"`, set once on the content (or on one footer, which wins), draws it in the look of a product whose secondary actions are outlines. Deletable: a wrapper that re-draws the footer's Close by hand.

#### Scroll padding under a sticky dialog footer

In a window under 30rem tall, where a dialog with a `DialogBody` scrolls as a whole and only the footer sticks, `DialogFooter` publishes its height as `--fui-dialog-footer-size` on the dialog, and the dialog pads its scrolling with it plus 1rem: a field that gets focus is scrolled above the footer instead of under it. Nothing changes for a dialog that is not in that state. Known limit: WebKit scrolls the line of text of a field into view, not its box, so in that engine the focus ring can sit close above the footer (measured 3 px at 568 x 320) and a one-line description under the field stays under it; Chromium and Firefox show the whole field.

### Patterns and commands

#### `BulkActionsRoot`, `BulkActionsStatus`, `BulkActionsContent`

For a layout where the live status is shared with other controls (a title row that holds select-all, the folder title and the count) and the actions are a form under it. `BulkActionsRoot` provides one count, one `keepMounted` and one region label and renders a plain element the consumer lays out; `BulkActionsStatus` is the `role="status"` span (at a count of 0 it is not rendered, or with `keepMounted` it stays, visually hidden, so the change from 0 to 1 is announced by a region that already existed); `BulkActionsContent` is the labelled `role="group"` of actions, hidden at a count of 0 and out of the tab order while hidden (its own `hidden` prop keeps a closed form mounted). `BulkActions` is unchanged. Deletable: a hand-made status span, its empty-state rule, its hidden rule and its hand-made group.

#### `SectionHeader` `aside`

A count or a status beside the title, outside the heading element (the heading's name stays the title), wrapping under the title by the header's own width. `aside={0}` renders a `0` (an empty collection keeps its count); `false`, `null`, `undefined` and `""` render nothing. Nothing changes without it.

#### `CommandTrigger` `variant`

Default `secondary` (the 0.8.0 look). `outline` is the card fill and hairline of a launcher that looks like a field. Deletable: a `data-variant="outline"` written at the call site.

### Structure and navigation

#### `NavSwitcher` `contain`

`contain={false}` makes no size container of its own, so its mark and tag rules follow the nearest ancestor container named `nav-switcher` (name a pane with `container: <yours> nav-switcher / inline-size`). The thresholds are unchanged and measured on that container's content width: 17.5rem hides a mark that has a tag, 15rem hides every mark. Deletable: a host copy of the two `@container nav-switcher` rules that shifted the thresholds by the trigger's padding.

#### `data-hit="y"` and `data-hit="end"`

Two more shapes of the invisible 44 px target next to `"44"`. `y` grows block-wise only, so the inline neighbours keep their own targets. `end` grows block-wise and past the end edge only, for an icon-only button at the end of an input group (in a right-to-left page too). Deletable: host classes that draw the same extension.

#### `NativeRadioGroup` column floor

With `layout="grid"` the column floor is the custom property `--fui-native-radio-min` (default `9rem`, radio and gap included, as before). Raise it on the group when the names are long: the pane drops to fewer columns, down to one, before a name wraps to three lines.

### Changed behaviour (CSS fixes)

- **Toolbar targets stay 44 px on touch.** A `Toolbar`'s pin (44 px) now out-ranks the package's own touch rule (`2.75rem`, which scales with the text size), so at 200 % text on a phone every button in a toolbar keeps 44 px and the bar no longer doubles in width and wraps. A `Button`, `ToolbarButton` or `buttonVariants` link inside a `Toolbar` is covered. At 100 % text nothing changes; outside a `Toolbar` nothing changes. Deletable: a host re-pin of the same targets.
- **Menu row names are overridable.** The ellipsis rule of `SidebarMenuButton` and `SidebarMenuSubButton` labels costs no specificity and skips a trailing `SidebarMenuBadge` or `Badge`: a bare class of yours (`white-space: normal`) wins without `!important`, and a count beside the name keeps its size. Rendering is unchanged.
- **`ToggleGroup size="lg"` is 44 px on every pointer**, and so is `ThemeSwitcher size="lg"`. The group is 50 px tall (its 3 px padding stays), which is 4 px more than before on a fine pointer; in compact density `lg` is no longer compacted, like `Button size="lg"`. Touch and narrow widths are unchanged.
- **`Accordion variant="rows"` is not underlined on hover.** The row fill is its cue; the default accordion is unchanged.
- **`DescriptionList layout="auto"`** declares its 1 rem column gap together with the row gap, outside the container query (the query only changes the columns), so no engine can drop it. Visible effect: none (one column has nothing to separate). This answers a report of Firefox dropping the gap that could not be reproduced (Firefox 1509, Chromium and WebKit all gave 16 px from 30rem on 0.8.0 too): if a host still sees the term touching its details, the cause is in the host page.

## 0.8.2: three fixes the x-tracker adoption found

No new export and no API change. Three CSS or logic fixes; each makes a host workaround deletable.

- **`useModifierKey` and `<Kbd mod />` on Chrome and Edge for Mac.** The hint tested `navigator.userAgentData.platform` against a case-sensitive `/Mac/`, and Chromium reports `"macOS"`, so a launcher's hint said «Ctrl K» on a Mac. It is now case-insensitive (Safari and Firefox report `navigator.platform` as `"MacIntel"` and were always right). Deletable: a host that forced the key label to «⌘» on Mac.
- **A toast's cancel button in dark.** Sonner injects its own sheet after the package's, and its dark rule for `[data-cancel]` (a 30 % white fill) tied the package's selector at five attributes and won by coming later, so the label's contrast fell to 3.8 to 4.2:1. The package's rule now carries `[data-sonner-theme]` (the Toaster always sets it) and outranks Sonner's in both themes: transparent fill, `--foreground` text, 9.7 to 11.1:1 on the popover. Deletable: a host rule that restyled `[data-cancel]` at six attributes.
- **Touch navigation rows in forced colors.** The 2 px block borders of a `SidebarMenuButton size="touch"` are transparent because they make up the 44 px target; forced colors paints a transparent border in a system colour, which drew a line above and below every row. In forced colors they are `Canvas`. Deletable: a host rule that set `border-block-color` on `.fui-sidebar-menu-button[data-size="touch"]`.
