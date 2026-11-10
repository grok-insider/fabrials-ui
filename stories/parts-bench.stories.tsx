import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  Badge,
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  CalendarDayButton,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CodeLines,
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
  CopyButton,
  DirectionProvider,
  Item,
  ItemContent,
  ItemControl,
  ItemDescription,
  ItemFooter,
  ItemGroup,
  ItemHeader,
  ItemMedia,
  ItemTitle,
  Kbd,
  ModifierKeyText,
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarSeparator,
  Sparkline,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@fabrials/ui";
import {
  ActivityIcon,
  LinkPreviewCard,
  LinkWithPreview,
  SearchStepList,
  SourceCard,
  SourceFavicon,
  type SearchStep,
} from "@fabrials/ai-ui";
import { Block, Frame, Page } from "./story-frame";

// The exported parts that no story rendered on their own, each in its own story so the reference suite photographs
// only what it asks for. Synthetic data: no product name, person or URL is real.
const meta = {
  title: "Tests/Parts",
  parameters: { layout: "fullscreen" },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const code = `export function readMailbox(id: string) {
  const headers = await fetchHeaders(id, { since: null });
  return headers.filter((line) => line.seen !== true);
}`;

export const Display: Story = {
  name: "Sparkline, copy key, code lines, modifier",
  render: () => (
    <Page description="Small exported pieces: a sparkline with its summary, a key that copies, highlighted lines without a panel, and the name of this device's modifier." title="Display parts">
      <Block title="Sparkline" description="Decorative without a label, an image with one; a flat series keeps a flat line.">
        <Frame width={420}>
          <div style={{ display: "grid", gap: "var(--fui-space-3)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--fui-space-3)" }}>
              <Sparkline data={[4, 6, 5, 9, 8, 12, 11, 14]} height={32} width={120} />
              <span style={{ color: "var(--muted-foreground)", fontSize: "var(--fui-text-sm)" }}>Decorative</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--fui-space-3)" }}>
              <Sparkline color="var(--chart-2)" data={[14, 11, 9, 10, 6, 5, 3, 2]} height={32} label="Deliveries per day, last week" width={120} />
              <span style={{ color: "var(--muted-foreground)", fontSize: "var(--fui-text-sm)" }}>With a summary</span>
            </div>
            <Sparkline data={[3, 3, 3, 3]} height={32} label="No change this week" width={120} />
          </div>
        </Frame>
      </Block>
      <Block title="Copy key" description="A key that copies a value and says so in a live region.">
        <Frame width={420}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--fui-space-3)" }}>
            <CopyButton value="harbour-000412" />
            <CopyButton copiedLabel="Reference copied" label="Copy the reference" size="icon-sm" value="harbour-000412" />
            <CopyButton copiedLabel="Reference copied" label="Copy invoice 2025-0412" size="sm" value="harbour-000412" variant="outline" />
          </div>
        </Frame>
      </Block>
      <Block title="Code lines" description="The highlighter without a panel: a marked line, an added line and a boxed word.">
        <Frame width={520}>
          <pre aria-label="A snippet of TypeScript" className="fui-code" style={{ margin: 0, overflow: "auto" }} tabIndex={0}>
            <CodeLines addedLines={[2]} code={code} highlightLines={[3]} highlightWords={["seen"]} language="ts" />
          </pre>
        </Frame>
      </Block>
      <Block title="Modifier key" description="The main modifier as this device prints it, inside a key cap and beside a chord.">
        <Frame width={420}>
          <p style={{ display: "flex", alignItems: "center", gap: "var(--fui-space-2)", margin: 0 }}>
            <Kbd>
              <ModifierKeyText />
            </Kbd>
            <span>then</span>
            <Kbd>K</Kbd>
            <span style={{ color: "var(--muted-foreground)", fontSize: "var(--fui-text-sm)" }}>opens the palette</span>
          </p>
        </Frame>
      </Block>
    </Page>
  ),
};

