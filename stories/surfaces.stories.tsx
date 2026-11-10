import type { CSSProperties } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Pause, Play, Volume2 } from "lucide-react";
import {
  Button,
  CodePanel,
  CollectionToolbar,
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
  Dialog,
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
  IconButton,
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
  SearchInput,
  Snippet,
  StatePanel,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Toaster,
  toast,
} from "@fabrials/ui";
import { CodeBlock } from "@fabrials/ai-ui";
import { Block, Frame, Page } from "./story-frame";

// 0.12, surfaces and targets, in fixed states for the visual suite: touch buttons beside the default ones, a popover with its
// close key, scroll regions that overflow beside ones that fit, a state panel with chips, and every floating surface under
// the overlay tokens. The triggers open the real overlays for the behaviour tests; the pictures are of the closed page.

const row: CSSProperties = { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "var(--fui-space-3)" };
const stack: CSSProperties = { display: "grid", gap: "var(--fui-space-3)", gridTemplateColumns: "minmax(0, 1fr)" };

const PARCELS = [
  "Parcel 1 left the Porto depot at 06:40 and is due on Thursday.",
  "Parcel 2 is held at customs: the invoice lacks a commodity code.",
  "Parcel 3 was delivered to the front desk and signed for by R. Duarte.",
  "The carrier for parcels 1 and 2 is CTT Expresso; parcel 3 went by bike courier.",
  "A held parcel is returned after ten working days unless the code arrives.",
  "Returns are free within thirty days and are collected from the same address.",
  "The insurance covers each parcel up to its declared value, less the first 20 euros.",
  "Delivery windows are 09:00 to 13:00 and 14:00 to 19:00 on working days.",
];

function Targets({ dir }: { dir?: "rtl" }) {
  return (
    <Frame dir={dir}>
      <div style={stack}>
        <div style={row} data-testid={dir ? undefined : "buttons"}>
          <Button>Default</Button>
          <Button size="touch">Touch</Button>
          <Button size="touch" variant="outline">
            <Volume2 aria-hidden /> Listen again
          </Button>
          <Button size="sm">Small</Button>
        </div>
        <div style={row} data-testid={dir ? undefined : "icon-buttons"}>
          <IconButton label="Play" size="icon" tooltip={false} variant="outline">
            <Play aria-hidden />
          </IconButton>
          <IconButton label="Play, touch" size="touch" tooltip={false} variant="outline">
            <Play aria-hidden />
          </IconButton>
          <IconButton label="Pause, touch" size="touch" tooltip={false}>
            <Pause aria-hidden />
          </IconButton>
        </div>
        <div style={row}>
          <Button loading loadingLabel="Saving">
            Save
          </Button>
          <Button loading loadingLabel="Checking your answer" size="touch" variant="secondary">
            Check
          </Button>
          <Button loadingLabel="Saving" variant="outline">
            Save
          </Button>
        </div>
      </div>
    </Frame>
  );
}

/** The popover's surface in the page, so the picture has it: the root gives the close key and the title their context. */
function InlinePopover({ dir, lines, limit }: { dir?: "rtl"; lines: number; limit?: string }) {
  return (
    <Popover>
      <div className="fui-popover" data-sample="popover-inline" dir={dir} style={{ maxBlockSize: limit }}>
        <PopoverHeader>
          <PopoverTitle>{dir ? "الشحن إلى لشبونة" : "Shipping to Lisbon"}</PopoverTitle>
          <PopoverDescription>{dir ? "ثلاثة طرود وشركتا نقل." : "Three parcels, two carriers."}</PopoverDescription>
        </PopoverHeader>
        {PARCELS.slice(0, lines).map((line) => (
          <p key={line} style={{ margin: 0 }}>
            {dir ? "غادر الطرد الأول مستودع بورتو وسيصل يوم الخميس." : line}
          </p>
        ))}
        <PopoverClose label={dir ? "إغلاق" : "Close"} />
      </div>
    </Popover>
  );
}

const LONG_LINE =
  'export const endpoint = "https://api.example.test/v1/workspaces/acme/invoices?status=open&sort=due_date&direction=asc&page_size=200&include=customer,lines,payments";';

/** Each floating surface's class with a line in it, to be read under whatever overlay tokens its parent sets. */
function Samples() {
  const still: CSSProperties = { position: "static", inlineSize: "auto", blockSize: "auto", minInlineSize: 0 };
  return (
    <div style={{ ...row, alignItems: "flex-start" }}>
      <div className="fui-menu" data-sample="menu" style={still}>
        <div className="fui-menu-item">Rename</div>
        <div className="fui-menu-item">Duplicate</div>
      </div>
      <div className="fui-popover" data-sample="popover" style={{ ...still, inlineSize: "12rem" }}>
        Popover and hover card
      </div>
      <div className="fui-nav-menu-popup" data-sample="nav-menu" style={{ ...still, padding: "var(--fui-space-3)" }}>
        Navigation menu
      </div>
      <div className="fui-chart-tip" data-sample="chart-tip" style={still}>
        Chart tip
      </div>
      <div className="fui-dialog" data-sample="dialog" style={{ ...still, padding: "var(--fui-space-4)" }}>
        Dialog and sheet
      </div>
      <div data-sample="command" style={{ inlineSize: "12rem" }}>
        <Command label="Go to">
          <CommandList>
            <CommandGroup heading="Go to">
              <CommandItem>Inbox</CommandItem>
              <CommandItem>Archive</CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </div>
    </div>
  );
}

