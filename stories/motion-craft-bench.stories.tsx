import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  Button,
  Checkbox,
  Command,
  CommandDialog,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  DescriptionDetails,
  DescriptionItem,
  DescriptionList,
  DescriptionTerm,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
  Label,
  NumberTicker,
  Radio,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  RadioGroup,
  Stat,
  StatGroup,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@fabrials/ui";
import { Block, Frame, Page } from "./story-frame";

// What moves and when, and what data nobody chose does to a few pieces, for tests/visual/motion-craft.spec.ts: the spec
// reads running animations, durations and geometry, never pixels.
const meta = { title: "Tests/Motion craft", parameters: { layout: "fullscreen" } } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

/** Fifty-six letters with no place to break, as an identifier from data has. */
const UNBROKEN = "northwind".repeat(6) + "ab";

function Ticker() {
  const [value, setValue] = useState(12_480);
  return (
    <div style={{ display: "grid", gap: "var(--fui-space-3)", justifyItems: "start" }}>
      <p id="craft-ticker" style={{ margin: 0, fontSize: "2rem", fontWeight: 600 }}>
        <NumberTicker locale="en" value={value} />
      </p>
      <Button onClick={() => setValue((current) => current + 1_137)} size="sm" variant="outline">
        A day of traffic arrives
      </Button>
    </div>
  );
}

function Palette() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)} variant="outline">
        Open the palette
      </Button>
      <CommandDialog onOpenChange={setOpen} open={open}>
        <Command label="Command palette">
          <CommandInput placeholder="Search commands" />
          <CommandList>
            <CommandGroup heading="Navigate">
              <CommandItem>Go to Inbox</CommandItem>
              <CommandItem>Open Contacts</CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}

export const Pieces: Story = {
  render: () => (
    <Page description="First paint, a change, and the worst a source can send." title="Motion craft">
      <Block title="Ticks" description="A box that loads checked is at rest; the tick is drawn when a person checks one.">
        <Frame width={420}>
          <div style={{ display: "flex", gap: "var(--fui-space-4)", alignItems: "center" }}>
            <Label id="craft-box-on">
              <Checkbox defaultChecked /> Loaded checked
            </Label>
            <Label id="craft-box-off">
              <Checkbox /> Loaded unchecked
            </Label>
          </div>
          <RadioGroup aria-label="Plan" defaultValue="team" style={{ marginTop: "var(--fui-space-3)" }}>
            <Label id="craft-radio-on">
              <Radio value="team" /> Team
            </Label>
            <Label id="craft-radio-off">
              <Radio value="solo" /> Solo
            </Label>
          </RadioGroup>
        </Frame>
      </Block>
      <Block title="A row of keys" description="The first tooltip fades in; the next one of the row is there at once.">
        <Frame width={420}>
          <TooltipProvider>
            <div style={{ display: "flex", gap: "var(--fui-space-2)" }}>
              {["Copy", "Share", "Archive"].map((name) => (
                <Tooltip key={name}>
                  <TooltipTrigger render={<Button variant="outline">{name}</Button>} />
                  <TooltipContent>{name} the reference</TooltipContent>
                </Tooltip>
              ))}
            </div>
          </TooltipProvider>
        </Frame>
      </Block>
      <Block title="A menu" description="By the pointer it comes from its trigger; by a key it is there at once.">
        <Frame width={420}>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline">File</Button>} />
            <DropdownMenuContent>
              <DropdownMenuItem>
                {UNBROKEN}
                <DropdownMenuShortcut>⌘O</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem>Rename</DropdownMenuItem>
              <DropdownMenuItem>Duplicate</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </Frame>
      </Block>
      <Block title="The command palette" description="Opened by a key a hundred times a day: it fades, and does not travel or grow.">
        <Frame width={420}>
          <Palette />
        </Frame>
      </Block>
      <Block title="A sheet" description="It slides in when motion is allowed, and fades in its place when it is not.">
        <Frame width={420}>
          <Sheet>
            <SheetTrigger render={<Button variant="outline">Open the sheet</Button>} />
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Details</SheetTitle>
                <SheetDescription>What the row is about.</SheetDescription>
              </SheetHeader>
            </SheetContent>
          </Sheet>
        </Frame>
      </Block>
      <Block title="A number" description="There at first paint; it rolls when it changes.">
        <Frame width={420}>
          <Ticker />
        </Frame>
      </Block>
      <Block title="A total of thirteen characters" description="In a group of three, set as large as its cell allows and never broken in two.">
        <Frame width={640}>
          <StatGroup id="craft-stats">
            <Stat delta="-142%" hint="vs. the previous 1,284 days" label="Requests today" unit="kWh" value="12,345,678.90" />
            <Stat hint="1 member" label="Members" value="1" />
            <Stat label="Sessions" value="48,210" />
          </StatGroup>
        </Frame>
      </Block>
      <Block title="A count of four figures" description="The count grows into a pill.">
        <Frame width={240}>
          <AvatarGroup id="craft-faces">
            {["AW", "JO", "LI"].map((initials) => (
              <Avatar key={initials}>
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            ))}
            <AvatarGroupCount aria-label="1,280 more" role="img">
              +1,280
            </AvatarGroupCount>
          </AvatarGroup>
        </Frame>
      </Block>
      <Block title="A term from data" description="The term takes two fifths of the list at most; its details keep the rest.">
        <Frame width={360}>
          <DescriptionList id="craft-terms">
            <DescriptionItem>
              <DescriptionTerm>{UNBROKEN}</DescriptionTerm>
              <DescriptionDetails>Every message</DescriptionDetails>
            </DescriptionItem>
          </DescriptionList>
        </Frame>
      </Block>
    </Page>
  ),
};