export const TableAndItem: Story = {
  name: "Table foot and caption, item header, control and foot",
  render: () => (
    <Page description="The labelled foot of a table, its caption, and the three slots of a row that otherwise has none." title="Table and item parts">
      <Block title="Table with a caption and a foot" description="A caption below the grid and a foot that carries the total.">
        <Frame width={560}>
          <Table>
            <TableCaption>Invoices issued in October 2026, before tax.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>2025-0412</TableCell>
                <TableCell>Northwind</TableCell>
                <TableCell>€1,240.00</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>2025-0413</TableCell>
                <TableCell>Contoso</TableCell>
                <TableCell>€860.00</TableCell>
              </TableRow>
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell>Total</TableCell>
                <TableCell>2 invoices</TableCell>
                <TableCell>€2,100.00</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </Frame>
      </Block>
      <Block title="A row with a header, a control and a foot" description="A message row: who and when on top, a state control at the end, a line of detail at the bottom.">
        <Frame width={560}>
          <ItemGroup aria-label="Messages" bordered>
            <Item>
              <ItemHeader>
                <ItemTitle>Northwind Weekly</ItemTitle>
                <span style={{ color: "var(--muted-foreground)", fontSize: "var(--fui-text-sm)" }}>09:12</span>
              </ItemHeader>
              <ItemContent>
                <ItemDescription>Your October summary is ready. Two invoices are still open.</ItemDescription>
              </ItemContent>
              <ItemMedia variant="icon">
                <Avatar size="sm">
                  <AvatarFallback>NW</AvatarFallback>
                </Avatar>
              </ItemMedia>
              <ItemControl>
                <Badge tone="warning">Unread</Badge>
              </ItemControl>
              <ItemFooter>
                <span style={{ color: "var(--muted-foreground)", fontSize: "var(--fui-text-sm)" }}>Invoices · Finance</span>
              </ItemFooter>
            </Item>
            <Item>
              <ItemHeader>
                <ItemTitle>Contoso Deals</ItemTitle>
                <span style={{ color: "var(--muted-foreground)", fontSize: "var(--fui-text-sm)" }}>Yesterday</span>
              </ItemHeader>
              <ItemContent>
                <ItemDescription>Your quote was accepted.</ItemDescription>
              </ItemContent>
              <ItemControl>
                <Badge>Read</Badge>
              </ItemControl>
            </Item>
          </ItemGroup>
        </Frame>
      </Block>
      <Block title="The same row in a right-to-left page" description="Header, control and foot follow the writing direction.">
        <Frame dir="rtl" width={560}>
          <ItemGroup aria-label="الرسائل" bordered>
            <Item>
              <ItemHeader>
                <ItemTitle>نورث ويند الأسبوعية</ItemTitle>
                <span style={{ color: "var(--muted-foreground)", fontSize: "var(--fui-text-sm)" }}>٠٩:١٢</span>
              </ItemHeader>
              <ItemContent>
                <ItemDescription>ملخص أكتوبر جاهز. فاتورتان ما زالتا مفتوحتين.</ItemDescription>
              </ItemContent>
              <ItemControl>
                <Badge tone="warning">غير مقروء</Badge>
              </ItemControl>
              <ItemFooter>
                <span style={{ color: "var(--muted-foreground)", fontSize: "var(--fui-text-sm)" }}>الفواتير · المالية</span>
              </ItemFooter>
            </Item>
          </ItemGroup>
        </Frame>
      </Block>
    </Page>
  ),
};

