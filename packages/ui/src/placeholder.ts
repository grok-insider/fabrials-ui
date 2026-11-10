// Placeholder data for skeletons: no directive, so a Server Component can build the rows it wraps in `Loading`.
// Still exported from "./loading".

// Word lengths that wrap like English UI copy; deterministic so the server and
// the browser render the same placeholder.
const WORDS = [5, 3, 7, 4, 9, 2, 6, 4, 8, 3, 5, 6, 3, 7, 4, 5];

/**
 * Placeholder copy of about `length` characters for a skeleton. Invisible in
 * the skeleton; only its length and word breaks matter, so lines wrap like the
 * real text will. Pass a `seed` for variety between rows.
 */
export function placeholderText(length: number, seed = 0): string {
  let text = "";
  for (let i = 0; text.length < length; i += 1) {
    const size = WORDS[(i + seed) % WORDS.length]!;
    text += (text ? " " : "") + "x".repeat(size);
  }
  return text.slice(0, Math.max(0, length));
}

/** `count` placeholder records built by `make`, for lists and tables while their data loads. */
export function placeholderList<T>(count: number, make: (index: number) => T): T[] {
  return Array.from({ length: Math.max(0, count) }, (_, index) => make(index));
}
