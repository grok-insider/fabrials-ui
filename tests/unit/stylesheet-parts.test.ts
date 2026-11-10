import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

// Two sheets are large enough that one file stops being workable, so each is a folder of parts and an order. The parts are
// concatenated as they are: the shipped stylesheet is their text, byte for byte, and `src/styles.css` imports the same list
// so a dev server serves exactly what ships. A part that opens more than it closes, or that carries an `@import` of its own,
// would make the two disagree.
const packages = ["ui", "ai-ui"] as const;

const directory = (name: string) => new URL(`../../packages/${name}/src/styles/`, import.meta.url);
const order = (name: string) =>
  JSON.parse(readFileSync(new URL("order.json", directory(name)), "utf8")) as string[];

/** The text of a sheet with comments and strings emptied, so braces in prose do not count. */
function code(text: string) {
  return text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/"[^"\n]*"|'[^'\n]*'/g, '""');
}

for (const name of packages) {
  test(`@fabrials/${name}: the order lists every part once and nothing else`, () => {
    const parts = readdirSync(directory(name)).filter((file) => file.endsWith(".css"));
    const listed = order(name);
    assert.deepEqual([...listed].sort(), parts.sort());
    assert.equal(new Set(listed).size, listed.length, "a part is listed twice");
    for (const file of listed)
      assert.ok(readFileSync(new URL(file, directory(name)), "utf8").length > 0, `${file} is empty`);
  });

  test(`@fabrials/${name}: every part stands on its own`, () => {
    for (const file of order(name)) {
      const text = readFileSync(new URL(file, directory(name)), "utf8");
      assert.doesNotMatch(text, /@import\b/, `${file} imports another sheet; the order does that`);
      let depth = 0;
      for (const character of code(text)) {
        if (character === "{") depth += 1;
        if (character === "}") depth -= 1;
        assert.ok(depth >= 0, `${file} closes a block it never opened`);
      }
      assert.equal(depth, 0, `${file} leaves ${depth} block(s) open: a part is a whole statement, not half of one`);
      assert.match(text, /\n$/, `${file} does not end on a line break`);
    }
  });

  test(`@fabrials/${name}: the development sheet imports the parts in order`, () => {
    const thin = readFileSync(new URL(`../../packages/${name}/src/styles.css`, import.meta.url), "utf8");
    const imports = [...thin.matchAll(/@import\s+"\.\/styles\/([^"]+)";/g)].map((match) => match[1]);
    assert.deepEqual(imports, order(name));
    assert.equal(
      code(thin.replace(/@import\s+"\.\/styles\/[^"]+";/g, "")).trim(),
      "",
      "the sheet that a dev server reads holds nothing but its imports",
    );
  });
}
