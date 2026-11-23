import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import {
  FabrialsGem,
  RADIANT_ORDERS,
  RADIANT_ORDER_MAP,
  RadiantGlyph,
  type GemName,
} from "../../packages/ui/src";
import { GEM_HEX, gemRamp } from "../../packages/ui/src/dither";

const tokens = readFileSync(new URL("../../packages/ui/src/tokens.css", import.meta.url), "utf8");
const source = readFileSync(new URL("../../packages/ui/src/radiant-glyph.tsx", import.meta.url), "utf8");

test("radiant-glyph is server-safe and exposes all ten canonical orders in Double Eye order", () => {
  assert.doesNotMatch(source, /^\s*["']use client["']/m);
  assert.equal(RADIANT_ORDERS.length, 10);
  assert.deepEqual(
    RADIANT_ORDERS.map((entry) => entry.order),
    [
      "windrunner",
      "skybreaker",
      "dustbringer",
      "edgedancer",
      "truthwatcher",
      "lightweaver",
      "elsecaller",
      "willshaper",
      "stoneward",
      "bondsmith",
    ],
  );
  // Every adjacent pair around the Double Eye shares one Surge.
  for (let i = 0; i < RADIANT_ORDERS.length; i += 1) {
    const current = RADIANT_ORDERS[i]!;
    const next = RADIANT_ORDERS[(i + 1) % RADIANT_ORDERS.length]!;
    assert.equal(current.number, i + 1);
    assert.equal(current.surges[1], next.surges[0], `${current.name} and ${next.name} share ${current.surges[1]}`);
    assert.equal(RADIANT_ORDER_MAP[current.order], current);
  }
});

test("each RadiantGlyph renders a unique bilaterally symmetrical 64x64 vector mark", () => {
  const rendered = new Set<string>();
  for (const entry of RADIANT_ORDERS) {
    const html = renderToStaticMarkup(<RadiantGlyph order={entry.order} size={32} colored />);
    assert.match(html, /viewBox="0 0 64 64"/);
    assert.match(html, new RegExp(`data-order="${entry.order}"`));
    assert.match(html, new RegExp(`data-gem="${entry.gem}"`));
    assert.match(html, /data-colored="true"/);
    assert.match(html, /aria-hidden="true"/);
    assert.match(html, /transform="translate\(64 0\) scale\(-1 1\)"/);
    assert.doesNotMatch(html, /role="img"/);
    assert.ok(!rendered.has(html), `duplicate glyph geometry for ${entry.order}`);
    rendered.add(html);
  }
  const titled = renderToStaticMarkup(<RadiantGlyph order="windrunner" size={20} title="Windrunner glyph" />);
  assert.match(titled, /role="img"/);
  assert.match(titled, /aria-label="Windrunner glyph"/);
  assert.doesNotMatch(titled, /aria-hidden="true"/);
});

test("all ten polestones plus stormlight have CSS tokens, dither ramps and FabrialsGem support", () => {
  const gems: GemName[] = [
    "stormlight",
    "sapphire",
    "smokestone",
    "ruby",
    "diamond",
    "emerald",
    "garnet",
    "zircon",
    "amethyst",
    "topaz",
    "heliodor",
  ];
  for (const gem of gems) {
    assert.ok(gem in GEM_HEX, `GEM_HEX missing ${gem}`);
    assert.ok(gemRamp(gem).dark.length >= 5);
    assert.ok(tokens.includes(`[data-gem="${gem}"]`), `tokens.css missing [data-gem="${gem}"]`);
    assert.equal(
      (tokens.match(new RegExp(`--gem-${gem}:`, "g")) ?? []).length,
      3,
      `--gem-${gem} must be defined in light, dark and system scopes`,
    );
    const gemHtml = renderToStaticMarkup(<FabrialsGem gem={gem} size={20} />);
    assert.match(gemHtml, new RegExp(`data-gem="${gem}"`));
  }
});
