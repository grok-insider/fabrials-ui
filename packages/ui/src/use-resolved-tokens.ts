"use client";
// Origin: Fabrials, 0.12 (from Radiant's renderer theme).

import { useCallback, useRef, useSyncExternalStore, type RefObject } from "react";
import { resolveColor } from "./resolve-color";
import { subscribeDocumentTheme, themeOf, type DocumentTheme } from "./theme";

/** The six series colours, in order. */
export const CHART_TOKENS = ["--chart-1", "--chart-2", "--chart-3", "--chart-4", "--chart-5", "--chart-6"] as const;

export type ResolvedTokens<Name extends string = string> = {
  theme: DocumentTheme;
  /** Each name that resolved to a colour, as `#rrggbb` (`#rrggbbaa` when it is not opaque). Empty on the server. */
  colors: Readonly<Partial<Record<Name, string>>>;
  /** The font stacks, ready for a canvas or an SVG attribute. Empty on the server. */
  fontSans: string;
  fontMono: string;
};

const SERVER: ResolvedTokens<never> = { theme: "light", colors: {}, fontSans: "", fontMono: "" };

const MEDIA = ["(forced-colors: active)", "(prefers-contrast: more)"];

type Cache<Name extends string> = { key: string; element: Element; signature: string; value: ResolvedTokens<Name> };

/**
 * Tokens as plain values, for what cannot read a custom property: a canvas, a chart library, a diagram renderer. `names`
 * are custom properties ("--chart-1") or any CSS colour. They are resolved for `ref`'s element (default: the page's root),
 * so a part of the page with its own theme gets its own colours, and again when the theme, the system scheme or a style
 * above the element changes. The object keeps its identity until a value really changes.
 */
export function useResolvedTokens<Name extends string>(names: readonly Name[], ref?: RefObject<Element | null>): ResolvedTokens<Name> {
  const cache = useRef<Cache<Name> | null>(null);
  const stale = useRef(true);
  const key = names.join("\n");

  const subscribe = useCallback(
    (onChange: () => void) => {
      const changed = () => {
        stale.current = true;
        onChange();
      };
      // What changed between the render and now is read again once React re-checks the snapshot.
      stale.current = true;
      const stopTheme = subscribeDocumentTheme(changed);
      // A token can be set on any element above this one, by a class, an attribute or an inline style.
      const observer = new MutationObserver(changed);
      for (let node: Element | null = ref?.current ?? document.documentElement; node; node = node.parentElement) observer.observe(node, { attributes: true });
      const queries = typeof matchMedia === "function" ? MEDIA.map((query) => matchMedia(query)) : [];
      for (const query of queries) query.addEventListener("change", changed);
      return () => {
        stopTheme();
        observer.disconnect();
        for (const query of queries) query.removeEventListener("change", changed);
      };
    },
    [ref],
  );

  const getSnapshot = () => {
    const element = ref?.current ?? document.documentElement;
    const known = cache.current;
    if (known && !stale.current && known.element === element && known.key === key) return known.value;
    const style = getComputedStyle(element);
    const theme = themeOf(element);
    const colors: Partial<Record<Name, string>> = {};
    for (const name of names) {
      const color = resolveColor(name.startsWith("--") ? `var(${name})` : name, element);
      if (color) colors[name] = color;
    }
    const fontSans = style.getPropertyValue("--fui-font-sans").replace(/\s+/g, " ").trim() || style.fontFamily;
    const fontMono = style.getPropertyValue("--fui-font-mono").replace(/\s+/g, " ").trim() || "monospace";
    const signature = [theme, fontSans, fontMono, ...names.map((name) => colors[name] ?? "")].join("\n");
    stale.current = false;
    const value = known && known.key === key && known.signature === signature ? known.value : { theme, colors, fontSans, fontMono };
    cache.current = { key, element, signature, value };
    return value;
  };

  return useSyncExternalStore(subscribe, getSnapshot, () => SERVER);
}
