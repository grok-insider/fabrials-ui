/**
 * Shims: shadcn primitives backed by @fabrials/ui. A shim installs as
 * `components/ui/<name>.tsx` and re-exports the Fabrials control under
 * shadcn's names, so third-party components that import
 * `@/components/ui/button` get the Fabrials button. A primitive becomes a shim
 * only when @fabrials/ui exports every name shadcn's file exports.
 */
import shadcn from "@/registry/shims/shadcn-exports.json";

export type ShadcnSnapshot = {
  style: string;
  source: string;
  fetchedAt: string;
  items: Record<string, string[]>;
};

export const shadcnSnapshot = shadcn as ShadcnSnapshot;

/** Primitives @fabrials/ui covers completely, given its export names. */
export function coveredPrimitives(exported: Iterable<string>, snapshot: ShadcnSnapshot = shadcnSnapshot) {
  const ours = new Set(exported);
  return Object.entries(snapshot.items)
    .filter(([, names]) => names.length > 0 && names.every((name) => ours.has(name)))
    .map(([name, names]) => ({ name, names }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** The source of one shim file. */
export function shimSource(name: string, names: string[]) {
  return `// Fabrials UI shim for shadcn's ${name}: https://ui.fabrials.com/docs/shims
// The names match shadcn; the control is @fabrials/ui's. Import from
// "@fabrials/ui" directly in new code.
export { ${names.join(", ")} } from "@fabrials/ui";
`;
}
