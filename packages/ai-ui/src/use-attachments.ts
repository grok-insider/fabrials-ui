"use client";
// Origin: Fabrials, 0.12, from Radiant's composer files: an upload starts when the file is added, a few at a time, with
// abort, retry and a wait before sending. The library never uploads: the host passes the function and says what it did.

import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ChangeEvent,
  type ClipboardEvent,
  type DragEvent,
  type InputHTMLAttributes,
  type RefObject,
} from "react";
import { carriesFiles, sortFiles, type FileRejection } from "@fabrials/ui";
import {
  AttachmentsError,
  createLimiter,
  failureMessage,
  hasPreview,
  isUploading,
  reduceAttachments,
  toAttachmentItems,
  uploadErrorText,
  EMPTY_ATTACHMENTS,
  type AttachmentAction,
  type AttachmentEntry,
  type AttachmentLabels,
  type AttachmentState,
} from "./attachments-logic";
import type { AttachmentItem } from "./attachments";

/** What the host's uploader is given: the file, the signal that says it was given up, and where to report progress. */
export type AttachmentUploadContext = {
  signal: AbortSignal;
  onProgress: (progress: number) => void;
};

export type AttachmentUpload<TResult> = (file: File, context: AttachmentUploadContext) => Promise<TResult>;

export type UseAttachmentsOptions<TResult> = {
  /** The host's uploader. The library knows no URL and calls no `fetch`. */
  upload: AttachmentUpload<TResult>;
  /** What the picker offers and what is accepted, as a file input takes it (".pdf,image/*"). */
  accept?: string;
  /** Bytes. Larger files are refused with the reason "size". */
  maxSize?: number;
  /** How many files the composer holds at once. More are refused with the reason "count". */
  maxFiles?: number;
  /** How many uploads run at once. Three by default. */
  concurrency?: number;
  /** A file that was not added, with why: report it your own way instead of dropping it in silence. */
  onReject?: (rejection: FileRejection) => void;
  /** An upload that failed. The item says so too; this is for a toast. */
  onError?: (error: unknown, file: { id: string; name: string }) => void;
  /** Take a file dropped anywhere on the page, not only where `dropProps` are spread. */
  pageDrop?: boolean;
  labels?: AttachmentLabels;
  /** The name of the hidden file input, for a form. */
  name?: string;
};

export type AttachmentsWait<TResult> = {
  /** The files of the snapshot that are still there, in the order they were added. */
  ids: string[];
  /** What the host's uploader answered for each of them, in the same order. */
  results: TResult[];
  /** The same files as <Attachments> draws them. */
  items: AttachmentItem[];
};

export type UseAttachmentsResult<TResult> = {
  /** Every file with what happened to it: the file, the result, the state, the error. */
  entries: readonly AttachmentEntry<TResult>[];
  /** The same files in the shape <Attachments items> takes. */
  items: AttachmentItem[];
  /** Some file is queued or on its way up. */
  uploading: boolean;
  /** Adds what it accepts and reports every file it does not. Returns what happened, so a host can say it. */
  add: (files: File[] | FileList) => { ids: string[]; rejected: FileRejection[] };
  /** Gives a file up: aborts its upload and revokes its preview. */
  remove: (id: string) => void;
  /** Removes the last file, for Backspace in an empty composer. */
  removeLast: () => void;
  /** Uploads a failed file again. Other files are left alone. */
  retry: (id: string) => void;
  clear: () => void;
  /** Waits for the files there are now, and rejects with one `AttachmentsError` naming every file that failed. */
  waitForUploads: () => Promise<AttachmentsWait<TResult>>;
  /** For a hidden `<input type="file">`: it takes the same file twice, since its value is emptied after each pick. */
  inputProps: InputHTMLAttributes<HTMLInputElement> & { ref: RefObject<HTMLInputElement | null> };
  openPicker: () => void;
  /** For the area that takes a drop: it ignores a dragged link or a text selection. */
  dropProps: {
    onDragOver: (event: DragEvent<HTMLElement>) => void;
    onDrop: (event: DragEvent<HTMLElement>) => void;
  };
  /** For a field that takes a pasted screenshot. */
  paste: { onPaste: (event: ClipboardEvent<HTMLElement>) => void };
};

let fallbackId = 0;

// A secure context has `crypto.randomUUID`; an older one gets a name that is only ever used as a key.
function newId() {
  const source = globalThis.crypto as Crypto | undefined;
  if (source && typeof source.randomUUID === "function") {
    try {
      return source.randomUUID();
    } catch {
      // A page served over plain http: fall through to the counter.
    }
  }
  fallbackId += 1;
  return `fui-attachment-${fallbackId}`;
}

