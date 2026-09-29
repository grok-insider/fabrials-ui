"use client";

import { useState, type ReactNode } from "react";
import { moreDemos } from "@/components/ui-demos-more";
import {
  BookOpen,
  ChevronDown,
  Code2,
  Globe,
  KeyRound,
  LayoutGrid,
  Lightbulb,
  MoreHorizontal,
  Paperclip,
  Pencil,
  RotateCcw,
  Search,
  Terminal,
  Users,
} from "lucide-react";
import {
  ActivityDisclosure,
  AttachmentChip,
  Attachments,
  ChatComposer,
  ChatMessage,
  CitationChip,
  CitationProvider,
  CodeBlock,
  ComposerButton,
  ComposerToggle,
  CopyMessageAction,
  MessageAction,
  MessageActions,
  MessageTimestamp,
  ReasoningDisclosure,
  SearchStepsDisclosure,
  Sources,
  VoiceInputButton,
  VoiceInputButtonView,
  type AttachmentItem,
  type CitationSource,
  type SearchStep,
} from "@fabrials/ai-ui";
import {
  Alert,
  AlertDescription,
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertTitle,
  Badge,
  BulkActions,
  Button,
  ButtonGroup,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  Checkbox,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  ConfirmActionButton,
  ConfirmDialog,
  CollectionToolbar,
  Combobox,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Field,
  FileThumb,
  FilterChip,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Kbd,
  Label,
  MOON_VARIANTS,
  MoonPhase,
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NumberTicker,
  PageHeader,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Progress,
  ScrollArea,
  SectionHeader,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  SeriesChart,
  SettingsSection,
  SheetContent,
  SheetTitle,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  ShimmerText,
  Skeleton,
  Spinner,
  Starfield,
  StatePanel,
  SuggestionCard,
  SuggestionGrid,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  Toaster,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  TruncatedText,
  WorkspaceShell,
  groupByRecency,
  lunarPhase,
  lunarPhaseName,
  toast,
  type ConfirmResult,
} from "@fabrials/ui";

const series = [
  { month: "Jun", requests: 420, cost: 18 },
  { month: "Jul", requests: 610, cost: 24 },
  { month: "Aug", requests: 540, cost: 21 },
];

/**
 * The preview box. Stacked by default; `inline` lays controls out in a row at
 * their own width, so a lone trigger or group is not stretched across the stage.
 */
const grouped = new Intl.NumberFormat("en");

function Frame({ children, inline = false }: { children: ReactNode; inline?: boolean }) {
  return <div className={inline ? "fui-preview flex flex-wrap items-center gap-3" : "fui-preview grid grid-cols-[minmax(0,1fr)] gap-4"}>{children}</div>;
}

