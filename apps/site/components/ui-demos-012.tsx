"use client";

// Previews for the pieces added in 0.12: the foundations a page is built on, the states and the clock of a screen, the
// answers and steps of a lesson, and sound. Synthetic data only, and nothing runs until a person presses something.
import { useId, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { ClipboardCopy, Download } from "lucide-react";
import {
  ActionBar,
  Announcer,
  AnnotationList,
  ariaKeyshortcuts,
  BackButton,
  Bdi,
  Button,
  ChoiceGroup,
  ChoiceOption,
  ClipButton,
  ClipError,
  ClipNote,
  copyImage,
  copyText,
  Countdown,
  dirOf,
  downloadFile,
  ErrorBoundary,
  ErrorState,
  fileStem,
  ForeignText,
  formatCount,
  InlineConfirm,
  interpolate,
  Kbd,
  KbdGroup,
  LabelsProvider,
  LocalTime,
  MarkedText,
  MultiSelect,
  plural,
  ProductLockup,
  RatingBar,
  RecorderPanelView,
  RelativeTime,
  RevealCard,
  scriptDirection,
  serializeSvg,
  speakableText,
  speechChunks,
  SpeedToggle,
  StatePage,
  StepControls,
  svgToPng,
  Textarea,
  TextDiff,
  ThemeProvider,
  ThemeSwitcher,
  ToggleGroup,
  ToggleGroupItem,
  useAnnounce,
  useClipPlayer,
  useCountdown,
  useElementSize,
  useHotkeys,
  useIsMobile,
  useMediaQuery,
  useResolvedTokens,
  useSpeech,
  useStepPlayer,
  useTheme,
  useViewportInsets,
  type ClipLoader,
  type ThemePreference,
} from "@fabrials/ui";
import { Frame } from "@/components/demo-frame";

const column = { display: "grid", gap: "var(--fui-space-3)", inlineSize: "100%" } as const;
const rows = { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "var(--fui-space-2)" } as const;
const note = { margin: 0, color: "var(--muted-foreground)" } as const;
const mono = { margin: 0, fontFamily: "var(--fui-font-label)", fontSize: "var(--fui-text-label)", color: "var(--muted-foreground)" } as const;
const plate = {
  display: "grid",
  gap: "var(--fui-space-3)",
  padding: "var(--fui-space-4)",
  border: "1px solid var(--border)",
  borderRadius: "var(--fui-radius-lg)",
  background: "var(--card)",
} as const;

/* ---------------------------------------------------------------- foundations */

const SENT_AT = "2026-09-27T07:31:00Z";
const SENT_DAY = new Date("2026-09-27T12:00:00Z");
const timeRows = { display: "grid", gridTemplateColumns: "auto auto", gap: "var(--fui-space-1) var(--fui-space-5)", margin: 0 } as const;
const timeTerm = { color: "var(--muted-foreground)" } as const;

function LocalTimeDemo() {
  return (
    <Frame width="form">
      <dl style={timeRows}>
        {(["time", "message", "dateTime", "date", "shortDate"] as const).map((format) => (
          <div key={format} style={{ display: "contents" }}>
            <dt style={timeTerm}>{format}</dt>
            <dd style={{ margin: 0 }}>
              <LocalTime format={format} locale="en" now={SENT_DAY} value={SENT_AT} />
            </dd>
          </div>
        ))}
      </dl>
      <p style={note}>
        In Madrid: <LocalTime format="dateTime" locale="en-GB" timeZone="Europe/Madrid" value={SENT_AT} />
      </p>
    </Frame>
  );
}

function HotkeysDemo() {
  const [last, setLast] = useState("Nothing pressed yet.");
  const scope = useRef<HTMLDivElement>(null);
  useHotkeys(
    {
      "1": () => setLast("You picked the first answer."),
      "2": () => setLast("You picked the second answer."),
      "mod+k": { handler: () => setLast("The search would open here."), whenTyping: true },
    },
    { scope },
  );
  return (
    <Frame width="form">
      <div ref={scope} style={plate} tabIndex={0}>
        <p style={{ margin: 0 }}>Focus this panel, then press a key.</p>
        <p style={{ margin: 0, color: "var(--muted-foreground)" }} role="status">
          {last}
        </p>
        <KbdGroup>
          <span>
            <Kbd>1</Kbd> first answer
          </span>
          <span>
            <Kbd>2</Kbd> second answer
          </span>
          <span>
            <Kbd>Ctrl</Kbd>
            <Kbd>K</Kbd> search
          </span>
        </KbdGroup>
      </div>
      <div style={rows}>
        <Button aria-keyshortcuts={ariaKeyshortcuts("mod+k")} size="sm" variant="secondary">
          Search
        </Button>
        <span style={note}>The name of the key is on the button, so a screen reader can read it.</span>
      </div>
    </Frame>
  );
}

function Broken({ broken }: { broken: boolean }) {
  if (broken) throw new Error("The chart specification has no series.");
  return <p style={{ margin: 0 }}>A small diagram of three series, drawn without leaving the page.</p>;
}

function ErrorBoundaryDemo() {
  const [broken, setBroken] = useState(false);
  return (
    <Frame width="form">
      <ErrorBoundary onReset={() => setBroken(false)} resetKey={broken}>
        <Broken broken={broken} />
      </ErrorBoundary>
      <div style={rows}>
        <Button onClick={() => setBroken(true)} size="sm" variant="secondary">
          Break this part
        </Button>
        <span style={note}>The page around it stays usable.</span>
      </div>
    </Frame>
  );
}

const CHART = [12, 20, 9, 26, 17];

function ExportDemo() {
  const drawing = useRef<SVGSVGElement>(null);
  const [said, setSaid] = useState("");
  return (
    <Frame width="form">
      <svg aria-label="Sign-ups over five weeks" ref={drawing} role="img" style={{ inlineSize: "100%", blockSize: "auto" }} viewBox="0 0 260 64">
        {CHART.map((height, index) => (
          <rect fill="var(--brand)" height={height} key={index} width="22" x={index * 48 + 10} y={64 - height} />
        ))}
        <line stroke="var(--border)" strokeWidth="1" x1="0" x2="260" y1="63.5" y2="63.5" />
      </svg>
      <div style={rows}>
        <Button
          onClick={() => {
            const text = serializeSvg(drawing.current!, { background: "var(--card)" });
            downloadFile(`${fileStem("Sign-ups / Q3", "chart")}.svg`, text, "image/svg+xml");
            setSaid("The drawing is saved as sign-ups-q3.svg.");
          }}
          size="sm"
          variant="secondary"
        >
          <Download aria-hidden /> Download the SVG
        </Button>
        <Button
          onClick={() =>
            void (async () => {
              try {
                await copyImage(await svgToPng(drawing.current!, { scale: 2 }));
                setSaid("The picture is on the clipboard.");
              } catch {
                setSaid("This browser did not allow the clipboard.");
              }
            })()
          }
          size="sm"
          variant="secondary"
        >
          <ClipboardCopy aria-hidden /> Copy as PNG
        </Button>
        <Button
          onClick={() =>
            void (async () => {
              try {
                await copyText(fileStem("Sign-ups / Q3", "chart"));
                setSaid("The name of the file is on the clipboard.");
              } catch {
                setSaid("This browser did not allow the clipboard.");
              }
            })()
          }
          size="sm"
          variant="ghost"
        >
          Copy the name
        </Button>
      </div>
      <p style={note} role="status">
        {said || "Nothing leaves the page: the file is made from the drawing above."}
      </p>
    </Frame>
  );
}

const SWATCHES = ["--chart-1", "--chart-2", "--chart-3", "--chart-4", "--chart-5", "--chart-6"] as const;

function ResolvedTokensDemo() {
  const { theme, colors } = useResolvedTokens(SWATCHES);
  return (
    <Frame width="form">
      <p style={note}>The {theme} theme, as values a canvas or a chart library can paint with.</p>
      <ul style={{ display: "grid", gap: "var(--fui-space-2)", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", listStyle: "none", margin: 0, padding: 0 }}>
        {SWATCHES.map((name) => (
          <li key={name} style={{ display: "grid", gap: "var(--fui-space-1)" }}>
            <span aria-hidden style={{ background: `var(${name})`, blockSize: "2.5rem", borderRadius: "var(--fui-radius-sm)" }} />
            <code style={mono}>{name}</code>
            <code style={{ margin: 0, fontFamily: "var(--fui-font-label)", fontSize: "var(--fui-text-label)" }}>{colors[name] ?? "…"}</code>
          </li>
        ))}
      </ul>
    </Frame>
  );
}

const WORD_FACTS = [
  ["dirOf(\"ar-EG\")", dirOf("ar-EG")],
  ["dirOf(\"pa-PK\")", dirOf("pa-PK")],
  ["scriptDirection(\"123\")", scriptDirection("123") ?? "none"],
] as const;

function ForeignTextDemo() {
  return (
    <Frame width="form">
      <p style={{ margin: 0, lineHeight: 1.7 }}>
        The Arabic word <ForeignText lang="ar">كتاب</ForeignText> means book, and the Hebrew <ForeignText lang="he">שלום</ForeignText> is hello. A name nobody tagged is isolated too:{" "}
        <Bdi>مريم</Bdi> and <Bdi>Ada Rivera</Bdi>.
      </p>
      <p style={{ margin: 0, lineHeight: 1.7 }}>
        {interpolate("With markup in it: the word {word} means {meaning}.", {
          word: <ForeignText lang="ar">كتاب</ForeignText>,
          meaning: "book",
        })}
      </p>
      <dl style={{ display: "grid", gap: "var(--fui-space-1)", margin: 0 }}>
        {WORD_FACTS.map(([call, answer]) => (
          <div key={call} style={{ display: "flex", gap: "var(--fui-space-2)" }}>
            <dt style={mono}>{call}</dt>
            <dd style={{ margin: 0, fontSize: "var(--fui-text-sm)" }}>{answer}</dd>
          </div>
        ))}
      </dl>
    </Frame>
  );
}

function AnnouncerDemo() {
  return (
    <Announcer>
      <Announcing />
    </Announcer>
  );
}

function Announcing() {
  const announce = useAnnounce();
  const [said, setSaid] = useState("Nothing yet.");
  return (
    <Frame width="form">
      <div style={rows}>
        <Button
          onClick={() => {
            announce("Draft saved");
            setSaid("“Draft saved”, politely, when the reader has finished the sentence they are on.");
          }}
          size="sm"
          variant="secondary"
        >
          Save the draft
        </Button>
        <Button
          onClick={() => {
            announce("The connection was lost", { assertive: true });
            setSaid("“The connection was lost”, which interrupts.");
          }}
          size="sm"
          variant="ghost"
        >
          Lose the connection
        </Button>
      </div>
      <p style={note}>Said to a screen reader: {said}</p>
    </Frame>
  );
}

function ElementSizeDemo() {
  const [inlineSize, setInlineSize] = useState(24);
  const { ref, width, height } = useElementSize<HTMLDivElement>();
  const wide = useMediaQuery("(min-width: 64rem)", true);
  const phone = useIsMobile();
  return (
    <Frame width="form">
      <div ref={ref} style={{ ...plate, inlineSize: `${inlineSize}rem`, maxInlineSize: "100%" }}>
        <p style={{ margin: 0 }}>
          content {Math.round(width)} × {Math.round(height)} px
        </p>
        <p style={note}>Kept current as the box changes, without an observer of your own.</p>
      </div>
      <div style={rows}>
        {[16, 24, 30].map((size) => (
          <Button key={size} onClick={() => setInlineSize(size)} size="sm" variant={size === inlineSize ? "default" : "secondary"}>
            {size} rem
          </Button>
        ))}
        <span style={note}>
          {wide ? "a wide window" : "a narrow window"}, {phone ? "a phone" : "a pointer"}
        </span>
      </div>
    </Frame>
  );
}

const MAIL_AGO = new Date("2026-09-27T11:57:00Z");
const SPANISH_LABELS = {
  multiSelect: {
    placeholder: "Seleccionar un proveedor",
    more: (count: number, locale: Intl.LocalesArgument) => `y ${formatCount(count, locale)} más`,
    clear: (label: string) => `Quitar ${label}`,
  },
  filterChip: { clear: (label: string, value: string) => `Quitar el filtro ${label} (${value})` },
};
const PROVIDERS = [
  { value: "grok", label: "Grok" },
  { value: "claude", label: "Claude" },
  { value: "codex", label: "Codex" },
  { value: "nous", label: "Nous" },
];

function LabelsDemo() {
  const [locale, setLocale] = useState<"en" | "es">("en");
  const [providers, setProviders] = useState<string[]>(["grok", "claude", "codex"]);
  return (
    <Frame width="form">
      <ToggleGroup
        aria-label="Language of the page"
        onValueChange={(next) => setLocale(next[0] === "es" ? "es" : "en")}
        value={[locale]}
      >
        <ToggleGroupItem value="en">English</ToggleGroupItem>
        <ToggleGroupItem value="es">Español</ToggleGroupItem>
      </ToggleGroup>
      <LabelsProvider labels={locale === "es" ? SPANISH_LABELS : undefined} locale={locale}>
        <div style={column}>
          <p style={{ margin: 0 }}>
            Updated <RelativeTime date={MAIL_AGO} locale={locale} now={SENT_DAY.getTime()} timeZone="UTC" />.
          </p>
          <p style={{ margin: 0 }}>
            {formatCount(1204, locale)} messages, sent from {plural(3, { one: "{count} mailbox", other: "{count} mailboxes" }, locale)}.
          </p>
          <MultiSelect
            id="label-providers"
            label={locale === "es" ? "Proveedores" : "Providers"}
            onValueChange={setProviders}
            options={PROVIDERS}
            value={providers}
          />
        </div>
      </LabelsProvider>
    </Frame>
  );
}

function ScopedTheme() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  return (
    <div style={{ display: "grid", gap: "var(--fui-space-3)" }}>
      <p style={{ margin: 0 }}>This part is painted in the {resolvedTheme} theme.</p>
      <ThemeSwitcher onValueChange={(next: ThemePreference) => setTheme(next)} value={theme} />
    </div>
  );
}

function ThemeProviderDemo() {
  const scope = useRef<HTMLDivElement>(null);
  return (
    <Frame width="form">
      <div style={{ ...plate, gap: "var(--fui-space-4)" }}>
        <p style={{ margin: 0 }}>The page keeps its own theme; this part has one of its own.</p>
        <div
          data-skeleton="hide"
          ref={scope}
          style={{ background: "var(--background)", borderRadius: "var(--fui-radius-md)", color: "var(--foreground)", padding: "var(--fui-space-4)" }}
        >
          <ThemeProvider defaultTheme="light" storageKey="fui-docs-theme-preview" target={scope}>
            <ScopedTheme />
          </ThemeProvider>
        </div>
      </div>
    </Frame>
  );
}

/* ---------------------------------------------------------------- states and time */

function InlineConfirmDemo() {
  const [open, setOpen] = useState(false);
  const [ended, setEnded] = useState(false);
  return (
    <Frame width="form">
      <InlineConfirm
        cancelLabel="Keep going"
        confirmLabel="End session"
        description="What you answered so far is kept."
        onCancel={() => setOpen(false)}
        onConfirm={() => {
          setEnded(true);
          setOpen(false);
        }}
        open={open}
        title="End the session early?"
      />
      <div style={rows}>
        <Button onClick={() => setOpen(true)} variant="outline">
          End session
        </Button>
        <span style={note}>{ended ? "Session ended." : "Step 3 of 12"}</span>
      </div>
    </Frame>
  );
}

const COUNT_DEADLINE = Date.UTC(2026, 10, 10, 9, 5, 8);
const COUNT_NOW = Date.UTC(2026, 10, 10, 9, 0, 0);

function CountdownDemo() {
  const [started, setStarted] = useState(false);
  return (
    <Frame width="form">
      <Countdown deadline={COUNT_DEADLINE} label="Section 2" now={COUNT_NOW} />
      <Countdown deadline={COUNT_DEADLINE - 245_000} now={COUNT_NOW} />
      <Countdown deadline={COUNT_DEADLINE - 260_000} hideLabel label="Section 3 closes in" now={COUNT_NOW} size="sm" />
      <div style={rows}>
        <Button onClick={() => setStarted(true)} size="sm" variant="secondary">
          Start a real countdown
        </Button>
        <span style={note}>{started ? "It runs from this press, in the reader's own digits." : "The clocks above hold still at a fixed moment."}</span>
      </div>
      {started ? <RunningCountdown /> : null}
    </Frame>
  );
}

function RunningCountdown() {
  const [deadline] = useState(() => Date.now() + 90_000);
  const { seconds, done } = useCountdown(deadline);
  return <p style={{ margin: 0 }}>{done ? "Time is up." : `${seconds ?? 0} seconds left.`}</p>;
}

function StatePageDemo() {
  return (
    <Frame width="wide">
      <div style={{ border: "1px solid var(--border)", borderRadius: "var(--fui-radius-lg)", overflow: "clip" }}>
        <StatePage
          actions={
            <>
              <Button size="sm">Go home</Button>
              <Button size="sm" variant="outline">
                Search the site
              </Button>
            </>
          }
          as="div"
          brand={<ProductLockup gem="zircon" product="Fabrials" size="sm" />}
          code="404"
          description="The link may be old, or the page may have moved."
          style={{ "--fui-state-page-size": "19rem" } as CSSProperties}
          title="This page is not here"
        />
      </div>
      <div style={{ ...plate, gap: "var(--fui-space-4)" }}>
        <ErrorState
          description="The inbox could not be read. Try again; if it keeps failing, quote the reference."
          onRetry={() => {}}
          reference="7f3c21"
          title="Messages did not load"
        />
        <div style={rows}>
          <BackButton fallbackHref="/docs/state-page" onNavigate={() => {}}>
            Go back
          </BackButton>
          <span style={note}>A key back, and the way home in the state above.</span>
        </div>
      </div>
    </Frame>
  );
}

function ActionBarDemo() {
  const [step, setStep] = useState(2);
  const panel = useRef<HTMLDivElement>(null);
  useViewportInsets({ target: panel });
  return (
    <Frame width="wide">
      <div ref={panel} style={{ border: "1px solid var(--border)", borderRadius: "var(--fui-radius-lg)", overflow: "auto", maxBlockSize: "18rem" }}>
        <div style={{ padding: "var(--fui-space-4)", display: "grid", gap: "var(--fui-space-3)" }}>
          <p style={{ margin: 0 }}>
            Write the sentence in the past tense: “Yesterday I went to the harbour and bought two apples.”
          </p>
          <p style={note}>
            A bar sits at the end of the part that scrolls, clear of the device&apos;s safe area, and says how tall it is so a
            question above it can scroll clear.
          </p>
          <p style={note}>It stays while the words above move, and rises when an on-screen keyboard covers the page.</p>
          <ActionBar
            aria-label="Step"
            end={
              <>
                <Button disabled={step <= 1} onClick={() => setStep(step - 1)} size="sm" variant="secondary">
                  Back
                </Button>
                <Button disabled={step >= 8} onClick={() => setStep(step + 1)} size="sm">
                  Check
                </Button>
              </>
            }
            start={<span style={note}>Question {step} of 8</span>}
          />
        </div>
      </div>
    </Frame>
  );
}

/* ---------------------------------------------------------------- answers and steps */

const ANSWERS = [
  { value: "orchard", label: "orchard", description: "a place where fruit trees grow" },
  { value: "harbour", label: "harbour", description: "a place where ships shelter" },
  { value: "quarry", label: "quarry", description: "a place where stone is cut" },
  { value: "bridge", label: "bridge" },
];

function ChoiceGroupDemo() {
  const question = useId();
  const [picked, setPicked] = useState<string | null>(null);
  return (
    <Frame width="form">
      <p id={question} style={{ margin: 0 }}>
        Which of these is a place where ships shelter?
      </p>
      <ChoiceGroup aria-labelledby={question} onValueChange={setPicked} value={picked}>
        {ANSWERS.map((answer) => (
          <ChoiceOption description={answer.description} key={answer.value} value={answer.value}>
            {answer.label}
          </ChoiceOption>
        ))}
      </ChoiceGroup>
      <p style={note}>{picked ? `You picked “${picked}”.` : "Pick one: the arrow keys move between the answers."}</p>
    </Frame>
  );
}

const RATINGS = [
  { value: "again", label: "Again", hint: "In a minute", tone: "danger" as const },
  { value: "hard", label: "Hard", hint: "In 2 days", tone: "warning" as const },
  { value: "good", label: "Good", hint: "In 4 days" },
  { value: "easy", label: "Easy", hint: "In 9 days", tone: "success" as const },
];

function RevealCardDemo() {
  const [revealed, setRevealed] = useState(false);
  const [rating, setRating] = useState<string | null>(null);
  return (
    <Frame width="form">
      <RevealCard
        back={
          <>
            <span lang="ar" dir="rtl" style={{ fontSize: "var(--fui-text-xl)" }}>
              مَرْفَأ
            </span>
            <p style={{ margin: 0 }}>harbour: a place where ships shelter from weather.</p>
          </>
        }
        front={
          <p style={{ margin: 0, fontSize: "var(--fui-text-xl)" }} lang="ar" dir="rtl">
            مَرْفَأ
          </p>
        }
        label="Card 3 of 20"
        onRevealedChange={setRevealed}
        revealed={revealed}
      >
        <RatingBar label="How well did you know it?" onRate={setRating} options={RATINGS} />
      </RevealCard>
      <p style={note}>
        {rating ? `Rated ${rating}.` : revealed ? "Rate it, or go on to the next card." : "Press Space, or the button, to see the answer."}
      </p>
    </Frame>
  );
}

const FRAMES = [
  "Compare 4 and 7: they are in order.",
  "Swap them: 7, 4.",
  "Compare 7 and 2: swap.",
  "Now 4, 2: compare again.",
  "Nothing left to swap: the list is sorted.",
];

function StepControlsDemo() {
  const player = useStepPlayer({ count: FRAMES.length, defaultIndex: 0, interval: 1400 });
  return (
    <Frame width="form">
      <div style={plate}>
        <p style={mono}>Frame {player.index + 1}</p>
        <p style={{ margin: 0 }}>{FRAMES[player.index]}</p>
      </div>
      <StepControls {...player} aria-label="Frames of the sort" reset speeds={[0.5, 1, 2]} />
      <p style={note}>Play runs from a press; a step taken by hand pauses it.</p>
    </Frame>
  );
}

const WRITTEN = "Je suis allé au marché et j'ai achete des pommes.";
const MARKED = [
  { id: "agreement", start: WRITTEN.indexOf("achete"), end: WRITTEN.indexOf("achete") + "achete".length, severity: "error" as const, label: "Mistake" },
  { id: "style", start: WRITTEN.indexOf("marché"), end: WRITTEN.indexOf("marché") + "marché".length, severity: "note" as const, label: "Note" },
];
const ANNOTATIONS = [
  {
    id: "agreement",
    severity: "error" as const,
    title: "Agreement",
    before: "achete",
    after: "acheté",
    children: "The past participle of an -er verb ends in -é.",
  },
  {
    id: "style",
    severity: "note" as const,
    title: "A fact worth keeping",
    children: "au marché is the usual way to say at the market.",
  },
];

function MarkedTextDemo() {
  return (
    <Frame width="form">
      <MarkedText lang="fr" ranges={MARKED} text={WRITTEN} />
      <AnnotationList items={ANNOTATIONS} textDir="ltr" textLang="fr" />
      <TextDiff after="j'ai acheté des pommes" before="j'ai achete des pommes" lang="fr" legend />
    </Frame>
  );
}

/* ---------------------------------------------------------------- sound */

function toneWav(frequency = 440, seconds = 1, sampleRate = 8000): Blob {
  const count = Math.round(seconds * sampleRate);
  const buffer = new ArrayBuffer(44 + count * 2);
  const view = new DataView(buffer);
  const write = (offset: number, text: string) => {
    for (let at = 0; at < text.length; at += 1) view.setUint8(offset + at, text.charCodeAt(at));
  };
  write(0, "RIFF");
  view.setUint32(4, 36 + count * 2, true);
  write(8, "WAVE");
  write(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  write(36, "data");
  view.setUint32(40, count * 2, true);
  const fade = Math.min(count / 2, sampleRate * 0.02);
  for (let at = 0; at < count; at += 1) {
    const envelope = Math.min(1, at / fade, (count - 1 - at) / fade);
    view.setInt16(44 + at * 2, Math.round(Math.sin((2 * Math.PI * frequency * at) / sampleRate) * 0.2 * envelope * 32767), true);
  }
  return new Blob([buffer], { type: "audio/wav" });
}

const CLIP_WORDS = ["harbour", "orchard", "quarry"] as const;

// The host's loader: here a tone built in the page, so nothing comes from the network and nobody's voice is used.
const loadTone: ClipLoader = async (ref, { speed }) => {
  if (ref === "missing") throw new ClipError("unavailable");
  const position = Math.max(0, CLIP_WORDS.indexOf(ref as (typeof CLIP_WORDS)[number]));
  return toneWav((speed === "slow" ? 220 : 330) + position * 55, speed === "slow" ? 1.2 : 0.8);
};

function ClipButtonDemo() {
  const player = useClipPlayer({ load: loadTone });
  return (
    <Frame width="form">
      <ul style={{ display: "grid", gap: "var(--fui-space-2)", listStyle: "none", margin: 0, padding: 0 }}>
        {CLIP_WORDS.map((word) => (
          <li key={word} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--fui-space-3)" }}>
            <span>{word}</span>
            <ClipButton clip={word} iconOnly label={`Listen to ${word}`} player={player} size="sm" />
          </li>
        ))}
      </ul>
      <div style={rows}>
        <ClipButton clip="harbour" label="Hear the first word" player={player} />
        <SpeedToggle player={player} />
      </div>
      <ClipNote player={player} />
    </Frame>
  );
}

function RecorderPanelDemo() {
  const [typing, setTyping] = useState(false);
  if (typing)
    return (
      <Frame width="form">
        <Textarea aria-label="Your answer" placeholder="Type your answer" rows={3} />
        <Button onClick={() => setTyping(false)} size="sm" variant="ghost">
          Use the microphone
        </Button>
      </Frame>
    );
  return (
    <Frame width="form">
      <RecorderPanelView
        fallback={
          <Button onClick={() => setTyping(true)} variant="ghost">
            Type instead
          </Button>
        }
        maxDurationMs={40_000}
        status="idle"
      />
      <p style={note}>Nothing is recorded until the record key is pressed, and the take stays on this device.</p>
    </Frame>
  );
}

const READ_ANSWER =
  "The harbour opens at six. Bring a warm coat: the wind comes off the water all morning, and the ferry waits for nobody.";

function SpeechDemo() {
  const speech = useSpeech({ lang: "en", fallback: "browser" });
  const [said, setSaid] = useState("");
  const pieces = speechChunks(speakableText(READ_ANSWER), 70);
  return (
    <Frame width="form">
      <p style={{ margin: 0, lineHeight: 1.7 }}>{READ_ANSWER}</p>
      <div style={rows}>
        <Button
          onClick={() => {
            if (speech.speaking) {
              speech.stop();
              setSaid("Stopped.");
              return;
            }
            setSaid("Reading, one piece at a time.");
            void speech.speak(speakableText(READ_ANSWER), { id: "answer" });
          }}
          size="sm"
          variant="secondary"
        >
          {speech.speaking ? "Stop" : "Read aloud"}
        </Button>
        {speech.loading ? <span style={note}>Loading the first piece…</span> : null}
      </div>
      <ol style={{ display: "grid", gap: "var(--fui-space-1)", margin: 0, paddingInlineStart: "1.2rem" }}>
        {pieces.map((piece) => (
          <li key={piece} style={{ fontSize: "var(--fui-text-sm)" }}>
            {piece}
          </li>
        ))}
      </ol>
      <p style={note}>{said || "Plain words first; then a piece at a time, so a long answer is not one breath."}</p>
    </Frame>
  );
}

/* ---------------------------------------------------------------- the map */

export const demos012: Record<string, () => ReactNode> = {
  "local-time": () => <LocalTimeDemo />,
  hotkeys: () => <HotkeysDemo />,
  "error-boundary": () => <ErrorBoundaryDemo />,
  export: () => <ExportDemo />,
  "resolved-tokens": () => <ResolvedTokensDemo />,
  "foreign-text": () => <ForeignTextDemo />,
  announcer: () => <AnnouncerDemo />,
  "element-size": () => <ElementSizeDemo />,
  labels: () => <LabelsDemo />,
  "theme-provider": () => <ThemeProviderDemo />,
  "inline-confirm": () => <InlineConfirmDemo />,
  countdown: () => <CountdownDemo />,
  "state-page": () => <StatePageDemo />,
  "action-bar": () => <ActionBarDemo />,
  "choice-group": () => <ChoiceGroupDemo />,
  "reveal-card": () => <RevealCardDemo />,
  "step-controls": () => <StepControlsDemo />  ,
  "marked-text": () => <MarkedTextDemo />,
  "clip-button": () => <ClipButtonDemo />,
  "recorder-panel": () => <RecorderPanelDemo />,
  speech: () => <SpeechDemo />,
};
