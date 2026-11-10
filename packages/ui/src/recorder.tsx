"use client";
// Origin: Fabrials, 0.12, from Radiant's speaking screen (a take the speaker hears before anything leaves the device, every
// way the microphone can fail named) and the level meter of VoiceInputButton.

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentProps,
  type CSSProperties,
  type ReactNode,
  type Ref,
  type RefObject,
  type SyntheticEvent,
} from "react";
import { Mic, Square } from "lucide-react";
import { Button } from "./controls";
import { AudioPlayer } from "./media-player";
import {
  canRecord,
  canStartRecording,
  classifyMicError,
  DEFAULT_MAX_RECORDING_MS,
  DEFAULT_MIN_RECORDING_MS,
  formatRecordingClock,
  initialRecorderState,
  isTake,
  pickRecordingMimeType,
  RECORDER_MIME_TYPES,
  recorderReducer,
  soundLevel,
  type MicFailure,
  type RecorderEvent,
  type RecorderState,
  type RecorderStatus,
  type RecorderTake,
} from "./recorder-logic";
import { useLocale } from "./labels";
import { classes } from "./shared";
import { claimSound, releaseSound } from "./sound-bus";

/** Why the microphone gave nothing: which status it led to, whether it happened on the way in or mid-take, and what the browser threw. */
export type RecorderFailure = { status: MicFailure; during: "start" | "recording"; cause: unknown };

export type UseRecorderOptions = {
  /** The recorder stops itself here. */
  maxDurationMs?: number;
  /** A shorter take is a mis-tap: it is dropped and `tooShort` says so. */
  minDurationMs?: number;
  /** The containers to ask the browser for, in order. */
  mimeTypes?: readonly string[];
  /** What is asked of the microphone. `true` asks for any. */
  constraints?: MediaTrackConstraints | boolean;
  /** A stream of the host's own instead of the microphone (a test, another source). The recorder stops its tracks when the take ends. */
  getStream?: () => Promise<MediaStream>;
  /** Measure the loudness while recording (an `AudioContext` on the stream). */
  level?: boolean;
  onLevel?: (level: number) => void;
  onError?: (failure: RecorderFailure) => void;
};

export type Recorder = {
  status: RecorderStatus;
  elapsedMs: number;
  /** The loudness now, 0 to 1. */
  level: number;
  /** The take, once there is one. It stays on the device: the host decides what leaves it. */
  blob: Blob | null;
  /** An object URL of the take, to listen back. Revoked when the take is dropped. */
  url: string | null;
  durationMs: number;
  tooShort: boolean;
  autoStopped: boolean;
  failure: RecorderFailure | null;
  start: () => Promise<void>;
  stop: () => void;
  /** Back to the start: the take and the notes about it go. A browser that cannot record stays `unsupported`. */
  reset: () => void;
  /** Whether this browser can record. `false` on the server and until the page has hydrated. */
  supported: boolean;
  maxDurationMs: number;
};

const DEFAULT_CONSTRAINTS: MediaTrackConstraints = { echoCancellation: true, noiseSuppression: true };
const noSubscription = () => () => {};
const notKnownYet = () => null;

function stopTracks(stream: MediaStream | null) {
  for (const track of stream?.getTracks() ?? []) track.stop();
}

/**
 * Records one take at a time and names every way it can go wrong. The take stays on the device with a URL to listen back;
 * nothing is sent anywhere. It stops itself at the limit, lets go of the microphone the moment recording ends or the
 * screen goes away, revokes the URL it made, and holds the page's sound while it listens, so no clip is recorded with it.
 */
