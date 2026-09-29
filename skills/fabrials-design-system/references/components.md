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
| A quota or budget | `Meter` | `Progress` (that is for a task that finishes) |
| A settings row | `SettingsSection` | A `Card` per setting |
| A choice that applies now | `Switch` | A checkbox that saves immediately |
| A view or range switch next to what it changes | `ToggleGroup` | Tabs, a select |
| Peer views of one subject on one page | `Tabs` | `NavTabs` |
| Sections of a record, each with its URL | `NavTabs` + `NavTab` | `Tabs` |
| An icon-only action | `IconButton` (a name, a tooltip, 44 px) | An icon `Button` with a `title` or no name |
| Several actions in one row that people arrow through | `Toolbar` + `ToolbarButton` (one tab stop) | A row of tabbable buttons in a `div role="group"` |
| A file picker | `FileInput` | A bare `<input type="file">` showing the browser's own text |
| A form with subsections | `FieldSet` + `FieldLegend` + `FieldGroup` | A bordered box per subsection, a `div` with a bold label |
| Show or hide detail in place, with no state | `Disclosure` (native `details`) | A hand-styled `details`, an `Accordion` for one block |
| A destructive confirmation | `AlertDialog`, or `ConfirmDialog` for an async action | `window.confirm` |
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
| `NativeRadioGroup` + `NativeRadio` (`label`; `layout="grid"` for swatches) | Native radios in a fieldset with a legend; a disabled fieldset disables them |
| `IconButton` (`label`, `tooltip`, `shortcut`, `textName`) | An icon-only button: 44 px, named, with a tooltip; a Base UI trigger can `render` it |
| `Toolbar`, `ToolbarGroup`, `ToolbarSeparator`, `ToolbarButton` (`reveal`, `tier`) | One tab stop for a row of buttons; arrows, Home and End; labels appear and low-priority actions fold into a menu as the toolbar narrows |
| `FileInput` (`label`, `onFilesChange`, `fileName`, `onClear`, `description`, `error`) | A file picker that is a button; the browser's "Choose File" is never shown |
| `FieldSet`, `FieldLegend`, `FieldGroup` | Grouped fields on a real fieldset; a legend styled as a subsection title with a hairline above; `layout="columns"` reflows by container |
| `RadioGroup` + `RadioGroupItem` (or `Radio`) | One visible choice inside a form |
| `ToggleGroup` + `ToggleGroupItem` (`size` `sm`, `default`, `lg`) | A segmented view or range next to what it changes; painted 44 px on touch at every size |
| `ThemeSwitcher` (`size`) | System, light or dark; the host stores the choice and sets the root class |
| `MultiSelect` | Several values, for filters |
| `Combobox` | A text field filtering known values |
| `FilterChip` | An active filter with a clear action (`href` or `onRemove`) |
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
| `Dialog` (`DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`, `DialogClose`) | A modal task with a title and explicit actions |
| `AlertDialog` (`AlertDialogTrigger`, `AlertDialogContent`, `AlertDialogTitle`, `AlertDialogDescription`, `AlertDialogCancel`, `AlertDialogAction`, `AlertDialogClose`) | Confirming a destructive or hard-to-undo action; the confirm button names the consequence |
| `ConfirmDialog`, `ConfirmActionButton` | Confirm, then run an async action with a pending state and an inline error |
| `Sheet` (`SheetTrigger`, `SheetContent side="left" or "right"`, `SheetHeader`, `SheetTitle`, `SheetDescription`, `SheetFooter`) | Filters, a quick record view, phone navigation |
| `DropdownMenu` (`DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuCheckboxItem`, `DropdownMenuRadioGroup`, `DropdownMenuRadioItem`, `DropdownMenuLabel`, `DropdownMenuSeparator`, `DropdownMenuShortcut`, `DropdownMenuSub`, `DropdownMenuSubTrigger`, `DropdownMenuSubContent`) | Actions for one record, from a button that names it |
| `Tooltip` (`TooltipProvider`, `TooltipTrigger`, `TooltipContent`) | The name of an icon button, repeated for sighted users |
| `Popover` (`PopoverTrigger`, `PopoverContent`, `PopoverHeader`, `PopoverTitle`, `PopoverDescription`) | One small anchored choice |
| `HoverCard` (`HoverCardTrigger`, `HoverCardContent`) | A preview whose content is also reachable by keyboard |
| `Command`, `CommandDialog` (`CommandInput`, `CommandList`, `CommandEmpty`, `CommandGroup`, `CommandItem`, `CommandShortcut`, `CommandSeparator`) | The Ctrl/Cmd K palette over real destinations |

Triggers take `render` to become a Fabrials button: `<DialogTrigger render={<Button variant="outline" />}>Rename</DialogTrigger>`.

## Collections and content

