"use client";

import type { ReactNode } from "react";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Copy,
  GripVertical,
  Pause,
  Play,
  Search,
  Square,
  Volume2,
  X,
} from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  ButtonGroup,
  Kbd,
  KbdGroup,
  ShimmerText,
  Spinner,
  StatusDot,
  Tabs,
  TabsList,
  TabsTrigger,
} from "@fabrials/ui";

export const navigationAndCompositionSpecimens: Record<string, () => ReactNode> = {
  /* ----------------------------------------------------------- Navigation */
  kbd: () => (
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
  ),

  breadcrumb: () => (
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
  ),

  pagination: () => (
    <div className="flex items-center gap-1 font-mono text-xs">
      <span className="rounded-sm px-2 py-1 text-muted-foreground">1</span>
      <span className="rounded-sm bg-card px-2 py-1 font-medium text-brand-ink">2</span>
      <span className="rounded-sm px-2 py-1 text-muted-foreground">3</span>
      <span className="px-1 text-muted-foreground">…</span>
      <span className="rounded-sm px-2 py-1 text-muted-foreground">9</span>
    </div>
  ),

  "nav-tabs": () => (
    <Tabs value="general">
      <TabsList variant="underline" aria-label="Record sections">
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="members">Members</TabsTrigger>
        <TabsTrigger value="billing">Billing</TabsTrigger>
      </TabsList>
    </Tabs>
  ),

  command: () => (
    <div className="grid w-full max-w-[14rem] overflow-hidden rounded-lg border border-border bg-popover text-left shadow-sm">
      <div className="flex items-center gap-1.5 border-b border-border/60 px-2.5 py-1.5 text-[11px] text-muted-foreground">
        <Search size={11} />
        <span>Jump to…</span>
      </div>
      <div className="grid gap-0.5 p-1 text-[10px]">
        <div className="flex items-center justify-between rounded-xs bg-accent px-2 py-0.5 text-foreground">
          <span>Design tokens</span>
          <Kbd>⌘T</Kbd>
        </div>
        <div className="flex items-center justify-between px-2 py-0.5 text-muted-foreground">
          <span>Relay keys</span>
          <Kbd>⌘K</Kbd>
        </div>
      </div>
    </div>
  ),

  "command-trigger": () => (
    <div className="flex w-full max-w-[13rem] items-center justify-between gap-2 rounded-lg bg-card px-3 py-2 text-xs text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <Search size={12} />
        <span>Search…</span>
      </span>
      <Kbd>⌘K</Kbd>
    </div>
  ),

  sidebar: () => (
    <div className="grid h-20 w-full max-w-[13.5rem] grid-cols-[4.5rem_1fr] overflow-hidden rounded-lg bg-card text-left">
      <div className="grid content-start gap-1 bg-sidebar p-2 text-[9px]">
        <span className="border-s-2 border-brand-ink pl-1.5 font-medium text-foreground">Overview</span>
        <span className="pl-2 text-muted-foreground">Keys</span>
        <span className="pl-2 text-muted-foreground">Logs</span>
      </div>
      <div className="grid content-start gap-1.5 p-2">
        <span className="h-2 w-14 rounded-xs bg-foreground/25" />
        <span className="h-9 rounded-sm bg-muted/70" />
      </div>
    </div>
  ),

  "side-panel": () => (
    <div className="grid h-20 w-full max-w-[13.5rem] grid-cols-[1fr_5.25rem] overflow-hidden rounded-lg bg-muted/50 text-left">
      <div className="grid content-start gap-1.5 p-2 opacity-50">
        <span className="h-2 w-14 rounded-xs bg-foreground/40" />
        <span className="h-2 w-12 rounded-xs bg-muted-foreground/40" />
        <span className="h-2 w-16 rounded-xs bg-muted-foreground/40" />
      </div>
      <div className="grid content-start gap-1 border-s border-border bg-card p-2">
        <div className="flex items-center justify-between text-[9px] font-medium text-foreground">
          <span>Inspector</span>
          <X size={9} className="text-muted-foreground" />
        </div>
        <span className="h-1.5 w-12 rounded-xs bg-muted-foreground/40" />
        <span className="h-6 rounded-xs bg-muted/70" />
      </div>
    </div>
  ),

  "sidebar-account": () => (
    <div className="flex w-full max-w-[13.5rem] items-center justify-between gap-2 rounded-lg bg-sidebar px-2.5 py-2 text-left">
      <div className="flex items-center gap-2">
        <Avatar size="sm">
          <AvatarFallback>KS</AvatarFallback>
        </Avatar>
        <div>
          <div className="text-xs font-medium text-foreground">Kaladin</div>
          <div className="font-mono text-[9px] text-muted-foreground">Admin</div>
        </div>
      </div>
      <ChevronsUpDown size={12} className="text-muted-foreground" />
    </div>
  ),

  resizable: () => (
    <div className="flex h-20 w-full max-w-[13.5rem] items-stretch overflow-hidden rounded-lg bg-card font-mono text-[10px]">
      <div className="flex w-[38%] items-center justify-center bg-muted/40 text-muted-foreground">38%</div>
      <div className="flex w-3.5 items-center justify-center bg-border/60 text-muted-foreground">
        <GripVertical size={11} />
      </div>
      <div className="flex flex-1 items-center justify-center text-foreground">62%</div>
    </div>
  ),

  "navigation-menu": () => (
    <div className="grid w-full max-w-[14rem] gap-1 text-left">
      <div className="flex items-center gap-3 px-1 text-[10px]">
        <span className="text-muted-foreground">Docs</span>
        <span className="inline-flex items-center gap-0.5 font-medium text-brand-ink">
          Blocks <ChevronDown size={9} />
        </span>
        <span className="text-muted-foreground">Tokens</span>
      </div>
      <div className="grid grid-cols-2 gap-1 rounded-md border border-border bg-popover p-1.5 text-[9px] shadow-xs">
        <div className="rounded-xs bg-accent px-1.5 py-1 text-foreground">WebMCP</div>
        <div className="px-1.5 py-1 text-muted-foreground">MCP Console</div>
      </div>
    </div>
  ),

  "nav-switcher": () => (
    <div className="grid w-full max-w-[13rem] gap-1 text-left">
      <div className="flex items-center justify-between rounded-md bg-card px-2.5 py-1 text-[11px] font-medium text-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-brand" />
          <span>Spanreed</span>
        </span>
        <ChevronsUpDown size={11} className="text-muted-foreground" />
      </div>
      <div className="grid gap-0.5 rounded-md border border-border bg-popover p-1 text-[10px] shadow-xs">
        <div className="flex items-center justify-between rounded-xs bg-accent px-2 py-0.5 text-foreground">
          <span>Spanreed</span>
          <Check size={10} className="text-brand-ink" />
        </div>
        <div className="px-2 py-0.5 text-muted-foreground">Radiant</div>
      </div>
    </div>
  ),

  /* ---------------------------------------------------------- Composition */
  "avatar-group": () => (
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
  ),

  image: () => (
    <div className="relative flex h-20 w-full max-w-[13.5rem] items-end justify-between overflow-hidden rounded-lg bg-card p-2">
      <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-brand-soft/80 to-transparent" />
      <span className="relative z-10 font-mono text-[9px] text-muted-foreground">horizon.avif</span>
      <span className="relative z-10 rounded-xs bg-background/80 px-1.5 py-0.5 font-mono text-[9px] text-foreground">
        16:9
      </span>
    </div>
  ),

  "media-grid": () => (
    <div className="grid h-20 w-full max-w-[13rem] grid-cols-2 grid-rows-2 gap-1">
      <span className="rounded-sm bg-card" />
      <span className="rounded-sm bg-brand-soft/70" />
      <span className="rounded-sm bg-muted" />
      <span className="flex items-center justify-center rounded-sm bg-foreground/85 font-mono text-[11px] font-semibold text-background">
        +3
      </span>
    </div>
  ),

  "animated-image": () => (
    <div className="relative flex h-20 w-full max-w-[13.5rem] items-center justify-center overflow-hidden rounded-lg bg-card">
      <div className="flex items-center gap-1">
        {[10, 18, 14, 22, 12].map((h, i) => (
          <span key={i} style={{ height: `${h}px` }} className="w-1.5 rounded-xs bg-muted-foreground/45" />
        ))}
      </div>
      <span className="absolute bottom-1.5 right-1.5 inline-flex items-center gap-1 rounded-sm bg-foreground px-1.5 py-0.5 font-mono text-[9px] text-background">
        <Pause size={8} />
        GIF
      </span>
    </div>
  ),

  direction: () => (
    <div className="grid w-full max-w-[13.5rem] gap-1.5 text-[11px]">
      <div className="flex items-center justify-between rounded-md bg-card px-2.5 py-1 text-foreground">
        <span className="font-mono text-[9px] text-muted-foreground">LTR</span>
        <span>Start to end</span>
      </div>
      <div dir="rtl" className="flex items-center justify-between rounded-md bg-brand-soft px-2.5 py-1 text-foreground">
        <span className="font-mono text-[9px] text-brand-ink">RTL</span>
        <span>من البداية</span>
      </div>
    </div>
  ),

  carousel: () => (
    <div className="grid w-full max-w-[14rem] gap-1.5">
      <div className="flex items-center gap-1.5">
        <div className="h-11 w-6 shrink-0 rounded-md bg-muted/60" />
        <div className="flex h-11 flex-1 items-center justify-center rounded-md bg-card font-mono text-[10px] text-foreground ring-1 ring-brand-ink/40">
          Slide 2
        </div>
        <div className="h-11 w-6 shrink-0 rounded-md bg-muted/60" />
      </div>
      <div className="flex items-center justify-center gap-1.5 text-muted-foreground">
        <ChevronLeft size={10} />
        <span className="size-1.5 rounded-full bg-muted-foreground/40" />
        <span className="size-1.5 rounded-full bg-brand-ink" />
        <span className="size-1.5 rounded-full bg-muted-foreground/40" />
        <ChevronRight size={10} />
      </div>
    </div>
  ),

  spinner: () => (
    <div className="flex items-center gap-4">
      <Spinner label="Loading" />
      <Spinner variant="dots" label="Working" />
      <Spinner variant="grid" label="Computing" />
    </div>
  ),

  "shimmer-text": () => <ShimmerText tone="light">Synthesizing 12 sources</ShimmerText>,

  "scramble-text": () => (
    <div className="rounded-md bg-card px-3 py-1.5 font-mono text-xs text-foreground">
      Calibrat<span className="text-brand-ink">1</span>ng r<span className="text-brand-ink">3</span>lay…
    </div>
  ),

  snippet: () => (
    <div className="flex w-full max-w-[13.5rem] items-center justify-between gap-2 rounded-md bg-card px-2.5 py-2 font-mono text-[11px] text-foreground">
      <span className="truncate">$ bun add @fabrials/ui</span>
      <Copy size={12} className="shrink-0 text-muted-foreground" />
    </div>
  ),

  "button-group": () => (
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
  ),

  "input-group": () => (
    <div className="flex w-full max-w-[13.5rem] items-center justify-between rounded-md bg-card px-2.5 py-1.5 font-mono text-xs">
      <span className="truncate">
        <span className="text-muted-foreground">https://</span>
        <span className="text-foreground">ui.fabrials.com</span>
      </span>
      <Copy size={11} className="shrink-0 text-muted-foreground" />
    </div>
  ),

  toaster: () => (
    <div className="flex w-full max-w-[13.5rem] items-center justify-between gap-2 rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-sm">
      <span className="flex items-center gap-2">
        <StatusDot tone="success" label="Copied" hideLabel />
        <span className="font-medium text-foreground">API key copied</span>
      </span>
      <span className="font-mono text-[10px] text-brand-ink">Undo</span>
    </div>
  ),

  "truncated-text": () => (
    <div className="grid w-full max-w-[13rem] gap-1 text-left">
      <span className="truncate text-xs text-foreground">station-relay-production-eu-west-primary-01</span>
      <span className="font-mono text-[9px] text-muted-foreground">Tooltip only when clipped</span>
    </div>
  ),

  "reveal-card": () => (
    <div className="grid w-full max-w-[13.5rem] gap-1 rounded-lg bg-card p-2 text-left">
      <div className="text-[10px] text-muted-foreground">Color space used?</div>
      <div className="rounded-sm bg-brand-soft px-2 py-0.5 text-[11px] font-medium text-foreground">OKLCH</div>
      <div className="flex gap-1 pt-0.5 font-mono text-[9px]">
        <span className="rounded-xs bg-muted px-1.5 py-0.5 text-muted-foreground">Again</span>
        <span className="rounded-xs bg-brand-soft px-1.5 py-0.5 text-brand-ink">Good</span>
        <span className="rounded-xs bg-muted px-1.5 py-0.5 text-muted-foreground">Easy</span>
      </div>
    </div>
  ),

  "step-controls": () => (
    <div className="flex items-center gap-2 rounded-lg bg-card px-2.5 py-1.5">
      <span className="inline-flex size-6 items-center justify-center rounded-sm bg-muted text-foreground">
        <ChevronLeft size={12} />
      </span>
      <span className="inline-flex size-6 items-center justify-center rounded-sm bg-primary text-primary-foreground">
        <Play size={10} />
      </span>
      <span className="inline-flex size-6 items-center justify-center rounded-sm bg-muted text-foreground">
        <ChevronRight size={12} />
      </span>
      <span className="pl-1 font-mono text-[10px] tabular-nums text-muted-foreground">3 / 8</span>
    </div>
  ),

  "marked-text": () => (
    <div className="w-full max-w-[14rem] rounded-lg bg-card px-2.5 py-2 text-left text-[11px] leading-relaxed text-foreground">
      Keep{" "}
      <span className="rounded-xs bg-brand-soft px-1 font-medium text-brand-ink">Stormlight</span> as the{" "}
      <span className="line-through opacity-50">primary</span>{" "}
      <span className="underline decoration-brand-ink underline-offset-2">interaction</span> accent.
    </div>
  ),

  "video-player": () => (
    <div className="grid w-full max-w-[13.5rem] overflow-hidden rounded-lg bg-foreground/90 text-background">
      <div className="relative flex h-12 items-center justify-center">
        <span className="inline-flex size-7 items-center justify-center rounded-full bg-background/90 text-foreground">
          <Play size={12} />
        </span>
        <span className="absolute right-1.5 top-1.5 rounded-xs bg-background/20 px-1 font-mono text-[8px]">CC</span>
      </div>
      <div className="flex items-center gap-2 bg-foreground px-2 py-1">
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-background/25">
          <div className="h-full w-2/5 bg-brand" />
        </div>
        <span className="font-mono text-[9px] tabular-nums opacity-80">01:08</span>
      </div>
    </div>
  ),

  "audio-player": () => (
    <div className="flex w-full max-w-[14rem] items-center gap-2 rounded-lg bg-card px-2.5 py-2">
      <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <Play size={10} />
      </span>
      <div className="flex flex-1 items-center gap-0.5">
        {[6, 12, 9, 15, 11, 14, 8, 12, 7, 10, 6].map((h, i) => (
          <span
            key={i}
            style={{ height: `${h}px` }}
            className={`w-1 rounded-full ${i < 5 ? "bg-brand" : "bg-muted-foreground/35"}`}
          />
        ))}
      </div>
      <span className="shrink-0 font-mono text-[9px] tabular-nums text-muted-foreground">01:14 / 03:20</span>
    </div>
  ),

  "clip-button": () => (
    <div className="inline-flex items-center gap-2 rounded-full bg-card px-3 py-1.5 text-xs font-medium text-foreground">
      <span className="inline-flex size-5 items-center justify-center rounded-full bg-brand text-brand-foreground">
        <Play size={9} />
      </span>
      <span>Play clip</span>
      <span className="font-mono text-[10px] text-muted-foreground">1.5×</span>
    </div>
  ),

  "recorder-panel": () => (
    <div className="flex w-full max-w-[14rem] items-center justify-between gap-2 rounded-lg bg-card px-2.5 py-2">
      <span className="flex items-center gap-1.5 font-mono text-[11px] tabular-nums text-foreground">
        <span className="size-2 rounded-full bg-destructive" />
        00:18
      </span>
      <div className="flex items-center gap-0.5">
        {[5, 13, 9, 16, 11, 7, 12].map((h, i) => (
          <span key={i} style={{ height: `${h}px` }} className="w-1 rounded-full bg-brand/80" />
        ))}
      </div>
      <div className="flex items-center gap-1">
        <span className="inline-flex size-5 items-center justify-center rounded-sm bg-muted text-foreground">
          <Pause size={9} />
        </span>
        <span className="inline-flex size-5 items-center justify-center rounded-sm bg-destructive text-background">
          <Square size={8} />
        </span>
      </div>
    </div>
  ),

  speech: () => (
    <div className="flex w-full max-w-[14rem] items-center justify-between gap-2 rounded-lg bg-card px-2.5 py-2">
      <span className="flex items-center gap-1.5 text-[11px] font-medium text-foreground">
        <Volume2 size={13} className="text-brand-ink" />
        <span>Voice</span>
      </span>
      <div className="flex items-center gap-0.5">
        {[6, 12, 16, 10, 14, 8].map((h, i) => (
          <span key={i} style={{ height: `${h}px` }} className="w-1 rounded-full bg-brand/80" />
        ))}
      </div>
      <span className="font-mono text-[9px] text-muted-foreground">2 / 5</span>
    </div>
  ),
};
