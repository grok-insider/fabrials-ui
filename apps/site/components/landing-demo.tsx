"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Bot,
  Check,
  CircleDashed,
  Minus,
  Plus,
  RotateCcw,
  Square,
  UserRound,
  X,
} from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Field,
  Input,
  NativeSelect,
  Spinner,
  buttonVariants,
} from "@fabrials/ui";
import { WebMCPProvider } from "@/registry/webmcp/provider";
import {
  CoffeeComparison,
  CoffeeReviewDialog,
  useCoffeeStore,
  type CoffeeStore,
} from "@/components/coffee-demo";
import { coffeeProducts } from "@/lib/coffee-demo";
import {
  agentRequests,
  chooseFromComparison,
  type AgentRequest,
} from "@/lib/coffee-agent";
import type { Execution } from "@/registry/mcp/types";

const money = new Intl.NumberFormat("en", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});
const pageTools = [
  { name: "compare_coffee_machines", when: "Always" },
  { name: "set_coffee_cart", when: "Always" },
  { name: "set_coffee_filter", when: "After a machine is chosen" },
  { name: "review_coffee_cart", when: "After a machine is chosen" },
];
type AgentStatus = "idle" | "running" | "waiting" | "done" | "stopped";
type Note = { id: string; at: number; text: string };

export function LandingDemo({ pace = 900 }: { pace?: number }) {
  return (
    <WebMCPProvider>
      <LiveStore pace={pace} />
    </WebMCPProvider>
  );
}

