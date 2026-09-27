import { test } from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");

type Face = { family: string; file: string; weight: string; ranges: [number, number][] };

function faces(css: string): Face[] {
  return [...css.matchAll(/@font-face\s*{([^}]*)}/g)].map(([, body]) => {
    const get = (prop: string) => new RegExp(`${prop}:\\s*([^;]+);`).exec(body!)?.[1]?.trim() ?? "";
    const ranges = get("unicode-range")
      .split(",")
      .map((r) => r.trim().replace(/^U\+/i, ""))
      .filter(Boolean)
      .map((r) => {
        const [a, b] = r.split("-");
        return [parseInt(a!, 16), parseInt(b ?? a!, 16)] as [number, number];
      });
    return { family: get("font-family").replace(/"/g, ""), file: /url\("\.\/fonts\/([^"]+)"\)/.exec(body!)?.[1] ?? "", weight: get("font-weight"), ranges };
  });
}

const covers = (list: Face[], family: string, weight: string, cp: number) =>
  list.some((f) => f.family === family && f.weight === weight && f.ranges.some(([a, b]) => cp >= a && cp <= b));

test("every font face points at a shipped file and carries a unicode-range", async () => {
  const list = faces(await readFile(resolve(root, "packages/ui/src/fonts.css"), "utf8"));
  assert.ok(list.length >= 31);
  for (const f of list) {
    assert.ok(f.ranges.length > 0, `${f.file} has no unicode-range`);
    await access(resolve(root, "packages/ui/fonts", f.file));
  }
});

test("Plex covers Polish, Czech, Cyrillic, Greek and Vietnamese text, not only Latin-1", async () => {
  const list = faces(await readFile(resolve(root, "packages/ui/src/fonts.css"), "utf8"));
  // ż ł ę (Polish), ř (Czech), Ж (Cyrillic), Ω (Greek), ạ (Vietnamese)
  for (const cp of [0x17c, 0x142, 0x119, 0x159, 0x416, 0x3a9, 0x1ea1]) {
    assert.ok(covers(list, "IBM Plex Sans", "100 700", cp), `IBM Plex Sans misses U+${cp.toString(16)}`);
  }
  for (const [family, weight] of [
    ["IBM Plex Mono", "400"],
    ["IBM Plex Mono", "600"],
    ["IBM Plex Serif", "400"],
    ["IBM Plex Serif", "500 700"],
    ["IBM Plex Sans Condensed", "600"],
  ] as const) {
    // Fontsource ships no plain cyrillic subset for Sans Condensed; cyrillic-ext is covered.
    for (const cp of family === "IBM Plex Sans Condensed" ? [0x17c, 0x1ea1] : [0x17c, 0x416])
      assert.ok(covers(list, family, weight, cp), `${family} ${weight} misses U+${cp.toString(16)}`);
  }
});
