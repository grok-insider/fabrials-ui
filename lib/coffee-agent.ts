import { coffeeProducts, type CoffeeId } from "@/lib/coffee-demo";

export interface AgentRequest {
  id: string;
  label: string;
  prompt: string;
  maxWidth: number;
  fitting: "58 mm" | "54 mm";
}

/** Fictional shopper requests. The agent only ever acts through the page's registered tools. */
export const agentRequests: AgentRequest[] = [
  {
    id: "compact",
    label: "32 cm · 58 mm",
    prompt:
      "Find a machine for my 32 cm counter that works with my 58 mm accessories. Add a filter if it fits.",
    maxWidth: 32,
    fitting: "58 mm",
  },
  {
    id: "roomy",
    label: "40 cm · 54 mm",
    prompt:
      "I have 40 cm of counter and 54 mm accessories. Pick the machine that fits and get it ready for review.",
    maxWidth: 40,
    fitting: "54 mm",
  },
  {
    id: "tight",
    label: "28 cm · 58 mm",
    prompt:
      "My counter is only 28 cm wide and I own 58 mm accessories. What fits?",
    maxWidth: 28,
    fitting: "58 mm",
  },
];

export interface MachineVerdict {
  id: CoffeeId;
  name: string;
  fits: boolean;
  compatible: boolean;
  reasons: string[];
}

/** Reads the machine to choose from a compare_coffee_machines result, never from page state. */
export function chooseFromComparison(result: unknown): {
  choice: MachineVerdict | null;
  verdicts: MachineVerdict[];
} {
  const products =
    result && typeof result === "object" && "products" in result
      ? (result as { products: unknown }).products
      : null;
  const known = new Set<string>(coffeeProducts.map((p) => p.id));
  const verdicts = Array.isArray(products)
    ? (products as MachineVerdict[]).filter((p) => known.has(p?.id))
    : [];
  return {
    choice: verdicts.find((p) => p.fits && p.compatible) ?? null,
    verdicts,
  };
}
