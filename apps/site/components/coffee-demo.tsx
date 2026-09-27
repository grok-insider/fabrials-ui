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
} from "lucide-react";
import {
  Alert,
  AlertDescription,
  Button,
  Input,
  Label,
  NativeSelect,
} from "@fabrials/ui";
import {
  WebMCPProvider,
  useWebMCP,
  useWebMCPTool,
} from "@/registry/webmcp/provider";
import { Comparison } from "@/registry/components/comparison";
import { ConfirmationDialog } from "@/registry/components/confirmation-dialog";
import { CoffeeMachine } from "@/components/coffee-machine";
import {
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
  const results = compared
    ? compareCoffee(compared.width, compared.fitting)
    : [];
  const match = results.find((p) => p.fits && p.compatible);
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
      "Compare fictional demo machines against a counter width and existing accessory fitting. Highlights supporting evidence in the visible comparison; returns suitability and reasons. Does not change the cart.",
    inputSchema: {
      type: "object",
      properties: {
        maxWidth: { type: "number", minimum: 20, maximum: 100 },
        fitting: { type: "string", enum: ["58 mm", "54 mm"] },
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
        productId: { type: "string", enum: ["studio", "atelier", ""] },
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
        "Add or remove the universal water filter in the demo cart. Requires a machine in the cart. Both fictional machines use this filter.",
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
  return (
    <Comparison
      caption="Find your fit"
      note={
        compared ? (
          match ? (
            <>
              <strong>{match.name} fits your setup.</strong>{" "}
              {match.reasons.join(". ")}. Independent steam makes milk
              preparation easier.
            </>
          ) : (
            "Neither machine meets both constraints. Adjust your requirements or compare the tradeoffs below."
          )
        ) : undefined
      }
      columns={coffeeProducts.map((p) => ({
        id: p.id,
        title: p.name,
        subtitle: money(p.price),
        visual: (
          <CoffeeMachine
            color={p.color}
            className="mx-auto h-32 w-full max-w-48"
          />
        ),
        action: action?.(p) ?? (
          <Button
            size="sm"
            variant={cart.id === p.id ? "secondary" : "outline"}
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
      }))}
      rows={[
        {
          id: "width",
          label: "Counter space",
          highlighted: Boolean(compared),
          values: Object.fromEntries(
            coffeeProducts.map((p) => [
              p.id,
              <span key={p.id}>
                {p.width} cm
                {compared && (
                  <span className="mt-1 block text-xs">
                    {p.width <= compared.width ? "Fits your space" : "Too wide"}
                  </span>
                )}
              </span>,
            ]),
          ),
        },
        {
          id: "fitting",
          label: "Accessory fit",
          highlighted: Boolean(compared),
          values: Object.fromEntries(
            coffeeProducts.map((p) => [
              p.id,
              <span key={p.id}>
                {p.fitting}
                {compared && (
                  <span className="mt-1 block text-xs">
                    {p.fitting === compared.fitting
                      ? "Keep your accessories"
                      : "Different fitting"}
                  </span>
                )}
              </span>,
            ]),
          ),
        },
        {
          id: "milk",
          label: "Two flat whites",
          values: Object.fromEntries(coffeeProducts.map((p) => [p.id, p.milk])),
        },
      ]}
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
    cart,
    saved,
    error,
    busy,
    total,
    active,
    run,
  } = store;
  return (
    <div className="overflow-hidden rounded-[var(--fui-radius-lg)] border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4 sm:px-7">
        <div>
          <p className="text-sm font-medium">The morning ritual</p>
          <p className="text-xs text-muted-foreground">
            Interactive store · fictional products
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {mcp.support === "native"
              ? `${mcp.tools.length} browser tools`
              : "Manual + simulation"}
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Reset coffee demo"
            onClick={store.reset}
          >
            <RotateCcw className="size-3.5" />
          </Button>
        </div>
      </div>
      <div className="grid lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 p-5 sm:p-7">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mb-2 text-sm text-muted-foreground">
                Make room for better mornings
              </p>
              <h3 className="text-2xl font-medium tracking-tight sm:text-3xl">
                A good fit. In every way.
              </h3>
            </div>
            <span className="rounded-md border px-3 py-1 text-xs text-muted-foreground">
              2 machines to compare
            </span>
          </div>
          <div className="mb-6 flex flex-wrap items-end gap-3 rounded-xl bg-muted/60 p-4">
            <div>
              <Label htmlFor="coffee-width" className="mb-2 block">
                Counter width (cm)
              </Label>
              <Input
                id="coffee-width"
                type="number"
                min={20}
                max={100}
                value={width}
                onChange={(e) => setWidth(Number(e.target.value))}
                className="w-28"
              />
            </div>
            <div>
              <Label htmlFor="coffee-fitting" className="mb-2 block">
                Your accessories
              </Label>
              <NativeSelect
                id="coffee-fitting"
                value={fitting}
                onChange={(e) => setFitting(e.target.value)}
                className="w-auto"
              >
                <option>58 mm</option>
                <option>54 mm</option>
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
          <CoffeeComparison store={store} />
        </div>
        <aside
          className="flex flex-col border-t bg-muted/30 p-5 sm:p-7 lg:border-t-0 lg:border-l"
          aria-label="Coffee demo assistant and cart"
        >
          <div className="mb-4 flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs font-medium">
              <Braces className="size-4" /> Try a tool
            </span>
            <span className="rounded-md border px-2 py-1 text-[10px] text-muted-foreground">
              Simulation
            </span>
          </div>
          <p className="text-lg leading-7 tracking-tight">
            “Two flat whites. A 32 cm counter. Keep my 58 mm accessories.”
          </p>
          <p className="mt-3 text-xs leading-5 text-muted-foreground">
            This guided call uses the same tools as a browser agent. No AI
            connection required.
          </p>
          <Button
            className="mt-5 w-full"
            disabled={busy}
            onClick={() =>
              void run(
                "compare_coffee_machines",
                { maxWidth: 32, fitting: "58 mm" },
                "simulator",
              )
            }
          >
            Find the right fit
          </Button>
          <div className="my-6 border-t" />
          <div className="flex items-center justify-between text-sm font-medium">
            <span>Your selection</span>
            <ShoppingBag className="size-4" />
          </div>
          {active ? (
            <div className="mt-4 space-y-4">
              <div className="flex justify-between gap-2 text-sm">
                <span>{active.name}</span>
                <span>{money(active.price)}</span>
              </div>
              <Button
                variant="outline"
                className="w-full justify-between py-3 text-left"
                onClick={() =>
                  void run("set_coffee_filter", { included: !cart.filter })
                }
                aria-pressed={cart.filter}
              >
                <span>
                  {cart.filter ? "Filter added" : "Add compatible filter"}
                  <span className="mt-1 block text-xs font-normal text-muted-foreground">
                    Universal · €24
                  </span>
                </span>
                {cart.filter ? <Minus /> : <Plus />}
              </Button>
              <div className="flex justify-between border-t pt-4 text-sm font-medium">
                <span>Total</span>
                <span>{money(total)}</span>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => void run("review_coffee_cart", {})}
              >
                Review selection
              </Button>
              <p className="text-[11px] leading-5 text-muted-foreground">
                Demo only. No payment or order is created.
              </p>
            </div>
          ) : (
            <div className="my-5 rounded-xl border border-dashed p-5 text-sm leading-6 text-muted-foreground">
              Choose a machine from the comparison. Your selection appears here.
            </div>
          )}
          {saved && (
            <Alert variant="success" className="mt-4">
              <AlertDescription>Selection saved for this demo.</AlertDescription>
            </Alert>
          )}
          <div className="mt-auto pt-6">
            <details className="text-xs">
              <summary className="cursor-pointer py-2 text-muted-foreground">
                Activity · {mcp.executions.length} actions
              </summary>
              <ol
                className="mt-2 max-h-48 space-y-3 overflow-y-auto"
                aria-label="Coffee tool activity"
              >
                {mcp.executions.slice(0, 5).map((e) => (
                  <li
                    key={e.id}
                    className="break-words rounded-lg border bg-background p-3"
                  >
                    <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                      <span>
                        {e.source === "agent"
                          ? "Browser agent"
                          : e.source === "simulator"
                            ? "Simulation"
                            : "You"}
                      </span>
                      <span>{e.status}</span>
                    </div>
                    <code>{e.name}</code>
                  </li>
                ))}
              </ol>
            </details>
          </div>
          {(error || mcp.error) && (
            <p role="alert" className="mt-3 text-xs text-destructive">
              {error || mcp.error}
            </p>
          )}
        </aside>
      </div>
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
      <div className="flex justify-between rounded-xl bg-muted p-4 text-sm">
        <span>
          {active?.name}
          {cart.filter ? " + water filter" : ""}
        </span>
        <strong>{money(total)}</strong>
      </div>
    </ConfirmationDialog>
  );
}
