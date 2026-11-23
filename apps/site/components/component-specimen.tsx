"use client";

import { memo, type ReactNode } from "react";
import {
  Bell,
  Bold,
  Check,
  ChevronRight,
  Command,
  Copy,
  FileCode2,
  Folder,
  Globe,
  Italic,
  Layers,
  Mic,
  Play,
  Plus,
  Search,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Terminal,
  Underline,
  Upload,
  Volume2,
} from "lucide-react";
import {
  ActivityStrip,
  Alert,
  AlertDescription,
  AlertTitle,
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  Badge,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  ButtonGroup,
  Card,
  CardDescription,
  CardTitle,
  Checkbox,
  CornerMarks,
  DitherBand,
  DitherCanvas,
  DitherGem,
  DitherScene,
  FilterChip,
  GridGuides,
  Input,
  Kbd,
  KbdGroup,
  Meter,
  MoonPhase,
  NumberTicker,
  PasswordInput,
  ProductLockup,
  Progress,
  RadiantGlyph,
  Readout,
  SearchInput,
  Separator,
  ShimmerText,
  Skeleton,
  Slider,
  Sparkline,
  Spinner,
  Stat,
  StatGroup,
  StatusDot,
  Switch,
  Tabs,
  TabsList,
  TabsTrigger,
  ThemeSwitcher,
  Timeline,
  TimelineItem,
  Toggle,
  ToggleGroup,
  ToggleGroupItem,
  WorkingLight,
} from "@fabrials/ui";
import { STORM_RAMP, gemField } from "@fabrials/ui/dither";
import {
  AgentThinking,
  ChatMessage,
  ContextMeter,
  MarkdownCallout,
  ProviderIcon,
  SourceTally,
  SuggestionChips,
  TaskList,
  ToolCall,
} from "@fabrials/ai-ui";

const NOOP = () => {};

const SPARKLINE_SERIES = [18, 26, 22, 34, 41, 38, 52, 48, 61, 57, 68, 74];

const ACTIVITY_CELLS = [
  { label: "D1", value: 1 },
  { label: "D2", value: 3 },
  { label: "D3", value: 2 },
  { label: "D4", value: 4 },
  { label: "D5", value: 2 },
  { label: "D6", value: 0 },
  { label: "D7", value: 3 },
  { label: "D8", value: 4 },
  { label: "D9", value: 3 },
  { label: "D10", value: 2 },
  { label: "D11", value: 4 },
  { label: "D12", value: 3 },
];

const DEMO_SOURCES = [
  "https://ui.fabrials.com/docs/tokens",
  "https://ui.fabrials.com/docs/stat",
  "https://ui.fabrials.com/docs/meter",
] as const;

const DEMO_TASKS = [
  { id: "t1", title: "Parse tokens", status: "done" as const },
  { id: "t2", title: "Verify contrast", status: "running" as const },
] as const;

const DEMO_CHIPS = [
  { id: "c1", label: "Compare latency" },
  { id: "c2", label: "Show diff" },
] as const;

const DEMO_CONTEXT_PARTS = [
  { label: "System", value: 12_400 },
  { label: "Files", value: 38_200 },
  { label: "Tools", value: 9_800 },
] as const;

