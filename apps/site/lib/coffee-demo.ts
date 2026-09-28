/** Fictional products and prices for the interactive example; no real purchases. */
export type Steam = "independent" | "shared" | "none";
export type MachineShape = "lever" | "single" | "twin";

export const coffeeProducts = [
  {
    id: "lever",
    name: "Nomad Lever",
    price: 540,
    width: 18,
    height: 42,
    fitting: "51 mm",
    steam: "none",
    shape: "lever",
    color: "#2f343b",
  },
  {
    id: "solo",
    name: "Studio Solo",
    price: 890,
    width: 26,
    height: 36,
    fitting: "58 mm",
    steam: "shared",
    shape: "single",
    color: "#aeb4ba",
  },
  {
    id: "studio",
    name: "Studio Dual",
    price: 1290,
    width: 29,
    height: 38,
    fitting: "58 mm",
    steam: "independent",
    shape: "single",
    color: "#e5e2d6",
  },
  {
    id: "atelier",
    name: "Atelier Pro",
    price: 1890,
    width: 36,
    height: 40,
    fitting: "54 mm",
    steam: "independent",
    shape: "single",
    color: "#444c46",
  },
  {
    id: "twin",
    name: "Barista Twin",
    price: 2390,
    width: 41,
    height: 41,
    fitting: "58 mm",
    steam: "independent",
    shape: "twin",
    color: "#b0764a",
  },
] as const satisfies readonly {
  id: string;
  name: string;
  price: number;
  width: number;
  height: number;
  fitting: string;
  steam: Steam;
  shape: MachineShape;
  color: string;
}[];

export type CoffeeProduct = (typeof coffeeProducts)[number];
export type CoffeeId = CoffeeProduct["id"];
export const coffeeIds = coffeeProducts.map((product) => product.id);
export const coffeeFittings = ["58 mm", "54 mm", "51 mm"] as const;

export const steamLabel: Record<Steam, string> = {
  independent: "Independent steam",
  shared: "Shared boiler",
  none: "No steam wand",
};

export const coffeeRequest =
  "A machine for two flat whites. My counter is 32 cm wide, and I already own 58 mm accessories.";

/**
 * Checks each machine against the counter, the accessories and the drinks.
 * Two flat whites need steam while the second shot brews, so only
 * independent steam counts; a shared boiler makes you wait.
 */
export function compareCoffee(maxWidth: number, fitting: string) {
  return coffeeProducts.map((product) => {
    const fits = product.width <= maxWidth;
    const compatible = product.fitting === fitting;
    const milk = product.steam === "independent";
    return {
      ...product,
      fits,
      compatible,
      milk,
      met: [fits, compatible, milk].filter(Boolean).length,
      reasons: [
        `${product.width} cm ${fits ? "fits" : "exceeds"} your ${maxWidth} cm space`,
        `${product.fitting} ${compatible ? "matches" : "does not match"} your accessories`,
        milk
          ? "independent steam makes both flat whites without waiting"
          : product.steam === "shared"
            ? "its shared boiler makes you wait between the two drinks"
            : "it has no steam wand for milk",
      ],
    };
  });
}

/** The machine that meets every requirement, if one does. */
export function coffeeMatch(maxWidth: number, fitting: string) {
  return compareCoffee(maxWidth, fitting).find((product) => product.fits && product.compatible && product.milk);
}

export function coffeeTotal(id: CoffeeId | null, filter: boolean) {
  return (coffeeProducts.find((p) => p.id === id)?.price ?? 0) + (id && filter ? 24 : 0);
}
