"use client";

// Previews for the components added in 0.10 "Instrument". Synthetic data only.
import { useState, type ReactNode } from "react";
import {
  Avatar,
  AvatarFallback,
  avatarInitials,
  Button,
  Calendar,
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
  Dropzone,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
  ListBox,
  SidePanel,
  SidePanelBody,
  SidePanelClose,
  SidePanelHeader,
  SidePanelTitle,
  VirtualList,
  DatePicker,
  DateRangePicker,
  Field,
  type DateRange,
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
  Kbd,
  Label,
  NumberField,
  PasswordInput,
  SearchInput,
  Slider,
} from "@fabrials/ui";

function Frame({ children }: { children: ReactNode }) {
  return <div className="fui-preview grid grid-cols-[minmax(0,1fr)] gap-4">{children}</div>;
}

function SearchDemo() {
  const [query, setQuery] = useState("");
  const accounts = ["North workspace", "Harbour lab", "Field office", "Night shift"];
  const shown = accounts.filter((name) => name.toLowerCase().includes(query.trim().toLowerCase()));
  return (
    <Frame>
      <SearchInput aria-label="Search accounts" placeholder="Search accounts" value={query} onValueChange={setQuery} shortcut={<Kbd>/</Kbd>} />
      <p className="fui-description" role="status">
        {shown.length ? shown.join(", ") : "No account matches."}
      </p>
    </Frame>
  );
}

function SliderDemo() {
  const [range, setRange] = useState<number | readonly number[]>([20, 80]);
  return (
    <Frame>
      <div className="grid gap-2">
        <Label>Volume</Label>
        <Slider aria-label="Volume" defaultValue={64} showValue />
      </div>
      <div className="grid gap-2">
        <Label>Price range</Label>
        <Slider value={range} onValueChange={setRange} thumbLabels={["Minimum price", "Maximum price"]} format={{ style: "currency", currency: "EUR", maximumFractionDigits: 0 }} locale="en-GB" showValue />
      </div>
      <div className="grid gap-2">
        <Label>Quality</Label>
        <Slider aria-label="Quality" defaultValue={3} min={1} max={5} marks={[{ value: 1, label: "Draft" }, 2, { value: 3, label: "Good" }, 4, { value: 5, label: "Best" }]} />
      </div>
    </Frame>
  );
}

function CalendarDemo() {
  const [day, setDay] = useState<Date | undefined>(() => new Date());
  return (
    <Frame>
      <Calendar mode="single" selected={day} onSelect={setDay} required />
      <p className="fui-description" role="status">
        {day ? `Chosen: ${day.toDateString()}` : "No day chosen."}
      </p>
    </Frame>
  );
}

function DatePickerDemo() {
  const [due, setDue] = useState<Date | null>(null);
  const [trip, setTrip] = useState<DateRange | null>(null);
  return (
    <Frame>
      <Field label="Due date">{(control) => <DatePicker {...control} value={due} onValueChange={setDue} clearable />}</Field>
      <Field label="Trip">{(control) => <DateRangePicker {...control} value={trip} onValueChange={setTrip} clearable />}</Field>
    </Frame>
  );
}

const PEOPLE = [
  { id: "ana", name: "Ana Lopez", role: "Billing" },
  { id: "kai", name: "Kai Nakamura", role: "Support" },
  { id: "priya", name: "Priya Shah", role: "Operations" },
  { id: "tom", name: "Tom Adeyemi", role: "Engineering" },
];

function PersonRow({ person }: { person: (typeof PEOPLE)[number] }) {
  return (
    <>
      <ItemMedia>
        <Avatar size="sm">
          <AvatarFallback>{avatarInitials(person.name)}</AvatarFallback>
        </Avatar>
      </ItemMedia>
      <ItemContent>
        <ItemTitle>{person.name}</ItemTitle>
        <ItemDescription>{person.role}</ItemDescription>
      </ItemContent>
    </>
  );
}

