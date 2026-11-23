"use client";
import { ToolPlayground } from "@/components/tool-playground";
import { useRef, useState, type ReactNode } from "react";
import {
  Check,
  Braces,
  RotateCcw,
  ShoppingBag,
  Plus,
  Minus,
  Sparkles,
} from "lucide-react";
import {
  Alert,
  AlertDescription,
  Badge,
  Button,
  Input,
  Label,
  NativeSelect,
  StatusDot,
} from "@fabrials/ui";
import {
  WebMCPProvider,
  useWebMCP,
  useWebMCPTool,
} from "@/registry/webmcp/provider";
import { Comparison } from "@/registry/components/comparison";
import { ConfirmationDialog } from "@/registry/components/confirmation-dialog";
import { coffeeColumns, coffeeRows } from "@/components/demo/coffee-rows";
import {
  coffeeFittings,
  coffeeIds,
  coffeeMatch,
  coffeeProducts,
  compareCoffee,
  coffeeTotal,
  type CoffeeId,
} from "@/lib/coffee-demo";

const money = (n: number) =>
  new Intl.NumberFormat("en", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);

const PRESETS = [
  { label: "32 cm · 58 mm", width: 32, fitting: "58 mm" },
  { label: "40 cm · 54 mm", width: 40, fitting: "54 mm" },
  { label: "28 cm · 58 mm", width: 28, fitting: "58 mm" },
] as const;

export function CoffeeDemo({ playground = false }: { playground?: boolean }) {
  return (
    <WebMCPProvider>
      <CoffeeWorkbench />
      {playground && <ToolPlayground />}
    </WebMCPProvider>
  );
}

