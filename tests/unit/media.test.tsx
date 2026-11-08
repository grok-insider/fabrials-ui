import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import {
  AspectRatio,
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
  bufferedEnd,
  focusOf,
  formatClock,
  Image,
  isDrag,
  keyAction,
  MediaGrid,
  panDelta,
  pinchIntent,
  pinchScale,
  scrollForFocus,
  scrollToKeep,
  spokenClock,
  stepScale,
  stepSpeed,
  swipeStep,
  wheelIntent,
  wheelScale,
  ZOOM_STEP,
  zoomLimit,
} from "@fabrials/ui";

const near = (actual: number | null, expected: number) => assert.ok(actual !== null && Math.abs(actual - expected) < 1e-9, `${actual} is not ${expected}`);

test("viewer zoom: a notch of the wheel is a quarter more or less, however far the system says it turned", () => {
  assert.equal(ZOOM_STEP, 1.25);
  near(wheelScale({ deltaY: -100, ctrlKey: false }, 1, 4), 1.25);
  near(wheelScale({ deltaY: -53, ctrlKey: false }, 1, 4), 1.25);
  near(wheelScale({ deltaY: -3, deltaMode: 1, ctrlKey: false }, 1, 4), 1.25);
  near(wheelScale({ deltaY: 100, ctrlKey: false }, 2, 4), 1.6);
  near(wheelScale({ deltaY: 40, ctrlKey: true }, 2, 4), 1.6);
  assert.equal(wheelScale({ deltaY: -100, ctrlKey: false }, 3.5, 4), 4);
  assert.equal(wheelScale({ deltaY: 100, ctrlKey: false }, 1.1, 4), 1);
  assert.equal(wheelScale({ deltaY: -100, ctrlKey: false }, 4, 4), null);
  assert.equal(wheelScale({ deltaY: 100, ctrlKey: false }, 1, 4), null);
});

test("viewer zoom: a trackpad moves smoothly, a pinch follows the fingers, and a sideways turn is left to scroll", () => {
  near(wheelScale({ deltaY: -10, ctrlKey: false }, 1, 4), Math.exp(0.03));
  near(wheelScale({ deltaY: 10, ctrlKey: false }, 2, 4), 2 * Math.exp(-0.03));
  near(wheelScale({ deltaY: -10, ctrlKey: true }, 1, 4), Math.exp(0.1));
  assert.equal(wheelScale({ deltaX: 50, deltaY: 10, ctrlKey: false }, 2, 4), null);
  assert.equal(wheelScale({ deltaY: 0, ctrlKey: false }, 2, 4), null);
  assert.equal(pinchScale(1, 100, 150, 4), 1.5);
  assert.equal(pinchScale(3, 100, 200, 4), 4);
  assert.equal(pinchScale(2, 100, 25, 4), 1);
  assert.equal(pinchScale(2, 0, 25, 4), 2);
});

test("viewer zoom: + and − step, up to twice the real size and never less than four times fitted", () => {
  assert.equal(stepScale(1, 1, 4), 1.25);
  assert.equal(stepScale(1.25, -1, 4), 1);
  assert.equal(stepScale(1, -1, 4), 1);
  assert.equal(stepScale(3.6, 1, 4), 4);
  assert.equal(zoomLimit(3), 6);
  assert.equal(zoomLimit(1.5), 4);
  assert.equal(zoomLimit(1), 4);
  assert.equal(zoomLimit(Number.NaN), 4);
});

test("viewer zoom: the point under the pointer stays under it as the picture grows", () => {
  // Fitted at 1000 × 500 with its left edge 200 px into the stage; the pointer is on its middle, 700 px in.
  const anchor = { ...focusOf({ left: 200, top: 0, width: 1000, height: 500 }, { x: 700, y: 250 }), x: 700, y: 250 };
  assert.deepEqual(scrollToKeep(anchor, { left: 0, top: 0, width: 2000, height: 1000 }), { left: 300, top: 250 });
  // Three quarters across and a fifth down, 900 px into the stage and 100 px down.
  const corner = { ...focusOf({ left: 200, top: 0, width: 1000, height: 500 }, { x: 950, y: 100 }), x: 950, y: 100 };
  assert.deepEqual(scrollToKeep(corner, { left: 0, top: 0, width: 4000, height: 2000 }), { left: 2050, top: 300 });
});

test("viewer gestures (deprecated 0.11): the old wheel and pinch intents still answer; a press that moves is a drag", () => {
  assert.equal(wheelIntent({ deltaY: -40, ctrlKey: false }, false), "in");
  assert.equal(wheelIntent({ deltaY: 40, ctrlKey: false }, false), null);
  assert.equal(wheelIntent({ deltaY: 40, ctrlKey: false }, true), null);
  assert.equal(wheelIntent({ deltaY: 40, ctrlKey: true }, true), "out");
  assert.equal(pinchIntent(100, 130, false), "in");
  assert.equal(pinchIntent(100, 110, false), null);
  assert.equal(pinchIntent(100, 75, true), "out");
  assert.equal(isDrag({ x: 0, y: 0 }, { x: 3, y: 2 }), false);
  assert.equal(isDrag({ x: 0, y: 0 }, { x: 6, y: 0 }), true);
});

test("a swipe moves in reading order, needs distance and must be mostly horizontal", () => {
  assert.equal(swipeStep({ x: 300, y: 100 }, { x: 200, y: 110 }), 1);
  assert.equal(swipeStep({ x: 200, y: 100 }, { x: 300, y: 100 }), -1);
  assert.equal(swipeStep({ x: 300, y: 100 }, { x: 200, y: 100 }, true), -1);
  assert.equal(swipeStep({ x: 300, y: 100 }, { x: 280, y: 100 }), 0);
  assert.equal(swipeStep({ x: 300, y: 100 }, { x: 220, y: 200 }), 0);
});

