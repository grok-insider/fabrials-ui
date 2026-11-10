import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import {
  ClipButton,
  ClipError,
  ClipNote,
  RecorderPanel,
  RecorderPanelView,
  SpeedToggle,
  canRecord,
  claimSound,
  classifyMicError,
  clipFailureOfStatus,
  clipRetryable,
  formatRecordingClock,
  holdsSound,
  matchVoice,
  pickRecordingMimeType,
  releaseSound,
  silenceAll,
  speakableText,
  speechChunks,
  useClipPlayer,
  useRecorder,
  useSlow,
  useSpeech,
  type ClipFailureKind,
  type ClipPhase,
  type ClipPlayer,
  type RecorderStatus,
} from "../../packages/ui/src/index";
import {
  classifyClipFailure,
  clipFailure,
  clipFailureFor,
  clipKey,
  clipPhase,
  clipReducer,
  initialClipState,
  type ClipState,
} from "../../packages/ui/src/clip-logic";
import { canStartRecording, initialRecorderState, isTake, recorderReducer, soundLevel, type RecorderState, type RecorderTake } from "../../packages/ui/src/recorder-logic";
import { VoiceInputButton, describeMicError } from "../../packages/ai-ui/src/index";

const read = (path: string) => readFileSync(new URL(`../../packages/${path}`, import.meta.url), "utf8");
const styles = read("ui/src/styles.css");
const blockAt = styles.indexOf("/* 0.12: sound */");
const closeOf = (text: string, from: number) => {
  let depth = 0;
  for (let at = text.indexOf("{", from); at >= 0 && at < text.length; at += 1) {
    if (text[at] === "{") depth += 1;
    if (text[at] === "}" && --depth === 0) return at + 1;
  }
  return text.length;
};
const block = styles.slice(blockAt, closeOf(styles, styles.lastIndexOf("@layer components {", blockAt)));
const rule = (selector: string, from = block) => {
  const at = from.indexOf(selector);
  assert.ok(at >= 0, `missing rule ${selector}`);
  return from.slice(at, from.indexOf("}", at) + 1);
};

// ---------------------------------------------------------------- the bus

test("the bus: a claim stops whoever held the sound, and only them", () => {
  const stopped: string[] = [];
  const clip = {};
  const player = {};
  const microphone = {};
  claimSound(clip, () => stopped.push("clip"));
  assert.equal(holdsSound(clip), true);
  claimSound(player, () => stopped.push("player"));
  assert.deepEqual(stopped, ["clip"]);
  assert.equal(holdsSound(clip), false);
  assert.equal(holdsSound(player), true);
  // The holder claiming again is not stopped by itself.
  claimSound(player, () => stopped.push("player again"));
  assert.deepEqual(stopped, ["clip"]);
  claimSound(microphone, () => stopped.push("microphone"));
  assert.deepEqual(stopped, ["clip", "player again"]);
  releaseSound(microphone);
  assert.equal(holdsSound(microphone), false);
});

test("the bus: a release by someone who no longer holds it changes nothing; silenceAll spares the one named", () => {
  const stopped: string[] = [];
  const first = {};
  const second = {};
  claimSound(first, () => stopped.push("first"));
  claimSound(second, () => stopped.push("second"));
  // The first one's own "pause" lands after it was stopped: the second keeps the sound.
  releaseSound(first);
  assert.equal(holdsSound(second), true);
  silenceAll(second);
  assert.deepEqual(stopped, ["first"]);
  assert.equal(holdsSound(second), true);
  silenceAll();
  assert.deepEqual(stopped, ["first", "second"]);
  assert.equal(holdsSound(second), false);
  // Nobody holds it: nothing to stop, and a stop is never called twice.
  silenceAll();
  releaseSound(second);
  assert.deepEqual(stopped, ["first", "second"]);
});

test("the bus: a holder that claims from inside its own stop does not loop", () => {
  const a = {};
  const b = {};
  let calls = 0;
  claimSound(a, () => {
    calls += 1;
    releaseSound(a);
  });
  claimSound(b, () => {});
  assert.equal(calls, 1);
  assert.equal(holdsSound(b), true);
  silenceAll();
});

test("the players pause each other through the bus, not through a list of their own", () => {
  const source = read("ui/src/media-player.tsx");
  assert.match(source, /if \(options\.exclusive\) claimSound\(element, \(\) => element\.pause\(\)\);/);
  assert.match(source, /releaseSound\(element\);\s*setState\(\(now\) => \(\{ \.\.\.now, playing: false \}\)\);/);
  assert.doesNotMatch(source, /let playing\b/);
  for (const file of ["clip-player.tsx", "recorder.tsx", "speech.ts"]) assert.match(read(`ui/src/${file}`), /claimSound\(owner, stop\)/, file);
});

// ---------------------------------------------------------------- clips

const request = (state: ClipState, ref: string, speed = state.speed) => clipReducer(state, { type: "request", ref, speed });

test("clips: a request loads, playing marks it heard, the end frees it", () => {
  let state = request(initialClipState(), "a");
  assert.deepEqual(state.now, { ref: "a", speed: "normal", phase: "loading" });
  assert.equal(state.turn, 1);
  assert.equal(clipPhase(state, "a"), "loading");
  assert.equal(clipPhase(state, "b"), "idle");
  assert.equal(state.played.has("a"), false);
  state = clipReducer(state, { type: "playing", turn: 1 });
  assert.equal(clipPhase(state, "a"), "playing");
  assert.equal(state.played.has("a"), true);
  state = clipReducer(state, { type: "ended", turn: 1 });
  assert.equal(state.now, null);
  assert.equal(state.played.has("a"), true);
  assert.equal(state.turn, 1);
});

test("clips: an answer to an older request changes nothing", () => {
  let state = request(initialClipState(), "slow");
  state = request(state, "fast");
  assert.equal(state.turn, 2);
  const before = state;
  assert.equal(clipReducer(state, { type: "playing", turn: 1 }), before);
  assert.equal(clipReducer(state, { type: "ended", turn: 1 }), before);
  assert.equal(clipReducer(state, { type: "failed", turn: 1, ref: "slow", speed: "normal", failure: clipFailure("failed") }), before);
  assert.equal(clipPhase(state, "fast"), "loading");
  assert.equal(clipFailureFor(state), null);
  state = clipReducer(state, { type: "playing", turn: 2 });
  assert.equal(clipPhase(state, "fast"), "playing");
  assert.equal(state.played.has("slow"), false);
});