export function useRecorder({
  maxDurationMs = DEFAULT_MAX_RECORDING_MS,
  minDurationMs = DEFAULT_MIN_RECORDING_MS,
  mimeTypes = RECORDER_MIME_TYPES,
  constraints = DEFAULT_CONSTRAINTS,
  getStream,
  level: measure = true,
  onLevel,
  onError,
}: UseRecorderOptions = {}): Recorder {
  const ownStream = getStream !== undefined;
  // Known only in the browser: the server and the hydrating render say neither "can" nor "cannot", so nothing flashes.
  const support = useSyncExternalStore<boolean | null>(
    noSubscription,
    () => canRecord({ mediaDevices: navigator.mediaDevices, MediaRecorder: window.MediaRecorder }, ownStream),
    notKnownYet,
  );
  const [state, setState] = useState<RecorderState>(initialRecorderState);
  const live = useRef(state);
  const [level, setLevel] = useState(0);
  const [failure, setFailure] = useState<RecorderFailure | null>(null);
  const [owner] = useState(() => ({}));
  const options = { maxDurationMs, minDurationMs, mimeTypes, constraints, getStream, measure, onLevel, onError };
  const latest = useRef(options);
  useEffect(() => {
    latest.current = options;
  });

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);
  const startedAt = useRef(0);
  const tick = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const meterRef = useRef<{ context?: AudioContext; frame?: number }>({});
  const urlRef = useRef<string | null>(null);
  const alive = useRef(true);
  const attempt = useRef(0);

  const send = useCallback((event: RecorderEvent) => {
    const next = recorderReducer(live.current, event);
    if (next !== live.current) {
      live.current = next;
      setState(next);
    }
  }, []);

  const revokeUrl = useCallback(() => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = null;
  }, []);

  const teardown = useCallback(() => {
    clearInterval(tick.current);
    tick.current = undefined;
    if (meterRef.current.frame !== undefined) cancelAnimationFrame(meterRef.current.frame);
    void meterRef.current.context?.close().catch(() => undefined);
    meterRef.current = {};
    stopTracks(streamRef.current);
    streamRef.current = null;
    recorderRef.current = null;
    releaseSound(owner);
    if (alive.current) setLevel(0);
  }, [owner]);

  const fail = useCallback(
    (status: MicFailure, during: RecorderFailure["during"], cause: unknown) => {
      const problem: RecorderFailure = { status, during, cause };
      releaseSound(owner);
      setFailure(problem);
      send({ type: "failed", status });
      latest.current.onError?.(problem);
    },
    [owner, send],
  );

  // Drops whatever is being recorded without a take: its handlers go first, so a stop that lands late cannot touch the next recording.
  const abandon = useCallback(() => {
    attempt.current += 1;
    const recorder = recorderRef.current;
    if (recorder) {
      recorder.ondataavailable = null;
      recorder.onerror = null;
      recorder.onstop = null;
      try {
        if (recorder.state !== "inactive") recorder.stop();
      } catch {
        // Already stopping.
      }
    }
    chunks.current = [];
    teardown();
  }, [teardown]);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      abandon();
      revokeUrl();
    };
  }, [abandon, revokeUrl]);

  const stop = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") return;
    try {
      recorder.stop();
    } catch (cause) {
      abandon();
      fail("error", "recording", cause);
    }
  }, [abandon, fail]);

  const meter = useCallback((stream: MediaStream) => {
    const Context = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Context) return;
    try {
      const context = new Context();
      const analyser = context.createAnalyser();
      analyser.fftSize = 256;
      context.createMediaStreamSource(stream).connect(analyser);
      const data = new Uint8Array(analyser.fftSize);
      const read = () => {
        analyser.getByteTimeDomainData(data);
        const value = soundLevel(data);
        setLevel(value);
        latest.current.onLevel?.(value);
        meterRef.current.frame = requestAnimationFrame(read);
      };
      meterRef.current = { context, frame: requestAnimationFrame(read) };
    } catch {
      setLevel(0);
    }
  }, []);

  const start = useCallback(async () => {
    if (!canStartRecording(live.current.status)) return;
    const asked = latest.current;
    if (!canRecord({ mediaDevices: navigator.mediaDevices, MediaRecorder: window.MediaRecorder }, asked.getStream !== undefined)) {
      send({ type: "failed", status: "unsupported" });
      return;
    }
    const mine = ++attempt.current;
    const current = () => alive.current && mine === attempt.current;
    revokeUrl();
    setFailure(null);
    send({ type: "request" });
    // A clip still playing from the speakers would be recorded as the speaker's own words: it stops before the microphone opens.
    claimSound(owner, stop);

    let stream: MediaStream;
    try {
      stream = asked.getStream ? await asked.getStream() : await navigator.mediaDevices.getUserMedia({ audio: asked.constraints });
    } catch (cause) {
      if (current()) fail(classifyMicError(cause), "start", cause);
      return;
    }
    // Overtaken while the browser asked (a reset, the screen gone): the microphone it opened is let go.
    if (!current()) {
      stopTracks(stream);
      return;
    }

    const mime = pickRecordingMimeType(
      typeof MediaRecorder.isTypeSupported === "function" ? (type) => MediaRecorder.isTypeSupported(type) : undefined,
      asked.mimeTypes,
    );
    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    } catch (cause) {
      stopTracks(stream);
      fail(classifyMicError(cause), "start", cause);
      return;
    }

    streamRef.current = stream;
    recorderRef.current = recorder;
    chunks.current = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.current.push(event.data);
    };
    recorder.onerror = (event) => {
      abandon();
      if (alive.current) fail("error", "recording", event);
    };
    recorder.onstop = () => {
      const durationMs = Math.round(performance.now() - startedAt.current);
      teardown();
      const parts = chunks.current;
      chunks.current = [];
      if (!alive.current) return;
      const blob = new Blob(parts, { type: recorder.mimeType || mime || "audio/webm" });
      if (!isTake(durationMs, blob.size, latest.current.minDurationMs)) {
        send({ type: "stopped", take: null });
        return;
      }
      const url = URL.createObjectURL(blob);
      urlRef.current = url;
      send({ type: "stopped", take: { blob, url, durationMs } });
    };

    try {
      recorder.start(250);
    } catch (cause) {
      abandon();
      fail("error", "start", cause);
      return;
    }
    startedAt.current = performance.now();
    send({ type: "recording" });
    // Whatever began to sound while the browser asked for the microphone stops now that it listens.
    claimSound(owner, stop);
    if (asked.measure) meter(stream);
    tick.current = setInterval(() => {
      const limit = latest.current.maxDurationMs;
      const elapsed = performance.now() - startedAt.current;
      send({ type: "tick", elapsedMs: Math.round(Math.min(elapsed, limit)) });
      if (elapsed >= limit) {
        send({ type: "limit" });
        stop();
      }
    }, 200);
  }, [abandon, fail, meter, owner, revokeUrl, send, stop, teardown]);

  const reset = useCallback(() => {
    abandon();
    revokeUrl();
    setFailure(null);
    send({ type: "reset" });
  }, [abandon, revokeUrl, send]);

  const status: RecorderStatus = support === false ? "unsupported" : state.status;
  return useMemo(
    () => ({
      status,
      elapsedMs: state.elapsedMs,
      level,
      blob: state.take?.blob ?? null,
      url: state.take?.url ?? null,
      durationMs: state.take?.durationMs ?? 0,
      tooShort: state.tooShort,
      autoStopped: state.autoStopped,
      failure,
      start,
      stop,
      reset,
      supported: support === true,
      maxDurationMs,
    }),
    [failure, level, maxDurationMs, reset, start, state, status, stop, support],
  );
}