export const Commands: Story = {
  name: "Command separator and shortcut",
  render: () => (
    <Page description="The two small parts of the command list: the rule between groups and the keys at the end of a row." title="Command parts">
      <Block title="A list with a rule and shortcuts" description="Each row ends with the keys that run it.">
        <Frame width={520}>
          <Command label="Destinations">
            <CommandInput aria-label="Search destinations" placeholder="Search destinations" />
            <CommandList>
              <CommandGroup heading="Navigate">
                <CommandItem value="Go to Inbox">
                  Inbox
                  <CommandShortcut>G I</CommandShortcut>
                </CommandItem>
                <CommandItem value="Open Archive">
                  Archive
                  <CommandShortcut>G A</CommandShortcut>
                </CommandItem>
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup heading="Create">
                <CommandItem value="New message">
                  New message
                  <CommandShortcut>
                    <ModifierKeyText /> N
                  </CommandShortcut>
                </CommandItem>
                <CommandItem value="New folder">
                  New folder
                  <CommandShortcut>⇧ N</CommandShortcut>
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </Frame>
      </Block>
      <Block title="In a right-to-left page" description="The rule spans the list and the keys sit at the inline end.">
        <Frame dir="rtl" width={520}>
          <Command label="الوجهات">
            <CommandInput aria-label="ابحث في الوجهات" placeholder="ابحث في الوجهات" />
            <CommandList>
              <CommandGroup heading="انتقال">
                <CommandItem value="إلى البريد الوارد">
                  البريد الوارد
                  <CommandShortcut>G I</CommandShortcut>
                </CommandItem>
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup heading="إنشاء">
                <CommandItem value="رسالة جديدة">
                  رسالة جديدة
                  <CommandShortcut>⌘ N</CommandShortcut>
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </Frame>
      </Block>
    </Page>
  ),
};

const archived = ["Delta Works", "Evergreen", "Globex", "Harbour Freight", "Initech", "Juniper", "Kestrel", "Litware", "Octavo", "Proseware", "Quartz"];

const billingItems = { northwind: "Northwind", contoso: "Contoso", fabrikam: "Fabrikam", ...Object.fromEntries(archived.map((name) => [name.toLowerCase().replace(/\s+/g, "-"), name])) };

export const SelectParts: Story = {
  name: "Select group, label, separator and scroll keys",
  render: () => (
    <Page description="Groups with their labels, the rule between them, and the keys that scroll a list longer than the popup." title="Select parts">
      <Block title="An open select" description="Two groups, a label each and the rule between them. The scroll keys are at the ends of the list; they draw nothing until the component lets the list scroll (see the note in the behaviour suite).">
        <Frame width={420}>
          <Select defaultOpen defaultValue="northwind" items={billingItems}>
            <SelectTrigger aria-label="Billing provider">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectScrollUpButton />
              <SelectGroup>
                <SelectLabel>Current providers</SelectLabel>
                <SelectItem value="northwind">Northwind</SelectItem>
                <SelectItem value="contoso">Contoso</SelectItem>
                <SelectItem value="fabrikam">Fabrikam</SelectItem>
              </SelectGroup>
              <SelectSeparator />
              <SelectGroup>
                <SelectLabel>Archived</SelectLabel>
                {archived.map((provider) => (
                  <SelectItem key={provider} value={provider.toLowerCase().replace(/\s+/g, "-")}>
                    {provider}
                  </SelectItem>
                ))}
              </SelectGroup>
              <SelectScrollDownButton />
            </SelectContent>
          </Select>
        </Frame>
      </Block>
      <Block title="Closed" description="The trigger and the label of the value it holds.">
        <Frame width={420}>
          <Select defaultValue="contoso" items={billingItems}>
            <SelectTrigger aria-label="Secondary provider">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Providers</SelectLabel>
                <SelectItem value="northwind">Northwind</SelectItem>
                <SelectItem value="contoso">Contoso</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </Frame>
      </Block>
    </Page>
  ),
};

export const SidebarParts: Story = {
  name: "Sidebar group action, skeleton and separator",
  render: () => (
    <Page description="Three parts of the sidebar that no page rendered: the action beside a group label, the rows that stand in while it loads, and the rule between groups." title="Sidebar parts">
      <Block title="A group with a label, an action and rows loading" description="The add key sits at the inline end of the label; the skeletons are rows that are not there yet.">
        <Frame width={300}>
          <div className="fui-sidebar" style={{ position: "relative", height: "auto" }}>
            <SidebarGroup>
              <SidebarGroupLabel>Projects</SidebarGroupLabel>
              <SidebarGroupAction aria-label="Add a project">＋</SidebarGroupAction>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuSkeleton showIcon />
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuSkeleton />
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuSkeleton showIcon />
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel>Workspace</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu aria-label="Workspace">
                  <SidebarMenuItem>
                    <span style={{ display: "block", padding: "var(--fui-space-1) var(--fui-space-2)", fontSize: "var(--fui-text-sm)" }}>Invoices</span>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </div>
        </Frame>
      </Block>
    </Page>
  ),
};

