/**
 * Writes registry/shims/<name>.tsx for every shadcn primitive @fabrials/ui
 * covers, and mirrors them into components/ui/ so the site runs on the same
 * shims people install. `--check` fails when a file is missing or stale.
 */
import { readdir, readFile, rm, writeFile } from "node:fs/promises";
import * as ui from "@fabrials/ui";
import { coveredPrimitives, shimSource } from "../lib/shims";

const check = process.argv.includes("--check");
const shims = coveredPrimitives(Object.keys(ui));
// Real shadcn components the site keeps because Fabrials has no equivalent.
const keep = new Set(["calendar.tsx"]);
const stale: string[] = [];

async function sync(path: string, content: string) {
  const current = await readFile(path, "utf8").catch(() => "");
  if (current === content) return;
  if (check) stale.push(path);
  else await writeFile(path, content);
}

for (const { name, names } of shims) {
  const source = shimSource(name, names);
  await sync(`registry/shims/${name}.tsx`, source);
  await sync(`components/ui/${name}.tsx`, source);
}
const wanted = new Set(shims.map(({ name }) => `${name}.tsx`));
for (const dir of ["registry/shims", "components/ui"])
  for (const file of await readdir(dir))
    if (file.endsWith(".tsx") && !wanted.has(file) && !(dir === "components/ui" && keep.has(file))) {
      if (check) stale.push(`${dir}/${file}`);
      else await rm(`${dir}/${file}`);
    }
if (stale.length) {
  console.error(`Shims are out of date (run bun run registry:shims):\n${stale.join("\n")}`);
  process.exit(1);
}
console.log(`${check ? "Checked" : "Wrote"} ${shims.length} shims.`);
