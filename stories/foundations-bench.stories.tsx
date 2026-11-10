import { useEffect, useRef, useState, type ReactNode } from "react";
import { renderToString } from "react-dom/server";
import { hydrateRoot } from "react-dom/client";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Announcer,
  ariaKeyshortcuts,
  Bdi,
  Button,
  CHART_TOKENS,
  ErrorBoundary,
  ErrorBoundaryFallback,
  ForeignText,
  Input,
  interpolate,
  isolate,
  Kbd,
  LocalTime,
  useAnnounce,
  useElementSize,
  useHotkeys,
  useResolvedTokens,
  type LocalTimeFormat,
} from "@fabrials/ui";
import { copyImage, copyText, downloadFile, ExportError, fileStem, serializeSvg, svgToPng } from "@fabrials/ui/export";
import { Block, Frame, Page } from "./story-frame";

const meta = {
  title: "Tests/Foundations 0.12",
  parameters: { layout: "fullscreen" },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

// One instant and one clock for every time on the page, and a named zone: the pictures are the same on any machine.
const SENT = "2026-09-27T07:31:00Z";
const NOW = new Date("2026-09-27T12:00:00Z");
const ZONE = "Europe/Madrid";

const rowStyle = { display: "grid", gridTemplateColumns: "minmax(0, 9rem) minmax(0, 1fr)", gap: "var(--fui-space-1) var(--fui-space-4)", margin: 0 } as const;
const termStyle = { color: "var(--muted-foreground)" } as const;
const stack = { display: "grid", gap: "var(--fui-space-3)", minWidth: 0 } as const;
const row = { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "var(--fui-space-2)" } as const;

function Times() {
  const formats: [string, LocalTimeFormat, string][] = [
    ["time", "time", SENT],
    ["message, today", "message", SENT],
    ["message, another day", "message", "2026-09-25T21:05:00Z"],
    ["message, another year", "message", "2025-01-02T10:00:00Z"],
    ["dateTime", "dateTime", SENT],
    ["date", "date", SENT],
    ["shortDate", "shortDate", SENT],
    ["shortDate, another year", "shortDate", "2025-01-02T10:00:00Z"],
    ["options", { weekday: "long", hour: "2-digit", minute: "2-digit" }, SENT],
  ];
  return (
    <dl style={rowStyle}>
      {formats.map(([name, format, value]) => (
        <div key={name} style={{ display: "contents" }}>
          <dt style={termStyle}>{name}</dt>
          <dd style={{ margin: 0 }}>
            <LocalTime value={value} format={format} locale="en-GB" now={NOW} timeZone={ZONE} />
          </dd>
        </div>
      ))}
      <dt style={termStyle}>prefix, Spanish</dt>
      <dd style={{ margin: 0 }}>
        <LocalTime value={SENT} format="message" locale="es" now={NOW} prefix="Enviado " timeZone={ZONE} />
      </dd>
      <dt style={termStyle}>12-hour locale</dt>
      <dd style={{ margin: 0 }}>
        <LocalTime value={SENT} format="dateTime" locale="en-US" timeZone="America/New_York" />
      </dd>
    </dl>
  );
}

function Fragile({ startBroken = false, children }: { startBroken?: boolean; children?: ReactNode }) {
  const [broken, setBroken] = useState(startBroken);
  if (broken) throw new Error("The diagram has a node with no name");
  return (
    <div data-testid="diagram" style={stack}>
      <p style={{ margin: 0 }}>The diagram is drawn: three nodes, two links.</p>
      {children}
      <div style={row}>
        <Button onClick={() => setBroken(true)} size="sm" variant="secondary">
          Break the diagram
        </Button>
      </div>
    </div>
  );
}

function Boundaries() {
  const [source, setSource] = useState(1);
  const [caught, setCaught] = useState(0);
  return (
    <div className="catalogue-grid">
      <Frame>
        <ErrorBoundary onError={() => setCaught((count) => count + 1)}>
          <Fragile />
        </ErrorBoundary>
        <p data-testid="caught" style={{ margin: "var(--fui-space-3) 0 0", color: "var(--muted-foreground)" }}>
          Errors reported to the host: {caught}
        </p>
      </Frame>
      <Frame>
        <ErrorBoundary>
          <Fragile startBroken />
        </ErrorBoundary>
      </Frame>
      <Frame>
        <div style={stack}>
          <ErrorBoundary
            resetKey={source}
            fallback={({ error }) => (
              <p data-testid="custom-fallback" role="alert" style={{ margin: 0 }}>
                Source {source} could not be drawn: {error instanceof Error ? error.message : "unknown error"}.
              </p>
            )}
          >
            <Fragile startBroken={source === 1}>
              <p style={{ margin: 0, color: "var(--muted-foreground)" }}>Source {source}</p>
            </Fragile>
          </ErrorBoundary>
          <div style={row}>
            <Button onClick={() => setSource((current) => current + 1)} size="sm" variant="secondary">
              Load another source
            </Button>
          </div>
        </div>
      </Frame>
    </div>
  );
}

function Languages() {
  return (
    <div className="catalogue-grid">
      <Frame>
        <div style={stack}>
          <p style={{ margin: 0 }}>
            The word <ForeignText lang="ar">كِتَاب (kitāb)</ForeignText> means “book”, and <ForeignText lang="he">שָׁלוֹם!</ForeignText> is a greeting.
          </p>
          <p style={{ margin: 0 }}>
            {interpolate("Mind the difference between {first} and {second}: {question}", {
              first: <ForeignText lang="ar">قَلْب</ForeignText>,
              second: <ForeignText lang="ar">كَلْب</ForeignText>,
              question: <ForeignText lang="ar">هل هذا واضح؟</ForeignText>,
            })}
          </p>
          <p style={{ margin: 0 }}>
            Shared by <Bdi>علي حسن</Bdi>, <Bdi>Ana López</Bdi> and <Bdi>דנה (3)</Bdi>.
          </p>
          <p style={{ margin: 0 }}>{interpolate("Imported {name} ({count} words)", { name: "تقرير-٢٠٢٦.pdf", count: 412 })}</p>
          <p style={{ margin: 0 }}>
            <Button aria-label={`Remove ${isolate("تقرير-٢٠٢٦.pdf")}`} size="sm" variant="secondary">
              Remove
            </Button>
          </p>
        </div>
      </Frame>
      <Frame dir="rtl">
        <div lang="ar" style={stack}>
          <p style={{ margin: 0 }}>
            انتبه إلى الفرق بين <ForeignText lang="es">peso</ForeignText> «وزن» و<ForeignText lang="es">piso</ForeignText> «طابق»: <ForeignText lang="es">¿Cómo estás?</ForeignText>
          </p>
          <p style={{ margin: 0 }}>
            {interpolate("كلمة {word} تعني {meaning}.", { word: <ForeignText lang="en">notebook (n.)</ForeignText>, meaning: "دفتر" })}
          </p>
          <p style={{ margin: 0 }}>
            أُرسل في <LocalTime value={SENT} format="dateTime" locale="ar-EG" timeZone="Africa/Cairo" />
          </p>
          <ErrorBoundaryFallback labels={{ title: "تعذّر عرض هذا الجزء", description: "حدث خطأ أثناء رسمه. بقية الصفحة تعمل.", retry: "حاول مرة أخرى" }} reset={() => {}} />
        </div>
      </Frame>
    </div>
  );
}

const OPTIONS = ["el libro", "la mesa", "el perro", "la casa"];

function Hotkeys() {
  const [picked, setPicked] = useState<number | null>(null);
  const [fired, setFired] = useState(0);
  const [checked, setChecked] = useState(0);
  const [pressed, setPressed] = useState(0);
  const [scoped, setScoped] = useState(0);
  const panel = useRef<HTMLDivElement>(null);
  const pick = (index: number) => () => {
    setPicked(index);
    setFired((count) => count + 1);
  };
  useHotkeys({ "1": pick(0), "2": pick(1), "3": pick(2), "4": pick(3), Enter: () => setChecked((count) => count + 1), "mod+k": { handler: () => setPicked(null), whenTyping: true } });
  useHotkeys({ ArrowRight: () => setScoped((count) => count + 1) }, { scope: panel });
  return (
    <div style={stack}>
      <div aria-label="Which word means book?" role="group" style={row}>
        {OPTIONS.map((option, index) => (
          <Button aria-keyshortcuts={ariaKeyshortcuts(String(index + 1))} aria-pressed={picked === index} key={option} onClick={() => setPicked(index)} variant={picked === index ? "default" : "secondary"}>
            <Kbd>{index + 1}</Kbd> <ForeignText lang="es">{option}</ForeignText>
          </Button>
        ))}
      </div>
      <p data-checked={checked} data-fired={fired} data-picked={picked ?? ""} data-pressed={pressed} data-scoped={scoped} data-testid="hotkeys-state" style={{ margin: 0, color: "var(--muted-foreground)" }}>
        Picked: {picked === null ? "nothing" : OPTIONS[picked]} · keys taken: {fired} · checked with Enter: {checked} · button presses: {pressed} · scoped steps: {scoped}
      </p>
      <div style={row}>
        <Input aria-label="A note" placeholder="Typing 1 to 4 here is typing" style={{ maxWidth: "18rem" }} />
        <Button onClick={() => setPressed((count) => count + 1)} size="sm" variant="secondary">
          Another action
        </Button>
      </div>
      <div data-hotkeys="off" style={{ ...row, padding: "var(--fui-space-3)", border: "1px dashed var(--border)", borderRadius: "var(--fui-radius-md)" }}>
        <span style={termStyle}>An island: keys pressed here are its own.</span>
        <Button size="sm" variant="secondary">
          Report a problem
        </Button>
      </div>
      <div ref={panel} style={{ ...row, padding: "var(--fui-space-3)", border: "1px solid var(--border)", borderRadius: "var(--fui-radius-md)" }}>
        <span style={termStyle}>A scope: the right arrow counts only while focus is in here.</span>
        <Button size="sm" variant="secondary">
          Focus me
        </Button>
      </div>
    </div>
  );
}

// Any CSS colour resolves, not only a token: this one needs the element to know what --brand is.
const HALF_BRAND = "color-mix(in oklab, var(--brand) 50%, transparent)";
const TOKENS = [...CHART_TOKENS, "--brand", "--foreground", "--background", "--border", HALF_BRAND] as const;

function Swatches({ label }: { label: string }) {
  const { ref, width } = useElementSize<HTMLDivElement>();
  const tokens = useResolvedTokens(TOKENS, ref);
  return (
    <div data-testid={`tokens-${label}`} data-theme-read={tokens.theme} ref={ref} style={{ ...stack, padding: "var(--fui-space-3)", background: "var(--card)", color: "var(--card-foreground)", borderRadius: "var(--fui-radius-md)", border: "1px solid var(--border)" }}>
      <p style={{ margin: 0 }}>
        {label}: theme <strong>{tokens.theme}</strong>, <span data-testid="measured">{width > 0 ? "measured" : "not measured"}</span>
      </p>
      <ul style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(8.5rem, 1fr))", gap: "var(--fui-space-2)", margin: 0, padding: 0, listStyle: "none" }}>
        {TOKENS.map((name) => (
          <li data-hex={tokens.colors[name] ?? ""} data-token={name} key={name} style={{ display: "flex", alignItems: "center", gap: "var(--fui-space-2)", minWidth: 0 }}>
            <span aria-hidden style={{ flex: "none", inlineSize: "1.25rem", blockSize: "1.25rem", borderRadius: "var(--fui-radius-sm)", border: "1px solid var(--border)", background: tokens.colors[name] }} />
            <span style={{ minWidth: 0 }}>
              <span style={{ display: "block" }}>{name === HALF_BRAND ? "brand at 50%" : name}</span>
              <code style={{ fontFamily: "var(--fui-font-mono)", fontSize: "var(--fui-text-xs)", color: "var(--muted-foreground)" }}>{tokens.colors[name] ?? "…"}</code>
            </span>
          </li>
        ))}
      </ul>
      <p data-font-mono={tokens.fontMono} data-font-sans={tokens.fontSans} data-testid="fonts" style={{ margin: 0, color: "var(--muted-foreground)", overflowWrap: "anywhere" }}>
        Text in {tokens.fontSans.split(",")[0]?.replace(/"/g, "")}, figures in {tokens.fontMono.split(",")[0]?.replace(/"/g, "")}
      </p>
    </div>
  );
}