function LiveStore({ pace }: { pace: number }) {
  const store = useCoffeeStore();
  const { mcp } = store;
  const [request, setRequest] = useState<AgentRequest>(agentRequests[0]);
  const [status, setStatus] = useState<AgentStatus>("idle");
  const [notes, setNotes] = useState<Note[]>([]);
  const controller = useRef<AbortController | null>(null);
  const toolNames = useRef<string[]>([]);
  toolNames.current = mcp.tools.map((t) => t.name);
  useEffect(() => () => controller.current?.abort(), []);
  useEffect(() => {
    if (status !== "waiting" || store.review) return;
    setNotes((n) => [
      ...n,
      {
        id: crypto.randomUUID(),
        at: Date.now(),
        text: store.saved
          ? "You approved the selection. It is saved in this page only; no order was placed."
          : "You closed the review without saving. The selection stays editable.",
      },
    ]);
    setStatus("done");
  }, [status, store.review, store.saved]);

  async function runAgent(next = request) {
    controller.current?.abort();
    const run = new AbortController();
    controller.current = run;
    const { signal } = run;
    store.reset();
    setNotes([]);
    setStatus("running");
    const say = (text: string) =>
      setNotes((n) => [
        ...n,
        { id: crypto.randomUUID(), at: Date.now(), text },
      ]);
    const pause = (ms: number) =>
      new Promise<void>((resolve, reject) => {
        const timer = setTimeout(resolve, ms);
        signal.addEventListener(
          "abort",
          () => {
            clearTimeout(timer);
            reject(signal.reason);
          },
          { once: true },
        );
      });
    const call = (name: string, args: Record<string, unknown>) =>
      mcp.run(name, args, "simulator", signal);
    const toolAppears = async (name: string) => {
      for (let waited = 0; !toolNames.current.includes(name); waited += 50) {
        if (waited > 3000) throw new Error(`${name} was never registered.`);
        await pause(50);
      }
    };
    try {
      say(
        `I can see ${toolNames.current.length} tools on this page. Comparing both machines against a ${next.maxWidth} cm counter and ${next.fitting} accessories.`,
      );
      await pause(pace);
      const result = await call("compare_coffee_machines", {
        maxWidth: next.maxWidth,
        fitting: next.fitting,
      });
      const { choice, verdicts } = chooseFromComparison(result);
      await pause(pace);
      if (!choice) {
        say(
          `Neither machine meets both requirements (${verdicts
            .map((v) => `${v.name}: ${v.reasons.join(", ")}`)
            .join(
              "; ",
            )}). I won't pick one for you. Adjust the requirements and compare again.`,
        );
        setStatus("done");
        return;
      }
      say(
        `${choice.name} is the one that fits: ${choice.reasons.join(" and ")}. Adding it to your selection.`,
      );
      await pause(pace);
      await call("set_coffee_cart", { productId: choice.id });
      await toolAppears("set_coffee_filter");
      say(
        "Choosing a machine registered two more tools: set_coffee_filter and review_coffee_cart. The universal filter fits, so I'm adding it.",
      );
      await pause(pace);
      await call("set_coffee_filter", { included: true });
      await pause(pace);
      say(
        "Ready. I'm opening the review. Only you can approve it, and this demo never places an order.",
      );
      await pause(pace / 2);
      await call("review_coffee_cart", {});
      setStatus("waiting");
    } catch (error) {
      if (signal.aborted) {
        if (controller.current === run) {
          say("Stopped. Everything done so far stays visible and editable.");
          setStatus("stopped");
        }
        return;
      }
      say(
        `I couldn't continue: ${error instanceof Error ? error.message : "the tool failed"}.`,
      );
      setStatus("stopped");
    }
  }

  function reset() {
    controller.current?.abort();
    controller.current = null;
    store.reset();
    setNotes([]);
    setStatus("idle");
  }

  const native = mcp.support === "native" || mcp.support === "legacy";
  return (
    <Card className="landing-demo">
      <CardHeader className="sm:flex sm:items-start sm:justify-between">
        <div className="grid gap-1">
          <CardTitle as="h3">The morning ritual · a fictional store</CardTitle>
          <CardDescription>
            Real WebMCP tools registered by this page. Fictional products, no
            payments.
          </CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={native ? "success" : "neutral"} role="status">
            {mcp.support === "checking"
              ? "Checking browser…"
              : native
                ? "Native WebMCP on"
                : "Native WebMCP off"}
          </Badge>
          <Badge>{mcp.tools.length} tools registered</Badge>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Reset live demo"
            onClick={reset}
          >
            <RotateCcw />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="grid min-w-0 content-start gap-5">
          <Requirements store={store} />
          <CoffeeComparison
            store={store}
            action={(p) => (
              <Button
                size="sm"
                variant={store.cart.id === p.id ? "secondary" : "outline"}
                aria-pressed={store.cart.id === p.id}
                onClick={() =>
                  void store.run("set_coffee_cart", {
                    productId: store.cart.id === p.id ? "" : p.id,
                  })
                }
              >
                {store.cart.id === p.id ? <Check /> : <Plus />}
                {store.cart.id === p.id ? "Selected" : "Choose"}
              </Button>
            )}
          />
          <Selection store={store} />
        </div>
        <AgentPanel
          store={store}
          request={request}
          status={status}
          notes={notes}
          onRequest={(r) => {
            setRequest(r);
            if (status === "running") void runAgent(r);
          }}
          onRun={() => void runAgent()}
          onStop={() => controller.current?.abort()}
        />
      </CardContent>
      <CardFooter className="justify-between text-xs text-muted-foreground">
        <span>
          {native
            ? "Your browser's agent can call the same tools. Its calls appear in the log as Browser agent."
            : "Enable WebMCP in Chrome to let your browser's own agent call these tools."}
        </span>
        <Link
          href="/docs/webmcp"
          className={buttonVariants({ variant: "link", size: "sm" })}
        >
          {native ? "How WebMCP works" : "Enable WebMCP"}
          <ArrowRight />
        </Link>
      </CardFooter>
      <CoffeeReviewDialog store={store} />
    </Card>
  );
}

function Requirements({ store }: { store: CoffeeStore }) {
  return (
    <div
      role="group"
      aria-label="Your requirements"
      className="flex flex-wrap items-end gap-3"
    >
      <div className="w-36">
        <Field label="Counter width (cm)">
          {(props) => (
            <Input
              {...props}
              type="number"
              min={20}
              max={100}
              value={store.width}
              onChange={(e) => store.setWidth(Number(e.target.value))}
            />
          )}
        </Field>
      </div>
      <div className="w-40">
        <Field label="Your accessories">
          {(props) => (
            <NativeSelect
              {...props}
              value={store.fitting}
              onChange={(e) => store.setFitting(e.target.value)}
            >
              <option>58 mm</option>
              <option>54 mm</option>
            </NativeSelect>
          )}
        </Field>
      </div>
      <Button
        variant="outline"
        disabled={store.busy}
        onClick={() =>
          void store.run("compare_coffee_machines", {
            maxWidth: store.width,
            fitting: store.fitting,
          })
        }
      >
        Compare
      </Button>
    </div>
  );
}

