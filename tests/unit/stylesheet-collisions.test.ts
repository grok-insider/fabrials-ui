import { test } from "node:test";
import assert from "node:assert/strict";
import { uiStyles, aiStyles } from "./read-styles";

// @fabrials/ui and @fabrials/ai-ui are loaded on the same page, in the same layer, so a class both of them define on its own
// is styled by whichever sheet comes last. That is how ai-ui's chevron once shrank and faded the chevron of Disclosure.
const ui = uiStyles();
const ai = aiStyles();

// A class may be defined on its own in both sheets only with a reason.
const SHARED_ON_PURPOSE: Record<string, string> = {};

/** The selector lists of every style rule in a sheet, at any depth of @media, @layer or @supports; never a keyframe's steps. */
function selectorLists(css: string): string[] {
  const text = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const lists: string[] = [];
  const stack: ("rule" | "group" | "skip")[] = [];
  let prelude = "";
  let quote = "";
  for (const char of text) {
    if (quote) {
      prelude += char;
      if (char === quote) quote = "";
    } else if (char === '"' || char === "'") {
      quote = char;
      prelude += char;
    } else if (char === "{") {
      const head = prelude.trim();
      const skipped = stack.includes("skip") || /^@(?:-webkit-)?keyframes|^@property|^@font-face/.test(head);
      if (!skipped && !head.startsWith("@")) lists.push(head);
      stack.push(skipped ? "skip" : head.startsWith("@") ? "group" : "rule");
      prelude = "";
    } else if (char === "}") {
      stack.pop();
      prelude = "";
    } else if (char === ";") {
      prelude = "";
    } else {
      prelude += char;
    }
  }
  return lists;
}

/** Splits on commas that are not inside brackets or a string. */
function splitList(list: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let quote = "";
  let current = "";
  for (const char of list) {
    if (quote) {
      if (char === quote) quote = "";
    } else if (char === '"' || char === "'") quote = char;
    else if (char === "(" || char === "[") depth += 1;
    else if (char === ")" || char === "]") depth -= 1;
    if (char === "," && depth === 0 && !quote) {
      parts.push(current);
      current = "";
    } else current += char;
  }
  parts.push(current);
  return parts.map((part) => part.replace(/\s+/g, " ").trim()).filter(Boolean);
}

/** `:is(a, b) c` and `:where(a, b) c` written out as `a c` and `b c`, so each alternative is judged on its own. */
function alternatives(selector: string): string[] {
  const match = /:(?:is|where)\(/.exec(selector);
  if (!match) return [selector];
  let depth = 0;
  let end = -1;
  for (let at = match.index + match[0].length - 1; at < selector.length; at += 1) {
    if (selector[at] === "(") depth += 1;
    if (selector[at] === ")" && --depth === 0) {
      end = at;
      break;
    }
  }
  assert.notEqual(end, -1, `unbalanced selector ${selector}`);
  const inner = selector.slice(match.index + match[0].length, end);
  return splitList(inner).flatMap((alternative) => alternatives(selector.slice(0, match.index) + alternative + selector.slice(end + 1)));
}

const classesIn = (selector: string) => [...new Set([...selector.replace(/\[[^\]]*\]/g, "").matchAll(/\.([A-Za-z][\w-]*)/g)].map((match) => match[1]!))];

/**
 * The class a selector styles on its own: one compound, no ancestor, no sibling and no second class. States, attributes and
 * pseudo-elements do not scope it (`.fui-x:hover`, `.fui-x[data-on]::after` are still `.fui-x`); what `:not()` and `:has()`
 * name is a condition, not what is styled.
 */
function bareClass(selector: string): string | null {
  const subject = selector
    .replace(/\[[^\]]*\]/g, "")
    .replace(/:(?:not|has)\((?:[^()]|\((?:[^()]|\([^()]*\))*\))*\)/g, "")
    .trim();
  if (/[\s>+~]/.test(subject)) return null;
  const classes = classesIn(subject);
  return classes.length === 1 ? classes[0]! : null;
}

function bareClasses(css: string): Map<string, string[]> {
  const found = new Map<string, string[]>();
  for (const list of selectorLists(css)) {
    for (const selector of splitList(list)) {
      for (const alternative of alternatives(selector)) {
        const name = bareClass(alternative);
        if (name) found.set(name, [...(found.get(name) ?? []), selector]);
      }
    }
  }
  return found;
}

