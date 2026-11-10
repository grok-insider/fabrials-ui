import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { Combobox as BaseCombobox } from "@base-ui/react/combobox";
import * as ui from "../../packages/ui/src/index";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxClear,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxRoot,
  ComboboxTrigger,
  ComboboxValue,
} from "../../packages/ui/src/index";

const styles = readFileSync(new URL("../../packages/ui/src/styles.css", import.meta.url), "utf8");
const blockStart = styles.indexOf("/* 0.12: combobox.");
const blockEnd = styles.indexOf("\n@layer", blockStart);
const block = styles.slice(blockStart, blockEnd === -1 ? undefined : blockEnd);
const rule = (selector: string) => {
  const at = block.indexOf(selector);
  assert.ok(at >= 0, `missing rule ${selector}`);
  return block.slice(at, block.indexOf("}", at) + 1);
};
const media = (query: string) => {
  const at = block.indexOf(`@media ${query} {`);
  assert.ok(at >= 0, `missing @media ${query}`);
  let depth = 0;
  for (let index = block.indexOf("{", at); index < block.length; index += 1) {
    if (block[index] === "{") depth += 1;
    if (block[index] === "}" && --depth === 0) return block.slice(at, index + 1);
  }
  throw new Error("unbalanced block");
};
const tag = (html: string, pattern: RegExp) => {
  const found = html.match(pattern);
  assert.ok(found, `no ${pattern} in ${html}`);
  return found[0];
};

const ITEMS = ["North", "South"];

test("the field is an input group: the input takes the props, the box takes the class, and the keys are named", () => {
  const html = renderToStaticMarkup(
    <ComboboxRoot items={ITEMS}>
      <ComboboxInput id="workspace" placeholder="Choose one" className="wide" aria-describedby="hint" />
    </ComboboxRoot>,
  );
  const group = tag(html, /<div [^>]*data-slot="combobox-field"[^>]*>/);
  assert.match(group, /role="group"/);
  assert.match(group, /class="fui-input-group fui-combobox-field wide"/);
  const input = tag(html, /<input [^>]*data-slot="combobox-input"[^>]*>/);
  assert.match(input, /role="combobox"/);
  assert.match(input, /id="workspace"/);
  assert.match(input, /placeholder="Choose one"/);
  assert.match(input, /aria-describedby="hint"/);
  assert.match(input, /aria-expanded="false"/);
  assert.match(input, /class="fui-input fui-input-group-control fui-combobox-input"/);
  const trigger = tag(html, /<button [^>]*data-slot="combobox-trigger"[^>]*>/);
  assert.match(trigger, /aria-label="Show options"/);
  assert.match(trigger, /type="button"/);
  assert.match(trigger, /class="fui-combobox-key"/);
  // The clear key is opt-in, and there is nothing to clear yet.
  assert.doesNotMatch(html, /combobox-clear/);
  // The input comes first, then the keys: the box reads input, clear, trigger.
  assert.ok(html.indexOf("combobox-input") < html.indexOf("combobox-trigger"));
});

test("showClear adds the clear key while there is a value; both keys take their names from props and go with the field when it is off", () => {
  const html = renderToStaticMarkup(
    <ComboboxRoot items={ITEMS} defaultValue="North">
      <ComboboxInput showClear clearLabel="Vaciar" triggerLabel="Ver opciones" disabled />
    </ComboboxRoot>,
  );
  const clear = tag(html, /<button [^>]*data-slot="combobox-clear"[^>]*>/);
  assert.match(clear, /aria-label="Vaciar"/);
  assert.match(clear, /disabled=""/);
  assert.match(clear, /class="fui-combobox-key"/);
  const trigger = tag(html, /<button [^>]*data-slot="combobox-trigger"[^>]*>/);
  assert.match(trigger, /aria-label="Ver opciones"/);
  assert.match(trigger, /disabled=""/);
  assert.match(tag(html, /<input [^>]*data-slot="combobox-input"[^>]*>/), /disabled=""[^>]*value="North"|value="North"[^>]*disabled=""/);
  assert.ok(html.indexOf("combobox-clear") < html.indexOf("combobox-trigger"), "the clear key sits before the trigger");
  const empty = renderToStaticMarkup(
    <ComboboxRoot items={ITEMS}>
      <ComboboxInput showClear />
    </ComboboxRoot>,
  );
  assert.doesNotMatch(empty, /combobox-clear/);
  const bare = renderToStaticMarkup(
    <ComboboxRoot items={ITEMS}>
      <ComboboxInput showTrigger={false} />
    </ComboboxRoot>,
  );
  assert.doesNotMatch(bare, /<button/);
});

