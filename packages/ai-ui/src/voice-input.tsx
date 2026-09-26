"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { Spinner, Tooltip, TooltipContent, TooltipTrigger } from "@fabrials/ui";
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

export function describeMicError(error: unknown): string {
  const name = error instanceof Error || (typeof error === "object" && error && "name" in error) ? String((error as { name: unknown }).name) : "";
  switch (name) {
    case "NotAllowedError":
    case "PermissionDeniedError":
    case "SecurityError":
      return "Microphone access is blocked. Allow it in your browser's site settings to dictate.";
    case "NotFoundError":
    case "DevicesNotFoundError":
    case "OverconstrainedError":
      return "No microphone was found.";
    case "NotReadableError":
    case "TrackStartError":
      return "The microphone is busy in another app.";
    case "AbortError":
      return "Recording was interrupted.";
    default:
      return "Couldn't start the microphone.";
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

const noopSubscribe = () => () => {};

function stopTracks(stream: MediaStream | null) {
  for (const track of stream?.getTracks() ?? []) track.stop();
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
  className?: string;
};

export function VoiceInputButton({
  onRecorded,
  onTranscript,
  onError,
  onNotice,
  maxDurationMs = DEFAULT_MAX_RECORDING_MS,
  showLevel = false,
  disabled,
  labels: labelOverrides,
  className,
}: VoiceInputButtonProps) {
  const supported = useSyncExternalStore(noopSubscribe, isVoiceInputSupported, () => false);
  const labels = { ...DEFAULT_LABELS, ...labelOverrides };
  const [status, setStatus] = useState<VoiceInputStatus>("idle");
  const [error, setError] = useState<string | undefined>();
  const [elapsedMs, setElapsedMs] = useState(0);
  const [level, setLevel] = useState<number | undefined>(undefined);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<{ context?: AudioContext; frame?: number }>({});
  const timersRef = useRef<{ tick?: ReturnType<typeof setInterval>; stop?: ReturnType<typeof setTimeout> }>({});
  const mountedRef = useRef(true);
  const callbacks = useRef({ onRecorded, onTranscript, onError, onNotice, labels });
  useEffect(() => {
    callbacks.current = { onRecorded, onTranscript, onError, onNotice, labels };
  });

  const teardown = useCallback(() => {
    clearInterval(timersRef.current.tick);
    clearTimeout(timersRef.current.stop);
    timersRef.current = {};
    if (audioRef.current.frame !== undefined) cancelAnimationFrame(audioRef.current.frame);
    void audioRef.current.context?.close().catch(() => undefined);
    audioRef.current = {};
    stopTracks(streamRef.current);
    streamRef.current = null;
    recorderRef.current = null;
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      const recorder = recorderRef.current;
      if (recorder && recorder.state !== "inactive") {
        recorder.onstop = null;
        recorder.stop();
      }
      teardown();
    };
  }, [teardown]);

  const fail = useCallback((message: string, cause?: unknown) => {
    setError(message);
    setStatus("error");
    callbacks.current.onError?.(message, cause);
  }, []);

  const stop = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
  }, []);

  const transcribe = useCallback(
    async (blob: Blob) => {
      const { onRecorded: record, onTranscript: deliver, onNotice: notice, labels: text } = callbacks.current;
      if (blob.size === 0) {
        notice?.(text.empty);
        setStatus("idle");
        return;
      }
      setStatus("transcribing");
      try {
        const transcript = (await record(blob)).trim();
        if (!mountedRef.current) return;
        if (!transcript) notice?.(text.noSpeech);
        else deliver(transcript);
        setStatus("idle");
      } catch (cause) {
        if (!mountedRef.current) return;
        fail(cause instanceof Error && cause.message ? cause.message : text.failed, cause);
      }
    },
    [fail],
  );

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
        let sum = 0;
        for (const sample of data) sum += ((sample - 128) / 128) ** 2;
        setLevel(Math.round(Math.min(1, Math.sqrt(sum / data.length) * 3) * 20) / 20);
        audioRef.current.frame = requestAnimationFrame(read);
      };
      audioRef.current = { context, frame: requestAnimationFrame(read) };
    } catch {
      setLevel(undefined);
    }
  }, []);

  const start = useCallback(async () => {
    if (recorderRef.current) return;
    setError(undefined);
    setStatus("requesting");
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (cause) {
      if (mountedRef.current) fail(describeMicError(cause), cause);
      return;
    }
    if (!mountedRef.current) {
      stopTracks(stream);
      return;
    }
    const mimeType = pickRecorderMimeType(
      typeof MediaRecorder.isTypeSupported === "function" ? (type) => MediaRecorder.isTypeSupported(type) : undefined,
    );
    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    } catch (cause) {
      stopTracks(stream);
      fail(describeMicError(cause), cause);
      return;
    }
    chunksRef.current = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };
    recorder.onerror = (event) => {
      recorder.onstop = null;
      teardown();
      if (mountedRef.current) fail("Recording failed.", event);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || mimeType || "audio/webm" });
      chunksRef.current = [];
      teardown();
      setLevel(undefined);
      if (mountedRef.current) void transcribe(blob);
    };
    recorderRef.current = recorder;
    streamRef.current = stream;
    recorder.start(250);
    const startedAt = Date.now();
    setElapsedMs(0);
    setStatus("recording");
    if (showLevel) meter(stream);
    timersRef.current.tick = setInterval(() => setElapsedMs(Date.now() - startedAt), 250);
    timersRef.current.stop = setTimeout(stop, maxDurationMs);
  }, [fail, maxDurationMs, meter, showLevel, stop, teardown, transcribe]);

  if (!supported) return null;

  return (
    <VoiceInputButtonView
      className={className}
      disabled={disabled}
      elapsedMs={elapsedMs}
      error={error}
      labels={labelOverrides}
      level={status === "recording" ? level : undefined}
      maxDurationMs={maxDurationMs}
      onPress={() => {
        if (status === "recording") stop();
        else void start();
      }}
      status={status}
    />
  );
}
