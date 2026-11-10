"use client";
// Origin: Fabrials, 0.12, from Radiant's read-aloud (the host's voices a chunk at a time, the browser's voice when there is none).

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { claimSound, releaseSound } from "./sound-bus";
import { matchVoice, speechChunks } from "./speech-text";

/** Renders one piece of text as sound: a `Blob`, or a URL the browser can play. */
export type SpeechClipLoader = (text: string, context: { lang?: string; rate: number; signal: AbortSignal }) => Promise<Blob | string>;

export type UseSpeechOptions = {
  /** The host's voices. Without it the browser's voice reads, when `fallback` allows it. */
  loadClip?: SpeechClipLoader;
  /** The language of the text (a BCP 47 tag): passed to the loader, and used to pick the browser's voice. */
  lang?: string;
  /** How fast to read, 1 being usual. The loader renders at this rate; the browser's voice is set to it. */
  rate?: number;
  /** What reads when there is no loader, or when it fails: the browser's own voice, or nothing. */
  fallback?: "browser" | "none";
  /** The longest piece the loader is asked for, in characters. */
  chunkSize?: number;
  /** The loader failed. `fallback` says whether the browser's voice took over. */
  onError?: (error: unknown, context: { fallback: boolean }) => void;
};

export type Speech = {
  /** Something is being read, or is on its way. */
  speaking: boolean;
  /** The next piece is still loading and nothing sounds yet. */
  loading: boolean;
  /** What is being read: the `id` given to `speak`. */
  currentId: string | null;
  speak: (text: string, options?: { id?: string }) => Promise<void>;
  stop: () => void;
};

// A piece the browser's own voice reads in one go: long utterances are cut off mid-sentence by some engines.
const BROWSER_CHUNK = 240;
const KEPT_CLIPS = 24;

function playUrl(audio: HTMLAudioElement, url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    audio.onended = () => resolve();
    audio.onerror = () => reject(audio.error ?? new Error("The clip could not be played."));
    audio.src = url;
    audio.play().catch(reject);
  });
}

function browserSpeak(text: string, lang: string | undefined, rate: number): Promise<void> {
  return new Promise((resolve) => {
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(text);
    if (lang) utterance.lang = lang;
    utterance.rate = rate;
    const voice = matchVoice(synth.getVoices(), lang);
    if (voice) utterance.voice = voice;
    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();
    synth.speak(utterance);
  });
}

const canSpeak = () => typeof window !== "undefined" && "speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined";

/**
 * Reads text aloud. With a loader it plays the host's clips a chunk at a time (the next one loads while one plays) and keeps
 * the last few, so "listen" twice loads once; their object URLs are revoked when they leave the cache and when the reader
 * goes. Without one, or when it fails, the browser's voice reads in the text's language. One reader at a time on the page:
 * it holds the sound bus, so a second reader, a clip, a player or the microphone stops it.
 */
