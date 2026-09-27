import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import {
  ActivityStrip,
  activityLevel,
  DitherCanvas,
  formatRelativeTime,
  NavTab,
  NavTabs,
  RelativeTime,
  Timeline,
  TimelineItem,
} from "../../packages/ui/src/index";
import {
  BAYER_8,
  ditherChannels,
  ditherToRamp,
  hexToRgb,
  luma,
  mixHex,
  paintField,
  rgbToHex,
  seeded,
  seedFrom,
  sortByLuma,
  type Rgb,
} from "../../packages/ui/src/dither";

const RAMP: Rgb[] = [
  [0, 0, 0],
  [64, 64, 64],
  [128, 128, 128],
  [255, 255, 255],
];

function gray(width: number, height: number, value: (x: number) => number) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      data[i] = data[i + 1] = data[i + 2] = value(x);
      data[i + 3] = 255;
    }
  return data;
}

test("the Bayer matrix covers every threshold once", () => {
  assert.equal(new Set(BAYER_8).size, 64);
  assert.ok(Math.min(...BAYER_8) > 0 && Math.max(...BAYER_8) < 1);
});

test("dithering onto a ramp only uses ramp colours and keeps the average", () => {
  const data = gray(64, 8, (x) => x * 4);
  ditherToRamp(data, 64, RAMP);
  const allowed = new Set(RAMP.map((c) => c.join()));
  for (let i = 0; i < data.length; i += 4) {
    assert.ok(allowed.has(`${data[i]},${data[i + 1]},${data[i + 2]}`));
    assert.equal(data[i + 3], 255);
  }
  const mid = gray(8, 8, () => 96);
  ditherToRamp(mid, 8, RAMP);
  let sum = 0;
  for (let i = 0; i < mid.length; i += 4) sum += mid[i]!;
  assert.ok(Math.abs(sum / 64 - 96) < 2);
  assert.throws(() => ditherToRamp(mid, 8, [[0, 0, 0]]));
});

test("per-channel dithering lands every channel on a level within range", () => {
  const data = gray(16, 16, (x) => x * 16);
  ditherChannels(data, 16, 4, 10, 100);
  const levels = new Set([10, 40, 70, 100]);
  for (let i = 0; i < data.length; i += 4) for (let c = 0; c < 3; c++) assert.ok(levels.has(data[i + c]!));
});

test("colour helpers and seeds are stable", () => {
  assert.deepEqual(hexToRgb("#5cc6a0"), [92, 198, 160]);
  assert.equal(rgbToHex([92, 198, 160]), "#5cc6a0");
  assert.equal(mixHex("#000000", "#ffffff", 0.5), "#808080");
  assert.equal(luma([100, 100, 100]), 100);
  assert.deepEqual(sortByLuma([[255, 255, 255], [0, 0, 0]]), [[0, 0, 0], [255, 255, 255]]);
  const a = seeded(7);
  const b = seeded(7);
  assert.equal(a(), b());
  assert.equal(seedFrom("1000"), seedFrom("1000"));
  assert.notEqual(seedFrom("1000"), seedFrom("1001"));
});

test("a field is painted on the ramp's range: dark where the field is 0, light where it is 1", () => {
  const data = new Uint8ClampedArray(8 * 2 * 4);
  paintField(data, 8, 2, (u) => (u < 0.5 ? 0 : 1), RAMP);
  assert.equal(data[0], 0);
  assert.equal(data[(8 - 1) * 4], 255);
});

test("the dither canvas renders a decorative, hidden canvas", () => {
  const html = renderToStaticMarkup(<DitherCanvas ramp={["#000000", "#ffffff"]} field={() => () => 0.5} fixed />);
  assert.match(html, /<canvas[^>]*aria-hidden="true"/);
  assert.match(html, /data-fixed/);
  assert.match(html, /fui-dither-canvas/);
});

test("activity levels split by share of the maximum", () => {
  assert.equal(activityLevel(0, 10), 0);
  assert.equal(activityLevel(1, 10), 1);
  assert.equal(activityLevel(5, 10), 2);
  assert.equal(activityLevel(10, 10), 4);
  assert.equal(activityLevel(3, 0), 0);
});

test("the activity strip backs its colours with a table", () => {
  const html = renderToStaticMarkup(
    <ActivityStrip
      caption="Posts per day"
      cells={[
        { label: "Mon", value: 0 },
        { label: "Tue", value: 4 },
        { label: "Wed", value: 2, tone: "warning" },
      ]}
      startLabel="3 days ago"
      endLabel="today"
    />,
  );
  assert.match(html, /<caption>Posts per day<\/caption>/);
  assert.match(html, /data-level="4"[^>]*title="Tue: 4"/);
  assert.match(html, /data-tone="warning"/);
  assert.match(html, /3 days ago/);
});

test("timeline items carry tone, time and a one-off fresh marker", () => {
  const html = renderToStaticMarkup(
    <Timeline>
      <TimelineItem tone="danger" title="Post deleted" time="now" fresh>
        text
      </TimelineItem>
      <TimelineItem title="Followed @a" />
    </Timeline>,
  );
  assert.match(html, /<ol[^>]*fui-timeline/);
  assert.match(html, /data-tone="danger" data-fresh="true"/);
  assert.doesNotMatch(html.split("</li>")[1]!, /data-fresh/);
  assert.match(html, /Post deleted/);
  assert.equal((html.match(/<li/g) ?? []).length, 2);
});

test("relative time reads naturally and falls back to a date", () => {
  const now = Date.parse("2026-09-27T12:00:00Z");
  assert.equal(formatRelativeTime(now - 10_000, now, "en"), "now");
  assert.equal(formatRelativeTime(now - 3 * 60_000, now, "en"), "3 minutes ago");
  assert.equal(formatRelativeTime(now - 2 * 3_600_000, now, "es"), "hace 2 horas");
  assert.equal(formatRelativeTime(now - 86_400_000, now, "es"), "ayer");
  assert.equal(formatRelativeTime(now - 40 * 86_400_000, now, "en", { absoluteAfterDays: 30 }), "Aug 18, 2026");
  const html = renderToStaticMarkup(<RelativeTime date="2026-09-27T11:00:00Z" locale="es" />);
  assert.match(html, /<time[^>]*dateTime="2026-09-27T11:00:00.000Z"/);
});

test("nav tabs are links with the current page marked", () => {
  const html = renderToStaticMarkup(
    <NavTabs label="Sections">
      <NavTab href="/a" current count={3}>
        Feed
      </NavTab>
      <NavTab href="/b">Media</NavTab>
    </NavTabs>,
  );
  assert.match(html, /<nav aria-label="Sections"/);
  assert.match(html, /<a[^>]*aria-current="page" href="\/a"/);
  assert.match(html, /data-active=""/);
  assert.match(html, /fui-nav-tab-count">3</);
  assert.doesNotMatch(html, /href="\/b"[^>]*aria-current/);
});

test("the built dither entry keeps every export of its source", async () => {
  const { readFile } = await import("node:fs/promises");
  const { resolve } = await import("node:path");
  const root = resolve(import.meta.dirname, "../../packages/ui");
  const source = await readFile(resolve(root, "src/dither.ts"), "utf8");
  const names = [...source.matchAll(/^export (?:function|const) (\w+)/gm)].map((m) => m[1]);
  let built: string;
  try {
    built = await readFile(resolve(root, "dist/dither.js"), "utf8");
  } catch {
    return; // not built yet; `bun run check` builds after testing
  }
  for (const name of names) assert.match(built, new RegExp(`\\b${name}\\b[,\\n]`), `dist/dither.js lost ${name}`);
});