test("the keys draw their own mark unless given one", () => {
  const html = renderToStaticMarkup(
    <ComboboxRoot items={ITEMS} defaultValue="North">
      <ComboboxTrigger aria-label="Open" />
      <ComboboxClear aria-label="Reset">reset</ComboboxClear>
    </ComboboxRoot>,
  );
  assert.match(html, /data-slot="combobox-trigger"[^>]*><svg [^>]*lucide-chevron-down[^>]*aria-hidden="true"/);
  assert.match(html, /data-slot="combobox-clear"[^>]*>reset<\/button>/);
});

test("several values are chips in the same box, each with a named key that removes it, before the input", () => {
  const html = renderToStaticMarkup(
    <ComboboxRoot multiple items={ITEMS} defaultValue={["North", "South"]}>
      <ComboboxChips className="wide">
        <ComboboxValue>
          {(values: string[]) => (
            <>
              {values.map((value) => (
                <ComboboxChip key={value} removeLabel={`Remove ${value}`}>
                  {value}
                </ComboboxChip>
              ))}
              <ComboboxChipsInput placeholder="Add" />
            </>
          )}
        </ComboboxValue>
      </ComboboxChips>
    </ComboboxRoot>,
  );
  const group = tag(html, /<div [^>]*data-slot="combobox-chips"[^>]*>/);
  assert.match(group, /role="group"/);
  assert.match(group, /class="fui-input-group fui-combobox-field wide"/);
  assert.match(html, /data-slot="combobox-chips"[^>]*><div [^>]*class="fui-combobox-chips"/);
  assert.equal(html.match(/data-slot="combobox-chip"/g)?.length, 2);
  assert.match(html, /<button [^>]*aria-label="Remove North"[^>]*class="fui-combobox-chip-remove"|<button [^>]*class="fui-combobox-chip-remove"[^>]*aria-label="Remove North"/);
  const input = tag(html, /<input [^>]*data-slot="combobox-chips-input"[^>]*>/);
  assert.match(input, /class="fui-input fui-input-group-control fui-combobox-chips-input"/);
  assert.ok(html.lastIndexOf("combobox-chip-remove") < html.indexOf("combobox-chips-input"));
  const quiet = renderToStaticMarkup(
    <ComboboxRoot multiple items={ITEMS} defaultValue={["North"]}>
      <ComboboxChips>
        <ComboboxChip showRemove={false}>North</ComboboxChip>
      </ComboboxChips>
    </ComboboxRoot>,
  );
  assert.doesNotMatch(quiet, /<button/);
  assert.match(
    renderToStaticMarkup(
      <ComboboxRoot multiple items={ITEMS} defaultValue={["North"]}>
        <ComboboxChips>
          <ComboboxChip>North</ComboboxChip>
        </ComboboxChips>
      </ComboboxRoot>,
    ),
    /aria-label="Remove"/,
  );
});