test("clips: stopping overtakes what was asked for; stopping nothing is nothing", () => {
  const idle = initialClipState();
  assert.equal(clipReducer(idle, { type: "stop" }), idle);
  let state = request(idle, "a");
  state = clipReducer(state, { type: "stop" });
  assert.equal(state.now, null);
  assert.equal(state.turn, 2);
  // The load that was under way comes back: it no longer counts.
  assert.equal(clipReducer(state, { type: "playing", turn: 1 }), state);
});

test("clips: a failure is shown for the clip asked for last and goes with the next request", () => {
  let state = request(initialClipState(), "a");
  state = clipReducer(state, { type: "failed", turn: 1, ref: "a", speed: "normal", failure: clipFailure("offline") });
  assert.equal(state.now, null);
  assert.deepEqual(clipFailureFor(state), { kind: "offline", retryable: true });
  assert.deepEqual(clipFailureFor(state, "a"), { kind: "offline", retryable: true });
  assert.equal(clipFailureFor(state, "b"), null);
  state = request(state, "b");
  assert.equal(clipFailureFor(state), null);
  assert.equal(clipFailureFor(state, "a"), null);
});

test("clips: a spent allowance is remembered for that clip at that speed and is not loaded again, even when the answer came late", () => {
  let state = request(initialClipState(), "a");
  state = clipReducer(state, { type: "failed", turn: 1, ref: "a", speed: "normal", failure: clipFailure("quota") });
  assert.equal(state.spent.has(clipKey("a", "normal")), true);
  state = request(state, "a");
  // Nothing loads: the request answers with the failure at once.
  assert.equal(state.now, null);
  assert.deepEqual(clipFailureFor(state, "a"), { kind: "quota", retryable: false });
  // The slow rendering is another request.
  assert.deepEqual(request(state, "a", "slow").now, { ref: "a", speed: "slow", phase: "loading" });
  // Overtaken, the refusal is still remembered, and nothing is shown for it.
  let late = request(initialClipState(), "b");
  late = request(late, "c");
  late = clipReducer(late, { type: "failed", turn: 1, ref: "b", speed: "normal", failure: clipFailure("quota") });
  assert.equal(late.spent.has(clipKey("b", "normal")), true);
  assert.equal(clipFailureFor(late), null);
  assert.equal(clipPhase(late, "c"), "loading");
  assert.equal(request(late, "b").now, null);
});

test("clips: changing the speed stops what plays; the same speed is no change", () => {
  const idle = initialClipState("normal");
  assert.equal(clipReducer(idle, { type: "speed", speed: "normal" }), idle);
  const slow = clipReducer(idle, { type: "speed", speed: "slow" });
  assert.equal(slow.speed, "slow");
  assert.equal(slow.turn, 0);
  let state = request(idle, "a");
  state = clipReducer(state, { type: "playing", turn: 1 });
  state = clipReducer(state, { type: "speed", speed: "slow" });
  assert.equal(state.now, null);
  assert.equal(state.turn, 2);
  assert.equal(state.played.has("a"), true);
});

test("clips: what a failed load means", () => {
  for (const kind of ["unavailable", "rateLimited", "quota", "offline", "failed"] as const) {
    assert.deepEqual(classifyClipFailure(new ClipError(kind)), { kind, retryable: kind !== "unavailable" && kind !== "quota" });
    assert.equal(new ClipError(kind).kind, kind);
  }
  assert.equal(new ClipError("quota").name, "ClipError");
  assert.equal(new ClipError("quota") instanceof Error, true);
  assert.equal(clipRetryable("unavailable"), false);
  assert.equal(clipRetryable("quota"), false);
  assert.equal(clipRetryable("rateLimited"), true);
  const aborted = Object.assign(new Error("gone"), { name: "AbortError" });
  // The player gave the load up itself: nothing to tell.
  assert.equal(classifyClipFailure(aborted, { aborted: true }), null);
  // The host's own timeout is a failure to ask about again.
  assert.deepEqual(classifyClipFailure(aborted), { kind: "failed", retryable: true });
  assert.deepEqual(classifyClipFailure(new TypeError("Failed to fetch"), { online: false }), { kind: "offline", retryable: true });
  assert.deepEqual(classifyClipFailure(new TypeError("Failed to fetch"), { online: true }), { kind: "failed", retryable: true });
  assert.deepEqual(classifyClipFailure("nope"), { kind: "failed", retryable: true });
  // A ClipError wins over the connection: the host knows better.
  assert.deepEqual(classifyClipFailure(new ClipError("quota"), { online: false }), { kind: "quota", retryable: false });
  assert.equal(clipFailureOfStatus(503), "unavailable");
  assert.equal(clipFailureOfStatus(404), "unavailable");
  assert.equal(clipFailureOfStatus(429), "rateLimited");
  assert.equal(clipFailureOfStatus(429, { quota: true }), "quota");
  assert.equal(clipFailureOfStatus(500), "failed");
});

function fixedPlayer(fixed: { phase?: ClipPhase; played?: boolean; failure?: ClipFailureKind; speed?: string } = {}): ClipPlayer {
  return {
    state: () => fixed.phase ?? "idle",
    played: () => fixed.played ?? false,
    failure: () => (fixed.failure ? clipFailure(fixed.failure) : null),
    play: async () => {},
    stop: () => {},
    toggle: () => {},
    retry: () => null,
    speed: fixed.speed ?? "normal",
    speeds: ["normal", "slow"],
    setSpeed: () => {},
    register: () => () => {},
    focus: () => false,
  };
}