const mentioned = (css: string) => new Set(selectorLists(css).flatMap((list) => classesIn(list)));

test("the reader of selectors tells a class on its own from one that is scoped", () => {
  assert.equal(bareClass(".fui-x"), "fui-x");
  assert.equal(bareClass(".fui-x:hover"), "fui-x");
  assert.equal(bareClass('button.fui-x[data-state="on"]::after'), "fui-x");
  assert.equal(bareClass(".fui-x:not(.fui-y)"), "fui-x");
  assert.equal(bareClass(".fui-x.fui-y"), null);
  assert.equal(bareClass(".fui-a .fui-x"), null);
  assert.equal(bareClass(".fui-a > .fui-x"), null);
  assert.equal(bareClass("[data-open] > .fui-x"), null);
  assert.deepEqual(alternatives(":is(.fui-a, .fui-b .fui-c):hover"), [".fui-a:hover", ".fui-b .fui-c:hover"]);
  assert.deepEqual(splitList('.a, :is(.b, .c) > .d, [title="x, y"]'), [".a", ":is(.b, .c) > .d", '[title="x, y"]']);
  assert.deepEqual(
    selectorLists("@layer x { .a, .b { color: red; } @media print { .c { top: 0; } } @keyframes k { from { top: 0; } to { top: 1px; } } }"),
    [".a, .b", ".c"],
  );
  // A sheet that defines the same class on its own as the other is caught.
  const clash = [...bareClasses(".fui-disclosure-chevron { width: 1rem; }").keys()].filter((name) => bareClasses(ui).has(name));
  assert.deepEqual(clash, ["fui-disclosure-chevron"]);
});

test("no class is defined on its own in both stylesheets", () => {
  const inUi = bareClasses(ui);
  const inAi = bareClasses(ai);
  assert.ok(inUi.size > 400 && inAi.size > 150, "both sheets were read");
  const both = [...inAi.keys()].filter((name) => inUi.has(name) && !Object.hasOwn(SHARED_ON_PURPOSE, name));
  assert.deepEqual(
    both.map((name) => `${name}: ${inAi.get(name)!.join(" | ")}`),
    [],
    "scope the ai-ui rule under one of its own classes, or rename the class",
  );
  for (const name of Object.keys(SHARED_ON_PURPOSE)) assert.ok(inUi.has(name) && inAi.has(name), `${name} is no longer shared: remove it from the list`);
});

test("an ai-ui rule that names a class of @fabrials/ui carries a class of its own", () => {
  // The classes both sheets mention (the code line, the syntax tokens, the button, the table scroller, the loading content, the
  // language icon, the old chevron) are @fabrials/ui's. ai-ui may style them only inside one of its own pieces.
  const uiNames = mentioned(ui);
  const own = (name: string) => /^(?:fui|fb)-/.test(name) && !uiNames.has(name);
  const shared = [...mentioned(ai)].filter((name) => uiNames.has(name));
  assert.ok(shared.includes("fui-code-line") && shared.includes("fui-button") && shared.includes("fui-token-keyword"), "the shared names were read");
  const loose: string[] = [];
  for (const list of selectorLists(ai)) {
    for (const selector of splitList(list)) {
      for (const alternative of alternatives(selector)) {
        const names = classesIn(alternative);
        if (names.some((name) => uiNames.has(name)) && !names.some(own)) loose.push(selector);
      }
    }
  }
  assert.deepEqual([...new Set(loose)], []);
});

test("the chevron of a sources or an activity trigger has its own class, and the old one is styled only inside those triggers", () => {
  const chevronRules = selectorLists(ai)
    .flatMap(splitList)
    .filter((selector) => selector.includes("fui-disclosure-chevron"));
  assert.ok(chevronRules.length >= 3);
  for (const selector of chevronRules) assert.match(selector, /^:is\(\.fui-sources-trigger, \.fui-activity-trigger\)(?::hover|\[data-panel-open\])? > /, selector);
  assert.match(ai, /\.fui-activity-chevron,\s*:is\(\.fui-sources-trigger, \.fui-activity-trigger\) > \.fui-disclosure-chevron \{[^}]*width: 0\.875rem;[^}]*opacity: 0\.6;/);
  assert.equal(bareClasses(ui).has("fui-activity-chevron"), false);
  assert.match(ui, /\.fui-disclosure-chevron \{[^}]*inline-size: 1rem;[^}]*block-size: 1rem;/);
});
