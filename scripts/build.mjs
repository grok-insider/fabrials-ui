import { build } from "vite";
import { cp, mkdir, readdir, copyFile, readFile, rename, rm } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
// Each package builds into dist.next and then replaces dist in one rename, so a
// running dev server (Next, Storybook) never reads a half-written package.
const staging = "dist.next";

for (const name of ["ui", "ai-ui"]) {
  const directory = resolve(root, "packages", name);
  await build({
    configFile: false,
    root: directory,
    logLevel: "warn",
    plugins: [
      {
        name: "client-entry-boundary",
        enforce: "pre",
        transform(code, id) {
          if (/\.[jt]sx?$/.test(id) && code.startsWith('"use client";'))
            return { code: code.replace('"use client";', ""), map: null };
        },
      },
    ],
    build: {
      target: "es2022",
      minify: false,
      outDir: staging,
      emptyOutDir: true,
      lib: {
        // Subpath exports that the index does not re-export are entries of their own,
        // or tree-shaking drops what the index does not use.
        entry:
          name === "ui"
            ? { index: resolve(directory, "src/index.ts"), dither: resolve(directory, "src/dither.ts") }
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
          // Every component module is its own client boundary. The index barrels
          // stay directive-free: a "use client" barrel makes bundlers keep every
          // export (charts included) wherever one component is imported.
          banner: chunk => /(?:button-variants|shared|moon-math|dither|dither-presets|syntax|index)\.[jt]sx?$/.test(chunk.facadeModuleId ?? "") ? "" : '"use client";',
        },
      },
    },
    esbuild: { jsx: "automatic" },
  });
  execFileSync(
    process.execPath,
    [
      resolve(root, "node_modules/typescript/bin/tsc"),
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
