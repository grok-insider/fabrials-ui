import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Button,
  ButtonGroup,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Combobox,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
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
  ScrollArea,
  SectionHeader,
  Separator,
  SeriesChart,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  Spinner,
  Toaster,
  toast,
} from "@fabrials/ui";

const meta = {
  title: "Fabrials/Catalogue",
  parameters: { layout: "fullscreen" },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const series = [
  { month: "Jun", requests: 420, cost: 18 },
  { month: "Jul", requests: 610, cost: 24 },
  { month: "Aug", requests: 540, cost: 21 },
];

function CatalogueGallery() {
  return (
    <main className="catalogue">
      <PageHeader
        title="Catalogue"
        description="Controls added after the foundation stories. Synthetic data only."
      />
      <section className="catalogue-stack" aria-label="Navigation">
        <SectionHeader title="Navigation" />
        <div style={{ maxWidth: "100%", overflowX: "auto" }}>
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuLink href="#catalogue-nav">Overview</NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Products</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <NavigationMenuLink href="#catalogue-nav">Spanreed</NavigationMenuLink>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
        <Command className="catalogue-command" label="Command palette">
          <CommandInput aria-label="Search destinations" placeholder="Search destinations" />
          <CommandList>
            <CommandEmpty>No matching destination.</CommandEmpty>
            <CommandGroup heading="Navigate">
              <CommandItem>Overview</CommandItem>
              <CommandItem>Accounts</CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
        <p>
          Shortcut <Kbd>Ctrl</Kbd> <Kbd>K</Kbd>
        </p>
        <SidebarProvider className="catalogue-sidebar-demo" style={{ minHeight: 0 }}>
          <Sidebar collapsible="none">
            <SidebarContent>
              <SidebarGroup>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton isActive>Overview</SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton>Accounts</SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>
        </SidebarProvider>
      </section>
      <section className="catalogue-stack" aria-label="Overlays and composition" id="catalogue-nav">
        <SectionHeader title="Overlays and composition" />
        <div className="catalogue-row">
          <HoverCard>
            <HoverCardTrigger render={<Button variant="outline" />}>North workspace</HoverCardTrigger>
            <HoverCardContent>Synthetic workspace. No credentials are loaded.</HoverCardContent>
          </HoverCard>
          <Popover>
            <PopoverTrigger render={<Button variant="outline" />}>Pick a range</PopoverTrigger>
            <PopoverContent>Last 7 days, last 30 days.</PopoverContent>
          </Popover>
          <ButtonGroup aria-label="Range">
            <Button variant="outline">Day</Button>
            <Button variant="outline">Week</Button>
          </ButtonGroup>
        </div>
        <InputGroup style={{ maxWidth: "24rem" }}>
          <InputGroupAddon>https://</InputGroupAddon>
          <InputGroupInput aria-label="Host" placeholder="fabrials.com" />
        </InputGroup>
        <Collapsible>
          <CollapsibleTrigger render={<Button variant="ghost" size="sm" />}>Reasoning</CollapsibleTrigger>
          <CollapsibleContent>Checked three synthetic sources.</CollapsibleContent>
        </Collapsible>
        <ScrollArea aria-label="Suggestions" className="catalogue-scroll">
          <p>Compare usage</p>
          <p>Open accounts</p>
          <p>Refresh the pool</p>
        </ScrollArea>
        <p className="catalogue-row">
          <Spinner /> Refreshing the pool
        </p>
        <div className="fui-carousel-frame">
          <Carousel aria-label="Citations">
            <CarouselContent>
              {["Usage report", "Account list"].map((item) => (
                <CarouselItem key={item}>
                  <div className="catalogue-slide">{item}</div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>
        <Separator />
        <Label htmlFor="catalogue-workspace">Workspace</Label>
        <Combobox.Root items={["North", "South"]}>
          <Combobox.Input id="catalogue-workspace" placeholder="Filter workspaces" className="catalogue-combobox" />
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
        <Button type="button" variant="outline" onClick={() => toast("Account saved")}>
          Show notice
        </Button>
        <Toaster />
      </section>
      <section className="catalogue-stack" aria-label="Metrics">
        <SectionHeader title="Metrics" />
        <p className="catalogue-ticker">
          <NumberTicker value={12840} startOnView={false} />
        </p>
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
      </section>
    </main>
  );
}

export const Gallery: Story = { render: () => <CatalogueGallery /> };

// Two weeks share the axis labels ("Mon", "Tue"), which is what `titleKey` is for: the plot's rows must not be keyed by that label.
const twoWeeks = [
  { day: "Mon", date: "Mon 1 Jun", requests: 420, errors: 12 },
  { day: "Tue", date: "Tue 2 Jun", requests: 610, errors: 9 },
  { day: "Mon", date: "Mon 8 Jun", requests: 540, errors: 17 },
  { day: "Tue", date: "Tue 9 Jun", requests: 480, errors: 6 },
];

function ChartsGallery() {
  return (
    <main className="catalogue">
      <PageHeader
        title="Charts"
        description="Both chart kinds take keyboard focus and say what they plot. Synthetic data only."
      />
      <section className="catalogue-stack" aria-label="Bars">
        <SectionHeader title="Stacked bars" />
        <SeriesChart
          data={twoWeeks}
          xKey="day"
          titleKey="date"
          stacked
          series={[
            { key: "requests", label: "Requests" },
            { key: "errors", label: "Errors" },
          ]}
          caption="Synthetic requests and errors over two weeks"
          height={200}
        />
      </section>
      <section className="catalogue-stack" aria-label="Lines">
        <SectionHeader title="Lines" />
        <SeriesChart
          kind="line"
          data={twoWeeks}
          xKey="day"
          titleKey="date"
          series={[
            { key: "requests", label: "Requests" },
            { key: "errors", label: "Errors", dashed: true },
          ]}
          caption="Synthetic requests and errors per day"
          height={200}
        />
      </section>
    </main>
  );
}

export const Charts: Story = { render: () => <ChartsGallery /> };
