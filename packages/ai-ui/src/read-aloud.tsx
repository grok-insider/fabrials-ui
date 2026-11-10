"use client";
// Origin: Fabrials, 0.12, from Radiant's read-aloud action: the answer's words as sound, the host's voices a chunk at a
// time, the browser's when there is no loader. The reader itself is the library's `useSpeech`.

import type { ReactNode } from "react";
import { Spinner, useHydrated, useSpeech, speakableText, type Speech, type SpeechClipLoader } from "@fabrials/ui";
import { MessageAction } from "./chat-message";

// Lucide (ISC, lucide.dev) path data, copied so @fabrials/ai-ui stays free of an icon dependency.
function icon(paths: ReactNode) {
  return function Icon() {
    return (
      <svg aria-hidden="true" fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="16" xmlns="http://www.w3.org/2000/svg">
        {paths}
      </svg>
    );
  };
}

const VolumeIcon = icon(
  <>
    <path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z" />
    <path d="M16 9a5 5 0 0 1 0 6" />
    <path d="M19.364 18.364a9 9 0 0 0 0-12.728" />
  </>,
);

const VolumeOffIcon = icon(
  <>
    <path d="M11 4.702a.7.7 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.7.7 0 0 0 11 19.298z" />
    <path d="m16.5 14.5 5-5" />
    <path d="m16.5 9.5 5 5" />
  </>,
);

function canSpeak() {
  return typeof window !== "undefined" && "speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined";
}

export type ReadAloudLabels = {
  /** The action's name while nothing is read. */
  read?: string;
  /** The action's name while it reads: the same key stops it. */
  stop?: string;
};

export type ReadAloudActionProps = {
  /** The answer as markdown: read as plain words, without code, maths or marks. */
  text: string;
  /** The language of the text, for the loader and the browser's own voice. */
  lang?: string;
  /** The host's voices. Without one the browser's voice reads, when it has one. */
  loadClip?: SpeechClipLoader;
  labels?: ReadAloudLabels;
  /** One reader for several answers, or a fixed one for a bench. By default each action has its own. */
  speech?: Speech;
  /** What is being read, for the cache and for the reader's `currentId`. */
  id?: string;
  className?: string;
};

/**
 * Reads an answer aloud: the same key reads and stops, pressed while it sounds, with a spinner while the first piece loads.
 * One reader sounds at a time on the page, so a second key stops the first. Nothing is drawn in a browser that cannot speak
 * when the host brings no loader, so there is never a key that does nothing.
 */
export function ReadAloudAction({ text, lang, loadClip, labels, speech, id = "read-aloud", className }: ReadAloudActionProps) {
  const hydrated = useHydrated();
  const own = useSpeech({ loadClip, lang });
  const reader = speech ?? own;
  if (!hydrated && loadClip === undefined && speech === undefined) return null;
  if (loadClip === undefined && speech === undefined && !canSpeak()) return null;
  const reading = reader.speaking;
  const name = reading ? (labels?.stop ?? "Stop reading") : (labels?.read ?? "Read aloud");
  const toggle = () => {
    if (reading) {
      reader.stop();
      return;
    }
    void reader.speak(speakableText(text), { id });
  };
  return (
    <MessageAction aria-pressed={reading} className={className} data-reading={reading ? "" : undefined} label={name} onClick={toggle}>
      {reader.loading ? (
        <Spinner aria-hidden label="" role="presentation" />
      ) : reading ? (
        <VolumeOffIcon />
      ) : (
        <VolumeIcon />
      )}
    </MessageAction>
  );
}
