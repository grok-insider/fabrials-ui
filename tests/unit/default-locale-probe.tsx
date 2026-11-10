import { createElement, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { accountsCases } from "./accounts-cases";

// The runtime half of tests/unit/default-locale.test.tsx, run as its own process so that no formatter cache filled by an earlier
// test file can hide a construction that asked Intl for the runtime's locale. It prints the offences as JSON and always exits 0:
// the test that spawns it reads the record, and `FUI_LOCALE_PROBE_PLANT=1` makes it commit one on purpose to prove the net works.

type Offence = { api: string; stack: string };

const INTL_APIS = [
  "DateTimeFormat",
  "NumberFormat",
  "RelativeTimeFormat",
  "PluralRules",
  "ListFormat",
  "Segmenter",
  "Collator",
  "DisplayNames",
] as const;

const PROTOCOL_METHODS: Array<[object, string, string, number]> = [
  [Date.prototype, "toLocaleString", "Date.prototype.toLocaleString", 0],
  [Date.prototype, "toLocaleDateString", "Date.prototype.toLocaleDateString", 0],
  [Date.prototype, "toLocaleTimeString", "Date.prototype.toLocaleTimeString", 0],
  [Number.prototype, "toLocaleString", "Number.prototype.toLocaleString", 0],
  [BigInt.prototype, "toLocaleString", "BigInt.prototype.toLocaleString", 0],
  [Array.prototype, "toLocaleString", "Array.prototype.toLocaleString", 0],
  [String.prototype, "toLocaleUpperCase", "String.prototype.toLocaleUpperCase", 0],
  [String.prototype, "toLocaleLowerCase", "String.prototype.toLocaleLowerCase", 0],
  [String.prototype, "localeCompare", "String.prototype.localeCompare", 1],
];

/** No locale at all: nothing, `undefined`, `null`, or an empty list. */
function asksForRuntime(args: unknown[]): boolean {
  if (args.length === 0) return true;
  const first = args[0];
  return first === undefined || first === null || (Array.isArray(first) && first.length === 0);
}

function stackUnderPackages(): string {
  const frames = (new Error().stack ?? "").split("\n").slice(2);
  return frames.filter((line) => /(^|\/)packages\/[^/]+\/src\//.test(line)).join("\n");
}

function record(offences: Offence[], api: string) {
  const frames = stackUnderPackages();
  offences.push({ api, stack: frames || `(outside packages)\n${new Error().stack ?? ""}` });
}

/** Runs `body` with every locale-aware entry point watched, then restores them. */
async function withWatch<T>(body: (offences: Offence[]) => T | Promise<T>): Promise<{ result: T; offences: Offence[] }> {
  const offences: Offence[] = [];
  const restores: Array<() => void> = [];
  const intl = Intl as unknown as Record<string, unknown>;

  for (const name of INTL_APIS) {
    const original = intl[name];
    if (typeof original !== "function") continue;
    const api = `new Intl.${name}`;
    const wrapped = new Proxy(original, {
      apply(target, thisArg, args: unknown[]) {
        if (asksForRuntime(args)) record(offences, api);
        return Reflect.apply(target, thisArg, args);
      },
      construct(target, args: unknown[], newTarget) {
        if (asksForRuntime(args)) record(offences, api);
        return Reflect.construct(target, args, newTarget);
      },
    });
    intl[name] = wrapped;
    restores.push(() => {
      intl[name] = original;
    });
  }

  for (const [holder, key, api, at] of PROTOCOL_METHODS) {
    const target = holder as unknown as Record<string, (...args: unknown[]) => unknown>;
    const original = target[key]!;
    target[key] = function (this: unknown, ...args: unknown[]) {
      const locale = at === 0 ? args.slice(0, 1) : args.slice(1, 2);
      if (asksForRuntime(locale)) record(offences, api);
      return original.apply(this, args);
    };
    restores.push(() => {
      target[key] = original;
    });
  }

  try {
    const result = await body(offences);
    return { result, offences };
  } finally {
    for (const restore of restores.reverse()) restore();
  }
}

const NOW = Date.UTC(2026, 10, 8, 9, 30);
const DATE = new Date(Date.UTC(2026, 8, 27, 9, 31));

type UI = typeof import("../../packages/ui/src/index");
type AI = typeof import("../../packages/ai-ui/src/index");
type Spreadsheet = typeof import("../../packages/ui/src/spreadsheet-read");

/** Every component that writes a number, a date, a time or a case-changed word, with the props a product passes and no locale. */
function localeCases(ui: UI, ai: AI): Array<[string, ReactElement]> {
  const options = [
    { value: "grok", label: "Grok" },
    { value: "nous", label: "Nous" },
    { value: "codex", label: "Codex" },
  ];
  const workbook = {
    sheets: [
      {
        name: "Budget",
        rows: [
          [{ value: "Item" }, { value: "Due" }, { value: "Share" }],
          [{ value: "Rent & power" }, { value: new Date(Date.UTC(2026, 0, 5)) }, { value: 0.125 }],
          [{ value: 41_250 }, { value: true }, { value: new Date(Date.UTC(2026, 0, 15, 9, 30)) }],
        ],
      },
    ],
  };
  return [
    ["Calendar", createElement(ui.Calendar, { mode: "single", selected: DATE, today: DATE })],
    ["DatePicker", createElement(ui.DatePicker, { "aria-label": "Due", defaultValue: DATE, name: "due" })],
    [
      "DateRangePicker",
      createElement(ui.DateRangePicker, { "aria-label": "Trip", defaultValue: { from: DATE, to: DATE } }),
    ],
    ["Spreadsheet", createElement(ui.Spreadsheet, { workbook })],
    ["RelativeTime", createElement(ui.RelativeTime, { date: DATE, now: NOW })],
    ["RelativeTime absolute", createElement(ui.RelativeTime, { absoluteFormat: { dateStyle: "medium" }, date: DATE, now: NOW })],
    ["LocalTime", createElement(ui.LocalTime, { format: "dateTime", value: DATE })],
    ["LocalTime message", createElement(ui.LocalTime, { format: "message", now: DATE, value: DATE })],
    ["FileSize", createElement(ui.FileSize, { bytes: 26_214_400 })],
    ["RepoInfo", createElement(ui.RepoInfo, { forks: 128, owner: "grok-insider", repo: "fabrials-ui", stars: 12_480 })],
    ["Progress", createElement(ui.Progress, { label: "Indexing", value: 1240, max: 1940 })],
    ["Progress ring", createElement(ui.Progress, { "aria-label": "Quota", value: 42, variant: "ring", size: "lg" })],
    ["Progress steps", createElement(ui.Progress, { "aria-label": "Steps", value: 3, steps: 5 })],
    [
      "Progress segments",
      createElement(ui.Progress, {
        "aria-label": "Session",
        segments: [
          { id: "a", label: "Words", state: "done" },
          { id: "b", label: "Reading", state: "current" },
          { id: "c", label: "Writing", state: "todo" },
        ],
      }),
    ],
    ["Meter", createElement(ui.Meter, { label: "Storage", max: 1940, value: 1240 })],
    ["Meter ruler", createElement(ui.Meter, { label: "Quota", max: 1940, value: 1240, variant: "ruler" })],
    ["Slider", createElement(ui.Slider, { "aria-label": "Budget", defaultValue: 1240, label: "Budget", max: 1940, unit: "USD" })],
    ["SeriesChart", createElement(ui.SeriesChart, { caption: "Requests per day", data: [{ day: "Mon", a: 1240, b: 980 }], series: [{ key: "a", label: "Grok" }, { key: "b", label: "Nous" }], xKey: "day" })],
    ["ColorRamp", createElement(ui.ColorRamp, { max: 1940, min: 0, stops: ["var(--fui-chart-1)", "var(--fui-chart-2)"], label: "Requests", marks: [{ label: "Peak", value: 1240 }] })],
    ["ChartLegend", createElement(ui.ChartLegend, {}, createElement(ui.LegendItem, { color: "var(--fui-chart-1)", key: "a", label: "Grok" }))],
    ["MultiSelect", createElement(ui.MultiSelect, { id: "providers", label: "Providers", onValueChange: () => undefined, options, value: ["grok", "nous", "codex"] })],
    ["NumberTicker", createElement(ui.NumberTicker, { value: 12_480 })],
    ["Countdown", createElement(ui.Countdown, { deadline: NOW + 754_000, now: NOW })],
    ["StepControls", createElement(ui.StepControls, { count: 12, index: 4, next: () => undefined, previous: () => undefined })],
    [
      "MarkedText",
      createElement(ui.MarkedText, {
        ranges: [
          { start: 0, end: 4, severity: "error" },
          { start: 5, end: 11, severity: "warning" },
          { start: 12, end: 20, severity: "note" },
        ],
        text: "Teh quick brown fox jumps",
      }),
    ],
    [
      "AnnotationList",
      createElement(ui.AnnotationList, {
        items: [
          { id: "a", severity: "error", text: "“Teh” is “The”." },
          { id: "b", severity: "warning", text: "Word order." },
        ],
      }),
    ],
    [
      "ChoiceGroup",
      createElement(
        ui.ChoiceGroup,
        { "aria-label": "Pick one", defaultValue: "a", markers: "numbers" },
        createElement(ui.ChoiceOption, { key: "a", value: "a" }, "First"),
        createElement(ui.ChoiceOption, { key: "b", value: "b" }, "Second"),
      ),
    ],
    [
      "RatingBar",
      createElement(ui.RatingBar, {
        label: "How well did you know it?",
        onRate: () => undefined,
        options: [
          { value: "again", label: "Again", hint: "In a minute" },
          { value: "good", label: "Good", hint: "In three days" },
        ],
      }),
    ],
    [
      "AvatarGroup",
      createElement(
        ui.AvatarGroup,
        { max: 2 },
        createElement(ui.Avatar, { key: "a" }, createElement(ui.AvatarFallback, {}, ui.avatarInitials("Ada Lovelace"))),
        createElement(ui.Avatar, { key: "b" }, createElement(ui.AvatarFallback, {}, ui.avatarInitials("Kai Nakamura"))),
        createElement(ui.Avatar, { key: "c" }, createElement(ui.AvatarFallback, {}, ui.avatarInitials("Priya Shah"))),
      ),
    ],
    ["Input count", createElement(ui.Input, { count: { max: 1240 }, defaultValue: "hello" })],
    ["Textarea count", createElement(ui.Textarea, { count: { max: 1940, unit: "words" }, defaultValue: "four words in here" })],
    ["StatGroup", createElement(ui.StatGroup, {}, createElement(ui.Stat, { key: "a", label: "Messages", meter: { label: "Indexed", max: 1940, value: 1240 }, value: 1240 }))],
    ["FilterChip", createElement(ui.FilterChip, { label: "Type", onRemove: () => undefined, value: "image/png" })],
    ["Pagination", createElement(ui.Pagination, {}, createElement(ui.PaginationContent, {}, createElement(ui.PaginationItem, {}, createElement(ui.PaginationLink, { href: "#p2", isActive: true }, "2"))))],
    ["ContextMeter", createElement(ai.ContextMeter, { limit: 200_000, parts: [{ label: "Files", value: 30_000 }, { label: "Chat", value: 12_100 }] })],
    ["GenerationFrame", createElement(ai.GenerationFrame, { alt: "Harbour", progress: 0.42, status: "generating" })],
    [
      "Attachments",
      createElement(ai.Attachments, {
        items: [
          { id: "a", name: "brief.pdf", mediaType: "application/pdf", size: 26_214_400 },
          { id: "b", name: "shot.png", mediaType: "image/png", progress: 0.36, size: 1_572_864 },
        ],
        variant: "list",
      }),
    ],
    ["TaskList", createElement(ai.TaskList, { label: "Plan", tasks: [{ id: "a", title: "Search the docs", status: "running" }, { id: "b", title: "Read", status: "done" }] })],
    ["AgentThinking", createElement(ai.AgentThinking, { label: "Searched 12 sources", startedAt: NOW - 12_000, endedAt: NOW, status: "done" })],
    ["SourceTally", createElement(ai.SourceTally, { sources: ["https://a.example/x", "https://b.example/y"] })],
    ["ToolCall", createElement(ai.ToolCall, { duration: 1_200, input: { q: "x" }, name: "search_docs", output: { n: 2 }, state: "done" })],
    ["MessageTimestamp", createElement(ai.MessageTimestamp, { date: DATE })],
    [
      "ConversationScrollButton",
      createElement(ai.Conversation, {}, createElement(ai.ConversationScrollButton, { key: "jump", unread: 120 })),
    ],
    ...accountsCases.map((item): [string, ReactElement] => [`accounts/${item.id}`, item.element]),
  ];
}

/** Every exported pure helper that formats, called the way a host calls it: with no locale. */
function helperCalls(ui: UI, ai: AI, spreadsheet: Spreadsheet): Array<[string, () => unknown]> {
  const counts = { one: "{count} source", other: "{count} sources" };
  return [
    ["formatBytes", () => ui.formatBytes(undefined, 1536)],
    ["formatBytes small", () => ui.formatBytes(undefined, 812)],
    ["formatRelativeTime", () => ui.formatRelativeTime(NOW - 180_000, NOW)],
    ["formatRelativeTime absolute", () => ui.formatRelativeTime(NOW - 40 * 86_400_000, NOW)],
    ["formatAbsoluteTime", () => ui.formatAbsoluteTime(NOW, undefined, { dateStyle: "medium" })],
    ["formatLocalTime", () => ui.formatLocalTime(DATE)],
    ["formatLocalTime message", () => ui.formatLocalTime(DATE, "message", { now: DATE })],
    ["firstDayOfWeek", () => ui.firstDayOfWeek()],
    ["cellText number", () => ui.cellText(1234.5)],
    ["cellText date", () => ui.cellText(new Date(Date.UTC(2026, 0, 15, 9, 30)))],
    ["cellText day", () => ui.cellText(new Date(Date.UTC(2026, 0, 15)))],
    ["formatNumber", () => spreadsheet.formatNumber(1234.5, "#,##0.00")],
    ["formatNumber general", () => spreadsheet.formatNumber(1234.5, "General")],
    ["plural", () => ui.plural(3, counts)],
    ["formatCount", () => ui.formatCount(12_480)],
    ["countText", () => ui.countText("four words in here")],
    ["countWords", () => ui.countWords("four words in here")],
    ["countGraphemes", () => ui.countGraphemes("élan")],
    ["countReading", () => ui.countReading(1240, 1940)],
    ["recencyGroupFor", () => ui.recencyGroupFor(new Date(Date.UTC(2026, 7, 1)), new Date(DATE))],
    ["groupByRecency", () => ui.groupByRecency([{ at: DATE }], (item: { at: Date }) => item.at, DATE)],
    ["avatarInitials", () => ui.avatarInitials("istanbul ada")],
    ["formatRecordingClock", () => ui.formatRecordingClock(65_400)],
    ["formatCountdown", () => ui.formatCountdown(299_000)],
    ["segmentText", () => ui.segmentText("élan vital", [{ end: 4, severity: "error", start: 0 }])],
    ["speakableText", () => ui.speakableText("# A title\n\nSome **words**.")],
    ["speechChunks", () => ui.speechChunks("see state-of-the-art-and-then-some-more-words now", 12)],
    ["diffWords", () => ui.diffWords("le chat", "les chats")],
    ["firstDayOfWeek of a bare call", () => ui.firstDayOfWeek()],
    ["formatTokens", () => ai.formatTokens(12_480)],
    ["formatPercent", () => ai.formatPercent(0.36)],
    ["attachmentDetail", () => ai.attachmentDetail({ id: "a", mediaType: "application/pdf", name: "brief.pdf", size: 26_214_400 })],
    ["sourcesLabel", () => ai.sourcesLabel(3)],
    ["searchDoneLabel", () => ai.searchDoneLabel(2, 1)],
    ["scrollButtonName", () => ai.scrollButtonName(ai.SCROLL_BUTTON_LABELS, 2, false)],
    ["formatWorkTime", () => ai.formatWorkTime(65_400)],
    ["chat formatBytes", () => ai.formatBytes(1536)],
  ];
}


/** The watch plus every case, as one run: the JSON this process prints. */
const ui = await import("../../packages/ui/src/index");
const ai = await import("../../packages/ai-ui/src/index");
const spreadsheet = await import("../../packages/ui/src/spreadsheet-read");

const cases = localeCases(ui, ai);
const helpers = helperCalls(ui, ai, spreadsheet);

const { offences } = await withWatch((recorded) => {
  for (const entry of cases) {
    try {
      renderToStaticMarkup(entry[1]);
    } catch (error) {
      recorded.push({ api: `${entry[0]} did not render`, stack: String(error) });
    }
  }
  for (const entry of helpers) {
    try {
      entry[1]();
    } catch (error) {
      recorded.push({ api: `${entry[0]} threw`, stack: String(error) });
    }
  }
  if (process.env.FUI_LOCALE_PROBE_PLANT === "1") new Intl.NumberFormat().format(1);
  return recorded.length;
});

const seen = new Set<string>();
const unique = offences.filter((offence) => {
  const key = `${offence.api}\n${offence.stack.split("\n")[0] ?? ""}`;
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});
console.log(JSON.stringify({ cases: cases.length, helpers: helpers.length, offences: unique }, null, 2));
