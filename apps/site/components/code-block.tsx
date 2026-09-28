"use client";
import { CodePanel, PackageInstall } from "@fabrials/ui";

const LANGUAGES: Record<string, string> = {
  typescript: "ts",
  ts: "ts",
  tsx: "tsx",
  javascript: "js",
  js: "js",
  json: "json",
  css: "css",
  html: "html",
  bash: "bash",
  sh: "bash",
  shell: "bash",
  terminal: "bash",
};

/**
 * The site's code sample: a single `npx …` command becomes a PackageInstall
 * (npm, pnpm, yarn, bun); anything else a CodePanel titled with its file name.
 */
export function CodeBlock({
  code,
  label = "Terminal",
  variant = "code",
  language,
  title,
}: {
  code: string;
  /** The file name or language shown in the bar. */
  label?: string;
  variant?: "command" | "code";
  language?: string;
  title?: string;
}) {
  const text = code.trim();
  const shell = variant === "command" || /^(terminal|bash|sh|shell)$/i.test(label);
  if (shell) {
    const npx = /^npx (\S[^\n]*)$/.exec(text);
    if (npx) return <PackageInstall command={npx[1]!} />;
    return (
      <CodePanel code={text} language={language ?? "bash"} title={title ?? (/^(terminal|bash|sh|shell)$/i.test(label) ? "Terminal" : label)} />
    );
  }
  const lang = language ?? LANGUAGES[label.toLowerCase()] ?? (text.startsWith("{") ? "json" : "tsx");
  return <CodePanel code={code.replace(/\n$/, "")} language={lang} title={title ?? label} lineNumbers={text.split("\n").length > 8} />;
}