test("a clip's button: three looks, one name, pressed only while it plays", () => {
  const idle = renderToStaticMarkup(<ClipButton clip="a" player={fixedPlayer()} />);
  assert.match(idle, /class="fui-button fui-clip-button"/);
  assert.match(idle, /data-state="idle"/);
  assert.match(idle, /aria-pressed="false"/);
  assert.match(idle, /<span class="fui-clip-button-label">Listen<\/span>/);
  assert.match(idle, /lucide-volume-2/);
  assert.doesNotMatch(idle, /aria-busy|aria-label/);
  assert.match(idle, /data-variant="outline"/);

  const loading = renderToStaticMarkup(<ClipButton clip="a" player={fixedPlayer({ phase: "loading" })} />);
  assert.match(loading, /data-state="loading"/);
  assert.match(loading, /aria-busy="true"/);
  assert.match(loading, /aria-pressed="false"/);
  assert.match(loading, /fui-pixel-spinner/);
  // It stays a key that can be pressed: pressing it gives the load up.
  assert.doesNotMatch(loading, /disabled/);

  const playing = renderToStaticMarkup(<ClipButton clip="a" player={fixedPlayer({ phase: "playing", played: true })} />);
  assert.match(playing, /aria-pressed="true"/);
  assert.match(playing, /lucide-square/);
  assert.match(playing, /fill="currentColor"/);
  assert.match(playing, />Listen again</);

  assert.match(renderToStaticMarkup(<ClipButton clip="a" player={fixedPlayer({ played: true })} />), />Listen again</);
  assert.match(renderToStaticMarkup(<ClipButton clip="a" label="Line 3" player={fixedPlayer({ played: true })} />), />Line 3</);
  assert.match(renderToStaticMarkup(<ClipButton clip="a" labels={{ listen: "Escuchar" }} player={fixedPlayer()} />), />Escuchar</);
  // On its own, from a loader: it renders on the server with nothing playing.
  assert.match(renderToStaticMarkup(<ClipButton clip="a" load={async () => new Blob()} />), /data-state="idle"/);
});

test("a clip's button as an icon: named by a label, or by markup that keeps its language", () => {
  const icon = renderToStaticMarkup(<ClipButton clip="a" iconOnly label="Listen to line 1" player={fixedPlayer()} size="lg" />);
  assert.match(icon, /aria-label="Listen to line 1"/);
  assert.match(icon, /data-size="icon-lg"/);
  assert.match(icon, /data-icon-only="true"/);
  assert.doesNotMatch(icon, /fui-clip-button-label|fui-sr-only/);
  const foreign = renderToStaticMarkup(
    <ClipButton
      clip="a"
      iconOnly
      labelContent={
        <>
          Listen to <bdi dir="rtl" lang="ar">مرحبا</bdi>
        </>
      }
      player={fixedPlayer()}
    />,
  );
  assert.doesNotMatch(foreign, /aria-label/);
  assert.match(foreign, /<span class="fui-sr-only">Listen to <bdi dir="rtl" lang="ar">مرحبا<\/bdi><\/span>/);
  assert.match(renderToStaticMarkup(<ClipButton clip="a" player={fixedPlayer()} size="sm" />), /data-size="sm"/);
});

test("the speed switch: one pressed key, or a segment a speed", () => {
  const off = renderToStaticMarkup(<SpeedToggle player={fixedPlayer()} />);
  assert.match(off, /class="fui-button fui-speed-toggle"/);
  assert.match(off, /aria-pressed="false"/);
  assert.match(off, /<span>Slow<\/span>/);
  assert.match(renderToStaticMarkup(<SpeedToggle player={fixedPlayer({ speed: "slow" })} />), /aria-pressed="true"/);
  assert.match(renderToStaticMarkup(<SpeedToggle labels={{ slow: "Despacio" }} player={fixedPlayer()} />), /Despacio/);
  const segments = renderToStaticMarkup(<SpeedToggle player={fixedPlayer({ speed: "slow" })} variant="segmented" />);
  assert.match(segments, /aria-label="Speed"/);
  assert.match(segments, /fui-toggle-group fui-speed-toggle/);
  assert.match(segments, /Normal/);
  assert.match(segments, /aria-pressed="true"[^>]*>Slow|data-pressed[^>]*>Slow/);
  // A clip with one rendering has nothing to switch.
  assert.equal(renderToStaticMarkup(<SpeedToggle player={{ ...fixedPlayer(), speeds: ["normal"] }} />), "");
});

test("the note under a clip: a polite status from the start, a retry only when it can help", () => {
  const quiet = renderToStaticMarkup(<ClipNote player={fixedPlayer()} />);
  assert.equal(quiet, '<p class="fui-clip-note" role="status"></p>');
  for (const kind of ["rateLimited", "offline", "failed"] as const) {
    const html = renderToStaticMarkup(<ClipNote player={fixedPlayer({ failure: kind })} />);
    assert.match(html, new RegExp(`data-kind="${kind}"`));
    assert.match(html, /<button class="fui-clip-note-retry" type="button">Try again<\/button>/, kind);
    assert.doesNotMatch(html, /role="alert"/);
  }
  for (const kind of ["unavailable", "quota"] as const) {
    const html = renderToStaticMarkup(<ClipNote player={fixedPlayer({ failure: kind })} />);
    assert.match(html, /role="status"/);
    assert.doesNotMatch(html, /<button/, kind);
  }
  assert.match(renderToStaticMarkup(<ClipNote player={fixedPlayer({ failure: "unavailable" })} />), /There is no audio for this\./);
  assert.match(renderToStaticMarkup(<ClipNote labels={{ quota: "Límite alcanzado.", retry: "Reintentar" }} player={fixedPlayer({ failure: "quota" })} />), /Límite alcanzado\./);
});

test("the clip player renders on the server with nothing on", () => {
  function Probe() {
    const player = useClipPlayer({ load: async () => new Blob() });
    return <output>{[player.state("a"), String(player.played("a")), String(player.failure()), player.speed, player.speeds.join("+")].join(" ")}</output>;
  }
  assert.equal(renderToStaticMarkup(<Probe />), "<output>idle false null normal normal+slow</output>");
  function Custom() {
    const player = useClipPlayer({ load: async () => "", speeds: ["0.75", "1"] });
    return <output>{player.speed}</output>;
  }
  assert.equal(renderToStaticMarkup(<Custom />), "<output>0.75</output>");
});

// ---------------------------------------------------------------- the recorder