function filesOf(list: FileList | null | undefined) {
  return Array.from(list ?? []);
}

/**
 * The files a composer holds, and their way up. The view is `items` (or `entries` for the file and the result); the rest
 * is what a host calls: add from a picker, a drop or a paste, remove and retry, and `waitForUploads()` before sending.
 */
export function useAttachments<TResult>({
  upload,
  accept,
  maxSize,
  maxFiles,
  concurrency = 3,
  onReject,
  onError,
  pageDrop = false,
  labels,
  name,
}: UseAttachmentsOptions<TResult>): UseAttachmentsResult<TResult> {
  const [state, apply] = useReducer(reduceAttachments<TResult>, EMPTY_ATTACHMENTS as AttachmentState<TResult>);
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // The state the next call reads, before React has painted: an add and a remove in the same tick see each other.
  const dispatch = useCallback(
    (action: AttachmentAction<TResult>) => {
      stateRef.current = reduceAttachments(stateRef.current, action);
      apply(action);
    },
    [apply],
  );

  const options = useRef({ upload, onReject, onError, labels });
  useEffect(() => {
    options.current = { upload, onReject, onError, labels };
  });
  const limiter = useMemo(() => createLimiter(concurrency), [concurrency]);
  const tasks = useRef(new Map<string, { controller: AbortController; done: Promise<void> }>());
  const results = useRef(new Map<string, TResult>());
  const previews = useRef(new Set<string>());
  const alive = useRef(true);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const revoke = useCallback((url: string) => {
    if (!previews.current.delete(url)) return;
    URL.revokeObjectURL(url);
  }, []);

  const start = useCallback(
    (id: string, file: File) => {
      const controller = new AbortController();
      const done = limiter
        .run(async () => {
          if (controller.signal.aborted || !alive.current) return;
          dispatch({ type: "start", id });
          try {
            const result = await options.current.upload(file, {
              signal: controller.signal,
              onProgress: (progress) => {
                if (!controller.signal.aborted && alive.current) dispatch({ type: "progress", id, progress });
              },
            });
            if (controller.signal.aborted || !alive.current) return;
            results.current.set(id, result);
            dispatch({ type: "done", id, result });
          } catch (error) {
            if (controller.signal.aborted || !alive.current) return;
            dispatch({ type: "fail", id, error: uploadErrorText(error, options.current.labels) });
            options.current.onError?.(error, { id, name: file.name });
          } finally {
            if (tasks.current.get(id)?.controller === controller) tasks.current.delete(id);
          }
        })
        .catch(() => undefined);
      tasks.current.set(id, { controller, done });
    },
    [dispatch, limiter],
  );

  const entryFor = useCallback((file: File): AttachmentEntry<TResult> => {
    const mediaType = file.type || "application/octet-stream";
    return {
      id: newId(),
      file,
      name: file.name || "file",
      mediaType,
      size: file.size,
      url: hasPreview(mediaType) ? URL.createObjectURL(file) : undefined,
      status: "pending",
    };
  }, []);

  const add = useCallback(
    (files: File[] | FileList) => {
      const room = maxFiles === undefined ? undefined : Math.max(0, maxFiles - stateRef.current.entries.length);
      const { accepted, rejected } = sortFiles(Array.from(files), { accept, maxSize, maxFiles: room, multiple: true });
      // Every refused file is reported with its reason: one wrong type does not swallow the rest of the drop.
      for (const rejection of rejected) options.current.onReject?.(rejection);
      if (accepted.length === 0) return { ids: [], rejected };
      const entries = accepted.map(entryFor);
      dispatch({ type: "add", entries });
      for (const entry of entries) {
        if (entry.url) previews.current.add(entry.url);
        start(entry.id, entry.file);
      }
      return { ids: entries.map((entry) => entry.id), rejected };
    },
    [accept, dispatch, entryFor, maxFiles, maxSize, start],
  );

  const remove = useCallback(
    (id: string) => {
      const task = tasks.current.get(id);
      tasks.current.delete(id);
      task?.controller.abort();
      results.current.delete(id);
      const entry = stateRef.current.entries.find((value) => value.id === id);
      if (entry?.url) revoke(entry.url);
      dispatch({ type: "remove", id });
    },
    [dispatch, revoke],
  );

  const removeLast = useCallback(() => {
    const last = stateRef.current.entries.at(-1);
    if (last) remove(last.id);
  }, [remove]);

  const retry = useCallback(
    (id: string) => {
      const entry = stateRef.current.entries.find((value) => value.id === id);
      if (!entry || entry.status !== "failed") return;
      results.current.delete(id);
      dispatch({ type: "retry", id });
      start(id, entry.file);
    },
    [dispatch, start],
  );

  const clear = useCallback(() => {
    for (const task of tasks.current.values()) task.controller.abort();
    tasks.current.clear();
    results.current.clear();
    for (const url of previews.current) URL.revokeObjectURL(url);
    previews.current.clear();
    dispatch({ type: "clear" });
  }, [dispatch]);

  const waitForUploads = useCallback(async (): Promise<AttachmentsWait<TResult>> => {
    // The files there are when the message is sent, and only those: one added while waiting is sent with the next one.
    const snapshot = stateRef.current.entries;
    await Promise.all(snapshot.map((entry) => tasks.current.get(entry.id)?.done ?? null));
    const wanted = new Set(snapshot.map((entry) => entry.id));
    const present = stateRef.current.entries.filter((entry) => wanted.has(entry.id));
    const failed = present
      .filter((entry) => entry.status === "failed")
      .map((entry) => ({ id: entry.id, name: entry.name, error: entry.error ?? uploadErrorText(undefined, options.current.labels) }));
    if (failed.length > 0) throw new AttachmentsError(failed, failureMessage(failed.map((file) => file.name), options.current.labels));
    return {
      ids: present.map((entry) => entry.id),
      results: present.map((entry) => results.current.get(entry.id) as TResult),
      items: toAttachmentItems(present),
    };
  }, []);

  useEffect(() => {
    alive.current = true;
    const running = tasks.current;
    const previewUrls = previews.current;
    return () => {
      alive.current = false;
      for (const task of running.values()) task.controller.abort();
      running.clear();
      for (const url of previewUrls) URL.revokeObjectURL(url);
      previewUrls.clear();
    };
  }, []);

  useEffect(() => {
    if (!pageDrop) return;
    const over = (event: globalThis.DragEvent) => {
      if (carriesFiles(event.dataTransfer?.types)) event.preventDefault();
    };
    const dropped = (event: globalThis.DragEvent) => {
      if (!carriesFiles(event.dataTransfer?.types)) return;
      event.preventDefault();
      add(filesOf(event.dataTransfer?.files));
    };
    document.addEventListener("dragover", over);
    document.addEventListener("drop", dropped);
    return () => {
      document.removeEventListener("dragover", over);
      document.removeEventListener("drop", dropped);
    };
  }, [add, pageDrop]);

  const inputProps = useMemo(
    () => ({
      type: "file" as const,
      name,
      accept,
      multiple: true,
      hidden: true,
      "data-slot": "attachments-input",
      ref: inputRef,
      onChange: (event: ChangeEvent<HTMLInputElement>) => {
        const files = filesOf(event.currentTarget.files);
        // Emptied so the same file can be picked again, which `change` would not report twice.
        event.currentTarget.value = "";
        add(files);
      },
    }),
    [accept, add, name],
  );

  const openPicker = useCallback(() => inputRef.current?.click(), []);

  const dropProps = useMemo(
    () => ({
      onDragOver: (event: DragEvent<HTMLElement>) => {
        if (!carriesFiles(event.dataTransfer?.types)) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
      },
      onDrop: (event: DragEvent<HTMLElement>) => {
        if (!carriesFiles(event.dataTransfer?.types)) return;
        event.preventDefault();
        add(filesOf(event.dataTransfer?.files));
      },
    }),
    [add],
  );

  const paste = useMemo(
    () => ({
      onPaste: (event: ClipboardEvent<HTMLElement>) => {
        const files: File[] = [];
        for (const item of Array.from(event.clipboardData?.items ?? [])) {
          if (item.kind !== "file") continue;
          const file = item.getAsFile();
          if (file) files.push(file);
        }
        if (files.length === 0) return;
        event.preventDefault();
        add(files);
      },
    }),
    [add],
  );

  const items = useMemo(() => toAttachmentItems(state.entries), [state]);
  const uploading = isUploading(state.entries);

  return useMemo(
    () => ({ entries: state.entries, items, uploading, add, remove, removeLast, retry, clear, waitForUploads, inputProps, openPicker, dropProps, paste }),
    [state.entries, items, uploading, add, remove, removeLast, retry, clear, waitForUploads, inputProps, openPicker, dropProps, paste],
  );
}
