// Origin: Fabrials, 0.12 (from Radiant's ForeignText and lang-text). No directive and no hooks: it renders on the server.

import { cloneElement, createElement, Fragment, isValidElement, type ComponentProps, type ElementType, type ReactNode } from "react";
import { dirOf, scriptDirection } from "./bidi";

export type ForeignTextProps = Omit<ComponentProps<"bdi">, "dir" | "lang"> & {
  /** The BCP 47 tag of the fragment ("ar", "he", "es-MX"): a screen reader switches voice, a browser picks the font. */
  lang?: string;
  /** Default: the direction `lang` is written in; without `lang`, that of the first letter of a string child, else `auto`. */
  dir?: "ltr" | "rtl" | "auto";
  /** The element to render. Default `bdi`; any other still isolates, because it carries `dir`. */
  as?: ElementType;
};

/**
 * A word or a sentence in another language inside running text: isolated from the direction of the line around it (so its
 * punctuation cannot flip the sentence), set in its own direction and tagged with its language.
 */
export function ForeignText({ lang, dir, as: Tag = "bdi", children, ...props }: ForeignTextProps) {
  const direction = dir ?? (lang ? dirOf(lang) : ((typeof children === "string" ? scriptDirection(children) : undefined) ?? "auto"));
  return (
    <Tag data-slot="foreign-text" {...props} lang={lang} dir={direction}>
      {children}
    </Tag>
  );
}

/** Text whose language nobody knows (a name, a title, what a person typed): isolated, its direction found by the browser. */
export function Bdi({ dir = "auto", ...props }: ComponentProps<"bdi">) {
  return <bdi data-slot="bdi" {...props} dir={dir} />;
}

const PLACEHOLDER = /\{([A-Za-z_][\w.-]*)\}/g;

/**
 * A translated message with markup in it: each `{name}` is replaced by the node of that name, so a word of another
 * language keeps its `lang` and `dir` wherever the translation puts it. A string slot is wrapped in `<bdi>` (it comes from
 * outside the sentence); a placeholder with no slot stays as written. Returns keyed nodes, ready to render.
 */
export function interpolate(message: string, slots: Readonly<Record<string, ReactNode>>): ReactNode[] {
  const nodes: ReactNode[] = [];
  let at = 0;
  let count = 0;
  for (const match of message.matchAll(PLACEHOLDER)) {
    const name = match[1]!;
    if (!Object.hasOwn(slots, name)) continue;
    if (match.index > at) nodes.push(message.slice(at, match.index));
    at = match.index + match[0].length;
    const slot = slots[name];
    const key = `${name}:${count++}`;
    if (typeof slot === "string") nodes.push(slot ? createElement("bdi", { key }, slot) : null);
    else if (isValidElement(slot)) nodes.push(cloneElement(slot, { key }));
    else nodes.push(createElement(Fragment, { key }, slot));
  }
  if (at < message.length) nodes.push(message.slice(at));
  return nodes;
}