/** True once `active` has lasted `afterMs`: the moment to say the work is still going. */
export function useSlow(active: boolean, afterMs = 8000): boolean {
  const [fired, setFired] = useState(false);
  useEffect(() => {
    if (!active) return;
    const timer = setTimeout(() => setFired(true), afterMs);
    return () => {
      clearTimeout(timer);
      setFired(false);
    };
  }, [active, afterMs]);
  return active && fired;
}

export type RecorderLabels = {
  /** The name of the group. */
  region: string;
  record: string;
  stop: string;
  again: string;
  /** The button that asks for the microphone again after a failure. */
  retry: string;
  submit: string;
  /** The name of the take's player. */
  playback: string;
  requesting: string;
  recording: string;
  recorded: (duration: string) => string;
  autoStopped: (limit: string) => string;
  tooShort: string;
  /** The line shown before the first take. */
  limit: (limit: string) => string;
  denied: string;
  noMicrophone: string;
  unsupported: string;
  busy: string;
  error: string;
  pending: string;
  slow: string;
};

const RECORDER_LABELS: RecorderLabels = {
  region: "Recorder",
  record: "Record",
  stop: "Stop",
  again: "Record again",
  retry: "Try the microphone again",
  submit: "Use this recording",
  playback: "Your recording",
  requesting: "Waiting for the microphone.",
  recording: "Recording.",
  recorded: (duration) => `Recorded ${duration}. Listen back before you use it.`,
  autoStopped: (limit) => `Stopped at the ${limit} limit.`,
  tooShort: "That was too short to keep. Record a little longer.",
  limit: (limit) => `Up to ${limit}.`,
  denied: "The microphone is blocked. Allow it in your browser's site settings, then try again.",
  noMicrophone: "No microphone was found. Connect one, then try again.",
  unsupported: "This browser cannot record sound.",
  busy: "The microphone is in use by another app. Close it there, then try again.",
  error: "The recording could not start. Try again.",
  pending: "Working on your recording.",
  slow: "Still working.",
};