function Selection({ store }: { store: CoffeeStore }) {
  const { active, cart, total } = store;
  return (
    <section
      aria-label="Your selection"
      className="grid gap-3 rounded-lg border bg-muted/40 p-4"
    >
      {active ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">{active.name}</p>
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
                onClick={() =>
                  void store.run("set_coffee_filter", {
                    included: !cart.filter,
                  })
                }
              >
                {cart.filter ? <Minus /> : <Plus />}
                {cart.filter ? "Remove filter" : "Add filter · €24"}
              </Button>
              <Button
                size="sm"
                onClick={() => void store.run("review_coffee_cart", {})}
              >
                Review · {money.format(total)}
              </Button>
            </div>
          </div>
          {store.saved && (
            <Alert>
              <AlertTitle>Selection saved for this demo</AlertTitle>
              <AlertDescription>
                Saved in this page only. No order or payment was created.
              </AlertDescription>
            </Alert>
          )}
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          Your selection is empty. Choose a machine, or let the agent do it.
        </p>
      )}
      {store.error && (
        <p role="alert" className="text-xs text-destructive">
          {store.error}
        </p>
      )}
    </section>
  );
}

function AgentPanel({
  store,
  request,
  status,
  notes,
  onRequest,
  onRun,
  onStop,
}: {
  store: CoffeeStore;
  request: AgentRequest;
  status: AgentStatus;
  notes: Note[];
  onRequest: (request: AgentRequest) => void;
  onRun: () => void;
  onStop: () => void;
}) {
  const log = useRef<HTMLOListElement>(null);
  const executions = [...store.mcp.executions].reverse();
  const entries = [
    ...notes.map((n) => ({ kind: "note" as const, at: n.at, note: n })),
    ...executions.map((e) => ({
      kind: "call" as const,
      at: e.startedAt,
      execution: e,
    })),
  ].sort((a, b) => a.at - b.at);
  useEffect(() => {
    if (log.current) log.current.scrollTop = log.current.scrollHeight;
  }, [entries.length]);
  const registered = new Set(store.mcp.tools.map((t) => t.name));
  return (
    <Card
      className="order-first flex min-w-0 flex-col self-start p-0 xl:sticky xl:top-24 xl:order-none"
      aria-label="Agent"
    >
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle as="h4" className="flex items-center gap-2">
            <Bot aria-hidden className="size-4" /> Built-in agent
          </CardTitle>
          <AgentBadge status={status} />
        </div>
        <CardDescription>
          A scripted agent, no AI model. It can only act through the tools
          below, just like a browser agent.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div
          role="group"
          aria-label="Shopper request"
          className="flex flex-wrap gap-2"
        >
          {agentRequests.map((r) => (
            <Button
              key={r.id}
              size="sm"
              variant="outline"
              aria-pressed={r.id === request.id}
              onClick={() => onRequest(r)}
            >
              {r.label}
            </Button>
          ))}
        </div>
        <blockquote className="rounded-md bg-muted p-3 text-sm leading-6">
          “{request.prompt}”
        </blockquote>
        {status === "running" ? (
          <Button variant="outline" onClick={onStop}>
            <Square /> Stop the agent
          </Button>
        ) : (
          <Button onClick={onRun}>
            {status === "idle" ? "Run the agent" : "Run again"}
            <ArrowRight />
          </Button>
        )}
        <div className="grid gap-2">
          <p className="flex items-center justify-between text-xs font-medium">
            Activity
            <span className="font-normal text-muted-foreground">
              {executions.length} tool{" "}
              {executions.length === 1 ? "call" : "calls"}
            </span>
          </p>
          <ol
            ref={log}
            aria-label="Agent activity"
            aria-live="polite"
            className="grid max-h-[26rem] content-start gap-2 overflow-y-auto rounded-md border bg-muted/30 p-2 [scrollbar-width:thin]"
          >
            {entries.length === 0 && (
              <li className="p-2 text-xs leading-5 text-muted-foreground">
                Every tool call appears here with its arguments and result,
                whether it comes from the agent, your browser, or your own
                clicks.
              </li>
            )}
            {entries.map((entry) =>
              entry.kind === "note" ? (
                <li
                  key={entry.note.id}
                  className="flex gap-2 px-1 text-sm leading-6"
                >
                  <Bot
                    aria-hidden
                    className="mt-1 size-3.5 shrink-0 text-muted-foreground"
                  />
                  <span>{entry.note.text}</span>
                </li>
              ) : (
                <ToolCall
                  key={entry.execution.id}
                  execution={entry.execution}
                />
              ),
            )}
          </ol>
        </div>
      </CardContent>
      <CardFooter className="grid gap-2">
        <p className="text-xs font-medium">Tools on this page</p>
        <ul className="grid w-full gap-1.5">
          {pageTools.map((tool) => (
            <li
              key={tool.name}
              className="flex items-center justify-between gap-2 text-xs"
            >
              <code
                className={
                  registered.has(tool.name) ? "" : "text-muted-foreground"
                }
              >
                {tool.name}
              </code>
              {registered.has(tool.name) ? (
                <Badge tone="success">Registered</Badge>
              ) : (
                <Badge>{tool.when}</Badge>
              )}
            </li>
          ))}
        </ul>
      </CardFooter>
    </Card>
  );
}

