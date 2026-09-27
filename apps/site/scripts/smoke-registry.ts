import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
const source = process.cwd();
const origin = process.env.REGISTRY_ORIGIN ?? "http://localhost:3210";
const root = await mkdtemp(join(tmpdir(), "fabrials-registry-"));
const run = (cmd: string, args: string[], cwd: string) =>
  execFileSync(cmd, args, { cwd, stdio: "inherit", env: process.env });
for (const template of ["vite", "next"]) {
  const dir = join(root, template);
  await mkdir(join(dir, "app"), { recursive: true });
  await mkdir(join(dir, "lib"), { recursive: true });
  const pkg = {
    name: `registry-smoke-${template}`,
    private: true,
    type: "module",
    scripts: { build: template === "vite" ? "vite build" : "next build" },
    dependencies: {
      react: "^19.2.0",
      "react-dom": "^19.2.0",
      ...(template === "next" ? { next: "16.3.4" } : {}),
    },
    devDependencies: {
      typescript: "npm:@typescript/typescript6@^6.0.2",
      "@typescript/native": "npm:typescript@^7.0.2",
      "@types/react": "^19.0.0",
      "@types/react-dom": "^19.0.0",
      "@types/node": "^22.0.0",
      tailwindcss: "^4.0.0",
      "@tailwindcss/postcss": "^4.0.0",
      ...(template === "vite" ? { vite: "latest" } : {}),
    },
  };
  await writeFile(join(dir, "package.json"), JSON.stringify(pkg));
  await writeFile(
    join(dir, "env.d.ts"),
    `/// <reference types="${template === "vite" ? "vite/client" : "next"}" />\n`,
  );
  await writeFile(
    join(dir, "tsconfig.json"),
    JSON.stringify({
      compilerOptions: {
        target: "ES2022",
        lib: ["dom", "dom.iterable", "esnext"],
        skipLibCheck: true,
        strict: true,
        noEmit: true,
        esModuleInterop: true,
        module: "esnext",
        moduleResolution: "bundler",
        jsx: "react-jsx",
        paths: { "@/*": ["./*"] },
      },
      include: ["**/*.ts", "**/*.tsx"],
      exclude: ["node_modules"],
    }),
  );
  await writeFile(
    join(dir, "components.json"),
    await readFile("components.json"),
  );
  await writeFile(join(dir, "lib/utils.ts"), await readFile("lib/utils.ts"));
  await writeFile(join(dir, "app/globals.css"), '@import "tailwindcss";');
  await writeFile(
    join(dir, "postcss.config.mjs"),
    "export default {plugins:{'@tailwindcss/postcss':{}}};",
  );
  run("bun", ["install"], dir);
  const names = [
    "comparison",
    "mcp-dashboard",
    "webmcp-provider",
    "webmcp-form",
    "data-explorer",
    "date-range",
    "wizard",
    "confirmation-dialog",
    "action-button",
    "support-badge",
    ...(template === "next" ? ["server-connector"] : []),
  ];
  run(
    join(source, "node_modules/.bin/shadcn"),
    ["add", ...names.map((n) => `${origin}/r/${n}.json`), "-y", "--overwrite"],
    dir,
  );
  const component = `"use client";
import {MCPDashboard} from '@/components/webmcp/mcp-dashboard';
import {Comparison} from '@/components/webmcp/comparison';
export default function App(){return <><Comparison columns={[{id:"demo",title:"Demo"}]} rows={[]} caption="Compare choices"/><MCPDashboard/></>;}`;
  if (template === "vite") {
    await writeFile(join(dir, "App.tsx"), component);
    await writeFile(
      join(dir, "main.tsx"),
      "import {createRoot} from 'react-dom/client';import App from './App';import './app/globals.css';createRoot(document.getElementById('root')!).render(<App/>);",
    );
    await writeFile(
      join(dir, "index.html"),
      '<html><body><div id="root"></div><script type="module" src="/main.tsx"></script></body></html>',
    );
    await writeFile(
      join(dir, "vite.config.ts"),
      "import {defineConfig} from 'vite';import {fileURLToPath} from 'node:url';export default defineConfig({resolve:{alias:{'@':fileURLToPath(new URL('.',import.meta.url))}}});",
    );
  } else {
    await writeFile(join(dir, "app/page.tsx"), component);
    await writeFile(
      join(dir, "app/layout.tsx"),
      "import './globals.css';export default function Layout({children}:{children:React.ReactNode}){return <html lang='en'><body>{children}</body></html>;}",
    );
  }
  run(join(dir, "node_modules/.bin/tsc"), ["--noEmit"], dir);
  run("bun", ["run", "build"], dir);
}
console.log(`Registry installs and builds passed: ${root}`);
