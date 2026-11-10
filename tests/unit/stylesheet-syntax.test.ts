import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const sheets = ["ui/src/styles.css", "ui/src/tokens.css", "ui/src/tailwind.css", "ai-ui/src/styles.css"];

// A merge that drops a closing brace still builds: the stylesheets are copied as they are. The browser then ignores
// everything after the unclosed block, which only a screenshot would show.
test("every stylesheet closes each block it opens, and carries no merge marker", () => {
  for (const sheet of sheets) {
    const text = readFileSync(new URL(`../../packages/${sheet}`, import.meta.url), "utf8");
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
