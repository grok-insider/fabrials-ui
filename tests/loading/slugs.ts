import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/** Written by global-setup from /components; read when the test files load. */
export const SLUGS_FILE = fileURLToPath(new URL("../../test-results/loading/.slugs.json", import.meta.url));

export function readSlugs(): string[] {
  try {
    return JSON.parse(readFileSync(SLUGS_FILE, "utf8")) as string[];
  } catch {
    return [];
  }
}