const TINTED = {
  "--fui-overlay-surface": "var(--brand-soft)",
  "--fui-overlay-border": "var(--brand-ink)",
  "--fui-overlay-shadow": "0 0 0 3px color-mix(in oklab, var(--brand) 28%, transparent)",
  "--fui-overlay-filter": "blur(2px)",
} as CSSProperties;

function Bench() {
  return (
    <Page description="Fixes of 0.12 to what exists: 44 px targets on every pointer, a popover that closes and scrolls, scroll regions that are a tab stop only while they overflow, a state panel with more in it, and one set of tokens for every floating surface." title="Surfaces">
      <Block title="Targets" description="Touch is 44 px on every pointer, beside the default sizes. A loading button can say what it is doing.">
        <Targets />
        <Targets dir="rtl" />
      </Block>
      <Block title="Popover" description="The close key holds the corner while the content scrolls under it; a header leaves it room. The trigger opens the real one.">
        <div style={{ ...row, alignItems: "flex-start" }}>
          <InlinePopover lines={2} />
          <InlinePopover limit="11rem" lines={8} />
          <InlinePopover dir="rtl" lines={2} />
        </div>
        <div style={row}>
          <Popover>
            <PopoverTrigger render={<Button variant="outline">Parcel details</Button>} />
            <PopoverContent align="start">
              <PopoverHeader>
                <PopoverTitle>Shipping to Lisbon</PopoverTitle>
                <PopoverDescription>Three parcels, two carriers.</PopoverDescription>
              </PopoverHeader>
              {PARCELS.map((line) => (
                <p key={line} style={{ margin: 0 }}>
                  {line}
                </p>
              ))}
              <PopoverClose />
            </PopoverContent>
          </Popover>
        </div>
      </Block>
      <Block title="Scroll regions" description="A region that fits is not a tab stop; one that overflows is, so the keyboard can scroll it.">
        <Frame width={520}>
          <div style={stack}>
            <CodePanel code="const total = 3;" language="ts" title="fits.ts" />
            <CodePanel code={LONG_LINE} language="ts" title="overflows.ts" />
            <CodeBlock code="const total = 3;" filename="fits.ts" language="ts" />
            <CodeBlock code={LONG_LINE} filename="overflows.ts" language="ts" />
            <Snippet label="Install">bun add @fabrials/ui</Snippet>
            <Table aria-label="Parcels that fit">
              <TableHeader>
                <TableRow>
                  <TableHead>Parcel</TableHead>
                  <TableHead>State</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>1</TableCell>
                  <TableCell>On its way</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </Frame>
        <Frame width={320}>
          <Table aria-label="Parcels that overflow">
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Carrier</TableHead>
                <TableHead>Depot</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>prc_2026_11_000184_lisboa</TableCell>
                <TableCell>ctt_expresso_internacional</TableCell>
                <TableCell>porto_maia_depot_04</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Frame>
      </Block>
      <Block title="State panel with more in it" description="Children sit under the description and before the actions: suggestions as chips.">
        <StatePanel
          actions={
            <Button size="sm" variant="secondary">
              Clear filters
            </Button>
          }
          description="Nothing is due this week. Try a wider range."
          headingLevel={3}
          state="empty"
          title="No invoices match"
        >
          <Button size="xs" variant="outline">
            This month
          </Button>
          <Button size="xs" variant="outline">
            This quarter
          </Button>
          <Button size="xs" variant="outline">
            Overdue
          </Button>
        </StatePanel>
        <StatePanel align="center" description="Start from one of these." headingLevel={3} state="empty" title="No parcels yet">
          <Button size="xs" variant="outline">
            Import a list
          </Button>
          <Button size="xs" variant="outline">
            Add one by hand
          </Button>
        </StatePanel>
      </Block>
      <Block title="Toolbar on a phone" description="Under 40rem of window the search takes the row and the action goes under it.">
        <CollectionToolbar actions={<Button>New parcel</Button>} label="Parcels" search={<SearchInput aria-label="Search parcels" placeholder="Search parcels" />} />
      </Block>
      <Block title="Overlay tokens" description="Each floating surface as it is, then under four tokens set to other values: surface, edge, shadow and backdrop-filter.">
        <Frame>
          <div data-testid="overlay-default">
            <Samples />
          </div>
        </Frame>
        <Frame>
          <div data-testid="overlay-tinted" style={TINTED}>
            <Samples />
          </div>
        </Frame>
        <div style={row}>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline">Row actions</Button>} />
            <DropdownMenuContent>
              <DropdownMenuItem>Rename</DropdownMenuItem>
              <DropdownMenuItem>Duplicate</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Dialog>
            <DialogTrigger render={<Button variant="outline">Rename parcel</Button>} />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Rename parcel</DialogTitle>
                <DialogDescription>The carrier keeps its own reference.</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button onClick={() => toast("Parcel renamed", { id: "surfaces-toast", duration: Infinity })} variant="outline">
            Notify
          </Button>
        </div>
      </Block>
      <Toaster position="bottom-right" />
    </Page>
  );
}

const meta = {
  title: "Tests/Surfaces",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Pieces: Story = { render: () => <Bench /> };