test("zoom focus: the pressed point goes to the middle of the stage, inside what can scroll", () => {
  assert.deepEqual(focusOf({ left: 100, top: 50, width: 400, height: 200 }, { x: 400, y: 100 }), { fx: 0.75, fy: 0.25 });
  assert.deepEqual(focusOf({ left: 0, top: 0, width: 0, height: 0 }), { fx: 0.5, fy: 0.5 });
  assert.deepEqual(scrollForFocus({ fx: 0.75, fy: 0.5 }, { left: 0, top: 0, width: 2400, height: 1500 }, { width: 1000, height: 800 }), { left: 1300, top: 350 });
  assert.deepEqual(scrollForFocus({ fx: 1, fy: 1 }, { left: 0, top: 0, width: 2400, height: 1500 }, { width: 1000, height: 800 }), { left: 1400, top: 700 });
  assert.deepEqual(panDelta("ArrowRight", { width: 1000, height: 800 }), { dx: 100, dy: 0 });
  assert.deepEqual(panDelta("PageDown", { width: 1000, height: 800 }), { dx: 0, dy: 720 });
  assert.equal(panDelta("Enter", { width: 1000, height: 800 }), null);
});

test("player logic: clocks, spoken times, buffered ranges, speeds and the keys people know", () => {
  assert.equal(formatClock(65), "1:05");
  assert.equal(formatClock(3725), "1:02:05");
  assert.equal(formatClock(Number.NaN), "0:00");
  assert.equal(spokenClock(65), "1 minute 5 seconds");
  assert.equal(spokenClock(0), "0 seconds");
  const ranges = { length: 2, start: (i: number) => [0, 30][i]!, end: (i: number) => [10, 50][i]! };
  assert.equal(bufferedEnd(ranges, 35), 50);
  assert.equal(bufferedEnd(ranges, 5), 10);
  assert.equal(stepSpeed(1, 1), 1.25);
  assert.equal(stepSpeed(2, 1), 2);
  assert.equal(stepSpeed(0.5, -1), 0.5);
  assert.deepEqual(keyAction(" "), { type: "toggle" });
  assert.deepEqual(keyAction("j"), { type: "seek", by: -10 });
  assert.deepEqual(keyAction("ArrowRight"), { type: "seek", by: 5 });
  assert.deepEqual(keyAction("7"), { type: "seekTo", percent: 70 });
  assert.equal(keyAction("f", { audio: true }), null);
  assert.equal(keyAction("x"), null);
});

test("avatars: a group folds the rest into a named count; a badge with a label is an image of its status", () => {
  const group = renderToStaticMarkup(
    <AvatarGroup max={2}>
      {["A", "B", "C", "D"].map((name) => (
        <Avatar key={name}>
          <AvatarFallback>{name}</AvatarFallback>
        </Avatar>
      ))}
    </AvatarGroup>,
  );
  assert.equal(group.match(/data-slot="avatar"/g)?.length, 2);
  assert.match(group, /class="fui-avatar fui-avatar-group-count" aria-label="2 more" role="img">\+2</);
  const badge = renderToStaticMarkup(<AvatarBadge tone="danger" label="Busy" />);
  assert.match(badge, /data-tone="danger" class="fui-avatar-badge" role="img" aria-label="Busy"/);
  assert.match(renderToStaticMarkup(<AvatarBadge />), /aria-hidden="true"/);
});

test("a frame waiting for its picture draws no img, so a browser never shows its broken-image mark", () => {
  const waiting = renderToStaticMarkup(<Image alt="A pier" ratio="4 / 3" />);
  assert.match(waiting, /data-state="loading"/);
  assert.doesNotMatch(waiting, /<img/);
  assert.doesNotMatch(renderToStaticMarkup(<Image alt="A pier" ratio="4 / 3" src="" />), /<img/);
  assert.match(renderToStaticMarkup(<Image alt="A pier" ratio="4 / 3" src="a.png" />), /<img [^>]*src="a\.png"/);
});

test("frames keep their shape: an aspect ratio, an image ratio from its size, a figure only with a caption", () => {
  assert.match(renderToStaticMarkup(<AspectRatio ratio={16 / 9} />), /--fui-aspect-ratio:1\.7777/);
  const plain = renderToStaticMarkup(<Image src="a.png" alt="A pier" width={1200} height={800} />);
  assert.match(plain, /^<div data-slot="image" data-state="loading" data-fit="cover"/);
  assert.match(plain, /--fui-aspect-ratio:1200 \/ 800/);
  assert.match(plain, /loading="lazy"/);
  const figure = renderToStaticMarkup(<Image src="a.png" alt="A pier" ratio="4 / 3" fit="contain" caption="The east pier." />);
  assert.match(figure, /^<figure/);
  assert.match(figure, /<figcaption class="fui-image-caption">The east pier\.<\/figcaption>/);
});

test("a mosaic draws up to four tiles; past that the last says how many more, named for the button", () => {
  const items = Array.from({ length: 6 }, (_, index) => ({ src: `p${index}.png`, alt: `Photo ${index + 1}` }));
  const html = renderToStaticMarkup(<MediaGrid items={items} onOpen={() => undefined} />);
  assert.match(html, /data-count="4"/);
  assert.equal(html.match(/<button/g)?.length, 4);
  assert.match(html, /aria-label="Photo 4 \(4 of 6\), 2 more"/);
  assert.match(html, /class="fui-media-grid-more" aria-hidden="true">\+2</);
  const still = renderToStaticMarkup(<MediaGrid items={items.slice(0, 2)} />);
  assert.doesNotMatch(still, /<button/);
  assert.match(still, /alt="Photo 1"/);
});
