// One middle size, written either way (0.12). A product that settled on `md` can pass it to a component whose middle size
// has always been `default`, and the other way round: the component draws the same pixels, because the canonical word is the
// one it has always used.

/** The four sizes the house words name. Anything else (a pixel number, `icon-sm`, `touch`) is a component's own scale. */
export type SizeWord = "sm" | "default" | "md" | "lg";

/**
 * `size` with `md` and `default` naming the same middle size: `canonical` says which word the component draws with, and
 * every other size passes through untouched. `undefined` stays `undefined`, so a component can still tell "not given".
 */
export function canonicalSize(size: SizeWord | undefined, canonical: "default"): "sm" | "default" | "lg" | undefined;
export function canonicalSize(size: SizeWord | undefined, canonical: "md"): "sm" | "md" | "lg" | undefined;
export function canonicalSize(size: SizeWord | undefined, canonical: "default" | "md"): SizeWord | undefined {
  if (size === undefined) return undefined;
  return size === "default" || size === "md" ? canonical : size;
}