const take: RecorderTake = { blob: new Blob(["x"]), url: "blob:take", durationMs: 2_400 };
const run = (events: Parameters<typeof recorderReducer>[1][], from: RecorderState = initialRecorderState) => events.reduce(recorderReducer, from);

test("recorder: asking, recording, a take", () => {
  let state = run([{ type: "request" }]);
  assert.equal(state.status, "requesting");
  // A second press while the browser asks, or while recording, is nothing.
  assert.equal(recorderReducer(state, { type: "request" }), state);
  state = recorderReducer(state, { type: "recording" });
  assert.equal(state.status, "recording");
  assert.equal(recorderReducer(state, { type: "request" }), state);
  state = recorderReducer(state, { type: "tick", elapsedMs: 800 });
  assert.equal(state.elapsedMs, 800);
  assert.equal(recorderReducer(state, { type: "tick", elapsedMs: 800 }), state);
  state = recorderReducer(state, { type: "stopped", take });
  assert.deepEqual(state, { status: "recorded", elapsedMs: 2_400, take, tooShort: false, autoStopped: false });
  // The clock does not move once there is a take, and a take is not replaced by a late stop.
  assert.equal(recorderReducer(state, { type: "tick", elapsedMs: 9_000 }), state);
  assert.equal(recorderReducer(state, { type: "stopped", take: null }), state);
  // Recording again starts clean.
  assert.deepEqual(recorderReducer(state, { type: "request" }), { ...initialRecorderState, status: "requesting" });
});

test("recorder: a mis-tap goes back to the start with a note; the limit is said with the take", () => {
  const short = run([{ type: "request" }, { type: "recording" }, { type: "stopped", take: null }]);
  assert.deepEqual(short, { ...initialRecorderState, tooShort: true });
  // The note goes with the next attempt.
  assert.equal(recorderReducer(short, { type: "request" }).tooShort, false);
  const limited = run([{ type: "request" }, { type: "recording" }, { type: "limit" }, { type: "stopped", take }]);
  assert.equal(limited.status, "recorded");
  assert.equal(limited.autoStopped, true);
  // The limit means nothing outside a recording.
  assert.equal(recorderReducer(initialRecorderState, { type: "limit" }), initialRecorderState);
  assert.equal(recorderReducer(initialRecorderState, { type: "recording" }), initialRecorderState);
  assert.equal(recorderReducer(initialRecorderState, { type: "tick", elapsedMs: 5 }), initialRecorderState);
});

test("recorder: each failure is its own status, a new try is allowed from each, and reset keeps a browser that cannot record as it is", () => {
  for (const status of ["denied", "no-microphone", "busy", "error"] as const) {
    const failed = run([{ type: "request" }, { type: "failed", status }]);
    assert.deepEqual(failed, { ...initialRecorderState, status });
    assert.equal(canStartRecording(status), true);
    assert.equal(recorderReducer(failed, { type: "request" }).status, "requesting");
    assert.deepEqual(recorderReducer(failed, { type: "reset" }), initialRecorderState);
  }
  // A recording that breaks mid-take loses the take.
  assert.deepEqual(run([{ type: "request" }, { type: "recording" }, { type: "tick", elapsedMs: 900 }, { type: "failed", status: "error" }]), { ...initialRecorderState, status: "error" });
  const unsupported = recorderReducer(initialRecorderState, { type: "failed", status: "unsupported" });
  assert.equal(unsupported.status, "unsupported");
  assert.equal(recorderReducer(unsupported, { type: "reset" }), unsupported);
  assert.equal(recorderReducer(unsupported, { type: "request" }), unsupported);
  assert.equal(recorderReducer(unsupported, { type: "failed", status: "denied" }), unsupported);
  assert.equal(canStartRecording("unsupported"), false);
  assert.equal(canStartRecording("requesting"), false);
  assert.equal(canStartRecording("recording"), false);
  assert.equal(canStartRecording("recorded"), true);
  assert.deepEqual(run([{ type: "request" }, { type: "recording" }, { type: "stopped", take }, { type: "reset" }]), initialRecorderState);
});

test("recorder: what a refused microphone means", () => {
  for (const name of ["NotAllowedError", "PermissionDeniedError", "SecurityError"]) assert.equal(classifyMicError({ name }), "denied", name);
  for (const name of ["NotFoundError", "DevicesNotFoundError", "OverconstrainedError"]) assert.equal(classifyMicError({ name }), "no-microphone", name);
  for (const name of ["NotReadableError", "TrackStartError"]) assert.equal(classifyMicError({ name }), "busy", name);
  for (const name of ["AbortError", "TypeError", ""]) assert.equal(classifyMicError({ name }), "error", name);
  assert.equal(classifyMicError("NotAllowedError"), "denied");
  assert.equal(classifyMicError(Object.assign(new Error("x"), { name: "NotReadableError" })), "busy");
  assert.equal(classifyMicError(new Error("x")), "error");
  assert.equal(classifyMicError(undefined), "error");
  assert.equal(classifyMicError(null), "error");
});

test("recorder: what it takes to record, which container, what counts as a take, how loud", () => {
  const recorder = function MediaRecorder() {};
  assert.equal(canRecord({ mediaDevices: { getUserMedia: () => {} }, MediaRecorder: recorder }), true);
  assert.equal(canRecord({ mediaDevices: { getUserMedia: () => {} } }), false);
  assert.equal(canRecord({ MediaRecorder: recorder }), false);
  assert.equal(canRecord({ mediaDevices: null, MediaRecorder: recorder }), false);
  // The host's own stream needs no getUserMedia (an insecure origin has none).
  assert.equal(canRecord({ MediaRecorder: recorder }, true), true);
  assert.equal(canRecord({}, true), false);

  assert.equal(pickRecordingMimeType((type) => type.startsWith("audio/mp4")), "audio/mp4;codecs=mp4a.40.2");
  assert.equal(pickRecordingMimeType(() => true), "audio/webm;codecs=opus");
  assert.equal(pickRecordingMimeType(() => false), undefined);
  assert.equal(pickRecordingMimeType(undefined), undefined);
  assert.equal(pickRecordingMimeType((type) => type === "audio/wav", ["audio/flac", "audio/wav"]), "audio/wav");
  assert.equal(
    pickRecordingMimeType((type) => {
      if (type.includes("webm")) throw new Error("no");
      return type === "audio/mp4";
    }),
    "audio/mp4",
  );

  assert.equal(isTake(700, 10, 700), true);
  assert.equal(isTake(699, 10, 700), false);
  assert.equal(isTake(5_000, 0, 700), false);
  assert.equal(isTake(1, 1, 0), true);

  assert.equal(soundLevel([]), 0);
  assert.equal(soundLevel(new Uint8Array(256).fill(128)), 0);
  assert.equal(soundLevel(new Uint8Array(256).fill(255)), 1);
  const quiet = soundLevel(Uint8Array.from({ length: 256 }, (_, at) => 128 + Math.round(Math.sin(at / 4) * 12)));
  assert.ok(quiet > 0 && quiet < 0.5, String(quiet));
  assert.equal(Math.round(quiet * 20), quiet * 20);
});

