/**
 * Records the names each shadcn primitive exports (base-nova style), so the
 * shims can be checked offline: a shim ships only when @fabrials/ui covers
 * every name the shadcn file exports. Run by hand when shadcn changes:
 *   bun run registry:shadcn
 */
import { writeFile } from "node:fs/promises";

const style = "base-nova";
const base = `https://ui.shadcn.com/r/styles/${style}`;

type Item = { name: string; type: string; files?: { content?: string }[] };

function exportedNames(source: string): string[] {
  const names = new Set<string>();
  for (const [, list] of source.matchAll(/export\s*{([^}]*)}/g))
    for (const part of list!.split(","))
      if (!/^\s*type\s/.test(part)) {
        const name = part.trim().split(/\s+as\s+/).pop()?.trim();
        if (name) names.add(name);
      }
  for (const [, name] of source.matchAll(/export\s+(?:async\s+)?(?:function|const|class)\s+([A-Za-z0-9_]+)/g)) names.add(name!);
  return [...names].sort();
}

const index = (await (await fetch(`${base}/registry.json`)).json()) as { items: Item[] };
const primitives = index.items.filter((item) => item.type === "registry:ui").map((item) => item.name).sort();
const items: Record<string, string[]> = {};
for (const name of primitives) {
  const item = (await (await fetch(`${base}/${name}.json`)).json()) as Item;
  items[name] = exportedNames((item.files ?? []).map((file) => file.content ?? "").join("\n"));
}
await writeFile(
  "registry/shims/shadcn-exports.json",
  `${JSON.stringify({ style, source: base, fetchedAt: new Date().toISOString().slice(0, 10), items }, null, 2)}\n`,
);
console.log(`Recorded ${primitives.length} shadcn primitives.`);
