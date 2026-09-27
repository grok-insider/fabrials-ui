import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { DitherBand, DitherGem, DitherScene } from "../../packages/ui/src";
import {
  gemField,
  gemRamp,
  hexToRgb,
  paintRampField,
  STORM_RAMP,
  stormBandField,
  stormField,
} from "../../packages/ui/src/dither";

test("a ramp-ordered field keeps the ramp order: 0 is the first colour, 1 the last", () => {
  // Light theme: the "light" is darker than the background, which brightness sorting would flip.
  const ramp = ["#eceeeb", "#8993a0", "#2a63c4"].map(hexToRgb);
  const data = new Uint8ClampedArray(8 * 8 * 4);
  paintRampField(data, 8, 8, () => 0, ramp);
  assert.deepEqual([...data.slice(0, 3)], ramp[0]);
  paintRampField(data, 8, 8, () => 1, ramp);
  assert.deepEqual([...data.slice(0, 3)], ramp[2]);
  paintRampField(data, 8, 8, () => 0.25, ramp);
  const used = new Set<string>();
  for (let i = 0; i < data.length; i += 4) used.add(`${data[i]},${data[i + 1]},${data[i + 2]}`);
  assert.deepEqual([...used].sort(), [ramp[0], ramp[1]].map((c) => c.join(",")).sort());
});

test("the storm front stays in range, calm on the left and mostly off before its reveal", () => {
  const storm = stormField(2);
  for (let i = 0; i <= 20; i++)
    for (let j = 0; j <= 10; j++) {
      const v = storm(i / 20, j / 10);
      assert.ok(v >= 0 && v <= 1.6, `storm(${i / 20}, ${j / 10}) = ${v}`);
    }
  assert.equal(storm(0, 0.5), 0);
  const before = stormField(2, 0);
  const total = (f: (u: number, v: number) => number) => {
    let sum = 0;
    for (let i = 0; i <= 20; i++) for (let j = 0; j <= 10; j++) sum += f(i / 20, j / 10);
    return sum;
  };
  for (let i = 0; i <= 16; i++) assert.equal(before(i / 20, 0.5), 0);
  assert.ok(total(before) < total(storm) * 0.1);
  const band = stormBandField(10);
  assert.ok(band(0.9, 0.5) >= 0);
});

test("the gem is empty outside its octagon and lit inside", () => {
  const gem = gemField(40, 40);
  assert.equal(gem(0.02, 0.02), 0);
  assert.ok(gem(0.5, 0.5) > 0.3);
  const dark = gemField(40, 40, 0);
  assert.ok(dark(0.5, 0.5) <= 0.16);
});

test("brand ramps start from the surface behind the canvas", () => {
  for (const ramp of [STORM_RAMP, gemRamp("ruby")]) {
    assert.equal(ramp.dark[0], "background");
    assert.equal(ramp.light[0], "background");
    assert.ok(ramp.dark.length >= 5 && ramp.light.length >= 5);
  }
});

test("brand pieces are decorative and hidden from assistive technology", () => {
  const html = renderToStaticMarkup(
    <div>
      <DitherScene />
      <DitherBand />
      <DitherGem gem="ruby" size={28} />
    </div>,
  );
  assert.match(html, /data-slot="dither-scene"[^>]*aria-hidden="true"|aria-hidden="true"[^>]*data-slot="dither-scene"/);
  assert.match(html, /data-slot="dither-band"/);
  assert.match(html, /data-gem="ruby"[^>]*style="width:28px;height:28px"/);
  assert.equal((html.match(/<canvas/g) ?? []).length, 3);
});
