import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

// The house rule from 0.12: nothing in the packages formats with the runtime's locale unless the host asks for it. A server and
// a browser have different runtime locales, so anything written with one is different text on each side, and React reports a
// hydration mismatch. This file proves the rule twice: at rest (every source is scanned for the shapes that ask for the runtime's
// locale) and at run time (a fresh process watches Intl while 73 components render and 34 pure formatters run, and the record must
// be empty). The run-time half is a separate process on purpose: the packages cache their formatters, and a cache filled by an
// earlier test file would hide the construction that filled it.

const root = resolve(import.meta.dirname, "../..");

type Offence = { api: string; stack: string };
type Probe = { cases: number; helpers: number; offences: Offence[] };

function probe(env: Record<string, string> = {}): Probe {
  const run = spawnSync(process.execPath, ["run", resolve(import.meta.dirname, "default-locale-probe.tsx")], {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, ...env },
    timeout: 120_000,
  });
  assert.equal(run.status, 0, `the probe failed to run:\n${run.stdout}\n${run.stderr}`);
  const start = run.stdout.indexOf("{");
  assert.ok(start >= 0, `the probe printed no record:\n${run.stdout}\n${run.stderr}`);
  return JSON.parse(run.stdout.slice(start)) as Probe;
}

test("no render and no pure helper asks Intl for the runtime's locale", () => {
  const record = probe();
  assert.ok(record.cases > 60, "the probe rendered the components");
  assert.ok(record.helpers > 25, "the probe called the pure formatters");
  const offences = record.offences.map((offence) => `${offence.api}\n${offence.stack}`);
  assert.deepEqual(offences, [], "these asked for the runtime's locale");
});

test("the probe notices one when there is one", () => {
  const record = probe({ FUI_LOCALE_PROBE_PLANT: "1" });
  assert.equal(record.offences.length, 1, "the probe reported the offence planted on purpose");
  assert.equal(record.offences[0]!.api, "new Intl.NumberFormat");
});

// Shapes that ask for the runtime's locale, caught before a render ever reaches them (a formatter behind a click, an effect or
// a story), and also caught when a formatter cache would hide them at run time.
const FORBIDDEN: Array<{ pattern: RegExp; what: string }> = [
  { pattern: /\.toLocale(?:String|DateString|TimeString|UpperCase|LowerCase)\(\s*\)/, what: "toLocale*() with no locale" },
  { pattern: /\.toLocale(?:String|DateString|TimeString|UpperCase|LowerCase)\(\s*undefined\b/, what: "toLocale*(undefined)" },
  { pattern: /\.localeCompare\(\s*[^,)]+\)/, what: "localeCompare without a locale" },
  { pattern: /new\s+Intl\.[A-Za-z]+\(\s*\)/, what: "new Intl.X() with no locale" },
  { pattern: /new\s+Intl\.[A-Za-z]+\(\s*undefined\b/, what: "new Intl.X(undefined" },
  { pattern: /new\s+Intl\.DateTimeFormat\(\)\.resolvedOptions\(\)/, what: "the runtime's locale read from resolvedOptions()" },
  { pattern: /\.toLocale\w*\(\s*[\w.]+\s*\?\?\s*\[\]/, what: "a locale that falls back to an empty list" },
  { pattern: /\bnavigator\.languages?\b/, what: "navigator.language" },
];

// On purpose, with the reason: `NumberTicker locale={true}` is the deprecated explicit request for the device's locale.
const ALLOWED: Array<{ file: string; pattern: RegExp; why: string }> = [
  {
    file: "ui/src/number-ticker.tsx",
    pattern: /ownLocale === true \? rounded\.toLocaleString\(\)/,
    why: "`locale={true}` is the deprecated request for the device's locale, documented as such",
  },
];

test("no source asks for the runtime's locale, except where it is an explicit request", () => {
  const files: string[] = [];
  for (const pkg of ["ui", "ai-ui"]) {
    const directory = resolve(root, "packages", pkg, "src");
    for (const file of readdirSync(directory)) {
      if (/\.tsx?$/.test(file) && !file.endsWith(".d.ts")) files.push(`packages/${pkg}/src/${file}`);
    }
  }
  assert.ok(files.length > 100, "the scan found the sources");

  const found: string[] = [];
  for (const relative of files) {
    const text = readFileSync(resolve(root, relative), "utf8");
    const key = relative.replace(/^packages\//, "");
    for (const { pattern, what } of FORBIDDEN) {
      const match = pattern.exec(text);
      if (!match) continue;
      const line = text.slice(0, match.index).split("\n").length;
      const allowed = ALLOWED.some((item) => item.file === key && item.pattern.test(text));
      if (!allowed) found.push(`${relative}:${line}: ${what} — ${match[0].trim()}`);
    }
  }
  assert.deepEqual(found, []);
});

test("each allowance is still a real, documented exception", () => {
  for (const item of ALLOWED) {
    const text = readFileSync(resolve(root, "packages", item.file), "utf8");
    assert.match(text, item.pattern, `${item.file} no longer needs its allowance (${item.why})`);
    assert.ok(item.why.length > 20, "an allowance says why");
  }
});

test("the switch that turns the device's locale on is the only one, and it says it is deprecated", () => {
  const source = readFileSync(resolve(root, "packages/ui/src/number-ticker.tsx"), "utf8");
  assert.match(source, /@deprecated/);
  assert.match(source, /ownLocale === true \? rounded\.toLocaleString\(\)/);
});
