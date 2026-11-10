import type { ThemePreference } from "./toggle-group";

/** The theme a preference comes to once "system" is settled. */
export type ResolvedTheme = "light" | "dark";

/** `class` sets `.dark` or `.light` on the root; `data-theme` sets the preference itself, so "system" keeps following in CSS. */
export type ThemeAttribute = "class" | "data-theme";

/** The colours of the browser's own chrome, written to `<meta name="theme-color">`. */
export type ThemeColor = { light: string; dark: string };

export type ThemeOptions = {
  /** Used when nothing valid is stored. */
  defaultTheme?: ThemePreference;
  /** The `localStorage` key. */
  storageKey?: string;
  attribute?: ThemeAttribute;
  themeColor?: ThemeColor;
};

export type ThemeConfig = {
  defaultTheme: ThemePreference;
  storageKey: string;
  attribute: ThemeAttribute;
  themeColor: ThemeColor | null;
};

export const THEME_STORAGE_KEY = "theme";

export function themeConfig({ defaultTheme = "system", storageKey = THEME_STORAGE_KEY, attribute = "class", themeColor }: ThemeOptions = {}): ThemeConfig {
  return { defaultTheme, storageKey, attribute, themeColor: themeColor ? { light: themeColor.light, dark: themeColor.dark } : null };
}

type ThemeNode = { setAttribute(name: string, value: string): void };
export type ThemeRoot = ThemeNode & {
  classList: { add(name: string): void; remove(name: string): void };
  style: { colorScheme: string };
};
/** As much of `window` as a theme needs, so the same function runs in a browser, in the pre-paint script and in a test. */
export type ThemeWindow = {
  localStorage: { getItem(key: string): string | null };
  matchMedia(query: string): { matches: boolean };
  document: {
    documentElement: ThemeRoot;
    head: { appendChild(node: never): unknown } | null;
    querySelector(selector: string): ThemeNode | null;
    createElement(tag: string): ThemeNode;
  };
};

/**
 * Settles a theme and applies it: the stored preference (or `chosen`, when the caller already knows it), "system" through
 * the colour scheme, then the class or attribute on the root, `color-scheme`, and `theme-color` when the config names one.
 * `readOnly` settles without touching the document.
 *
 * `ThemeProvider` calls it and `themeInitScript` ships its source text, so the two cannot drift. That is why it reads
 * nothing from this module: every value it needs is an argument.
 */
export function themeRuntime(
  win: ThemeWindow,
  config: ThemeConfig,
  chosen?: string | null,
  root?: ThemeRoot | null,
  readOnly?: boolean,
): { theme: ThemePreference; resolvedTheme: ResolvedTheme } {
  let theme: unknown = chosen;
  if (theme !== "light" && theme !== "dark" && theme !== "system") {
    // Private modes and sandboxed frames throw on the first touch of storage.
    try {
      theme = win.localStorage.getItem(config.storageKey);
    } catch {
      theme = null;
    }
  }
  if (theme !== "light" && theme !== "dark" && theme !== "system") theme = config.defaultTheme;
  let dark = theme === "dark";
  if (theme === "system") {
    try {
      dark = win.matchMedia("(prefers-color-scheme: dark)").matches;
    } catch {
      dark = false;
    }
  }
  if (!readOnly) {
    const doc = win.document;
    const element = root || doc.documentElement;
    if (config.attribute === "class") {
      element.classList.remove(dark ? "light" : "dark");
      element.classList.add(dark ? "dark" : "light");
    } else element.setAttribute("data-theme", theme as string);
    element.style.colorScheme = dark ? "dark" : "light";
    if (config.themeColor) {
      let meta = doc.querySelector('meta[name="theme-color"]:not([media])');
      if (!meta && doc.head) {
        meta = doc.createElement("meta");
        meta.setAttribute("name", "theme-color");
        doc.head.appendChild(meta as never);
      }
      if (meta) meta.setAttribute("content", dark ? config.themeColor.dark : config.themeColor.light);
    }
  }
  return { theme: theme as ThemePreference, resolvedTheme: dark ? "dark" : "light" };
}

/**
 * The text of a small script that applies the stored theme before the first paint, so a page rendered for the default
 * theme does not flash. Put it in `<head>` as an inline script, after any `<meta name="theme-color">`, with the same
 * options as `ThemeProvider`:
 *
 * `<script dangerouslySetInnerHTML={{ __html: themeInitScript({ themeColor }) }} />`
 */
export function themeInitScript(options: ThemeOptions = {}): string {
  // "<" is escaped so no value can close the script element.
  const config = JSON.stringify(themeConfig(options)).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
  return `(function(){try{(${themeRuntime.toString()})(window,${config})}catch(e){}})()`;
}
