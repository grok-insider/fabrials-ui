/**
 * What a title renamed in place does with the text it was left: the one decision that keeps a commit from calling the host
 * for nothing. Pure and server-safe; `EditableText` is the component.
 */

export type EditableCommit = { kind: "unchanged" } | { kind: "empty" } | { kind: "commit"; value: string };

/**
 * The decision for `draft` against the `current` value: whitespace is trimmed, a string that trims to nothing is empty, and
 * one that already reads as the current text is no change.
 */
export function commitDecision(draft: string, current: string): EditableCommit {
  const value = draft.trim();
  if (!value) return { kind: "empty" };
  if (value === current) return { kind: "unchanged" };
  return { kind: "commit", value };
}
