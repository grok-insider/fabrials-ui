"use client";

import { useEffect, useState } from "react";
import { Button, ClipButton, ClipError, ClipNote, RecorderPanel, RecorderPanelView, SpeedToggle, Textarea, useClipPlayer, useRecorder, type ClipLoader } from "@fabrials/ui";
import type { ExampleSet } from "./types";

// Synthetic sound: tones built in the page, so nothing is a person's voice, nothing comes from the network and no
// microphone is asked for.
function toneWav(frequency = 440, seconds = 1, sampleRate = 8000): Blob {
  const count = Math.round(seconds * sampleRate);
  const buffer = new ArrayBuffer(44 + count * 2);
  const view = new DataView(buffer);
  const write = (offset: number, text: string) => {
    for (let at = 0; at < text.length; at += 1) view.setUint8(offset + at, text.charCodeAt(at));
  };
  write(0, "RIFF");
  view.setUint32(4, 36 + count * 2, true);
  write(8, "WAVE");
  write(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  write(36, "data");
  view.setUint32(40, count * 2, true);
  const fade = Math.min(count / 2, sampleRate * 0.02);
  for (let at = 0; at < count; at += 1) {
    const envelope = Math.min(1, at / fade, (count - 1 - at) / fade);
    view.setInt16(44 + at * 2, Math.round(Math.sin((2 * Math.PI * frequency * at) / sampleRate) * 0.2 * envelope * 32767), true);
  }
  return new Blob([buffer], { type: "audio/wav" });
}

/** The same tone as a data URI: a source that needs no object URL, for a state shown at first paint. */
function toneDataUri(frequency = 440, seconds = 1, sampleRate = 4000): string {
  const count = Math.round(seconds * sampleRate);
  const bytes = new Uint8Array(44 + count);
  const view = new DataView(bytes.buffer);
  const write = (offset: number, text: string) => {
    for (let at = 0; at < text.length; at += 1) bytes[offset + at] = text.charCodeAt(at);
  };
  write(0, "RIFF");
  view.setUint32(4, 36 + count, true);
  write(8, "WAVE");
  write(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate, true);
  view.setUint16(32, 1, true);
  view.setUint16(34, 8, true);
  write(36, "data");
  view.setUint32(40, count, true);
  for (let at = 0; at < count; at += 1) bytes[44 + at] = 128 + Math.round(Math.sin((2 * Math.PI * frequency * at) / sampleRate) * 24);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return `data:audio/wav;base64,${btoa(binary)}`;
}

/** A stream that stands in for the microphone: an oscillator, which makes no sound on the speakers. */
async function fakeMicrophone(): Promise<MediaStream> {
  const context = new AudioContext();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const destination = context.createMediaStreamDestination();
  oscillator.frequency.value = 330;
  gain.gain.value = 0.2;
  oscillator.connect(gain).connect(destination);
  oscillator.start();
  await context.resume().catch(() => undefined);
  for (const track of destination.stream.getAudioTracks()) {
    const stop = track.stop.bind(track);
    track.stop = () => {
      stop();
      void context.close().catch(() => undefined);
    };
  }
  return destination.stream;
}

const WORDS = ["harbour", "orchard", "quarry"] as const;

const tones: ClipLoader = async (ref, { speed }) => {
  if (ref === "missing") throw new ClipError("unavailable");
  if (ref === "busy") throw new ClipError("rateLimited");
  const step = Math.max(0, WORDS.indexOf(ref as (typeof WORDS)[number]));
  return toneWav((speed === "slow" ? 220 : 330) + step * 55, speed === "slow" ? 1.4 : 0.9);
};

function WordList() {
  const player = useClipPlayer({ load: tones });
  return (
    <div style={{ display: "grid", gap: "var(--fui-space-3)", inlineSize: "100%", maxInlineSize: "22rem" }}>
      <ul style={{ display: "grid", gap: "var(--fui-space-2)", margin: 0, listStyle: "none", padding: 0 }}>
        {WORDS.map((word) => (
          <li key={word} style={{ alignItems: "center", display: "flex", gap: "var(--fui-space-3)", justifyContent: "space-between" }}>
            <span>{word}</span>
            <ClipButton clip={word} iconOnly label={`Listen to ${word}`} player={player} size="sm" />
          </li>
        ))}
      </ul>
      <div style={{ alignItems: "center", display: "flex", gap: "var(--fui-space-2)" }}>
        <ClipButton clip="harbour" label="Hear the first word" player={player} />
        <SpeedToggle player={player} />
      </div>
      <ClipNote player={player} />
    </div>
  );
}

function Failures() {
  const player = useClipPlayer({ load: tones });
  return (
    <div style={{ display: "grid", gap: "var(--fui-space-2)", justifyItems: "start" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--fui-space-2)" }}>
        <ClipButton clip="busy" label="A clip to ask for again" player={player} />
        <ClipButton clip="missing" label="A clip with no voice" player={player} />
      </div>
      <ClipNote player={player} />
    </div>
  );
}

export const clipButtonExamples: ExampleSet = {
  preview: () => <WordList />,
  previewCode: `import {
  ClipButton,
  ClipNote,
  SpeedToggle,
  useClipPlayer,
  type ClipLoader,
} from "@fabrials/ui";

export function Words({
  words,
  loadClip,
}: {
  words: string[];
  loadClip: ClipLoader;
}) {
  const player = useClipPlayer({ load: loadClip });
  return (
    <>
      <ClipButton
        clip={words[0]}
        label={\`Listen to \${words[0]}\`}
        player={player}
      />
      <SpeedToggle player={player} />
      <ClipNote player={player} />
    </>
  );
}`,
  examples: [
    {
      id: "alone",
      title: "One clip on its own",
      description: "Without a `player` the button plays through its own, from `load`. Its words become \"Listen again\" once the clip was heard.",
      code: `<ClipButton clip="harbour" load={loadClip} />`,
      render: () => <ClipButton clip="harbour" load={tones} />,
    },
    {
      id: "failures",
      title: "A clip that does not play",
      description:
        "The loader throws a `ClipError` to say why. `ClipNote` says it in words and offers the clip again only when that can help: here after too many requests, and not when there is no voice.",
      code: `const player = useClipPlayer({
  load: async (ref) => {
    if (ref === "busy") throw new ClipError("rateLimited");
    throw new ClipError("unavailable");
  },
});

<ClipButton clip="busy" label="A clip to ask for again" player={player} />
<ClipButton clip="missing" label="A clip with no voice" player={player} />
<ClipNote player={player} />`,
      render: () => <Failures />,
      align: "start",
    },
    {
      id: "foreign",
      title: "Named in another language",
      description: "`labelContent` is the name as markup, so a word in another language keeps its `lang` and `dir`; on an icon-only button it is read but not shown.",
      code: `<ClipButton
  clip="marhaba"
  iconOnly
  labelContent={
    <>
      Listen to <bdi dir="rtl" lang="ar">مرحبا</bdi>
    </>
  }
  load={loadClip}
/>`,
      render: () => (
        <ClipButton
          clip="harbour"
          iconOnly
          labelContent={
            <>
              Listen to{" "}
              <bdi dir="rtl" lang="ar">
                مرحبا
              </bdi>
            </>
          }
          load={tones}
        />
      ),
    },
  ],
};

// The stream is an oscillator, so the page records a tone and never asks for a microphone.
function SpokenAnswer() {
  const recorder = useRecorder({ getStream: fakeMicrophone, maxDurationMs: 20_000 });
  const [pending, setPending] = useState(false);
  const [heard, setHeard] = useState<string | null>(null);
  const [typing, setTyping] = useState(false);
  if (typing)
    return (
      <div style={{ display: "grid", gap: "var(--fui-space-2)", inlineSize: "100%", maxInlineSize: "26rem", justifyItems: "start" }}>
        <Textarea aria-label="Your answer" placeholder="Type your answer" rows={3} />
        <Button onClick={() => setTyping(false)} variant="ghost">
          Use the microphone
        </Button>
      </div>
    );
  return (
    <div style={{ display: "grid", gap: "var(--fui-space-3)", inlineSize: "100%", maxInlineSize: "26rem" }}>
      <RecorderPanel
        action={heard ? null : undefined}
        fallback={
          <Button
            onClick={() => {
              recorder.reset();
              setTyping(true);
            }}
            variant="ghost"
          >
            Type instead
          </Button>
        }
        onAgain={() => setHeard(null)}
        onSubmit={(blob) => {
          setPending(true);
          setTimeout(() => {
            setPending(false);
            setHeard(`A take of ${Math.max(1, Math.round(blob.size / 1024))} KB reached the host.`);
          }, 1200);
        }}
        pending={pending}
        recorder={recorder}
        submitLabel="Transcribe"
      />
      {heard ? <p style={{ margin: 0, fontSize: "var(--fui-text-sm)" }}>{heard}</p> : null}
    </div>
  );
}

function SlowTake() {
  const [take, setTake] = useState<string | null>(null);
  useEffect(() => setTake(toneDataUri(330, 1)), []);
  return (
    <div style={{ inlineSize: "100%", maxInlineSize: "26rem" }}>
      <RecorderPanelView durationMs={7_400} onSubmit={() => {}} pending slow status="recorded" submitLabel="Transcribe" takeUrl={take} />
    </div>
  );
}

export const recorderPanelExamples: ExampleSet = {
  preview: () => <SpokenAnswer />,
  previewCode: `import { useState } from "react";
import { Button, RecorderPanel, useRecorder } from "@fabrials/ui";

export function SpokenAnswer({
  transcribe,
  typeInstead,
}: {
  transcribe: (blob: Blob) => Promise<string>;
  typeInstead: () => void;
}) {
  const recorder = useRecorder({ maxDurationMs: 40_000 });
  const [pending, setPending] = useState(false);
  const [text, setText] = useState("");
  return (
    <RecorderPanel
      recorder={recorder}
      submitLabel="Transcribe"
      pending={pending}
      onSubmit={async (blob) => {
        setPending(true);
        setText(await transcribe(blob));
        setPending(false);
      }}
      fallback={
        <Button variant="ghost" onClick={typeInstead}>
          Type instead
        </Button>
      }
    />
  );
}`,
  examples: [
    {
      id: "failures",
      title: "When the microphone gives nothing",
      description:
        "Blocked, missing, held by another app or not there at all: each status has its own sentence and a key to try again, and the `fallback` stays beside it. `RecorderPanelView` draws a status it is given, which is how these are shown without a microphone.",
      code: `<RecorderPanelView status="denied" fallback={<Button variant="ghost">Type instead</Button>} />
<RecorderPanelView status="no-microphone" fallback={<Button variant="ghost">Type instead</Button>} />
<RecorderPanelView status="unsupported" fallback={<Button variant="ghost">Type instead</Button>} />`,
      render: () => (
        <div style={{ display: "grid", gap: "var(--fui-space-5)", inlineSize: "100%", maxInlineSize: "26rem" }}>
          <RecorderPanelView aria-label="Recorder, blocked" fallback={<Button variant="ghost">Type instead</Button>} status="denied" />
          <RecorderPanelView aria-label="Recorder, no microphone" fallback={<Button variant="ghost">Type instead</Button>} status="no-microphone" />
          <RecorderPanelView aria-label="Recorder, unsupported" fallback={<Button variant="ghost">Type instead</Button>} status="unsupported" />
        </div>
      ),
      align: "start",
    },
    {
      id: "slow",
      title: "A take the host is working on",
      description: "`pending` makes the primary key busy and holds the take; after `slowAfterMs` (8 seconds) the status says the work is still going.",
      code: `<RecorderPanel recorder={recorder} pending={pending} slowAfterMs={8000} onSubmit={send} submitLabel="Transcribe" />`,
      render: () => <SlowTake />,
      align: "start",
    },
  ],
};