export function useCoffeeStore() {
  const mcp = useWebMCP();
  const [width, setWidth] = useState(32);
  const [fitting, setFitting] = useState("58 mm");
  const [compared, setCompared] = useState<{
    width: number;
    fitting: string;
  } | null>(null);
  const [cart, setCart] = useState<{ id: CoffeeId | null; filter: boolean }>({
    id: null,
    filter: false,
  });
  const cartRef = useRef(cart);
  const updateCart = (value: typeof cart) => {
    cartRef.current = value;
    setCart(value);
    setSaved(false);
  };
  const [review, setReview] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const match = compared ? coffeeMatch(compared.width, compared.fitting) : undefined;
  const total = coffeeTotal(cart.id, cart.filter);
  const active = coffeeProducts.find((p) => p.id === cart.id);

  async function run(
    name: string,
    args: Record<string, unknown>,
    source: "human" | "simulator" = "human",
  ) {
    setError("");
    setBusy(true);
    try {
      await mcp.run(name, args, source);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  useWebMCPTool({
    name: "compare_coffee_machines",
    title: "Compare coffee machines",
    description:
      "Compare the five fictional demo machines against a counter width and existing accessory fitting, for two flat whites (which need independent steam). Highlights the evidence in the visible comparison; returns what each machine meets and why. Does not change the cart.",
    inputSchema: {
      type: "object",
      properties: {
        maxWidth: { type: "number", minimum: 20, maximum: 100 },
        fitting: { type: "string", enum: [...coffeeFittings] },
      },
      required: ["maxWidth", "fitting"],
      additionalProperties: false,
    },
    execute: (args) => {
      const maxWidth = Number(args.maxWidth);
      const fit = String(args.fitting);
      setWidth(maxWidth);
      setFitting(fit);
      setCompared({ width: maxWidth, fitting: fit });
      return { products: compareCoffee(maxWidth, fit), cartChanged: false };
    },
  });

  useWebMCPTool({
    name: "set_coffee_cart",
    title: "Choose a machine",
    description:
      "Choose one fictional machine for the visible demo cart, or clear it. Replaces the current machine; no payment or order is made.",
    inputSchema: {
      type: "object",
      properties: {
        productId: { type: "string", enum: [...coffeeIds, ""] },
      },
      required: ["productId"],
      additionalProperties: false,
    },
    execute: (args) => {
      const id = (args.productId || null) as CoffeeId | null;
      updateCart({ id, filter: false });
      return {
        productId: id,
        total: coffeeTotal(id, false),
        orderPlaced: false,
      };
    },
  });

  useWebMCPTool(
    {
      name: "set_coffee_filter",
      title: "Add a compatible filter",
      description:
        "Add or remove the universal water filter in the demo cart. Requires a machine in the cart. Every fictional machine uses this filter.",
      inputSchema: {
        type: "object",
        properties: { included: { type: "boolean" } },
        required: ["included"],
        additionalProperties: false,
      },
      execute: (args) => {
        const current = cartRef.current;
        if (!current.id) throw Error("Choose a machine first.");
        const next = { ...current, filter: Boolean(args.included) };
        updateCart(next);
        return {
          ...next,
          total: coffeeTotal(next.id, next.filter),
          orderPlaced: false,
        };
      },
    },
    Boolean(cart.id),
  );

  useWebMCPTool(
    {
      name: "review_coffee_cart",
      title: "Review the cart",
      description:
        "Open a human review of the fictional cart. The user decides whether to save this demo selection. Does not place an order or charge money.",
      inputSchema: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
      execute: () => {
        if (!cartRef.current.id) throw Error("Choose a machine first.");
        setReview(true);
        return { status: "awaiting_user_review", orderPlaced: false };
      },
    },
    Boolean(cart.id),
  );

  function reset() {
    updateCart({ id: null, filter: false });
    setCompared(null);
    setWidth(32);
    setFitting("58 mm");
    setReview(false);
    setError("");
    mcp.clearHistory();
  }

  return {
    mcp,
    width,
    setWidth,
    fitting,
    setFitting,
    compared,
    cart,
    review,
    setReview,
    saved,
    setSaved,
    error,
    busy,
    match,
    total,
    active,
    run,
    reset,
  };
}

export type CoffeeStore = ReturnType<typeof useCoffeeStore>;

export function CoffeeComparison({
  store,
  action,
}: {
  store: CoffeeStore;
  action?: (product: (typeof coffeeProducts)[number]) => ReactNode;
}) {
  const { compared, match, cart, busy, run } = store;
  const results = compared ? compareCoffee(compared.width, compared.fitting) : [];
  const close = results.filter((p) => p.met === 2).map((p) => p.name);
  return (
    <Comparison
      caption="Find your fit"
      note={
        compared ? (
          match ? (
            <>
              <strong>{match.name} fits your setup.</strong> It is the only one of{" "}
              {coffeeProducts.length} that meets all three requirements:{" "}
              {match.reasons.join(", ")}.
            </>
          ) : (
            <>
              No machine meets all three requirements.
              {close.length > 0 &&
                ` ${close.join(" and ")} miss${close.length === 1 ? "es" : ""} one.`}{" "}
              Adjust your requirements or compare the trade-offs below.
            </>
          )
        ) : undefined
      }
      columns={coffeeColumns(compared, (p) =>
        action?.(p) ?? (
          <Button
            size="sm"
            variant={cart.id === p.id ? "accent" : "outline"}
            disabled={busy}
            onClick={() =>
              void run("set_coffee_cart", {
                productId: cart.id === p.id ? "" : p.id,
              })
            }
          >
            {cart.id === p.id ? (
              <>
                <Check /> Selected
              </>
            ) : (
              <>
                <Plus /> Choose
              </>
            )}
          </Button>
        ),
      )}
      rows={coffeeRows(compared)}
    />
  );
}

function CoffeeWorkbench() {
  const store = useCoffeeStore();
  const {
    mcp,
    width,
    setWidth,
    fitting,
    setFitting,
    compared,
    cart,
    saved,
    error,
    busy,
    total,
    active,
    run,
  } = store;

  return (
    <div className="grid gap-5">
      <div className="pg-toolbar">
        <div className="pg-toolbar-group">
          <div>
            <p className="m-0 text-sm font-medium text-foreground">
              The morning ritual
            </p>
            <p className="m-0 mt-0.5 font-mono text-[11px] text-muted-foreground">
              {coffeeProducts.length} scale-drawn machines ·{" "}
              {mcp.support === "native"
                ? `${mcp.tools.length} browser tools`
                : `${mcp.tools.length} shared WebMCP tools`}
            </p>
          </div>
        </div>

        <div className="pg-toolbar-group">
          <div className="pg-preset-row" role="group" aria-label="Counter presets">
            {PRESETS.map((preset) => {
              const isSelected =
                compared?.width === preset.width &&
                compared?.fitting === preset.fitting;
              return (
                <button
                  key={preset.label}
                  type="button"
                  className="pg-preset-btn"
                  aria-pressed={isSelected}
                  disabled={busy}
                  onClick={() =>
                    void run("compare_coffee_machines", {
                      maxWidth: preset.width,
                      fitting: preset.fitting,
                    })
                  }
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Reset coffee demo"
            onClick={store.reset}
          >
            <RotateCcw className="size-3.5" />
          </Button>
        </div>
      </div>

      <div className="pg-split">
        <div className="pg-well content-start">
          <div className="pg-well-head">
            <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
              <Braces className="size-3.5" aria-hidden />
              Requirements &amp; guided agent call
            </span>
            <Badge tone={compared ? "info" : "neutral"} size="sm">
              {compared
                ? `Evaluated · ${compared.width} cm · ${compared.fitting}`
                : "Two flat whites · independent steam"}
            </Badge>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="coffee-width">Counter width (cm)</Label>
              <Input
                id="coffee-width"
                type="number"
                min={20}
                max={100}
                value={width}
                onChange={(e) => setWidth(Number(e.target.value))}
                className="w-28 tabular-nums"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="coffee-fitting">Your accessories</Label>
              <NativeSelect
                id="coffee-fitting"
                value={fitting}
                onChange={(e) => setFitting(e.target.value)}
                className="w-auto min-w-28"
              >
                {coffeeFittings.map((fit) => (
                  <option key={fit}>{fit}</option>
                ))}
              </NativeSelect>
            </div>
            <Button
              variant="outline"
              disabled={busy}
              onClick={() =>
                void run("compare_coffee_machines", {
                  maxWidth: width,
                  fitting,
                })
              }
            >
              Compare
            </Button>
          </div>

          <div className="pg-inset">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-[11px] text-muted-foreground">
                Simulated agent prompt
              </span>
              <Badge size="sm" tone="info">
                Simulation
              </Badge>
            </div>
            <p className="m-0 text-sm font-medium leading-6 text-foreground">
              “Two flat whites. A 32 cm counter. Keep my 58 mm accessories.”
            </p>
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <span className="font-mono text-[11px] text-muted-foreground">
                Calls <code className="text-foreground">compare_coffee_machines</code> on the same store
              </span>
              <Button
                variant="accent"
                size="sm"
                disabled={busy}
                onClick={() =>
                  void run(
                    "compare_coffee_machines",
                    { maxWidth: 32, fitting: "58 mm" },
                    "simulator",
                  )
                }
              >
                <Sparkles />
                Find the right fit
              </Button>
            </div>
          </div>
        </div>

        <aside
          className="pg-well content-start"
          aria-label="Coffee demo assistant and cart"
        >
          <div className="pg-well-head">
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
              <ShoppingBag className="size-4 text-muted-foreground" aria-hidden />
              Your selection
            </span>
            <Badge size="sm" tone={active ? "info" : "neutral"}>
              {active ? (cart.filter ? "2 items" : "1 item") : "Empty"}
            </Badge>
          </div>

          {active ? (
            <div className="grid gap-3.5">
              <dl className="pg-kv">
                <div className="pg-kv-row">
                  <dt>Machine</dt>
                  <dd>{active.name}</dd>
                </div>
                <div className="pg-kv-row">
                  <dt>Price</dt>
                  <dd>{money(active.price)}</dd>
                </div>
              </dl>

              <Button
                variant={cart.filter ? "secondary" : "outline"}
                className="h-auto w-full justify-between py-2.5 text-left"
                onClick={() =>
                  void run("set_coffee_filter", { included: !cart.filter })
                }
                aria-pressed={cart.filter}
              >
                <span className="grid gap-0.5">
                  <span className="text-xs font-medium">
                    {cart.filter ? "Filter added" : "Add compatible filter"}
                  </span>
                  <span className="font-mono text-[11px] font-normal text-muted-foreground">
                    Universal · €24
                  </span>
                </span>
                {cart.filter ? <Minus className="size-3.5" /> : <Plus className="size-3.5" />}
              </Button>

              <div className="flex items-baseline justify-between border-t border-[var(--fui-separator)] pt-3 text-sm font-semibold tabular-nums text-foreground">
                <span>Total</span>
                <span>{money(total)}</span>
              </div>

              <Button
                className="w-full"
                size="sm"
                onClick={() => void run("review_coffee_cart", {})}
              >
                Review selection
              </Button>

              <p className="m-0 font-mono text-[11px] leading-4 text-muted-foreground">
                Demo only · no payment or order is created.
              </p>
            </div>
          ) : (
            <div className="pg-inset text-xs leading-5 text-muted-foreground">
              Choose a machine from the comparison below to inspect pricing, accessories and human review.
            </div>
          )}

          {saved && (
            <Alert variant="success">
              <AlertDescription>Selection saved for this demo.</AlertDescription>
            </Alert>
          )}

          <div className="border-t border-[var(--fui-separator)] pt-3">
            <details className="text-xs">
              <summary className="cursor-pointer font-mono text-[11px] text-muted-foreground hover:text-foreground">
                Activity · {mcp.executions.length} actions
              </summary>
              <ol
                className="mt-2.5 grid max-h-40 gap-2 overflow-y-auto p-0 list-none"
                aria-label="Coffee tool activity"
              >
                {mcp.executions.slice(0, 5).map((e) => (
                  <li
                    key={e.id}
                    className="grid gap-1 rounded-[var(--fui-radius-sm)] border border-[var(--fui-separator)] bg-card px-2.5 py-2"
                  >
                    <div className="flex items-center justify-between gap-2 font-mono text-[10px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <StatusDot
                          tone={
                            e.status === "success"
                              ? "success"
                              : e.status === "error"
                                ? "danger"
                                : "info"
                          }
                          label={e.status}
                          hideLabel
                        />
                        {e.source === "agent"
                          ? "Browser agent"
                          : e.source === "simulator"
                            ? "Simulation"
                            : "You"}
                      </span>
                      <span>{e.status}</span>
                    </div>
                    <code className="truncate font-mono text-[11px] text-foreground">
                      {e.name}
                    </code>
                  </li>
                ))}
              </ol>
            </details>
          </div>

          {(error || mcp.error) && (
            <p role="alert" className="m-0 text-xs text-[var(--fui-danger-ink)]">
              {error || mcp.error}
            </p>
          )}
        </aside>
      </div>

      <CoffeeComparison store={store} />

      <CoffeeReviewDialog store={store} />
    </div>
  );
}

export function CoffeeReviewDialog({ store }: { store: CoffeeStore }) {
  const { review, setReview, setSaved, active, cart, total } = store;
  return (
    <ConfirmationDialog
      open={review}
      onOpenChange={setReview}
      title="Your morning setup"
      description="Review your selection. This example saves a local demo state only; no order or payment is created."
      confirmLabel="Save demo selection"
      onConfirm={() => setSaved(true)}
    >
      <div className="flex items-baseline justify-between rounded-[var(--fui-radius-md)] border border-[var(--fui-separator)] bg-[var(--fui-surface-inset)] px-4 py-3 text-sm">
        <span className="text-foreground">
          {active?.name}
          {cart.filter ? " + water filter" : ""}
        </span>
        <strong className="font-mono tabular-nums text-foreground">
          {money(total)}
        </strong>
      </div>
    </ConfirmationDialog>
  );
}
