import { build } from "vite";
import { cp, mkdir, readdir, copyFile, readFile, rename, rm } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
// Each package builds into dist.next and then replaces dist in one rename, so a
// running dev server (Next, Storybook) never reads a half-written package.
const staging = "dist.next";
// A source file is a client module when the directive is its first statement.
const clientDirective = /^(?:\s|\/\/[^\n]*\n|\/\*[\s\S]*?\*\/)*["']use client["'];?/;

/** Whether a source text opens with the "use client" directive (comments may come before it). */
export function isClientSource(code) {
  return clientDirective.test(code);
}

/** Bundles one package's modules into `outDir` (relative to the package), one file per source module. */
export async function bundle(name, outDir) {
  const directory = resolve(root, "packages", name);
  const clientModules = new Set();
  await build({
    configFile: false,
    root: directory,
    logLevel: "warn",
    plugins: [
      {
        name: "client-entry-boundary",
        enforce: "pre",
        // The bundler drops module-level directives, so the build remembers which
        // sources carried one and writes it back as the banner of that module.
        transform(code, id) {
          const directive = /\.[jt]sx?$/.test(id) ? clientDirective.exec(code) : null;
          if (!directive) return;
          clientModules.add(id);
          return { code: code.replace(directive[0], directive[0].replace(/["']use client["'];?$/, "")), map: null };
        },
      },
    ],
    build: {
      target: "es2022",
      minify: false,
      outDir,
      emptyOutDir: true,
      lib: {
        // Subpath exports that the index does not re-export are entries of their own,
        // or tree-shaking drops what the index does not use.
        entry:
          name === "ui"
            ? {
                index: resolve(directory, "src/index.ts"),
                dither: resolve(directory, "src/dither.ts"),
                "spreadsheet-read": resolve(directory, "src/spreadsheet-read.ts"),
              }
            : resolve(directory, "src/index.tsx"),
        formats: ["es"],
      },
      rollupOptions: {
        external: (id) => !id.startsWith(".") && !id.startsWith("/"),
        onwarn(warning, warn) {
          if (warning.code !== "MODULE_LEVEL_DIRECTIVE") warn(warning);
        },
        output: {
          preserveModules: true,
          preserveModulesRoot: resolve(directory, "src"),
          entryFileNames: "[name].js",
          // A module is a client boundary when its source says so, and only then:
          // pure helpers and hook-free components stay callable from a Server
          // Component. The index barrels carry no directive: a "use client" barrel
          // makes bundlers keep every export (charts included) wherever one
          // component is imported.
          banner: (chunk) => (clientModules.has(chunk.facadeModuleId ?? "") ? '"use client";' : ""),
        },
      },
    },
    esbuild: { jsx: "automatic" },
  });
}

async function distribute(name) {
  const directory = resolve(root, "packages", name);
  await bundle(name, staging);
  execFileSync(
    process.execPath,
    [
      resolve(root, "node_modules/@typescript/native/bin/tsc"),
      "-p",
      resolve(directory, "tsconfig.build.json"),
      "--outDir",
      resolve(directory, staging),
    ],
    { stdio: "inherit", cwd: root },
  );
  for (const file of await readdir(resolve(directory, "src"))) {
    if (file.endsWith(".css"))
      await copyFile(
        resolve(directory, "src", file),
        resolve(directory, staging, file),
      );
  }
  if (name === "ui") {
    await mkdir(resolve(directory, staging, "fonts"), { recursive: true });
    await cp(resolve(directory, "fonts"), resolve(directory, staging, "fonts"), {
      recursive: true,
    });
  } else {
    await copyFile(
      resolve(directory, "src/contracts.ts"),
      resolve(directory, staging, "contracts.source.ts"),
    );
  }
  await rm(resolve(directory, "dist.old"), { recursive: true, force: true });
  await rename(resolve(directory, "dist"), resolve(directory, "dist.old")).catch(() => {});
  await rename(resolve(directory, staging), resolve(directory, "dist"));
  await rm(resolve(directory, "dist.old"), { recursive: true, force: true });
  const manifest = JSON.parse(
    await readFile(resolve(directory, "package.json"), "utf8"),
  );
  console.log(`Built ${manifest.name}@${manifest.version}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  for (const name of ["ui", "ai-ui"]) await distribute(name);