| Component | Use for |
| --- | --- |
| `Table` (`TableHeader`, `TableBody`, `TableFooter`, `TableRow`, `TableHead`, `TableCell`, `TableCaption`) | Records. `aria-label` names the scroll region; `numeric` right-aligns figures; `stickyHeader` for long tables |
| `Tabs` (`TabsList`, `TabsTrigger`, `TabsContent`) | Peer panels on one page; not steps |
| `Badge` | A short status or fact as a 3 px tag: `tone` `neutral`, `info`, `success`, `warning`, `danger`; `variant` `soft`, `outline` (facts such as a license or version), `solid`; `dot` |
| `Alert` (`AlertTitle`, `AlertDescription`, `AlertAction`) | A status that stays on the page: `variant` `default`, `info`, `success`, `warning`, `destructive` |
| `Card` (`CardHeader`, `CardTitle`, `CardDescription`, `CardAction`, `CardContent`, `CardFooter`) | One bounded summary; a panel around a chart. Not for lists of peers, not nested |
| `DescriptionList` (`DescriptionItem`, `DescriptionTerm`, `DescriptionDetails`) | A record's properties |
| `Disclosure`, `DisclosureSummary` (`count`, `chevron`, `size`), `DisclosurePanel` | A native `details`: 44 px summary, count in its name, panel always mounted, opens itself on an invalid field, no JavaScript |
| `Accordion`, `Collapsible` | Short answers in place; reasoning, sources or long detail behind a named trigger |
| `ScrollArea` | A region that scrolls without moving the page |
| `Loading`, `placeholderText`, `placeholderList`, `useLoading` | Paints the real components it wraps as their skeleton while `when` is true; placeholder copy and records; a hook for "inside a loading view" |
| `Skeleton`, `Progress`, `Separator` | A block only where no component exists yet; a known fraction; a decorative break |
| `Avatar` (`AvatarImage`, `AvatarFallback`) | A person or account |
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
| `NavigationMenu` (`NavigationMenuList`, `NavigationMenuItem`, `NavigationMenuTrigger`, `NavigationMenuContent`, `NavigationMenuLink`) | Grouped top-level links on public sites |
| `Sidebar` family (`SidebarProvider`, `Sidebar`, `SidebarHeader`, `SidebarContent`, `SidebarGroup`, `SidebarGroupLabel`, `SidebarGroupContent`, `SidebarMenu`, `SidebarMenuItem`, `SidebarMenuButton`, `SidebarMenuBadge`, `SidebarMenuSub`, `SidebarFooter`, `SidebarRail`, `SidebarTrigger`, `SidebarInset`, `SidebarMenuSkeleton`) | Persistent app navigation; a sheet below 768 px |
| `Breadcrumb` (`BreadcrumbList`, `BreadcrumbItem`, `BreadcrumbLink`, `BreadcrumbPage`, `BreadcrumbSeparator`, `BreadcrumbEllipsis`) | Where the page sits; also as `PageHeader` `eyebrow` |
| `NavTabs`, `NavTab` | Linked sections of one record (`current`, `count`) |
| `Pagination` (`PaginationContent`, `PaginationItem`, `PaginationLink`, `PaginationPrevious`, `PaginationNext`, `PaginationEllipsis`) | Numbered pages, only when numbers mean something |
| `Kbd`, `KbdGroup` | Flat shortcut hints |

## Composition and feedback

| Component | Use for |
| --- | --- |
| `Spinner` | An indeterminate wait, with text saying what is happening |
| `ShimmerText` | A short pending label (plain text under reduced motion) |
| `Toaster`, `toast` | A completed action; mount `Toaster` once |
| `Snippet`, `CopyButton` | Commands with copy; long lines wrap with a hanging indent |
| `Carousel` (`CarouselContent`, `CarouselItem`, `CarouselPrevious`, `CarouselNext`) | A sideways list of peers such as citations |

## Metrics

