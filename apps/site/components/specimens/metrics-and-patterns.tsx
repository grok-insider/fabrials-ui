"use client";

import type { ReactNode } from "react";
import {
  Bell,
  ChevronRight,
  Copy,
  FileCode2,
  Folder,
  Globe,
  Search,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import {
  ActivityStrip,
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  Kbd,
  Meter,
  MoonPhase,
  NumberTicker,
  Readout,
  Sparkline,
  Stat,
  StatGroup,
  StatusDot,
  Switch,
  Timeline,
  TimelineItem,
} from "@fabrials/ui";

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

export const metricsAndPatternsSpecimens: Record<string, () => ReactNode> = {
  /* -------------------------------------------------------------- Metrics */
  stat: () => (
    <div className="w-full max-w-[13.5rem]">
      <StatGroup>
        <Stat label="Requests" value="48.2k" delta="+8.2%" trend="up" />
      </StatGroup>
    </div>
  ),

  meter: () => (
    <div className="w-full max-w-[13.5rem]">
      <Meter variant="ruler" label="Quota" value={68} ticks={18} showValue locale="en" />
    </div>
  ),

  sparkline: () => (
    <div className="w-full max-w-[13rem]">
      <Sparkline data={SPARKLINE_SERIES} label="Throughput" height={42} />
    </div>
  ),

  "activity-strip": () => (
    <div className="flex justify-center">
      <ActivityStrip cells={ACTIVITY_CELLS} caption="Activity" size="sm" />
    </div>
  ),

  "status-dot": () => (
    <div className="flex flex-wrap items-center justify-center gap-3 text-xs">
      <StatusDot tone="success" label="Healthy" />
      <StatusDot tone="info" pulse label="Syncing" />
      <StatusDot tone="warning" label="Stale" />
    </div>
  ),

  "number-ticker": () => (
    <div className="font-display text-3xl font-semibold tabular-nums text-foreground">
      <NumberTicker value={128490} locale="en" />
    </div>
  ),

  readout: () => <Readout value="Synced 14:32 UTC" />,

  timeline: () => (
    <div className="w-full max-w-[13.5rem] scale-95">
      <Timeline>
        <TimelineItem title="Key rotated" time="14:30" tone="success" />
        <TimelineItem title="Rate limit tuned" time="14:12" tone="info" />
      </Timeline>
    </div>
  ),

  "relative-time": () => (
    <div className="grid gap-1 text-center">
      <div className="inline-flex items-center justify-center gap-1.5 text-xs font-medium text-foreground">
        <span className="size-1.5 rounded-full bg-brand-ink" />
        <span>3 minutes ago</span>
      </div>
      <span className="font-mono text-[10px] text-muted-foreground">Nov 24, 14:29</span>
    </div>
  ),

  "series-chart": () => (
    <div className="grid w-full max-w-[13.5rem] gap-1">
      <div className="flex h-14 items-end justify-between gap-1.5 border-b border-border/60 px-2 pb-1">
        {[
          [1, 1],
          [1, 1, 1],
          [1, 1],
          [1, 1, 1, 1],
          [1, 1, 1],
          [1, 1, 1, 1, 1],
          [1, 1, 1, 1],
        ].map((cells, colIdx) => (
          <div key={colIdx} className="flex flex-1 flex-col-reverse gap-0.5">
            {cells.map((_, rowIdx) => (
              <span
                key={rowIdx}
                className={`h-1.5 w-full rounded-[1px] ${
                  colIdx === 5 ? "bg-brand" : rowIdx === 0 ? "bg-muted-foreground/55" : "bg-muted-foreground/30"
                }`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex justify-between px-2 font-mono text-[8px] text-muted-foreground">
        <span>Mon</span>
        <span>Thu</span>
        <span>Sun</span>
      </div>
    </div>
  ),

  "chart-legend": () => (
    <div className="grid w-full max-w-[14rem] gap-1.5">
      <div className="flex flex-wrap items-center justify-center gap-1.5 text-[10px]">
        <span className="inline-flex items-center gap-1 rounded-sm bg-card px-1.5 py-0.5 font-medium text-foreground">
          <span className="size-2 rounded-[2px] bg-brand" />
          Relay
        </span>
        <span className="inline-flex items-center gap-1 rounded-sm bg-card px-1.5 py-0.5 text-foreground">
          <span className="size-2 rounded-[2px] bg-success-ink" />
          Spanreed
        </span>
        <span className="inline-flex items-center gap-1 rounded-sm bg-card px-1.5 py-0.5 text-muted-foreground">
          <span className="size-2 rounded-[2px] bg-muted-foreground/50" />
          Syl
        </span>
      </div>
      <div className="flex justify-center gap-2 font-mono text-[9px] text-muted-foreground">
        <span className="text-brand-ink">Only</span>
        <span>·</span>
        <span>Reset</span>
      </div>
    </div>
  ),

  "file-size": () => (
    <div className="flex items-baseline gap-2.5 font-mono tabular-nums">
      <span className="text-sm font-medium text-foreground">42.8 MB</span>
      <span className="text-[11px] text-muted-foreground">1.5 kB</span>
    </div>
  ),

  /* ------------------------------------------------------------- Patterns */
  "workspace-shell": () => (
    <div className="grid h-20 w-full max-w-[14rem] grid-rows-[1.25rem_1fr] overflow-hidden rounded-lg bg-card">
      <div className="flex items-center justify-between border-b border-border/50 bg-sidebar px-2">
        <span className="size-2 rounded-full bg-brand" />
        <span className="h-1.5 w-10 rounded-xs bg-muted-foreground/35" />
      </div>
      <div className="grid grid-cols-[2.75rem_1fr]">
        <div className="grid content-start gap-1 bg-sidebar p-1.5">
          <span className="h-1.5 w-6 rounded-xs bg-brand-ink/70" />
          <span className="h-1.5 w-5 rounded-xs bg-muted-foreground/30" />
        </div>
        <div className="grid grid-cols-2 gap-1.5 p-1.5">
          <span className="rounded-xs bg-muted/70" />
          <span className="rounded-xs bg-muted/70" />
        </div>
      </div>
    </div>
  ),

  "page-header": () => (
    <div className="flex w-full max-w-[14.5rem] items-end justify-between gap-2 text-left">
      <div className="grid gap-0.5">
        <span className="font-mono text-[9px] text-muted-foreground">Last 14 days</span>
        <span className="font-display text-base font-semibold leading-tight text-foreground">Usage &amp; quotas</span>
        <span className="text-[10px] text-muted-foreground">Live relay traffic.</span>
      </div>
      <Button size="xs">New key</Button>
    </div>
  ),

  "section-header": () => (
    <div className="grid w-full max-w-[14rem] gap-1.5 text-left">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-foreground">Recent activity</span>
        <span className="rounded-xs bg-muted px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground">12</span>
      </div>
      <div className="h-px w-full bg-border/70" />
    </div>
  ),

  "collection-toolbar": () => (
    <div className="flex w-full max-w-[14.5rem] items-center gap-1.5 rounded-lg bg-card p-1.5 text-[10px]">
      <span className="flex flex-1 items-center gap-1 rounded-sm bg-background px-1.5 py-1 text-muted-foreground">
        <Search size={10} />
        <span>Filter…</span>
      </span>
      <span className="inline-flex items-center gap-0.5 rounded-sm bg-brand-soft px-1.5 py-1 text-brand-ink">
        Live <X size={9} />
      </span>
      <span className="rounded-sm bg-primary px-1.5 py-1 font-medium text-primary-foreground">New</span>
    </div>
  ),

  "bulk-actions": () => (
    <div className="flex w-full max-w-[14.5rem] items-center justify-between gap-2 rounded-lg border border-border bg-popover px-2.5 py-1.5 text-[10px] shadow-sm">
      <span className="font-mono font-medium text-brand-ink">3 selected</span>
      <div className="flex items-center gap-1">
        <span className="rounded-xs bg-muted px-1.5 py-0.5 text-foreground">Archive</span>
        <span className="rounded-xs bg-destructive px-1.5 py-0.5 text-background">Delete</span>
        <X size={10} className="text-muted-foreground" />
      </div>
    </div>
  ),

  "state-panel": () => (
    <div className="flex w-full max-w-[14rem] items-center justify-between gap-2 rounded-xl bg-card p-2.5 text-left">
      <div className="flex items-start gap-2">
        <Bell size={13} className="mt-0.5 shrink-0 text-muted-foreground" />
        <div className="grid gap-0.5">
          <span className="text-[11px] font-medium text-foreground">No alerts yet</span>
          <span className="text-[10px] text-muted-foreground">Add a rule to monitor.</span>
        </div>
      </div>
      <Button size="xs" variant="outline">
        Add
      </Button>
    </div>
  ),

  "state-page": () => (
    <div className="flex h-20 w-full max-w-[13.5rem] flex-col items-center justify-center gap-1 rounded-lg bg-card p-2 text-center">
      <span className="font-mono text-base font-semibold leading-none text-foreground">404</span>
      <span className="text-[10px] text-muted-foreground">Page not found</span>
      <span className="mt-0.5 rounded-sm bg-secondary px-2 py-0.5 text-[9px] font-medium text-foreground">Go home</span>
    </div>
  ),

  "settings-section": () => (
    <div className="grid w-full max-w-[14rem] grid-cols-[1fr_auto] items-center gap-3 text-left">
      <div>
        <div className="text-xs font-medium text-foreground">Daily digest</div>
        <div className="text-[10px] text-muted-foreground">Summary at 08:00 UTC</div>
      </div>
      <Switch checked readOnly aria-label="Daily digest" />
    </div>
  ),

  "suggestion-card": () => (
    <div className="flex w-full max-w-[14rem] items-start gap-2 rounded-lg bg-card px-2.5 py-2 text-left">
      <Sparkles size={13} className="mt-0.5 shrink-0 text-brand-ink" />
      <div>
        <div className="text-[11px] font-medium text-foreground">Inspect token spend</div>
        <div className="text-[10px] text-muted-foreground">Last 24 hours by model</div>
      </div>
    </div>
  ),

  item: () => (
    <div className="flex w-full max-w-[14rem] items-center justify-between gap-2 rounded-lg bg-card px-2.5 py-2 text-left">
      <div className="flex items-center gap-2">
        <span className="size-1.5 shrink-0 rounded-full bg-brand-ink" />
        <div>
          <div className="text-[11px] font-semibold text-foreground">Key rotation alert</div>
          <div className="font-mono text-[9px] text-muted-foreground">station-relay · 2m</div>
        </div>
      </div>
      <ChevronRight size={12} className="text-muted-foreground" />
    </div>
  ),

  "app-header": () => (
    <div className="flex w-full max-w-[14.5rem] items-center justify-between gap-2 rounded-lg bg-card px-2.5 py-2">
      <div className="flex items-center gap-2 text-[10px]">
        <span className="size-2.5 rounded-full bg-brand" />
        <span className="font-medium text-foreground">Relay</span>
        <span className="text-muted-foreground">Keys</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Kbd>⌘K</Kbd>
        <Avatar size="sm">
          <AvatarFallback>KS</AvatarFallback>
        </Avatar>
      </div>
    </div>
  ),

  "site-header": () => (
    <div className="flex w-full max-w-[14.5rem] items-center justify-between gap-2 rounded-lg bg-card px-2.5 py-2 text-[10px]">
      <span className="font-display text-xs font-semibold text-foreground">Fabrials</span>
      <div className="flex items-center gap-2 text-muted-foreground">
        <span>Docs</span>
        <span>News</span>
        <span className="rounded-sm bg-primary px-1.5 py-0.5 font-medium text-primary-foreground">Sign in</span>
      </div>
    </div>
  ),

  "auth-layout": () => (
    <div className="grid h-20 w-full max-w-[13.5rem] grid-cols-[1fr_4rem] overflow-hidden rounded-lg bg-card text-left">
      <div className="grid content-center gap-1.5 p-2.5">
        <span className="text-[10px] font-semibold text-foreground">Sign in</span>
        <span className="h-3.5 rounded-xs bg-background" />
        <span className="h-3.5 w-14 rounded-xs bg-primary" />
      </div>
      <div className="bg-brand-soft/80" />
    </div>
  ),

  "inline-confirm": () => (
    <div className="flex w-full max-w-[14rem] items-center justify-between gap-2 rounded-lg bg-card px-2.5 py-2 text-[11px]">
      <span className="font-medium text-foreground">Delete key?</span>
      <div className="flex items-center gap-1">
        <Button size="xs" variant="ghost">
          No
        </Button>
        <Button size="xs" variant="destructive">
          Yes
        </Button>
      </div>
    </div>
  ),

  countdown: () => (
    <div className="grid gap-0.5 text-center">
      <span className="text-[10px] text-muted-foreground">Quota resets in</span>
      <span className="font-mono text-sm font-semibold tabular-nums text-foreground">02d : 14h : 38m</span>
    </div>
  ),

  "action-bar": () => (
    <div className="grid w-full max-w-[14rem] overflow-hidden rounded-lg bg-card">
      <div className="grid gap-1 px-2.5 py-1.5 opacity-40">
        <span className="h-1.5 w-24 rounded-xs bg-muted-foreground" />
        <span className="h-1.5 w-16 rounded-xs bg-muted-foreground" />
      </div>
      <div className="flex items-center justify-between border-t border-border/60 bg-background/60 px-2.5 py-1.5">
        <Button size="xs" variant="ghost">
          Back
        </Button>
        <Button size="xs">Continue</Button>
      </div>
    </div>
  ),

  /* -------------------------------------------------------- Documentation */
  "code-panel": () => (
    <div className="w-full max-w-[14rem] overflow-hidden rounded-lg bg-card text-left font-mono text-[10px]">
      <div className="flex items-center justify-between border-b border-border/50 px-2.5 py-1 text-muted-foreground">
        <span>tokens.css</span>
        <Copy size={11} />
      </div>
      <div className="grid gap-0.5 px-2.5 py-1.5 text-foreground">
        <div>
          <span className="mr-2 text-muted-foreground">1</span>
          <span className="text-brand-ink">--brand</span>: oklch(0.77 0.1 258);
        </div>
        <div>
          <span className="mr-2 text-muted-foreground">2</span>
          <span className="text-brand-ink">--radius</span>: 0.5rem;
        </div>
      </div>
    </div>
  ),

  "code-tabs": () => (
    <div className="w-full max-w-[14rem] overflow-hidden rounded-lg bg-card text-left font-mono text-[10px]">
      <div className="flex items-center gap-2 border-b border-border/50 px-2.5 py-1">
        <span className="border-b border-brand-ink font-medium text-foreground">TS</span>
        <span className="text-muted-foreground">CSS</span>
        <span className="text-muted-foreground">JSON</span>
      </div>
      <div className="px-2.5 py-2 text-foreground">
        <span className="text-brand-ink">export</span> const theme = &quot;dark&quot;;
      </div>
    </div>
  ),

  "package-install": () => (
    <div className="w-full max-w-[14rem] overflow-hidden rounded-lg bg-card text-left font-mono text-[10px]">
      <div className="flex items-center justify-between border-b border-border/50 px-2.5 py-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-brand-ink">bun</span>
          <span className="text-muted-foreground">pnpm</span>
          <span className="text-muted-foreground">npm</span>
        </div>
        <Copy size={10} className="text-muted-foreground" />
      </div>
      <div className="px-2.5 py-2 text-foreground">$ bun add @fabrials/ui</div>
    </div>
  ),

  files: () => (
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
  ),

  "repo-info": () => (
    <div className="flex items-center gap-2 rounded-md bg-card px-3 py-2 text-xs">
      <Globe size={13} className="text-muted-foreground" />
      <span className="font-medium text-foreground">fabrials-ui</span>
      <span className="inline-flex items-center gap-0.5 font-mono text-[10px] text-muted-foreground">
        <Star size={10} />
        1.4k
      </span>
      <Badge size="sm">MIT</Badge>
    </div>
  ),

  /* -------------------------------------------------------------- Effects */
  "moon-phase": () => <MoonPhase size={44} />,

  starfield: () => (
    <div className="relative flex h-20 w-full max-w-[13.5rem] items-center justify-center overflow-hidden rounded-lg bg-card">
      <span className="absolute left-5 top-4 size-1 rounded-full bg-foreground/60" />
      <span className="absolute left-16 top-10 size-0.5 rounded-full bg-foreground/45" />
      <span className="absolute right-10 top-5 size-1 rounded-full bg-brand-ink/80" />
      <span className="absolute bottom-5 left-12 size-0.5 rounded-full bg-foreground/50" />
      <span className="absolute bottom-6 right-14 size-1 rounded-full bg-foreground/55" />
      <span className="font-mono text-[10px] text-muted-foreground">Night sky</span>
    </div>
  ),
};