test("recorder: the clock reads minutes and seconds in the locale's digits", () => {
  assert.equal(formatRecordingClock(0), "0:00");
  assert.equal(formatRecordingClock(7_400), "0:07");
  assert.equal(formatRecordingClock(65_400), "1:05");
  assert.equal(formatRecordingClock(600_000), "10:00");
  assert.equal(formatRecordingClock(3_725_000), "62:05");
  assert.equal(formatRecordingClock(-5), "0:00");
  assert.equal(formatRecordingClock(Number.NaN), "0:00");
  assert.equal(formatRecordingClock(7_400, "ar-EG"), "٠:٠٧");
  assert.equal(formatRecordingClock(65_400, "fa"), "۱:۰۵");
  assert.equal(formatRecordingClock(65_400, "hi-u-nu-deva"), "१:०५");
  assert.equal(formatRecordingClock(1_234_000, "de"), "20:34");
});

const view = (status: RecorderStatus, props: Partial<Parameters<typeof RecorderPanelView>[0]> = {}) =>
  renderToStaticMarkup(<RecorderPanelView fallback={<button type="button">Type instead</button>} maxDurationMs={40_000} onSubmit={() => {}} status={status} {...props} />);
const statusLine = (html: string) => html.match(/<p aria-live="polite" class="fui-recorder-status"[^>]*>(.*?)<\/p>/)![1]!;
const keys = (html: string) => [...html.matchAll(/<button[^>]*>(?:<svg[\s\S]*?<\/svg>)*([^<]*)<\/button>/g)].map((match) => match[1]);

test("the recorder: one live region, a named group, and the keys of each step", () => {
  const idle = view("idle");
  assert.match(idle, /<div aria-label="Recorder" class="fui-recorder" data-status="idle" role="group">/);
  assert.equal(idle.match(/aria-live=/g)!.length, 1);
  assert.equal(idle.match(/role="status"/g)!.length, 1);
  assert.doesNotMatch(idle, /role="alert"/);
  assert.equal(statusLine(idle), "");
  assert.match(idle, /<p class="fui-recorder-hint">Up to 0:40\.<\/p>/);
  assert.deepEqual(keys(idle), ["Record", "Type instead"]);

  const requesting = view("requesting");
  assert.equal(statusLine(requesting), "Waiting for the microphone.");
  assert.match(requesting, /aria-busy="true"/);
  assert.match(requesting, /aria-disabled="true"/);
  assert.doesNotMatch(requesting, /fui-recorder-hint/);

  const recording = view("recording", { elapsedMs: 7_400, level: 0.6 });
  assert.equal(statusLine(recording), "Recording.");
  // The clock and the meter are not read: the status says "Recording." once.
  assert.match(recording, /<div aria-hidden="true" class="fui-recorder-live">/);
  assert.match(recording, /<span class="fui-recorder-clock" dir="ltr">0:07 \/ 0:40<\/span>/);
  assert.match(recording, /--fui-recorder-level:0\.60/);
  assert.deepEqual(keys(recording), ["Stop", "Type instead"]);
  assert.doesNotMatch(view("recording", { elapsedMs: 100 }), /fui-recorder-meter/);

  const recorded = view("recorded", { durationMs: 7_400, takeUrl: "blob:take" });
  assert.equal(statusLine(recorded), "Recorded 0:07. Listen back before you use it.");
  assert.match(recorded, /aria-label="Your recording"[^>]*aria-roledescription="audio player"/);
  assert.match(recorded, /<audio src="blob:take"/);
  assert.deepEqual(keys(recorded).filter((key) => key !== ""), ["Use this recording", "Record again", "Type instead"]);
  assert.equal(statusLine(view("recorded", { durationMs: 40_000, autoStopped: true, takeUrl: "blob:take" })), "Stopped at the 0:40 limit. Recorded 0:40. Listen back before you use it.");
  assert.match(view("recorded", { takeUrl: "blob:take", submitLabel: "Transcribe" }), />Transcribe<\/button>/);
});

