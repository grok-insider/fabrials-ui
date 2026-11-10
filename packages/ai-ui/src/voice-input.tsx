"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Spinner, Tooltip, TooltipContent, TooltipTrigger, useRecorder } from "@fabrials/ui";
import { MicIcon } from "./chat-icons";

export type VoiceInputStatus = "idle" | "requesting" | "recording" | "transcribing" | "error";

export const DEFAULT_MAX_RECORDING_MS = 120_000;

export const RECORDER_MIME_CANDIDATES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/ogg;codecs=opus",
];

export function pickRecorderMimeType(isTypeSupported: ((type: string) => boolean) | undefined): string | undefined {
  if (!isTypeSupported) return undefined;
  return RECORDER_MIME_CANDIDATES.find((type) => {
    try {
      return isTypeSupported(type);
    } catch {
      return false;
    }
  });
}

export function describeMicError(error: unknown, labels: VoiceInputLabels = {}): string {
  const text = { ...DEFAULT_LABELS, ...labels };
  const name = error instanceof Error || (typeof error === "object" && error && "name" in error) ? String((error as { name: unknown }).name) : "";
  switch (name) {
    case "NotAllowedError":
    case "PermissionDeniedError":
    case "SecurityError":
      return text.denied;
    case "NotFoundError":
    case "DevicesNotFoundError":
    case "OverconstrainedError":
      return text.noMicrophone;
    case "NotReadableError":
    case "TrackStartError":
      return text.busy;
    case "AbortError":
      return text.interrupted;
    default:
      return text.micFailed;
  }
}

