import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { uiStyles } from "./read-styles";

const root = resolve(import.meta.dirname, "../..");

test("shared toast keeps success, error and neutral distinct without gem color", async () => {
  const css = uiStyles();
  const source = await readFile(resolve(root, "packages/ui/src/toaster.tsx"), "utf8");
  const toastCss = css.slice(css.indexOf("Sonner injects unlayered styles"));
  assert.match(toastCss, /\[data-type="success"\]/);
  assert.match(toastCss, /\[data-type="error"\]/);
  assert.match(toastCss, /--fui-success-ink/);
  assert.match(toastCss, /--fui-danger-ink/);
  assert.match(toastCss, /background: var\(--fui-toast-surface, var\(--fui-overlay-surface\)\);/);
  assert.doesNotMatch(toastCss, /var\(--gem\)/);
  assert.match(source, /expand=\{expand \?\? false\}/);
  assert.match(source, /closeButton=\{closeButton \?\? false\}/);
  assert.match(toastCss, /width: fit-content/);
  assert.doesNotMatch(source, /richColors=\{/);
  assert.match(source, /data-tone="success"/);
  assert.match(source, /data-tone="danger"/);
});
