/**
 * Installs the registry into a brand-new Next.js app the way a user would,
 * then typechecks and builds it:
 *
 *   REGISTRY_ORIGIN=http://127.0.0.1:4390 FABRIALS_NPM_REGISTRY=http://127.0.0.1:4873/ bun run test:registry
 *
 * REGISTRY_ORIGIN serves `registry:build --out` output (defaults to the
 * public site). FABRIALS_NPM_REGISTRY points the @fabrials scope at another
 * npm registry, such as a local Verdaccio holding `npm pack` builds, for
 * versions not yet on npm. See docs/registry.md.
 */
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const origin = (process.env.REGISTRY_ORIGIN ?? "https://ui.fabrials.com").replace(/\/$/, "");
const scope = process.env.FABRIALS_NPM_REGISTRY;
const root = await mkdtemp(join(tmpdir(), "fabrials-registry-"));
const run = (cmd: string, args: string[], cwd: string) => execFileSync(cmd, args, { cwd, stdio: "inherit", env: process.env });

run(
  "bunx",
  ["create-next-app@16", "app", "--ts", "--tailwind", "--app", "--eslint", "--no-src-dir", "--import-alias", "@/*", "--use-bun", "--yes", "--disable-git"],
  root,
);
const app = join(root, "app");
if (scope) await writeFile(join(app, "bunfig.toml"), `[install.scopes]\n"@fabrials" = "${scope}"\n`);

run("npx", ["-y", "shadcn@latest", "init", `${origin}/r/init.json`, "--yes"], app);
const config = JSON.parse(await readFile(join(app, "components.json"), "utf8"));
if (config.style !== "base-nova" || config.registries?.["@fabrials"] !== `${origin}/r/{name}.json`)
  throw new Error("init did not configure the Base UI style and the @fabrials registry");

const names = [
  "mcp-dashboard",
  "comparison",
  "date-range",
  "webmcp-form",
  "button",
  "dialog",
  "select",
  "dropdown-menu",
  "magicui-file-tree",
  "magicui-marquee",
  "kibo-kanban",
  "kibo-dropzone",
];
run("npx", ["-y", "shadcn@latest", "add", ...names.map((name) => `@fabrials/${name}`), "--yes", "--overwrite"], app);

for (const [file, notice] of [
  ["components/ui/marquee.tsx", "Magic UI"],
  ["components/kibo-ui/kanban/index.tsx", "Kibo UI"],
  ["components/ui/button.tsx", "Fabrials UI shim"],
])
  if (!(await readFile(join(app, file), "utf8")).includes(notice)) throw new Error(`${file} lost its notice on install`);

await writeFile(
  join(app, "app/page.tsx"),
  `"use client";
import { DitherGem } from "@fabrials/ui";
import { Button } from "@/components/ui/button";
import { Comparison } from "@/components/webmcp/comparison";
import { MCPDashboard } from "@/components/webmcp/mcp-dashboard";
import { Marquee } from "@/components/ui/marquee";
import { Tree, Folder, File } from "@/components/ui/file-tree";
import { Dropzone, DropzoneContent, DropzoneEmptyState } from "@/components/kibo-ui/dropzone";

export default function Page() {
  return (
    <main className="grid gap-8 p-8">
      <h1 className="font-display text-4xl font-semibold"><DitherGem gem="zircon" size={28} /> Registry smoke</h1>
      <Button>Primary</Button>
      <Comparison columns={[{ id: "a", title: "A" }]} rows={[]} caption="Compare" />
      <Marquee><span>One</span><span>Two</span></Marquee>
      <Tree elements={[{ id: "1", name: "src", children: [{ id: "2", name: "page.tsx" }] }]}>
        <Folder element="src" value="1"><File value="2">page.tsx</File></Folder>
      </Tree>
      <Dropzone><DropzoneEmptyState /><DropzoneContent /></Dropzone>
      <MCPDashboard />
    </main>
  );
}
`,
);
run("npx", ["tsc", "--noEmit"], app);
run("bun", ["run", "build"], app);
console.log(`The registry installs, typechecks and builds in a new app: ${app}`);