| Component | Use for |
| --- | --- |
| `Stat`, `StatGroup` | A number with `unit`, `delta`, `trend`, `deltaTone`, `hint`, optional `sparkline`, `loading` |
| `SeriesChart` | Bar or line charts over one series contract, with a legend and an accessible table (`caption` required) |
| `Sparkline` | Shape only, next to its number |
| `Meter` | A level that stays (quota, budget); warns at 75 % and 90 % by default |
| `StatusDot` | A state as a dot and a word; `pulse` only while something is live or in progress |
| `ActivityStrip`, `activityLevel` | Intensity cells (posts per day or hour) |
| `Timeline`, `TimelineItem` | An event feed, newest first; `fresh` highlights a new item once |
| `RelativeTime`, `formatRelativeTime` | "3 minutes ago" with the exact date in a `time` element |
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
| `PageHeader` | `title`, `description`, `actions`, `eyebrow` (sentence-case context such as a breadcrumb) |
| `SectionHeader` | `title`, `description`, `actions` for a section |
| `CollectionToolbar` | `search`, `filters`, `actions`, with a group `label` |
| `BulkActions` | `count` and actions; renders nothing until `count` is at least 1 |
| `StatePanel` | `state` `loading`, `empty`, `error`, `stale`, `offline`, `success`; `title`, `description`, `actions`; `align` `start` (default) or `center` |
| `SettingsSection` | A settings row: `title`, `description`, `status`, controls as children |
| `SuggestionCard`, `SuggestionGrid` | Prompts in an empty chat or workspace (grid on wide screens, a scroll row on narrow) |
| `AuthLayout` | Sign-in: `brand`, `title`, `description`, form as children, `footer`, `aside` |

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
| `CodePanel` | A sample with `title` (file name), `language`, `lineNumbers`, `highlightLines`, `addedLines`, `removedLines`, `highlightWords`, `copyValue`; `bare` for inline; Shiki output as children replaces the built-in highlighter |
| `CodeTabs` | Several versions of one sample (`items` with `value` and `label`) |
| `PackageInstall` | One command for npm, pnpm, yarn and bun; the choice is shared by the page. `command` without the runner, `kind="install"` for a package |
| `Files`, `Folder`, `File` | A file tree; `note`, `highlighted`, `defaultOpen` |
| `RepoInfo` | A GitHub repository link with stars and forks the host fetched |
| `highlightCode`, `packageCommand` | The pure helpers behind them (server-safe) |

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
| `DitherScene` | Landing hero (`variant="hero"`), sign-in (`variant="full"` or inside `AuthLayout` `aside`) | Absolute: the parent is positioned. Text on the calm side or a solid surface. `reveal` once (default 1200 ms), `reveal={0}` turns it off. `seed`, `cell` |
| `DitherBand` | Above one heading that carries the brand | One per view; height from `--fui-band-height` (4.5rem); on a card set `--fui-dither-bg: var(--card)` |
| `DitherGem` | Product mark in navigation, index rows, empty states; large beside a hero | `gem`, `size` 16, 20, 28 or 40; decorative, always next to the product name |
| `ProductLockup` | Product name with its gem in headers, sidebars, sign-in | `product`, `tagline`, `gem`, `size` `sm`, `md`, `lg`, `mark` |
| `FabrialsGem` | The faceted SVG gem (what `ProductLockup` draws) | `title` gives it a name; without it it is decorative |
| `DitherCanvas` | The engine for a product's own field (X Tracker's telemetry, Radiant's night sky) | `ramp`, `field`, `order="ramp"`, `cell`, `reveal`, `paintKey`; paints once, never loops |

Pure helpers in `@fabrials/ui/dither`: `paintRampField`, `STORM_RAMP`, `gemRamp`, `GEM_HEX`, `stormField`, `stormBandField`, `gemField`, `fbm`, `valueNoise`, `DITHER_BACKGROUND`. Gem names: `stormlight`, `heliodor`, `sapphire`, `ruby`, `emerald`, `zircon`, `smokestone`, `amethyst`.

`MoonPhase` and `Starfield` are the only sanctioned glow and continuous motion, for sign-in and landing surfaces only; they stop under reduced motion.

## `@fabrials/ai-ui`

Presentational only: the host supplies data, rendering, uploads, transcription and network. Import its CSS.

| Component | Use for |
| --- | --- |
| `ChatMessage` (`from` `user`, `assistant`, `system`; `actions`), `MessageActions`, `MessageAction`, `CopyMessageAction`, `MessageTimestamp` | A turn with its actions |
| `ChatComposer` (`onSubmit`, `status` `ready`, `submitting`, `streaming`, `onStop`, `tools`, `attachments`), `ComposerToggle`, `ComposerButton` | The message field |
| `CodeBlock` and the `.fui-markdown` class | Styles for rendered markdown and code with copy and download |
| `CitationProvider`, `CitationChip`, `Sources`, `SourceCard`, `SourceFavicon`, `LinkWithPreview`, `LinkPreviewCard` | Numbered citations and their sources |
| `ActivityDisclosure`, `ReasoningDisclosure`, `SearchStepsDisclosure`, `ActivityIcon` | Reasoning, search steps and tool activity inside an answer |
| `Attachments`, `AttachmentChip` | Files on a message |
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

- **Shims** (`button`, `dialog`, `select`, `table`, `sidebar`, … 36 in all; list in `apps/site/lib/shims-index.generated.ts`) install under shadcn's paths and re-export Fabrials controls.
- **Other libraries** (today Kibo UI: `kibo-contribution-graph`, `kibo-dropzone`, `kibo-kanban`, `kibo-rating`; Magic UI: `magicui-animated-list`, `magicui-dot-pattern`, `magicui-file-tree`, `magicui-marquee`, `magicui-terminal`) are community tier: they keep their library's look and list design notes (literal colours, continuous motion, ignored reduced motion). Outside apps may use them. Fabrials products do not; use the Fabrials piece instead (`Files` for a file tree, `ActivityStrip` for a contribution graph, `Timeline` for an event list) or promote the component into the packages first.