const demos: Record<string, () => ReactNode> = {
  button: () => (
    <Frame>
      <div className="flex flex-wrap items-center gap-3">
        <Button>Add account</Button>
        <Button variant="outline">View details</Button>
        <Button variant="ghost">Cancel</Button>
        <Button variant="destructive">Remove</Button>
        <Button disabled>Unavailable</Button>
      </div>
    </Frame>
  ),
  input: () => (
    <Frame>
      <Label htmlFor="account-alias">Account alias</Label>
      <Input id="account-alias" name="alias" placeholder="Engineering" />
    </Frame>
  ),
  textarea: () => (
    <Frame>
      <Label htmlFor="note">Note</Label>
      <Textarea id="note" name="note" rows={3} placeholder="What should the operator know?" />
    </Frame>
  ),
  label: () => (
    <Frame>
      <Label htmlFor="workspace-name">Workspace name</Label>
      <Input id="workspace-name" name="workspace" defaultValue="North" />
    </Frame>
  ),
  field: () => (
    <Frame>
      <Field label="Account alias" description="Shown in the account list." error="Enter an alias.">
        {(props) => <Input {...props} name="alias" defaultValue="" />}
      </Field>
    </Frame>
  ),
  checkbox: () => (
    <Frame>
      <Label className="flex items-center gap-2">
        <Checkbox defaultChecked />
        Include archived records
      </Label>
    </Frame>
  ),
  switch: () => <SwitchDemo />,
  select: () => (
    <Frame>
      <Label htmlFor="density">Density</Label>
      <Select defaultValue="standard">
        <SelectTrigger id="density" className="w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="standard">Standard</SelectItem>
          <SelectItem value="compact">Compact</SelectItem>
        </SelectContent>
      </Select>
    </Frame>
  ),
  dialog: () => (
    <Frame inline>
      <Dialog>
        <DialogTrigger render={<Button />}>Add account</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add account</DialogTitle>
            <DialogDescription>This example stores nothing.</DialogDescription>
          </DialogHeader>
          <Field label="Account alias">{(props) => <Input {...props} name="alias" />}</Field>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <DialogClose render={<Button />}>Save account</DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Frame>
  ),
  "alert-dialog": () => (
    <Frame inline>
      <AlertDialog>
        <AlertDialogTrigger render={<Button variant="destructive" />}>Remove account</AlertDialogTrigger>
        <AlertDialogContent>
          <DialogHeader>
            <AlertDialogTitle>Remove this account?</AlertDialogTitle>
            <AlertDialogDescription>This example removes nothing.</AlertDialogDescription>
          </DialogHeader>
          <DialogFooter>
            <AlertDialogCancel>Keep account</AlertDialogCancel>
            <Button variant="destructive">Confirm removal</Button>
          </DialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Frame>
  ),
  sheet: () => (
    <Frame inline>
      <Dialog>
        <DialogTrigger render={<Button variant="outline" />}>Open filters</DialogTrigger>
        <SheetContent>
          <DialogHeader>
            <SheetTitle>Filters</SheetTitle>
            <DialogDescription>Narrow this collection.</DialogDescription>
          </DialogHeader>
          <Label className="mt-4 flex items-center gap-2">
            <Checkbox /> Needs attention only
          </Label>
        </SheetContent>
      </Dialog>
    </Frame>
  ),
  "dropdown-menu": () => (
    <Frame inline>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="outline" />}>Account actions</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Rename</DropdownMenuItem>
          <DropdownMenuItem variant="destructive">Remove</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </Frame>
  ),
  tooltip: () => (
    <Frame inline>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger render={<Button variant="outline" aria-label="Refresh records" />}>Refresh</TooltipTrigger>
          <TooltipContent>Refresh records</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </Frame>
  ),
  "hover-card": () => (
    <Frame inline>
      <HoverCard>
        <HoverCardTrigger render={<Button variant="outline" />}>North workspace</HoverCardTrigger>
        <HoverCardContent className="w-64 text-sm">
          Synthetic workspace. No credentials are loaded.
        </HoverCardContent>
      </HoverCard>
    </Frame>
  ),
  popover: () => (
    <Frame inline>
      <Popover>
        <PopoverTrigger render={<Button variant="outline" />}>Pick a range</PopoverTrigger>
        <PopoverContent className="text-sm">Last 7 days, last 30 days.</PopoverContent>
      </Popover>
    </Frame>
  ),
  table: () => (
    <Frame>
      <Table>
        <caption className="sr-only">Synthetic accounts</caption>
        <TableHeader>
          <TableRow>
            <TableHead>Account</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>North</TableCell>
            <TableCell>Current</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>South</TableCell>
            <TableCell>Stale</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Frame>
  ),
  tabs: () => (
    <Frame>
      <Tabs defaultValue="usage">
        <TabsList>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="cost">Cost</TabsTrigger>
        </TabsList>
        <TabsContent value="usage" className="pt-3 text-sm">420 requests in June.</TabsContent>
        <TabsContent value="cost" className="pt-3 text-sm">18 in June.</TabsContent>
      </Tabs>
    </Frame>
  ),
  badge: () => (
    <Frame>
      <div className="flex flex-wrap gap-2">
        <Badge>Draft</Badge>
        <Badge tone="success">Current</Badge>
        <Badge tone="warning">Stale</Badge>
        <Badge tone="danger">Failed</Badge>
        <Badge tone="info">Preview</Badge>
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge dot tone="success">Synced</Badge>
        <Badge dot tone="warning">3 h old</Badge>
        <Badge dot tone="danger">Expired</Badge>
        <Badge dot>Paused</Badge>
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline">MIT</Badge>
        <Badge variant="outline">v0.8.0</Badge>
        <Badge variant="solid" tone="info">New</Badge>
        <Badge variant="solid">12</Badge>
      </div>
    </Frame>
  ),
  card: () => (
    <Frame>
      <Card>
        <CardHeader>
          <CardTitle as="h3">North workspace</CardTitle>
          <CardDescription>Two accounts, last sync 4 minutes ago.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm">Synthetic summary. No provider was contacted.</CardContent>
      </Card>
    </Frame>
  ),
  alert: () => (
    <Frame>
      <Alert>
        <AlertTitle>Observation is stale</AlertTitle>
        <AlertDescription>The last sync is 14 minutes old. Refresh before acting on it.</AlertDescription>
      </Alert>
    </Frame>
  ),
  separator: () => (
    <Frame>
      <p className="text-sm">Accounts</p>
      <Separator />
      <p className="text-sm">Keys</p>
    </Frame>
  ),
  skeleton: () => (
    <Frame>
      <div className="grid gap-2" aria-hidden="true">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>
      <p className="sr-only">Loading account summary</p>
    </Frame>
  ),
  progress: () => (
    <Frame>
      <Label htmlFor="sync-progress">Sync progress</Label>
      <Progress id="sync-progress" value={0.4} max={1} />
    </Frame>
  ),
  combobox: () => (
    <Frame>
      <Combobox.Root items={["North", "South", "East"]}>
        <Label htmlFor="workspace-filter">Workspace</Label>
        <Combobox.Input id="workspace-filter" placeholder="Filter workspaces" className="fui-input mt-2 w-full max-w-xs" />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup>
              <Combobox.Empty>No matching workspace.</Combobox.Empty>
              <Combobox.List>
                {(item: string) => (
                  <Combobox.Item key={item} value={item}>
                    {item}
                  </Combobox.Item>
                )}
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>
    </Frame>
  ),
  collapsible: () => (
    <Frame>
      <Collapsible className="group/collapsible max-w-md rounded-lg border bg-card">
        <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm font-medium">
          Sources checked
          <ChevronDown
            aria-hidden="true"
            className="size-4 text-muted-foreground transition-transform group-data-[open]/collapsible:rotate-180 motion-reduce:transition-none"
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="border-t px-3 py-2 text-sm text-muted-foreground">
          Three synthetic sources, read 4 minutes ago. Nothing was sent.
        </CollapsibleContent>
      </Collapsible>
    </Frame>
  ),
  "scroll-area": () => (
    <Frame>
      <ScrollArea aria-label="Suggestions" className="h-28 max-w-sm rounded-md border p-3">
        {["Compare usage", "Open accounts", "Refresh the pool", "Read the last sync"].map((item) => (
          <p key={item} className="py-1 text-sm">{item}</p>
        ))}
      </ScrollArea>
    </Frame>
  ),
  "navigation-menu": () => (
    <Frame>
      <div className="max-w-full overflow-x-auto">
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink href="/docs/navigation-menu">Overview</NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Products</NavigationMenuTrigger>
              <NavigationMenuContent className="p-3 text-sm">
                <NavigationMenuLink href="/docs/navigation-menu">Spanreed</NavigationMenuLink>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </Frame>
  ),
  sidebar: () => (
    <Frame>
      {/* A small app frame: the sidebar beside its page, at a fixed height instead of the full window. */}
      <SidebarProvider className="min-h-0 h-64 overflow-hidden rounded-lg border">
        <nav aria-label="Workspace" className="flex w-52 shrink-0 flex-col gap-1 border-r bg-sidebar p-2 text-sidebar-foreground">
          <SidebarGroupLabel>North workspace</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton isActive>
                <LayoutGrid aria-hidden="true" /> Overview
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton>
                <Users aria-hidden="true" /> Accounts
              </SidebarMenuButton>
              <SidebarMenuBadge>2</SidebarMenuBadge>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton>
                <KeyRound aria-hidden="true" /> Keys
              </SidebarMenuButton>
              <SidebarMenuBadge>3</SidebarMenuBadge>
            </SidebarMenuItem>
          </SidebarMenu>
        </nav>
        <div className="grid flex-1 content-start gap-1 bg-background p-5">
          <p className="font-medium">Overview</p>
          <p className="text-sm text-muted-foreground">Two accounts, last sync 4 minutes ago. Synthetic data.</p>
        </div>
      </SidebarProvider>
    </Frame>
  ),
  command: () => (
    <Frame>
      <Command className="max-w-sm rounded-lg border" label="Command palette">
        <CommandInput aria-label="Search destinations" placeholder="Search destinations" />
        <CommandList>
          <CommandEmpty>No matching destination.</CommandEmpty>
          <CommandGroup heading="Navigate">
            <CommandItem>Overview</CommandItem>
            <CommandItem>Accounts</CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
      <p className="text-sm text-muted-foreground">
        Shortcut <Kbd>Ctrl</Kbd> <Kbd>K</Kbd>
      </p>
    </Frame>
  ),
  kbd: () => (
    <Frame>
      <p className="text-sm">
        Open the palette with <Kbd>Ctrl</Kbd> <Kbd>K</Kbd>
      </p>
    </Frame>
  ),
  "button-group": () => (
    <Frame>
      <ButtonGroup aria-label="Range">
        <Button variant="outline">Day</Button>
        <Button variant="outline">Week</Button>
        <Button variant="outline">Month</Button>
      </ButtonGroup>
    </Frame>
  ),
  "input-group": () => (
    <Frame>
      <InputGroup className="max-w-sm">
        <InputGroupAddon>https://</InputGroupAddon>
        <InputGroupInput aria-label="Host" placeholder="fabrials.com" />
      </InputGroup>
    </Frame>
  ),
  carousel: () => (
    <Frame>
      <div className="fui-carousel-frame">
        <Carousel aria-label="Citations">
          <CarouselContent>
            {["Usage report", "Account list", "Sync log"].map((item) => (
              <CarouselItem key={item}>
                <div className="rounded-lg border p-6 text-sm">{item}</div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>
    </Frame>
  ),
  spinner: () => (
    <Frame>
      <p className="flex items-center gap-2 text-sm">
        <Spinner />
        Refreshing the pool
      </p>
    </Frame>
  ),
  toaster: () => (
    <Frame inline>
      <Button
        variant="outline"
        onClick={() => toast("Account saved", { description: "Synthetic notice. Nothing was stored." })}
      >
        Show notice
      </Button>
      <Toaster />
    </Frame>
  ),
  "number-ticker": () => (
    <Frame>
      <p className="text-3xl font-medium tabular-nums">
        <NumberTicker value={12840} startOnView={false} format={(n) => grouped.format(Math.round(n))} />
      </p>
      <p className="text-sm text-muted-foreground">Requests this week</p>
    </Frame>
  ),
  "series-chart": () => (
    <Frame>
      <SeriesChart
        data={series}
        xKey="month"
        series={[
          { key: "requests", label: "Requests" },
          { key: "cost", label: "Cost" },
        ]}
        caption="Synthetic requests and cost by month"
        height={220}
      />
    </Frame>
  ),
  "workspace-shell": () => (
    <Frame>
      <WorkspaceShell
        className="min-h-48 overflow-hidden rounded-lg border"
        contentId="workspace-preview"
        navigation={<nav aria-label="Example" className="p-4 text-sm">Overview</nav>}
        header={<span className="text-sm">Workspace</span>}
      >
        <p className="text-sm">Synthetic task. No account is connected.</p>
      </WorkspaceShell>
    </Frame>
  ),
  "page-header": () => (
    <Frame>
      <PageHeader title="Accounts" description="Provider connections for this workspace." actions={<Button>Add account</Button>} />
    </Frame>
  ),
  "section-header": () => (
    <Frame>
      <SectionHeader title="Recent syncs" description="The last three observations." />
    </Frame>
  ),
  "collection-toolbar": () => (
    <Frame>
      <CollectionToolbar
        search={<Input aria-label="Search accounts" placeholder="Search accounts" />}
        actions={<Button variant="outline">Export</Button>}
      />
    </Frame>
  ),
  "bulk-actions": () => (
    <Frame>
      <BulkActions count={2}>
        <Button variant="outline" size="sm">Archive</Button>
      </BulkActions>
    </Frame>
  ),
  "state-panel": () => (
    <Frame>
      <StatePanel
        state="empty"
        title="No accounts yet"
        description="Add a provider account to start a sync."
        actions={<Button>Add account</Button>}
      />
    </Frame>
  ),
  "confirm-dialog": () => <ConfirmDemo />,
  "filter-chip": () => <FilterChipDemo />,
  "truncated-text": () => <TruncatedDemo />,
  "shimmer-text": () => (
    <Frame>
      <ShimmerText>Thinking</ShimmerText>
      <ShimmerText as="span" duration={1.4} className="text-xs">
        Generating image
      </ShimmerText>
      <ShimmerText className="text-xl font-semibold">Searching 14 sources for recent coverage</ShimmerText>
    </Frame>
  ),
  "file-thumb": () => (
    <Frame>
      <ul className="grid gap-3">
        {fileRows.map((file) => (
          <li key={`${file.name}-${file.mime}`} className="flex min-w-0 items-center gap-3 text-sm">
            <FileThumb filename={file.name} mime={file.mime} src={file.src} alt={file.src ? `${file.name} preview` : undefined} />
            <span className="min-w-0 truncate">{file.name}</span>
            <span className="hidden text-xs text-muted-foreground sm:inline">{file.mime}</span>
          </li>
        ))}
      </ul>
    </Frame>
  ),
  "recency-groups": () => <RecencyDemo />,
  "settings-section": () => (
    <Frame>
      <SettingsSection
        id="demo-profile"
        title="Profile"
        description="How other members see you in shared conversations."
        status={<Badge tone="success">Saved</Badge>}
      >
        <Field label="Display name">{(props) => <Input {...props} name="display-name" defaultValue="Ada" />}</Field>
      </SettingsSection>
      <SettingsSection
        id="demo-digest"
        title="Daily digest"
        description="Send a summary every morning in the workspace time zone."
      >
        <Label className="flex items-center gap-3">
          <Switch defaultChecked /> Email me a daily digest
        </Label>
      </SettingsSection>
      <SettingsSection id="demo-apps" title="Connected apps" status={<Badge>Loading</Badge>}>
        <ShimmerText as="span">Checking connections</ShimmerText>
      </SettingsSection>
    </Frame>
  ),
  "suggestion-card": () => <SuggestionDemo />,
  "moon-phase": () => (
    <Frame>
      <div className="dark relative grid min-h-64 place-items-center overflow-hidden rounded-xl bg-background text-foreground">
        <Starfield />
        <MoonPhase animate caption label="Moon cycling through its phases" size={128} variant="random" />
      </div>
      <ul className="flex flex-wrap gap-4">
        {moonPhases.map((phase) => (
          <li key={phase} className="grid justify-items-center gap-2 text-xs">
            <MoonPhase halo={false} label={lunarPhaseName(phase)} phase={phase} size={48} />
            {lunarPhaseName(phase)}
          </li>
        ))}
      </ul>
      <ul className="dark flex flex-wrap gap-4 rounded-xl bg-background p-4 text-foreground">
        {MOON_VARIANTS.map((variant) => (
          <li key={variant.id} className="grid justify-items-center gap-2 text-xs">
            <MoonPhase
              label={variant.label}
              phase={variant.appearsAt === "crescent" ? 0.1 : 0.5}
              size={56}
              variant={variant.id}
            />
            {variant.label} · {variant.rarity}
          </li>
        ))}
      </ul>
      <p className="text-sm text-muted-foreground">
        26 Sep 2026: {lunarPhaseName(examplePhase)}, {Math.round(examplePhase * 100)}% through the cycle.
      </p>
    </Frame>
  ),
  starfield: () => (
    <Frame>
      <div className="dark relative grid min-h-56 place-items-center overflow-hidden rounded-xl bg-background p-6 text-center text-foreground">
        <Starfield />
        <div className="relative grid gap-3">
          <p className="text-lg font-medium">Welcome back</p>
          <Button variant="outline">Continue with email</Button>
        </div>
      </div>
    </Frame>
  ),
  "chat-message": () => (
    <Frame>
      <CitationProvider sources={citationSources.slice(0, 2)}>
        <div className="grid min-w-0 gap-6">
          <ChatMessage from="user" actions={<TurnActions copy="How should hosts import the shared styles?" user />}>
            How should hosts import the shared styles?
          </ChatMessage>
          <ChatMessage
            from="assistant"
            pinActions
            actions={<TurnActions copy="Import tokens, fonts and styles once, in that order." latest />}
          >
            <div className="fui-markdown">
              <p>
                Import tokens, fonts and styles once, in that order
                <CitationChip href={citationSources[0]!.url} number={1} />. Tailwind hosts add the bridge last
                <CitationChip href={citationSources[1]!.url} number={2} />.
              </p>
            </div>
          </ChatMessage>
        </div>
      </CitationProvider>
    </Frame>
  ),
  "chat-composer": () => <ComposerDemo />,
  "code-block": () => (
    <Frame>
      <div className="fui-markdown min-w-0">
        <h3>Layered styles</h3>
        <p>
          Shared components live in the <code>components</code> layer. Hosts override after them.
        </p>
        <ol>
          <li>Import tokens once.</li>
          <li>Import component styles.</li>
        </ol>
        <blockquote>
          <p>Color always has a text or symbol companion.</p>
        </blockquote>
        <CodeBlock code={themeCode} download language="ts" />
        <table>
          <thead>
            <tr>
              <th>Surface</th>
              <th>Width</th>
              <th>Controls</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Phone</td>
              <td>390</td>
              <td>44px</td>
            </tr>
            <tr>
              <td>Desktop</td>
              <td>1440</td>
              <td>40px</td>
            </tr>
          </tbody>
        </table>
        <CodeBlock code={longLine} language="js" lineNumbers />
      </div>
    </Frame>
  ),
  citations: () => (
    <Frame>
      <CitationProvider sources={citationSources}>
        <div className="fui-markdown">
          <p>
            Hover a number to preview its source and highlight the matching card
            <CitationChip href={citationSources[0]!.url} number={1} />
            <CitationChip href={citationSources[1]!.url} number={2} />
            <CitationChip href={citationSources[3]!.url} number={4} />.
          </p>
        </div>
        <Sources defaultOpen sources={citationSources} />
      </CitationProvider>
    </Frame>
  ),
  "activity-disclosure": () => (
    <Frame>
      <ReasoningDisclosure streaming>
        <div className="fui-markdown">
          <p>Comparing the two layer orders before choosing one.</p>
        </div>
      </ReasoningDisclosure>
      <ReasoningDisclosure durationSeconds={4}>
        <div className="fui-markdown">
          <p>The host imports tokens first, then shared components, then overrides.</p>
        </div>
      </ReasoningDisclosure>
      <SearchStepsDisclosure phase="reading" sourceCount={5} steps={searchSteps} />
      <SearchStepsDisclosure defaultOpen phase="done" sourceCount={5} steps={searchSteps} />
      <ActivityDisclosure icon={<Terminal aria-hidden="true" />} label="Ran a calculation" live={false} />
    </Frame>
  ),
  attachments: () => <AttachmentsDemo />,
  "voice-input": () => (
    <Frame>
      <div className="flex flex-wrap items-center gap-2">
        <VoiceInputButtonView status="idle" />
        <VoiceInputButtonView status="requesting" />
        <VoiceInputButtonView elapsedMs={14_000} level={0.6} maxDurationMs={120_000} status="recording" />
        <VoiceInputButtonView status="transcribing" />
        <VoiceInputButtonView error="Microphone access is blocked." status="error" />
      </div>
      <VoiceDemo />
    </Frame>
  ),
};

function SwitchDemo() {
  const [on, setOn] = useState(true);
  return (
    <Frame>
      <Label className="flex items-center gap-2">
        <Switch checked={on} onCheckedChange={setOn} />
        Email a stale-sync notice
      </Label>
    </Frame>
  );
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function ConfirmDemo() {
  const [open, setOpen] = useState(false);
  const [removed, setRemoved] = useState(0);
  return (
    <Frame>
      <div className="flex flex-wrap items-center gap-3">
        <ConfirmActionButton
          buttonProps={{ variant: "outline" }}
          confirmLabel="Restore"
          description="The workspace and its files return to every member's list. This example changes nothing."
          onConfirm={async () => {
            await wait(900);
            return { ok: true };
          }}
          pendingLabel="Restoring…"
          title="Restore workspace?"
        >
          Restore (succeeds)
        </ConfirmActionButton>
        <ConfirmActionButton
          buttonProps={{ variant: "destructive" }}
          confirmLabel="Revoke link"
          description="Anyone holding the public link loses access immediately."
          destructive
          onConfirm={async (): Promise<ConfirmResult> => {
            await wait(700);
            return { ok: false, error: "The link was already revoked by another administrator." };
          }}
          pendingLabel="Revoking…"
          title="Revoke public link?"
        >
          Revoke (fails)
        </ConfirmActionButton>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <Button variant="secondary" onClick={() => setOpen(true)}>
          Controlled with details
        </Button>
        <span role="status">Removed: {removed}</span>
      </div>
      <ConfirmDialog
        confirmLabel="Remove 3 members"
        description="They lose access to every shared conversation in this workspace."
        destructive
        details={
          <ul className="list-disc pl-5">
            <li>ada@example.org</li>
            <li>grace@example.org</li>
            <li>edsger@example.org</li>
          </ul>
        }
        onConfirm={async () => {
          await wait(600);
          setRemoved((count) => count + 3);
        }}
        onOpenChange={setOpen}
        open={open}
        title="Remove members?"
      />
    </Frame>
  );
}

function FilterChipDemo() {
  const [filters, setFilters] = useState([
    { label: "Owner", value: "ada@example.org" },
    { label: "Type", value: "image/png" },
    { label: "Workspace", value: "A remarkably long workspace name that should truncate inside the chip" },
  ]);
  return (
    <Frame>
      <div className="flex min-w-0 flex-wrap gap-2">
        <FilterChip href="/docs/filter-chip" label="Owner" value="ada@example.org" />
        <FilterChip href="/docs/filter-chip" label="Type" value="application/pdf" />
      </div>
      <div className="flex min-w-0 max-w-lg flex-wrap gap-2">
        {filters.map((filter) => (
          <FilterChip
            key={filter.label}
            label={filter.label}
            value={filter.value}
            onRemove={() => setFilters((current) => current.filter((item) => item !== filter))}
          />
        ))}
        {filters.length === 0 && <span className="text-sm text-muted-foreground">No active filters</span>}
      </div>
    </Frame>
  );
}

const truncatedRows = [
  "Short title",
  "Quarterly planning notes for the storage migration and the retention policy review",
  "Draft reply",
];

function TruncatedDemo() {
  const [clicked, setClicked] = useState<string | null>(null);
  return (
    <Frame>
      <ul className="grid max-w-72 gap-2">
        {truncatedRows.map((row) => (
          <li key={row} className="flex min-h-10 min-w-0 items-center gap-2 rounded-lg border pl-3 pr-1 text-sm">
            <TruncatedText side="right" sideOffset={40}>
              {row}
            </TruncatedText>
            <Button aria-label={`Actions for ${row}`} onClick={() => setClicked(row)} size="icon-sm" variant="ghost">
              <MoreHorizontal aria-hidden="true" />
            </Button>
          </li>
        ))}
      </ul>
      <p className="text-sm text-muted-foreground">Last action: {clicked ?? "none"}</p>
    </Frame>
  );
}

const swatch =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" fill="#5b7fa8"/><circle cx="56" cy="24" r="12" fill="#e8eef5"/><path d="M0 80 L30 40 L52 64 L64 52 L80 72 V80Z" fill="#2c3e57"/></svg>',
  );

const fileRows = [
  { name: "landscape.png", mime: "image/png", src: swatch },
  { name: "report.pdf", mime: "application/pdf" },
  { name: "export.csv", mime: "text/csv" },
  { name: "voice-memo.m4a", mime: "audio/mp4" },
  { name: "backup.tar.gz", mime: "application/gzip" },
];

const recencyNow = new Date(2026, 8, 26, 15);
const recencyHistory = [
  { id: "1", title: "Storage migration plan", at: new Date(2026, 8, 26, 11) },
  { id: "2", title: "Welcome email draft", at: new Date(2026, 8, 25, 22) },
  { id: "3", title: "Release notes 0.4", at: new Date(2026, 8, 21) },
  { id: "4", title: "Pricing questions", at: new Date(2026, 8, 3) },
  { id: "5", title: "Offsite agenda", at: new Date(2026, 6, 14) },
  { id: "6", title: "Year in review", at: new Date(2025, 11, 20) },
];

function RecencyDemo() {
  const groups = groupByRecency(recencyHistory, (item) => item.at, recencyNow);
  return (
    <Frame>
      <nav aria-label="Synthetic history" className="grid max-w-64 gap-3">
        {groups.map((group) => (
          <section aria-label={group.label} key={group.key}>
            <h3 className="mb-1 text-xs font-medium text-muted-foreground">{group.label}</h3>
            <ul>
              {group.items.map((item) => (
                <li key={item.id} className="flex min-h-8 min-w-0 items-center text-sm">
                  <TruncatedText>{item.title}</TruncatedText>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </nav>
      <p className="text-xs text-muted-foreground">Grouped relative to 26 Sep 2026, 15:00.</p>
    </Frame>
  );
}

const suggestions = [
  { icon: <BookOpen aria-hidden="true" />, title: "Summarize a document", description: "Paste text or attach a file for a short summary." },
  { icon: <Code2 aria-hidden="true" />, title: "Explain this code", description: "Walk through what a snippet does, line by line." },
  { icon: <Lightbulb aria-hidden="true" />, title: "Brainstorm names", description: "Ten options with a one-line rationale each." },
  { icon: <Search aria-hidden="true" />, title: "Research a topic", description: "Find recent sources, compare their claims and list the open questions that remain." },
];

function SuggestionDemo() {
  const [picked, setPicked] = useState<string | null>(null);
  return (
    <Frame>
      <SuggestionGrid aria-label="Suggestions">
        {suggestions.map((item) => (
          <SuggestionCard
            key={item.title}
            description={item.description}
            icon={item.icon}
            onClick={() => setPicked(item.title)}
            title={item.title}
          />
        ))}
      </SuggestionGrid>
      <p className="text-sm text-muted-foreground" role="status">
        Picked: {picked ?? "none"}
      </p>
    </Frame>
  );
}

const moonPhases = [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875];
const examplePhase = lunarPhase(new Date("2026-09-26T12:00:00Z"));

const citationSources: CitationSource[] = [
  { url: "https://docs.example.org/guides/cascade-layers", title: "Cascade layers in practice" },
  { url: "https://www.example.com/blog/2026/tokens", title: "Design tokens across products" },
  { url: "https://reference.example.net/css/color-mix", title: "color-mix() reference" },
  { url: "https://notes.example.io/", title: "Composing design tokens without leaking product policy into the shared layer" },
  { url: "https://archive.example.dev/posts/field-sizing" },
];

const searchSteps: SearchStep[] = [
  { type: "search", query: "css cascade layers component libraries" },
  { type: "search", query: "color-mix oklab browser support 2026" },
  { type: "open_page", url: "https://docs.example.org/guides/cascade-layers" },
];

const themeCode = `type Theme = "light" | "dark";

export function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  return { theme, appliedAt: Date.now() };
}`;

const longLine = `const endpoint = "https://api.example.test/v1/really/long/path/segment/that/keeps/going/and/going/until/it/scrolls/horizontally?with=query&and=more";`;

function TurnActions({ user, latest, copy }: { user?: boolean; latest?: boolean; copy: string }) {
  return (
    <MessageActions>
      <CopyMessageAction text={copy} />
      {user && (
        <MessageAction label="Edit">
          <Pencil aria-hidden="true" />
        </MessageAction>
      )}
      {latest && (
        <MessageAction label="Retry">
          <RotateCcw aria-hidden="true" />
        </MessageAction>
      )}
      <MessageTimestamp dateTime="2026-09-26T10:42:00Z" detail="Sep 26, 2026, 10:42" label="10:42" />
    </MessageActions>
  );
}

const attachmentFiles: AttachmentItem[] = [
  {
    id: "1",
    name: "moonlight.png",
    mediaType: "image/png",
    size: 248_000,
    url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 4 3'%3E%3Crect width='4' height='3' fill='%23304a7a'/%3E%3Ccircle cx='3' cy='1' r='.6' fill='%23dfe8ff'/%3E%3C/svg%3E",
  },
  { id: "2", name: "quarterly-report-with-a-very-long-filename-final-v3.pdf", mediaType: "application/pdf", size: 3_400_000 },
  { id: "3", name: "notes.md", mediaType: "text/markdown", size: 1_200, status: "uploading" },
  { id: "4", name: "interview.mov", mediaType: "video/quicktime", status: "error", error: "Larger than 50 MB" },
];

function AttachmentsDemo() {
  const [items, setItems] = useState(attachmentFiles);
  const remove = (id: string) => setItems((current) => current.filter((item) => item.id !== id));
  return (
    <Frame>
      <Attachments empty="No attachments" items={items} onRemove={remove} />
      <Attachments items={items} onRemove={remove} variant="list" />
      <AttachmentChip item={attachmentFiles[1]!} />
    </Frame>
  );
}

function ComposerDemo() {
  const [value, setValue] = useState("");
  const [status, setStatus] = useState<"ready" | "submitting" | "streaming">("ready");
  const [search, setSearch] = useState(true);
  const [items, setItems] = useState(attachmentFiles.slice(0, 2));
  const [sent, setSent] = useState<string[]>([]);
  return (
    <Frame>
      <ChatComposer
        attachments={
          items.length ? (
            <Attachments items={items} onRemove={(id) => setItems((current) => current.filter((item) => item.id !== id))} />
          ) : undefined
        }
        label="Message the assistant"
        onRemoveLastAttachment={() => setItems((current) => current.slice(0, -1))}
        onStop={() => setStatus("ready")}
        onSubmit={(text) => {
          setSent((current) => [...current, text]);
          setValue("");
          setStatus("streaming");
        }}
        onValueChange={setValue}
        placeholder="Ask anything"
        status={status}
        tools={
          <>
            <ComposerButton icon={<Paperclip aria-hidden="true" />} label="Attach files" onClick={() => {}} tooltip="Attach files" />
            <ComposerToggle
              icon={<Globe aria-hidden="true" />}
              label="Web search"
              onPressedChange={setSearch}
              pressed={search}
              tooltip={search ? "Web search on" : "Web search off"}
            >
              Search
            </ComposerToggle>
          </>
        }
        trailing={<VoiceInputButtonView status="idle" />}
        value={value}
      />
      <p className="text-sm text-muted-foreground" role="status">
        {sent.length ? `Sent: ${sent.join(" · ")}` : "Nothing is sent. Press Enter to try it."}
      </p>
    </Frame>
  );
}

function VoiceDemo() {
  const [text, setText] = useState("");
  return (
    <div className="flex flex-wrap items-center gap-3 text-sm">
      <VoiceInputButton
        maxDurationMs={10_000}
        onRecorded={async (blob) => `Recorded ${Math.round(blob.size / 1024)} KB of audio. No transcription service is called.`}
        onTranscript={setText}
        showLevel
      />
      <span className="text-muted-foreground" role="status">
        {text || "Press to record. The transcript here is synthetic."}
      </span>
    </div>
  );
}

export function UiDemo({ slug }: { slug: string }) {
  const Demo = demos[slug] ?? moreDemos[slug];
  if (!Demo) return <p className="text-sm">This preview is not available.</p>;
  return <Demo />;
}
