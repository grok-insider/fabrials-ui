"use client";
// Origin: Radiant's theme provider (the behaviour only). 0.12.

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
  type ReactNode,
  type RefObject,
} from "react";
import { themeConfig, themeRuntime, type ResolvedTheme, type ThemeOptions } from "./theme-script";
import type { ThemePreference } from "./toggle-group";

export type ThemeContextValue = {
  /** What the person chose. */
  theme: ThemePreference;
  /** What is painted: "system" settled by the device's colour scheme. "light" on a server when the choice is "system". */
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const SCHEME = "(prefers-color-scheme: dark)";

// A choice made in this tab is told to every provider here; the browser's `storage` event tells the other tabs.
const listeners = new Set<() => void>();
// Where storage refuses the write (private mode, a full quota) the choice lives here, so the theme still changes.
const memory = new Map<string, ThemePreference>();

function subscribeToScheme(onChange: () => void) {
  const media = window.matchMedia(SCHEME);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}
const subscribeToNothing = () => () => {};
const systemIsDark = () => window.matchMedia(SCHEME).matches;

/** Turns transitions off until the new theme has been painted, so a page does not cross-fade colour by colour. */
function withoutTransitions() {
  const style = document.createElement("style");
  style.appendChild(document.createTextNode("*,*::before,*::after{transition:none!important}"));
  document.head.appendChild(style);
  return () => {
    void window.getComputedStyle(document.body).opacity;
    window.setTimeout(() => style.remove(), 1);
  };
}

export type ThemeProviderProps = ThemeOptions & {
  children?: ReactNode;
  /** No transition runs while the theme changes. */
  disableTransitionOnChange?: boolean;
  /** The element that carries the theme instead of `<html>`: a preview, an embedded island. */
  target?: RefObject<HTMLElement | null>;
};

/**
 * Owns the theme choice: reads it from `localStorage` outside render, keeps every tab in step, follows the device while
 * the choice is "system", and applies it to the root (the class or `data-theme`, `color-scheme`, `theme-color`). A server
 * renders `defaultTheme`; pair it with `themeInitScript` in `<head>` so the stored choice is painted first.
 */
export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey,
  attribute,
  themeColor,
  disableTransitionOnChange = false,
  target,
}: ThemeProviderProps) {
  const light = themeColor?.light;
  const dark = themeColor?.dark;
  const config = useMemo(
    () => themeConfig({ defaultTheme, storageKey, attribute, themeColor: light !== undefined && dark !== undefined ? { light, dark } : undefined }),
    [defaultTheme, storageKey, attribute, light, dark],
  );
  const key = config.storageKey;

  const subscribe = useCallback(
    (onChange: () => void) => {
      const onStorage = (event: StorageEvent) => {
        if (event.key !== null && event.key !== key) return;
        memory.delete(key);
        onChange();
      };
      listeners.add(onChange);
      window.addEventListener("storage", onStorage);
      return () => {
        listeners.delete(onChange);
        window.removeEventListener("storage", onStorage);
      };
    },
    [key],
  );
  const theme = useSyncExternalStore(
    subscribe,
    () => themeRuntime(window, config, memory.get(key), null, true).theme,
    () => defaultTheme,
  );
  const systemDark = useSyncExternalStore(theme === "system" ? subscribeToScheme : subscribeToNothing, systemIsDark, () => false);
  const resolvedTheme: ResolvedTheme = theme === "system" ? (systemDark ? "dark" : "light") : theme;

  const applied = useRef(false);
  useLayoutEffect(() => {
    const root = target ? target.current : null;
    if (target && !root) return;
    const restore = disableTransitionOnChange && applied.current ? withoutTransitions() : null;
    themeRuntime(window, config, theme, root);
    applied.current = true;
    restore?.();
  }, [config, theme, systemDark, target, disableTransitionOnChange]);

  const setTheme = useCallback(
    (next: ThemePreference) => {
      if (next !== "light" && next !== "dark" && next !== "system") return;
      try {
        window.localStorage.setItem(key, next);
        memory.delete(key);
      } catch {
        memory.set(key, next);
      }
      for (const listener of [...listeners]) listener();
    },
    [key],
  );

  const value = useMemo(() => ({ theme, resolvedTheme, setTheme }), [theme, resolvedTheme, setTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/** The theme choice of the nearest `ThemeProvider`. `ThemeSwitcher` takes it as is: `value={theme} onValueChange={setTheme}`. */
export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("useTheme must be used inside a ThemeProvider");
  return value;
}
