import { readFileSync } from "node:fs";

const cache = new Map<string, string>();

/**
 * A package's stylesheet as it ships: the parts of `src/styles/`, concatenated in the
 * order of `src/styles/order.json`. That text is what `dist/styles.css` carries, so a
 * test that reads it sees the same rules in the same order as a product.
 */
function concatenate(packageName: string): string {
  const cached = cache.get(packageName);
  if (cached !== undefined) return cached;
  const directory = new URL(`../../packages/${packageName}/src/styles/`, import.meta.url);
  const order = JSON.parse(readFileSync(new URL("order.json", directory), "utf8")) as string[];
  const text = order.map((file) => readFileSync(new URL(file, directory), "utf8")).join("");
  cache.set(packageName, text);
  return text;
}

export const uiStyles = () => concatenate("ui");
export const aiStyles = () => concatenate("ai-ui");