const FAILURE_LABEL = { denied: "denied", "no-microphone": "noMicrophone", unsupported: "unsupported", busy: "busy", error: "error" } as const;

export type RecorderPanelViewProps = Omit<ComponentProps<"div">, "children" | "onSubmit" | "role"> & {
  status: RecorderStatus;
  elapsedMs?: number;
  maxDurationMs?: number;
  /** The loudness, 0 to 1. Left out, there is no meter. */
  level?: number;
  /** The take to listen back to, once recorded. */
  takeUrl?: string | null;
  durationMs?: number;
  tooShort?: boolean;
  autoStopped?: boolean;
  onRecord?: () => void;
  onStop?: () => void;
  onAgain?: () => void;
  /** The primary action of a take. Without it, and without `action`, a take can only be heard or dropped. */
  onSubmit?: () => void;
  submitLabel?: string;
  /** In place of the primary button; `null` for none. */
  action?: ReactNode;
  /** The host is working on the take: the primary button is busy and the take cannot be dropped. */
  pending?: boolean;
  /** The work is taking long: the status says it is still going. */
  slow?: boolean;
  /** Another way to answer ("Type instead"). It is on screen in every status. */
  fallback?: ReactNode;
  /** Something else on the screen is working: the controls rest. */
  disabled?: boolean;
  /** The line before the first take. By default the limit; `null` for none. */
  hint?: ReactNode;
  locale?: Intl.LocalesArgument;
  labels?: Partial<RecorderLabels>;
  recordRef?: Ref<HTMLButtonElement>;
  stopRef?: Ref<HTMLButtonElement>;
  submitRef?: Ref<HTMLButtonElement>;
  againRef?: Ref<HTMLButtonElement>;
  actionRef?: Ref<HTMLSpanElement>;
};

// A take straight from MediaRecorder carries no length (Chromium writes none into a WebM it streams), so its player would
// show no clock and could not seek. Asking for a moment far past the end makes the browser find the end; then it goes back.
function measureTake(event: SyntheticEvent<HTMLAudioElement>) {
  const element = event.currentTarget;
  if (Number.isFinite(element.duration)) return;
  const back = () => {
    element.removeEventListener("durationchange", back);
    element.currentTime = 0;
  };
  element.addEventListener("durationchange", back);
  element.currentTime = 1e101;
}

/**
 * The recorder as it looks in each status, given everything: it owns nothing, so every state can be shown without a
 * microphone. The status line is the one live region; the clock and the meter are not read, so a screen reader hears
 * "Recording." once and not a number every second.
 */
