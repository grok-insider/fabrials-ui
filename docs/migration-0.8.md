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
drop the override. In 0.8 the painted control itself is 44 px there too; see
"Toggle and ToggleGroup at 44 px" below.

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

#### Toggles and segments at 44 px on touch

`ToggleGroup` (and so `ThemeSwitcher`) gains `size="lg"`, a painted toggle of a whole control height
(40 px, 44 on touch), and `ThemeSwitcher` gains a `size` prop (default `sm`, as before).
Deletable: the product overrides that raise `.fui-toggle` to 40 or 44 px.

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

### Changed behaviour

- `StatePanel`, `RelativeTime` and `Badge` markup changes only when the new props are used, except `RelativeTime`,
  which now carries `data-mode` and skips `suppressHydrationWarning` in deterministic mode.

- **Segmented toggles and tabs are 44 px tall when painted on touch and narrow screens**, at every
  size, instead of 38 px extended by an invisible pseudo-element (0.7.1). A segmented control there
  is now 50 px tall including its 3 px group padding. A product that raised the toggles itself can
  drop the override, and one that relied on the 38 px painted height should check its rows.
- `NativeCheckbox` accepts `label`, `labelClassName` and `indeterminate`; without them its markup is
  unchanged (`type="checkbox"` is still accepted).
- **Sidebar active bar**: 2 px `--brand-ink` on the inline-start edge in every size (was 3 px `--brand` on the left).
- **`SettingsSection`** answers to its container (36rem), and its DOM gains one wrapper (`.fui-settings-section-layout`).
- **Tabs**: the underline indicator follows the active tab's own edge; `Tabs` has a `fui-tabs` class.
- `PageHeader` and `SectionHeader` headings now carry `fui-page-title` and `fui-section-title` classes (their
  element-based styles still apply).
- `SidebarMenuBadge` is a `span` (was a `div`).
- **New dependency**: `react-resizable-panels` 4.12.4.
