/**
 * Builds the public registry served at ui.fabrials.com/r/: Fabrials blocks,
 * the `styles` and `init` entries, the shims and the aggregated third-party
 * components, plus registry.json and llms.txt.
 *
 *   bun run registry:build            write public/
 *   bun run registry:build --check    fail if public/ is stale
 *   REGISTRY_ORIGIN=http://localhost:3210 bun run registry:build --out /tmp/r
 */
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { catalog, guides } from "../lib/catalog";
import { loadExternal, visibleExternal } from "../lib/external";
import { uiCatalog } from "../lib/ui-catalog";
import { publishExternalItem } from "../lib/upstreams";

const args = process.argv.slice(2);
const check = args.includes("--check");
const outArg = args.indexOf("--out");
const out = outArg >= 0 ? args[outArg + 1]! : "public";
const origin = (process.env.REGISTRY_ORIGIN ?? "https://ui.fabrials.com").replace(/\/$/, "");
const url = (name: string) => `${origin}/r/${name}.json`;

const pkg = JSON.parse(await readFile("package.json", "utf8")) as { dependencies: Record<string, string> };
const uiVersion = (JSON.parse(await readFile("../../packages/ui/package.json", "utf8")) as { version: string }).version;
const fabrialsUi = `@fabrials/ui@^${uiVersion}`;
const shims = new Set((await readdir("registry/shims")).filter((f) => f.endsWith(".tsx")).map((f) => f.replace(/\.tsx$/, "")));

type Item = Record<string, unknown> & { name: string; type: string; title: string; description: string; meta: Record<string, unknown> };
const items: Item[] = [];

// ---------------------------------------------------------------- styles
items.push({
  $schema: "https://ui.shadcn.com/schema/registry-item.json",
  name: "styles",
  type: "registry:item",
  title: "Fabrials styles",
  description: "Installs @fabrials/ui and imports its tokens, IBM Plex and component styles. Every Fabrials block and shim depends on it.",
  dependencies: [fabrialsUi],
  registryDependencies: [],
  files: [],
  css: {
    '@import "@fabrials/ui/tokens.css"': {},
    '@import "@fabrials/ui/fonts.css"': {},
    '@import "@fabrials/ui/styles.css"': {},
    '@import "@fabrials/ui/tailwind.css"': {},
  },
  meta: { source: "fabrials", tier: "fabrials", license: "MIT", category: "Setup" },
});

// ---------------------------------------------------------------- init
/** shadcn's semantic tokens, read from the design system so the palette has one source. */
const SHADCN_TOKENS = [
  "background", "foreground", "card", "card-foreground", "popover", "popover-foreground", "primary",
  "primary-foreground", "secondary", "secondary-foreground", "muted", "muted-foreground", "accent",
  "accent-foreground", "destructive", "border", "input", "ring", "chart-1", "chart-2", "chart-3", "chart-4",
  "chart-5", "sidebar", "sidebar-foreground", "sidebar-primary", "sidebar-primary-foreground", "sidebar-accent",
  "sidebar-accent-foreground", "sidebar-border", "sidebar-ring",
];
const tokens = await readFile("../../packages/ui/src/tokens.css", "utf8");
function block(selectorStart: string) {
  const start = tokens.indexOf(selectorStart);
  const body = tokens.slice(tokens.indexOf("{", start) + 1, tokens.indexOf("\n}", start));
  const vars: Record<string, string> = {};
  for (const [, name, value] of body.matchAll(/--([\w-]+):\s*([^;]+);/g)) vars[name!] = value!.replace(/\s+/g, " ").trim();
  return vars;
}
const lightTokens = block(":root,");
const darkTokens = block(".dark,");
const pick = (source: Record<string, string>, fallback: Record<string, string> = {}) =>
  Object.fromEntries(SHADCN_TOKENS.map((name) => [name, source[name] ?? fallback[name]]).filter(([, value]) => value));