function Tokens() {
  return (
    <div style={stack}>
      <Swatches label="The page" />
      <div className="catalogue-grid">
        <div className="dark">
          <Swatches label="A dark part" />
        </div>
        <div className="light">
          <Swatches label="A light part" />
        </div>
      </div>
    </div>
  );
}

const TITLE = "Ventas / Q3 — «مبيعات» 2026";
const BARS = [38, 62, 51, 84, 70];

function Exports() {
  const svg = useRef<SVGSVGElement>(null);
  const announce = useAnnounce();
  const [status, setStatus] = useState("Nothing exported yet.");
  const stem = fileStem(TITLE, "chart");
  const say = (text: string) => {
    setStatus(text);
    announce(text);
  };
  const guard = (action: () => void | Promise<void>, done: string) => async () => {
    try {
      await action();
      say(done);
    } catch (error) {
      say(error instanceof ExportError ? `Could not do that (${error.code}).` : "Could not do that.");
    }
  };
  return (
    <div style={stack}>
      <svg aria-label="Sales by week, five bars" ref={svg} role="img" style={{ inlineSize: "100%", maxInlineSize: "20rem", blockSize: "auto" }} viewBox="0 0 320 160">
        <rect fill="var(--card)" height="160" width="320" />
        {BARS.map((value, index) => (
          <rect fill={`var(--chart-${index + 1})`} height={value} key={value} width="40" x={24 + index * 56} y={128 - value} />
        ))}
        <line stroke="var(--border)" x1="16" x2="304" y1="128" y2="128" />
        <text fill="var(--foreground)" fontFamily="var(--fui-font-sans)" fontSize="12" x="16" y="150">
          Sales by week
        </text>
      </svg>
      <div style={row}>
        <Button onClick={guard(() => downloadFile(`${stem}.svg`, serializeSvg(svg.current!), "image/svg+xml"), `Saved ${stem}.svg`)} size="sm" variant="secondary">
          Download SVG
        </Button>
        <Button onClick={guard(async () => downloadFile(`${stem}.png`, await svgToPng(svg.current!)), `Saved ${stem}.png`)} size="sm" variant="secondary">
          Download PNG
        </Button>
        <Button onClick={guard(async () => copyImage(await svgToPng(svg.current!, { background: "var(--card)" })), "Copied the picture")} size="sm" variant="secondary">
          Copy picture
        </Button>
        <Button onClick={guard(() => copyText(TITLE), "Copied the title")} size="sm" variant="secondary">
          Copy title
        </Button>
      </div>
      <p data-testid="export-status" style={{ margin: 0, color: "var(--muted-foreground)" }}>
        {status} File name: <code style={{ fontFamily: "var(--fui-font-mono)" }}>{stem}</code>
      </p>
    </div>
  );
}

