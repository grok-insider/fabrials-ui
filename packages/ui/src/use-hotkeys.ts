"use client";
// Origin: Fabrials, 0.12 (one guard set for the key handlers Radiant's lesson screens each wrote by hand).

import { useEffect, useRef, type RefObject } from "react";
import { HOTKEY_CONTROLS, isControlTarget, isTypingTarget, matchHotkey } from "./hotkeys";

export type HotkeyHandler = (event: KeyboardEvent) => void;

export type HotkeyBinding = {
  handler: HotkeyHandler;
  /** Fire again and again while the key is held (a stepper, a seek). Default: the opposite of the hook's `ignoreRepeat`. */
  repeat?: boolean;
  /** Fire while a field has focus (Escape, a chord such as "mod+k"). Default: the opposite of `ignoreWhenTyping`. */
  whenTyping?: boolean;
  /** Enter and Space only: fire even when a button or a link has focus. Default: the opposite of `ignoreOnControls`. */
  onControls?: boolean;
  preventDefault?: boolean;
};

/** Hotkeys ("Enter", "Space", "1", "ArrowLeft", "mod+k", "shift+?") and what each does. A falsy entry is off. */
export type HotkeyMap = Record<string, HotkeyHandler | HotkeyBinding | null | undefined | false>;

export type UseHotkeysOptions = {
  enabled?: boolean;
  /** `"document"` (default): from anywhere on the page. A ref: only while focus is inside that element. */
  scope?: RefObject<Element | null> | "document";
  /** A held key fires once. Default true. */
  ignoreRepeat?: boolean;
  /** Keys pressed in a field are typing. Default true. */
  ignoreWhenTyping?: boolean;
  /**
   * Enter and Space pressed on a button, a link or another control are that control's. Default true (`HOTKEY_CONTROLS`);
   * a string is your own selector of the controls to leave alone.
   */
  ignoreOnControls?: boolean | string;
  /** Stop the browser's own action for a key that fired (Space scrolling the page). Default true. */
  preventDefault?: boolean;
};

const ISLAND = '[data-hotkeys="off"]';

/**
 * Keyboard shortcuts for a screen, with the guards every one of them needs: a key is ignored while text is composed
 * (IME), when something already handled it, with a modifier the hotkey does not list, while it repeats, while a field has
 * focus, on a control that uses Enter or Space itself, outside `scope`, and anywhere inside `[data-hotkeys="off"]`. The
 * handlers are always the latest ones, so they may close over state.
 */
export function useHotkeys(map: HotkeyMap, options: UseHotkeysOptions = {}): void {
  const latest = useRef({ map, options });
  useEffect(() => {
    latest.current = { map, options };
  });
  const enabled = options.enabled ?? true;
  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.isComposing || event.keyCode === 229 || event.defaultPrevented) return;
      const { map, options } = latest.current;
      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest(ISLAND)) return;
      if (options.scope && options.scope !== "document") {
        const root = options.scope.current;
        if (!root || !target || !root.contains(target)) return;
      }
      // Inside a shadow root the event is retargeted to its host; the field is the first node of the path.
      const origin = event.composedPath()[0];
      const focused = origin instanceof Element ? origin : target;
      for (const combo of Object.keys(map)) {
        const entry = map[combo];
        if (!entry || !matchHotkey(event, combo)) continue;
        const binding = typeof entry === "function" ? { handler: entry } : entry;
        if (!(binding.whenTyping ?? options.ignoreWhenTyping === false) && isTypingTarget(focused)) return;
        const controls = options.ignoreOnControls ?? true;
        if ((event.key === "Enter" || event.key === " ") && !(binding.onControls ?? controls === false)) {
          if (isControlTarget(focused, typeof controls === "string" ? controls : HOTKEY_CONTROLS)) return;
        }
        if (binding.preventDefault ?? options.preventDefault ?? true) event.preventDefault();
        if (event.repeat && !(binding.repeat ?? options.ignoreRepeat === false)) return;
        binding.handler(event);
        return;
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [enabled]);
}
