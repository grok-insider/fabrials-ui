import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  AlertDialog as AlertDialogPart,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  ButtonGroup,
  ButtonGroupSeparator,
  ButtonGroupText,
  Collapsible as CollapsiblePart,
  CollapsibleContent,
  CollapsibleTrigger,
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  HoverCard as HoverCardPart,
  HoverCardContent,
  HoverCardTrigger,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
  NavigationMenu as NavigationMenuPart,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NumberTicker as NumberTickerPart,
  Pagination as PaginationPart,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  Sheet as SheetPart,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Tooltip as TooltipPart,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@fabrials/ui";
import { ChatComposer } from "@fabrials/ai-ui";
import { Block, Frame, Page } from "./story-frame";

// One bench per component, so a keyboard test opens only what it needs. Every name, value and date is synthetic.
const meta = {
  title: "Tests/Behaviour",
  parameters: { layout: "fullscreen" },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const HoverCard: Story = {
  name: "Hover card",
  render: () => (
    <Page description="A source preview that opens on hover and on focus, with a link inside it." title="Hover card">
      <Block title="A source" description="Keyboard focus opens it as hover does; Escape or moving on closes it.">
        <Frame width={420}>
          <p style={{ margin: 0 }}>
            Read the note on{" "}
            <HoverCardPart>
              <HoverCardTrigger delay={0} href="#cascade">
                Cascade layers in practice
              </HoverCardTrigger>
              <HoverCardContent aria-label="Preview of the source">
                <strong>Cascade layers in practice</strong>
                <p style={{ margin: "0.25rem 0 0" }}>docs.example.org · 6 min read</p>
                <a href="#cascade-full">Open the article</a>
              </HoverCardContent>
            </HoverCardPart>{" "}
            before importing anything.
          </p>
          <p style={{ margin: "0.75rem 0 0" }}>
            <button type="button">Next control</button>
          </p>
        </Frame>
      </Block>
    </Page>
  ),
};

export const NavigationMenu: Story = {
  name: "Navigation menu",
  render: () => (
    <Page description="A menu of triggers whose panels hold links, and one plain link that is the current page." title="Navigation menu">
      <Block title="Main navigation" description="Arrows open a panel and move between triggers; Escape returns to the trigger.">
        <Frame width={720}>
          <NavigationMenuPart aria-label="Main">
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Product</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: "0.25rem", minWidth: "12rem" }}>
                    <li>
                      <NavigationMenuLink href="#overview">Overview</NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink href="#changelog">Changelog</NavigationMenuLink>
                    </li>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Resources</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: "0.25rem", minWidth: "12rem" }}>
                    <li>
                      <NavigationMenuLink href="#guides">Guides</NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink href="#api">API reference</NavigationMenuLink>
                    </li>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink aria-current="page" href="#docs">
                  Docs
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenuPart>
        </Frame>
      </Block>
      <Block title="Right to left" description="The same menu inside a right-to-left page.">
        <Frame dir="rtl" width={720}>
          <NavigationMenuPart aria-label="القائمة" dir="rtl">
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger>المنتج</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: "0.25rem", minWidth: "12rem" }}>
                    <li>
                      <NavigationMenuLink href="#overview">نظرة عامة</NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink href="#changelog">سجل التغييرات</NavigationMenuLink>
                    </li>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuTrigger>الموارد</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: "0.25rem", minWidth: "12rem" }}>
                    <li>
                      <NavigationMenuLink href="#guides">الأدلة</NavigationMenuLink>
                    </li>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenuPart>
        </Frame>
      </Block>
    </Page>
  ),
};

