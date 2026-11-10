import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  AudioPlayer,
  Button,
  ClipButton,
  ClipError,
  ClipNote,
  clipRetryable,
  RecorderPanel,
  RecorderPanelView,
  SpeedToggle,
  useClipPlayer,
  useRecorder,
  useSpeech,
  type ClipFailureKind,
  type ClipLoader,
  type ClipPhase,
  type ClipPlayer,
  type ClipSpeed,
  type RecorderLabels,
  type RecorderPanelViewProps,
  type SpeechClipLoader,
} from "@fabrials/ui";
import { Block, Frame, Page } from "./story-frame";
import { fakeMicrophone, toneDataUri, toneWav } from "./sound-fixtures";

const meta = {
  title: "Tests/Sound",
  parameters: { layout: "fullscreen" },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

// A player frozen in one state, so each look of a clip's button is on screen at first paint with no sound and no clock.
function fixedPlayer(fixed: { phase?: ClipPhase; played?: boolean; failure?: ClipFailureKind; speed?: ClipSpeed } = {}): ClipPlayer {
  return {
    state: () => fixed.phase ?? "idle",
    played: () => fixed.played ?? false,
    failure: () => (fixed.failure ? { kind: fixed.failure, retryable: clipRetryable(fixed.failure) } : null),
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

const TAKE = toneDataUri(330, 1);
const row = { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "var(--fui-space-2)" } as const;
const stack = { display: "grid", gap: "var(--fui-space-2)", justifyItems: "start" } as const;
const typeInstead = <Button variant="ghost">Type instead</Button>;

function Status({ title, ...props }: RecorderPanelViewProps & { title: string }) {
  return (
    <Frame width={358}>
      <div style={{ display: "grid", gap: "var(--fui-space-3)" }}>
        <p style={{ margin: 0, color: "var(--muted-foreground)", fontFamily: "var(--fui-font-label)", fontSize: "var(--fui-text-label)" }}>{title}</p>
        <RecorderPanelView aria-label={`Recorder, ${title}`} fallback={typeInstead} maxDurationMs={40_000} onSubmit={() => {}} {...props} />
      </div>
    </Frame>
  );
}

const ARABIC: Partial<RecorderLabels> = {
  region: "المسجّل",
  record: "سجّل",
  stop: "إيقاف",
  again: "سجّل من جديد",
  retry: "جرّب الميكروفون مرة أخرى",
  submit: "استخدم هذا التسجيل",
  playback: "تسجيلك",
  recording: "جارٍ التسجيل.",
  recorded: (duration) => `سُجّل ${duration}. استمع قبل أن تستخدمه.`,
  limit: (limit) => `حتى ${limit}.`,
  denied: "الميكروفون محجوب. اسمح به من إعدادات الموقع في المتصفح ثم حاول مرة أخرى.",
};

function Bench() {
  return (
    <Page
      title="Sound"
      description="A clip's button in each state with the line that says why one did not play, the speed switch, and the recorder in every status it can be in. Fixed states: nothing here plays or listens."
    >
      <Block title="A clip's button" description="A speaker, a spinner while the clip loads, a square while it plays, and other words once it was heard. Three sizes, and the icon alone with a name in another language.">
        <Frame>
          <div style={stack}>
            <div style={row}>
              <ClipButton clip="idle" player={fixedPlayer()} />
              <ClipButton clip="loading" player={fixedPlayer({ phase: "loading" })} />
              <ClipButton clip="playing" player={fixedPlayer({ phase: "playing" })} />
              <ClipButton clip="played" player={fixedPlayer({ played: true })} />
              <ClipButton clip="primary" label="Hear the sentence" player={fixedPlayer()} variant="default" />
            </div>
            <div style={row}>
              <ClipButton clip="sm" player={fixedPlayer()} size="sm" />
              <ClipButton clip="default" player={fixedPlayer()} />
              <ClipButton clip="lg" player={fixedPlayer()} size="lg" />
              <ClipButton clip="icon-sm" iconOnly label="Listen to line 1" player={fixedPlayer()} size="sm" />
              <ClipButton clip="icon" iconOnly label="Listen to line 2" player={fixedPlayer({ phase: "loading" })} />
              <ClipButton clip="icon-lg" iconOnly label="Listen to line 3" player={fixedPlayer({ phase: "playing" })} size="lg" />
              <ClipButton
                clip="foreign"
                iconOnly
                labelContent={
                  <>
                    Listen to{" "}
                    <bdi dir="rtl" lang="ar">
                      مرحبا
                    </bdi>
                  </>
                }
                player={fixedPlayer()}
              />
              <span dir="rtl" lang="ar" style={{ fontSize: "var(--fui-text-lg)" }}>
                مرحبا
              </span>
            </div>
          </div>
        </Frame>
      </Block>

      <Block title="A clip that did not play" description="The line says what happened. It offers the clip again only when asking again can help: not when there is no voice, and not when the allowance is spent.">
        <div className="catalogue-grid">
          {(["rateLimited", "offline", "failed", "unavailable", "quota"] as const).map((kind) => (
            <Frame key={kind}>
              <div style={stack}>
                <ClipButton clip={kind} player={fixedPlayer({ failure: kind })} />
                <ClipNote clip={kind} player={fixedPlayer({ failure: kind })} />
              </div>
            </Frame>
          ))}
        </div>
      </Block>

      <Block title="Speed" description="One key, pressed while the slow rendering is on, or a segment for each speed.">
        <Frame>
          <div style={row}>
            <SpeedToggle player={fixedPlayer()} />
            <SpeedToggle player={fixedPlayer({ speed: "slow" })} />
            <SpeedToggle player={fixedPlayer()} variant="segmented" />
            <SpeedToggle aria-label="Speed, slow chosen" player={fixedPlayer({ speed: "slow" })} variant="segmented" />
          </div>
        </Frame>
      </Block>

      <Block title="The recorder, in every status" description="One line says where things are; the keys are those of the step the speaker is on, and another way to answer is always beside them.">
        <div className="catalogue-grid">
          <Status status="idle" title="Idle" />
          <Status status="requesting" title="Asking for the microphone" />
          <Status elapsedMs={7_400} level={0.6} status="recording" title="Recording" />
          <Status durationMs={7_400} status="recorded" takeUrl={TAKE} title="Recorded" />
          <Status autoStopped durationMs={40_000} status="recorded" takeUrl={TAKE} title="Stopped at the limit" />
          <Status durationMs={7_400} pending status="recorded" takeUrl={TAKE} title="Working on the take" />
          <Status durationMs={7_400} pending slow status="recorded" takeUrl={TAKE} title="Still working" />
          <Status status="idle" title="Too short" tooShort />
          <Status status="denied" title="Denied" />
          <Status status="no-microphone" title="No microphone" />
          <Status status="busy" title="Busy" />
          <Status status="error" title="Error" />
          <Status status="unsupported" title="Unsupported" />
        </div>
      </Block>

      <Block title="Right to left" description="The keys and the lines turn with the page; the clock keeps reading minutes then seconds, in the reader's digits.">
        <div className="catalogue-grid">
          <Frame dir="rtl" width={358}>
            <div lang="ar" style={stack}>
              <div style={row}>
                <ClipButton clip="ar-idle" labels={{ listen: "استمع", listenAgain: "استمع مرة أخرى" }} player={fixedPlayer()} />
                <ClipButton clip="ar-playing" labels={{ listen: "استمع", listenAgain: "استمع مرة أخرى" }} player={fixedPlayer({ phase: "playing", played: true })} />
                <SpeedToggle labels={{ slow: "ببطء" }} player={fixedPlayer({ speed: "slow" })} />
              </div>
              <ClipNote labels={{ failed: "تعذّر تشغيل الصوت.", retry: "حاول مرة أخرى" }} player={fixedPlayer({ failure: "failed" })} />
            </div>
          </Frame>
          <Frame dir="rtl" width={358}>
            <div lang="ar">
              <RecorderPanelView elapsedMs={7_400} fallback={<Button variant="ghost">اكتب بدلاً من ذلك</Button>} labels={ARABIC} level={0.45} locale="ar-EG" maxDurationMs={40_000} status="recording" />
            </div>
          </Frame>
          <Frame dir="rtl" width={358}>
            <div lang="ar">
              <RecorderPanelView fallback={<Button variant="ghost">اكتب بدلاً من ذلك</Button>} labels={ARABIC} locale="ar-EG" maxDurationMs={40_000} status="denied" />
            </div>
          </Frame>
        </div>
      </Block>
    </Page>
  );
}

// What the behaviour tests steer: every load is written down, and a load named "held" waits until the test lets it go.
type SoundBench = { calls: string[]; speech: string[]; held: Map<string, () => void>; holdSpeech: boolean; release: (name: string) => void };
declare global {
  interface Window {
    __soundBench?: SoundBench;
    /** Set by a test that has replaced `navigator.mediaDevices.getUserMedia`: the recorder then asks the page for its stream. */
    __soundBenchRealMicrophone?: boolean;
  }
}
function bench(): SoundBench {
  if (!window.__soundBench) {
    const held = new Map<string, () => void>();
    window.__soundBench = {
      calls: [],
      speech: [],
      held,
      holdSpeech: false,
      release: (name) => {
        held.get(name)?.();
        held.delete(name);
      },
    };
  }
  return window.__soundBench;
}

const loadClip: ClipLoader = async (ref, { speed }) => {
  const log = bench();
  log.calls.push(`${ref}@${speed}`);
  if (ref === "held") await new Promise<void>((resolve) => log.held.set("held", resolve));
  if (ref === "quota") throw new ClipError("quota");
  // Fails the first time it is asked for, so the retry has something to mend.
  if (ref === "flaky" && log.calls.filter((call) => call.startsWith("flaky@")).length === 1) throw new ClipError("failed");
  return toneWav(speed === "slow" ? 330 : 440, ref === "short" ? 1.5 : 4);
};

const readClip: SpeechClipLoader = async (text, { signal }) => {
  const log = bench();
  log.speech.push(text);
  if (log.holdSpeech)
    await new Promise<void>((resolve, reject) => {
      log.held.set("speech", resolve);
      signal.addEventListener("abort", () => reject(new DOMException("Stopped.", "AbortError")));
    });
  return toneWav(520, 4);
};

function LiveClips() {
  const player = useClipPlayer({ load: loadClip });
  const [tone] = useState(() => URL.createObjectURL(toneWav(262, 4)));
  return (
    <div style={{ display: "grid", gap: "var(--fui-space-3)" }}>
      <div style={row}>
        <ClipButton clip="long" label="Long clip" player={player} />
        <ClipButton clip="short" label="Short clip" player={player} />
        <ClipButton clip="changing" id="changing-clip" player={player} />
        <ClipButton clip="held" label="Held clip" player={player} />
        <ClipButton clip="flaky" label="Flaky clip" player={player} />
        <ClipButton clip="quota" label="Spent clip" player={player} />
        <SpeedToggle player={player} />
      </div>
      <ClipNote player={player} />
      <AudioPlayer label="Tone" src={tone} />
    </div>
  );
}

function LiveRecorder({ limit, name }: { limit: number; name: string }) {
  // A test that replaces `navigator.mediaDevices` asks for it; everywhere else the stream is an oscillator, never a microphone.
  const [stubbed] = useState(() => typeof window !== "undefined" && window.__soundBenchRealMicrophone === true);
  const recorder = useRecorder(stubbed ? { maxDurationMs: limit } : { maxDurationMs: limit, getStream: fakeMicrophone });
  const [sent, setSent] = useState("");
  const [typing, setTyping] = useState(false);
  return (
    <div style={{ display: "grid", gap: "var(--fui-space-3)" }}>
      <RecorderPanel
        aria-label={name}
        fallback={
          <Button onClick={() => setTyping(true)} variant="ghost">
            Type instead
          </Button>
        }
        onSubmit={(blob) => setSent(`Handed over ${blob.type.split(";")[0]}, ${blob.size > 0 ? "not empty" : "empty"}.`)}
        recorder={recorder}
      />
      <p data-slot="handed" style={{ margin: 0, fontSize: "var(--fui-text-xs)", color: "var(--muted-foreground)" }}>
        {typing ? "Typing instead." : sent || "Nothing has left the recorder."}
      </p>
    </div>
  );
}

function LiveSpeech() {
  const first = useSpeech({ loadClip: readClip, fallback: "none", lang: "en" });
  const second = useSpeech({ loadClip: readClip, fallback: "none", lang: "en" });
  // Read once only, by a test that holds the load: its text is never in the cache.
  const third = useSpeech({ loadClip: readClip, fallback: "none", lang: "en" });
  return (
    <div style={row}>
      <Button aria-pressed={first.speaking} data-loading-clip={first.loading || undefined} onClick={() => void first.speak("The harbour opens at nine. Bring the list.", { id: "first" })} variant="outline">
        Read the first answer
      </Button>
      <Button aria-pressed={second.speaking} data-loading-clip={second.loading || undefined} onClick={() => void second.speak("The orchard is on the north side.", { id: "second" })} variant="outline">
        Read the second answer
      </Button>
      <Button aria-pressed={third.speaking} onClick={() => void third.speak("The quarry is closed until spring.", { id: "third" })} variant="outline">
        Read a new answer
      </Button>
      <Button
        onClick={() => {
          first.stop();
          second.stop();
          third.stop();
        }}
        variant="ghost"
      >
        Stop reading
      </Button>
      <output data-slot="reading" style={{ fontSize: "var(--fui-text-xs)", color: "var(--muted-foreground)" }}>
        {first.currentId ?? second.currentId ?? third.currentId ?? "nothing"}
      </output>
    </div>
  );
}

function LivePage() {
  return (
    <Page title="Sound, live" description="The same pieces at work on synthetic tones: clips a loader hands over, a recorder fed by an oscillator, and two readers. One sound at a time.">
      <Block title="Clips and a player" description="Starting any of them stops the one that was sounding.">
        <Frame width={720}>
          <LiveClips />
        </Frame>
      </Block>
      <Block title="A recorder on an oscillator" description="Record, stop, listen back, then hand the take over or record again. Nothing is uploaded: the take is a Blob in the page.">
        <div className="catalogue-grid">
          <Frame width={420}>
            <LiveRecorder limit={20_000} name="Spoken answer" />
          </Frame>
          <Frame width={420}>
            <LiveRecorder limit={1_500} name="Short answer" />
          </Frame>
        </div>
      </Block>
      <Block title="Two readers" description="Each has its own hook; the second to start stops the first.">
        <Frame width={720}>
          <LiveSpeech />
        </Frame>
      </Block>
    </Page>
  );
}

export const Pieces: Story = { render: () => <Bench /> };
export const Live: Story = { render: () => <LivePage /> };
