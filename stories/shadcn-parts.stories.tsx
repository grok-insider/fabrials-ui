import type { Meta, StoryObj } from "@storybook/react-vite";
import { Bell, ChevronDown, Search, TriangleAlert } from "lucide-react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  Kbd,
  KbdGroup,
  Label,
  NativeSelect,
  NativeSelectOptGroup,
  NativeSelectOption,
  PageHeader,
  RadioGroup,
  RadioGroupItem,
  SectionHeader,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@fabrials/ui";

const meta = {
  title: "Fabrials/Shadcn parts",
  parameters: { layout: "fullscreen" },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const models = { grok: "Grok 5", "grok-mini": "Grok 5 mini", opus: "Claude Opus 5.5" };

// Parts added in 0.7 so shadcn's primitives map onto Fabrials controls one to one (see the shims).
function Parts() {
  return (
    <main className="catalogue">
      <PageHeader title="Shadcn parts" description="The pieces shadcn names that Fabrials UI now provides, so third-party components and shims find them." />
      <section aria-labelledby="parts-keys">
        <SectionHeader title={<span id="parts-keys">Keys and sizes</span>} />
        <div className="catalogue-row">
          <p>
            Open the palette with{" "}
            <KbdGroup>
              <Kbd>Ctrl</Kbd>
              <Kbd>K</Kbd>
            </KbdGroup>
          </p>
          <Button size="icon-lg" variant="outline" aria-label="Notifications">
            <Bell aria-hidden />
          </Button>
          <Button size="icon" variant="outline" aria-label="Search">
            <Search aria-hidden />
          </Button>
        </div>
      </section>
      <section aria-labelledby="parts-choices">
        <SectionHeader title={<span id="parts-choices">Grouped choices</span>} />
        <div className="catalogue-row">
          <Select defaultValue="grok" items={models}>
            <SelectTrigger aria-label="Model" style={{ width: "16rem" }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>xAI</SelectLabel>
                <SelectItem value="grok">Grok 5</SelectItem>
                <SelectItem value="grok-mini">Grok 5 mini</SelectItem>
              </SelectGroup>
              <SelectSeparator />
              <SelectGroup>
                <SelectLabel>Anthropic</SelectLabel>
                <SelectItem value="opus">Claude Opus 5.5</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <NativeSelect aria-label="Region" defaultValue="eu" style={{ width: "12rem" }}>
            <NativeSelectOptGroup label="Europe">
              <NativeSelectOption value="eu">Frankfurt</NativeSelectOption>
              <NativeSelectOption value="hel">Helsinki</NativeSelectOption>
            </NativeSelectOptGroup>
            <NativeSelectOption value="us">Ashburn</NativeSelectOption>
          </NativeSelect>
          <RadioGroup defaultValue="week" aria-label="Period" className="catalogue-row">
            <Label>
              <RadioGroupItem value="week" /> This week
            </Label>
            <Label>
              <RadioGroupItem value="month" /> This month
            </Label>
          </RadioGroup>
        </div>
      </section>
      <section aria-labelledby="parts-overlays">
        <SectionHeader title={<span id="parts-overlays">Submenus, alerts and sheets</span>} />
        <div className="catalogue-row">
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" />}>
              Move to <ChevronDown aria-hidden />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem>Inbox</DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>Project</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem>Spanreed</DropdownMenuItem>
                  <DropdownMenuItem>Syl</DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuContent>
          </DropdownMenu>
          <AlertDialog>
            <AlertDialogTrigger render={<Button variant="destructive" />}>Revoke key</AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogMedia>
                  <TriangleAlert />
                </AlertDialogMedia>
                <AlertDialogTitle>Revoke this key?</AlertDialogTitle>
                <AlertDialogDescription>Agents using it stop working at once.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep key</AlertDialogCancel>
                <Button variant="destructive">Revoke key</Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Sheet>
            <SheetTrigger render={<Button variant="outline" />}>Filters</SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
                <SheetDescription>Narrow the table.</SheetDescription>
              </SheetHeader>
              <SheetFooter>
                <Button>Apply filters</Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </section>
    </main>
  );
}

export const Gallery: Story = { render: () => <Parts /> };