export const Collapsible: Story = {
  name: "Collapsible",
  render: () => (
    <Page description="A trigger that opens a panel, closed and open, and one that starts open." title="Collapsible">
      <Block title="Closed" description="The panel is out of the tab order until it opens.">
        <Frame width={420}>
          <CollapsiblePart>
            <CollapsibleTrigger>How sync works</CollapsibleTrigger>
            <CollapsibleContent className="fui-accordion-body">
              <p style={{ margin: 0 }}>Headers are fetched first; a body arrives when a message is opened.</p>
              <a href="#sync">Read the sync guide</a>
            </CollapsibleContent>
          </CollapsiblePart>
        </Frame>
      </Block>
      <Block title="Open" description="A panel that starts open, so both states are on one screen.">
        <Frame width={420}>
          <CollapsiblePart defaultOpen>
            <CollapsibleTrigger>Delete after 30 days</CollapsibleTrigger>
            <CollapsibleContent className="fui-accordion-body">
              <p style={{ margin: 0 }}>Messages in the archive are removed after 30 days.</p>
              <a href="#retention">Change the retention</a>
            </CollapsibleContent>
          </CollapsiblePart>
        </Frame>
      </Block>
    </Page>
  ),
};

export const Tooltip: Story = {
  name: "Tooltip",
  render: () => (
    <Page description="A label on an icon key, a tooltip on a named button, and one inside a dialog." title="Tooltip">
      <TooltipProvider>
        <Block title="On a key" description="Focusing the key shows its label, which is also its name.">
          <Frame width={420}>
            <TooltipPart>
              <TooltipTrigger
                render={
                  <Button aria-label="Copy the reference" size="icon" variant="outline">
                    <span aria-hidden>⧉</span>
                  </Button>
                }
              />
              <TooltipContent>Copy the reference</TooltipContent>
            </TooltipPart>
          </Frame>
        </Block>
        <Block title="On a named button" description="The trigger keeps its own name; the tooltip describes it.">
          <Frame width={420}>
            <TooltipPart>
              <TooltipTrigger render={<Button variant="outline">Sync now</Button>} />
              <TooltipContent>Fetch new headers only</TooltipContent>
            </TooltipPart>
          </Frame>
        </Block>
        <Block title="Inside a dialog" description="Escape hides the tooltip and leaves the dialog open.">
          <Frame width={420}>
            <Dialog>
              <DialogTrigger render={<Button variant="outline">Rename workspace</Button>} />
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Rename workspace</DialogTitle>
                  <DialogDescription>The new name appears in the header and in links.</DialogDescription>
                </DialogHeader>
                <DialogBody>
                  <TooltipPart>
                    <TooltipTrigger render={<Button variant="outline">Why rename?</Button>} />
                    <TooltipContent>Renaming keeps every project and its history.</TooltipContent>
                  </TooltipPart>
                </DialogBody>
                <DialogFooter>
                  <Button variant="outline">Cancel</Button>
                  <Button>Save</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </Frame>
        </Block>
      </TooltipProvider>
    </Page>
  ),
};

export const Navigation: Story = {
  name: "Pagination and breadcrumb",
  render: () => (
    <Page description="Two navigation landmarks: the trail to this page and the pages of a collection." title="Pagination and breadcrumb">
      <Block title="Breadcrumb" description="The trail ends on the current page, and a long one folds behind an ellipsis.">
        <Frame width={640}>
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
                <BreadcrumbLink href="#archive">Archive</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Invoices, 2025</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </Frame>
      </Block>
      <Block title="Pagination" description="The first page has no previous link; the last has no next.">
        <Frame width={640}>
          <PaginationPart>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious aria-disabled="true" />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#page-1" isActive>
                  1
                </PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#page-2">2</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#page-3">3</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#page-12">12</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext href="#page-2" />
              </PaginationItem>
            </PaginationContent>
          </PaginationPart>
        </Frame>
      </Block>
    </Page>
  ),
};

function TickerDemo() {
  const [value, setValue] = useState(1200);
  return (
    <div style={{ display: "grid", gap: "0.75rem" }}>
      <span className="fui-stat-value" style={{ fontSize: "var(--fui-text-xl)" }}>
        <NumberTickerPart startOnView={false} value={value} />
      </span>
      <Button onClick={() => setValue((current) => current + 1000)} size="sm" variant="outline">
        Add a thousand
      </Button>
    </div>
  );
}

export const NumberTicker: Story = {
  name: "Number ticker",
  render: () => (
    <Page description="Rolling numbers: a plain one, a formatted one, a padded one with a prefix and suffix, and one a button changes." title="Number ticker">
      <Block title="Values" description="The readable text is the final value, at every moment of the roll.">
        <Frame width={420}>
          <div style={{ display: "grid", gap: "0.75rem" }}>
            <NumberTickerPart startOnView={false} value={128} />
            <NumberTickerPart locale startOnView={false} value={48210} />
            <NumberTickerPart pad={5} prefix="$" startOnView={false} suffix=".00" value={42} />
            <TickerDemo />
          </div>
        </Frame>
      </Block>
    </Page>
  ),
};