function Speaker() {
  const announce = useAnnounce();
  const [saves, setSaves] = useState(0);
  return (
    <div style={row}>
      <Button
        onClick={() => {
          setSaves((count) => count + 1);
          announce("Draft saved");
        }}
        size="sm"
        variant="secondary"
      >
        Save the draft
      </Button>
      <Button onClick={() => announce("The connection was lost", { assertive: true })} size="sm" variant="secondary">
        Lose the connection
      </Button>
      <span data-testid="saves" style={termStyle}>
        Saved {saves} {saves === 1 ? "time" : "times"}; the sentence is spoken, not shown.
      </span>
    </div>
  );
}

function Bench() {
  return (
    <Page
      description="The small pieces of 0.12 in fixed states: a time in a named zone, an error boundary, text in another language, hotkeys, tokens as hex, exports and the announcer."
      title="Foundations 0.12"
    >
      <Block title="Local time" description="Every format in Europe/Madrid against a fixed clock, a prefix, and a 12-hour locale.">
        <Frame width={560}>
          <Times />
        </Frame>
      </Block>
      <Block title="Error boundary" description="A part that can break, one that is broken and offers to try again, and one with its own fallback that a new source resets.">
        <Boundaries />
      </Block>
      <Block title="Text in another language" description="Fragments that keep their own direction inside a sentence, names of unknown language, a message with slots, and the reverse in a right-to-left frame.">
        <Languages />
      </Block>
      <Block title="Hotkeys" description="1 to 4 pick an option and Enter checks, from anywhere but a field, another control or the island.">
        <Frame>
          <Hotkeys />
        </Frame>
      </Block>
      <Block title="Resolved tokens" description="The series colours as hex for a canvas, for the page and for a part with its own theme.">
        <Tokens />
      </Block>
      <Block title="Export" description="A drawing saved as SVG and PNG with its token colours written in, and copied as a picture.">
        <Frame width={560}>
          <Exports />
        </Frame>
      </Block>
      <Block title="Announcer" description="One polite and one assertive region for the whole screen.">
        <Frame width={560}>
          <Announcer>
            <Speaker />
          </Announcer>
        </Frame>
      </Block>
    </Page>
  );
}