export function RecorderPanelView({
  status,
  elapsedMs = 0,
  maxDurationMs = DEFAULT_MAX_RECORDING_MS,
  level,
  takeUrl,
  durationMs = 0,
  tooShort = false,
  autoStopped = false,
  onRecord,
  onStop,
  onAgain,
  onSubmit,
  submitLabel,
  action,
  pending = false,
  slow = false,
  fallback,
  disabled = false,
  hint,
  locale: ownLocale,
  labels,
  recordRef,
  stopRef,
  submitRef,
  againRef,
  actionRef,
  className,
  ...props
}: RecorderPanelViewProps) {
  const text = { ...RECORDER_LABELS, ...labels };
  const locale = useLocale(ownLocale);
  const limit = formatRecordingClock(maxDurationMs, locale);
  const problem = status in FAILURE_LABEL ? text[FAILURE_LABEL[status as keyof typeof FAILURE_LABEL]] : null;
  const said =
    problem ??
    (status === "requesting"
      ? text.requesting
      : status === "recording"
        ? text.recording
        : status === "recorded"
          ? pending
            ? slow
              ? text.slow
              : text.pending
            : `${autoStopped ? `${text.autoStopped(limit)} ` : ""}${text.recorded(formatRecordingClock(durationMs, locale))}`
          : tooShort
            ? text.tooShort
            : "");
  const before = hint === undefined ? text.limit(limit) : hint;
  const failed = problem !== null && status !== "unsupported";
  return (
    <div
      {...props}
      aria-label={props["aria-label"] ?? (props["aria-labelledby"] ? undefined : text.region)}
      className={classes("fui-recorder", className)}
      data-pending={pending || undefined}
      data-status={status}
      role="group"
    >
      <div className="fui-recorder-line">
        <p aria-live="polite" className="fui-recorder-status" data-tone={problem ? "problem" : undefined} role="status">
          {said}
        </p>
        {!said && before !== null && before !== false ? <p className="fui-recorder-hint">{before}</p> : null}
      </div>

      {status === "recording" ? (
        <div aria-hidden="true" className="fui-recorder-live">
          <span className="fui-recorder-dot" />
          <span className="fui-recorder-clock" dir="ltr">
            {formatRecordingClock(elapsedMs, locale)} / {limit}
          </span>
          {level === undefined ? null : (
            <span className="fui-recorder-meter">
              <span className="fui-recorder-meter-fill" style={{ "--fui-recorder-level": Math.max(0, Math.min(1, level)).toFixed(2) } as CSSProperties} />
            </span>
          )}
        </div>
      ) : null}

      {status === "recorded" && takeUrl ? (
        <AudioPlayer className="fui-recorder-take" label={text.playback} onLoadedMetadata={measureTake} src={takeUrl} />
      ) : null}

      <div className="fui-recorder-actions">
        {status === "idle" || status === "requesting" ? (
          <Button disabled={disabled} focusableWhenDisabled loading={status === "requesting"} onClick={onRecord} ref={recordRef}>
            {status === "requesting" ? null : <Mic aria-hidden />}
            {text.record}
          </Button>
        ) : null}
        {status === "recording" ? (
          <Button onClick={onStop} ref={stopRef}>
            <Square aria-hidden fill="currentColor" />
            {text.stop}
          </Button>
        ) : null}
        {status === "recorded" ? (
          <>
            {action !== undefined ? (
              action === null ? null : (
                <span className="fui-recorder-action" ref={actionRef}>
                  {action}
                </span>
              )
            ) : onSubmit ? (
              <Button disabled={disabled} focusableWhenDisabled loading={pending} onClick={onSubmit} ref={submitRef}>
                {submitLabel ?? text.submit}
              </Button>
            ) : null}
            <Button disabled={pending || disabled} focusableWhenDisabled onClick={onAgain} ref={againRef} variant="outline">
              <Mic aria-hidden />
              {text.again}
            </Button>
          </>
        ) : null}
        {failed ? (
          <Button disabled={disabled} focusableWhenDisabled onClick={onRecord} ref={recordRef} variant="outline">
            <Mic aria-hidden />
            {text.retry}
          </Button>
        ) : null}
        {fallback === undefined || fallback === null ? null : <span className="fui-recorder-fallback">{fallback}</span>}
      </div>
    </div>
  );
}