export const AvatarAndCalendar: Story = {
  name: "Avatar group count and calendar day",
  render: () => (
    <Page description="The tile that counts the faces a group leaves out, and one day of the calendar grid in its states." title="Avatar and calendar parts">
      <Block title="Avatar group count" description="A group of four faces with the rest counted, and the count on its own.">
        <Frame width={420}>
          <div style={{ display: "grid", gap: "var(--fui-space-4)" }}>
            <AvatarGroup aria-label="Members" max={3}>
              <Avatar>
                <AvatarFallback>AL</AvatarFallback>
              </Avatar>
              <Avatar>
                <AvatarFallback>GH</AvatarFallback>
              </Avatar>
              <Avatar>
                <AvatarFallback>ED</AvatarFallback>
              </Avatar>
              <Avatar>
                <AvatarFallback>KA</AvatarFallback>
              </Avatar>
            </AvatarGroup>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--fui-space-3)" }}>
              <AvatarGroupCount>+8</AvatarGroupCount>
              <span style={{ color: "var(--muted-foreground)", fontSize: "var(--fui-text-sm)" }}>The count on its own</span>
            </div>
          </div>
        </Frame>
      </Block>
      <Block title="Calendar day" description="One day of the grid: plain, today, selected and outside the month. It carries no name of its own; the calendar supplies the grid and the labels.">
        <Frame width={420}>
          <div style={{ display: "flex", gap: "var(--fui-space-2)", alignItems: "center" }}>
            <CalendarDayButton>12</CalendarDayButton>
            <CalendarDayButton data-today>13</CalendarDayButton>
            <CalendarDayButton data-selected>14</CalendarDayButton>
            <CalendarDayButton data-outside>15</CalendarDayButton>
            <CalendarDayButton disabled>16</CalendarDayButton>
          </div>
        </Frame>
      </Block>
    </Page>
  ),
};

export const PopoverAndCard: Story = {
  name: "Popover header and title, card action",
  render: () => (
    <Page description="The three text slots of a popover panel and the action slot in the corner of a card." title="Popover and card parts">
      <Block title="An open popover" description="A header that holds the title and its description, with the content under it.">
        <Frame width={420}>
          <Popover defaultOpen>
            <PopoverTrigger render={<Button variant="outline">Storage</Button>} />
            <PopoverContent>
              <PopoverHeader>
                <PopoverTitle>Storage used</PopoverTitle>
                <PopoverDescription>12.4 GB of 20 GB, across 3 mailboxes.</PopoverDescription>
              </PopoverHeader>
              <p style={{ margin: 0, fontSize: "var(--fui-text-sm)" }}>Attachments make up most of it.</p>
            </PopoverContent>
          </Popover>
        </Frame>
      </Block>
      <Block title="Card with an action" description="A key in the corner of the header, level with the title.">
        <Frame width={420}>
          <Card>
            <CardHeader>
              <CardTitle>Invoices</CardTitle>
              <CardDescription>2 open, 12 paid</CardDescription>
              <CardAction>
                <Button size="sm" variant="ghost">
                  Open
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent>€2,100.00 outstanding this month.</CardContent>
          </Card>
        </Frame>
      </Block>
    </Page>
  ),
};

export const NavigationParts: Story = {
  name: "Breadcrumb ellipsis",
  render: () => (
    <Page description="The fold that stands for the pages a trail leaves out, with a name for assistive technology." title="Breadcrumb ellipsis">
      <Block title="Folded trail" description="Between the first page and the last two, and as the only fold in a short trail.">
        <Frame width={560}>
          <div style={{ display: "grid", gap: "var(--fui-space-3)" }}>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="#mailboxes">Mailboxes</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbEllipsis />
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="#invoices">Invoices</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>2025-0412</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <Breadcrumb aria-label="Trail with a named fold">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="#mailboxes">Mailboxes</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbEllipsis label="Three more pages" />
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Settings</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </Frame>
      </Block>
    </Page>
  ),
};

