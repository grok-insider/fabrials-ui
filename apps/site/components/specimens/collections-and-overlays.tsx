"use client";

import type { ReactNode } from "react";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronRight,
  FileCode2,
  Image as ImageIcon,
  Minus,
  MousePointer2,
  Plus,
  Search,
  X,
} from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Avatar,
  AvatarBadge,
  AvatarFallback,
  Badge,
  Button,
  Card,
  CardDescription,
  CardTitle,
  Kbd,
  Loading,
  Progress,
  Separator,
  Skeleton,
  Spinner,
  Stat,
  StatusDot,
  Tabs,
  TabsList,
  TabsTrigger,
} from "@fabrials/ui";

export const collectionsAndOverlaysSpecimens: Record<string, () => ReactNode> = {
  /* ---------------------------------------------------------- Collections */
  badge: () => (
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
  ),

  card: () => (
    <Card className="w-full max-w-[13.5rem] !p-3">
      <CardTitle className="!text-xs">Relay throughput</CardTitle>
      <CardDescription className="mt-1 !text-[11px]">1.28M requests · 99.98% ok</CardDescription>
    </Card>
  ),

  alert: () => (
    <Alert variant="info" className="w-full max-w-[14rem] !px-3 !py-2">
      <AlertTitle className="!text-xs">Quota at 80%</AlertTitle>
      <AlertDescription className="!text-[11px]">Resets in 4 days.</AlertDescription>
    </Alert>
  ),

  table: () => (
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
  ),

  tabs: () => (
    <Tabs value="overview">
      <TabsList variant="segmented" aria-label="Sections">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="keys">Keys</TabsTrigger>
        <TabsTrigger value="logs">Logs</TabsTrigger>
      </TabsList>
    </Tabs>
  ),

  progress: () => (
    <div className="grid w-full max-w-[13rem] gap-2">
      <Progress value={68} label="Indexing" showValue />
    </div>
  ),

  skeleton: () => (
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
  ),

  loading: () => (
    <div className="w-full max-w-[13.5rem]">
      <Loading when label="Loading throughput">
        <Card className="!p-2.5">
          <Stat label="Requests" value="48.2k" delta="+8.2%" trend="up" />
        </Card>
      </Loading>
    </div>
  ),

  combobox: () => (
    <div className="grid w-full max-w-[13.5rem] gap-1 text-left">
      <div className="flex items-center gap-1.5 rounded-md bg-card px-2.5 py-1 text-xs text-foreground ring-1 ring-brand-ink/50">
        <Search size={11} className="text-muted-foreground" />
        <span className="font-mono text-[11px]">
          cla<span className="inline-block h-3 w-px bg-brand-ink align-middle" />
        </span>
      </div>
      <div className="grid gap-0.5 rounded-md border border-border bg-popover p-1 font-mono text-[10px] shadow-xs">
        <div className="rounded-xs bg-accent px-2 py-0.5 text-foreground">
          <span className="rounded-xs bg-brand-soft px-0.5 text-brand-ink">cla</span>ude-opus-5
        </div>
        <div className="px-2 py-0.5 text-muted-foreground">
          <span className="rounded-xs bg-brand-soft px-0.5 text-brand-ink">cla</span>ude-sonnet-4
        </div>
      </div>
    </div>
  ),

  avatar: () => (
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
  ),

  separator: () => (
    <div className="grid w-full max-w-[12.5rem] gap-2 text-xs">
      <span className="font-medium text-foreground">Workspace</span>
      <Separator />
      <span className="text-muted-foreground">Billing &amp; quotas</span>
    </div>
  ),

  accordion: () => (
    <div className="grid w-full max-w-[13.5rem] divide-y divide-border/50 rounded-lg bg-card px-2.5 py-1 text-left text-[11px]">
      <div className="py-1">
        <div className="flex items-center justify-between font-medium text-foreground">
          <span>Token architecture</span>
          <ChevronDown size={11} className="text-muted-foreground" />
        </div>
        <p className="m-0 mt-0.5 text-[10px] text-muted-foreground">OKLCH roles adapt per theme.</p>
      </div>
      <div className="flex items-center justify-between py-1 text-muted-foreground">
        <span>Dark surfaces</span>
        <ChevronRight size={11} />
      </div>
      <div className="flex items-center justify-between py-1 text-muted-foreground">
        <span>Reduced motion</span>
        <ChevronRight size={11} />
      </div>
    </div>
  ),

  collapsible: () => (
    <div className="grid w-full max-w-[13.5rem] gap-1 text-left text-xs">
      <div className="flex items-center justify-between rounded-md bg-secondary/70 px-2.5 py-1 font-medium text-foreground">
        <span>Reasoning steps</span>
        <ChevronDown size={12} className="text-muted-foreground" />
      </div>
      <div className="rounded-md bg-card px-2.5 py-1.5 text-[10px] text-muted-foreground">
        Checked 3 policies and verified quota headroom.
      </div>
    </div>
  ),

  disclosure: () => (
    <div className="grid w-full max-w-[13.5rem] gap-1 text-left">
      <div className="flex items-center justify-between rounded-md bg-card px-2.5 py-1.5 text-[11px] font-medium text-foreground">
        <span className="flex items-center gap-1.5">
          <ChevronRight size={11} className="text-brand-ink" />
          <span>Show technical details</span>
        </span>
        <span className="rounded-xs bg-muted px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground">4</span>
      </div>
      <span className="px-2.5 font-mono text-[9px] text-muted-foreground">&lt;details&gt; · zero JS</span>
    </div>
  ),

  "description-list": () => (
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
  ),

  "list-box": () => (
    <div className="grid w-full max-w-[13.5rem] gap-0.5 rounded-lg bg-card p-1.5 text-left text-[11px]">
      <div className="flex items-center justify-between border-s-2 border-brand-ink bg-brand-soft px-2 py-0.5 font-medium text-foreground">
        <span>station-relay</span>
        <Check size={11} className="text-brand-ink" />
      </div>
      <div className="flex items-center justify-between border-s-2 border-transparent px-2 py-0.5 text-foreground">
        <span>spanreed-cli</span>
        <Check size={11} className="text-brand-ink" />
      </div>
      <div className="flex items-center justify-between border-s-2 border-transparent px-2 py-0.5 text-muted-foreground">
        <span>syl-runner</span>
        <span className="font-mono text-[9px]">2 selected</span>
      </div>
    </div>
  ),

  "virtual-list": () => (
    <div className="grid w-full max-w-[14rem] gap-1 rounded-lg bg-card p-1.5 text-left">
      <div className="flex items-center justify-between px-1 font-mono text-[9px] text-muted-foreground">
        <span>rows 1,420–1,422 of 50,000</span>
      </div>
      <div className="flex gap-1.5">
        <div className="grid flex-1 gap-0.5 font-mono text-[10px] tabular-nums">
          <div className="flex justify-between rounded-xs bg-muted/60 px-1.5 py-0.5 text-foreground">
            <span className="text-brand-ink">#1420</span>
            <span>req_9f4a</span>
          </div>
          <div className="flex justify-between px-1.5 py-0.5 text-muted-foreground">
            <span>#1421</span>
            <span>req_9f4b</span>
          </div>
          <div className="flex justify-between px-1.5 py-0.5 text-muted-foreground">
            <span>#1422</span>
            <span>req_9f4c</span>
          </div>
        </div>
        <div className="relative w-1.5 rounded-full bg-muted">
          <span className="absolute inset-x-0 top-1/2 h-3 -translate-y-1/2 rounded-full bg-brand-ink/80" />
        </div>
      </div>
    </div>
  ),

  "scroll-area": () => (
    <div className="relative flex h-20 w-full max-w-[13.5rem] gap-2 overflow-hidden rounded-lg bg-card p-2 text-left">
      <div className="relative grid flex-1 content-start gap-1 text-[10px] text-muted-foreground">
        <span className="font-medium text-foreground">Release notes</span>
        <span>Added Stormlight tokens and ruler meters.</span>
        <span>Improved keyboard navigation on panes.</span>
        <span className="opacity-45">Updated forced-colors outlines across views.</span>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-5 bg-gradient-to-t from-card to-transparent" />
      </div>
      <div className="relative w-1.5 shrink-0 rounded-full bg-muted/70">
        <span className="absolute inset-x-0 top-1.5 h-7 rounded-full bg-muted-foreground/60" />
      </div>
    </div>
  ),

  "recency-groups": () => (
    <div className="grid w-full max-w-[13.5rem] gap-1 rounded-lg bg-card p-2 text-left">
      <div className="font-mono text-[9px] font-medium text-brand-ink">Today</div>
      <div className="flex items-center justify-between text-[11px] text-foreground">
        <span>Relay latency audit</span>
        <span className="font-mono text-[9px] text-muted-foreground">14:20</span>
      </div>
      <div className="mt-0.5 border-t border-border/50 pt-1 font-mono text-[9px] font-medium text-muted-foreground">
        Yesterday
      </div>
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>Rotate staging keys</span>
        <span className="font-mono text-[9px]">18:05</span>
      </div>
    </div>
  ),

  spreadsheet: () => (
    <div className="grid w-full max-w-[13.5rem] grid-cols-3 overflow-hidden rounded-md bg-card font-mono text-[10px] tabular-nums">
      <span className="bg-muted/70 px-2 py-1 text-muted-foreground">A</span>
      <span className="bg-muted/70 px-2 py-1 text-muted-foreground">B</span>
      <span className="bg-muted/70 px-2 py-1 text-muted-foreground">C</span>
      <span className="px-2 py-1 text-foreground">142</span>
      <span className="bg-brand-soft px-2 py-1 text-brand-ink">284</span>
      <span className="px-2 py-1 text-foreground">426</span>
    </div>
  ),

  "file-thumb": () => (
    <div className="flex items-center gap-2">
      <div className="flex size-10 flex-col items-center justify-center rounded-md bg-card font-mono text-[10px] text-muted-foreground">
        <FileCode2 size={14} />
        <span>TSX</span>
      </div>
      <div className="flex size-10 flex-col items-center justify-center rounded-md bg-card font-mono text-[10px] text-muted-foreground">
        <ImageIcon size={14} className="text-brand-ink" />
        <span>PNG</span>
      </div>
    </div>
  ),

  /* ------------------------------------------------------------- Overlays */
  tooltip: () => (
    <div className="flex flex-col items-center gap-1.5">
      <span className="rounded-sm bg-foreground px-2.5 py-1 text-[11px] font-medium text-background">
        Copy snippet · ⌘C
      </span>
      <Button size="xs" variant="outline">
        Copy
      </Button>
    </div>
  ),

  popover: () => (
    <div className="grid w-full max-w-[13rem] gap-1 text-left">
      <div className="flex justify-start">
        <span className="rounded-md bg-card px-2 py-0.5 text-[10px] font-medium text-foreground">Options</span>
      </div>
      <div className="rounded-lg border border-border bg-popover p-2 shadow-sm">
        <div className="flex items-center justify-between text-[11px] font-medium text-foreground">
          <span>Display density</span>
          <X size={11} className="text-muted-foreground" />
        </div>
        <div className="mt-1 text-[10px] text-muted-foreground">Compact rows · 36 px</div>
      </div>
    </div>
  ),

  "hover-card": () => (
    <div className="grid w-full max-w-[13.5rem] gap-1 text-left">
      <span className="font-mono text-[10px] text-brand-ink underline underline-offset-2">@kaladin</span>
      <div className="flex items-center gap-2 rounded-lg border border-border bg-popover p-2 shadow-sm">
        <Avatar size="sm">
          <AvatarFallback>KS</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="truncate text-[11px] font-semibold text-foreground">Kaladin S.</div>
          <div className="truncate text-[10px] text-muted-foreground">Maintainer · EU-Central</div>
        </div>
      </div>
    </div>
  ),

  "status-popover": () => (
    <div className="grid w-full max-w-[13.5rem] gap-1 text-left">
      <div className="inline-flex w-fit items-center gap-1.5 rounded-full bg-card px-2 py-0.5 text-[10px] text-foreground">
        <StatusDot tone="success" label="Operational" hideLabel />
        <span>Operational</span>
      </div>
      <div className="grid gap-0.5 rounded-lg border border-border bg-popover px-2 py-1.5 font-mono text-[10px] shadow-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">eu-central</span>
          <span className="text-success-ink">28 ms</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">us-east</span>
          <span className="text-success-ink">36 ms</span>
        </div>
      </div>
    </div>
  ),

  dialog: () => (
    <div className="w-full max-w-[13.5rem] rounded-xl border border-border bg-popover p-2.5 text-left shadow-md">
      <div className="text-[11px] font-semibold text-foreground">Rename key</div>
      <div className="mt-1.5 rounded-sm bg-card px-2 py-1 font-mono text-[10px] text-foreground">relay-prod</div>
      <div className="mt-2 flex justify-end gap-1.5">
        <Button size="xs" variant="ghost">
          Cancel
        </Button>
        <Button size="xs">Save</Button>
      </div>
    </div>
  ),

  "alert-dialog": () => (
    <div className="w-full max-w-[13.5rem] rounded-xl border border-border bg-popover p-2.5 text-left shadow-md">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-foreground">
        <AlertTriangle size={12} className="text-destructive" />
        <span>Delete workspace?</span>
      </div>
      <p className="m-0 mt-0.5 text-[10px] text-muted-foreground">All keys and logs will be removed.</p>
      <div className="mt-2 flex justify-end gap-1.5">
        <Button size="xs" variant="ghost">
          Cancel
        </Button>
        <Button size="xs" variant="destructive">
          Delete
        </Button>
      </div>
    </div>
  ),

  "confirm-dialog": () => (
    <div className="w-full max-w-[13.5rem] rounded-xl border border-border bg-popover p-2.5 text-left shadow-md">
      <div className="text-[11px] font-semibold text-foreground">Rotate secret?</div>
      <p className="m-0 mt-0.5 text-[10px] text-muted-foreground">Issuing replacement token…</p>
      <div className="mt-2 flex items-center justify-end gap-1.5">
        <span className="inline-flex items-center gap-1.5 rounded-md bg-primary px-2 py-1 text-[10px] font-medium text-primary-foreground">
          <Spinner className="size-3" label="Confirming" />
          <span>Confirming</span>
        </span>
      </div>
    </div>
  ),

  sheet: () => (
    <div className="relative h-20 w-full max-w-[13.5rem] overflow-hidden rounded-lg bg-muted/50">
      <div className="absolute inset-y-0 right-0 flex w-24 flex-col gap-1.5 border-l border-border bg-popover p-2.5 shadow-md">
        <div className="flex items-center justify-between">
          <span className="h-2 w-10 rounded-xs bg-foreground/30" />
          <X size={10} className="text-muted-foreground" />
        </div>
        <span className="h-1.5 w-16 rounded-xs bg-muted-foreground/35" />
        <span className="h-1.5 w-14 rounded-xs bg-muted-foreground/35" />
      </div>
    </div>
  ),

  "dropdown-menu": () => (
    <div className="grid w-full max-w-[12.5rem] gap-1 text-left">
      <div className="inline-flex w-fit items-center gap-1 rounded-md bg-card px-2 py-0.5 text-[10px] font-medium text-foreground">
        <span>Actions</span>
        <ChevronDown size={10} className="text-muted-foreground" />
      </div>
      <div className="grid gap-0.5 rounded-lg border border-border bg-popover p-1 text-[11px] shadow-sm">
        <div className="flex items-center justify-between rounded-sm bg-accent px-2 py-0.5 text-foreground">
          <span>Duplicate</span>
          <Kbd>⌘D</Kbd>
        </div>
        <div className="px-2 py-0.5 text-muted-foreground">Archive</div>
      </div>
    </div>
  ),

  "context-menu": () => (
    <div className="relative flex w-full max-w-[13.5rem] items-start gap-2 text-left">
      <div className="flex items-center gap-1 rounded-md bg-card px-2 py-1 text-[10px] text-muted-foreground">
        <MousePointer2 size={10} className="text-brand-ink" />
        <span>Row</span>
      </div>
      <div className="grid flex-1 gap-0.5 rounded-lg border border-border bg-popover p-1 text-[10px] shadow-sm">
        <div className="flex items-center justify-between rounded-xs bg-accent px-1.5 py-0.5 text-foreground">
          <span>Move to</span>
          <ChevronRight size={10} />
        </div>
        <div className="px-1.5 py-0.5 text-muted-foreground">Copy link</div>
        <div className="px-1.5 py-0.5 text-destructive">Delete</div>
      </div>
    </div>
  ),

  "image-viewer": () => (
    <div className="grid w-full max-w-[13.5rem] gap-1.5 rounded-lg bg-foreground/90 p-2 text-background">
      <div className="relative flex h-11 items-center justify-center rounded-sm bg-background/10">
        <ImageIcon size={16} className="opacity-80" />
        <span className="absolute right-1.5 top-1 rounded-xs bg-background/20 px-1 font-mono text-[8px]">1.5×</span>
      </div>
      <div className="flex justify-center gap-1">
        <span className="h-2.5 w-4 rounded-xs bg-background/25" />
        <span className="h-2.5 w-4 rounded-xs bg-brand ring-1 ring-background" />
        <span className="h-2.5 w-4 rounded-xs bg-background/25" />
      </div>
    </div>
  ),

  "zoom-pan": () => (
    <div className="relative flex h-20 w-full max-w-[13.5rem] items-center justify-center overflow-hidden rounded-lg bg-card">
      <div className="size-10 rounded-md border border-dashed border-brand-ink/60 bg-brand-soft/60" />
      <div className="absolute bottom-1.5 right-1.5 flex items-center gap-1 rounded-md border border-border bg-popover px-1.5 py-0.5 font-mono text-[9px] text-foreground shadow-xs">
        <Minus size={9} />
        <span>125%</span>
        <Plus size={9} />
      </div>
    </div>
  ),
};
