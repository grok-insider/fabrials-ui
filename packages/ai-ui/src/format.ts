// Pure helpers of the chat pieces: no hooks, no browser APIs, no directive, so a Server Component can call them. Each
// is still exported from the module of the component it belongs to.
import { formatBytes as formatLocalisedBytes } from "@fabrials/ui";

const EXTENSIONS: Record<string, string> = {
  bash: "sh",
  c: "c",
  cpp: "cpp",
  css: "css",
  diff: "diff",
  go: "go",
  golang: "go",
  html: "html",
  java: "java",
  javascript: "js",
  js: "js",
  json: "json",
  jsx: "jsx",
  kotlin: "kt",
  markdown: "md",
  md: "md",
  nix: "nix",
  patch: "patch",
  postgres: "sql",
  postgresql: "sql",
  python: "py",
  py: "py",
  ruby: "rb",
  rust: "rs",
  rs: "rs",
  sh: "sh",
  shell: "sh",
  sql: "sql",
  swift: "swift",
  toml: "toml",
  ts: "ts",
  tsx: "tsx",
  typescript: "ts",
  yaml: "yaml",
  yml: "yml",
  zig: "zig",
  zsh: "sh",
};

export function codeFilename(language: string | undefined, base = "snippet"): string {
  const key = (language ?? "").trim().toLowerCase();
  return `${base}.${EXTENSIONS[key] ?? "txt"}`;
}

export function hostnameFromUrl(value: string): string {
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return value;
  }
}

export function sourcePath(value: string): string {
  try {
    const { pathname, search } = new URL(value);
    const path = (pathname + search).replace(/\/+$/, "");
    if (!path) return "";
    try {
      return decodeURIComponent(path);
    } catch {
      return path;
    }
  } catch {
    return "";
  }
}

export function formatTokens(value: number): string {
  if (!Number.isFinite(value)) return "";
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${Math.round(value / 100_000) / 10}M`;
  if (abs >= 100_000) return `${Math.round(value / 1000)}k`;
  if (abs >= 1000) return `${Math.round(value / 100) / 10}k`;
  return String(Math.round(value));
}

const percents = new Map<string, Intl.NumberFormat>();

/** A whole percentage in the locale's form: "36%", "36 %", "٣٦٪". */
export function formatPercent(percent: number, locale: Intl.LocalesArgument = "en"): string {
  const key = Array.isArray(locale) ? locale.map(String).join(",") : String(locale ?? "en");
  let format = percents.get(key);
  if (!format) {
    format = new Intl.NumberFormat(locale ?? "en", { style: "percent", maximumFractionDigits: 0 });
    percents.set(key, format);
  }
  return format.format(percent / 100);
}

export type AttachmentCategory = "image" | "video" | "audio" | "document" | "unknown";

export function attachmentCategory(mediaType: string | undefined): AttachmentCategory {
  const type = mediaType ?? "";
  if (type.startsWith("image/")) return "image";
  if (type.startsWith("video/")) return "video";
  if (type.startsWith("audio/")) return "audio";
  if (type.startsWith("application/") || type.startsWith("text/")) return "document";
  return "unknown";
}

/**
 * A size for an attachment line: "" when the size is unknown. With a `locale` it is `formatBytes` of `@fabrials/ui`
 * (localised digits and unit labels); without one it keeps the English text it has always printed ("1.5 KB", "16 KB").
 *
 * @deprecated Use `formatBytes(locale, bytes)` from `@fabrials/ui`, which takes the locale first and throws on an invalid count.
 */
export function formatBytes(bytes: number | undefined, locale?: string): string {
  if (bytes === undefined || !Number.isFinite(bytes) || bytes < 0) return "";
  if (locale !== undefined) return formatLocalisedBytes(locale, bytes);
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value >= 10 ? Math.round(value) : Math.round(value * 10) / 10} ${units[unit]}`;
}