function MenuPanel() {
  const [sidebar, setSidebar] = useState(true);
  const [toolbar, setToolbar] = useState(false);
  const [density, setDensity] = useState("compact");
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline">View</Button>} />
      <DropdownMenuContent>
        <DropdownMenuGroup>
          <DropdownMenuLabel>Panels</DropdownMenuLabel>
          <DropdownMenuCheckboxItem checked={sidebar} onCheckedChange={setSidebar}>
            Sidebar
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem checked={toolbar} onCheckedChange={setToolbar}>
            Toolbar
          </DropdownMenuCheckboxItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>Density</DropdownMenuLabel>
          <DropdownMenuRadioGroup onValueChange={setDensity} value={density}>
            <DropdownMenuRadioItem value="compact">Compact</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="comfortable">Comfortable</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Share</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem>
              Copy link
              <DropdownMenuShortcut>⌘C</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem>Email it</DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          Rename
          <DropdownMenuShortcut>⌘R</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem>Duplicate</DropdownMenuItem>
        <DropdownMenuItem>Archive</DropdownMenuItem>
        <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MenusPage({ dir }: { dir?: "rtl" }) {
  return (
    <Page description="A dropdown with checkbox and radio items, a submenu, typeahead, and a context menu on a card." title="Menus">
      <Block title="Dropdown" description="Space ticks a checkbox and keeps the menu open; Enter on a row runs it and closes.">
        <Frame dir={dir} width={420}>
          <MenuPanel />
        </Frame>
      </Block>
      <Block title="Context menu" description="A right-click, the Menu key or Shift+F10 opens it on the card.">
        <Frame dir={dir} width={420}>
          <ContextMenu>
            <ContextMenuTrigger>
              <div
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: "var(--fui-radius-md)",
                  padding: "var(--fui-space-3)",
                }}
                tabIndex={0}
              >
                Invoice 2025-0412 · €1,240.00
              </div>
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuGroup>
                <ContextMenuLabel>Invoice</ContextMenuLabel>
                <ContextMenuItem>Open</ContextMenuItem>
                <ContextMenuCheckboxItem defaultChecked>Mark as read</ContextMenuCheckboxItem>
              </ContextMenuGroup>
              <ContextMenuSeparator />
              <ContextMenuRadioGroup defaultValue="euro">
                <ContextMenuRadioItem value="euro">Euros</ContextMenuRadioItem>
                <ContextMenuRadioItem value="dollar">Dollars</ContextMenuRadioItem>
              </ContextMenuRadioGroup>
              <ContextMenuSeparator />
              <ContextMenuSub>
                <ContextMenuSubTrigger>Export</ContextMenuSubTrigger>
                <ContextMenuSubContent>
                  <ContextMenuItem>CSV</ContextMenuItem>
                  <ContextMenuItem>PDF</ContextMenuItem>
                </ContextMenuSubContent>
              </ContextMenuSub>
            </ContextMenuContent>
          </ContextMenu>
        </Frame>
      </Block>
    </Page>
  );
}

export const Menus: Story = { name: "Menus", render: () => <MenusPage /> };

export const MenusRtl: Story = { name: "Menus, right to left", render: () => <MenusPage dir="rtl" /> };

export const AlertDialog: Story = {
  name: "Alert dialog",
  render: () => (
    <Page description="A confirmation that names the risk, with the safe action first." title="Alert dialog">
      <Block title="Delete a workspace" description="Opening it moves focus into the dialog; Escape and Cancel both leave without deleting.">
        <Frame width={420}>
          <AlertDialogPart>
            <AlertDialogTrigger render={<Button variant="outline">Delete workspace</Button>} />
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogMedia>!</AlertDialogMedia>
                <AlertDialogTitle>Delete “Harbour”?</AlertDialogTitle>
                <AlertDialogDescription>Its 12 projects and their invoices are removed. This cannot be undone.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep it</AlertDialogCancel>
                <AlertDialogAction>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogPart>
        </Frame>
      </Block>
    </Page>
  ),
};

