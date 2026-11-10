// The pure parts of recording: which container to ask the browser for, what a refused microphone means, how the status
// moves and how the clock reads. Nothing here touches the browser, so all of it is tested.

export const DEFAULT_MAX_RECORDING_MS = 120_000;
/** Anything shorter is a mis-tap, not a take. */
export const DEFAULT_MIN_RECORDING_MS = 700;

/** In the order to try: Opus in WebM or Ogg where the browser has it, MP4 (Safari) otherwise. */
export const RECORDER_MIME_TYPES: readonly string[] = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/ogg;codecs=opus",
  "audio/mp4;codecs=mp4a.40.2",
  "audio/mp4",
];

/** The first container the browser says it records. A browser that throws on a type does not support it. */
export function pickRecordingMimeType(
  isTypeSupported: ((type: string) => boolean) | undefined,
  candidates: readonly string[] = RECORDER_MIME_TYPES,
): string | undefined {
  if (!isTypeSupported) return undefined;
  return candidates.find((type) => {
    try {
      return isTypeSupported(type);
    } catch {
      return false;
    }
  });
}

export type MicFailure = "denied" | "no-microphone" | "busy" | "error";

/**
 * What a rejected microphone means to the person. `NotAllowedError` is a refusal (the browser's block or their own) and
 * `SecurityError` the same from their side; a missing device, or one that cannot do what was asked, is no microphone;
 * `NotReadableError` is a microphone another app holds. The rest (an interruption among them) is an error to try again.
 */
export function classifyMicError(error: unknown): MicFailure {
  const name =
    typeof error === "string"
      ? error
      : typeof error === "object" && error !== null && "name" in error
        ? String((error as { name: unknown }).name)
        : "";
  switch (name) {
    case "NotAllowedError":
    case "PermissionDeniedError":
    case "SecurityError":
      return "denied";
    case "NotFoundError":
    case "DevicesNotFoundError":
    case "OverconstrainedError":
      return "no-microphone";
    case "NotReadableError":
    case "TrackStartError":
      return "busy";
    default:
      return "error";
  }
}

export type RecordingEnv = {
  mediaDevices?: { getUserMedia?: unknown } | null;
  MediaRecorder?: unknown;
};

/** Whether this page can record at all: `MediaRecorder`, and `getUserMedia` (a secure context) unless the host brings its own stream. */
export function canRecord(env: RecordingEnv, ownStream = false): boolean {
  return typeof env.MediaRecorder === "function" && (ownStream || typeof env.mediaDevices?.getUserMedia === "function");
}

export type RecorderStatus = "idle" | "requesting" | "recording" | "recorded" | "denied" | "no-microphone" | "unsupported" | "busy" | "error";

/** A finished recording: still on the device, with a URL to listen back. */
export type RecorderTake = { blob: Blob; url: string; durationMs: number };

export type RecorderState = {
  status: RecorderStatus;
  elapsedMs: number;
  take: RecorderTake | null;
  /** The last take was under the minimum and was dropped. */
  tooShort: boolean;
  /** The recorder stopped itself at the limit. */
  autoStopped: boolean;
};

export type RecorderEvent =
  | { type: "request" }
  | { type: "recording" }
  | { type: "tick"; elapsedMs: number }
  | { type: "limit" }
  | { type: "stopped"; take: RecorderTake | null }
  | { type: "failed"; status: MicFailure | "unsupported" }
  | { type: "reset" };

export const initialRecorderState: RecorderState = { status: "idle", elapsedMs: 0, take: null, tooShort: false, autoStopped: false };

/** Whether a new recording may start from this status. */
export const canStartRecording = (status: RecorderStatus): boolean => status !== "requesting" && status !== "recording" && status !== "unsupported";

export function recorderReducer(state: RecorderState, event: RecorderEvent): RecorderState {
  switch (event.type) {
    case "request":
      if (!canStartRecording(state.status)) return state;
      return { ...initialRecorderState, status: "requesting" };
    case "recording":
      if (state.status !== "requesting") return state;
      return { ...state, status: "recording", elapsedMs: 0 };
    case "tick":
      if (state.status !== "recording" || state.elapsedMs === event.elapsedMs) return state;
      return { ...state, elapsedMs: event.elapsedMs };
    case "limit":
      if (state.status !== "recording") return state;
      return { ...state, autoStopped: true };
    case "stopped":
      if (state.status !== "recording") return state;
      // A mis-tap: back to the start, with a note. It was not the limit that ended it.
      if (!event.take) return { ...initialRecorderState, tooShort: true };
      return { ...state, status: "recorded", take: event.take, elapsedMs: event.take.durationMs };
    case "failed":
      if (state.status === "unsupported") return state;
      return { ...initialRecorderState, status: event.status };
    case "reset":
      // A browser that cannot record still cannot after a reset.
      return state.status === "unsupported" ? state : initialRecorderState;
  }
}

/** Whether what was recorded counts as a take: long enough, and not empty. */
export const isTake = (durationMs: number, size: number, minDurationMs: number): boolean => size > 0 && durationMs >= minDurationMs;

/** The loudness of a block of 8-bit time-domain samples, 0 to 1, in steps of a twentieth so a meter does not repaint for noise. */
export function soundLevel(samples: ArrayLike<number>): number {
  if (samples.length === 0) return 0;
  let sum = 0;
  for (let at = 0; at < samples.length; at += 1) sum += ((samples[at]! - 128) / 128) ** 2;
  return Math.round(Math.min(1, Math.sqrt(sum / samples.length) * 3) * 20) / 20;
}

/** `0:07`, `1:05`, in the locale's own digits. */
export function formatRecordingClock(ms: number, locale: Intl.LocalesArgument = "en"): string {
  const total = Math.max(0, Math.floor((Number.isFinite(ms) ? ms : 0) / 1000));
  const minutes = new Intl.NumberFormat(locale, { useGrouping: false }).format(Math.floor(total / 60));
  const seconds = new Intl.NumberFormat(locale, { minimumIntegerDigits: 2, useGrouping: false }).format(total % 60);
  return `${minutes}:${seconds}`;
}