items.push({
  $schema: "https://ui.shadcn.com/schema/registry-item.json",
  name: "init",
  type: "registry:base",
  title: "Fabrials UI",
  description:
    "Sets a shadcn app up for Fabrials UI: Base UI primitives, the @fabrials registry, the styles, IBM Plex and the Highstorm palette in light and dark.",
  dependencies: [fabrialsUi],
  registryDependencies: [url("styles"), "utils"],
  files: [],
  // components.json: shadcn's Base UI style (the one the shims match) and the @fabrials namespace.
  config: {
    style: "base-nova",
    iconLibrary: "lucide",
    registries: { "@fabrials": `${origin}/r/{name}.json` },
  },
  cssVars: {
    theme: {
      "font-sans": "var(--fui-font-sans)",
      "font-mono": "var(--fui-font-mono)",
      "font-display": "var(--fui-font-display)",
    },
    light: { ...pick(lightTokens), radius: lightTokens.radius },
    dark: pick(darkTokens, lightTokens),
  },
  docs: "Fabrials UI is set up. Add components by name, for example: npx shadcn@latest add @fabrials/button @fabrials/mcp-dashboard",
  meta: { source: "fabrials", tier: "fabrials", license: "MIT", category: "Setup" },
});

// ---------------------------------------------------------------- Fabrials blocks
function target(path: string) {
  return path
    .replace("registry/components/", "components/webmcp/")
    .replace("registry/webmcp/", "lib/webmcp/")
    .replace("registry/mcp/", "lib/mcp/")
    .replace("registry/server/", "lib/mcp-server/");
}
async function dependencySpec(name: string, version: string) {
  if (!version.startsWith("workspace:")) return `${name}@${version}`;
  const manifest = JSON.parse(await readFile(`../../packages/${name.replace("@fabrials/", "")}/package.json`, "utf8")) as { version: string };
  return `${name}@^${manifest.version}`;
}
for (const entry of catalog) {
  const visited = new Set<string>();
  const files: { path: string; type: string; target: string; content: string }[] = [];
  const deps = new Set<string>();
  const registryDependencies = new Set<string>();
  let usesShadcnPrimitive = false;
  async function visit(path: string) {
    if (visited.has(path)) return;
    visited.add(path);
    let source = await readFile(path, "utf8");
    for (const match of source.matchAll(/from ['"]([^'"]+)['"]/g)) {
      const name = match[1]!;
      if (name.startsWith("@/registry/")) {
        const base = name.slice(2);
        let ok = false;
        for (const file of [`${base}.ts`, `${base}.tsx`]) {
          try {
            await readFile(file);
            await visit(file);
            ok = true;
            break;
          } catch (error) {
            if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
          }
        }
        if (!ok) throw new Error(`Missing ${name}`);
      } else if (name.startsWith("@/components/ui/")) {
        const primitive = name.split("/").at(-1)!;
        if (shims.has(primitive)) registryDependencies.add(url(primitive));
        else {
          registryDependencies.add(primitive);
          usesShadcnPrimitive = true;
        }
      } else if (name === "@/lib/utils") registryDependencies.add("utils");
      else if (!name.startsWith("@/") && !name.startsWith("node:") && name !== "react") {
        const packageName = name.startsWith("@") ? name.split("/").slice(0, 2).join("/") : name.split("/")[0]!;
        const version = pkg.dependencies[packageName];
        if (version) deps.add(await dependencySpec(packageName, version));
        if (packageName === "@fabrials/ui" || packageName === "@fabrials/ai-ui") registryDependencies.add(url("styles"));
      }
    }
    source = source
      .replaceAll("@/registry/components/", "@/components/webmcp/")
      .replaceAll("@/registry/webmcp/", "@/lib/webmcp/")
      .replaceAll("@/registry/mcp/", "@/lib/mcp/")
      .replaceAll("@/registry/server/", "@/lib/mcp-server/");
    files.push({ path, type: path.includes("/components/") ? "registry:component" : "registry:lib", target: target(path), content: source });
  }
  for (const file of entry.files) await visit(file);
  if (usesShadcnPrimitive)
    for (const name of ["@base-ui/react", "class-variance-authority", "clsx", "tailwind-merge"]) deps.add(`${name}@${pkg.dependencies[name]}`);
  items.push({
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    name: entry.slug,
    type: entry.slug === "mcp-dashboard" ? "registry:block" : entry.category === "Foundation" ? "registry:lib" : "registry:component",
    title: entry.title,
    description: entry.description,
    author: "Fabrials <admin@grokinsider.net>",
    dependencies: [...deps].sort(),
    registryDependencies: [...registryDependencies].sort(),
    files,
    meta: { source: "fabrials", tier: "fabrials", license: "MIT", category: entry.category },
  });
}

