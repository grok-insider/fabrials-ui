import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { uiStyles, aiStyles } from "./read-styles";

const read = (path: string) => readFileSync(new URL(`../../packages/${path}`, import.meta.url), "utf8");
const sheets: [string, string][] = [
  ["ui/src/styles.css", uiStyles()],
  ["ui/src/tokens.css", read("ui/src/tokens.css")],
  ["ui/src/tailwind.css", read("ui/src/tailwind.css")],
  ["ai-ui/src/styles.css", aiStyles()],
];

// A merge that drops a closing brace still builds: the stylesheets are copied as they are. The browser then ignores
// everything after the unclosed block, which only a screenshot would show.
test("every stylesheet closes each block it opens, and carries no merge marker", () => {
  for (const [sheet, text] of sheets) {
    assert.doesNotMatch(text, /^(<<<<<<<|=======|>>>>>>>)/m, `${sheet} has a merge marker`);
    const code = text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/"[^"\n]*"|'[^'\n]*'/g, '""');
    let depth = 0;
    let line = 1;
    for (const character of code) {
      if (character === "\n") line += 1;
      if (character === "{") depth += 1;
      if (character === "}") depth -= 1;
      assert.ok(depth >= 0, `${sheet} closes a block it never opened, near line ${line}`);
    }
    assert.equal(depth, 0, `${sheet} leaves ${depth} block(s) open`);
  }
});
