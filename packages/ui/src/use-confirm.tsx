"use client";
// Origin: Fabrials, 0.8 (a confirm that can be awaited; Open Email keeps window.confirm for flows that cannot wait).

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ConfirmDialog, type ConfirmFinalFocus } from "./confirm-dialog";

export type ConfirmOptions = {
  title: ReactNode;
  description?: ReactNode;
  /** Optional list of the affected records, above the buttons. */
  details?: ReactNode;
  confirmLabel?: ReactNode;
  cancelLabel?: ReactNode;
  /** The confirm button uses the destructive variant. */
  destructive?: boolean;
  /**
   * Plain text for `window.confirm` (no provider, or a title that is not a string). When it is left out the string
   * parts of `title` and `description` are joined; a node with no text falls back to "Are you sure?".
   */
  fallbackText?: string;
  /** Where focus lands when the dialog closes. By default: the element that was focused when `confirm` was called. */
  finalFocus?: ConfirmFinalFocus;
};

export type ConfirmFunction = (options: ConfirmOptions) => Promise<boolean>;

type Entry = {
  id: number;
  options: ConfirmOptions;
  resolve: (value: boolean) => void;
  opener: HTMLElement | null;
  confirmed: boolean;
};

function plainText(options: ConfirmOptions) {
  if (options.fallbackText) return options.fallbackText;
  const parts = [options.title, options.description]
    .filter((part): part is string | number => typeof part === "string" || typeof part === "number")
    .map(String);
  return parts.join("\n\n") || "Are you sure?";
}

/** Without a provider, or on the server, the browser's own confirm answers; with no window there is nobody to ask. */
const windowConfirm: ConfirmFunction = (options) => {
  if (typeof window === "undefined" || typeof window.confirm !== "function") return Promise.resolve(false);
  return Promise.resolve(window.confirm(plainText(options)));
};

const ConfirmContext = createContext<ConfirmFunction | null>(null);

/**
 * Mount once near the root. `useConfirm()` below then opens a `ConfirmDialog` and resolves the promise: `true` when the
 * person confirms, `false` for Cancel, Escape, the backdrop or an unmounted provider. A second question asked while one
 * is open waits its turn and is shown in a fresh dialog (its own focus, starting on Cancel, and its own outcome), so a
 * stray second press cannot confirm it. Focus returns to the element that was focused when `confirm` was called (a control that is gone
 * falls back to Base UI's default).
 */
export function ConfirmProvider({ children }: { children?: ReactNode }) {
  const active = useRef<Entry | null>(null);
  const queue = useRef<Entry[]>([]);
  const [shown, setShown] = useState<Entry | null>(null);
  const [open, setOpen] = useState(false);

  const counter = useRef(0);

  const settle = useCallback((from: Entry) => {
    const entry = active.current;
    // A dialog that is already gone (or replaced) cannot settle the question that took its place.
    if (!entry || entry !== from) return;
    active.current = null;
    entry.resolve(entry.confirmed);
    const next = queue.current.shift();
    if (next) {
      active.current = next;
      setShown(next);
    } else {
      setOpen(false);
    }
  }, []);

  const ask = useCallback<ConfirmFunction>((options) => {
    return new Promise<boolean>((resolve) => {
      const focused = typeof document === "undefined" ? null : document.activeElement;
      const entry: Entry = {
        id: (counter.current += 1),
        options,
        resolve,
        opener: focused instanceof HTMLElement && focused !== document.body ? focused : null,
        confirmed: false,
      };
      if (active.current) {
        queue.current.push(entry);
        return;
      }
      active.current = entry;
      setShown(entry);
      setOpen(true);
    });
  }, []);

  useEffect(
    () => () => {
      active.current?.resolve(false);
      active.current = null;
      for (const entry of queue.current) entry.resolve(false);
      queue.current = [];
    },
    [],
  );

  const options = shown?.options;
  const opener = shown?.opener ?? null;
  return (
    <ConfirmContext.Provider value={ask}>
      {children}
      {options ? (
        <ConfirmDialog
          key={shown?.id}
          open={open}
          onOpenChange={(next) => {
            if (!next && shown) settle(shown);
          }}
          title={options.title}
          description={options.description}
          details={options.details}
          confirmLabel={options.confirmLabel ?? "Confirm"}
          cancelLabel={options.cancelLabel}
          destructive={options.destructive}
          finalFocus={options.finalFocus ?? (() => (opener?.isConnected ? opener : null))}
          onConfirm={() => {
            if (shown && active.current === shown) shown.confirmed = true;
          }}
        />
      ) : null}
    </ConfirmContext.Provider>
  );
}

/**
 * `const confirm = useConfirm(); if (await confirm({ title: "Delete draft?", destructive: true })) remove();`
 * The function keeps its identity. Without a `ConfirmProvider` it is `window.confirm` (so a library can call it
 * unconditionally). Not for synchronous guards (back, forward, unload): those cannot wait for a dialog.
 */
export function useConfirm(): ConfirmFunction {
  return useContext(ConfirmContext) ?? windowConfirm;
}