test("the recorder: a take the host works on, and a take with no primary action", () => {
  const pending = view("recorded", { durationMs: 7_400, takeUrl: "blob:take", pending: true });
  assert.equal(statusLine(pending), "Working on your recording.");
  assert.match(pending, /data-pending="true"/);
  assert.match(pending, /aria-busy="true"[^>]*>(?:<svg[\s\S]*?<\/svg>)?Use this recording/);
  // The take cannot be dropped while it is being worked on, and the key stays in the tab order.
  assert.match(pending, /aria-disabled="true"[^>]*data-variant="outline"|data-variant="outline"[^>]*aria-disabled="true"/);
  assert.equal(statusLine(view("recorded", { takeUrl: "blob:take", pending: true, slow: true })), "Still working.");
  assert.equal(statusLine(view("recorded", { takeUrl: "blob:take", pending: true, slow: true, labels: { slow: "Sigue en ello." } })), "Sigue en ello.");

  const heard = renderToStaticMarkup(<RecorderPanelView status="recorded" takeUrl="blob:take" />);
  assert.deepEqual(keys(heard).filter((key) => key !== ""), ["Record again"]);
  const custom = view("recorded", { takeUrl: "blob:take", action: <button type="button">Check my answer</button> });
  assert.match(custom, /<span class="fui-recorder-action"><button type="button">Check my answer<\/button><\/span>/);
  assert.doesNotMatch(custom, /Use this recording/);
  assert.doesNotMatch(view("recorded", { takeUrl: "blob:take", action: null }), /Use this recording|fui-recorder-action"/);
});

test("the recorder: each failure has its own sentence, a way to try again, and the other way to answer", () => {
  const sentences: Record<string, RegExp> = {
    denied: /^The microphone is blocked\./,
    "no-microphone": /^No microphone was found\./,
    busy: /^The microphone is in use by another app\./,
    error: /^The recording could not start\./,
  };
  for (const [status, sentence] of Object.entries(sentences)) {
    const html = view(status as RecorderStatus);
    assert.match(statusLine(html), sentence, status);
    assert.match(html, /data-tone="problem"/);
    assert.deepEqual(keys(html), ["Try the microphone again", "Type instead"], status);
  }
  assert.equal(new Set(Object.keys(sentences).map((status) => statusLine(view(status as RecorderStatus)))).size, 4);
  const unsupported = view("unsupported");
  assert.equal(statusLine(unsupported), "This browser cannot record sound.");
  assert.deepEqual(keys(unsupported), ["Type instead"]);
  const short = view("idle", { tooShort: true });
  assert.equal(statusLine(short), "That was too short to keep. Record a little longer.");
  assert.doesNotMatch(short, /data-tone/);
  assert.deepEqual(keys(short), ["Record", "Type instead"]);
  // The other way to answer is there in every status.
  for (const status of ["idle", "requesting", "recording", "recorded", "denied", "no-microphone", "unsupported", "busy", "error"] as const) {
    assert.match(view(status, { takeUrl: "blob:take" }), />Type instead<\/button><\/span>/, status);
  }
});

test("the recorder: words, digits and the name are the host's", () => {
  const arabic = view("recording", { elapsedMs: 65_000, locale: "ar-EG", labels: { region: "المسجّل", recording: "جارٍ التسجيل.", stop: "إيقاف" } });
  assert.match(arabic, /aria-label="المسجّل"/);
  assert.equal(statusLine(arabic), "جارٍ التسجيل.");
  assert.match(arabic, /dir="ltr">١:٠٥ \/ ٠:٤٠</);
  assert.match(view("idle", { "aria-label": "Spoken answer" }), /aria-label="Spoken answer"/);
  assert.doesNotMatch(view("idle", { "aria-labelledby": "title" }), /aria-label=/);
  assert.doesNotMatch(view("idle", { hint: null }), /fui-recorder-hint/);
  assert.match(view("idle", { hint: "Say the sentence once." }), /<p class="fui-recorder-hint">Say the sentence once\.<\/p>/);
  assert.match(view("idle", { className: "mine", id: "answer" }), /class="fui-recorder mine"[^>]*id="answer"|id="answer"[^>]*class="fui-recorder mine"/);
  assert.match(view("idle", { disabled: true }), /aria-disabled="true"/);
});

test("the recorder hook renders on the server as idle, not as a browser that cannot record", () => {
  function Probe() {
    const recorder = useRecorder({ maxDurationMs: 40_000 });
    const slow = useSlow(true);
    return (
      <>
        <output>{[recorder.status, String(recorder.supported), recorder.elapsedMs, recorder.level, String(recorder.blob), String(recorder.url), String(recorder.tooShort), String(slow)].join(" ")}</output>
        <RecorderPanel recorder={recorder} />
      </>
    );
  }
  const html = renderToStaticMarkup(<Probe />);
  assert.match(html, /<output>idle false 0 0 null null false false<\/output>/);
  assert.match(html, /data-status="idle"/);
  assert.match(html, />Record<\/button>/);
  assert.doesNotMatch(html, /cannot record/);
});

test("dictation is built on the house recorder and keeps its words", () => {
  const source = read("ai-ui/src/voice-input.tsx");
  assert.match(source, /useRecorder\(\{/);
  assert.doesNotMatch(source, /new MediaRecorder|getUserMedia\(/);
  assert.equal(renderToStaticMarkup(<VoiceInputButton onRecorded={async () => ""} onTranscript={() => {}} unsupportedFallback={<span>No microphone here</span>} />), "");
  assert.equal(describeMicError({ name: "NotAllowedError" }), "Microphone access is blocked. Allow it in your browser's site settings to dictate.");
  assert.equal(describeMicError({ name: "NotFoundError" }), "No microphone was found.");
  assert.equal(describeMicError({ name: "NotReadableError" }), "The microphone is busy in another app.");
  assert.equal(describeMicError({ name: "AbortError" }), "Recording was interrupted.");
  assert.equal(describeMicError(new Error("x")), "Couldn't start the microphone.");
  const mine = { denied: "Bloqueado.", noMicrophone: "Sin micrófono.", busy: "Ocupado." };
  assert.equal(describeMicError({ name: "SecurityError" }, mine), "Bloqueado.");
  assert.equal(describeMicError({ name: "OverconstrainedError" }, mine), "Sin micrófono.");
  assert.equal(describeMicError({ name: "TrackStartError" }, mine), "Ocupado.");
  assert.equal(describeMicError({ name: "AbortError" }, mine), "Recording was interrupted.");
});

// ---------------------------------------------------------------- reading aloud

test("speech skips markdown, code and math", () => {
  assert.equal(
    speakableText("## Title\n**Bold** point [[1]] with $x^2$ and [a link](https://x.y).\n```js\ncode()\n```\nEnd."),
    "Title Bold point with and a link. End.",
  );
  assert.equal(speakableText("Before\n~~~\nx\n~~~\nafter $$\\int_0^1 x$$ done \\(a+b\\) and \\[c\\]."), "Before after done and.");
  assert.equal(speakableText("A picture ![the harbour](h.png) here."), "A picture here.");
  assert.equal(speakableText("It rained [1] twice[^note] in March [2]."), "It rained twice in March.");
  assert.equal(speakableText("- one\n- two\n3. three\n\n---\n> quoted _text_ and `code`"), "one two three quoted text and code");
  assert.equal(speakableText("| a | b |\n|---|:-:|\n| 1 | 2 |"), "a b 1 2");
  assert.equal(speakableText("Line<br>break and <b>bold</b>, 2 < 3."), "Line break and bold, 2 < 3.");
  // A fence still open (an answer that is still arriving) is not read.
  assert.equal(speakableText("Run this:\n```sh\nrm -rf"), "Run this:");
  assert.equal(speakableText("  \n "), "");
  assert.equal(speakableText("مرحبا **بالعالم** ، كيف الحال ؟"), "مرحبا بالعالم، كيف الحال؟");
});

test("short text is one chunk", () => {
  assert.deepEqual(speechChunks("  Bonjour,   je m'appelle Puck.  "), ["Bonjour, je m'appelle Puck."]);
  assert.deepEqual(speechChunks("   "), []);
  assert.deepEqual(speechChunks(""), []);
});

test("long text splits at sentence ends and stays under the limit", () => {
  const text = Array.from({ length: 30 }, (_, i) => `Frase número ${i} de la respuesta, con algo de texto.`).join(" ");
  const chunks = speechChunks(text, 200);
  assert.ok(chunks.length > 5);
  assert.ok(chunks.every((chunk) => chunk.length <= 200));
  assert.ok(chunks.every((chunk) => chunk.endsWith(".")));
  assert.equal(chunks.join(" "), text);
});

test("a sentence longer than a chunk breaks at a comma or a space", () => {
  const long = `${"palabra ".repeat(60).trim()}, y ${"otra ".repeat(40).trim()}.`;
  const chunks = speechChunks(long, 300);
  assert.ok(chunks.every((chunk) => chunk.length <= 300));
  assert.equal(chunks.join(" ").replace(/\s+/g, " "), long);
  // After the comma when there is one in reach.
  assert.deepEqual(speechChunks("uno dos tres cuatro, cinco seis siete ocho nueve diez", 30), ["uno dos tres cuatro,", "cinco seis siete ocho nueve", "diez"]);
});

test("sentences end where each script ends them", () => {
  assert.deepEqual(speechChunks("¿Dónde está? ¡Aquí! Vale.", 14), ["¿Dónde está?", "¡Aquí! Vale."]);
  assert.deepEqual(speechChunks("كيف حالك؟ أنا بخير. شكراً لك!", 12), ["كيف حالك؟", "أنا بخير.", "شكراً لك!"]);
  assert.deepEqual(speechChunks("یہ پہلا جملہ ہے۔ یہ دوسرا ہے۔", 18), ["یہ پہلا جملہ ہے۔", "یہ دوسرا ہے۔"]);
  // Chinese and Japanese put nothing between sentences.
  assert.deepEqual(speechChunks("今天天气很好。我们去公园吧！你觉得呢？", 8), ["今天天气很好。", "我们去公园吧！", "你觉得呢？"]);
  assert.deepEqual(speechChunks("彼は「行こう。」と言った。それから出た。", 14), ["彼は「行こう。」と言った。", "それから出た。"]);
  // A closing quote stays with its sentence; a decimal point and a dotted name are not ends.
  assert.deepEqual(speechChunks('She said "stop." Then left.', 17), ['She said "stop."', "Then left."]);
  assert.deepEqual(speechChunks("Pi is 3.14 or so. See example.com today.", 20), ["Pi is 3.14 or so.", "See example.com", "today."]);
  assert.deepEqual(speechChunks("Wait… what?! Really.", 12), ["Wait… what?!", "Really."]);
});

test("a cut never falls inside a word or a written character", () => {
  const sentence = "The quick brown fox jumps over the lazy dog near the riverbank";
  for (let max = 12; max < 40; max += 1) {
    const chunks = speechChunks(sentence, max);
    assert.ok(chunks.every((chunk) => chunk.length <= max), `max ${max}`);
    assert.deepEqual(chunks.join(" ").split(" "), sentence.split(" "), `max ${max}`);
  }
  // Arabic commas, then spaces.
  const arabic = speechChunks("ذهبنا إلى السوق، ثم اشترينا خبزاً وتمراً وعدنا إلى البيت قبل المغرب", 24);
  assert.equal(arabic[0], "ذهبنا إلى السوق،");
  assert.ok(arabic.every((chunk) => chunk.length <= 24));
  assert.equal(arabic.join(" "), "ذهبنا إلى السوق، ثم اشترينا خبزاً وتمراً وعدنا إلى البيت قبل المغرب");
  // No spaces at all: between words where the script has them, and never through a character.
  const chinese = speechChunks("我们今天下午去公园散步然后回家吃晚饭", 7);
  assert.ok(chinese.every((chunk) => chunk.length <= 7));
  assert.equal(chinese.join(""), "我们今天下午去公园散步然后回家吃晚饭");
  const family = "👨‍👩‍👧‍👦";
  const faces = speechChunks(family.repeat(3), family.length + 3);
  assert.deepEqual(faces, [family, family, family]);
  const flags = speechChunks("🇪🇸🇫🇷🇩🇪🇮🇹", 6);
  assert.deepEqual(flags, ["🇪🇸", "🇫🇷", "🇩🇪", "🇮🇹"]);
  const accents = speechChunks("e\u0301".repeat(9), 5);
  assert.ok(accents.every((chunk) => chunk.length % 2 === 0));
  assert.equal(accents.join(""), "e\u0301".repeat(9));
  // A character longer than the limit is kept whole rather than cut.
  assert.deepEqual(speechChunks(family, 3), [family]);
  // One long word among short ones: it is the only thing cut, and at a boundary of its own.
  const dashed = speechChunks("see state-of-the-art-and-then-some-more-words now", 12);
  assert.ok(dashed.every((chunk) => chunk.length <= 12));
  assert.equal(dashed.join(""), "seestate-of-the-art-and-then-some-more-wordsnow");
});

test("the browser's voice for a language: the same tag, then the same language", () => {
  const voices = [{ lang: "en-US", name: "a" }, { lang: "es_MX", name: "b" }, { lang: "es-ES", name: "c" }, { lang: "ar-EG", name: "d" }];
  assert.equal(matchVoice(voices, "es-ES")?.name, "c");
  assert.equal(matchVoice(voices, "es-MX")?.name, "b");
  assert.equal(matchVoice(voices, "es")?.name, "b");
  assert.equal(matchVoice(voices, "AR")?.name, "d");
  assert.equal(matchVoice(voices, "en-GB")?.name, "a");
  assert.equal(matchVoice(voices, "fr"), undefined);
  assert.equal(matchVoice(voices, undefined), undefined);
  assert.equal(matchVoice([], "en"), undefined);
});

test("the reader renders on the server as silent", () => {
  function Probe() {
    const speech = useSpeech({ lang: "en" });
    return <output>{[String(speech.speaking), String(speech.loading), String(speech.currentId)].join(" ")}</output>;
  }
  assert.equal(renderToStaticMarkup(<Probe />), "<output>false false null</output>");
});

test("no address is written into the sound modules: the host passes its loaders", () => {
  for (const file of ["sound-bus.ts", "clip-logic.ts", "clip-player.tsx", "recorder-logic.ts", "recorder.tsx", "speech-text.ts", "speech.ts"]) {
    const source = read(`ui/src/${file}`);
    assert.doesNotMatch(source, /\bfetch\(|XMLHttpRequest|["'`]\/api\/|https?:\/\//, file);
  }
  // The pure halves carry no directive, so a server component can call them.
  for (const file of ["sound-bus.ts", "clip-logic.ts", "recorder-logic.ts", "speech-text.ts"]) assert.doesNotMatch(read(`ui/src/${file}`), /^"use client"/, file);
  for (const file of ["clip-player.tsx", "recorder.tsx", "speech.ts"]) assert.match(read(`ui/src/${file}`), /^"use client";/, file);
});

// ---------------------------------------------------------------- styles

test("the sound styles are one block of the components layer", () => {
  const start = styles.lastIndexOf("@layer components {", blockAt);
  assert.match(styles.slice(start, start + 60), /@layer components \{\s*\/\* 0\.12: sound \*\//);
  assert.equal(styles.indexOf("/* 0.12: sound */"), styles.lastIndexOf("/* 0.12: sound */"));
});

test("an empty note and an empty status leave the flow but stay in the page, so their sentence is announced when it comes", () => {
  assert.match(rule(".fui-clip-note:empty {"), /position: absolute;/);
  assert.match(rule(".fui-recorder-status:empty {"), /position: absolute;/);
  assert.doesNotMatch(block, /:empty \{[^}]*display: none/);
  assert.match(rule(".fui-clip-note {"), /color: var\(--muted-foreground\);[^}]*font-size: var\(--fui-text-xs\);/);
});

test("a failure is the danger ink with its words; the clock is the label voice and reads left to right", () => {
  assert.match(rule('.fui-recorder-status[data-tone="problem"] {'), /color: var\(--fui-danger-ink\);/);
  const clock = rule(".fui-recorder-clock {");
  assert.match(clock, /font-family: var\(--fui-font-label\);/);
  assert.match(clock, /font-size: var\(--fui-text-label\);/);
  assert.match(clock, /font-variant-numeric: tabular-nums;/);
  assert.match(clock, /unicode-bidi: isolate;/);
});

test("the level fills from the inline start by the measured loudness", () => {
  const fill = rule(".fui-recorder-meter-fill {");
  assert.match(fill, /inline-size: calc\(var\(--fui-recorder-level, 0\) \* 100%\);/);
  assert.match(fill, /transition: inline-size var\(--fui-duration-fast\) linear;/);
  assert.match(rule(".fui-recorder-meter {"), /border-radius: var\(--fui-radius-full\);[^}]*background: var\(--muted\);/);
  assert.match(rule(".fui-recorder-actions {"), /flex-wrap: wrap;/);
  assert.match(rule(".fui-recorder-action {"), /display: contents;/);
});

test("under a finger every key is 44 px, and the retry word gets a 44 px target without growing its line", () => {
  const coarse = block.slice(block.indexOf("@media (pointer: coarse)"), block.indexOf("@media (forced-colors: active)"));
  assert.match(coarse, /\.fui-clip-button\.fui-button,\s*\.fui-speed-toggle\.fui-button,\s*\.fui-recorder-actions \.fui-button \{\s*min-block-size: 2\.75rem;/);
  assert.match(coarse, /\.fui-clip-button\[data-icon-only\]\.fui-button \{\s*min-inline-size: 2\.75rem;/);
  assert.match(rule(".fui-clip-note-retry::after {", coarse), /inset-block: calc\(\(100% - 2\.75rem\) \/ 2\);/);
  assert.match(rule(".fui-clip-note-retry {"), /position: relative;/);
  assert.match(rule(".fui-clip-note-retry:focus-visible {"), /outline: 2px solid var\(--fui-focus\);/);
});

test("forced colors: a playing clip and the slow speed carry a Highlight bar, the dot and the level are Highlight", () => {
  const forced = block.slice(block.indexOf("@media (forced-colors: active)"));
  assert.match(forced, /\.fui-clip-button\[aria-pressed="true"\],\s*\.fui-speed-toggle\.fui-button\[aria-pressed="true"\] \{\s*border-color: Highlight;/);
  assert.match(forced, /\.fui-clip-button\[aria-pressed="true"\]::after,\s*\.fui-speed-toggle\.fui-button\[aria-pressed="true"\]::after \{[^}]*block-size: 3px;\s*background: Highlight;/);
  assert.match(forced, /\.fui-recorder-dot,\s*\.fui-recorder-meter-fill \{\s*background: Highlight;/);
  assert.match(rule(".fui-recorder-meter {", forced), /outline: 1px solid CanvasText;/);
});

test("the block is logical, tokens only, and its hover is for pointers that hover", () => {
  const css = block.replace(/\/\*[\s\S]*?\*\//g, "");
  assert.doesNotMatch(css, /\b(?:margin|padding|border|inset)-(?:left|right|top|bottom)\b|(?:^|[\s;{])(?:left|right|top|bottom|width|height|min-width|min-height|max-width|max-height)\s*:/m);
  assert.doesNotMatch(css, /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch)\(/);
  assert.doesNotMatch(css, /\banimation\b/);
  assert.match(css, /@media \(hover: hover\) \{\s*\.fui-clip-note-retry:hover \{/);
  assert.equal([...css.matchAll(/:hover/g)].length, 1);
});
