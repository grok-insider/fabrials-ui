"use client";

import type { ReactNode } from "react";
import {
  ArrowDown,
  ArrowRight,
  Calendar as CalendarIcon,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  FileText,
  Image as ImageIcon,
  KeyRound,
  Lock,
  Mic,
  Paperclip,
  Pause,
  RotateCcw,
  Search,
  Send,
  ShieldCheck,
  Terminal,
  Volume2,
  X,
} from "lucide-react";
import { Badge, Button, Kbd, StatusDot, WorkingLight } from "@fabrials/ui";
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

export const foundationsAiRegistrySpecimens: Record<string, () => ReactNode> = {
  /* ---------------------------------------------------------- Foundations */
  "local-time": () => (
    <div className="grid gap-1 text-center font-mono">
      <span className="text-sm font-semibold tabular-nums text-foreground">14:32 CET</span>
      <span className="rounded-full bg-card px-2 py-0.5 text-[10px] text-muted-foreground">Europe/Madrid</span>
    </div>
  ),

  hotkeys: () => (
    <div className="grid w-full max-w-[13.5rem] gap-1 rounded-lg bg-card p-2 text-left text-[10px]">
      <div className="flex items-center justify-between">
        <span className="text-foreground">Dashboard</span>
        <span className="flex items-center gap-0.5">
          <Kbd>g</Kbd>
          <Kbd>d</Kbd>
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Input-safe guard</span>
        <Badge tone="success" size="sm">
          On
        </Badge>
      </div>
    </div>
  ),

  "error-boundary": () => (
    <div className="grid h-20 w-full max-w-[14rem] grid-cols-2 gap-1.5 text-left">
      <div className="grid content-start gap-1 rounded-md bg-card p-2">
        <span className="h-1.5 w-10 rounded-xs bg-foreground/30" />
        <span className="h-8 rounded-xs bg-muted/70" />
      </div>
      <div className="flex flex-col justify-between rounded-md bg-destructive/10 p-2">
        <span className="text-[10px] font-medium text-destructive">Widget failed</span>
        <span className="inline-flex w-fit items-center gap-1 rounded-xs bg-card px-1.5 py-0.5 text-[9px] text-foreground">
          <RotateCcw size={8} /> Retry
        </span>
      </div>
    </div>
  ),

  export: () => (
    <div className="grid w-full max-w-[13.5rem] gap-1.5">
      <div className="h-8 rounded-md bg-card" />
      <div className="flex items-center justify-center gap-1 font-mono text-[10px]">
        <span className="rounded-sm bg-primary px-2 py-0.5 text-primary-foreground">PNG</span>
        <span className="rounded-sm bg-card px-2 py-0.5 text-foreground">SVG</span>
        <span className="rounded-sm bg-card px-2 py-0.5 text-muted-foreground">Copy</span>
      </div>
    </div>
  ),

  "resolved-tokens": () => (
    <div className="grid w-full max-w-[13.5rem] grid-cols-2 gap-1.5 font-mono text-[9px]">
      <div className="flex items-center gap-1.5 rounded-sm bg-card px-1.5 py-1">
        <span className="size-3 rounded-xs bg-brand" />
        <span className="text-foreground">--brand</span>
      </div>
      <div className="flex items-center gap-1.5 rounded-sm bg-card px-1.5 py-1">
        <span className="size-3 rounded-xs bg-success-ink" />
        <span className="text-foreground">--ok</span>
      </div>
      <div className="flex items-center gap-1.5 rounded-sm bg-card px-1.5 py-1">
        <span className="size-3 rounded-xs bg-foreground" />
        <span className="text-foreground">--ink</span>
      </div>
      <div className="flex items-center gap-1.5 rounded-sm bg-card px-1.5 py-1">
        <span className="size-3 rounded-xs bg-muted-foreground" />
        <span className="text-foreground">--muted</span>
      </div>
    </div>
  ),

  "foreign-text": () => (
    <div className="w-full max-w-[14rem] rounded-lg bg-card px-2.5 py-2 text-left text-[11px] text-foreground">
      <span>Quote </span>
      <span lang="ja" className="rounded-xs bg-brand-soft px-1 text-brand-ink">
        光の言葉
      </span>
      <span className="text-muted-foreground"> inline</span>
      <div className="mt-1 font-mono text-[9px] text-muted-foreground">lang=&quot;ja&quot; · isolate</div>
    </div>
  ),

  announcer: () => (
    <div className="grid w-full max-w-[13.5rem] gap-1 rounded-lg bg-card px-2.5 py-2 text-left">
      <div className="flex items-center gap-1.5 font-mono text-[9px] text-brand-ink">
        <Volume2 size={11} />
        <span>aria-live=&quot;polite&quot;</span>
      </div>
      <span className="text-[11px] text-foreground">&ldquo;3 filters applied&rdquo;</span>
    </div>
  ),

  "element-size": () => (
    <div className="relative flex h-16 w-full max-w-[13rem] items-center justify-center rounded-md border border-dashed border-brand-ink/70 bg-card/70 font-mono text-[11px] tabular-nums text-brand-ink">
      320 × 128 px
    </div>
  ),

  labels: () => (
    <div className="grid w-full max-w-[13rem] gap-1.5">
      <div className="flex justify-center gap-1 font-mono text-[10px]">
        <span className="rounded-xs bg-muted px-1.5 py-0.5 text-muted-foreground">EN</span>
        <span className="rounded-xs bg-brand-soft px-1.5 py-0.5 font-medium text-brand-ink">ES</span>
        <span className="rounded-xs bg-muted px-1.5 py-0.5 text-muted-foreground">JA</span>
      </div>
      <div className="rounded-md bg-card px-2.5 py-1 text-center text-xs font-medium text-foreground">
        Guardar cambios
      </div>
    </div>
  ),

  "theme-provider": () => (
    <div className="grid w-full max-w-[13.5rem] grid-cols-2 overflow-hidden rounded-lg font-mono text-[10px]">
      <div className="bg-background px-2.5 py-3 text-center text-foreground">light</div>
      <div className="bg-foreground px-2.5 py-3 text-center text-background">dark</div>
    </div>
  ),

  "motion-and-time": () => (
    <div className="flex items-center gap-1.5 font-mono text-[10px]">
      <span className="rounded-md bg-card px-2 py-1 text-foreground">reduce: off</span>
      <span className="inline-flex items-center gap-1 rounded-md bg-brand-soft px-2 py-1 text-brand-ink">
        <span className="size-1.5 rounded-full bg-brand-ink" />
        1000 ms
      </span>
    </div>
  ),

  "overlay-tokens": () => (
    <div className="relative flex h-20 w-full max-w-[13.5rem] items-center justify-center rounded-lg bg-muted/60">
      <div className="grid gap-1 rounded-lg border border-border bg-popover px-3 py-2 text-left font-mono text-[9px] shadow-md">
        <span className="text-foreground">--overlay-surface</span>
        <span className="text-muted-foreground">--overlay-border · shadow</span>
      </div>
    </div>
  ),

  /* ------------------------------------------------------------------- AI */
  "chat-message": () => (
    <div className="grid w-full max-w-[14rem] gap-1 text-left">
      <ChatMessage from="assistant" className="!text-xs">
        Tokens calibrated across surfaces.
      </ChatMessage>
      <div className="flex items-center gap-2 px-1 text-muted-foreground">
        <Copy size={10} />
        <RotateCcw size={10} />
        <span className="font-mono text-[9px]">14:32</span>
      </div>
    </div>
  ),

  conversation: () => (
    <div className="relative grid w-full max-w-[14rem] gap-1 text-left text-[10px]">
      <div className="ml-auto rounded-lg bg-primary px-2 py-1 text-primary-foreground">Check EU latency</div>
      <div className="mr-4 rounded-lg bg-card px-2 py-1 text-foreground">p95 is 32 ms across 3 nodes.</div>
      <span className="mx-auto inline-flex items-center gap-1 rounded-full border border-border bg-popover px-2 py-0.5 font-mono text-[9px] text-muted-foreground shadow-xs">
        <ArrowDown size={9} /> Latest
      </span>
    </div>
  ),

  "editable-message": () => (
    <div className="grid w-full max-w-[14rem] gap-1.5 rounded-lg bg-card p-2 text-left ring-1 ring-brand-ink/50">
      <div className="text-[11px] text-foreground">Compare p95 latency for eu-west</div>
      <div className="flex justify-end gap-1">
        <Button size="xs" variant="ghost">
          Cancel
        </Button>
        <Button size="xs">Save</Button>
      </div>
    </div>
  ),

  "chat-composer": () => (
    <div className="grid w-full max-w-[14rem] gap-1.5 rounded-lg bg-card p-2 text-left text-xs">
      <span className="text-[11px] text-muted-foreground">Ask anything…</span>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Paperclip size={11} />
          <Mic size={11} />
          <span className="rounded-xs bg-muted px-1.5 py-0.5 font-mono text-[9px] text-foreground">Opus</span>
        </div>
        <span className="inline-flex size-5 items-center justify-center rounded-sm bg-primary text-primary-foreground">
          <Send size={10} />
        </span>
      </div>
    </div>
  ),

  "composer-select": () => (
    <div className="grid w-full max-w-[13rem] gap-1 text-left">
      <div className="inline-flex w-fit items-center gap-1 rounded-full bg-card px-2.5 py-1 text-[10px] font-medium text-foreground">
        <span>Opus · High</span>
        <ChevronDown size={10} className="text-muted-foreground" />
      </div>
      <div className="grid gap-0.5 rounded-md border border-border bg-popover p-1 text-[10px] shadow-xs">
        <div className="flex items-center justify-between rounded-xs bg-accent px-1.5 py-0.5 text-foreground">
          <span>High effort</span>
          <Check size={10} className="text-brand-ink" />
        </div>
        <div className="px-1.5 py-0.5 text-muted-foreground">Balanced</div>
      </div>
    </div>
  ),

  "voice-input": () => (
    <div className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-3 py-1.5 text-xs font-medium text-brand-ink">
      <Mic size={13} />
      <span>Listening…</span>
      <span className="size-2 rounded-full bg-brand-ink" />
    </div>
  ),

  "agent-thinking": () => <AgentThinking activity="searching" label="Reviewing tokens" timer={false} />,

  "activity-disclosure": () => (
    <div className="grid w-full max-w-[14rem] gap-1 rounded-lg bg-card px-2.5 py-2 text-left">
      <div className="flex items-center justify-between text-[11px] font-medium text-foreground">
        <span>Worked for 6s · 4 steps</span>
        <ChevronRight size={11} className="text-muted-foreground" />
      </div>
      <div className="font-mono text-[9px] text-muted-foreground">read_file · search_docs · verify</div>
    </div>
  ),

  "working-light": () => (
    <div className="relative flex h-16 w-full max-w-[13.5rem] items-center justify-center overflow-hidden rounded-xl bg-card px-3 text-xs text-muted-foreground">
      <span>Agent running</span>
      <WorkingLight />
    </div>
  ),

  "tool-call": () => (
    <div className="w-full max-w-[14rem]">
      <ToolCall name="query_logs" state="done" duration={210} />
    </div>
  ),

  "suggestion-chips": () => <SuggestionChips items={DEMO_CHIPS} onSelect={NOOP} />,

  "source-tally": () => <SourceTally sources={DEMO_SOURCES} label="Read" />,

  "task-list": () => (
    <div className="w-full max-w-[14rem] scale-95">
      <TaskList tasks={DEMO_TASKS} />
    </div>
  ),

  "context-meter": () => (
    <div className="w-full max-w-[13.5rem]">
      <ContextMeter limit={128_000} parts={DEMO_CONTEXT_PARTS} legend={false} />
    </div>
  ),

  "provider-icon": () => (
    <div className="flex items-center gap-3">
      <ProviderIcon provider="anthropic" size={22} />
      <ProviderIcon provider="openai" size={22} />
      <ProviderIcon provider="xai" size={22} />
      <ProviderIcon provider="google" size={22} />
    </div>
  ),

  "provider-card": () => (
    <div className="grid w-full max-w-[14rem] gap-1.5 rounded-lg bg-card p-2.5 text-left">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[11px] font-medium text-foreground">
          <ProviderIcon provider="anthropic" size={14} />
          <span>Anthropic</span>
        </span>
        <Badge size="sm">Max</Badge>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full w-2/3 bg-brand" />
      </div>
      <div className="flex justify-between font-mono text-[9px] text-muted-foreground">
        <span>68% used</span>
        <span>Resets 4h</span>
      </div>
    </div>
  ),

  "markdown-callout": () => (
    <div className="w-full max-w-[14rem] scale-95">
      <MarkdownCallout kind="tip" title="Tip">
        Use semantic OKLCH tokens.
      </MarkdownCallout>
    </div>
  ),

  "generation-frame": () => (
    <div className="relative grid h-20 w-full max-w-[13.5rem] grid-cols-8 gap-1 overflow-hidden rounded-xl bg-card p-2">
      {Array.from({ length: 24 }, (_, idx) => (
        <span
          key={idx}
          className={`rounded-[2px] ${
            idx % 5 === 0 ? "bg-brand/70" : idx % 3 === 0 ? "bg-brand-soft" : "bg-muted"
          }`}
        />
      ))}
      <span className="absolute bottom-1.5 right-2 rounded-xs bg-background/85 px-1.5 py-0.5 font-mono text-[9px] text-foreground">
        Generating 64%
      </span>
    </div>
  ),

  citations: () => (
    <div className="grid w-full max-w-[14rem] gap-1 text-left">
      <div className="text-[11px] text-foreground">
        Tokens resolve per surface
        <sup className="ml-0.5 rounded-xs bg-brand-soft px-1 font-mono text-[9px] text-brand-ink">1</sup>
        <sup className="ml-0.5 rounded-xs bg-muted px-1 font-mono text-[9px] text-muted-foreground">2</sup>.
      </div>
      <div className="font-mono text-[9px] text-muted-foreground">[1] DESIGN.md · [2] tokens.css</div>
    </div>
  ),

  "code-block": () => (
    <div className="w-full max-w-[14rem] overflow-hidden rounded-lg bg-card text-left font-mono text-[10px]">
      <div className="flex items-center justify-between border-b border-border/50 px-2 py-1 text-muted-foreground">
        <span>ts</span>
        <Copy size={10} />
      </div>
      <div className="px-2 py-1.5 text-foreground">
        <span className="text-brand-ink">const</span> ok = <span className="text-success-ink">true</span>;
      </div>
    </div>
  ),

  "markdown-helpers": () => (
    <div className="grid w-full max-w-[14rem] gap-1 rounded-lg bg-card p-2 text-left text-[10px]">
      <div className="font-semibold text-foreground">Markdown AST</div>
      <div className="text-muted-foreground">
        • Pure <code className="rounded-xs bg-muted px-1 font-mono text-[9px] text-foreground">parseCallout</code>
      </div>
      <div className="font-mono text-[9px] text-brand-ink">zero React · zero deps</div>
    </div>
  ),

  attachments: () => (
    <div className="flex flex-wrap items-center justify-center gap-1.5 text-[10px]">
      <span className="inline-flex items-center gap-1 rounded-md bg-card px-2 py-1 text-foreground">
        <ImageIcon size={11} className="text-brand-ink" />
        <span>chart.png</span>
        <X size={9} className="text-muted-foreground" />
      </span>
      <span className="inline-flex items-center gap-1 rounded-md bg-card px-2 py-1 text-foreground">
        <FileText size={11} className="text-muted-foreground" />
        <span>spec.pdf</span>
        <X size={9} className="text-muted-foreground" />
      </span>
    </div>
  ),

  "use-attachments": () => (
    <div className="grid w-full max-w-[13.5rem] gap-1.5 rounded-lg bg-card p-2 text-left font-mono text-[10px]">
      <div className="flex items-center justify-between">
        <span className="text-foreground">useAttachments()</span>
        <Badge tone="info" size="sm">
          2 queued
        </Badge>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-muted">
        <div className="h-full w-3/4 bg-brand" />
      </div>
    </div>
  ),

  "read-aloud": () => (
    <div className="flex w-full max-w-[14rem] items-center gap-2 rounded-lg bg-card px-2.5 py-2 text-left text-[11px]">
      <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-brand text-brand-foreground">
        <Pause size={10} />
      </span>
      <span className="leading-snug text-muted-foreground">
        Tokens <span className="rounded-xs bg-brand-soft px-0.5 font-medium text-brand-ink">adapt automatically</span>.
      </span>
    </div>
  ),

  "routing-policy": () => (
    <div className="grid w-full max-w-[14rem] gap-1 rounded-lg bg-card p-2 text-left text-[10px]">
      <div className="flex items-center justify-between">
        <span className="font-medium text-foreground">#1 Anthropic</span>
        <span className="font-mono text-[9px] text-brand-ink">skip ≥ 90%</span>
      </div>
      <div className="flex items-center justify-between text-muted-foreground">
        <span>#2 OpenAI</span>
        <span className="font-mono text-[9px]">fallback</span>
      </div>
    </div>
  ),

  "synchronized-accounts": () => (
    <div className="grid w-full max-w-[14rem] gap-1 rounded-lg bg-card p-2 text-left text-[10px]">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 font-medium text-foreground">
          <StatusDot tone="success" label="Synced" hideLabel />
          workstation
        </span>
        <span className="font-mono text-[9px] text-muted-foreground">2m ago</span>
      </div>
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <StatusDot tone="info" label="Syncing" hideLabel />
          laptop
        </span>
        <span className="font-mono text-[9px]">5m ago</span>
      </div>
    </div>
  ),

  "consumption-view": () => (
    <div className="grid w-full max-w-[14rem] gap-1.5 rounded-lg bg-card p-2 text-left">
      <div className="flex items-baseline justify-between font-mono text-[10px] tabular-nums">
        <span className="font-semibold text-foreground">$18.40</span>
        <span className="text-muted-foreground">4.2M tok</span>
      </div>
      <div className="flex h-7 items-end gap-1">
        {[40, 65, 50, 90, 72, 58].map((h, i) => (
          <span
            key={i}
            style={{ height: `${h}%` }}
            className={`flex-1 rounded-t-xs ${i === 3 ? "bg-brand" : "bg-muted-foreground/40"}`}
          />
        ))}
      </div>
    </div>
  ),

  "private-history": () => (
    <div className="grid w-full max-w-[14rem] gap-1 rounded-lg bg-card p-2 text-left font-mono text-[10px] tabular-nums">
      <div className="flex justify-between text-foreground">
        <span>14:30</span>
        <span className="text-brand-ink">68%</span>
      </div>
      <div className="flex justify-between text-muted-foreground">
        <span>13:30</span>
        <span>64%</span>
      </div>
      <div className="border-t border-border/50 pt-1 text-right text-[9px] text-muted-foreground">Page 1 / 4</div>
    </div>
  ),

  "api-key-form": () => (
    <div className="grid w-full max-w-[14rem] gap-1 rounded-lg bg-card p-2 text-left">
      <div className="flex items-center gap-1.5 text-[10px] font-medium text-foreground">
        <KeyRound size={11} className="text-brand-ink" />
        <span>Anthropic key</span>
      </div>
      <div className="flex items-center justify-between gap-1.5">
        <span className="flex-1 truncate rounded-sm bg-background px-2 py-1 font-mono text-[9px] text-muted-foreground">
          sk-ant-••••••••
        </span>
        <Button size="xs">Save</Button>
      </div>
    </div>
  ),

  "hosted-migration": () => (
    <div className="grid w-full max-w-[14rem] gap-1.5 rounded-lg bg-card p-2 text-center">
      <div className="flex items-center justify-center gap-1.5 text-[10px] font-medium text-foreground">
        <span className="rounded-xs bg-muted px-1.5 py-0.5">Hosted</span>
        <ArrowRight size={11} className="text-brand-ink" />
        <span className="rounded-xs bg-brand-soft px-1.5 py-0.5 text-brand-ink">Local</span>
      </div>
      <div className="inline-flex items-center justify-center gap-1 font-mono text-[9px] text-muted-foreground">
        <Check size={10} className="text-success-ink" />4 accounts verified
      </div>
    </div>
  ),

  /* ------------------------------------------- Interaction / WebMCP / MCP */
  comparison: () => (
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
  ),

  "action-button": () => (
    <div className="flex items-center gap-2">
      <Button size="sm" variant="accent">
        Run action
      </Button>
      <span className="font-mono text-[10px] text-muted-foreground">deduped</span>
    </div>
  ),

  "arguments-form": () => (
    <div className="grid w-full max-w-[14rem] gap-1 rounded-lg bg-card p-2 text-left text-[10px]">
      <div className="flex items-center justify-between">
        <span className="font-medium text-foreground">Form</span>
        <span className="font-mono text-[9px] text-muted-foreground">JSON</span>
      </div>
      <div className="flex items-center justify-between gap-1.5">
        <span className="flex-1 rounded-sm bg-background px-2 py-0.5 font-mono text-[10px] text-foreground">
          limit: 25
        </span>
        <Button size="xs">Run</Button>
      </div>
    </div>
  ),

  "data-explorer": () => (
    <div className="grid w-full max-w-[14.5rem] gap-1 rounded-lg bg-card p-1.5 text-left text-[10px]">
      <div className="flex items-center gap-1">
        <span className="flex flex-1 items-center gap-1 rounded-xs bg-background px-1.5 py-0.5 text-muted-foreground">
          <Search size={9} /> Search
        </span>
        <span className="rounded-xs bg-brand-soft px-1.5 py-0.5 text-[9px] text-brand-ink">EU ×</span>
      </div>
      <div className="grid grid-cols-2 border-t border-border/50 pt-1 font-mono text-[9px]">
        <span className="text-foreground">relay</span>
        <span className="text-right text-brand-ink">48.2k ↓</span>
      </div>
      <div className="flex justify-between font-mono text-[8px] text-muted-foreground">
        <span>1 selected</span>
        <span>2 of 48</span>
      </div>
    </div>
  ),

  "date-range": () => (
    <div className="grid w-full max-w-[14rem] gap-1 text-left">
      <div className="flex items-center justify-center gap-1.5 rounded-full bg-card px-2.5 py-1 font-mono text-[10px] font-medium text-foreground">
        <CalendarIcon size={10} className="text-brand-ink" />
        <span>Nov 12 → Nov 18</span>
      </div>
      <div className="grid grid-cols-7 rounded-md bg-card p-1 text-center font-mono text-[9px] tabular-nums">
        {[12, 13, 14, 15, 16, 17, 18].map((day) => (
          <span
            key={day}
            className={`py-0.5 ${
              day === 12
                ? "rounded-s-xs bg-brand font-semibold text-brand-foreground"
                : day === 18
                  ? "rounded-e-xs bg-brand font-semibold text-brand-foreground"
                  : "bg-brand-soft text-brand-ink"
            }`}
          >
            {day}
          </span>
        ))}
      </div>
    </div>
  ),

  wizard: () => (
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
  ),

  "confirmation-dialog": () => (
    <div className="w-full max-w-[14rem] rounded-xl border border-border bg-popover p-2.5 text-left shadow-md">
      <div className="flex items-center justify-between gap-1">
        <span className="text-[10px] font-semibold text-foreground">Approve tool?</span>
        <span className="rounded-xs bg-brand-soft px-1.5 py-0.5 font-mono text-[9px] text-brand-ink">book_flight</span>
      </div>
      <div className="mt-2 flex justify-end gap-1.5">
        <Button size="xs" variant="ghost">
          Deny
        </Button>
        <Button size="xs" variant="accent">
          Approve
        </Button>
      </div>
    </div>
  ),

  "webmcp-provider": () => (
    <div className="grid w-full max-w-[14rem] gap-1 rounded-lg border border-dashed border-brand-ink/50 bg-card p-2 text-left">
      <div className="flex items-center justify-between font-mono text-[9px]">
        <span className="text-brand-ink">&lt;WebMCPProvider&gt;</span>
        <StatusDot tone="success" label="Ready" hideLabel />
      </div>
      <div className="flex flex-wrap gap-1 font-mono text-[9px]">
        <span className="rounded-xs bg-muted px-1.5 py-0.5 text-foreground">search_items</span>
        <span className="rounded-xs bg-muted px-1.5 py-0.5 text-foreground">add_cart</span>
      </div>
    </div>
  ),

  "webmcp-form": () => (
    <div className="grid w-full max-w-[14rem] gap-1 rounded-lg bg-card p-2 text-left">
      <span className="font-mono text-[9px] text-brand-ink">toolname=&quot;book_table&quot;</span>
      <div className="flex items-center justify-between gap-1.5">
        <span className="flex-1 rounded-sm bg-background px-2 py-0.5 text-[10px] text-foreground">Guests: 4</span>
        <Button size="xs">Submit</Button>
      </div>
    </div>
  ),

  "support-badge": () => (
    <div className="flex items-center gap-2">
      <Badge tone="success" dot>
        WebMCP native
      </Badge>
    </div>
  ),

  "connection-panel": () => (
    <div className="grid w-full max-w-[14.5rem] gap-1.5 rounded-lg bg-card p-2 text-left">
      <div className="flex items-center justify-between gap-1 font-mono text-[9px]">
        <span className="truncate text-foreground">mcp.fabrials.com</span>
        <Badge size="sm">OAuth</Badge>
      </div>
      <div className="flex items-center justify-between">
        <StatusDot tone="success" label="Connected" />
        <Button size="xs" variant="outline">
          Disconnect
        </Button>
      </div>
    </div>
  ),

  "tool-catalog": () => (
    <div className="grid w-full max-w-[14rem] gap-0.5 rounded-lg bg-card p-1.5 text-left font-mono text-[10px]">
      <div className="flex items-center justify-between rounded-xs bg-brand-soft px-1.5 py-0.5 text-brand-ink">
        <span>query_metrics</span>
        <ChevronRight size={10} />
      </div>
      <div className="px-1.5 py-0.5 text-muted-foreground">list_keys</div>
      <div className="px-1.5 text-right text-[9px] text-muted-foreground">14 tools</div>
    </div>
  ),

  "tool-detail": () => (
    <div className="grid w-full max-w-[14rem] gap-1 rounded-lg bg-card p-2 text-left">
      <div className="flex items-center justify-between font-mono text-[10px]">
        <span className="font-medium text-foreground">create_ticket</span>
        <Button size="xs">Run</Button>
      </div>
      <div className="font-mono text-[9px] text-muted-foreground">title: string · priority: p1</div>
    </div>
  ),

  "result-view": () => (
    <div className="grid w-full max-w-[14rem] gap-1 rounded-lg bg-card p-2 text-left font-mono text-[10px]">
      <div className="flex items-center justify-between text-[9px]">
        <span className="font-medium text-brand-ink">Text</span>
        <span className="text-muted-foreground">Raw JSON</span>
      </div>
      <div className="rounded-xs bg-background px-2 py-1 text-foreground">
        &#123;&quot;ok&quot;: true, &quot;ms&quot;: 38&#125;
      </div>
    </div>
  ),

  "execution-log": () => (
    <div className="grid w-full max-w-[14.5rem] gap-1 rounded-lg bg-card p-2 text-left font-mono text-[10px]">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1 text-foreground">
          <Terminal size={10} className="text-brand-ink" />
          search_docs
        </span>
        <span className="text-success-ink">200 · 42ms</span>
      </div>
      <div className="flex items-center justify-between text-muted-foreground">
        <span>read_file</span>
        <span className="text-brand-ink">running ×</span>
      </div>
    </div>
  ),

  "elicitation-dialog": () => (
    <div className="w-full max-w-[14rem] rounded-xl border border-border bg-popover p-2.5 text-left shadow-md">
      <div className="flex items-center justify-between font-mono text-[9px]">
        <span className="font-sans text-[10px] font-semibold text-foreground">More info needed</span>
        <span className="text-brand-ink">input_required</span>
      </div>
      <div className="mt-1.5 flex items-center justify-between gap-1.5">
        <span className="flex-1 rounded-sm bg-card px-2 py-0.5 font-mono text-[10px] text-foreground">eu-central</span>
        <Button size="xs">Submit</Button>
      </div>
    </div>
  ),

  "resource-explorer": () => (
    <div className="grid w-full max-w-[14.5rem] gap-1 rounded-lg bg-card p-2 text-left font-mono text-[10px]">
      <div className="flex gap-2 text-[9px]">
        <span className="font-medium text-brand-ink">Resources</span>
        <span className="text-muted-foreground">Prompts</span>
      </div>
      <div className="truncate rounded-xs bg-background px-1.5 py-1 text-foreground">file:///tokens.css</div>
    </div>
  ),

  "mcp-dashboard": () => (
    <div className="grid h-20 w-full max-w-[14.5rem] grid-rows-[1.2rem_1fr] overflow-hidden rounded-lg bg-card font-mono text-[8px]">
      <div className="flex items-center justify-between border-b border-border/50 px-2 text-muted-foreground">
        <span>MCP Console</span>
        <span className="text-success-ink">● live</span>
      </div>
      <div className="grid grid-cols-[4.5rem_1fr]">
        <div className="grid content-start gap-1 border-e border-border/50 p-1.5 text-brand-ink">
          <span>query</span>
          <span className="text-muted-foreground">inspect</span>
        </div>
        <div className="p-1.5 text-muted-foreground">&#123; &quot;rows&quot;: 12 &#125;</div>
      </div>
    </div>
  ),

  "mcp-client": () => (
    <div className="grid w-full max-w-[14rem] gap-1 rounded-lg bg-card p-2 text-left font-mono text-[10px]">
      <div className="flex items-center justify-between">
        <span className="text-foreground">MCP SDK v2</span>
        <Badge tone="success" size="sm">
          2026-07-28
        </Badge>
      </div>
      <div className="flex gap-1.5 text-[9px] text-muted-foreground">
        <span>connect()</span>
        <span>·</span>
        <span>run()</span>
      </div>
    </div>
  ),

  "server-connector": () => (
    <div className="flex w-full max-w-[14.5rem] items-center justify-between gap-1 rounded-lg bg-card px-2 py-2 font-mono text-[9px]">
      <span className="rounded-xs bg-muted px-1.5 py-1 text-foreground">App</span>
      <ArrowRight size={10} className="text-muted-foreground" />
      <span className="inline-flex items-center gap-1 rounded-xs bg-brand-soft px-1.5 py-1 text-brand-ink">
        <Lock size={9} /> Node
      </span>
      <ArrowRight size={10} className="text-muted-foreground" />
      <span className="inline-flex items-center gap-0.5 rounded-xs bg-muted px-1.5 py-1 text-foreground">
        <ShieldCheck size={9} /> MCP
      </span>
    </div>
  ),
};
