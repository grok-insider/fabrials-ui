"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Minus, Pause, Play, Plus, RotateCcw, Volume2, VolumeX } from "lucide-react";
import {
  Button,
  CopyButton,
  Field,
  Input,
  NativeSelect,
  NativeSelectOption,
  StatusDot,
  ToggleGroup,
  ToggleGroupItem,
} from "@fabrials/ui";
import { CoffeeMachine } from "@/components/coffee-machine";
import { CoffeeComparison, CoffeeReviewDialog, useCoffeeStore, type CoffeeStore } from "@/components/coffee-demo";
import { TourAgentPanel } from "@/components/tour-agent-panel";
import { ArgumentsForm } from "@/registry/components/arguments-form";
import { Comparison } from "@/registry/components/comparison";
import { ExecutionLog } from "@/registry/components/execution-log";
import { useWebMCP, WebMCPProvider } from "@/registry/webmcp/provider";
import { coffeeProducts } from "@/lib/coffee-demo";
import { tourSnapshot } from "@/lib/coffee-tour";
import { landingTourDuration as tourDuration } from "@/lib/landing-tour";
import captions from "@/video/remotion/captions.json";
import timing from "@/video/remotion/timing.json";
import "./demo.css";

type Mode = "tour" | "free";

const money = new Intl.NumberFormat("en", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

/**
 * The home page demo: the same fictional store, either narrated (a 53 s tour
 * with the agent's tool calls beside it) or free, with its WebMCP tools
 * registered for the visitor's own agent.
 */
export function HomeDemo() {
  const [mode, setMode] = useState<Mode>("tour");
  return (
    <div className="demo" data-mode={mode}>
      <div className="demo-bar">
        <ToggleGroup
          aria-label="Demo mode"
          size="sm"
          value={[mode]}
          onValueChange={(next) => next[0] && setMode(next[0] as Mode)}
        >
          <ToggleGroupItem value="tour">Narrated tour</ToggleGroupItem>
          <ToggleGroupItem value="free">Try it yourself</ToggleGroupItem>
        </ToggleGroup>
        <p className="demo-bar-note">
          {mode === "tour"
            ? "The morning ritual: a fictional coffee store, 53 seconds with sound."
            : "The same store, live. Its tools are registered for your browser's agent. No payments."}
        </p>
      </div>
      {mode === "tour" ? (
        <NarratedTour />
      ) : (
        <WebMCPProvider>
          <FreeStore />
        </WebMCPProvider>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- narrated

const chapterTitles = [
  { title: "A better morning", detail: "One task, one shared interface." },
  { title: "Set the requirements", detail: "32 cm of space, 58 mm accessories." },
  { title: "Compare the evidence", detail: "A recommendation with its reasons." },
  { title: "Build a selection", detail: "One machine and a compatible filter." },
  { title: "Review the choice", detail: "A correction, then your decision." },
];

const chapters = chapterTitles.map((chapter, index) => {
  const start = timing.scenes[index]!.from / timing.fps;
  const end = Math.min(tourDuration, (timing.scenes[index + 1]?.from ?? timing.durationInFrames) / timing.fps);
  return { ...chapter, start, end };
});

function NarratedTour() {
  const media = useRef<HTMLAudioElement>(null);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const state = tourSnapshot(time);
  const finished = time >= tourDuration - 0.1;
  const index = Math.max(0, chapters.findLastIndex((chapter) => time >= chapter.start));
  const chapter = chapters[index]!;
  // While paused between lines, show the chapter's next line so the page never reads blank.
  const caption =
    captions.find((c) => time >= c.start && time < c.end)?.text ??
    (playing || time === 0 ? undefined : captions.find((c) => c.start >= time && c.start < chapter.end)?.text);

  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    const tick = () => {
      const audio = media.current;
      if (audio) {
        if (audio.currentTime >= tourDuration) audio.pause();
        setTime(Math.min(audio.currentTime, tourDuration));
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing]);

  useEffect(() => {
    const audio = media.current;
    // Another player starting on the page pauses the tour.
    const stop = (event: Event) => {
      if (event.target instanceof HTMLMediaElement && event.target !== audio) audio?.pause();
    };
    document.addEventListener("play", stop, true);
    return () => {
      audio?.pause();
      document.removeEventListener("play", stop, true);
    };
  }, []);

  async function play() {
    const audio = media.current;
    if (!audio) return;
    setError("");
    setLoading(true);
    try {
      if (audio.error) audio.load();
      if (finished) {
        audio.currentTime = 0;
        setTime(0);
      }
      await audio.play();
    } catch {
      setError("The narration could not start. Try again, or move through the chapters without sound.");
    } finally {
      setLoading(false);
    }
  }

  function seek(seconds: number) {
    if (media.current) media.current.currentTime = seconds;
    setTime(seconds);
  }

  return (
    <>
      <audio
        ref={media}
        src="/api/demo-media/landing-audio.m4a?v=1"
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setTime(tourDuration);
        }}
        onError={() => {
          setPlaying(false);
          setLoading(false);
          setError("The narration is unavailable right now. Move through the chapters without sound.");
        }}
      />
      <div className="demo-body">
        <div className="demo-stage">
          <header className="demo-chapter">
            <p>
              Chapter {index + 1} of {chapters.length}
            </p>
            <h3>{finished ? "Your choice, your decision." : chapter.title}</h3>
            <p>{finished ? "Now try the same store yourself." : chapter.detail}</p>
          </header>
          <dl className="demo-needs" aria-label="The shopper's requirements">
            <div>
              <dt>Counter</dt>
              <dd>32 cm</dd>
            </div>
            <div>
              <dt>Accessories</dt>
              <dd>58 mm</dd>
            </div>
          </dl>
          <Comparison
            caption="Find your fit"
            columns={coffeeProducts.map((product) => ({
              id: product.id,
              title: product.name,
              subtitle: money.format(product.price),
              visual: <CoffeeMachine color={product.color} className="mx-auto h-24 w-full max-w-40" />,
              action: (
                <span className="demo-choice" data-selected={state.id === product.id || undefined}>
                  {state.id === product.id ? (
                    <>
                      <Check aria-hidden className="size-3.5" /> Selected
                    </>
                  ) : (
                    "Available"
                  )}
                </span>
              ),
            }))}
            rows={[
              {
                id: "space",
                label: "Counter space",
                highlighted: state.compared,
                values: {
                  studio: <Reason value="29 cm" note={state.compared ? "Fits your space" : undefined} good />,
                  atelier: <Reason value="36 cm" note={state.compared ? "Too wide" : undefined} />,
                },
              },
              {
                id: "fitting",
                label: "Accessory fit",
                highlighted: state.compared,
                values: {
                  studio: <Reason value="58 mm" note={state.compared ? "Keeps your accessories" : undefined} good />,
                  atelier: <Reason value="54 mm" note={state.compared ? "Different fitting" : undefined} />,
                },
              },
              {
                id: "milk",
                label: "Two flat whites",
                values: { studio: "Independent steam", atelier: "Independent steam" },
              },
            ]}
          />
        </div>
        <TourAgentPanel time={time} />
      </div>
      <div className="demo-transport">
        <p className="demo-caption" aria-label="Subtitles">
          {caption ??
            (time === 0
              ? "Press play to follow one task from a requirement to a reviewed selection."
              : finished
                ? "Built with Fabrials UI. Switch to Try it yourself to use the same tools."
                : "\u00a0")}
        </p>
        <div className="demo-controls">
          <Button onClick={() => (playing ? media.current?.pause() : void play())} disabled={loading} size="sm">
            {playing ? <Pause aria-hidden /> : <Play aria-hidden />}
            {loading ? "Loading" : playing ? "Pause" : finished ? "Play again" : time > 0 ? "Resume" : "Play the tour"}
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label="Back to the start"
            onClick={() => {
              media.current?.pause();
              seek(0);
            }}
          >
            <RotateCcw />
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label={muted ? "Turn the sound on" : "Mute"}
            aria-pressed={muted}
            onClick={() => {
              if (media.current) media.current.muted = !muted;
              setMuted(!muted);
            }}
          >
            {muted ? <VolumeX /> : <Volume2 />}
          </Button>
          {/* The chapters are the timeline: click anywhere in one to go there. */}
          <ol className="demo-chapters" aria-label="Chapters">
            {chapters.map((item, i) => {
              const progress = Math.min(1, Math.max(0, (time - item.start) / (item.end - item.start)));
              return (
                <li key={item.title} style={{ flexGrow: item.end - item.start }}>
                  <button
                    type="button"
                    onClick={(event) => {
                      const box = event.currentTarget.getBoundingClientRect();
                      // A pointer click seeks within the chapter; the keyboard goes to its start.
                      const share = event.detail > 0 && box.width > 0 ? Math.min(1, Math.max(0, (event.clientX - box.left) / box.width)) : 0;
                      seek(item.start + share * (item.end - item.start));
                    }}
                    aria-current={i === index ? "step" : undefined}
                    aria-label={`Chapter ${i + 1}: ${item.title}`}
                  >
                    <span className="demo-chapter-fill" style={{ transform: `scaleX(${progress})` }} />
                    <span className="demo-chapter-label">{item.title}</span>
                  </button>
                </li>
              );
            })}
          </ol>
          <span className="demo-time" aria-label={`${Math.floor(time)} of ${Math.ceil(tourDuration)} seconds`}>
            {Math.floor(time)} / {Math.ceil(tourDuration)} s
          </span>
        </div>
        {error && (
          <p role="alert" className="demo-error">
            {error}
          </p>
        )}
      </div>
    </>
  );
}

function Reason({ value, note, good = false }: { value: string; note?: string; good?: boolean }) {
  return (
    <span className="demo-reason">
      {value}
      {note && <small data-good={good || undefined}>{note}</small>}
    </span>
  );
}

// ---------------------------------------------------------------- free

const prompt = "Find a machine for my 32 cm counter that works with my 58 mm accessories. Add a filter if it fits, then open the review.";

function FreeStore() {
  const store = useCoffeeStore();
  return (
    <div className="demo-body">
      <div className="demo-stage">
        <Requirements store={store} />
        <CoffeeComparison
          store={store}
          action={(product) => (
            <Button
              size="sm"
              variant={store.cart.id === product.id ? "secondary" : "outline"}
              aria-pressed={store.cart.id === product.id}
              onClick={() => void store.run("set_coffee_cart", { productId: store.cart.id === product.id ? "" : product.id })}
            >
              {store.cart.id === product.id ? <Check /> : <Plus />}
              {store.cart.id === product.id ? "Selected" : "Choose"}
            </Button>
          )}
        />
        <Selection store={store} />
      </div>
      <AgentConsole store={store} />
      <CoffeeReviewDialog store={store} />
    </div>
  );
}

function Requirements({ store }: { store: CoffeeStore }) {
  return (
    <div role="group" aria-label="Your requirements" className="demo-requirements">
      <div className="w-36">
        <Field label="Counter width (cm)">
          {(props) => (
            <Input
              {...props}
              type="number"
              min={20}
              max={100}
              value={store.width}
              onChange={(event) => store.setWidth(Number(event.target.value))}
            />
          )}
        </Field>
      </div>
      <div className="w-40">
        <Field label="Your accessories">
          {(props) => (
            <NativeSelect {...props} value={store.fitting} onChange={(event) => store.setFitting(event.target.value)}>
              <NativeSelectOption>58 mm</NativeSelectOption>
              <NativeSelectOption>54 mm</NativeSelectOption>
            </NativeSelect>
          )}
        </Field>
      </div>
      <Button
        variant="outline"
        disabled={store.busy}
        onClick={() => void store.run("compare_coffee_machines", { maxWidth: store.width, fitting: store.fitting })}
      >
        Compare
      </Button>
    </div>
  );
}

function Selection({ store }: { store: CoffeeStore }) {
  const { active, cart, total } = store;
  return (
    <section aria-label="Your selection" className="demo-selection">
      {active ? (
        <>
          <div>
            <p className="font-medium">{active.name}</p>
            <p className="text-xs text-muted-foreground">
              {money.format(active.price)}
              {cart.filter ? " + universal water filter €24" : ""}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              aria-pressed={cart.filter}
              onClick={() => void store.run("set_coffee_filter", { included: !cart.filter })}
            >
              {cart.filter ? <Minus /> : <Plus />}
              {cart.filter ? "Remove filter" : "Add filter, €24"}
            </Button>
            <Button size="sm" onClick={() => void store.run("review_coffee_cart", {})}>
              Review, {money.format(total)}
            </Button>
          </div>
          {store.saved && (
            <p role="status" className="basis-full text-xs text-muted-foreground">
              Selection saved in this page only. No order or payment was created.
            </p>
          )}
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Your selection is empty. Choose a machine, or ask your agent to.</p>
      )}
      {store.error && (
        <p role="alert" className="basis-full text-xs text-destructive">
          {store.error}
        </p>
      )}
    </section>
  );
}

/** Sensible first arguments, so a visitor can call a tool at once and then edit them. */
function exampleArguments(name: string, store: CoffeeStore): Record<string, unknown> {
  if (name === "compare_coffee_machines") return { maxWidth: store.width, fitting: store.fitting };
  if (name === "set_coffee_cart") return { productId: store.cart.id ?? "studio" };
  if (name === "set_coffee_filter") return { included: !store.cart.filter };
  return {};
}

/** Everything a visitor needs to point their own agent at the store, and a way to act as one. */
function AgentConsole({ store }: { store: CoffeeStore }) {
  const mcp = useWebMCP();
  const native = mcp.support === "native" || mcp.support === "legacy";
  const [selected, setSelected] = useState("");
  const tool = useMemo(() => mcp.tools.find((t) => t.name === selected) ?? mcp.tools[0], [mcp.tools, selected]);
  return (
    <aside className="demo-side" aria-label="Your agent">
      <div className="demo-side-head">
        <h4 className="text-sm font-medium">Your agent</h4>
        <Button size="xs" variant="ghost" onClick={() => {
          store.reset();
          mcp.clearHistory();
        }}>
          <RotateCcw aria-hidden /> Reset
        </Button>
      </div>
      <div className="demo-side-body">
        <div className="grid gap-1.5">
          <StatusDot
            tone={native ? "success" : mcp.support === "checking" ? "neutral" : "warning"}
            label={
              mcp.support === "checking"
                ? "Checking this browser"
                : native
                  ? "WebMCP is on in this browser"
                  : "WebMCP is off in this browser"
            }
          />
          <p className="text-xs leading-5 text-muted-foreground">
            This page registers {mcp.tools.length} {mcp.tools.length === 1 ? "tool" : "tools"}. Choosing a machine registers
            two more.
          </p>
        </div>
        {native ? (
          <div className="grid gap-2">
            <p className="text-sm">Ask your browser&apos;s agent, for example:</p>
            <div className="demo-prompt">
              <p>{prompt}</p>
              <CopyButton value={prompt} label="Copy the request" />
            </div>
            <p className="text-xs leading-5 text-muted-foreground">
              Its calls appear below as Agent. Only you can approve the review.
            </p>
          </div>
        ) : (
          <ol className="demo-steps">
            <li>Open this page in Chrome with WebMCP enabled.</li>
            <li>Ask your browser&apos;s agent to find a machine for a 32 cm counter and 58 mm accessories.</li>
            <li>
              <Link href="/docs/webmcp">How to enable WebMCP</Link>. Until then, call the tools yourself below.
            </li>
          </ol>
        )}
        <details className="demo-call" open={!native}>
          <summary>Call a tool yourself</summary>
          {tool ? (
            <div className="grid gap-3 pt-3">
              <Field label="Tool">
                {(props) => (
                  <NativeSelect {...props} value={tool.name} onChange={(event) => setSelected(event.target.value)}>
                    {mcp.tools.map((t) => (
                      <NativeSelectOption key={t.name} value={t.name}>
                        {t.name}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                )}
              </Field>
              <p className="text-xs leading-5 text-muted-foreground">{tool.description}</p>
              <ArgumentsForm
                key={tool.name}
                schema={tool.inputSchema}
                initialValues={exampleArguments(tool.name, store)}
                submitLabel="Call the tool"
                onSubmit={(args) => mcp.run(tool.name, args, "simulator")}
              />
            </div>
          ) : (
            <p className="pt-3 text-xs text-muted-foreground">Registering tools…</p>
          )}
        </details>
        <ExecutionLog
          executions={mcp.executions}
          onClear={mcp.clearHistory}
          onCancel={mcp.cancel}
          sourceLabels={{ human: "You, on the page", agent: "Agent", simulator: "You, as the agent" }}
        />
      </div>
    </aside>
  );
}