function ListBoxDemo() {
  const [picked, setPicked] = useState<string[]>(["kai"]);
  return (
    <Frame>
      <ListBox aria-label="People" items={PEOPLE} getKey={(person) => person.id} getTextValue={(person) => person.name} selected={picked} onSelectedChange={setPicked} renderItem={(person) => <PersonRow person={person} />} />
    </Frame>
  );
}

const LINES = Array.from({ length: 5000 }, (_, index) => ({ id: String(index), text: `Event ${index + 1}: mailbox synced in ${(index * 37) % 900} ms` }));

function SidePanelDemo() {
  const [open, setOpen] = useState(true);
  return (
    <div className="flex min-h-72 w-full border">
      <div className="min-w-0 flex-1 p-4">
        <Button variant="outline" size="sm" onClick={() => setOpen(true)} disabled={open}>
          Open details
        </Button>
      </div>
      <SidePanel open={open} onOpenChange={setOpen} defaultWidth={300} minWidth={240} maxWidth={420} sheetBelow={560}>
        <SidePanelHeader>
          <SidePanelTitle>Kai Nakamura</SidePanelTitle>
          <SidePanelClose />
        </SidePanelHeader>
        <SidePanelBody>
          <p className="fui-description">Support · joined in 2024</p>
        </SidePanelBody>
      </SidePanel>
    </div>
  );
}

function DropzoneDemo() {
  const [files, setFiles] = useState<string[]>([]);
  const [error, setError] = useState<string | undefined>();
  return (
    <Frame>
      <Dropzone
        description="PDF or images, up to 2 MB."
        accept=".pdf,image/*"
        maxSize={2 * 1024 * 1024}
        onFilesChange={(next) => {
          setFiles((now) => [...now, ...next.map((file) => file.name)]);
          setError(undefined);
        }}
        onFilesRejected={(refused) => setError(`${refused.map((item) => item.file.name).join(", ")} cannot be added.`)}
        error={error}
      >
        {files.length ? <p className="fui-description">{files.join(", ")}</p> : null}
      </Dropzone>
    </Frame>
  );
}

export const instrumentDemos: Record<string, () => ReactNode> = {
  "list-box": () => <ListBoxDemo />,
  "virtual-list": () => (
    <Frame>
      <VirtualList aria-label="Sync events" items={LINES} getKey={(line) => line.id} estimateSize={36} height={240} renderItem={(line) => <p className="border-b py-2 font-mono text-xs">{line.text}</p>} />
    </Frame>
  ),
  "context-menu": () => (
    <Frame>
      <ContextMenu>
        <ContextMenuTrigger tabIndex={0} className="grid min-h-28 place-items-center rounded-md border border-dashed text-sm text-muted-foreground">Right-click here, or focus and press Shift+F10</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem>Open</ContextMenuItem>
          <ContextMenuItem>Rename</ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem variant="destructive">Delete</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </Frame>
  ),
  "side-panel": () => <SidePanelDemo />,
  dropzone: () => <DropzoneDemo />,
  calendar: () => <CalendarDemo />,
  "date-picker": () => <DatePickerDemo />,
  "search-input": () => <SearchDemo />,
  "password-input": () => (
    <Frame>
      <Field label="Password" description="At least 12 characters.">
        {(control) => <PasswordInput {...control} autoComplete="new-password" defaultValue="correct horse battery" />}
      </Field>
    </Frame>
  ),
  "number-field": () => (
    <Frame>
      <Field label="Seats">{(control) => <NumberField {...control} defaultValue={12} min={1} max={500} />}</Field>
      <Field label="Timeout">{(control) => <NumberField {...control} defaultValue={1500} min={0} step={100} unit="ms" />}</Field>
    </Frame>
  ),
  slider: () => <SliderDemo />,
  "input-otp": () => (
    <Frame>
      <Field label="Verification code" description="Enter the 6-digit code we sent to your phone.">
        {(control) => (
          <InputOTP {...control} length={6}>
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup>
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        )}
      </Field>
    </Frame>
  ),
};
