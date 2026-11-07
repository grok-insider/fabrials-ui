import type { ReactNode } from "react";

/** An example's description: plain text where `backticks` mark code. */
export function Prose({ text }: { text: string }): ReactNode {
  return text.split("`").map((part, index) => (index % 2 === 1 ? <code key={index}>{part}</code> : part));
}