export function useSpeech({ loadClip, lang, rate = 1, fallback = "browser", chunkSize = 1200, onError }: UseSpeechOptions = {}): Speech {
  const [now, setNow] = useState<{ id: string; loading: boolean } | null>(null);
  const [owner] = useState(() => ({}));
  const options = { loadClip, lang, rate, fallback, chunkSize, onError };
  const latest = useRef(options);
  useEffect(() => {
    latest.current = options;
  });
  const run = useRef(0);
  const audio = useRef<HTMLAudioElement | null>(null);
  const cancel = useRef<AbortController | null>(null);
  const clips = useRef(new Map<string, { url: Promise<string>; made: boolean; ready: boolean }>());
  const browser = useRef(false);

  const halt = useCallback(() => {
    run.current += 1;
    cancel.current?.abort();
    cancel.current = null;
    // A clip still loading was given up with the rest: the next reading asks for it afresh instead of waiting on a load that was cancelled.
    for (const [key, clip] of clips.current) if (!clip.ready) clips.current.delete(key);
    const element = audio.current;
    if (element) {
      element.onended = null;
      element.onerror = null;
      element.pause();
    }
    if (browser.current && canSpeak()) window.speechSynthesis.cancel();
    browser.current = false;
  }, []);

  const stop = useCallback(() => {
    halt();
    releaseSound(owner);
    setNow(null);
  }, [halt, owner]);

  const drop = useCallback((key: string) => {
    const clip = clips.current.get(key);
    if (!clip) return;
    clips.current.delete(key);
    if (clip.made) void clip.url.then((url) => URL.revokeObjectURL(url)).catch(() => undefined);
  }, []);

  useEffect(() => {
    const kept = clips.current;
    return () => {
      halt();
      releaseSound(owner);
      for (const key of [...kept.keys()]) drop(key);
    };
  }, [drop, halt, owner]);

  const clipFor = useCallback(
    (text: string, signal: AbortSignal): Promise<string> => {
      const { loadClip: load, lang: language, rate: speed } = latest.current;
      const key = `${language ?? ""}\u0000${speed}\u0000${text}`;
      const ready = clips.current.get(key);
      if (ready) {
        // Used again: it moves to the young end of the cache.
        clips.current.delete(key);
        clips.current.set(key, ready);
        return ready.url;
      }
      const entry = { url: Promise.resolve(""), made: false, ready: false };
      entry.url = Promise.resolve()
        .then(() => load!(text, { lang: language, rate: speed, signal }))
        .then((result) => {
          if (signal.aborted) throw new DOMException("The reading was stopped.", "AbortError");
          entry.ready = true;
          if (typeof result === "string") return result;
          entry.made = true;
          return URL.createObjectURL(result);
        });
      // A clip that did not load (or was given up) is asked for again next time.
      entry.url.catch(() => {
        if (clips.current.get(key) === entry) clips.current.delete(key);
      });
      clips.current.set(key, entry);
      for (const old of clips.current.keys()) {
        if (clips.current.size <= KEPT_CLIPS) break;
        if (old !== key) drop(old);
      }
      return entry.url;
    },
    [drop],
  );

  const speak = useCallback(
    async (text: string, { id = "speech" }: { id?: string } = {}) => {
      halt();
      const mine = run.current;
      const current = () => run.current === mine;
      const asked = latest.current;
      const readByBrowser = async (from: string) => {
        if (asked.fallback !== "browser" || !canSpeak()) return;
        browser.current = true;
        setNow({ id, loading: false });
        for (const piece of speechChunks(from, Math.min(asked.chunkSize, BROWSER_CHUNK))) {
          if (!current()) return;
          await browserSpeak(piece, asked.lang, asked.rate);
        }
      };
      // Whatever else sounds on the page stops, another reader included.
      claimSound(owner, stop);
      setNow({ id, loading: true });
      try {
        if (!asked.loadClip) {
          await readByBrowser(text);
          return;
        }
        const controller = new AbortController();
        cancel.current = controller;
        const chunks = speechChunks(text, asked.chunkSize);
        const element = (audio.current ??= new Audio());
        for (let at = 0; at < chunks.length; at += 1) {
          let url: string;
          try {
            url = await clipFor(chunks[at]!, controller.signal);
            if (!current()) return;
            // The next piece loads while this one plays, so the voice does not wait between them.
            if (at + 1 < chunks.length) void clipFor(chunks[at + 1]!, controller.signal).catch(() => undefined);
            setNow({ id, loading: false });
            await playUrl(element, url);
          } catch (error) {
            if (!current()) return;
            const takeOver = asked.fallback === "browser" && canSpeak();
            asked.onError?.(error, { fallback: takeOver });
            // The browser's voice carries on from the piece that failed, not from the top.
            if (takeOver) await readByBrowser(chunks.slice(at).join(" "));
            return;
          }
          if (!current()) return;
          if (at + 1 < chunks.length) setNow({ id, loading: true });
        }
      } finally {
        if (current()) {
          browser.current = false;
          releaseSound(owner);
          setNow(null);
        }
      }
    },
    [clipFor, halt, owner, stop],
  );

  return useMemo(
    () => ({ speaking: now !== null, loading: now?.loading ?? false, currentId: now?.id ?? null, speak, stop }),
    [now, speak, stop],
  );
}
