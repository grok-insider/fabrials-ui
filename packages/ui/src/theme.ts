export type DocumentTheme = "light" | "dark";

const SCHEME = "(prefers-color-scheme: dark)";

function systemTheme(): DocumentTheme {
  return typeof matchMedia === "function" && matchMedia(SCHEME).matches ? "dark" : "light";
}

/**
 * The theme an element is painted in: the nearest ancestor that names one wins (`.dark`, `.light`, `data-theme="dark"`,
 * `"light"` or `"system"`, which follows the operating system), then light. The same rules as tokens.css.
 */
export function themeOf(element: Element | null): DocumentTheme {
  const holder = element?.closest('.dark, .light, [data-theme="dark"], [data-theme="light"], [data-theme="system"]');
  if (!holder) return "light";
  if (holder.classList.contains("dark")) return "dark";
  if (holder.classList.contains("light")) return "light";
  const named = holder.getAttribute("data-theme");
  return named === "system" ? systemTheme() : named === "dark" ? "dark" : "light";
}

export function documentTheme(): DocumentTheme {
  return typeof document === "undefined" ? "light" : themeOf(document.documentElement);
}

/** Calls back when the root's class or data-theme changes, or when the system scheme does. */
export function subscribeDocumentTheme(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-theme"] });
  const media = typeof matchMedia === "function" ? matchMedia(SCHEME) : null;
  media?.addEventListener("change", onChange);
  return () => {
    observer.disconnect();
    media?.removeEventListener("change", onChange);
  };
}