export const Sheet: Story = {
  name: "Sheet",
  render: () => (
    <Page description="A panel on the inline end with a header, a body that scrolls and a footer of actions." title="Sheet">
      <Block title="Filters" description="The header, the body and the footer, with a close key in the footer.">
        <Frame width={420}>
          <SheetPart>
            <SheetTrigger render={<Button variant="outline">Open filters</Button>} />
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
                <SheetDescription>Narrow the list of invoices.</SheetDescription>
              </SheetHeader>
              <SheetBody>
                <p style={{ margin: 0 }}>Status, period and amount. The body scrolls when the list of filters is long.</p>
                <ul>
                  <li>Draft</li>
                  <li>Sent</li>
                  <li>Paid</li>
                  <li>Overdue</li>
                  <li>Void</li>
                  <li>Written off</li>
                </ul>
              </SheetBody>
              <SheetFooter>
                <SheetClose render={<Button variant="outline">Cancel</Button>} />
                <Button>Apply</Button>
              </SheetFooter>
            </SheetContent>
          </SheetPart>
        </Frame>
      </Block>
    </Page>
  ),
};

export const InputGroups: Story = {
  name: "Input groups",
  render: () => (
    <Page description="Fields with addons and keys inside one frame, and a group of buttons with a separator." title="Input groups">
      <Block title="Field with addons" description="One ring around the whole group; the field is the only text stop.">
        <Frame width={420}>
          <div style={{ display: "grid", gap: "0.75rem" }}>
            <InputGroup aria-label="Workspace address">
              <InputGroupAddon>
                <InputGroupText>https://</InputGroupText>
              </InputGroupAddon>
              <InputGroupInput aria-label="Workspace address" defaultValue="harbour" />
              <InputGroupButton aria-label="Copy the address" size="icon-xs">
                ⧉
              </InputGroupButton>
            </InputGroup>
            <InputGroup aria-label="Note to the team">
              <InputGroupTextarea aria-label="Note to the team" defaultValue="Headers only, please." rows={2} />
              <InputGroupAddon align="block-end">
                <InputGroupText>280 characters left</InputGroupText>
                <InputGroupButton size="xs">Send</InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          </div>
        </Frame>
      </Block>
      <Block title="Button group" description="Three keys that read as one range, with a separator and a line of text.">
        <Frame width={420}>
          <ButtonGroup aria-label="Range">
            <Button variant="outline">Day</Button>
            <Button variant="outline">Week</Button>
            <Button variant="outline">Month</Button>
            <ButtonGroupSeparator />
            <ButtonGroupText>Updated 2 min ago</ButtonGroupText>
          </ButtonGroup>
        </Frame>
      </Block>
    </Page>
  ),
};

function ComposerExtrasDemo() {
  const [value, setValue] = useState("");
  const [pasted, setPasted] = useState<string[]>([]);
  const [sent, setSent] = useState<string[]>([]);
  return (
    <div style={{ display: "grid", gap: "0.75rem" }}>
      <ChatComposer
        attachments={pasted.length ? <span>Attached: {pasted.join(", ")}</span> : undefined}
        label="Message the assistant"
        onPasteFiles={(files) => setPasted(files.map((file) => file.name))}
        onSubmit={(text) => {
          setSent((current) => [...current, text]);
          setValue("");
        }}
        onValueChange={setValue}
        placeholder="Ask anything"
        value={value}
      />
      <p data-testid="sent" style={{ margin: 0 }}>
        {sent.length ? `Sent: ${sent.join(" · ")}` : "Nothing sent"}
      </p>
    </div>
  );
}

export const ComposerExtras: Story = {
  name: "Composer, paste and composition",
  render: () => (
    <Page description="A composer that takes files from the clipboard and leaves an input method composition alone." title="Composer extras">
      <Block title="Paste and composition" description="A pasted file becomes an attachment; Enter during a composition sends nothing.">
        <Frame width={520}>
          <ComposerExtrasDemo />
        </Frame>
      </Block>
    </Page>
  ),
};
