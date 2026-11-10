// The pure part of uploading from a composer: the state of each file, the limiter that keeps a few uploads going at a
// time, the words of a failure, and the view of a file that <Attachments> draws. No React and no browser.

import type { AttachmentItem } from "./attachments";

/** Where one file is in its way up. `pending` is queued behind the limiter and `uploading` has a slot. */
export type AttachmentStatus = "pending" | "uploading" | "done" | "failed";

export type AttachmentEntry<TResult = unknown> = {
  id: string;
  /** The file as the browser handed it over: what the host uploads, and what a retry sends again. */
  file: File;
  name: string;
  mediaType: string;
  size: number;
  /** An object URL of a picture or a video, so the tile shows it instead of an icon. Revoked when the file goes. */
  url?: string;
  status: AttachmentStatus;
  /** From 0 to 1 while the upload reports it, `undefined` while it does not know. */
  progress?: number;
  /** Why the upload failed, in words the person reads. */
  error?: string;
  /** What the host's uploader answered. */
  result?: TResult;
};

export type AttachmentState<TResult = unknown> = { entries: AttachmentEntry<TResult>[] };

export type AttachmentAction<TResult = unknown> =
  | { type: "add"; entries: AttachmentEntry<TResult>[] }
  | { type: "start"; id: string }
  | { type: "progress"; id: string; progress: number }
  | { type: "done"; id: string; result: TResult }
  | { type: "fail"; id: string; error: string }
  | { type: "retry"; id: string }
  | { type: "remove"; id: string }
  | { type: "clear" };

export const EMPTY_ATTACHMENTS: AttachmentState<never> = { entries: [] };

/** 0 to 1, and 0 for a number that is not one (a loader that reports `NaN` does not empty the ring). */
export function clampProgress(progress: number) {
  return Number.isFinite(progress) ? Math.min(1, Math.max(0, progress)) : 0;
}

/** Whether the view can draw the file itself: a picture or a video show, anything else is an icon. */
export function hasPreview(mediaType: string) {
  const type = (mediaType.split(";")[0] ?? "").trim().toLowerCase();
  return type.startsWith("image/") || type.startsWith("video/");
}

function patched<TResult>(state: AttachmentState<TResult>, id: string, change: (entry: AttachmentEntry<TResult>) => AttachmentEntry<TResult> | null) {
  const at = state.entries.findIndex((entry) => entry.id === id);
  if (at < 0) return state;
  const next = change(state.entries[at]!);
  if (!next) return state;
  const entries = state.entries.slice();
  entries[at] = next;
  return { entries };
}

/**
 * The state of the composer's files. An action about a file that is no longer there (a result that arrives after the
 * file was removed, or after the hook went) changes nothing and returns the very same state, so nothing comes back.
 */
export function reduceAttachments<TResult>(state: AttachmentState<TResult>, action: AttachmentAction<TResult>): AttachmentState<TResult> {
  switch (action.type) {
    case "add":
      return action.entries.length === 0 ? state : { entries: [...state.entries, ...action.entries] };
    case "start":
      return patched(state, action.id, (entry) =>
        entry.status === "pending" ? { ...entry, status: "uploading", progress: undefined, error: undefined } : null,
      );
    case "progress":
      return patched(state, action.id, (entry) => {
        if (entry.status !== "uploading") return null;
        const progress = clampProgress(action.progress);
        return progress === entry.progress ? null : { ...entry, progress };
      });
    case "done":
      return patched(state, action.id, (entry) =>
        entry.status === "done" ? null : { ...entry, status: "done", progress: 1, error: undefined, result: action.result },
      );
    case "fail":
      return patched(state, action.id, (entry) =>
        entry.status === "done" ? null : { ...entry, status: "failed", progress: undefined, error: action.error },
      );
    case "retry":
      return patched(state, action.id, (entry) =>
        entry.status === "failed" ? { ...entry, status: "pending", progress: undefined, error: undefined } : null,
      );
    case "remove": {
      const entries = state.entries.filter((entry) => entry.id !== action.id);
      return entries.length === state.entries.length ? state : { entries };
    }
    case "clear":
      return state.entries.length === 0 ? state : { entries: [] };
    default:
      return state;
  }
}

/**
 * The files as <Attachments> draws them. Its own vocabulary is three states (`ready`, `uploading`, `error`), so a queued
 * file looks busy like an uploading one does, which is the truth the view has room for.
 */
export function toAttachmentItems<TResult>(entries: readonly AttachmentEntry<TResult>[]): AttachmentItem[] {
  return entries.map((entry) => ({
    id: entry.id,
    name: entry.name,
    mediaType: entry.mediaType,
    size: entry.size,
    url: entry.url,
    status: entry.status === "failed" ? "error" : entry.status === "done" ? "ready" : "uploading",
    progress: entry.status === "uploading" ? entry.progress : undefined,
    error: entry.error,
  }));
}

/** Whether any file is still on its way up, queued included. */
export function isUploading(entries: readonly AttachmentEntry<unknown>[]) {
  return entries.some((entry) => entry.status === "pending" || entry.status === "uploading");
}

export type AttachmentLabels = {
  /** Why an upload failed, when what it threw says nothing. */
  failed?: string;
  /** What `waitForUploads` rejects with, given the names of the files that failed. */
  uploadFailed?: (names: readonly string[]) => string;
};

export const DEFAULT_ATTACHMENT_LABELS = {
  failed: "The file could not be uploaded.",
  uploadFailed: (names: readonly string[]) => `Could not upload ${names.join(", ")}.`,
};

/** What to write under a file that failed: what it threw, or the label when it threw nothing readable. */
export function uploadErrorText(error: unknown, labels?: AttachmentLabels) {
  const said = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  return said.trim() || labels?.failed || DEFAULT_ATTACHMENT_LABELS.failed;
}

/** One failure for every file that failed, so a host shows one message and can still point at each of them. */
export class AttachmentsError extends Error {
  readonly failed: { id: string; name: string; error: string }[];
  constructor(failed: { id: string; name: string; error: string }[], message?: string) {
    super(message || DEFAULT_ATTACHMENT_LABELS.uploadFailed(failed.map((file) => file.name)));
    this.name = "AttachmentsError";
    this.failed = failed;
  }
}

/** The message a `waitForUploads` rejection carries. */
export function failureMessage(names: readonly string[], labels?: AttachmentLabels) {
  return (labels?.uploadFailed ?? DEFAULT_ATTACHMENT_LABELS.uploadFailed)(names);
}

export type Limiter = {
  /** Runs a task now, or once there is a free slot. */
  run<T>(task: () => Promise<T>): Promise<T>;
  /** How many tasks hold a slot. */
  readonly active: number;
  /** How many wait for one. */
  readonly waiting: number;
};

/**
 * At most `limit` tasks at once, in the order they were asked for. A finishing task hands its slot straight to the next
 * one, so the count never dips and a queue of five never starts a fourth upload.
 */
export function createLimiter(limit: number): Limiter {
  const most = Number.isFinite(limit) ? Math.max(1, Math.floor(limit)) : 1;
  let active = 0;
  let waiting = 0;
  const queue: Array<() => void> = [];
  const release = () => {
    const next = queue.shift();
    if (next) {
      waiting -= 1;
      next();
      return;
    }
    active -= 1;
  };
  return {
    get active() {
      return active;
    },
    get waiting() {
      return waiting;
    },
    async run<T>(task: () => Promise<T>) {
      if (active >= most) {
        waiting += 1;
        await new Promise<void>((resolve) => queue.push(resolve));
      } else {
        active += 1;
      }
      try {
        return await task();
      } finally {
        release();
      }
    },
  };
}
