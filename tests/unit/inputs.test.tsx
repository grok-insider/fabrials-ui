import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { DirectionProvider, InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot, NumberField, PasswordInput, SearchInput, Slider, Textarea, useDirection } from "@fabrials/ui";

const styles = readFileSync(new URL("../../packages/ui/src/styles.css", import.meta.url), "utf8");

test("search: a real search input, a clear button only with text, the shortcut only while empty, busy while loading", () => {
  const empty = renderToStaticMarkup(<SearchInput aria-label="Search" shortcut={<kbd>/</kbd>} />);
  assert.match(empty, /<input[^>]*type="search"[^>]*class="fui-input fui-search-input-control"/);
  assert.match(empty, /fui-search-input-shortcut/);
  assert.doesNotMatch(empty, /Clear search/);
  const filled = renderToStaticMarkup(<SearchInput aria-label="Search" defaultValue="north" shortcut={<kbd>/</kbd>} loading />);
  assert.match(filled, /aria-label="Clear search"/);
  assert.doesNotMatch(filled, /fui-search-input-shortcut/);
  assert.match(filled, /aria-busy="true"/);
  assert.match(filled, /data-loading=""/);
  const locked = renderToStaticMarkup(<SearchInput aria-label="Search" defaultValue="north" readOnly />);
  assert.doesNotMatch(locked, /Clear search/);
});

test("password: hidden by default, a pressed-state toggle that controls the field, no spelling or capitalisation help", () => {
  const html = renderToStaticMarkup(<PasswordInput id="pw" aria-label="Password" />);
  assert.match(html, /<input[^>]*id="pw"[^>]*type="password"[^>]*autoComplete="current-password"|<input[^>]*type="password"/);
  assert.match(html, /autoComplete="current-password"/i);
  assert.match(html, /spellCheck="false"/i);
  assert.match(html, /aria-pressed="false"/);
  assert.match(html, /aria-controls="pw"/);
  assert.match(html, /aria-label="Show password"/);
  assert.doesNotMatch(html, /Caps Lock/);
  const fresh = renderToStaticMarkup(<PasswordInput aria-label="New" autoComplete="new-password" />);
  assert.match(fresh, /autoComplete="new-password"/i);
});

test("number field: named steppers, a unit read with the value, invalid marked on the group", () => {
  const html = renderToStaticMarkup(<NumberField id="t" aria-label="Timeout" defaultValue={1500} unit="ms" aria-invalid />);
  assert.match(html, /aria-label="Decrease"/);
  assert.match(html, /aria-label="Increase"/);
  assert.match(html, /<span class="fui-number-field-unit" id="t-unit">ms<\/span>/);
  assert.match(html, /aria-describedby="t-unit"/);
  assert.match(html, /<div role="group" data-invalid="" class="fui-number-field-group">/);
});

test("slider: one thumb per value, a range names each thumb, marks sit on the ruler", () => {
  const single = renderToStaticMarkup(<Slider aria-label="Volume" defaultValue={40} />);
  assert.equal(single.match(/fui-slider-thumb/g)?.length, 1);
  assert.match(single, /aria-label="Volume"/);
  const range = renderToStaticMarkup(<Slider defaultValue={[20, 80]} thumbLabels={["Minimum", "Maximum"]} marks={[0, { value: 50, label: "Half" }, 100]} />);
  assert.equal(range.match(/class="fui-slider-thumb"/g)?.length, 2);
  assert.match(range, /aria-label="Minimum"/);
  assert.match(range, /aria-label="Maximum"/);
  assert.match(range, /--fui-slider-mark:50%/);
  // The ends of the ruler turn their labels inward; a vertical slider has no ruler.
  assert.match(range, /data-edge="start" style="--fui-slider-mark:0%"/);
  assert.match(range, /data-edge="end" style="--fui-slider-mark:100%"/);
  assert.doesNotMatch(renderToStaticMarkup(<Slider aria-label="Gain" orientation="vertical" marks={[0, 50, 100]} />), /fui-slider-mark|data-marks/);
  assert.match(range, /<span class="fui-slider-mark-label">Half<\/span>/);
  assert.match(range, /data-marks=""/);
});

test("one-time code: a slot per character, every slot after the first named by its position, shadcn's parts compose", () => {
  const html = renderToStaticMarkup(<InputOTP length={4} aria-label="Code" />);
  assert.equal(html.match(/class="fui-input-otp-slot"/g)?.length, 4);
  assert.match(html, /aria-label="Character 2 of 4"/);
  assert.match(html, /aria-label="Character 4 of 4"/);
  assert.doesNotMatch(html, /Character 1 of 4/);
  // Base UI ignores aria-label on the first slot: the name is a hidden text the group and the first slot point at.
  const nameId = html.match(/<span id="([^"]+)" class="fui-sr-only">Code<\/span>/)?.[1];
  assert.ok(nameId);
  assert.match(html, new RegExp(`<div role="group" aria-labelledby="${nameId}"`));
  assert.match(html, new RegExp(`<input[^>]*aria-labelledby="${nameId}"[^>]*class="fui-input-otp-slot"`));
  const grouped = renderToStaticMarkup(
    <InputOTP maxLength={4} aria-invalid slotLabel={(position, total) => `Carácter ${position} de ${total}`}>
      <InputOTPGroup>
        <InputOTPSlot index={0} />
        <InputOTPSlot index={1} />
      </InputOTPGroup>
      <InputOTPSeparator />
      <InputOTPGroup>
        <InputOTPSlot index={2} />
        <InputOTPSlot index={3} />
      </InputOTPGroup>
    </InputOTP>,
  );
  assert.match(grouped, /Carácter 3 de 4/);
  assert.match(grouped, /fui-input-otp-separator/);
  assert.match(grouped, /data-invalid=""/);
});

test("the direction provider is Base UI's, under shadcn's names: inside it, Base UI reads right to left", () => {
  function Reads() {
    return <span>{useDirection()}</span>;
  }
  assert.equal(renderToStaticMarkup(<Reads />), "<span>ltr</span>");
  assert.equal(
    renderToStaticMarkup(
      <DirectionProvider direction="rtl">
        <Reads />
      </DirectionProvider>,
    ),
    "<span>rtl</span>",
  );
});

test("a growing textarea carries its row limits; a plain one is unchanged", () => {
  const html = renderToStaticMarkup(<Textarea autoResize minRows={2} maxRows={6} aria-label="Reply" />);
  assert.match(html, /data-autoresize=""/);
  assert.match(html, /--fui-textarea-min-rows:2/);
  assert.match(html, /--fui-textarea-max-rows:6/);
  assert.doesNotMatch(renderToStaticMarkup(<Textarea aria-label="Notes" />), /data-autoresize|--fui-textarea/);
  assert.match(styles, /\.fui-textarea\[data-autoresize\] \{\n\s+field-sizing: content;/);
});

test("the inputs reuse the material: wells for fields and slots, a raised fader cap, and forced colors keep their edges", () => {
  const block = styles.slice(styles.indexOf("/* 0.10 inputs:"));
  assert.match(block, /\.fui-number-field-group \{[^}]*box-shadow: var\(--fui-shadow-well\)/);
  assert.match(block, /\.fui-input-otp-slot \{[^}]*box-shadow: var\(--fui-shadow-well\)/);
  assert.match(block, /\.fui-slider-thumb \{[^}]*box-shadow: var\(--fui-shadow-xs\), var\(--fui-highlight\)/);
  assert.match(block, /@media \(forced-colors: active\) \{[\s\S]*\.fui-slider-indicator \{\n\s+background: Highlight;/);
});
