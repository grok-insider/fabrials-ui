# Components: which one for which job

Everything below is exported by `@fabrials/ui` (`packages/ui/src/index.ts`), `@fabrials/ai-ui` (`packages/ai-ui/src/index.tsx`) or published as a block by the registry (`apps/site/lib/catalog.ts`). The catalogue with props and notes is `apps/site/lib/ui-catalog.ts`; every entry has a page at `https://ui.fabrials.com/docs/<slug>`. When you need a prop, read the component source; do not guess.

## Imports

```ts
import { Button, PageHeader, Table } from "@fabrials/ui";           // components ("use client" module)
import { buttonVariants } from "@fabrials/ui/button-variants";       // class names only, safe in server components
import { STORM_RAMP, gemRamp, stormField } from "@fabrials/ui/dither"; // pure dither helpers
import { lunarPhase } from "@fabrials/ui/moon";                       // pure moon helpers for server code
import { ChatMessage, ChatComposer } from "@fabrials/ai-ui";         // needs @fabrials/ai-ui/styles.css
```

- Named exports only. Shared components render with `fui-` classes and need no Tailwind.
- A link that looks like a button: `<Link className={buttonVariants({ variant: "outline", size: "sm" })} href="…">`.
- Shims (`@/components/ui/button` after `shadcn add @fabrials/button`) re-export these controls under shadcn's names so existing shadcn code gets them. New code imports from `@fabrials/ui`.
- Icons are `lucide-react` (the package's own icon set), 16 px inside buttons, marked `aria-hidden` next to text.

## Quick picks

| You need | Use | Not |
| --- | --- | --- |
| The page's title and main action | `PageHeader` | A hand-made `h1` row with a coloured eyebrow |
| A section inside a page | `SectionHeader` | Another heading style |
| Search, filters and actions for a list | `CollectionToolbar` | Filters in a far-away sidebar |
| Records | `Table` (+ `BulkActions` once rows are selected) | A grid of cards |
| A first load | `Loading` around the real components with placeholder data | Hand-drawn grey boxes, a bare spinner in the middle of the page |
| Empty, error, stale, offline | `StatePanel` | A bare spinner in the middle of the page |
| A status | `Badge` (tag) or `StatusDot` (dot and word) | A coloured pill, colour without text |
| A number and its change | `Stat` in a `StatGroup` | A big number in a card with a gradient |
| A quota or budget | `Meter` (`variant="ruler"` under a figure) | `Progress` (that is for a task that finishes) |
| A figure or chart on a plate | `Card` with `CardCaption` as its last row | A caption in body text, a coloured border, a plate inside a plate |
| The hero figure of a landing or sign-in (a brand moment) | `CornerMarks` around its plate | Corner marks on product screens or on every box |
| Something an agent is doing right now | `WorkingLight` on the surface it works on, `ShimmerText tone="light"` for its label, and the `@fabrials/ai-ui` agent pieces | A spinner with no words, a glow that stays after the work ends, a gradient border at rest |
| The grid behind a landing hero | `GridGuides` | A background image of lines, a gradient grid |
| A settings row | `SettingsSection` | A `Card` per setting |
| A choice that applies now | `Switch` | A checkbox that saves immediately |
| A view or range switch next to what it changes | `ToggleGroup` | Tabs, a select |
| Peer views of one subject on one page | `Tabs` | `NavTabs` |
| Sections of a record, each with its URL | `NavTabs` + `NavTab` | `Tabs` |
| An icon-only action | `IconButton` (a name, a tooltip, 44 px) | An icon `Button` with a `title` or no name |
| Several actions in one row that people arrow through | `Toolbar` + `ToolbarButton` (one tab stop) | A row of tabbable buttons in a `div role="group"` |
| A list of records next to a detail pane (messages, contacts, copies) | `ItemGroup` + `Item stretch` (`ItemLink`, `ItemCheck`, `ItemActions`) | A `Table` with a click handler on the row, a hand-made stretched link |
| The top bar of an app (brand, navigation, command, session controls) | `AppHeader` with `AppHeaderBrand`, `AppHeaderNav` and `AppHeaderLink` | A `SiteHeader` (that is for a public site) or a flex row per product |
| Navigation rows without a shell (a pane, a popover, a sheet) | `SidebarMenu` + `SidebarMenuButton size="touch"` (no provider needed) | A hand-made `nav-row` with its own current bar |
| Which mailbox, workspace or project you are in | `NavSwitcher` | A `Select`, a menu of links |
| Panes the person can resize | `ResizablePanelGroup` + `ResizableHandle label` | A hand-made drag handle, a library used directly |
| A settings dialog with a section rail, or many tabs on a phone | `Tabs orientation="vertical"`, `TabsList scrollable` | Wrapping tabs on two rows, a custom scroller |
| A file picker | `FileInput` | A bare `<input type="file">` showing the browser's own text |
| A search box | `SearchInput` (clear button, Escape, `shortcut`, `loading`) | An `Input` with a hand-placed icon and the browser's cancel button |
| A password | `PasswordInput` (reveal toggle, Caps Lock warning) | `type="password"` with a hand-made eye that changes its name |
| A number people step or type | `NumberField` (`min`, `max`, `step`, `format`, `unit`) | `type="number"` and its spinners |
| A value or range picked by feel (volume, price, quality) | `Slider` (`marks`, `showValue`; an array for a range) | `type="range"`, a `NumberField` when the exact number matters |
| A verification code | `InputOTP` (or its shadcn parts) | Six separate `Input`s with hand-written focus moves |
| A right-to-left interface (Arabic, Hebrew) | `dir="rtl"` on the root and `DirectionProvider direction="rtl"` around the app | Only `dir`, which leaves Base UI's sliders, menus and tabs reading left to right |
| A reply or prompt that grows with its text | `Textarea autoResize minRows maxRows` | A script that sets the height on every key |
| A date or a date range in a form | `DatePicker`, `DateRangePicker` (`name` posts `yyyy-mm-dd`) | `type="date"` (its popup cannot be styled or translated), a hand-made calendar |
| A month on show, to pick from in place | `Calendar` (`mode`, `selected`, `onSelect`, `disabled`) | A grid of buttons with its own keyboard |
| Rows people choose from (senders, accounts, files), one or several | `ListBox` (`selectionMode`, `onAction`, `getTextValue`; `virtual` for thousands) | Clickable `div`s, a `Table` with a click handler, a checkbox per row for a single choice |
| A long feed or log that would be thousands of DOM rows | `VirtualList` (rows of any height) or `ListBox virtual` | Rendering everything, an infinite scroll that never frees rows |
| The detail of the chosen row beside the list | `SidePanel` (resizable, a sheet below `sheetBelow`) | A `Card` in a grid column, a dialog for a detail that should stay visible |
| The actions of a row at the pointer | `ContextMenu` + the same actions in a visible menu or toolbar | A right-click as the only way to reach an action |
| Files dropped or chosen | `Dropzone` (`accept`, `maxSize`, `onFilesRejected`) | `react-dropzone`, a `div` that only listens to drops |
| A picture in the page | `Image` (`ratio`, `fit`, `caption`) or `AspectRatio` for other content | A bare `img` that jumps when it loads and leaves a broken icon |
| The pictures of a post or a message | `MediaGrid` + `ImageViewer` | A grid of identical cards, a lightbox library |
| People on a record | `AvatarGroup max` (+N; `size` sizes its avatars), `AvatarBadge` for presence, the names beside it (then the badge is decorative) | A row of faces with no names, a coloured ring as the only status |
| A video | `VideoPlayer` (`label`, `poster`, `tracks`; inside `ImageViewer` through `renderMedia`) | `<video controls>` (its controls cannot be styled or translated), a player library |
| A recording | `AudioPlayer` | `<audio controls>` |
| A GIF or a short silent loop | `AnimatedImage` (`type="video"` for MP4 or WebM, `"image"` for a GIF) | An `img` of a GIF that moves forever and cannot be paused |
| A spreadsheet or CSV someone attached | `Spreadsheet` + `readSpreadsheet` from `@fabrials/ui/spreadsheet` | A `Table` of thousands of rows, SheetJS, a download link as the only way to look |
| A form with subsections | `FieldSet` + `FieldLegend` + `FieldGroup` | A bordered box per subsection, a `div` with a bold label |
| Show or hide detail in place, with no state | `Disclosure` (native `details`) | A hand-styled `details`, an `Accordion` for one block |
| A destructive confirmation | `AlertDialog`, or `ConfirmDialog` for an async action, or `useConfirm()` to `await` one | `window.confirm` in a flow that can wait (a guard that must answer synchronously keeps it) |
| A state inside a drawer, popover, palette or list slot | `StatePanel size="sm"` (and `variant="inline"` inside an overlay) | A page-sized empty state in a 358 px pane |
| A slim notice at the top of a page or pane | `Alert layout="inline"` | A hand-made banner row |
| A tag whose colour is data (a label) | `Badge` with `--fui-badge-solid` and `dotColor` | A pill with a literal colour, a per-colour class |
| A date that must not drift (a list row) | `RelativeTime absoluteFormat timeZone` | A hand-made `Intl.DateTimeFormat` in a `time` |
| A shortcut hint that says Ctrl or the command key | `<Kbd mod />`, `useModifierKey()`; `KbdGroup sequence` for "g then i" | `navigator.platform` read while rendering |
| A short confirmation after an action | `toast` (mount `Toaster` once) | An alert that stays forever |
| A shell command | `Snippet`, or `PackageInstall` for package managers | A `pre` with a hand-made copy button |
| The product's mark | `ProductLockup`, `DitherGem` | A logo tinted with the gem everywhere |

## Controls

| Component | Use for |
| --- | --- |
| `Button` | Actions. Variants `default` (ink, the primary), `accent` (Stormlight, one per view), `outline`, `secondary`, `ghost`, `destructive`, `link`; sizes `default` (40 px), `xs`, `sm`, `lg`, `icon`, `icon-xs`, `icon-sm`, `icon-lg`; `loading` shows a spinner and blocks double presses |
| `Input`, `Textarea`, `Label` | Text fields and their names. A placeholder is not a name |
| `Field` | Wires a label, hint and error to one control through a render prop; validation stays in the host |
| `Checkbox`, `Switch` | A choice saved with a form; a setting that applies now |
| `Select` (`SelectTrigger`, `SelectValue`, `SelectContent`, `SelectItem`, `SelectGroup`, `SelectLabel`, `SelectSeparator`) | A closed list |
| `NativeSelect`, `NativeSelectOption`, `NativeSelectOptGroup`, `NativeCheckbox` (`indeterminate`, `label`) | Long lists, phones (platform picker), forms that work without JavaScript |
| `NativeRadioGroup` + `NativeRadio` (`label`; `layout="grid"` for swatches, `--fui-native-radio-min` on the group when the names are long) | Native radios in a fieldset with a legend; a disabled fieldset disables them |
| `IconButton` (`label`, `tooltip`, `shortcut`, `textName`) | An icon-only button: 44 px, named, with a tooltip; a Base UI trigger can `render` it |
| `Toolbar`, `ToolbarGroup`, `ToolbarSeparator`, `ToolbarButton` (`reveal`, `tier`) | One tab stop for a row of buttons; arrows, Home and End; labels appear and low-priority actions fold into a menu as the toolbar narrows |
| `FileInput` (`label`, `onFilesChange`, `fileName`, `onClear`, `description`, `error`) | A file picker that is a button; the browser's "Choose File" is never shown |
| `SearchInput` (`onValueChange`, `onClear`, `clearLabel`, `shortcut`, `loading`, `size`) | Search: a magnifier, a clear button with text; Escape clears first, then belongs to the page |
| `PasswordInput` (`showLabel`, `capsLockLabel`, `autoComplete`, `size`) | Passwords: a reveal toggle with a fixed name (`aria-pressed`), a Caps Lock warning, hidden again on submit |
| `NumberField` (`min`, `max`, `step`, `largeStep`, `format`, `locale`, `unit`) | Numbers on Base UI: steppers set into the well, tabular mono value, Home and End to the limits |
| `Slider` (`aria-label` or `thumbLabels`, `marks`, `showValue`, `orientation`) | A value or a range: sunken track, Stormlight fill, raised fader cap, ruler marks |
| `InputOTP` (`length`, `validationType`, `onValueComplete`; `InputOTPGroup`, `InputOTPSlot`, `InputOTPSeparator`) | One-time codes on Base UI's OTP field: paste and autofill fill every slot |
| `Textarea` (`autoResize`, `minRows`, `maxRows`) | Multi-line text; `autoResize` grows with the text, then scrolls |
| `Dropzone` (`accept`, `multiple`, `maxSize`, `maxFiles`, `onFilesChange`, `onFilesRejected`, `error`; `acceptsFile`, `sortFiles`) | Dropped or chosen files; the file input sits in the button inside the well, refusals carry type, size or count |
| `Calendar` (`mode` single or range, `selected`, `onSelect`, `disabled` matchers, `numberOfMonths`, `locale`, `today`) | A six-week grid with react-day-picker's prop names; arrows, Home, End and Page keys; today a Stormlight tick |
| `DatePicker`, `DateRangePicker` (`value`, `onValueChange`, `disabledDates`, `format`, `name`, `clearable`) | A field-like trigger that opens the calendar; `toISODate` and `parseISODate` convert local days |
| `FieldSet`, `FieldLegend`, `FieldGroup` | Grouped fields on a real fieldset; a legend styled as a subsection title with a hairline above; `layout="columns"` reflows by container |
| `RadioGroup` + `RadioGroupItem` (or `Radio`) | One visible choice inside a form |
| `ToggleGroup` + `ToggleGroupItem` (`size` `sm`, `default`, `lg`) | A segmented view or range next to what it changes; 44 px hit area on touch (`size="lg"` paints the whole height). A single-choice group slides one indicator to the pressed item |
| `ThemeSwitcher` (`size`) | System, light or dark; the host stores the choice and sets the root class |
| `MultiSelect` | Several values, for filters: a listbox with checkbox rows; the trigger sums them up (one name, or the first and a count) |
| `Combobox` | A text field filtering known values |
| `FilterChip` | An active filter: name and value, and its own clear key (`href` or `onRemove`); focus moves on when one goes |
| `InputGroup` (`InputGroupAddon`, `InputGroupInput`, `InputGroupTextarea`, `InputGroupText`, `InputGroupButton`) | A field with an attached addon or action |
| `ButtonGroup` (`ButtonGroupText`, `ButtonGroupSeparator`) | Actions on the same subject; not a way to save space |

```tsx
<Toolbar aria-label="Message actions" variant="bar" sticky>
  <ToolbarGroup aria-label="Respond">
    <ToolbarButton label="Reply" variant="secondary" reveal="early"><Reply aria-hidden /></ToolbarButton>
    <ToolbarButton label="Forward" reveal="middle" tier="low"><Forward aria-hidden /></ToolbarButton>
  </ToolbarGroup>
  <DropdownMenu>
    <DropdownMenuTrigger render={<ToolbarButton label="More actions" tier="overflow"><Ellipsis aria-hidden /></ToolbarButton>} />
    <DropdownMenuContent align="end">{/* the low tier, as menu items */}</DropdownMenuContent>
  </DropdownMenu>
</Toolbar>
<IconButton label="Search" shortcut={["Ctrl", "K"]}><Search aria-hidden /></IconButton>
<FileInput label="Choose a file" onFilesChange={setFiles} description="PDF, up to 5 MB." />
```

```tsx
<Field label="Proxy key name" description="Shown in usage reports." error={error}>
  {(props) => <Input {...props} value={name} onChange={(e) => setName(e.target.value)} />}
</Field>
<Button loading={saving} type="submit">Save key</Button>
```

## Overlays

| Component | Use for |
| --- | --- |
| `Dialog` (`DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogBody`, `DialogFooter`, `DialogActions`, `DialogClose`) | A modal task with a title and explicit actions. A `DialogBody` between header and footer gives a fixed header and footer with one scroller (a long title wraps, the primary action never scrolls away); `close="footer"` puts Close first in the footer (`closeVariant="outline"` on the content, or on one `DialogFooter`, when the product's secondary actions are outlines); in a window under 30rem tall the footer publishes its height so a focused field is never scrolled under it; `size` `wide`, `settings` or `full-narrow` (whole screen on a phone); `keepMounted` keeps typed text. Escape during an IME composition does not close it |
| `AlertDialog` (`AlertDialogTrigger`, `AlertDialogContent`, `AlertDialogTitle`, `AlertDialogDescription`, `AlertDialogCancel`, `AlertDialogAction`, `AlertDialogClose`) | Confirming a destructive or hard-to-undo action; the confirm button names the consequence |
| `ConfirmDialog`, `ConfirmActionButton` | Confirm, then run an async action with a pending state and an inline error; `finalFocus` names where focus goes (its function gets `"confirmed"` or `"dismissed"`), for an action that removes its trigger |
| `ConfirmProvider`, `useConfirm` | `const yes = await confirm({ title, description, destructive })`; mount the provider once. Without it the hook is `window.confirm`. Not for back, forward or unload guards |
| `Sheet` (`SheetTrigger`, `SheetContent side="left", "right", "start" or "end"` (the last two follow the writing direction), `SheetHeader`, `SheetTitle`, `SheetDescription`, `SheetBody`, `SheetFooter`) | Filters, a quick record view, phone navigation. `<Sheet modal={false}>` is a drawer beside the page (no scrim, no trap, an outside press keeps it open) for tools that stay open while people work; `SheetContent padding="none"`. A drawer under a header: `container` (hold the element in state), `initialFocus={false}`, `--fui-sheet-inset-block-start`, `--fui-sheet-z` and `--fui-sheet-width` on the content, and `<Sheet closeOnEscape="focus-inside">` so Escape closes it only from inside |
| `DropdownMenu` (`DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuCheckboxItem`, `DropdownMenuRadioGroup`, `DropdownMenuRadioItem`, `DropdownMenuLabel`, `DropdownMenuSeparator`, `DropdownMenuShortcut`, `DropdownMenuSub`, `DropdownMenuSubTrigger`, `DropdownMenuSubContent`) | Actions for one record, from a button that names it |
| `Tooltip` (`TooltipProvider`, `TooltipTrigger`, `TooltipContent`) | The name of an icon button, repeated for sighted users |
| `Popover` (`PopoverTrigger`, `PopoverContent` (`keepMounted`), `PopoverHeader`, `PopoverTitle`, `PopoverDescription`) | One small anchored choice |
| `StatusPopover` | A one-sentence status in a header or toolbar (an icon, or an icon and a word, with `attention` `warning` or `danger`) that opens a popover with what to do about it; `compact` hides the word and keeps it in the name |
| `HoverCard` (`HoverCardTrigger`, `HoverCardContent`) | A preview whose content is also reachable by keyboard |
| `Command`, `CommandDialog` (`CommandInput`, `CommandList`, `CommandEmpty`, `CommandGroup`, `CommandItem`, `CommandShortcut`, `CommandSeparator`) | The Ctrl/Cmd K palette over real destinations (put a `Command` inside `CommandDialog`; 6 px corners, the selected row has the 2 px bar) |
| `CommandTrigger` (`keys={["mod", "K"]}`, `compact`, `fit` for the width of its content in a group of automatic width (the actions of `SiteHeader` do it by themselves, icon only under 40rem), `variant`: `outline` for a launcher that looks like a field), `CommandOptionList`, `CommandOption` (`active`, `disabled`, `detail`, `group`, `reason`, `keys`) | The launcher of a palette (icon-only in the header's command slot under 12rem) and the rows of a palette you drive yourself with `aria-activedescendant`; a disabled row stays selectable so it can say why |

Triggers take `render` to become a Fabrials button: `<DialogTrigger render={<Button variant="outline" />}>Rename</DialogTrigger>`.

## Collections and content

| Component | Use for |
| --- | --- |
| `Table` (`TableHeader`, `TableBody`, `TableFooter`, `TableRow`, `TableHead`, `TableCell`, `TableCaption`) | Records. `aria-label` names the scroll region; `numeric` right-aligns figures; `stickyHeader` for long tables |
| `ListBox` (`items`, `getKey`, `renderItem`, `selectionMode`, `selected`, `onAction`, `getTextValue`, `isDisabled`, `virtual`, `height`, `empty`) | Rows people choose from: one tab stop, arrows, Home, End, Page keys, type-ahead; rows are Item rows; `virtual` draws only what is on screen |
| `VirtualList` (`items`, `getKey`, `renderItem`, `estimateSize`, `height`) | A plain list of thousands of rows of any height, measured as they appear |
| `ContextMenu` (`ContextMenuTrigger`, `ContextMenuContent`, `ContextMenuItem` and the rest of shadcn's parts) | A row's actions at the pointer, the Menu key or Shift+F10; never the only way to an action |
| `SidePanel` (`SidePanelHeader`, `SidePanelTitle`, `SidePanelClose`, `SidePanelBody`, `SidePanelFooter`; `width`, `minWidth`, `maxWidth`, `sheetBelow`) | The detail beside a list: docked, resizable from its edge, a modal sheet on a phone |
| `Spreadsheet` (`workbook`, `sheet`, `height`, `locale`); `readSpreadsheet`, `readXlsx`, `csvToSheet`, `SpreadsheetError` from `@fabrials/ui/spreadsheet` | A read-only workbook: sticky letters and row numbers, frozen panes, merged cells, the address bar, sheet tabs, only the visible cells drawn; files read in the browser with no dependency |
| `Tabs` (`TabsList`, `TabsTrigger`, `TabsContent`) | Peer panels on one page; not steps. `orientation="vertical"` is a rail (sidebar surface, 2 px Stormlight bar); `TabsList scrollable` (`true`, or `"narrow"` below 48rem) is one line that scrolls, snaps and keeps the selected tab in view |
| `ItemGroup`, `Item` (`stretch`, `current`, `selected`, `unread`), `ItemLink`, `ItemMedia`, `ItemContent`, `ItemTitle`, `ItemDescription`, `ItemActions`, `ItemControl`, `ItemCheck`, `ItemUnread`, `ItemHeader`, `ItemFooter`, `ItemSeparator` | Records as rows: one stretched target, controls above it, a soft Stormlight fill and 2 px bar for the open record, the focus ring inside the row, the actions wrapping under the text in a narrow list |
| `Badge` | A short status or fact as a soft 6 px tag tinted by its tone, with a round dot: `tone` `neutral`, `info`, `success`, `warning`, `danger`; `variant` `soft`, `outline` (facts such as a license or version), `solid`; `size` `sm`, `default`, `lg` (18, 20, 24 px); `dot` (`"hollow"` for an archived item) with `pulse` while live, `dotColor`, `truncate`; an icon child is 12 px, a number on its own a centred count; `render` for a tag that is a link or a button (`aria-pressed` for a label filter); `--fui-badge-solid` (tint, hairline, dot) and `--fui-badge-ink` (text) are public properties for a tag coloured by data, set on the badge itself (a class or `style`) |
| `Alert` (`AlertTitle`, `AlertDescription`, `AlertAction`) | A status that stays on the page: `variant` `default`, `info`, `success`, `warning`, `destructive`; `layout="inline"` for a one-line notice from 48rem of its own width (fills its container; not for status that refreshes) |
| `Card` (`CardHeader`, `CardTitle`, `CardDescription`, `CardAction`, `CardContent`, `CardFooter`, `CardCaption`) | A plate: one bounded summary, a panel around a chart (square, hairline, no shadow). `CardCaption` is the mono caption strip at its foot. Not for lists of peers, not nested |
| `DescriptionList` (`DescriptionItem`, `DescriptionTerm`, `DescriptionDetails`) | A record's properties; `layout="auto"` stacks under 30rem of its own width |
| `Disclosure`, `DisclosureSummary` (`count`, `chevron`, `size`), `DisclosurePanel` | A native `details`: 44 px summary, count in its name, panel always mounted, opens itself on an invalid field, no JavaScript |
| `Accordion`, `Collapsible` | Short answers in place; reasoning, sources or long detail behind a named trigger. `Accordion variant="rows"` with `AccordionTrigger` `icon`, `aside` (tags outside the trigger), `headingLevel`, `headingRef` is a stack of independent tools whose bodies stay mounted |
| `ScrollArea` (`fade`), `ScrollBar` | A region that scrolls without moving the page, only when that part must stay in place: a tab stop with its own ring while it overflows (name it), a slim round thumb, `fade` for edges with more behind them; `<ScrollBar orientation="horizontal" />` inside for a row |
| `Loading`, `placeholderText`, `placeholderList`, `useLoading` | Paints the real components it wraps as their skeleton while `when` is true; placeholder copy and records; a hook for "inside a loading view" |
| `Skeleton`, `Separator` | A block only where no component exists yet; a decorative break |
| `Progress` (`ProgressLabel`, `ProgressValue`, `ProgressTrack`, `ProgressIndicator`) | A task that finishes: `label` names it and shows the value, `hint` gives counts and the time left, `tone` says how it ended; `size` `sm`, `default`, `lg` (4, 6, 8 px); `steps` for a task of known steps; `variant="ring"` (16, 24, 48 px) for a small place; no `value` while the total is on its way (the working light crosses it). 0 to 100 by default; pass `locale` with the page's language |
| `Avatar` (`AvatarImage`, `AvatarFallback`), `avatarInitials`, `avatarTint` | A person or account; `avatarInitials(name or address)` is the fallback text, on a tint of one of the five data hues picked from it (`tint={false}` for the neutral surface) |
| `FileSize`, `formatBytes` | A byte count as people read it ("25 MB"); `FileSize` never throws while rendering |
| `FileThumb`, `fileTypeLabel` | File previews and type tiles |
| `TruncatedText` | One line that shows its full text in a tooltip only when cut |
| `groupByRecency`, `RECENCY_LABELS` | Grouping a history by Today, Yesterday, Previous 7 days… |

```tsx
<Badge tone="success" dot>Synced</Badge>
<Badge variant="outline">MIT</Badge>
<StatusDot tone="warning" label="Needs a refresh" />
```

## Navigation

| Component | Use for |
| --- | --- |
| `SiteHeader` | The top bar of a public site (see layout.md) |
| `AppHeader` (`AppHeaderBrand`, `AppHeaderLogo`, `AppHeaderNav`, `AppHeaderLink`, `AppHeaderAction`, `AppHeaderLabel`, `AppHeaderCaret`, `AppHeaderPlaceholder`) | The top bar of an application: one 56 px row, no blur; modes follow the header's own width (48rem, 72rem, wrap at 19rem); the command slot is the container `command` with a definite width |
| `NavSwitcher` (`NavSwitcherTrigger`, `NavSwitcherContent`, `NavSwitcherItem`, `NavSwitcherSeparator`) | "Where am I": a trigger with mark, title, description and tag, and a popover that is a `nav` list of links with `aria-current`, a status per item and a footer; `layout="block"` or `"inline"`; `contain={false}` lets its mark follow an ancestor container named `nav-switcher` (your pane) instead of its own trigger |
| `ResizablePanelGroup`, `ResizablePanel`, `ResizableHandle` (`label`), `useResizableGroupRef` | Resizable panes: a hairline with a 3 px Stormlight line on hover, drag and focus; save in `onLayoutChanged` when `meta.isUserInteraction` (a double click reset counts) |
| `NavigationMenu` (`NavigationMenuList`, `NavigationMenuItem`, `NavigationMenuTrigger`, `NavigationMenuContent`, `NavigationMenuLink`) | Grouped top-level links on public sites |
| `Sidebar` family (`SidebarProvider`, `Sidebar`, `SidebarHeader`, `SidebarContent`, `SidebarGroup`, `SidebarGroupLabel`, `SidebarGroupContent`, `SidebarMenu`, `SidebarMenuItem`, `SidebarMenuButton`, `SidebarMenuBadge`, `SidebarMenuSub`, `SidebarFooter`, `SidebarRail`, `SidebarTrigger`, `SidebarInset`, `SidebarMenuSkeleton`) | Persistent app navigation; a sheet below 768 px. The menu parts work without a provider: `size="touch"` is a 44 px row, the count goes inside the link. `SidebarProvider` takes `keyboardShortcut` (ignored in editors) and `persist`; `Sidebar labels`, `SidebarTrigger label` and `SidebarRail label` are for translation |
| `Breadcrumb` (`BreadcrumbList`, `BreadcrumbItem`, `BreadcrumbLink`, `BreadcrumbPage`, `BreadcrumbSeparator`, `BreadcrumbEllipsis`) | Where the page sits; also as `PageHeader` `eyebrow` |
| `NavTabs`, `NavTab` | Linked sections of one record (`current`, `count`) |
| `Pagination` (`PaginationContent`, `PaginationItem`, `PaginationLink`, `PaginationPrevious`, `PaginationNext`, `PaginationEllipsis`) | Numbered pages, only when numbers mean something |
| `Kbd` (`mod`), `KbdGroup` (`sequence`, `separator`), `useModifierKey` (a control's `shortcut` takes `{ keys, sequence: true }` for a sequence) | Flat shortcut hints; `mod` and the hook print Ctrl on the server and the command key on Apple after hydration; a sequence puts a translatable word between keys |

## Composition and feedback

| Component | Use for |
| --- | --- |
| `Spinner` (`variant` `ring`, `dots`, `bars`, `grid`, `line`) | An indeterminate wait, with text saying what is happening; square cells that light in turn, and a `line` as wide as a word for a row or a table cell |
| `ShimmerText` (`tone`, `variant` `band`, `letters`) | A short pending label (plain text under reduced motion); `tone="light"` crosses it with the working light for an agent at work; `letters` steps the light a letter at a time, for reading and indexing |
| `ScrambleText`, `useScramble` | Words that change in place (a step, a status, a heading): the new text scrambles into place once, never looping |
| `Toaster`, `toast` | A completed action; mount `Toaster` once |
| `Snippet`, `CopyButton` | Commands with copy; long lines wrap with a hanging indent |
| `Carousel` (`CarouselContent`, `CarouselItem`, `CarouselPrevious`, `CarouselNext`) | A sideways list of peers such as citations |

## Metrics

| Component | Use for |
| --- | --- |
| `Stat`, `StatGroup` | A figure (40 px condensed, label in mono) with `unit`, `delta`, `trend`, `deltaTone`, `hint`, optional `sparkline`, `meter={{ value, max, label }}` (a ruler under it), `loading` |
| `SeriesChart` | Bar or line charts over one series contract, with a legend and an accessible table (`caption` required, and the plot's accessible name); the plot is a tab stop with a visible 2 px ring and the arrows move the tooltip. Bars are dithered by default (Stormlight, then ink at half and a quarter); `color` on a series or `texture="solid"` keeps hues |
| `Sparkline` | Shape only, next to its number |
| `Meter` | A level that stays (quota, budget); warns at 75 % and 90 % by default. `variant="ruler"`: a scale of ticks inked to the value with a Stormlight mark (`ticks`, 40) |
| `Readout` | A reading in the label voice (sync time, version, peak, id) that settles when its `value` changes; reads the final text to assistive technology |
| `StatusDot` | A state as a dot and a word; `pulse` only while something is live or in progress |
| `ActivityStrip`, `activityLevel` | Intensity cells (posts per day or hour) |
| `Timeline`, `TimelineItem` | An event feed, newest first; `fresh` highlights a new item once |
| `RelativeTime`, `formatRelativeTime`, `formatAbsoluteTime` | "3 minutes ago" with the exact date in a `time` element; `absoluteFormat` (options or a per-date function), `now` (fixed number stops the timer) and `timeZone` make it deterministic and hydration-exact |
| `NumberTicker` | A total that counts up once; jumps under reduced motion |

Chart colours come from `--chart-1` to `--chart-6`; the first series reads as Stormlight.

```tsx
<StatGroup>
  <Stat label="Requests" value="48,210" delta="+3.1%" trend="up" hint="vs previous 7 days" />
  <Stat label="Tokens" value="92.4" unit="M" delta="−1.8%" trend="down" deltaTone="neutral" hint="vs previous 7 days" />
</StatGroup>
```

## Page patterns

| Component | Use for |
| --- | --- |
| `WorkspaceShell` | App shell with `navigation` and `header` slots and a skip link |
| `PageHeader` | `title`, `description`, `actions`, `eyebrow` (sentence-case context such as a breadcrumb); `headingLevel`, `headingRef`, `headingProps` when a page above owns the h1 or code moves focus to the heading |
| `SectionHeader` | `title`, `description`, `actions` for a section; `aside` puts a count or status tag beside the title, outside the heading; the same heading controls |
| `CollectionToolbar` | `search`, `filters`, `actions`, with a group `label` |
| `BulkActions` | `count` and actions; renders nothing until `count` is at least 1, or with `keepMounted` keeps the region (hidden actions, a visually hidden status that announces the first selection). When the status and the actions sit in different places (the status in a title row beside select-all, the actions in a form under it), lay them out with `BulkActionsRoot` (`count`, `keepMounted`, `regionLabel`), `BulkActionsStatus` and `BulkActionsContent` (`hidden`) |
| `StatePanel` | `state` `loading`, `empty`, `error`, `stale`, `offline`, `success`; `title`, `description`, `actions`; `align` `start` (default) or `center`; `size="sm"` (16 px, for embedded regions), `variant="inline"` (no border or tint, for overlays), `fill` (fills a region with a height and centres) |
| `SettingsSection` | A settings row: `title`, `description`, `status`, controls as children; two columns from 36rem of its OWN width (`layout="stacked"` opts out), so it is right in a sheet, a dialog and a page; `headingLevel`, `headingRef`, `headingProps` |
| `SuggestionCard`, `SuggestionGrid` | Prompts in an empty chat or workspace (grid on wide screens, a scroll row on narrow) |
| `AuthLayout` | Sign-in, and the page's `<main>` (0.9): `brand`, `title`, `description`, form as children, `footer`, `aside`, `actions` (a corner control after the card in the DOM), `align` (`auto`: the card anchors to the start beside an aside, centres without one), `as="div"` where the host already has a `<main>`, other props (`id`, `aria-*`) on the landmark |

```tsx
<PageHeader
  eyebrow={<Breadcrumb>…</Breadcrumb>}
  title="Proxy keys"
  description="Keys that route requests through this relay."
  actions={<Button>Create key</Button>}
/>
<CollectionToolbar
  label="Key filters"
  search={<Input type="search" aria-label="Search keys" placeholder="Search keys…" />}
  filters={<ToggleGroup aria-label="Status" value={[status]} onValueChange={(v) => v[0] && setStatus(v[0])}>…</ToggleGroup>}
/>
<BulkActions count={selected.length}><Button variant="destructive" size="sm">Revoke keys</Button></BulkActions>
{rows.length ? <Table aria-label="Proxy keys">…</Table> : (
  <StatePanel state="empty" title="No proxy keys yet" description="Create a key to route requests through this relay." actions={<Button>Create key</Button>} />
)}
```

## Documentation pieces

| Component | Use for |
| --- | --- |
| `CodePanel` | A sample with `title` (file name), `language`, `lineNumbers`, `highlightLines`, `addedLines`, `removedLines`, `highlightWords`, `copyValue`; `bare` for inline; Shiki output as children replaces the built-in highlighter. `CodeLines` is its highlighted `code` element alone, for a frame of your own |
| `CodeTabs` | Several versions of one sample (`items` with `value` and `label`) |
| `PackageInstall` | One command for npm, pnpm, yarn and bun; the choice is shared by the page. `command` without the runner, `kind="install"` for a package |
| `Files`, `Folder`, `File` | A file tree; `note`, `highlighted`, `defaultOpen` |
| `RepoInfo` | A GitHub repository link with stars and forks the host fetched |
| `highlightCode`, `packageCommand` | The pure helpers behind them (server-safe). The highlighter reads TS/JS/JSX, JSON, shell, CSS, HTML, Python, Rust, Go, SQL, YAML, TOML and diffs |
| `LanguageIcon` (`language`), `languageMark` | A language's logo in its own colour, as CodePanel, CodeTabs and CodeBlock show it before the name; decorative, so the name or file always goes beside it. A plain glyph for SQL, JSON and languages without a shareable logo |

```tsx
<PackageInstall command="shadcn@latest add @fabrials/button" />
<CodePanel title="app/globals.css" language="css" code={css} highlightLines={[3]} />
<Files>
  <Folder name="components" defaultOpen>
    <File name="button.tsx" note="shim" highlighted />
  </Folder>
</Files>
```

## Brand

| Component | Where | Rules |
| --- | --- | --- |
| `DitherScene` | Landing hero (`variant="full"` inside a captioned plate with `CornerMarks`, or `variant="hero"` across the section), sign-in (`variant="full"` or inside `AuthLayout` `aside`) | Absolute: the parent is positioned. Text on the calm side or a solid surface. `reveal` once (default 1200 ms), `reveal={0}` turns it off. `seed`, `cell` |
| `CornerMarks` | Brand moments only: the hero figure of a landing, a figure on a sign-in or public stats page | Wraps one child; decorative crosses on its corners, never focusable |
| `WorkingLight` | The light of work: a band that turns along the edge of the surface an agent works on, with a soft bloom outside | Render it only while something works, as the last child of a positioned surface; decorative (say the state in words too); a still edge under reduced motion, hidden in forced colors |
| `GridGuides` | Behind a landing hero | First child of a positioned section; 12 dashed column guides on `--fui-page-padding`; hidden under 768 px, in forced colors and print |
| `DitherBand` | Above one heading that carries the brand | One per view; height from `--fui-band-height` (4.5rem); on a card set `--fui-dither-bg: var(--card)` |
| `DitherGem` | Product mark in navigation, index rows, empty states; large beside a hero | `gem`, `size` 16, 20, 28 or 40; decorative, always next to the product name |
| `ProductLockup` | Product name with its gem in headers, sidebars, sign-in | `product`, `tagline`, `gem`, `size` `sm`, `md`, `lg`, `mark` |
| `FabrialsGem` | The faceted SVG gem (what `ProductLockup` draws) | `title` gives it a name; without it it is decorative |
| `DitherCanvas` | The engine for a product's own field (X Tracker's telemetry, Radiant's night sky) | `ramp`, `field`, `order="ramp"`, `cell`, `reveal`, `paintKey`; paints once, never loops |

Pure helpers in `@fabrials/ui/dither`: `paintRampField`, `STORM_RAMP`, `gemRamp`, `GEM_HEX`, `stormField`, `stormBandField`, `gemField`, `fbm`, `valueNoise`, `DITHER_BACKGROUND`. Gem names: `stormlight`, `heliodor`, `sapphire`, `ruby`, `emerald`, `zircon`, `smokestone`, `amethyst`.

`MoonPhase` and `Starfield` are the only sanctioned glow and continuous motion outside work, for sign-in and landing surfaces only; they stop under reduced motion. The working light is the other one, and only while something works.

## `@fabrials/ai-ui`

Presentational only: the host supplies data, rendering, uploads, transcription and network. Import its CSS.

| Component | Use for |
| --- | --- |
| `ChatMessage` (`from` `user`, `assistant`, `system`; `actions`; `streaming`), `MessageActions`, `MessageAction`, `CopyMessageAction`, `MessageTimestamp` | A turn with its actions; while an answer arrives, `streaming` ends it in a caret of the working light and makes it `aria-busy` |
| `ChatComposer` (`onSubmit`, `status` `ready`, `submitting`, `streaming`, `onStop`, `tools`, `attachments`, `working`), `ComposerToggle`, `ComposerButton` | The message field; the working light runs along its edge while the agent answers |
| `CodeBlock` (`code`, `language`, `filename`, `lineNumbers`, `highlightLines`, `addedLines`, `removedLines`, `highlightWords`, `wrap`, `download`, `actions`) and the `.fui-markdown` class | The code in an answer, highlighted in CodePanel's inks on its plate, with copy and download; `.fui-markdown` styles the rest of rendered markdown (task lists, keys, marks, tables, footnotes, details). Map a renderer's fenced code to `CodeBlock`; name a task's box with a `label` |
| `CitationProvider`, `CitationChip`, `Sources`, `SourceCard`, `SourceFavicon`, `LinkWithPreview`, `LinkPreviewCard` | Numbered citations and their sources |
| `ActivityDisclosure`, `ReasoningDisclosure`, `SearchStepsDisclosure`, `ActivityIcon` | Reasoning, search steps and tool activity inside an answer; while live the label carries the working light and the time counts (`timer`, `startedAt`) |
| `AgentThinking` (`activity` `thinking`, `searching`, `reading`, `writing`, `running`, `rendering`, `uploading`; `label`, `status` `working`, `done`, `failed`, `tone`, `timer`, `startedAt`, `endedAt`), `AgentMark` (`variant`, `outcome`) | The line that says an agent is working on a reply, with a mark per kind of work so the states read apart at a glance, settling on a tick or a cross; the mark alone for a dense row |
| `TaskList` (`tasks` with `status` `pending`, `running`, `done`, `failed`, `skipped`, `detail`, `meta`, `activity`; `title`, `labels`) | The steps of an agent's plan as they are worked through; the running step shows the mark of its kind of work |
| `SourceTally` (`sources`, `label`, `max`, `faviconUrl`) | The sources a search has found so far, with an `AgentThinking activity="searching"` beside it; `Progress variant="scan"` under a search field while results load |
| `GenerationFrame` (`status` `queued`, `generating`, `done`, `failed`; `effect` `ripple`, `refine`, `scan`; `kind` `image`, `document`; `progress`, `src`, `alt`, `aspectRatio`, `error`, `children`) | A picture or a document being made, and what arrives |
| `ContextMeter` (`parts`, `limit`, `warnAt`, `dangerAt`, `format`, `unit`) | How full an agent's context window (or any budget) is |
| `Attachments` (`variant`, `size`), `AttachmentChip` | Files on a message or in a composer; an upload with `progress` draws its ring and counts |
| `VoiceInputButton`, `VoiceInputButtonView` | Dictation; the microphone is requested only after a press |
| `ProviderIcon`, `providerBrand` | Marks of AI providers and coding agents; third-party marks keep their colours |
| `ProviderCard`, `BalanceCard`, `ResetInventory`, `ObservationStatus`, `RoutingExplanation`, `RoutingPolicyForm` | Provider accounts, balances, resets, routing |
| `SynchronizedAccounts`, `LinkedAccountUsage`, `ConsumptionView`, `SynchronizedConsumption`, `PrivateHistoryView` | Usage and history presentation |
| `ApiKeyForm`, `ApiKeyFields`, `HostedMigration`, `MigrationReviewDetails` | Key enrolment and hosted migration |

```tsx
import { ChatComposer, ChatMessage, CopyMessageAction, MessageActions } from "@fabrials/ai-ui";

<ChatMessage from="assistant" actions={<MessageActions><CopyMessageAction text={text} /></MessageActions>}>
  <div className="fui-markdown">{rendered}</div>
</ChatMessage>
<ChatComposer status={status} onSubmit={send} onStop={stop} placeholder="Ask about this account" />
```

## Registry blocks: WebMCP and MCP

Installed as source by the shadcn CLI (`npx shadcn@latest add @fabrials/<name>`); they build on `@fabrials/ui`. Import from where the CLI writes them.

| Name | Exports | Installed at |
| --- | --- | --- |
| `webmcp-provider` | `WebMCPProvider`, `useWebMCP`, `useWebMCPTool` | `lib/webmcp/provider.tsx` |
| `webmcp-form` | `WebMCPForm`, `toolField` | `lib/webmcp/form.tsx` |
| `support-badge` | `SupportBadge` | `components/webmcp/support-badge.tsx` |
| `comparison` | `Comparison` | `components/webmcp/comparison.tsx` |
| `action-button` | `ActionButton` | `components/webmcp/action-button.tsx` |
| `arguments-form` | `ArgumentsForm` | `components/webmcp/arguments-form.tsx` |
| `data-explorer` | `SearchFilter`, `DataTable` | `components/webmcp/data-explorer.tsx` |
| `date-range` | `DateRangePicker` | `components/webmcp/date-range.tsx` |
| `wizard` | `Wizard` | `components/webmcp/wizard.tsx` |
| `confirmation-dialog` | `ConfirmationDialog` | `components/webmcp/confirmation-dialog.tsx` |
| `mcp-client` | `MCPProvider`, `useMCPClient`, `BrowserOAuthProvider` | `lib/mcp/provider.tsx`, `lib/mcp/oauth.ts` |
| `connection-panel` | `ConnectionPanel` | `components/webmcp/connection-panel.tsx` |
| `tool-catalog`, `tool-detail` | `ToolCatalog`, `ToolDetail` | `components/webmcp/tool-catalog.tsx` |
| `result-view` | `ResultView` | `components/webmcp/result-view.tsx` |
| `execution-log` | `ExecutionLog` | `components/webmcp/execution-log.tsx` |
| `elicitation-dialog` | `ElicitationDialog` | `components/webmcp/elicitation-dialog.tsx` |
| `resource-explorer` | `ResourceExplorer`, `PromptCatalog` | `components/webmcp/resource-explorer.tsx` |
| `mcp-dashboard` | `MCPDashboard`, `MCPDashboardContent` | `components/webmcp/mcp-dashboard.tsx` |
| `server-connector` | `createConnector` | `lib/mcp-server/connector.ts` |

```tsx
import { WebMCPProvider } from "@/lib/webmcp/provider";
import { MCPDashboard } from "@/components/webmcp/mcp-dashboard";

<WebMCPProvider>{app}</WebMCPProvider>   // tools registered with useWebMCPTool; people keep the same controls
<MCPDashboard defaultEndpoint="https://mcp.example.com/mcp" />
```

Rules from the repository: human use works without WebMCP; one state serves the person's controls and the agent's tools; tool mutations are never replayed silently; browser tokens stay in memory.

## Shims and other libraries

- **Shims** (`button`, `dialog`, `select`, `table`, `sidebar`, …; list in `apps/site/lib/shims-index.generated.ts`) install under shadcn's paths and re-export Fabrials controls.
- **Other libraries** are not offered through the registry. Use the Fabrials piece (`Files` for a file tree, `ActivityStrip` for a contribution graph, `Timeline` for an event list, `Dropzone` for dropped files). When a product needs something only another library has, adopt it into the package first, in the Fabrials style; never install another library's styled components into a product.
