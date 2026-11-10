// Synthetic files and an uploader that never leaves the page, for the composer stories. A test holds an upload in its hand,
// so progress, abort, retry and an answer that arrives late can all be watched; a page that has to look alive lets them
// finish by themselves.

export type UploadedFile = { id: string; name: string; url: string; mediaType: string };

// Two 24 x 24 pictures drawn as flat blocks (a harbour at dusk and a scanned page), small enough to sit in this file.
const HARBOUR =
  "iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAIAAABvFaqvAAACQElEQVR42u3QMauYMBQFYH9IZxGRYCQYuRgJRoIRERHHDBkyZMiQIUOGDPnpr6Vduva9oYXCGe5dPg6nqpFukG6R7pBGSPdID0gTpEekJ6QB6RnpBWmO9Ir0hrREekf6QPpE+kL6RvpB+kW6qrFpsGmx6bBB2PTYDNgQbEZsJmwAmxmbBRuOzYrNho3EZsfmwObE5sLmxubB5sWmqoltiG2J7YhFxPbEDsQSYkdiJ2KB2JnYhVhO7ErsRqwkdif2IPYk9iL2JvYh9iW2qqlrqGup66hD1PXUDdQR6kbqJuqAupm6hTpO3UrdRp2kbqfuoO6k7qLupu6h7qWuqsE34FvwHXgEvgc/gCfgR/ATeAA/g1/Ac/Ar+A28BL+DP8Cf4C/wN/gH/Au+qlloWGhZ6FhALPQsDCwQFkYWJhaAhZmFhQXOwsrCxoJkYWfhYOFk4WLhZuFh4WWhqnlseGx57HhEPPY8DjwSHkceJx6Bx5nHhUfO48rjxqPkcefx4PHk8eLx5vHh8eWxqkVqRGpF6kRCIvUiDSIRkUaRJpFApFmkRSQu0irSJpIUaRfpEOkU6RLpFukR6RWpqmVuZG5l7mRGMvcyDzITmUeZJ5lB5lnmRWYu8yrzJrOUeZf5kPmU+ZL5lvmR+ZW5qlVpVGlV6VRBqvSqDKoQVUZVJlVAlVmVRRWuyqrKpopUZVflUOVU5VLlVuVR5VWlSiZ9Sf5C6Fu9fA8c7ufxx2/1JcoP6EuUX40+r/wGfbLa/7H/xbE/AG9P0QRKGgjWAAAAAElFTkSuQmCC";
const SCAN =
  "iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAIAAABvFaqvAAAALklEQVR42mM4d2wLBL14dAmCyBNhGHwGUagfLjIIDRqNtdFYG4210VgbjTUcIgANU4DM4ls/PQAAAABJRU5ErkJggg==";

const bytesOf = (base64: string) => Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));

/** A data URL of one of the two synthetic pictures, for a state shown at first paint. */
export function pngUrl(which: "harbour" | "scan" = "harbour") {
  return `data:image/png;base64,${which === "scan" ? SCAN : HARBOUR}`;
}

export function pngFile(name = "harbour.png", which: "harbour" | "scan" = "harbour") {
  return new File([bytesOf(which === "scan" ? SCAN : HARBOUR)], name, { type: "image/png" });
}

export function textFile(name = "notes.txt", body = "The harbour opens at nine.\nBring the list.\n") {
  return new File([body], name, { type: "text/plain" });
}

type Held = {
  name: string;
  mediaType: string;
  signal: AbortSignal;
  progress: (value: number) => void;
  resolve: (value: UploadedFile) => void;
  reject: (error: unknown) => void;
};

export type ComposerBench = {
  /** Every call the uploader was given, in the order it was asked, by file name. */
  calls: string[];
  /** How many uploads it saw in flight, and the most it ever saw at once. */
  inFlight: number;
  most: number;
  /** The files whose upload was given up, by name. */
  aborted: string[];
  /** Whether an upload finishes by itself (a page that has to look alive) or waits for the test. */
  auto: boolean;
  held: Held[];
  /** Lets every upload of that name go, or every held one. */
  release: (name?: string) => void;
  fail: (name: string, message?: string) => void;
  progress: (name: string, value: number) => void;
  answered: UploadedFile[];
};

declare global {
  interface Window {
    __composerBench?: ComposerBench;
  }
}

let made = 0;

/** What the uploader answers: a name key, a number that only counts, and no network. */
function answered(name: string, mediaType: string): UploadedFile {
  made += 1;
  return { id: `up-${made}`, name, url: `https://files.example.test/${name}`, mediaType };
}

export function composerBench(): ComposerBench {
  if (window.__composerBench) return window.__composerBench;
  const bench: ComposerBench = {
    calls: [],
    inFlight: 0,
    most: 0,
    aborted: [],
    auto: true,
    held: [],
    answered: [],
    release: (name) => {
      const letting = name ? bench.held.filter((held) => held.name === name).slice(0, 1) : [...bench.held];
      for (const held of letting) {
        bench.held.splice(bench.held.indexOf(held), 1);
        const file = answered(held.name, held.mediaType);
        bench.answered.push(file);
        held.resolve(file);
      }
    },
    fail: (name, message = "The upload was refused by the server.") => {
      const at = bench.held.findIndex((held) => held.name === name);
      if (at < 0) return;
      const [held] = bench.held.splice(at, 1);
      held!.reject(new Error(message));
    },
    progress: (name, value) => {
      bench.held.find((held) => held.name === name)?.progress(value);
    },
  };
  window.__composerBench = bench;
  return bench;
}

/** The host's uploader: it counts, it can be held, and it says what it was given. */
export function fakeUpload(file: File, { signal, onProgress }: { signal: AbortSignal; onProgress: (value: number) => void }) {
  const bench = composerBench();
  bench.calls.push(file.name);
  bench.inFlight += 1;
  bench.most = Math.max(bench.most, bench.inFlight);
  const settle = () => {
    bench.inFlight = Math.max(0, bench.inFlight - 1);
  };
  return new Promise<UploadedFile>((resolve, reject) => {
    signal.addEventListener("abort", () => {
      bench.aborted.push(file.name);
      settle();
      reject(new DOMException("The upload was given up.", "AbortError"));
    });
    if (bench.auto) {
      onProgress(0.25);
      window.setTimeout(() => {
        onProgress(0.8);
        window.setTimeout(() => {
          settle();
          const answer = answered(file.name, file.type || "application/octet-stream");
          bench.answered.push(answer);
          resolve(answer);
        }, 260);
      }, 160);
      return;
    }
    bench.held.push({
      name: file.name,
      mediaType: file.type || "application/octet-stream",
      signal,
      progress: onProgress,
      resolve: (answer) => {
        settle();
        resolve(answer);
      },
      reject: (error) => {
        settle();
        reject(error);
      },
    });
  });
}
