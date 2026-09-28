import type { ReactNode } from "react";
import { Check, X } from "lucide-react";
import type { ComparisonColumn, ComparisonRow } from "@/registry/components/comparison";
import { MachineFigure } from "@/components/demo/machine-figure";
import { coffeeMatch, coffeeProducts, compareCoffee, steamLabel, type CoffeeProduct } from "@/lib/coffee-demo";
import "./demo.css";

const money = new Intl.NumberFormat("en", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

export function CoffeeReason({ value, note, good = false }: { value: ReactNode; note?: string; good?: boolean }) {
  return (
    <span className="demo-reason">
      {value}
      {note && (
        <small data-good={good || undefined}>
          {good ? <Check aria-hidden /> : <X aria-hidden />}
          {note}
        </small>
      )}
    </span>
  );
}

/** One column per machine, drawn to scale over the counter once it has been compared. */
export function coffeeColumns(
  compared: { width: number; fitting: string } | null,
  action: (product: CoffeeProduct) => ReactNode,
): ComparisonColumn[] {
  const best = compared ? coffeeMatch(compared.width, compared.fitting)?.id : undefined;
  return coffeeProducts.map((product) => ({
    recommended: product.id === best,
    id: product.id,
    title: product.name,
    subtitle: money.format(product.price),
    visual: <MachineFigure product={product} counter={compared?.width} className="demo-machine" />,
    action: action(product),
  }));
}

/**
 * The evidence rows. Before a comparison they list the specifications; after
 * one, each cell says whether it meets the requirement and a first row counts
 * what each machine meets.
 */
export function coffeeRows(compared: { width: number; fitting: string } | null): ComparisonRow[] {
  const results = compared ? compareCoffee(compared.width, compared.fitting) : [];
  const result = (id: string) => results.find((product) => product.id === id);
  const values = (cell: (product: CoffeeProduct) => ReactNode) =>
    Object.fromEntries(coffeeProducts.map((product) => [product.id, cell(product)]));
  const rows: ComparisonRow[] = [
    {
      id: "space",
      label: "Counter space",
      highlighted: Boolean(compared),
      values: values((product) => {
        const r = result(product.id);
        const over = compared ? product.width - compared.width : 0;
        return <CoffeeReason value={`${product.width} cm`} note={r ? (r.fits ? "Fits your space" : `${over} cm too wide`) : undefined} good={r?.fits} />;
      }),
    },
    {
      id: "fitting",
      label: "Accessory fit",
      highlighted: Boolean(compared),
      values: values((product) => {
        const r = result(product.id);
        return <CoffeeReason value={product.fitting} note={r ? (r.compatible ? "Keeps your accessories" : "Different fitting") : undefined} good={r?.compatible} />;
      }),
    },
    {
      id: "milk",
      label: "Two flat whites",
      highlighted: Boolean(compared),
      values: values((product) => {
        const r = result(product.id);
        const note = r ? (r.milk ? "Steams while it brews" : product.steam === "shared" ? "Wait between drinks" : "No milk") : undefined;
        return <CoffeeReason value={steamLabel[product.steam]} note={note} good={r?.milk} />;
      }),
    },
  ];
  if (!compared) return rows;
  return [
    {
      id: "met",
      label: "Your requirements",
      values: values((product) => {
        const met = result(product.id)!.met;
        return <CoffeeReason value={<strong>{met} of 3</strong>} note={met === 3 ? "Meets all three" : undefined} good={met === 3} />;
      }),
    },
    ...rows,
  ];
}
