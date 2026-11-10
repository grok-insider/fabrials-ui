"use client";
// One way to copy (0.12): every key in the library that puts text on the clipboard keeps the same small machine, so a copy
// reports itself the same way everywhere and a product can say what happened once, in one place.

import { useCallback, useEffect, useReducer, useRef } from "react";

/** What a copy left behind: nothing yet, the text on the clipboard, or a clipboard that refused. */
export type CopyState = "idle" | "copied" | "failed";

export type CopyEvent = { type: "reset" } | { type: "settled"; result: Exclude<CopyState, "idle"> };

/** The machine behind `useCopy`, as a plain function. A copy says how it went; `reset` takes it back to quiet. */
export function copyState(state: CopyState, event: CopyEvent): CopyState {
  if (event.type === "reset") return "idle";
  return event.result;
}

/** Puts the text on the clipboard, and fails when the browser has none to give it (a key outside a gesture, a page without permission). */
async function writeClipboard(text: string) {
  if (typeof navigator === "undefined" || typeof navigator.clipboard?.writeText !== "function") throw new Error("This browser has no clipboard.");
  await navigator.clipboard.writeText(text);
}

/** The text to copy, or a function that makes it (a message built from the page, a selection read on the click). */
export type CopySource = string | (() => string | Promise<string>);

/** Puts the text somewhere other than the clipboard: a caller that has its own write keeps it. */
export type CopyWriter = (text: string) => void | Promise<void>;

export type UseCopyOptions = {
  /** How long "copied" lasts before it goes quiet again, in ms (1600 by default; a code block waits 2000). */
  resetAfter?: number;
  /** Called with the text once it is on the clipboard. A notification: it does not replace the copy. */
  onCopied?: (text: string) => void;
  /** Called with what the clipboard threw. The state is "failed" either way, and `copy` never rejects. */
  onError?: (error: unknown) => void;
};

export type UseCopyResult = {
  status: CopyState;
  /**
   * Copies `source` and answers whether it worked. `write`, when given, replaces the clipboard write entirely; without it
   * the text goes through `navigator.clipboard.writeText`, and a browser that refuses leaves `status` at "failed".
   */
  copy: (source: CopySource, write?: CopyWriter) => Promise<boolean>;
  /**
   * Moves the state without copying, for a caller whose copy happens elsewhere (a `CopyButton` reporting through
   * `onCopy` and `onCopyError`).
   */
  report: (result: Exclude<CopyState, "idle">) => void;
  /** Back to quiet at once, and no longer after the timer. */
  reset: () => void;
};

export function useCopy({ resetAfter = 1600, onCopied, onError }: UseCopyOptions = {}): UseCopyResult {
  const [status, dispatch] = useReducer(copyState, "idle");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const copied = useRef(onCopied);
  const failed = useRef(onError);
  copied.current = onCopied;
  failed.current = onError;
  useEffect(() => () => clearTimeout(timer.current), []);
  const reset = useCallback(() => {
    clearTimeout(timer.current);
    dispatch({ type: "reset" });
  }, []);
  const report = useCallback(
    (result: Exclude<CopyState, "idle">) => {
      clearTimeout(timer.current);
      dispatch({ type: "settled", result });
      // A failure stays until something else happens: it is news the caller has to show.
      if (result === "copied") timer.current = setTimeout(() => dispatch({ type: "reset" }), resetAfter);
    },
    [resetAfter],
  );
  const copy = useCallback(
    async (source: CopySource, write?: CopyWriter) => {
      try {
        const text = typeof source === "function" ? await source() : source;
        if (write) await write(text);
        else await writeClipboard(text);
        report("copied");
        copied.current?.(text);
        return true;
      } catch (error) {
        report("failed");
        failed.current?.(error);
        return false;
      }
    },
    [report],
  );
  return { status, copy, report, reset };
}