export function formatElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(total / 60)}:${(total % 60).toString().padStart(2, "0")}`;
}

export function insertDictation(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  text: string,
): { value: string; caret: number } {
  const trimmed = text.trim();
  const start = Math.max(0, Math.min(selectionStart, selectionEnd, value.length));
  const end = Math.max(start, Math.min(Math.max(selectionStart, selectionEnd), value.length));
  if (!trimmed) return { value, caret: end };
  const before = value.slice(0, start);
  const after = value.slice(end);
  const lead = before && !/\s$/.test(before) ? " " : "";
  const trail = after && !/^\s/.test(after) ? " " : "";
  const insert = `${lead}${trimmed}`;
  return { value: `${before}${insert}${trail}${after}`, caret: before.length + insert.length };
}

export function isVoiceInputSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof MediaRecorder !== "undefined" &&
    typeof navigator !== "undefined" &&
    typeof navigator.mediaDevices?.getUserMedia === "function"
  );
}

export type VoiceInputLabels = {
  idle?: string;
  requesting?: string;
  recording?: string;
  transcribing?: string;
  stopHint?: string;
  empty?: string;
  noSpeech?: string;
  failed?: string;
  /** The microphone is blocked, by the browser or by the person. */
  denied?: string;
  noMicrophone?: string;
  /** Another app holds the microphone. */
  busy?: string;
  interrupted?: string;
  /** The microphone did not start, for a reason the browser does not name. */
  micFailed?: string;
  recordingFailed?: string;
};

const DEFAULT_LABELS: Required<VoiceInputLabels> = {
  idle: "Dictate",
  requesting: "Waiting for microphone",
  recording: "Stop recording",
  transcribing: "Transcribing",
  stopHint: "Stop and transcribe",
  empty: "Nothing was recorded.",
  noSpeech: "Didn't catch that — try again a little closer to the mic.",
  failed: "Transcription failed.",
  denied: "Microphone access is blocked. Allow it in your browser's site settings to dictate.",
  noMicrophone: "No microphone was found.",
  busy: "The microphone is busy in another app.",
  interrupted: "Recording was interrupted.",
  micFailed: "Couldn't start the microphone.",
  recordingFailed: "Recording failed.",
};

export type VoiceInputButtonViewProps = {
  status: VoiceInputStatus;
  elapsedMs?: number;
  maxDurationMs?: number;
  level?: number;
  error?: string;
  disabled?: boolean;
  labels?: VoiceInputLabels;
  onPress?: () => void;
  className?: string;
};

export function VoiceInputButtonView({
  status,
  elapsedMs = 0,
  maxDurationMs,
  level,
  error,
  disabled = false,
  labels: labelOverrides,
  onPress,
  className,
}: VoiceInputButtonViewProps) {
  const labels = { ...DEFAULT_LABELS, ...labelOverrides };
  const recording = status === "recording";
  const busy = status === "transcribing" || status === "requesting";
  const label = recording ? labels.recording : status === "transcribing" ? labels.transcribing : status === "requesting" ? labels.requesting : labels.idle;
  const remaining = maxDurationMs ? Math.max(0, maxDurationMs - elapsedMs) : undefined;
  const hint = status === "error" && error ? error : recording ? labels.stopHint : label;
  const button = (
    <button
      aria-busy={busy || undefined}
      aria-disabled={busy || disabled || undefined}
      aria-label={label}
      aria-pressed={recording}
      className={["fui-voice-button", className].filter(Boolean).join(" ")}
      data-status={status}
      onClick={() => {
        if (busy || disabled) return;
        onPress?.();
      }}
      style={level === undefined ? undefined : ({ "--fui-voice-level": Math.max(0, Math.min(1, level)).toFixed(3) } as CSSProperties)}
      type="button"
    >
      {status === "transcribing" || status === "requesting" ? (
        <Spinner aria-hidden label="" role="presentation" />
      ) : (
        <span className="fui-voice-icon">
          <MicIcon />
          <span aria-hidden className="fui-voice-dot" />
        </span>
      )}
      {recording ? (
        <span className="fui-voice-timer" title={remaining !== undefined ? `${formatElapsed(remaining)} left` : undefined}>
          {formatElapsed(elapsedMs)}
        </span>
      ) : null}
      {status === "transcribing" ? <span className="fui-voice-text">{labels.transcribing}…</span> : null}
    </button>
  );
  return (
    <>
      <Tooltip>
        <TooltipTrigger render={button} />
        <TooltipContent>{hint}</TooltipContent>
      </Tooltip>
      <span aria-live="polite" className="fui-sr-only" role="status">
        {status === "error" && error ? error : ""}
      </span>
    </>
  );
}

export type VoiceInputButtonProps = {
  onRecorded: (blob: Blob) => Promise<string>;
  onTranscript: (text: string) => void;
  onError?: (message: string, error?: unknown) => void;
  onNotice?: (message: string) => void;
  maxDurationMs?: number;
  showLevel?: boolean;
  disabled?: boolean;
  labels?: VoiceInputLabels;
  /** What stands in the button's place in a browser that cannot record. Nothing by default. */
  unsupportedFallback?: ReactNode;
  className?: string;
};

/**
 * Dictation on the house recorder (`useRecorder` of `@fabrials/ui`): press to record, press again to stop, and the take
 * goes to `onRecorded` at once. While it records it holds the page's sound, so a clip or a player stops.
 */
export function VoiceInputButton({
  onRecorded,
  onTranscript,
  onError,
  onNotice,
  maxDurationMs = DEFAULT_MAX_RECORDING_MS,
  showLevel = false,
  disabled,
  labels: labelOverrides,
  unsupportedFallback = null,
  className,
}: VoiceInputButtonProps) {
  const labels = { ...DEFAULT_LABELS, ...labelOverrides };
  const [error, setError] = useState<string | undefined>();
  const mountedRef = useRef(true);
  const handled = useRef<Blob | null>(null);
  const callbacks = useRef({ onRecorded, onTranscript, onError, onNotice, labels });
  useEffect(() => {
    callbacks.current = { onRecorded, onTranscript, onError, onNotice, labels };
  });
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fail = useCallback((message: string, cause?: unknown) => {
    setError(message);
    callbacks.current.onError?.(message, cause);
  }, []);

  const recorder = useRecorder({
    maxDurationMs,
    // Dictation keeps whatever was said, however short; only an empty take is dropped.
    minDurationMs: 0,
    mimeTypes: RECORDER_MIME_CANDIDATES,
    constraints: true,
    level: showLevel,
    onError: (failure) => {
      const text = callbacks.current.labels;
      fail(failure.during === "recording" ? text.recordingFailed : describeMicError(failure.cause, text), failure.cause);
    },
  });
  const { blob, tooShort, reset } = recorder;

  // The take goes straight to the host: there is no listening back in a dictation key.
  useEffect(() => {
    if (!blob || handled.current === blob) return;
    handled.current = blob;
    const { onRecorded: record, onTranscript: deliver, onNotice: notice, labels: text } = callbacks.current;
    void (async () => {
      try {
        const transcript = (await record(blob)).trim();
        if (!mountedRef.current) return;
        if (!transcript) notice?.(text.noSpeech);
        else deliver(transcript);
        reset();
      } catch (cause) {
        if (!mountedRef.current) return;
        reset();
        fail(cause instanceof Error && cause.message ? cause.message : text.failed, cause);
      }
    })();
  }, [blob, fail, reset]);

  useEffect(() => {
    if (tooShort) callbacks.current.onNotice?.(callbacks.current.labels.empty);
  }, [tooShort]);

  if (recorder.status === "unsupported") return <>{unsupportedFallback}</>;
  if (!recorder.supported) return null;

  const status: VoiceInputStatus =
    recorder.status === "requesting" || recorder.status === "recording"
      ? recorder.status
      : recorder.status === "recorded"
        ? "transcribing"
        : error
          ? "error"
          : "idle";

  return (
    <VoiceInputButtonView
      className={className}
      disabled={disabled}
      elapsedMs={recorder.elapsedMs}
      error={error}
      labels={labelOverrides}
      level={showLevel && status === "recording" ? recorder.level : undefined}
      maxDurationMs={maxDurationMs}
      onPress={() => {
        if (status === "recording") recorder.stop();
        else {
          setError(undefined);
          void recorder.start();
        }
      }}
      status={status}
    />
  );
}
