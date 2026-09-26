import { build } from "vite";
import { cp, mkdir, readdir, copyFile, readFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

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
      outDir: "dist",
      emptyOutDir: true,
      lib: {
        entry: resolve(directory, `src/index.${name === "ui" ? "ts" : "tsx"}`),
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
          banner: chunk => /(?:button-variants|shared|moon-math)\.[jt]s$/.test(chunk.facadeModuleId ?? "") ? "" : '"use client";',
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
    ],
    { stdio: "inherit", cwd: root },
  );
  for (const file of await readdir(resolve(directory, "src"))) {
    if (file.endsWith(".css"))
      await copyFile(
        resolve(directory, "src", file),
        resolve(directory, "dist", file),
      );
  }
  if (name === "ui") {
    await mkdir(resolve(directory, "dist/fonts"), { recursive: true });
    await cp(resolve(directory, "fonts"), resolve(directory, "dist/fonts"), {
      recursive: true,
    });
  } else {
    await copyFile(
      resolve(directory, "src/contracts.ts"),
      resolve(directory, "dist/contracts.source.ts"),
    );
  }
  const manifest = JSON.parse(
    await readFile(resolve(directory, "package.json"), "utf8"),
  );
  console.log(`Built ${manifest.name}@${manifest.version}`);
}
