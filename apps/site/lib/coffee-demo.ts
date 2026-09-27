/** Fictional products and prices for the interactive example; no real purchases. */
export const coffeeProducts = [
  {
    id: "studio",
    name: "Studio Dual",
    price: 1290,
    width: 29,
    fitting: "58 mm",
    milk: "Independent steam",
    color: "#e5e2d6",
  },
  {
    id: "atelier",
    name: "Atelier Pro",
    price: 1890,
    width: 36,
    fitting: "54 mm",
    milk: "Independent steam",
    color: "#444c46",
  },
] as const;
export type CoffeeId = (typeof coffeeProducts)[number]["id"];
export const coffeeRequest =
  "A machine for two flat whites. My counter is 32 cm wide, and I already own 58 mm accessories.";
export function compareCoffee(maxWidth: number, fitting: string) {
  return coffeeProducts.map((product) => ({
    ...product,
    fits: product.width <= maxWidth,
    compatible: product.fitting === fitting,
    reasons: [
      `${product.width} cm ${product.width <= maxWidth ? "fits" : "exceeds"} your ${maxWidth} cm space`,
      `${product.fitting} ${product.fitting === fitting ? "matches" : "does not match"} your accessories`,
    ],
  }));
}
export function coffeeTotal(id: CoffeeId | null, filter: boolean) {
  return (
    (coffeeProducts.find((p) => p.id === id)?.price ?? 0) +
    (id && filter ? 24 : 0)
  );
}
