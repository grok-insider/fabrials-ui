"use client";
import { useState } from "react";
import {
  Braces,
  Check,
  ChevronDown,
  ChevronUp,
  UserRound,
} from "lucide-react";
import { Button } from "@fabrials/ui";
import { tourCues, tourSnapshot } from "@/lib/coffee-tour";
import {
  landingPrompt,
  landingPromptLength,
  landingPromptStart,
} from "@/lib/landing-tour";
import { coffeeTotal } from "@/lib/coffee-demo";
const actions = [
  {
    at: tourCues.compare,
    name: "compare_coffee_machines",
    title: "Compare your requirements",
    args: { maxWidth: 32, fitting: "58 mm" },
    result: "5 machines checked. Only Studio Dual meets all three requirements.",
    source: "Agent",
  },
  {
    at: tourCues.choose,
    name: "set_coffee_cart",
    title: "Select the right fit",
    args: { productId: "studio" },
    result: "Studio Dual selected · €1,290",
    source: "Agent",
  },
  {
    at: tourCues.filter,
    name: "set_coffee_filter",
    title: "Add a compatible filter",
    args: { included: true },
    result: "Compatible filter added · €1,314",
    source: "Agent",
  },
  {
    at: tourCues.remove,
    name: "Remove optional filter",
    title: "You change the selection",
    args: null,
    result: "The person changes the selection · €1,290",
    source: "Human",
  },
  {
    at: tourCues.review,
    name: "review_coffee_cart",
    title: "Ready for your review",
    args: {},
    result: "Review opened. The final decision stays with you.",
    source: "Agent",
  },
];
export function TourAgentPanel({ time }: { time: number }) {
  const [collapsed, setCollapsed] = useState(false);
  const state = tourSnapshot(time);
  const completed = actions.filter((a) => time >= a.at);
  const current = completed.at(-1);
  const next = actions.find((a) => time < a.at);
  const typed = landingPromptLength(time);
  const reviewing = current?.name === "review_coffee_cart";
  return (
    <aside
      aria-label="MCP tour activity"
      className="demo-side"
    >
      <div className="demo-side-head">
        <div className="flex items-center gap-2">
          <Braces aria-hidden className="size-4 text-muted-foreground" />
          <h4 className="text-sm font-medium">Inside the agent</h4>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={
            collapsed ? "Expand MCP activity" : "Collapse MCP activity"
          }
          aria-expanded={!collapsed}
          aria-controls="tour-agent-content"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronDown /> : <ChevronUp />}
        </Button>
      </div>
      <p className="px-4 pt-3 text-xs text-muted-foreground">
        Illustrated tool calls, synced to the narration.
      </p>
      <div
        id="tour-agent-content"
        hidden={collapsed}
        className="space-y-5 px-4 pt-3 pb-5"
      >
        <div
          className="rounded-md border bg-background p-3 text-sm leading-6"
          aria-label="Your request"
        >
          <span className="sr-only">{landingPrompt}</span>
          <span aria-hidden="true" className="motion-reduce:hidden">
            “<span data-tour-typed>{landingPrompt.slice(0, typed)}</span>
            <span
              className={
                time >= landingPromptStart && typed < landingPrompt.length
                  ? "tour-type-caret"
                  : ""
              }
            />
            <span className="invisible">{landingPrompt.slice(typed)}</span>
            <span className={typed < landingPrompt.length ? "invisible" : ""}>
              ”
            </span>
          </span>
          <span aria-hidden="true" className="hidden motion-reduce:inline">
            “{landingPrompt}”
          </span>
        </div>
        {current ? (
          <div
            key={current.name}
            className="tour-enter overflow-hidden rounded-md border bg-background"
          >
            <div className="space-y-2 p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {reviewing || current.source === "Human" ? (
                  <UserRound className="size-3.5" />
                ) : (
                  <Check className="size-3.5" />
                )}
                {reviewing ? "Your turn" : `${current.source} action`}
              </div>
              <h5 className="font-display text-lg leading-tight font-semibold">{current.title}</h5>
              {reviewing ? (
                <>
                  <p className="text-sm leading-6 text-muted-foreground">
                    Check the selection before you decide.
                  </p>
                  <dl className="space-y-2 border-y py-2 text-sm">
                    <div className="flex justify-between gap-2">
                      <dt>Studio Dual</dt>
                      <dd>€1,290</dd>
                    </div>
                    <div className="flex justify-between gap-2 text-xs text-muted-foreground">
                      <dt>Optional filter</dt>
                      <dd>Removed</dd>
                    </div>
                  </dl>
                  <p className="text-xs leading-5 text-muted-foreground">
                    The agent prepared the selection. Only you can approve it.
                  </p>
                </>
              ) : (
                <p className="text-sm leading-6">{current.result}</p>
              )}
            </div>
            {current.args !== null && (
              <details className="border-t px-3 py-2">
                <summary className="cursor-pointer text-xs text-muted-foreground">
                  Tool details
                </summary>
                <p className="mt-2 break-all font-mono text-xs">
                  {current.name}
                </p>
                {Object.keys(current.args).length > 0 ? (
                  <pre
                    tabIndex={0}
                    aria-label="Tool arguments"
                    className="mt-2 overflow-auto text-xs leading-6"
                  >
                    {JSON.stringify(current.args, null, 2)}
                  </pre>
                ) : (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Uses the current selection. No additional inputs.
                  </p>
                )}
              </details>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm font-medium">Waiting for the requirements</p>
            <p className="text-xs leading-6 text-muted-foreground">
              Play the tour to watch a tool call turn the request into a visible
              change.
            </p>
          </div>
        )}
        {completed.length > 1 && (
          <details className="border-t pt-3">
            <summary className="cursor-pointer text-xs text-muted-foreground">
              Previous actions ({completed.length - 1})
            </summary>
            <ol className="mt-3 space-y-3">
              {completed.slice(0, -1).map((a) => (
                <li key={a.name} className="text-xs leading-5">
                  <span className="text-muted-foreground">{a.source}: </span>
                  {a.result}
                </li>
              ))}
            </ol>
          </details>
        )}
        <div className="border-t pt-4">
          <div className="flex justify-between gap-3 text-sm">
            <span className="text-muted-foreground">Selection total</span>
            <strong className="tabular-nums">
              {state.id
                ? new Intl.NumberFormat("en", {
                    style: "currency",
                    currency: "EUR",
                    maximumFractionDigits: 0,
                  }).format(coffeeTotal(state.id, state.filter))
                : "—"}
            </strong>
          </div>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            {next
              ? `Next: ${next.source === "Human" ? "a manual correction" : next.name}`
              : "Human review. No order is created."}
          </p>
        </div>
        {time >= tourCues.outro && (
          <a
            href="/playground#comparison"
            className="flex items-center justify-between rounded-md border p-3 text-sm hover:bg-accent"
          >
            Try it in the playground
          </a>
        )}
      </div>
    </aside>
  );
}
