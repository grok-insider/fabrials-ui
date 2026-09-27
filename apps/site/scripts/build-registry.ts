import { readFile, mkdir, writeFile } from "node:fs/promises";
import { catalog } from "../lib/catalog";
const pkg = JSON.parse(await readFile("package.json", "utf8"));
const origin = process.env.REGISTRY_ORIGIN ?? "https://ui.fabrials.com";
function target(path: string) {
  return path
    .replace("registry/components/", "components/webmcp/")
    .replace("registry/webmcp/", "lib/webmcp/")
    .replace("registry/mcp/", "lib/mcp/")
    .replace("registry/server/", "lib/mcp-server/");
}
async function dependencySpec(packageName: string, version: string) {
  if (!version.startsWith("workspace:")) return `${packageName}@${version}`;
  // Workspace packages publish to npm under their own version.
  const dir = packageName.replace("@fabrials/", "");
  const manifest = JSON.parse(
    await readFile(`../../packages/${dir}/package.json`, "utf8"),
  ) as { version: string };
  return `${packageName}@^${manifest.version}`;
}
await mkdir("public/r", { recursive: true });
const items = [];
for (const item of catalog) {
  const visited = new Set<string>();
  const files: {
    path: string;
    type: string;
    target: string;
    content: string;
  }[] = [];
  const deps = new Set<string>();
  const ui = new Set<string>();
  async function visit(path: string) {
    if (visited.has(path)) return;
    visited.add(path);
    let source = await readFile(path, "utf8");
    for (const match of source.matchAll(/from ['"]([^'"]+)['"]/g)) {
      const name = match[1];
      if (name.startsWith("@/registry/")) {
        const base = name.slice(2);
        let found = false;
        for (const ext of [".ts", ".tsx"]) {
          try {
            await readFile(base + ext);
            await visit(base + ext);
            found = true;
            break;
          } catch (e) {
            if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
          }
        }
        if (!found) throw new Error(`Missing ${name}`);
      } else if (name.startsWith("@/components/ui/"))
        ui.add(name.split("/").at(-1)!);
      else if (
        !name.startsWith("@/") &&
        !name.startsWith("node:") &&
        name !== "react"
      ) {
        const packageName = name.startsWith("@")
          ? name.split("/").slice(0, 2).join("/")
          : name.split("/")[0];
        const version = pkg.dependencies[packageName];
        if (version) deps.add(await dependencySpec(packageName, version));
      }
    }
    source = source
      .replaceAll("@/registry/components/", "@/components/webmcp/")
      .replaceAll("@/registry/webmcp/", "@/lib/webmcp/")
      .replaceAll("@/registry/mcp/", "@/lib/mcp/")
      .replaceAll("@/registry/server/", "@/lib/mcp-server/");
    files.push({
      path,
      type: path.includes("/components/")
        ? "registry:component"
        : "registry:lib",
      target: target(path),
      content: source,
    });
  }
  for (const file of item.files) await visit(file);
  if (ui.size)
    for (const name of [
      "@base-ui/react",
      "class-variance-authority",
      "clsx",
      "tailwind-merge",
      "tw-animate-css",
    ])
      deps.add(`${name}@${pkg.dependencies[name]}`);
  const result = {
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    name: item.slug,
    type:
      item.slug === "mcp-dashboard"
        ? "registry:block"
        : item.category === "Foundation"
          ? "registry:lib"
          : "registry:component",
    title: item.title,
    description: item.description,
    author: "Fabrials <admin@grokinsider.net>",
    dependencies: [...deps].sort(),
    registryDependencies: [...ui].sort(),
    files,
  };
  await writeFile(
    `public/r/${item.slug}.json`,
    JSON.stringify(result, null, 2) + "\n",
  );
  items.push(result);
}
await writeFile(
  "public/registry.json",
  JSON.stringify(
    {
      $schema: "https://ui.shadcn.com/schema/registry.json",
      name: "fabrials-webmcp",
      homepage: origin,
      items,
    },
    null,
    2,
  ) + "\n",
);
await writeFile(
  "public/llms.txt",
  `# Fabrials WebMCP UI\n\nReact 19 / Tailwind 4 / shadcn Base UI registry. MIT.\nMCP target: 2026-07-28. WebMCP is a browser proposal, distinct from remote MCP.\n\nBrowse the [component catalog](${origin}/components) or explore [complete examples](${origin}/playground).\n\n## Components\n${catalog.map((x) => `- [${x.title}](${origin}/docs/${x.slug}): ${x.description}\n  Install: bunx shadcn@latest add ${origin}/r/${x.slug}.json`).join("\n")}\n\n## Guides\n${["installation", "webmcp", "interactive-demo", "authentication", "server", "compatibility"].map((x) => `- ${origin}/docs/${x}`).join("\n")}\n`,
);
console.log(`Built ${items.length} registry items.`);