// ---------------------------------------------------------------- shims
for (const name of [...shims].sort()) {
  const doc = uiCatalog.find((entry) => entry.slug === name);
  items.push({
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    name,
    type: "registry:ui",
    title: doc?.title ?? name.replace(/(^|-)(\w)/g, (_, dash: string, c: string) => `${dash ? " " : ""}${c.toUpperCase()}`),
    description: `shadcn's ${name}, backed by @fabrials/ui. ${doc?.description ?? ""}`.trim(),
    author: "Fabrials <admin@grokinsider.net>",
    dependencies: [fabrialsUi],
    registryDependencies: [url("styles")],
    files: [{ path: `registry/shims/${name}.tsx`, type: "registry:ui", content: await readFile(`registry/shims/${name}.tsx`, "utf8") }],
    meta: { source: "shim", tier: "fabrials", license: "MIT", category: "Shims", shadcn: name },
  });
}

// ---------------------------------------------------------------- aggregated
const libraries = loadExternal();
for (const { snapshot, licenseText, items: entries } of libraries)
  for (const { item, raw } of entries)
    items.push(publishExternalItem(raw, item, snapshot, licenseText, { origin, shims }) as unknown as Item);

// ---------------------------------------------------------------- outputs
const output = new Map<string, string>();
const json = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`;
for (const item of items) output.set(`r/${item.name}.json`, json(item));
const index = {
  $schema: "https://ui.shadcn.com/schema/registry.json",
  name: "fabrials",
  homepage: origin,
  items: items.map(({ files, ...rest }) => ({
    ...Object.fromEntries(Object.entries(rest).filter(([key]) => !["$schema", "css", "cssVars", "docs"].includes(key))),
    files: (files as { path: string; type: string; target?: string }[]).map(({ path, type, target }) => ({ path, type, ...(target ? { target } : {}) })),
  })),
};
output.set("registry.json", json(index));
output.set("r/registry.json", json(index));

const visible = visibleExternal(libraries);
const line = (name: string, title: string, description: string) => `- [${title}](${origin}/docs/${name}): ${description}\n  Install: npx shadcn@latest add ${url(name)}`;
output.set(
  "llms.txt",
  `# Fabrials UI

The Fabrials design system as a shadcn registry: Fabrials' own components, shims that back shadcn primitives with @fabrials/ui, and components from other open-source libraries under permissive licenses, each labelled with its license and origin.
React 19, Tailwind 4, Base UI. MCP target 2026-07-28; WebMCP is a browser proposal, distinct from remote MCP.

## Set up
Namespace: add "registries": { "@fabrials": "${origin}/r/{name}.json" } to components.json, then npx shadcn@latest add @fabrials/<name>.
- New app: npx shadcn@latest init ${url("init")}
- Existing app: npx shadcn@latest add ${url("init")} (palette and styles) or ${url("styles")} (styles only)
- Design principles: ${origin}/docs/design

## Fabrials components
${catalog.map((entry) => line(entry.slug, entry.title, entry.description)).join("\n")}

## Shims (shadcn names, @fabrials/ui controls)
${[...shims].sort().map((name) => `- ${name}: npx shadcn@latest add ${url(name)}`).join("\n")}

## From other libraries
${libraries
  .map(
    ({ snapshot }) =>
      `### ${snapshot.title} (${snapshot.license.spdx}, ${snapshot.tier}) ${snapshot.homepage}\n${visible
        .filter((entry) => entry.library.name === snapshot.name)
        .map((entry) => line(entry.slug, entry.item.title, entry.item.description))
        .join("\n")}`,
  )
  .join("\n\n")}

## Guides
${guides.map((guide) => `- ${origin}/docs/${guide.slug}`).join("\n")}
- ${origin}/libraries
`,
);

const stale: string[] = [];
for (const [path, content] of output) {
  const file = join(out, path);
  const current = await readFile(file, "utf8").catch(() => null);
  if (current === content) continue;
  if (check) stale.push(file);
  else {
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, content);
  }
}
for (const file of await readdir(join(out, "r")).catch(() => [] as string[]))
  if (!output.has(`r/${file}`)) {
    if (check) stale.push(join(out, "r", file));
    else await rm(join(out, "r", file));
  }
if (stale.length) {
  console.error(`The registry is out of date (run bun run registry:build):\n${stale.join("\n")}`);
  process.exit(1);
}
console.log(`${check ? "Checked" : "Built"} ${items.length} registry items (${shims.size} shims, ${visible.length} from ${libraries.length} libraries).`);
