"use client";

import type { ReactNode } from "react";
import {
  Bold,
  Calendar as CalendarIcon,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Copy,
  Italic,
  Paperclip,
  Pencil,
  Plus,
  SlidersHorizontal,
  Underline,
  Upload,
  X,
} from "lucide-react";
import {
  Button,
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
  PasswordInput,
  ProductLockup,
  RadiantGlyph,
  SearchInput,
  Slider,
  Switch,
  ThemeSwitcher,
  Toggle,
  ToggleGroup,
  ToggleGroupItem,
} from "@fabrials/ui";
import { STORM_RAMP, gemField } from "@fabrials/ui/dither";

const NOOP = () => {};

export const brandAndControlsSpecimens: Record<string, () => ReactNode> = {
  /* ---------------------------------------------------------------- Brand */
  "corner-marks": () => (
    <CornerMarks className="w-36">
      <div className="flex h-16 items-center justify-center rounded-lg bg-card px-3 font-mono text-[11px] text-muted-foreground">
        Fig. 01 · Plate
      </div>
    </CornerMarks>
  ),

  "dither-gem": () => (
    <div className="flex items-center gap-4">
      <DitherGem gem="stormlight" size={28} />
      <DitherGem gem="zircon" size={34} />
      <DitherGem gem="ruby" size={28} />
      <DitherGem gem="emerald" size={24} />
    </div>
  ),

  "dither-band": () => (
    <div className="w-full max-w-[14rem] overflow-hidden rounded-lg bg-card [--fui-dither-bg:var(--card)]">
      <DitherBand seed={19} cell={3} />
      <div className="px-3 py-2 font-mono text-[11px] text-muted-foreground">Highstorm band</div>
    </div>
  ),

  "dither-scene": () => (
    <div className="relative isolate h-24 w-full max-w-[14rem] overflow-hidden rounded-lg bg-card [--fui-dither-bg:var(--card)]">
      <DitherScene variant="full" reveal={0} cell={3} seed={7} />
    </div>
  ),

  "dither-canvas": () => (
    <div className="relative isolate h-24 w-full max-w-[14rem] overflow-hidden rounded-lg bg-card [--fui-dither-bg:var(--card)]">
      <DitherCanvas
        ramp={STORM_RAMP}
        field={(_theme, { width, height }) => gemField(width, height)}
        cell={3}
        paintKey={1}
      />
    </div>
  ),

  "radiant-glyph": () => (
    <div className="flex items-center gap-3.5">
      <RadiantGlyph order="windrunner" size={32} colored />
      <RadiantGlyph order="elsecaller" size={36} colored />
      <RadiantGlyph order="lightweaver" size={32} colored />
      <RadiantGlyph order="bondsmith" size={28} colored />
    </div>
  ),

  "grid-guides": () => (
    <div className="relative h-24 w-full max-w-[14rem] overflow-hidden rounded-lg bg-card">
      <GridGuides columns={6} />
      <div className="relative z-10 flex h-full items-end p-2.5 font-mono text-[11px] text-muted-foreground">
        12-column canvas
      </div>
    </div>
  ),

  "product-lockup": () => <ProductLockup product="Spanreed" gem="ruby" size="sm" />,

  /* ------------------------------------------------------------- Controls */
  button: () => (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <Button size="sm">Create key</Button>
      <Button size="sm" variant="accent">
        Deploy
      </Button>
      <Button size="sm" variant="outline">
        Cancel
      </Button>
    </div>
  ),

  "icon-button": () => (
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
  ),

  input: () => (
    <div className="w-full max-w-[13.5rem]">
      <Input readOnly value="station-relay" aria-label="Key name" />
    </div>
  ),

  textarea: () => (
    <div className="w-full max-w-[13.5rem] rounded-md bg-card p-2.5 text-left text-xs text-muted-foreground">
      <div>Explain the latency spike on node eu-west-2…</div>
      <div className="mt-2 flex justify-end font-mono text-[10px]">44 / 280</div>
    </div>
  ),

  "search-input": () => (
    <div className="w-full max-w-[13.5rem]">
      <SearchInput size="sm" readOnly value="" placeholder="Search keys…" shortcut={<Kbd>/</Kbd>} aria-label="Search" />
    </div>
  ),

  "password-input": () => (
    <div className="w-full max-w-[13.5rem]">
      <PasswordInput size="sm" readOnly value="stormlight-key" aria-label="Password" />
    </div>
  ),

  "number-field": () => (
    <div className="inline-flex items-center gap-2 rounded-md bg-card px-2.5 py-1.5 font-mono text-xs text-foreground">
      <span className="text-muted-foreground">−</span>
      <span className="px-2 font-medium tabular-nums">120</span>
      <span className="text-muted-foreground">ms</span>
      <span className="text-muted-foreground">+</span>
    </div>
  ),

  slider: () => (
    <div className="w-full max-w-[13.5rem]">
      <Slider label="Rate" unit="req/s" min={0} max={200} value={140} onValueChange={NOOP} showValue />
    </div>
  ),

  checkbox: () => (
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
  ),

  switch: () => (
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
  ),

  toggle: () => (
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
  ),

  "toggle-group": () => (
    <ToggleGroup size="sm" value={["14d"]} aria-label="Window">
      <ToggleGroupItem value="7d">7d</ToggleGroupItem>
      <ToggleGroupItem value="14d">14d</ToggleGroupItem>
      <ToggleGroupItem value="30d">30d</ToggleGroupItem>
    </ToggleGroup>
  ),

  "theme-switcher": () => <ThemeSwitcher value="dark" onValueChange={NOOP} />,

  "filter-chip": () => (
    <div className="flex flex-wrap items-center justify-center gap-1.5">
      <FilterChip label="Status" value="Active" onRemove={NOOP} />
      <FilterChip label="Region" value="EU" onRemove={NOOP} />
    </div>
  ),

  select: () => (
    <div className="grid w-full max-w-[13rem] gap-1">
      <div className="flex items-center justify-between rounded-md bg-card px-2.5 py-1.5 text-xs text-foreground">
        <span>stormfather-2</span>
        <ChevronDown size={12} className="text-muted-foreground" />
      </div>
      <div className="grid gap-0.5 rounded-md border border-border bg-popover p-1 text-[11px] shadow-xs">
        <div className="flex items-center justify-between rounded-xs bg-accent px-2 py-0.5 text-foreground">
          <span>stormfather-2</span>
          <Check size={11} className="text-brand-ink" />
        </div>
        <div className="px-2 py-0.5 text-muted-foreground">claude-fable-5</div>
      </div>
    </div>
  ),

  "native-select": () => (
    <div className="grid w-full max-w-[13rem] gap-1.5 text-left">
      <div className="flex items-center justify-between font-mono text-[10px] text-muted-foreground">
        <span>Region</span>
        <span className="rounded-xs bg-muted px-1.5 py-0.5 text-[9px] text-foreground">native</span>
      </div>
      <div className="flex items-center justify-between rounded-md border border-border bg-card px-2.5 py-1.5 text-xs text-foreground">
        <span>Europe (Frankfurt)</span>
        <ChevronsUpDown size={13} className="text-muted-foreground" />
      </div>
    </div>
  ),

  "multi-select": () => (
    <div className="grid w-full max-w-[13.5rem] gap-1">
      <div className="flex items-center justify-between gap-1 rounded-md bg-card px-2 py-1 text-[10px]">
        <div className="flex items-center gap-1 overflow-hidden">
          <span className="inline-flex items-center gap-0.5 rounded-xs bg-brand-soft px-1.5 py-0.5 font-medium text-brand-ink">
            Anthropic <X size={9} />
          </span>
          <span className="inline-flex items-center gap-0.5 rounded-xs bg-brand-soft px-1.5 py-0.5 font-medium text-brand-ink">
            xAI <X size={9} />
          </span>
          <span className="font-mono text-muted-foreground">+2</span>
        </div>
        <ChevronDown size={11} className="shrink-0 text-muted-foreground" />
      </div>
      <div className="grid gap-0.5 rounded-md border border-border bg-popover p-1 text-[10px] shadow-xs">
        <div className="flex items-center gap-1.5 rounded-xs bg-accent px-1.5 py-0.5 text-foreground">
          <span className="inline-flex size-3 items-center justify-center rounded-xs bg-brand text-brand-foreground">
            <Check size={8} />
          </span>
          <span>Anthropic</span>
        </div>
        <div className="flex items-center gap-1.5 px-1.5 py-0.5 text-muted-foreground">
          <span className="inline-flex size-3 rounded-xs bg-muted" />
          <span>OpenAI</span>
        </div>
      </div>
    </div>
  ),

  "radio-group": () => (
    <div className="grid gap-1.5 text-left text-xs">
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
      <div className="flex items-center gap-2 text-muted-foreground">
        <span className="inline-flex size-3.5 rounded-full bg-muted" />
        <span>Cost cap</span>
      </div>
    </div>
  ),

  "native-radio": () => (
    <div className="grid w-full max-w-[13.5rem] gap-1.5 text-left">
      <div className="flex items-center justify-between font-mono text-[10px] text-muted-foreground">
        <span>Region</span>
        <span className="rounded-xs bg-muted px-1.5 py-0.5 text-[9px] text-foreground">native</span>
      </div>
      <div className="flex items-center gap-3 rounded-md bg-card px-2.5 py-2 text-xs">
        <span className="flex items-center gap-1.5 font-medium text-foreground">
          <span className="inline-flex size-3.5 items-center justify-center rounded-full border border-brand-ink">
            <span className="size-1.5 rounded-full bg-brand-ink" />
          </span>
          EU
        </span>
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <span className="inline-flex size-3.5 rounded-full border border-border" />
          US
        </span>
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <span className="inline-flex size-3.5 rounded-full border border-border" />
          AP
        </span>
      </div>
    </div>
  ),

  "choice-group": () => (
    <div className="grid w-full max-w-[14rem] grid-cols-2 gap-1.5 text-left">
      <div className="rounded-lg bg-brand-soft p-2 ring-1 ring-brand-ink/40">
        <div className="flex items-center justify-between text-[11px] font-medium text-foreground">
          <span>Standard</span>
          <Check size={11} className="text-brand-ink" />
        </div>
        <div className="mt-0.5 text-[10px] text-muted-foreground">Auto fallback</div>
      </div>
      <div className="rounded-lg bg-card p-2">
        <div className="text-[11px] font-medium text-foreground">Priority</div>
        <div className="mt-0.5 text-[10px] text-muted-foreground">Dedicated pool</div>
      </div>
    </div>
  ),

  "input-otp": () => (
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
  ),

  calendar: () => (
    <div className="grid w-full max-w-[13.5rem] gap-1 rounded-lg bg-card px-2.5 py-2 font-mono text-[9px]">
      <div className="flex items-center justify-between text-[10px] text-foreground">
        <ChevronLeft size={11} className="text-muted-foreground" />
        <span className="font-sans font-medium">Nov 2026</span>
        <ChevronRight size={11} className="text-muted-foreground" />
      </div>
      <div className="grid grid-cols-7 text-center text-[8px] text-muted-foreground">
        {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-0.5 text-center tabular-nums">
        {[9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22].map((day) => (
          <span
            key={day}
            className={`relative mx-auto inline-flex size-4 items-center justify-center rounded-xs ${
              day === 14 ? "bg-brand font-semibold text-brand-foreground" : "text-foreground"
            }`}
          >
            {day}
            {day === 10 && <span className="absolute bottom-0 size-1 rounded-full bg-brand-ink" />}
          </span>
        ))}
      </div>
    </div>
  ),

  "date-picker": () => (
    <div className="grid w-full max-w-[13.5rem] gap-1 text-left">
      <div className="flex items-center justify-between rounded-md bg-card px-2.5 py-1.5 text-[11px] text-foreground">
        <span className="flex items-center gap-1.5">
          <CalendarIcon size={12} className="text-brand-ink" />
          <span className="font-medium tabular-nums">Nov 14, 2026</span>
        </span>
        <ChevronDown size={11} className="text-muted-foreground" />
      </div>
      <div className="grid gap-1 rounded-md border border-border bg-popover p-1.5 font-mono text-[9px] shadow-sm">
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Nov 2026</span>
          <span>Mo–Su</span>
        </div>
        <div className="grid grid-cols-7 gap-0.5 text-center tabular-nums">
          {[11, 12, 13, 14, 15, 16, 17].map((day) => (
            <span
              key={day}
              className={`rounded-xs py-0.5 ${
                day === 14 ? "bg-brand font-semibold text-brand-foreground" : "text-foreground"
              }`}
            >
              {day}
            </span>
          ))}
        </div>
      </div>
    </div>
  ),

  dropzone: () => (
    <div className="flex w-full max-w-[13rem] flex-col items-center gap-1.5 rounded-lg border border-dashed border-border bg-card/70 px-3 py-3 text-center">
      <Upload size={14} className="text-muted-foreground" />
      <span className="text-[11px] font-medium text-foreground">Drop files here</span>
      <span className="font-mono text-[10px] text-muted-foreground">CSV · JSON · PNG</span>
    </div>
  ),

  "file-input": () => (
    <div className="flex w-full max-w-[14rem] items-center gap-2 rounded-lg bg-card p-2 text-xs">
      <span className="shrink-0 rounded-md bg-secondary px-2 py-1 text-[11px] font-medium text-foreground">
        Choose file
      </span>
      <span className="flex min-w-0 flex-1 items-center gap-1 truncate font-mono text-[10px] text-muted-foreground">
        <Paperclip size={11} className="shrink-0" />
        <span className="truncate text-foreground">metrics.csv</span>
      </span>
      <X size={11} className="shrink-0 text-muted-foreground" />
    </div>
  ),

  "drop-overlay": () => (
    <div className="relative flex h-20 w-full max-w-[13.5rem] items-center justify-center overflow-hidden rounded-lg bg-card p-2">
      <div className="grid w-full gap-1.5 opacity-25">
        <span className="h-2 w-20 rounded-xs bg-foreground" />
        <span className="h-2 w-32 rounded-xs bg-muted-foreground" />
        <span className="h-2 w-24 rounded-xs bg-muted-foreground" />
      </div>
      <div className="absolute inset-1 flex flex-col items-center justify-center gap-1 rounded-md border border-dashed border-brand-ink/70 bg-background/85 backdrop-blur-[1px]">
        <Upload size={13} className="text-brand-ink" />
        <span className="text-[10px] font-medium text-foreground">Drop to attach</span>
      </div>
    </div>
  ),

  field: () => (
    <div className="grid w-full max-w-[13rem] gap-1 text-left">
      <span className="text-[11px] font-medium text-foreground">Workspace slug</span>
      <div className="rounded-md bg-card px-2.5 py-1.5 font-mono text-xs text-foreground">urithiru</div>
      <span className="text-[10px] text-muted-foreground">Lowercase letters and hyphens.</span>
    </div>
  ),

  "field-parts": () => (
    <div className="grid w-full max-w-[13.5rem] gap-1 text-left">
      <div className="flex items-center justify-between text-[11px]">
        <span className="font-medium text-foreground">
          Key prefix <span className="text-destructive">*</span>
        </span>
        <span className="font-mono text-[9px] text-muted-foreground">parts</span>
      </div>
      <div className="rounded-md bg-card px-2.5 py-1 font-mono text-xs text-foreground ring-1 ring-destructive/70">
        9bad-prefix
      </div>
      <span className="text-[10px] text-destructive">Must start with a letter.</span>
    </div>
  ),

  "field-set": () => (
    <div className="grid w-full max-w-[13.5rem] gap-1.5 border-t border-border/70 pt-1.5 text-left">
      <span className="text-[11px] font-semibold text-foreground">API limits</span>
      <div className="grid grid-cols-2 gap-1.5">
        <div className="rounded-md bg-card px-2 py-1">
          <div className="text-[9px] text-muted-foreground">Rate</div>
          <div className="font-mono text-[11px] text-foreground">120/m</div>
        </div>
        <div className="rounded-md bg-card px-2 py-1">
          <div className="text-[9px] text-muted-foreground">Burst</div>
          <div className="font-mono text-[11px] text-foreground">40</div>
        </div>
      </div>
    </div>
  ),

  label: () => (
    <div className="grid w-full max-w-[13rem] gap-1.5 text-left">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-medium text-foreground">Display name</span>
        <span className="font-mono text-[10px] text-muted-foreground">(optional)</span>
      </div>
      <div className="rounded-md bg-card px-2.5 py-1.5 text-xs text-muted-foreground ring-2 ring-brand-ink/70">
        Bridge Four
      </div>
    </div>
  ),

  toolbar: () => (
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
  ),

  "editable-text": () => (
    <div className="flex items-center gap-2 rounded-md bg-card px-3 py-1.5 text-xs">
      <span className="font-medium text-foreground">Q4 Relay Budget</span>
      <span className="h-3.5 w-0.5 bg-brand-ink" />
      <Pencil size={11} className="text-muted-foreground" />
    </div>
  ),

  "on-screen-keyboard": () => (
    <div className="grid gap-1 font-mono text-[10px]">
      <div className="flex justify-center gap-1">
        {["Q", "W", "E", "R", "T", "Y"].map((key) => (
          <Kbd key={key}>{key}</Kbd>
        ))}
      </div>
      <div className="flex justify-center gap-1">
        {["A", "S", "D", "F", "⌫"].map((key) => (
          <Kbd key={key}>{key}</Kbd>
        ))}
      </div>
    </div>
  ),
};
