// Copies the files each package ships but keeps at the repository root
// (LICENSE, DESIGN.md, the integrity scripts) into packages/*, for npm pack.
// The vendor script writes the same files into product copies.
import { copyFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const plan = {
  ui: [["LICENSE"], ["DESIGN.md"], ["scripts/verify.mjs", "verify.mjs"], ["scripts/integrity.mjs", "integrity.mjs"]],
  "ai-ui": [["LICENSE"], ["LOBE-ICONS-LICENSE"]],
};
for (const [name, files] of Object.entries(plan))
  for (const [from, to = from] of files) await copyFile(resolve(root, from), resolve(root, "packages", name, to));
console.log("Staged package files for npm pack.");
