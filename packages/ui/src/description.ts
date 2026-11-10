// Origin: Fabrials, 0.12. What a panel says beside a control, read from its React children: the words it holds, whether
// anything in it can be used with the keyboard, and whether it only tells the control's own name again. A screen reader
// hears a description after the name, so a panel that repeats the name would be read twice and a panel that is a place of
// its own (a link, a form) is not a description at all.

import { isValidElement, type ReactNode } from "react";

export type Panel = {
  /** The words of the panel, with icons, shortcuts and `aria-hidden` parts left out. Empty when its words are not visible from here. */
  text: string;
  /** Whether something inside answers the keyboard: a preview with a link or a key is a place, not a description. */
  interactive: boolean;
};

/** The longest panel a description may repeat: beyond it the reader is told a paragraph after every Tab. */
export const DESCRIPTION_LIMIT = 200;

// Host elements a person can operate. A wrapper written elsewhere may render one and cannot be seen into.
const OPERABLE = new Set(["a", "button", "input", "select", "textarea", "details", "summary", "audio", "video"]);

function isHidden(props: Record<string, unknown>): boolean {
  return props["aria-hidden"] === true || props["aria-hidden"] === "true";
}

function reads(node: ReactNode, words: string[], panel: Panel) {
  if (node === null || node === undefined || typeof node === "boolean") return;
  if (typeof node === "string" || typeof node === "number") {
    words.push(String(node));
    return;
  }
  if (Array.isArray(node)) {
    for (const child of node) reads(child, words, panel);
    return;
  }
  if (!isValidElement(node)) return;
  const props = node.props as Record<string, unknown>;
  if (isHidden(props)) return;
  // A shortcut's keys are not a description: the control says them in `aria-keyshortcuts`.
  if (node.type === "kbd") return;
  const children = props.children as ReactNode;
  // A component's output is not known here, and reading it would mean guessing.
  if (typeof node.type === "function" || typeof node.type === "object") return;
  if (OPERABLE.has(String(node.type)) || props.onClick !== undefined || props.href !== undefined) panel.interactive = true;
  reads(children, words, panel);
}

/** What a panel holds, read from its children. `undefined` when nothing readable is there to describe. */
export function panelOf(children: ReactNode): Panel | undefined {
  const panel: Panel = { text: "", interactive: false };
  const words: string[] = [];
  reads(children, words, panel);
  const text = words.join(" ").replace(/\s+/g, " ").trim();
  if (!text && !panel.interactive) return undefined;
  return { text, interactive: panel.interactive };
}

function plain(text: string): string {
  // Punctuation does not make two names different: "Jump to message 3 of 6: the plan" and "Message 3 of 6 the plan" say one thing.
  return text
    .toLocaleLowerCase("en")
    .replace(/[\p{P}\p{S}]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Whether a panel only tells the control's own name (in any part of it): hearing it again says nothing new. */
export function repeatsName(name: string | undefined, panel: Panel | undefined): boolean {
  if (!name || !panel || !panel.text) return false;
  const name_ = plain(name);
  const text = plain(panel.text);
  return name_.length > 0 && text.length > 0 && name_.includes(text);
}

/**
 * The name a control answers to: its `aria-label`, else the words it shows. `undefined` when it is named elsewhere
 * (`aria-labelledby`), which this module cannot read; the render element of a Base UI trigger is read first because the
 * label is usually on it.
 */
export function controlName(...sources: Array<Record<string, unknown> | undefined>): string | undefined {
  for (const source of sources) {
    if (!source) continue;
    if (source["aria-labelledby"] !== undefined) return undefined;
    const label = source["aria-label"];
    if (typeof label === "string" && label.trim()) return label.trim();
  }
  for (const source of sources) {
    const panel = source ? panelOf(source.children as ReactNode) : undefined;
    if (panel?.text) return panel.text;
  }
  return undefined;
}

/**
 * Whether a tooltip should describe its trigger. A tooltip that repeats the control's name adds nothing a screen reader
 * does not already say (the icon keys of this library are named by `aria-label` and their tooltip repeats it), and one
 * whose words cannot be read from here is left out rather than guessed at.
 */
export function describesControl(name: string | undefined, panel: Panel | undefined, override?: boolean): boolean {
  if (override !== undefined) return override;
  if (!panel) return false;
  return !panel.interactive && !repeatsName(name, panel);
}

/**
 * Whether a preview card should describe its trigger. Only short text that nothing can be done with: WAI-ARIA asks a
 * description to be a brief text, and a preview holding a link is a place whose content must also be reachable another
 * way (the trigger's own link, or the page it announces).
 */
export function describesPreview(name: string | undefined, panel: Panel | undefined, override?: boolean): boolean {
  if (override !== undefined) return override;
  if (!panel || panel.interactive || !panel.text) return false;
  if (panel.text.length > DESCRIPTION_LIMIT) return false;
  return !repeatsName(name, panel);
}