export const Pieces: Story = { render: () => <Bench /> };

function ReaderTimes() {
  return (
    <dl style={rowStyle}>
      <dt style={termStyle}>reader, time</dt>
      <dd style={{ margin: 0 }}>
        <LocalTime data-testid="reader-time" value={SENT} format="time" locale="en-GB" />
      </dd>
      <dt style={termStyle}>reader, date and time</dt>
      <dd style={{ margin: 0 }}>
        <LocalTime data-testid="reader-date-time" value={SENT} format="dateTime" locale="en-GB" />
      </dd>
      <dt style={termStyle}>fixed, Madrid</dt>
      <dd style={{ margin: 0 }}>
        <LocalTime data-testid="fixed-time" value={SENT} format="time" locale="en-GB" timeZone={ZONE} />
      </dd>
      <dt style={termStyle}>after it</dt>
      <dd data-testid="after" style={{ margin: 0 }}>
        the next line
      </dd>
    </dl>
  );
}

/** The same times with no locale at all: English by default, the reader's zone after hydration. */
function DefaultReaderTimes() {
  return (
    <dl style={rowStyle}>
      <dt style={termStyle}>reader, time</dt>
      <dd style={{ margin: 0 }}>
        <LocalTime data-testid="reader-time" value={SENT} format="time" />
      </dd>
      <dt style={termStyle}>reader, date and time</dt>
      <dd style={{ margin: 0 }}>
        <LocalTime data-testid="reader-date-time" value={SENT} format="dateTime" />
      </dd>
      <dt style={termStyle}>fixed, Madrid</dt>
      <dd style={{ margin: 0 }}>
        <LocalTime data-testid="fixed-time" value={SENT} format="time" timeZone={ZONE} />
      </dd>
      <dt style={termStyle}>after it</dt>
      <dd data-testid="after" style={{ margin: 0 }}>
        the next line
      </dd>
    </dl>
  );
}