test("the list is a portal: closed, nothing of it is in the server markup", () => {
  const html = renderToStaticMarkup(
    <ComboboxRoot items={ITEMS}>
      <ComboboxInput />
      <ComboboxContent>
        <ComboboxEmpty>No matches.</ComboboxEmpty>
        <ComboboxList>
          {(item: string) => (
            <ComboboxItem key={item} value={item}>
              {item}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </ComboboxRoot>,
  );
  assert.doesNotMatch(html, /fui-menu|role="listbox"|role="option"|No matches/);
});

test("Combobox is the root under shadcn's name and still carries the dotted parts of earlier releases", () => {
  const flat = renderToStaticMarkup(
    <Combobox items={ITEMS} defaultValue="South">
      <ComboboxInput />
    </Combobox>,
  );
  const root = renderToStaticMarkup(
    <ComboboxRoot items={ITEMS} defaultValue="South">
      <ComboboxInput />
    </ComboboxRoot>,
  );
  const ids = (html: string) => html.replace(/_r_\w+_/g, "id");
  assert.equal(ids(flat), ids(root));
  assert.match(flat, /value="South"/);
  // 0.11's object: every Base UI part, with the five that carried a class.
  for (const name of Object.keys(BaseCombobox)) assert.ok(name in Combobox, `Combobox.${name} is gone`);
  assert.equal(Combobox.Root, BaseCombobox.Root);
  assert.equal(Combobox.Portal, BaseCombobox.Portal);
  assert.equal(Combobox.Positioner, BaseCombobox.Positioner);
  assert.equal(Combobox.Empty, BaseCombobox.Empty);
  assert.equal(Combobox.List, BaseCombobox.List);
  for (const part of ["Input", "Popup", "Item", "Chips", "Chip"] as const) assert.notEqual(Combobox[part], BaseCombobox[part], `Combobox.${part} lost its class`);
  const dotted = renderToStaticMarkup(
    <Combobox.Root items={ITEMS}>
      <Combobox.Input placeholder="Filter" />
      <Combobox.Chips>
        <Combobox.Chip>North</Combobox.Chip>
      </Combobox.Chips>
    </Combobox.Root>,
  );
  assert.match(dotted, /<input [^>]*class="fui-input"/);
  assert.match(dotted, /class="fui-combobox-chips"/);
  assert.match(dotted, /class="fui-combobox-chip"/);
  // Base UI's own root must not have gained our parts.
  assert.equal("Popup" in BaseCombobox.Root, false);
});

test("the package exports every name of shadcn's combobox, so a shim covers it", () => {
  const snapshot = JSON.parse(readFileSync(new URL("../../apps/site/registry/shims/shadcn-exports.json", import.meta.url), "utf8")) as { items: Record<string, string[]> };
  const names = snapshot.items.combobox!;
  assert.ok(names.includes("Combobox") && names.includes("useComboboxAnchor"));
  for (const name of names) assert.ok(name in ui, `@fabrials/ui does not export ${name}`);
  assert.equal(typeof ui.Combobox, "function");
  assert.equal(ComboboxGroup, BaseCombobox.Group);
  assert.equal(ComboboxCollection, BaseCombobox.Collection);
  assert.equal(ComboboxValue, BaseCombobox.Value);
});

test("the keys are quiet squares with a 44 px reach on touch, and nothing is a fill alone in forced colors", () => {
  const key = rule(".fui-combobox-key {");
  assert.match(key, /inline-size: 1\.75rem;/);
  assert.match(key, /block-size: 1\.75rem;/);
  assert.match(key, /border-radius: var\(--fui-radius-sm\);/);
  assert.match(key, /background: transparent;/);
  const coarse = media("(pointer: coarse)");
  // 1.75rem + 2 × 0.5rem and 1.125rem + 2 × 0.8125rem are both 2.75rem.
  assert.match(coarse, /\.fui-combobox-key::before \{[^}]*inset: -0\.5rem;/);
  assert.match(coarse, /\.fui-combobox-chip-remove::before \{[^}]*inset: -0\.8125rem;/);
  assert.match(rule(".fui-combobox-chip-remove {"), /inline-size: 1\.125rem;/);
  const hover = media("(hover: hover)");
  assert.match(hover, /\.fui-combobox-key:not\(:disabled\):hover \{[^}]*background: var\(--accent\);/);
  assert.doesNotMatch(block.replace(hover, ""), /:hover \{[^}]*background/);
  const forced = media("(forced-colors: active)");
  assert.match(forced, /\.fui-combobox-item\[data-highlighted\],\s*\.fui-combobox-chip:is\(\[data-highlighted\], :focus-visible\) \{[^}]*outline: 2px solid Highlight;/);
  assert.match(forced, /\.fui-combobox-field \.fui-combobox-chip \{[^}]*border: 1px solid CanvasText;/);
});

test("the chips box grows by wrapping, its input keeps room to type, and the empty line only takes space when it speaks", () => {
  assert.match(rule(".fui-combobox-field > .fui-combobox-chips {"), /flex: 1;[^}]*min-inline-size: 0;/);
  assert.match(rule(".fui-input.fui-combobox-chips-input {"), /flex: 1 1 4rem;[^}]*min-inline-size: 4rem;/);
  assert.match(rule(".fui-combobox-chip:is([data-highlighted], :focus-visible) {"), /outline: 2px solid var\(--fui-focus\);/);
  assert.match(rule(".fui-combobox-empty:not(:empty) {"), /padding: var\(--fui-space-1-5\) var\(--fui-space-2\);[^}]*color: var\(--muted-foreground\);/);
  assert.doesNotMatch(block, /\.fui-combobox-empty \{/);
  // Logical properties only.
  assert.doesNotMatch(block, /\b(margin|padding|border)-(left|right|top|bottom)\b|(?<![-\w])(left|right|width|height):/);
});
