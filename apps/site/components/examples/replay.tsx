"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@fabrials/ui";

export type Frame<T> = { at: number; state: T };

/**
 * Plays a scripted sequence of states, as a stream would deliver them: each frame lands `at` milliseconds after the start.
 * `replay` starts it again; `done` is true once the last frame has landed. A demo that plays this way shows the component
 * as people see it, arriving piece by piece.
 */
export function useScript<T>(frames: readonly Frame<T>[], { autoplay = true }: { autoplay?: boolean } = {}) {
  const [index, setIndex] = useState(autoplay ? 0 : frames.length - 1);
  const [run, setRun] = useState(autoplay ? 1 : 0);
  const timers = useRef<number[]>([]);
  useEffect(() => {
    if (run === 0) return;
    const pending = timers.current;
    frames.forEach((frame, i) => {
      pending.push(window.setTimeout(() => setIndex(i), frame.at));
    });
    return () => {
      for (const timer of pending) window.clearTimeout(timer);
      pending.length = 0;
    };
  }, [frames, run]);
  const replay = useCallback(() => {
    setIndex(0);
    setRun((value) => value + 1);
  }, []);
  return { state: frames[index]!.state, replay, done: index === frames.length - 1, run };
}

export function ReplayButton({ onClick, label = "Replay" }: { onClick: () => void; label?: string }) {
  return (
    <Button onClick={onClick} size="sm" variant="ghost">
      <RotateCcw aria-hidden="true" /> {label}
    </Button>
  );
}