export type RecorderPanelProps = Omit<
  RecorderPanelViewProps,
  "status" | "elapsedMs" | "maxDurationMs" | "level" | "takeUrl" | "durationMs" | "tooShort" | "autoStopped" | "onRecord" | "onStop" | "onSubmit" | "slow" | "recordRef" | "stopRef" | "submitRef" | "againRef" | "actionRef" | "ref"
> & {
  recorder: Recorder;
  /** The take is handed to the host: what happens to it (an upload, a transcription) is the host's. */
  onSubmit?: (blob: Blob, take: RecorderTake) => void;
  /** After how long `pending` is said to be slow. */
  slowAfterMs?: number;
  /** Show the loudness while recording. */
  showLevel?: boolean;
  ref?: Ref<HTMLDivElement>;
};

function focusIn(panel: RefObject<HTMLElement | null>, target: HTMLElement | null | undefined) {
  if (!target) return;
  // Only when the focus is in the panel, or nowhere because the button that had it is gone: a person typing elsewhere keeps their place.
  const active = document.activeElement;
  if (active && active !== document.body && !panel.current?.contains(active)) return;
  target.focus({ preventScroll: true });
}

/**
 * The surface of a spoken answer: record, stop, listen back, then use the take or record again. The focus follows the
 * flow (Stop while recording, the primary action once there is a take, Record after the take is dropped), and each way
 * the microphone can fail has its own sentence beside another way to answer.
 */
export function RecorderPanel({ recorder, onSubmit, onAgain, action, pending = false, slowAfterMs, showLevel = true, ref, ...props }: RecorderPanelProps) {
  const panel = useRef<HTMLDivElement | null>(null);
  const recordRef = useRef<HTMLButtonElement | null>(null);
  const stopRef = useRef<HTMLButtonElement | null>(null);
  const submitRef = useRef<HTMLButtonElement | null>(null);
  const againRef = useRef<HTMLButtonElement | null>(null);
  const actionRef = useRef<HTMLSpanElement | null>(null);
  const slow = useSlow(pending, slowAfterMs);
  const { status } = recorder;
  const primary = action !== undefined ? action !== null : onSubmit !== undefined;
  const seen = useRef({ status, primary });

  useEffect(() => {
    const before = seen.current;
    seen.current = { status, primary };
    const own = () => actionRef.current?.querySelector<HTMLElement>("button, [href], [tabindex]:not([tabindex='-1'])") ?? submitRef.current;
    if (before.status !== status) {
      if (status === "recording") focusIn(panel, stopRef.current);
      else if (status === "recorded") focusIn(panel, own() ?? againRef.current);
      else if (status !== "requesting") focusIn(panel, recordRef.current);
    } else if (status === "recorded" && before.primary && !primary) {
      // The primary action went (it had the focus, having just been pressed): the button that stays takes it.
      focusIn(panel, againRef.current);
    }
  }, [primary, status]);

  const { blob, url, durationMs } = recorder;
  return (
    <RecorderPanelView
      {...props}
      action={action}
      actionRef={actionRef}
      againRef={againRef}
      autoStopped={recorder.autoStopped}
      durationMs={durationMs}
      elapsedMs={recorder.elapsedMs}
      level={showLevel ? recorder.level : undefined}
      maxDurationMs={recorder.maxDurationMs}
      onAgain={() => {
        recorder.reset();
        onAgain?.();
      }}
      onRecord={() => void recorder.start()}
      onStop={recorder.stop}
      onSubmit={onSubmit && blob && url ? () => onSubmit(blob, { blob, url, durationMs }) : undefined}
      pending={pending}
      recordRef={recordRef}
      ref={(element) => {
        panel.current = element;
        if (typeof ref === "function") ref(element);
        else if (ref) ref.current = element;
      }}
      slow={slow}
      status={status}
      stopRef={stopRef}
      submitRef={submitRef}
      takeUrl={url}
      tooShort={recorder.tooShort}
    />
  );
}
