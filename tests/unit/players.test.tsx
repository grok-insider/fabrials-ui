import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { AnimatedImage, AudioPlayer, mayAnimate, playbackProblem, VideoPlayer } from "@fabrials/ui";

const styles = readFileSync(new URL("../../packages/ui/src/styles.css", import.meta.url), "utf8");

test("video: a named, focusable player on the dark tokens, our controls over a video without the browser's", () => {
  const html = renderToStaticMarkup(
    <VideoPlayer src="clip.webm" poster="still.png" label="The harbour" width={640} height={360} tracks={[{ src: "en.vtt", srcLang: "en", label: "English" }]} />,
  );
  assert.match(html, /role="group" aria-label="The harbour" aria-roledescription="video player" tabindex="0" class="dark fui-player fui-video-player"/);
  assert.match(html, /data-theme="dark"/);
  assert.doesNotMatch(html, /<video[^>]*controls/);
  assert.match(html, /<video[^>]*playsInline=""[^>]*preload="metadata"/i);
  assert.match(html, /<track src="en.vtt" srcLang="en" label="English" kind="captions"/i);
  for (const name of ["Play", "Seek", "Mute", "Volume", "Speed: Normal", "Captions", "Full screen"]) assert.match(html, new RegExp(`aria-label="${name}"`), name);
  assert.match(html, /class="fui-player-start" aria-label="Play"/);
  assert.match(html, /--fui-aspect-ratio:1\.7777/);
});

test("audio: a plate with the same transport and no full screen or captions", () => {
  const html = renderToStaticMarkup(<AudioPlayer src="note.webm" label="Voice note" title="Voice note · 0:12" />);
  assert.match(html, /aria-roledescription="audio player"/);
  assert.match(html, /<div class="fui-audio-player-title">Voice note · 0:12<\/div>/);
  assert.match(html, /aria-label="Seek"/);
  assert.doesNotMatch(html, /Full screen|Captions/);
});

test("animations: one named frame, still media hidden from assistive technology, a pause button that always exists", () => {
  const gif = renderToStaticMarkup(<AnimatedImage src="loop.gif" alt="Copper light" type="image" width={240} height={135} />);
  assert.match(gif, /<span class="fui-animated-image-frame" role="img" aria-label="Copper light">/);
  assert.match(gif, /<img src="loop.gif" alt=""/);
  assert.match(gif, /<canvas aria-hidden="true" class="fui-animated-image-still" data-hidden=""/);
  assert.match(gif, /aria-label="Play animation"/);
  const loop = renderToStaticMarkup(<AnimatedImage src="loop.webm" alt="Drift" poster="still.png" badge={null} />);
  assert.match(loop, /<video src="loop.webm" poster="still.png" muted="" loop="" playsInline="" preload="metadata" aria-hidden="true"/i);
  assert.doesNotMatch(loop, /fui-animated-image-badge/);
});

test("rules: animations move only on screen, in front and with motion allowed; failures are said in words", () => {
  assert.equal(mayAnimate({ visibleRatio: 0.6, tabHidden: false, reducedMotion: false }), true);
  assert.equal(mayAnimate({ visibleRatio: 0.4, tabHidden: false, reducedMotion: false }), false);
  assert.equal(mayAnimate({ visibleRatio: 1, tabHidden: true, reducedMotion: false }), false);
  assert.equal(mayAnimate({ visibleRatio: 1, tabHidden: false, reducedMotion: true }), false);
  assert.match(playbackProblem(4), /format/);
  assert.match(playbackProblem(2), /download/);
  assert.equal(playbackProblem(undefined, { network: "n", decode: "d", source: "s", other: "o" }), "o");
});

test("the player bar rests as a solid scrim, never a gradient, and gives way under narrow containers", () => {
  const block = styles.slice(styles.indexOf("/* 0.10 players:"));
  assert.match(block, /\.fui-video-player \.fui-player-bar \{[^}]*background: var\(--fui-media-scrim\);/);
  assert.doesNotMatch(block.replace(/var\(--fui-sheen(-soft)?\)/g, ""), /gradient\(/);
  assert.match(block, /@container \(max-width: 30rem\) \{\s+\.fui-player-volume \{\s+display: none;/);
  // A narrow video breaks the bar into rows with a full-width pseudo-element, and shows only the play key before playing.
  assert.match(block, /@container \(max-width: 36rem\) \{[\s\S]*?\.fui-video-player \.fui-player-bar::after \{[^}]*flex-basis: 100%;/);
  assert.match(block, /\.fui-video-player\[data-state="idle"\] \.fui-player-bar \{\s+display: none;/);
});