function renderSpecimen(slug: string, category?: string, title?: string): ReactNode {
  switch (slug) {
    /* --------------------------------------------------------------- Brand */
    case "corner-marks":
      return (
        <CornerMarks className="w-36">
          <div className="flex h-16 items-center justify-center rounded-lg bg-card px-3 font-mono text-[11px] text-muted-foreground">
            Fig. 01 · Plate
          </div>
        </CornerMarks>
      );

    case "dither-gem":
      return (
        <div className="flex items-center gap-4">
          <DitherGem gem="stormlight" size={28} />
          <DitherGem gem="zircon" size={34} />
          <DitherGem gem="ruby" size={28} />
          <DitherGem gem="emerald" size={24} />
        </div>
      );

    case "dither-band":
      return (
        <div className="w-full max-w-[14rem] overflow-hidden rounded-lg bg-card [--fui-dither-bg:var(--card)]">
          <DitherBand seed={19} cell={3} />
          <div className="px-3 py-2 font-mono text-[11px] text-muted-foreground">Highstorm band</div>
        </div>
      );

    case "dither-scene":
      return (
        <div className="relative isolate h-24 w-full max-w-[14rem] overflow-hidden rounded-lg bg-card [--fui-dither-bg:var(--card)]">
          <DitherScene variant="full" reveal={0} cell={3} seed={7} />
        </div>
      );

    case "dither-canvas":
      return (
        <div className="relative isolate h-24 w-full max-w-[14rem] overflow-hidden rounded-lg bg-card [--fui-dither-bg:var(--card)]">
          <DitherCanvas
            ramp={STORM_RAMP}
            field={(_theme, { width, height }) => gemField(width, height)}
            cell={3}
            paintKey={1}
          />
        </div>
      );

    case "radiant-glyph":
      return (
        <div className="flex items-center gap-3.5">
          <RadiantGlyph order="windrunner" size={32} colored />
          <RadiantGlyph order="elsecaller" size={36} colored />
          <RadiantGlyph order="lightweaver" size={32} colored />
          <RadiantGlyph order="bondsmith" size={28} colored />
        </div>
      );

    case "grid-guides":
      return (
        <div className="relative h-24 w-full max-w-[14rem] overflow-hidden rounded-lg bg-card">
          <GridGuides columns={6} />
          <div className="relative z-10 flex h-full items-end p-2.5 font-mono text-[11px] text-muted-foreground">
            12-column canvas
          </div>
        </div>
      );

    case "product-lockup":
      return <ProductLockup product="Spanreed" gem="ruby" size="sm" />;

    /* ------------------------------------------------------------ Controls */
    case "button":
      return (
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button size="sm">Create key</Button>
          <Button size="sm" variant="accent">
            Deploy
          </Button>
          <Button size="sm" variant="outline">
            Cancel
          </Button>
        </div>
      );

    case "icon-button":
      return (
        <div className="flex items-center gap-2">
          <Button size="icon-sm" variant="secondary" aria-label="Copy">
            <Copy size={14} />
          </Button>
          <Button size="icon-sm" variant="outline" aria-label="Filter">
            <SlidersHorizontal size={14} />
          </Button>
          <Button size="icon-sm" variant="default" aria-label="Add">
            <Plus size={14} />
          </Button>
        </div>
      );

    case "input":
      return (
        <div className="w-full max-w-[13.5rem]">
          <Input readOnly value="station-relay" aria-label="Key name" />
        </div>
      );

    case "textarea":
      return (
        <div className="w-full max-w-[13.5rem] rounded-md bg-card p-2.5 text-xs text-muted-foreground">
          <div>Explain the latency spike on node eu-west-2…</div>
          <div className="mt-2 flex justify-end font-mono text-[10px]">44 / 280</div>
        </div>
      );

    case "search-input":
      return (
        <div className="w-full max-w-[13.5rem]">
          <SearchInput size="sm" readOnly value="" placeholder="Search keys…" shortcut={<Kbd>/</Kbd>} aria-label="Search" />
        </div>
      );

    case "password-input":
      return (
        <div className="w-full max-w-[13.5rem]">
          <PasswordInput size="sm" readOnly value="stormlight-key" aria-label="Password" />
        </div>
      );

    case "number-field":
      return (
        <div className="inline-flex items-center gap-2 rounded-md bg-card px-2.5 py-1.5 font-mono text-xs text-foreground">
          <span className="text-muted-foreground">−</span>
          <span className="px-2 font-medium tabular-nums">120</span>
          <span className="text-muted-foreground">ms</span>
          <span className="text-muted-foreground">+</span>
        </div>
      );

    case "slider":
      return (
        <div className="w-full max-w-[13.5rem]">
          <Slider label="Rate" unit="req/s" min={0} max={200} value={140} onValueChange={NOOP} showValue />
        </div>
      );

    case "checkbox":
      return (
        <div className="grid gap-2 text-xs text-foreground">
          <span className="flex items-center gap-2">
            <Checkbox checked readOnly aria-label="Audit trail" />
            <span>Stream audit trail</span>
          </span>
          <span className="flex items-center gap-2 text-muted-foreground">
            <Checkbox checked={false} readOnly aria-label="Dry run" />
            <span>Dry-run mode</span>
          </span>
        </div>
      );

    case "switch":
      return (
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-2 text-foreground">
            <Switch checked readOnly aria-label="Enabled" />
            <span>Live</span>
          </span>
          <span className="flex items-center gap-2 text-muted-foreground">
            <Switch checked={false} readOnly aria-label="Paused" />
            <span>Paused</span>
          </span>
        </div>
      );

    case "toggle":
      return (
        <div className="flex items-center gap-1.5">
          <Toggle pressed aria-label="Bold">
            <Bold size={14} />
          </Toggle>
          <Toggle aria-label="Italic">
            <Italic size={14} />
          </Toggle>
          <Toggle aria-label="Underline">
            <Underline size={14} />
          </Toggle>
        </div>
      );

    case "toggle-group":
      return (
        <ToggleGroup size="sm" value={["14d"]} aria-label="Window">
          <ToggleGroupItem value="7d">7d</ToggleGroupItem>
          <ToggleGroupItem value="14d">14d</ToggleGroupItem>
          <ToggleGroupItem value="30d">30d</ToggleGroupItem>
        </ToggleGroup>
      );

    case "theme-switcher":
      return <ThemeSwitcher value="dark" onValueChange={NOOP} />;

    case "filter-chip":
      return (
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          <FilterChip label="Status" value="Active" onRemove={NOOP} />
          <FilterChip label="Region" value="EU" onRemove={NOOP} />
        </div>
      );

    case "select":
    case "native-select":
    case "multi-select":
    case "combobox":
      return (
        <div className="grid w-full max-w-[13rem] gap-1.5">
          <div className="flex items-center justify-between rounded-md bg-card px-3 py-1.5 text-xs text-foreground">
            <span>{slug === "multi-select" ? "2 providers" : "stormfather-2"}</span>
            <ChevronRight size={13} className="rotate-90 text-muted-foreground" />
          </div>
          <div className="grid gap-0.5 rounded-md bg-popover p-1 text-[11px] shadow-xs">
            <div className="flex items-center justify-between rounded-sm bg-accent px-2 py-1 text-foreground">
              <span>stormfather-2</span>
              <Check size={12} className="text-brand-ink" />
            </div>
            <div className="px-2 py-1 text-muted-foreground">claude-fable-5</div>
          </div>
        </div>
      );

    case "radio-group":
    case "native-radio":
    case "choice-group":
      return (
        <div className="grid gap-1.5 text-xs">
          <div className="flex items-center gap-2 text-foreground">
            <span className="inline-flex size-3.5 items-center justify-center rounded-full bg-brand">
              <span className="size-1.5 rounded-full bg-brand-foreground" />
            </span>
            <span>Balanced routing</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="inline-flex size-3.5 rounded-full bg-muted" />
            <span>Lowest latency</span>
          </div>
        </div>
      );

    case "input-otp":
      return (
        <div className="flex items-center gap-1.5 font-mono text-xs font-medium">
          {["4", "8", "2", "1"].map((digit, index) => (
            <span
              key={digit}
              className={`inline-flex size-8 items-center justify-center rounded-md bg-card ${
                index === 3 ? "text-brand-ink ring-1 ring-brand-ink" : "text-foreground"
              }`}
            >
              {digit}
            </span>
          ))}
        </div>
      );

    case "calendar":
    case "date-picker":
    case "date-range":
      return (
        <div className="grid w-full max-w-[12.5rem] gap-1.5 rounded-lg bg-card p-2.5 font-mono text-[10px]">
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Nov 2026</span>
            <span>Su Mo Tu We Th</span>
          </div>
          <div className="grid grid-cols-5 gap-1 text-center tabular-nums">
            {[10, 11, 12, 13, 14, 15, 16, 17, 18, 19].map((day) => (
              <span
                key={day}
                className={`rounded-xs py-0.5 ${
                  day === 14
                    ? "bg-brand text-brand-foreground"
                    : day >= 13 && day <= 16 && slug === "date-range"
                      ? "bg-brand-soft text-brand-ink"
                      : "text-foreground"
                }`}
              >
                {day}
              </span>
            ))}
          </div>
        </div>
      );

    case "dropzone":
    case "file-input":
    case "drop-overlay":
      return (
        <div className="flex w-full max-w-[13rem] flex-col items-center gap-1.5 rounded-lg border border-dashed border-border bg-card/70 px-3 py-3 text-center">
          <Upload size={14} className="text-muted-foreground" />
          <span className="text-[11px] font-medium text-foreground">Drop files here</span>
          <span className="font-mono text-[10px] text-muted-foreground">CSV · JSON · PNG</span>
        </div>
      );

    case "field":
    case "field-parts":
    case "field-set":
    case "label":
      return (
        <div className="grid w-full max-w-[13rem] gap-1 text-left">
          <span className="text-[11px] font-medium text-foreground">Workspace slug</span>
          <div className="rounded-md bg-card px-2.5 py-1.5 font-mono text-xs text-foreground">urithiru</div>
          <span className="text-[10px] text-muted-foreground">Lowercase letters and hyphens.</span>
        </div>
      );

    case "toolbar":
      return (
        <div className="inline-flex items-center gap-1 rounded-md bg-card p-1">
          <Button size="xs" variant="secondary">
            Filter
          </Button>
          <Button size="xs" variant="ghost">
            Sort
          </Button>
          <Button size="xs" variant="ghost">
            Export
          </Button>
        </div>
      );

    case "editable-text":
      return (
        <div className="flex items-center gap-2 rounded-md bg-card px-3 py-1.5 text-xs">
          <span className="font-medium text-foreground">Q4 Relay Budget</span>
          <span className="h-3.5 w-0.5 bg-brand-ink" />
        </div>
      );

    case "on-screen-keyboard":
      return (
        <div className="flex flex-wrap justify-center gap-1 font-mono text-[10px]">
          {["Q", "W", "E", "R", "T", "Y", "⌫"].map((key) => (
            <Kbd key={key}>{key}</Kbd>
          ))}
        </div>
      );

    /* --------------------------------------------------------- Collections */
    case "badge":
      return (
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          <Badge tone="info" dot>
            Stormlight
          </Badge>
          <Badge tone="success" dot>
            Healthy
          </Badge>
          <Badge tone="warning" dot>
            Limited
          </Badge>
          <Badge>v0.12</Badge>
        </div>
      );

    case "card":
      return (
        <Card className="w-full max-w-[13.5rem] !p-3">
          <CardTitle className="!text-xs">Relay throughput</CardTitle>
          <CardDescription className="mt-1 !text-[11px]">1.28M requests · 99.98% ok</CardDescription>
        </Card>
      );

    case "alert":
      return (
        <Alert variant="info" className="w-full max-w-[14rem] !px-3 !py-2">
          <AlertTitle className="!text-xs">Quota at 80%</AlertTitle>
          <AlertDescription className="!text-[11px]">Resets in 4 days.</AlertDescription>
        </Alert>
      );

    case "table":
    case "data-explorer":
      return (
        <div className="w-full max-w-[14rem] overflow-hidden rounded-lg bg-card text-[11px]">
          <div className="grid grid-cols-3 bg-muted/60 px-2.5 py-1 font-mono text-[10px] text-muted-foreground">
            <span>Key</span>
            <span>Calls</span>
            <span className="text-right">State</span>
          </div>
          <div className="grid grid-cols-3 border-t border-border/50 px-2.5 py-1.5 tabular-nums">
            <span className="font-mono">relay</span>
            <span>48.2k</span>
            <span className="text-right text-success-ink">Live</span>
          </div>
          <div className="grid grid-cols-3 border-t border-border/50 px-2.5 py-1.5 tabular-nums">
            <span className="font-mono">syl</span>
            <span>19.4k</span>
            <span className="text-right text-brand-ink">Sync</span>
          </div>
        </div>
      );

    case "tabs":
    case "nav-tabs":
      return (
        <Tabs value="overview">
          <TabsList variant={slug === "tabs" ? "segmented" : "underline"} aria-label="Sections">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="keys">Keys</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
          </TabsList>
        </Tabs>
      );

    case "progress":
      return (
        <div className="grid w-full max-w-[13rem] gap-2">
          <Progress value={68} label="Indexing" showValue />
        </div>
      );

    case "skeleton":
    case "loading":
      return (
        <div className="grid w-full max-w-[13rem] gap-2">
          <div className="flex items-center gap-2">
            <Skeleton className="size-7 rounded-full" />
            <div className="grid flex-1 gap-1.5">
              <Skeleton className="h-2.5 w-3/4" />
              <Skeleton className="h-2 w-1/2" />
            </div>
          </div>
          <Skeleton className="h-2.5 w-full" />
        </div>
      );

    case "avatar":
      return (
        <div className="flex items-center gap-3">
          <Avatar size="sm">
            <AvatarFallback>KS</AvatarFallback>
            <AvatarBadge tone="success" />
          </Avatar>
          <Avatar size="md">
            <AvatarFallback>JN</AvatarFallback>
          </Avatar>
          <Avatar size="sm">
            <AvatarFallback>SD</AvatarFallback>
          </Avatar>
        </div>
      );

    case "avatar-group":
      return (
        <AvatarGroup max={3} size="sm">
          <Avatar>
            <AvatarFallback>KS</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarFallback>JN</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarFallback>SD</AvatarFallback>
          </Avatar>
          <AvatarGroupCount>+4</AvatarGroupCount>
        </AvatarGroup>
      );

    case "separator":
      return (
        <div className="grid w-full max-w-[12.5rem] gap-2 text-xs">
          <span className="font-medium text-foreground">Workspace</span>
          <Separator />
          <span className="text-muted-foreground">Billing &amp; quotas</span>
        </div>
      );

    case "accordion":
    case "collapsible":
    case "disclosure":
      return (
        <div className="grid w-full max-w-[13.5rem] rounded-lg bg-card px-3 py-2 text-xs">
          <div className="flex items-center justify-between py-1 font-medium text-foreground">
            <span>Token architecture</span>
            <ChevronRight size={13} className="rotate-90 text-muted-foreground" />
          </div>
          <p className="m-0 pb-1 text-[11px] text-muted-foreground">OKLCH roles adapt per theme.</p>
        </div>
      );

    case "description-list":
      return (
        <div className="grid w-full max-w-[13.5rem] gap-1.5 text-xs">
          <div className="flex justify-between gap-3">
            <span className="font-mono text-[11px] text-muted-foreground">Region</span>
            <span className="font-medium text-foreground">eu-central</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="font-mono text-[11px] text-muted-foreground">Protocol</span>
            <span className="font-mono text-[11px] text-foreground">MCP 2026</span>
          </div>
        </div>
      );

    case "list-box":
    case "virtual-list":
    case "scroll-area":
    case "recency-groups":
      return (
        <div className="grid w-full max-w-[13.5rem] gap-1 rounded-lg bg-card p-1.5 text-xs">
          <div className="flex items-center justify-between rounded-sm bg-brand-soft px-2 py-1 font-medium text-foreground">
            <span>station-relay</span>
            <span className="font-mono text-[10px] text-brand-ink">Now</span>
          </div>
          <div className="flex items-center justify-between px-2 py-1 text-muted-foreground">
            <span>spanreed-cli</span>
            <span className="font-mono text-[10px]">2m</span>
          </div>
        </div>
      );

    case "spreadsheet":
      return (
        <div className="grid w-full max-w-[13.5rem] grid-cols-3 overflow-hidden rounded-md bg-card font-mono text-[10px] tabular-nums">
          <span className="bg-muted/70 px-2 py-1 text-muted-foreground">A</span>
          <span className="bg-muted/70 px-2 py-1 text-muted-foreground">B</span>
          <span className="bg-muted/70 px-2 py-1 text-muted-foreground">C</span>
          <span className="px-2 py-1 text-foreground">142</span>
          <span className="bg-brand-soft px-2 py-1 text-brand-ink">284</span>
          <span className="px-2 py-1 text-foreground">426</span>
        </div>
      );

    case "file-thumb":
      return (
        <div className="flex items-center gap-2">
          <div className="flex size-10 flex-col items-center justify-center rounded-md bg-card font-mono text-[10px] text-muted-foreground">
            <FileCode2 size={14} />
            <span>TSX</span>
          </div>
          <div className="flex size-10 flex-col items-center justify-center rounded-md bg-card font-mono text-[10px] text-muted-foreground">
            <Folder size={14} />
            <span>CSS</span>
          </div>
        </div>
      );

    /* ------------------------------------------------------------- Metrics */
    case "stat":
      return (
        <div className="w-full max-w-[13.5rem]">
          <StatGroup>
            <Stat label="Requests" value="48.2k" delta="+8.2%" trend="up" />
          </StatGroup>
        </div>
      );

    case "meter":
      return (
        <div className="w-full max-w-[13.5rem]">
          <Meter variant="ruler" label="Quota" value={68} ticks={18} showValue locale="en" />
        </div>
      );

    case "sparkline":
      return (
        <div className="w-full max-w-[13rem]">
          <Sparkline data={SPARKLINE_SERIES} label="Throughput" height={42} />
        </div>
      );

    case "activity-strip":
      return (
        <div className="flex justify-center">
          <ActivityStrip cells={ACTIVITY_CELLS} caption="Activity" size="sm" />
        </div>
      );

    case "status-dot":
      return (
        <div className="flex flex-wrap items-center justify-center gap-3 text-xs">
          <StatusDot tone="success" label="Healthy" />
          <StatusDot tone="info" pulse label="Syncing" />
          <StatusDot tone="warning" label="Stale" />
        </div>
      );

    case "number-ticker":
      return (
        <div className="font-display text-3xl font-semibold tabular-nums text-foreground">
          <NumberTicker value={128490} locale="en" />
        </div>
      );

    case "readout":
      return <Readout value="Synced 14:32 UTC" />;

    case "timeline":
      return (
        <div className="w-full max-w-[13.5rem] scale-95">
          <Timeline>
            <TimelineItem title="Key rotated" time="14:30" tone="success" />
            <TimelineItem title="Rate limit tuned" time="14:12" tone="info" />
          </Timeline>
        </div>
      );

    case "relative-time":
    case "local-time":
      return (
        <div className="grid gap-1 text-center font-mono text-xs">
          <span className="font-medium text-foreground">14:32 UTC</span>
          <span className="text-[11px] text-muted-foreground">3 minutes ago</span>
        </div>
      );

    case "series-chart":
    case "chart-legend":
      return (
        <div className="flex h-16 w-full max-w-[13rem] items-end justify-between gap-1.5 px-2">
          {[36, 58, 44, 76, 64, 92, 72].map((height, idx) => (
            <span
              key={idx}
              style={{ height: `${height}%` }}
              className={`flex-1 rounded-t-xs ${idx === 5 ? "bg-brand" : "bg-muted-foreground/35"}`}
            />
          ))}
        </div>
      );

    case "file-size":
      return <span className="font-mono text-sm font-medium tabular-nums text-foreground">42.8 MB</span>;

    /* --------------------------------------------------------- Composition */
    case "spinner":
      return (
        <div className="flex items-center gap-4">
          <Spinner label="Loading" />
          <Spinner variant="dots" label="Working" />
          <Spinner variant="grid" label="Computing" />
        </div>
      );

    case "shimmer-text":
      return <ShimmerText tone="light">Synthesizing 12 sources</ShimmerText>;

    case "scramble-text":
      return <span className="font-mono text-xs text-foreground">Calibrating relay…</span>;

    case "snippet":
      return (
        <div className="flex w-full max-w-[13.5rem] items-center justify-between gap-2 rounded-md bg-card px-2.5 py-2 font-mono text-[11px] text-foreground">
          <span className="truncate">$ bun add @fabrials/ui</span>
          <Copy size={12} className="shrink-0 text-muted-foreground" />
        </div>
      );

    case "button-group":
      return (
        <ButtonGroup>
          <Button size="sm" variant="outline">
            Day
          </Button>
          <Button size="sm" variant="secondary">
            Week
          </Button>
          <Button size="sm" variant="outline">
            Month
          </Button>
        </ButtonGroup>
      );

    case "input-group":
      return (
        <div className="flex w-full max-w-[13.5rem] items-center rounded-md bg-card px-2.5 py-1.5 font-mono text-xs">
          <span className="text-muted-foreground">https://</span>
          <span className="text-foreground">ui.fabrials.com</span>
        </div>
      );

    case "toaster":
      return (
        <div className="flex w-full max-w-[13.5rem] items-center gap-2.5 rounded-lg bg-popover px-3 py-2 text-xs shadow-sm">
          <StatusDot tone="success" label="Copied" hideLabel />
          <span className="font-medium text-foreground">API key copied</span>
        </div>
      );

    case "truncated-text":
      return (
        <span className="max-w-[12.5rem] truncate text-xs text-foreground">
          station-relay-production-eu-west-primary-01
        </span>
      );

    case "video-player":
    case "audio-player":
    case "clip-button":
      return (
        <div className="flex w-full max-w-[13rem] items-center gap-2.5 rounded-lg bg-card px-3 py-2">
          <span className="inline-flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Play size={11} />
          </span>
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-3/5 bg-brand" />
          </div>
          <span className="font-mono text-[10px] tabular-nums text-muted-foreground">0:42</span>
        </div>
      );

    case "recorder-panel":
    case "voice-input":
    case "speech":
    case "read-aloud":
      return (
        <div className="flex items-center gap-2.5 rounded-lg bg-card px-3 py-2">
          {slug === "speech" || slug === "read-aloud" ? (
            <Volume2 size={14} className="text-brand-ink" />
          ) : (
            <Mic size={14} className="text-brand-ink" />
          )}
          <div className="flex items-center gap-1">
            {[6, 14, 10, 18, 12, 8, 15, 7].map((h, i) => (
              <span key={i} style={{ height: `${h}px` }} className="w-1 rounded-full bg-brand/80" />
            ))}
          </div>
        </div>
      );

    /* ---------------------------------------------------------- Navigation */
    case "kbd":
      return (
        <div className="flex items-center gap-3">
          <KbdGroup>
            <Kbd>⌘</Kbd>
            <Kbd>K</Kbd>
          </KbdGroup>
          <KbdGroup>
            <Kbd>Shift</Kbd>
            <Kbd>P</Kbd>
          </KbdGroup>
        </div>
      );

    case "breadcrumb":
      return (
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#docs">Docs</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Controls</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      );

    case "pagination":
      return (
        <div className="flex items-center gap-1 font-mono text-xs">
          <span className="rounded-sm px-2 py-1 text-muted-foreground">1</span>
          <span className="rounded-sm bg-card px-2 py-1 font-medium text-brand-ink">2</span>
          <span className="rounded-sm px-2 py-1 text-muted-foreground">3</span>
          <span className="px-1 text-muted-foreground">…</span>
          <span className="rounded-sm px-2 py-1 text-muted-foreground">9</span>
        </div>
      );

    case "command":
    case "command-trigger":
      return (
        <div className="flex w-full max-w-[13.5rem] items-center gap-2 rounded-lg bg-popover px-3 py-2 text-xs text-muted-foreground shadow-xs">
          <Search size={13} />
          <span className="flex-1 text-left">Jump to component…</span>
          <Kbd>⌘K</Kbd>
        </div>
      );

    case "sidebar":
    case "side-panel":
    case "workspace-shell":
    case "sidebar-account":
    case "resizable":
      return (
        <div className="grid h-20 w-full max-w-[13.5rem] grid-cols-[3.5rem_1fr] overflow-hidden rounded-lg bg-card">
          <div className="grid content-start gap-1.5 bg-sidebar p-2">
            <span className="h-1.5 w-8 rounded-xs bg-brand-ink/70" />
            <span className="h-1.5 w-6 rounded-xs bg-muted-foreground/30" />
            <span className="h-1.5 w-7 rounded-xs bg-muted-foreground/30" />
          </div>
          <div className="grid content-start gap-1.5 p-2.5">
            <span className="h-2 w-14 rounded-xs bg-foreground/25" />
            <span className="h-8 rounded-sm bg-muted/70" />
          </div>
        </div>
      );

    /* ------------------------------------------------------------ Overlays */
    case "tooltip":
      return (
        <div className="flex flex-col items-center gap-1.5">
          <span className="rounded-sm bg-foreground px-2.5 py-1 text-[11px] font-medium text-background">
            Copy snippet · ⌘C
          </span>
          <Button size="xs" variant="outline">
            Copy
          </Button>
        </div>
      );

    case "popover":
    case "hover-card":
    case "status-popover":
      return (
        <div className="w-full max-w-[13rem] rounded-lg border border-border bg-popover p-2.5 text-left shadow-sm">
          <div className="flex items-center justify-between text-xs font-medium text-foreground">
            <span>Relay status</span>
            <StatusDot tone="success" label="Healthy" hideLabel />
          </div>
          <p className="m-0 mt-1 text-[11px] text-muted-foreground">All 3 regions answering under 40 ms.</p>
        </div>
      );

    case "dialog":
    case "alert-dialog":
    case "confirm-dialog":
    case "confirmation-dialog":
    case "elicitation-dialog":
      return (
        <div className="w-full max-w-[13.5rem] rounded-xl border border-border bg-popover p-3 text-left shadow-md">
          <div className="text-xs font-semibold text-foreground">Revoke key?</div>
          <p className="m-0 mt-0.5 text-[11px] text-muted-foreground">Active clients lose access.</p>
          <div className="mt-2.5 flex justify-end gap-1.5">
            <Button size="xs" variant="ghost">
              Cancel
            </Button>
            <Button size="xs" variant="destructive">
              Revoke
            </Button>
          </div>
        </div>
      );

    case "sheet":
      return (
        <div className="relative h-20 w-full max-w-[13.5rem] overflow-hidden rounded-lg bg-muted/50">
          <div className="absolute inset-y-0 right-0 flex w-24 flex-col gap-1.5 border-l border-border bg-popover p-2.5 shadow-md">
            <span className="h-2 w-12 rounded-xs bg-foreground/30" />
            <span className="h-1.5 w-16 rounded-xs bg-muted-foreground/35" />
            <span className="h-1.5 w-14 rounded-xs bg-muted-foreground/35" />
          </div>
        </div>
      );

    case "dropdown-menu":
    case "context-menu":
      return (
        <div className="grid w-full max-w-[12rem] gap-0.5 rounded-lg border border-border bg-popover p-1 text-left text-xs shadow-sm">
          <div className="flex items-center justify-between rounded-sm bg-accent px-2 py-1 text-foreground">
            <span>Duplicate</span>
            <Kbd>⌘D</Kbd>
          </div>
          <div className="px-2 py-1 text-muted-foreground">Archive</div>
        </div>
      );

    /* ------------------------------------------------------------ Patterns */
    case "page-header":
    case "section-header":
      return (
        <div className="grid w-full max-w-[14rem] gap-0.5 text-left">
          <span className="font-mono text-[10px] text-muted-foreground">Last 14 days · UTC</span>
          <span className="font-display text-lg font-semibold leading-tight text-foreground">Usage &amp; quotas</span>
          <span className="text-[11px] text-muted-foreground">Live relay traffic across regions.</span>
        </div>
      );

    case "state-panel":
    case "state-page":
      return (
        <div className="flex w-full max-w-[13.5rem] items-start gap-2.5 rounded-xl bg-card p-3 text-left">
          <Bell size={14} className="mt-0.5 shrink-0 text-muted-foreground" />
          <div className="grid gap-0.5">
            <span className="text-xs font-medium text-foreground">No alerts yet</span>
            <span className="text-[11px] text-muted-foreground">Add a threshold rule to monitor.</span>
          </div>
        </div>
      );

    case "settings-section":
      return (
        <div className="grid w-full max-w-[14rem] grid-cols-[1fr_auto] items-center gap-3 text-left">
          <div>
            <div className="text-xs font-medium text-foreground">Daily digest</div>
            <div className="text-[10px] text-muted-foreground">Summary at 08:00 UTC</div>
          </div>
          <Switch checked readOnly aria-label="Daily digest" />
        </div>
      );

    case "suggestion-card":
    case "item":
      return (
        <div className="flex w-full max-w-[13.5rem] items-center justify-between rounded-lg bg-card px-3 py-2 text-left">
          <div>
            <div className="text-xs font-medium text-foreground">Inspect token spend</div>
            <div className="text-[10px] text-muted-foreground">Last 24 hours by model</div>
          </div>
          <ChevronRight size={13} className="text-muted-foreground" />
        </div>
      );

    /* ------------------------------------------------------- Documentation */
    case "code-panel":
    case "code-tabs":
    case "package-install":
      return (
        <div className="w-full max-w-[14rem] overflow-hidden rounded-lg bg-card text-left font-mono text-[10px]">
          <div className="flex items-center justify-between border-b border-border/50 px-2.5 py-1 text-muted-foreground">
            <span>{slug === "package-install" ? "bun · pnpm · npm" : "tokens.css"}</span>
            <Copy size={11} />
          </div>
          <div className="px-2.5 py-2 text-foreground">
            {slug === "package-install" ? (
              <span>bun add @fabrials/ui</span>
            ) : (
              <span>
                <span className="text-brand-ink">--brand</span>: oklch(0.77 0.1 258);
              </span>
            )}
          </div>
        </div>
      );

    case "files":
      return (
        <div className="grid w-full max-w-[13rem] gap-1 rounded-lg bg-card p-2 text-left font-mono text-[11px]">
          <div className="flex items-center gap-1.5 text-foreground">
            <Folder size={12} className="text-muted-foreground" />
            <span>packages/ui</span>
          </div>
          <div className="flex items-center gap-1.5 pl-4 text-muted-foreground">
            <FileCode2 size={12} />
            <span>tokens.css</span>
          </div>
        </div>
      );

    case "repo-info":
      return (
        <div className="flex items-center gap-2 rounded-md bg-card px-3 py-2 text-xs">
          <Globe size={13} className="text-muted-foreground" />
          <span className="font-medium text-foreground">fabrials-ui</span>
          <Badge size="sm">MIT</Badge>
        </div>
      );

    /* ------------------------------------------------------------- Effects */
    case "moon-phase":
      return <MoonPhase size={44} />;

    case "starfield":
      return (
        <div className="relative flex h-20 w-full max-w-[13.5rem] items-center justify-center overflow-hidden rounded-lg bg-card">
          <span className="absolute left-5 top-4 size-1 rounded-full bg-foreground/60" />
          <span className="absolute left-16 top-10 size-0.5 rounded-full bg-foreground/45" />
          <span className="absolute right-10 top-5 size-1 rounded-full bg-brand-ink/80" />
          <span className="absolute bottom-5 left-12 size-0.5 rounded-full bg-foreground/50" />
          <span className="absolute bottom-6 right-14 size-1 rounded-full bg-foreground/55" />
          <span className="font-mono text-[10px] text-muted-foreground">Night sky</span>
        </div>
      );

    /* ------------------------------------------------------------------ AI */
    case "chat-message":
    case "conversation":
    case "editable-message":
      return (
        <div className="grid w-full max-w-[14rem] gap-1.5 text-left">
          <ChatMessage from="assistant" className="!text-xs">
            Tokens calibrated across light and dark surfaces.
          </ChatMessage>
        </div>
      );

    case "chat-composer":
    case "composer-select":
      return (
        <div className="flex w-full max-w-[14rem] items-center justify-between gap-2 rounded-lg bg-card px-3 py-2 text-xs">
          <span className="text-muted-foreground">Ask anything…</span>
          <span className="inline-flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Send size={11} />
          </span>
        </div>
      );

    case "agent-thinking":
    case "activity-disclosure":
      return <AgentThinking activity="searching" label="Reviewing tokens" timer={false} />;

    case "working-light":
      return (
        <div className="relative flex h-16 w-full max-w-[13.5rem] items-center justify-center overflow-hidden rounded-xl bg-card px-3 text-xs text-muted-foreground">
          <span>Agent running</span>
          <WorkingLight />
        </div>
      );

    case "tool-call":
      return (
        <div className="w-full max-w-[14rem]">
          <ToolCall name="query_logs" state="done" duration={210} />
        </div>
      );

    case "suggestion-chips":
      return <SuggestionChips items={DEMO_CHIPS} onSelect={NOOP} />;

    case "source-tally":
      return <SourceTally sources={DEMO_SOURCES} label="Read" />;

    case "task-list":
      return (
        <div className="w-full max-w-[14rem] scale-95">
          <TaskList tasks={DEMO_TASKS} />
        </div>
      );

    case "context-meter":
      return (
        <div className="w-full max-w-[13.5rem]">
          <ContextMeter limit={128_000} parts={DEMO_CONTEXT_PARTS} legend={false} />
        </div>
      );

    case "provider-icon":
    case "provider-card":
      return (
        <div className="flex items-center gap-3">
          <ProviderIcon provider="anthropic" size={22} />
          <ProviderIcon provider="openai" size={22} />
          <ProviderIcon provider="xai" size={22} />
          <ProviderIcon provider="google" size={22} />
        </div>
      );

    case "markdown-callout":
      return (
        <div className="w-full max-w-[14rem] scale-95">
          <MarkdownCallout kind="tip" title="Tip">
            Use semantic OKLCH tokens.
          </MarkdownCallout>
        </div>
      );

    case "generation-frame":
      return (
        <div className="relative flex h-20 w-full max-w-[13.5rem] items-center justify-center overflow-hidden rounded-xl bg-card px-3 font-mono text-[11px] text-muted-foreground">
          <span>Rendering frame</span>
          <WorkingLight />
        </div>
      );

    case "citations":
    case "code-block":
    case "markdown-helpers":
    case "attachments":
    case "use-attachments":
      return (
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          <Badge tone="info" size="sm">
            [1] tokens.css
          </Badge>
          <Badge size="sm">[2] DESIGN.md</Badge>
        </div>
      );

    /* ------------------------------------------- Registry WebMCP / MCP etc */
    case "comparison":
      return (
        <div className="grid w-full max-w-[14rem] grid-cols-2 gap-1.5 text-left text-[11px]">
          <div className="rounded-md bg-brand-soft p-2">
            <div className="font-medium text-brand-ink">Best fit</div>
            <div className="text-muted-foreground">32 ms · EU</div>
          </div>
          <div className="rounded-md bg-card p-2">
            <div className="font-medium text-foreground">Standard</div>
            <div className="text-muted-foreground">68 ms · US</div>
          </div>
        </div>
      );

    case "support-badge":
      return (
        <div className="flex items-center gap-2">
          <Badge tone="success" dot>
            WebMCP native
          </Badge>
        </div>
      );

    case "action-button":
      return (
        <Button size="sm" variant="accent">
          Run action
        </Button>
      );

    case "wizard":
      return (
        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span className="inline-flex size-5 items-center justify-center rounded-full bg-brand text-brand-foreground">
            1
          </span>
          <span className="h-px w-4 bg-brand-ink" />
          <span className="inline-flex size-5 items-center justify-center rounded-full bg-card text-foreground">2</span>
          <span className="h-px w-4 bg-border" />
          <span className="inline-flex size-5 items-center justify-center rounded-full bg-muted text-muted-foreground">
            3
          </span>
        </div>
      );

    case "execution-log":
    case "tool-catalog":
    case "tool-detail":
    case "result-view":
    case "mcp-dashboard":
    case "connection-panel":
    case "resource-explorer":
      return (
        <div className="grid w-full max-w-[14rem] gap-1.5 rounded-lg bg-card p-2.5 text-left font-mono text-[11px]">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-foreground">
              <Terminal size={12} className="text-brand-ink" />
              <span>{slug.replace(/-/g, "_")}</span>
            </span>
            <Badge tone="success" size="sm">
              200
            </Badge>
          </div>
          <span className="truncate text-[10px] text-muted-foreground">MCP 2026-07-28 · Connected</span>
        </div>
      );

    default:
      return <CategoryFallback category={category} title={title ?? slug} />;
  }
}

function CategoryFallback({ category, title }: { category?: string; title: string }) {
  const group = (category ?? "").toLowerCase();

  if (group === "ai") {
    return (
      <div className="flex w-full max-w-[13.5rem] items-center gap-2 rounded-lg bg-card px-3 py-2 text-left text-xs">
        <ProviderIcon provider="anthropic" size={16} />
        <span className="truncate font-medium text-foreground">{title}</span>
      </div>
    );
  }

  if (group === "webmcp" || group === "mcp" || group === "interaction" || group === "foundation") {
    return (
      <div className="grid w-full max-w-[13.5rem] gap-1 rounded-lg bg-card px-3 py-2 text-left">
        <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
          <ShieldCheck size={13} className="shrink-0 text-brand-ink" />
          <span className="truncate">{title}</span>
        </div>
        <span className="font-mono text-[10px] text-muted-foreground">Shared human + agent block</span>
      </div>
    );
  }

  if (group === "foundations") {
    return (
      <div className="flex items-center gap-2 rounded-md bg-card px-3 py-2 font-mono text-[11px] text-foreground">
        <Command size={13} className="shrink-0 text-brand-ink" />
        <span className="truncate">{title}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-lg bg-card px-3 py-2 text-xs text-foreground">
      <Layers size={13} className="shrink-0 text-muted-foreground" />
      <span className="truncate font-medium">{title}</span>
    </div>
  );
}

export const ComponentSpecimen = memo(function ComponentSpecimen({
  slug,
  category,
  title,
}: {
  slug: string;
  category?: string;
  title?: string;
}) {
  return <div className="docs-specimen">{renderSpecimen(slug, category, title)}</div>;
});
