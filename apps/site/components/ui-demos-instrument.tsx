"use client";

// Previews for the components added in 0.10 "Instrument". Synthetic data only.
import { useLayoutEffect, useState, type ReactNode } from "react";
import {
  AnimatedImage,
  AudioPlayer,
  Avatar,
  AvatarFallback,
  ImageViewer,
  MediaGrid,
  avatarInitials,
  Button,
  Calendar,
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
  DirectionProvider,
  Dropzone,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
  ListBox,
  VideoPlayer,
  SidePanel,
  SidePanelBody,
  SidePanelClose,
  SidePanelHeader,
  SidePanelTitle,
  Spreadsheet,
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
import { Frame } from "@/components/demo-frame";

function SearchDemo() {
  const [query, setQuery] = useState("");
  const accounts = ["North workspace", "Harbour lab", "Field office", "Night shift"];
  const shown = accounts.filter((name) => name.toLowerCase().includes(query.trim().toLowerCase()));
  return (
    <Frame width="field">
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
    <Frame width="field">
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

// A fixed day: the server and the reader's browser must draw the same month and the same today, whatever their time zones.
const CALENDAR_TODAY = new Date(2026, 10, 12);

function CalendarDemo() {
  const [day, setDay] = useState<Date | undefined>(CALENDAR_TODAY);
  return (
    <Frame width="fit">
      <Calendar mode="single" selected={day} onSelect={setDay} required today={CALENDAR_TODAY} />
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
    <Frame width="field">
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
    <Frame width="field">
      <ListBox aria-label="People" items={PEOPLE} getKey={(person) => person.id} getTextValue={(person) => person.name} selected={picked} onSelectedChange={setPicked} renderItem={(person) => <PersonRow person={person} />} />
    </Frame>
  );
}

const LINES = Array.from({ length: 5000 }, (_, index) => ({ id: String(index), text: `Event ${index + 1}: mailbox synced in ${(index * 37) % 900} ms` }));

function SidePanelDemo() {
  // The preview follows the window: open where the panel docks, closed
  // where it would be a modal sheet over the docs page (that one opens when
  // asked). A layout effect: it hears a resize before the panel does, so no
  // sheet flashes open.
  const [open, setOpen] = useState(false);
  useLayoutEffect(() => {
    const docks = window.matchMedia("(min-width: 560px)");
    const follow = () => setOpen(docks.matches);
    follow();
    docks.addEventListener("change", follow);
    return () => docks.removeEventListener("change", follow);
  }, []);
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
    <Frame width="form">
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

// Synthetic pictures: SVG scenes, so the previews need no network and their size is what the viewer zooms to.
function scene(width: number, height: number, top: string, bottom: string, sun: string) {
  const horizon = Math.round(height * 0.62);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient></defs><rect width="${width}" height="${height}" fill="url(#s)"/><circle cx="${width * 0.72}" cy="${height * 0.3}" r="${Math.min(width, height) * 0.09}" fill="${sun}"/><path d="M0 ${horizon} C ${width * 0.3} ${horizon - 50} ${width * 0.6} ${horizon + 40} ${width} ${horizon - 10} V ${height} H 0 Z" fill="${top}"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const POSTER = scene(1600, 900, "#0d1b2e", "#3d6e9c", "#e9d8a6");

const SCENES = [
  { src: scene(2400, 1500, "#0d1b2e", "#3d6e9c", "#e9d8a6"), alt: "A harbour at dusk" },
  { src: scene(1200, 1800, "#1b2a22", "#6f9a7c", "#f1e6c8"), alt: "Orchard terraces" },
  { src: scene(1600, 1600, "#2a1b26", "#9c6f86", "#f4d8c4"), alt: "A quarry lake" },
  { src: scene(3000, 1000, "#121826", "#5a6b8a", "#dfe6f2"), alt: "The field office" },
  { src: scene(2000, 1300, "#1e1a12", "#a08a5a", "#f6ecd2"), alt: "The yard at first light" },
];

function GalleryDemo({ count }: { count: number }) {
  const [index, setIndex] = useState<number | null>(null);
  const items = SCENES.slice(0, count);
  return (
    <Frame width="wide">
      <MediaGrid items={items} onOpen={setIndex} />
      <ImageViewer items={items} index={index} onIndexChange={setIndex} onClose={() => setIndex(null)} label="Photos" />
    </Frame>
  );
}

const LEDGER = {
  sheets: [
    {
      name: "Usage",
      frozen: { rows: 1 },
      columnWidths: [160, 96, 96, 72],
      rows: [
        ["Account", "Requests", "Cost", "Active"],
        ...PEOPLE.map((person, index) => [person.name, { value: 1200 * (index + 2), text: (1200 * (index + 2)).toLocaleString("en-GB") }, { value: 36 * (index + 2), text: `€${36 * (index + 2)}.00` }, index % 2 === 0]),
        ["Total", { value: 16800, text: "16,800", formula: "SUM(B2:B5)" }, { value: 504, text: "€504.00", formula: "SUM(C2:C5)" }],
      ],
    },
    { name: "Notes", rows: [["Synthetic data."]] },
  ],
};

export const instrumentDemos: Record<string, () => ReactNode> = {
  direction: () => (
    <Frame width="field">
      <div dir="rtl" lang="ar" className="grid gap-2">
        <DirectionProvider direction="rtl">
          <Label>مستوى الصوت</Label>
          <Slider aria-label="مستوى الصوت" defaultValue={40} showValue />
        </DirectionProvider>
      </div>
    </Frame>
  ),
  spreadsheet: () => (
    <Frame>
      <Spreadsheet workbook={LEDGER} aria-label="Usage export" height={240} locale="en-GB" />
    </Frame>
  ),
  "video-player": () => (
    <Frame width="wide">
      <VideoPlayer src="/media/harbour.webm" label="The harbour at dusk" poster={POSTER} width={640} height={360} tracks={[{ src: "/media/harbour.en.vtt", srcLang: "en", label: "English" }]} />
    </Frame>
  ),
  "audio-player": () => (
    <Frame width="form">
      <AudioPlayer src="/media/chime.webm" label="Three-note chime" title="Three-note chime · 0:05" />
    </Frame>
  ),
  "animated-image": () => (
    <Frame>
      <div className="grid gap-4 sm:grid-cols-2">
        <AnimatedImage src="/media/loop.webm" alt="Colour drifting across a dusk sky" width={320} height={180} />
        <AnimatedImage src="/media/loop.gif" alt="Green copper light rippling" type="image" width={240} height={135} />
      </div>
    </Frame>
  ),
  "media-grid": () => <GalleryDemo count={5} />,
  "image-viewer": () => <GalleryDemo count={3} />,
  "list-box": () => <ListBoxDemo />,
  "virtual-list": () => (
    <Frame width="form">
      <VirtualList aria-label="Sync events" items={LINES} getKey={(line) => line.id} estimateSize={36} height={240} renderItem={(line) => <p className="border-b py-2 font-mono text-xs">{line.text}</p>} />
    </Frame>
  ),
  "context-menu": () => (
    <Frame width="form">
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
    <Frame width="field">
      <Field label="Password" description="At least 12 characters.">
        {(control) => <PasswordInput {...control} autoComplete="new-password" defaultValue="correct horse battery" />}
      </Field>
    </Frame>
  ),
  "number-field": () => (
    <Frame width="field">
      <Field label="Seats">{(control) => <NumberField {...control} defaultValue={12} min={1} max={500} />}</Field>
      <Field label="Timeout">{(control) => <NumberField {...control} defaultValue={1500} min={0} step={100} unit="ms" />}</Field>
    </Frame>
  ),
  slider: () => <SliderDemo />,
  "input-otp": () => (
    <Frame width="fit">
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
