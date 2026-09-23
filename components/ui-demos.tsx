"use client";

import { useState, type ReactNode } from "react";
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
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Kbd,
  Label,
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
  SheetContent,
  SheetTitle,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  Skeleton,
  Spinner,
  StatePanel,
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
  WorkspaceShell,
  toast,
} from "@fabrials/ui";

const series = [
  { month: "Jun", requests: 420, cost: 18 },
  { month: "Jul", requests: 610, cost: 24 },
  { month: "Aug", requests: 540, cost: 21 },
];

function Frame({ children }: { children: ReactNode }) {
  return <div className="fui-preview grid gap-4">{children}</div>;
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
    <Frame>
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
    <Frame>
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
    <Frame>
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
    <Frame>
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
    <Frame>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger render={<Button variant="outline" aria-label="Refresh records" />}>Refresh</TooltipTrigger>
          <TooltipContent>Refresh records</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </Frame>
  ),
  "hover-card": () => (
    <Frame>
      <HoverCard>
        <HoverCardTrigger render={<Button variant="outline" />}>North workspace</HoverCardTrigger>
        <HoverCardContent className="w-64 text-sm">
          Synthetic workspace. No credentials are loaded.
        </HoverCardContent>
      </HoverCard>
    </Frame>
  ),
  popover: () => (
    <Frame>
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
      <Collapsible className="max-w-md">
        <CollapsibleTrigger className="text-sm font-medium">Reasoning</CollapsibleTrigger>
        <CollapsibleContent className="pt-2 text-sm text-muted-foreground">
          Checked three synthetic sources. Nothing was sent.
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
      <SidebarProvider className="w-full max-w-xs rounded-lg border bg-sidebar p-2 text-sidebar-foreground">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton isActive>Overview</SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton>Accounts</SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton>Keys</SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
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
    <Frame>
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
        <NumberTicker value={12840} startOnView={false} />
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

export function UiDemo({ slug }: { slug: string }) {
  const Demo = demos[slug];
  if (!Demo) return <p className="text-sm">This preview is not available.</p>;
  return <Demo />;
}
