import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import {
  MOON_VARIANTS,
  MoonPhase,
  Starfield,
  isMoonVariantId,
  lunarPhase,
  lunarPhaseName,
  moonFrame,
  moonIllumination,
  moonLitPath,
  moonShadowPath,
  moonVariant,
  moonVariantCaption,
  moonVariantStrength,
  pickMoonVariant,
} from "../../packages/ui/src/index";

test("moon shadow covers the disc at new moon and vanishes at full moon", () => {
  assert.equal(moonShadowPath(0), "M256,84 A172 172 0 0 0 256,428 A172.00 172 0 0 0 256,84 Z");
  assert.equal(moonShadowPath(0.5), "M256,84 A172 172 0 0 1 256,428 A172.00 172 0 0 0 256,84 Z");
  assert.match(moonShadowPath(0.25), /A0\.00 172/);
  assert.ok(Math.abs(moonIllumination(0.5) - 1) < 1e-9);
  assert.ok(moonIllumination(0) < 1e-9);
});

test("the glow follows the lit side, opposite the shadow limb", () => {
  assert.equal(moonLitPath(0.5), "M256,84 A172 172 0 0 0 256,428 A172.00 172 0 0 0 256,84 Z");
  assert.equal(moonLitPath(0), "M256,84 A172 172 0 0 1 256,428 A172.00 172 0 0 0 256,84 Z");
  assert.match(moonLitPath(0.2), /^M256,84 A172 172 0 0 1 256,428/);
  assert.match(moonLitPath(0.8), /^M256,84 A172 172 0 0 0 256,428/);
  assert.ok(moonFrame(0.1).glowOuterOpacity < moonFrame(0.5).glowOuterOpacity);
});

test("lunar phase follows the synodic month", () => {
  assert.equal(lunarPhaseName(lunarPhase(new Date("2000-01-06T18:14:00Z"))), "New moon");
  assert.equal(lunarPhaseName(lunarPhase(new Date("2000-01-21T12:00:00Z"))), "Full moon");
  assert.equal(lunarPhaseName(0.99), "New moon");
});

test("variants are weighted by rarity and appear at their phase", () => {
  assert.equal(pickMoonVariant(() => 0).id, "regular");
  assert.equal(pickMoonVariant(() => 0.9999).id, "super-blood");
  const counts = new Map<string, number>();
  let seed = 7;
  const random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  for (let i = 0; i < 20000; i += 1) {
    const id = pickMoonVariant(random).id;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  assert.ok((counts.get("regular") ?? 0) > (counts.get("blood") ?? 0) * 10);
  assert.ok((counts.get("super-blood") ?? 0) < (counts.get("blood") ?? 0));
  const blood = moonVariant("blood");
  assert.equal(moonVariantStrength(blood, 0.5), 1);
  assert.equal(moonVariantStrength(blood, 0.2), 0);
  const earthshine = moonVariant("earthshine");
  assert.ok(moonVariantStrength(earthshine, 0.08) > 0.9);
  assert.equal(moonVariantStrength(earthshine, 0.5), 0);
  assert.ok(moonFrame(0.08, earthshine).shadowOpacity < moonFrame(0.08).shadowOpacity);
  assert.ok(moonFrame(0.5, blood).tintOpacity > 0.8);
  assert.match(moonFrame(0.5, moonVariant("supermoon")).transform, /scale\(1\.14/);
  assert.equal(moonVariantCaption(blood), "Blood moon · Rare");
  assert.equal(moonVariantCaption(MOON_VARIANTS[0]), "");
  assert.ok(isMoonVariantId("blue"));
  assert.ok(!isMoonVariantId("green"));
});

test("moon phase is decorative unless it has a label", () => {
  assert.match(renderToStaticMarkup(<MoonPhase phase={0.3} />), /aria-hidden="true"/);
  const labelled = renderToStaticMarkup(<MoonPhase label="First quarter" phase={0.25} size={48} />);
  assert.match(labelled, /role="img"/);
  assert.match(labelled, /aria-label="First quarter"/);
  assert.match(labelled, /width:48px/);
  assert.equal(renderToStaticMarkup(<MoonPhase halo={false} />).match(/glow-outer-/g)?.length, 1);
  assert.match(renderToStaticMarkup(<MoonPhase caption phase={0.5} variant="blood" />), /Blood moon · Rare/);
  assert.match(renderToStaticMarkup(<Starfield twinkle={false} />), /fui-starfield-far"/);
});