type Box = { text: string; width: number; height: number; hidden: boolean; title: string | null };
type Report = { before: Record<string, Box>; after: Record<string, Box>; afterTop: [number, number]; errors: string[] };

/**
 * A real server render and a real hydration, inside the story: the markup is made by `renderToString`, measured while it is
 * still the server's, then hydrated. What it finds is written on the page for the test to read.
 */
function Hydration({ times = <ReaderTimes /> }: { times?: ReactNode }) {
  const host = useRef<HTMLDivElement>(null);
  const [report, setReport] = useState<Report | null>(null);
  useEffect(() => {
    let stop = () => {};
    let stopped = false;
    // With the fonts in: the stand-in and the final text are measured in the same face.
    void Promise.all([document.fonts.load('400 14px "IBM Plex Sans"'), document.fonts.ready]).then(() => {
      if (!stopped) stop = run();
    });
    return () => {
      stopped = true;
      stop();
    };
  }, []);
  const run = () => {
    const container = host.current!;
    container.innerHTML = renderToString(times);
    const read = () =>
      Object.fromEntries(
        [...container.querySelectorAll<HTMLElement>("time")].map((time) => {
          const box = time.getBoundingClientRect();
          return [time.dataset.testid!, { text: time.textContent ?? "", width: box.width, height: box.height, hidden: getComputedStyle(time).visibility === "hidden", title: time.getAttribute("title") }];
        }),
      );
    const top = () => container.querySelector<HTMLElement>('[data-testid="after"]')!.getBoundingClientRect().top;
    const before = read();
    const beforeTop = top();
    const errors: string[] = [];
    const root = hydrateRoot(container, times, { onRecoverableError: (error) => errors.push(String(error)) });
    const timer = window.setTimeout(() => setReport({ before, after: read(), afterTop: [beforeTop, top()], errors }), 300);
    return () => {
      window.clearTimeout(timer);
      root.unmount();
    };
  };
  return (
    <Page description="The server's markup, measured, then hydrated in this browser's zone." title="Local time, hydrated">
      <Block title="Server render, then hydration">
        <Frame width={560}>
          <div ref={host} />
        </Frame>
        <pre data-testid="hydration-report" style={{ margin: 0, fontFamily: "var(--fui-font-mono)", fontSize: "var(--fui-text-xs)", whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
          {report ? JSON.stringify(report, null, 1) : "measuring"}
        </pre>
      </Block>
    </Page>
  );
}

export const LocalTimeHydration: Story = { render: () => <Hydration /> };

// The same, with no locale anywhere: a reader whose language would write the hour differently sees the same shape before and
// after hydration, in English, with the reader's zone arriving on hydration.
export const LocalTimeDefaultHydration: Story = { render: () => <Hydration times={<DefaultReaderTimes />} /> };