const sources = [
  { url: "https://docs.example.org/guides/cascade-layers", title: "Cascade layers in practice", number: 1 },
  { url: "https://reference.example.net/css/color-mix", title: "color-mix() reference", number: 2 },
  { url: "https://www.example.com/blog/2026/tokens", title: "Tokens across products", number: 3 },
];

export const SourceParts: Story = {
  name: "Source card, favicon, link preview",
  render: () => (
    <Page description="A source as a row, its favicon on its own, the card a preview opens, and a link that carries one." title="Source parts">
      <Block title="Source cards" description="Numbered, with the host or the path under the title, one of them active.">
        <Frame width={520}>
          <div style={{ display: "grid", gap: "var(--fui-space-1)" }}>
            {sources.map((source) => (
              <SourceCard active={source.number === 2} faviconUrl={() => null} key={source.url} number={source.number} title={source.title} url={source.url} />
            ))}
            <SourceCard faviconUrl={() => null} url="https://archive.example.dev/posts/field-sizing-the-future-of-css-forms-and-the-rest-of-a-long-title" />
          </div>
        </Frame>
      </Block>
      <Block title="Favicon and preview card" description="The favicon alone, the preview card it fills once loaded, and a link that opens one on hover.">
        <Frame width={520}>
          <div style={{ display: "grid", gap: "var(--fui-space-3)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--fui-space-3)" }}>
              <SourceFavicon url="https://docs.example.org/guides/cascade-layers" />
              <span style={{ color: "var(--muted-foreground)", fontSize: "var(--fui-text-sm)" }}>Favicon, with no resolver to draw from</span>
            </div>
            <LinkPreviewCard label="Cascade layers in practice" meta="Source 1 · docs.example.org" url="https://docs.example.org/guides/cascade-layers" />
            <p style={{ margin: 0 }}>
              The guide is at{" "}
              <LinkWithPreview faviconUrl={() => null} href="https://docs.example.org/guides/cascade-layers">
                docs.example.org
              </LinkWithPreview>
              ; hover or focus it for the preview.
            </p>
          </div>
        </Frame>
      </Block>
      <Block title="In a right-to-left page" description="A row and a card in an Arabic page.">
        <Frame dir="rtl" width={520}>
          <DirectionProvider direction="rtl">
            <div style={{ display: "grid", gap: "var(--fui-space-1)" }}>
              <SourceCard faviconUrl={() => null} number={1} title="طبقات التتالي عمليًا" url="https://docs.example.org/guides/cascade-layers" />
              <LinkPreviewCard label="طبقات التتالي عمليًا" meta="المصدر ١ · docs.example.org" url="https://docs.example.org/guides/cascade-layers" />
            </div>
          </DirectionProvider>
        </Frame>
      </Block>
    </Page>
  ),
};

const steps: SearchStep[] = [
  {
    type: "search",
    query: "css cascade layers design systems",
    sources: ["https://developer.example.org/docs/css/cascade-layers", "https://blog.example.com/2026/layers-in-design-systems"],
  },
  { type: "search", query: "color-mix oklab browser support", sources: ["https://caniuse.example.com/css-color-mix"] },
  { type: "open_page", url: "https://docs.example.org/guides/cascade-layers" },
];

export const SearchParts: Story = {
  name: "Search step list and activity icon",
  render: () => (
    <Page description="A list of search steps with the pages each one opened, and the icon that marks work in progress." title="Search parts">
      <Block title="Search steps" description="Two searches and an opened page, over and settled.">
        <Frame width={520}>
          <SearchStepList faviconUrl={() => null} steps={steps} />
        </Frame>
      </Block>
      <Block title="Activity icon" description="Live and settled, beside the label it accompanies.">
        <Frame width={520}>
          <div style={{ display: "grid", gap: "var(--fui-space-2)" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "var(--fui-space-2)" }}>
              <ActivityIcon icon={<span aria-hidden>⌕</span>} live />
              Searching the web
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "var(--fui-space-2)" }}>
              <ActivityIcon icon={<span aria-hidden>⌕</span>} live={false} />
              Searched 4 sources
            </span>
          </div>
        </Frame>
      </Block>
    </Page>
  ),
};