function AgentBadge({ status }: { status: AgentStatus }) {
  if (status === "running")
    return (
      <Badge tone="warning">
        <Spinner aria-hidden role={undefined} className="size-3" /> Working
      </Badge>
    );
  if (status === "waiting")
    return <Badge tone="warning">Waiting for you</Badge>;
  if (status === "done") return <Badge tone="success">Done</Badge>;
  if (status === "stopped") return <Badge>Stopped</Badge>;
  return <Badge>Ready</Badge>;
}

const sources: Record<Execution["source"], string> = {
  simulator: "Agent",
  agent: "Browser agent",
  human: "You",
};

function ToolCall({ execution: e }: { execution: Execution }) {
  const summary = summarize(e);
  return (
    <li className="rounded-md border bg-background p-3 text-xs">
      <div className="flex flex-wrap items-center gap-2">
        {e.status === "running" ? (
          <Spinner aria-hidden role={undefined} className="size-3.5" />
        ) : e.status === "success" ? (
          <Check aria-hidden className="size-3.5 text-(--fui-success-ink)" />
        ) : e.status === "cancelled" ? (
          <CircleDashed aria-hidden className="size-3.5" />
        ) : (
          <X aria-hidden className="size-3.5 text-(--fui-danger-ink)" />
        )}
        <code className="min-w-0 flex-1 font-medium [overflow-wrap:anywhere]">
          {e.name}
        </code>
        <Badge tone={e.source === "human" ? "neutral" : "warning"}>
          {e.source === "human" ? (
            <UserRound aria-hidden className="size-3" />
          ) : (
            <Bot aria-hidden className="size-3" />
          )}
          {sources[e.source]}
        </Badge>
      </div>
      <code className="mt-2 block text-muted-foreground [overflow-wrap:anywhere]">
        {JSON.stringify(e.args)}
      </code>
      {summary && <p className="mt-2 text-sm leading-5">{summary}</p>}
      {e.result !== undefined && (
        <Collapsible>
          <CollapsibleTrigger
            className={buttonVariants({
              variant: "link",
              size: "sm",
              className: "mt-1 min-h-0 px-0 text-xs text-muted-foreground",
            })}
          >
            Result JSON
          </CollapsibleTrigger>
          <CollapsibleContent>
            <pre className="mt-1 max-h-48 overflow-auto rounded bg-muted p-2 leading-5">
              {JSON.stringify(e.result, null, 2)}
            </pre>
          </CollapsibleContent>
        </Collapsible>
      )}
    </li>
  );
}

function summarize(e: Execution) {
  if (e.status === "running") return "Running…";
  if (e.status === "cancelled") return "Cancelled.";
  if (e.status === "error") return e.error ?? "Failed.";
  const result = (e.result ?? {}) as Record<string, unknown>;
  if (e.name === "compare_coffee_machines") {
    const { choice, verdicts } = chooseFromComparison(result);
    return choice
      ? `${choice.name} fits both requirements. ${verdicts
          .filter((v) => v.id !== choice.id)
          .map((v) => `${v.name} doesn't.`)
          .join(" ")}`
      : "Neither machine fits both requirements.";
  }
  if (e.name === "set_coffee_cart") {
    const product = coffeeProducts.find((p) => p.id === result.productId);
    return product
      ? `${product.name} selected · ${money.format(Number(result.total))}`
      : "Selection cleared.";
  }
  if (e.name === "set_coffee_filter")
    return `${result.filter ? "Filter added" : "Filter removed"} · ${money.format(Number(result.total))}`;
  if (e.name === "review_coffee_cart")
    return "Review opened. Waiting for your decision.";
  return "";
}
