"use client";

import { useCallback, useEffect, useRef, useState, type HTMLAttributes, type ReactNode } from "react";
import { CheckIcon, CopyIcon, DownloadIcon } from "./chat-icons";

const EXTENSIONS: Record<string, string> = {
  bash: "sh",
  c: "c",
  cpp: "cpp",
  css: "css",
  go: "go",
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

export function useCopyToClipboard(resetMs = 2000) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const copy = useCallback(
    async (text: string, write?: (text: string) => void | Promise<void>) => {
      if (write) await write(text);
      else if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      } else return false;
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), resetMs);
      return true;
    },
    [resetMs],
  );
  return { copied, copy };
}

function downloadText(text: string, filename: string, mediaType = "text/plain") {
  if (typeof document === "undefined") return;
  const url = URL.createObjectURL(new Blob([text], { type: mediaType }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export type CodeBlockProps = Omit<HTMLAttributes<HTMLDivElement>, "children" | "onCopy"> & {
  code: string;
  language?: string;
  children?: ReactNode;
  lineNumbers?: boolean;
  onCopy?: (code: string) => void | Promise<void>;
  copyable?: boolean;
  download?: boolean | ((code: string) => void);
  filename?: string;
  copyLabel?: string;
  copiedLabel?: string;
  downloadLabel?: string;
  actions?: ReactNode;
};

export function CodeBlock({
  code,
  language,
  children,
  lineNumbers = false,
  onCopy,
  copyable = true,
  download = false,
  filename,
  copyLabel = "Copy code",
  copiedLabel = "Copied",
  downloadLabel = "Download file",
  actions,
  className,
  ...props
}: CodeBlockProps) {
  const { copied, copy } = useCopyToClipboard();
  const label = language?.trim() || "text";
  const lines = code.replace(/\n$/, "").split("\n");
  return (
    <div
      className={["fui-code-block", className].filter(Boolean).join(" ")}
      data-language={label}
      data-line-numbers={lineNumbers || undefined}
      {...props}
    >
      <div className="fui-code-block-header">
        <span className="fui-code-block-language">{label}</span>
        <div className="fui-code-block-actions">
          {actions}
          {download ? (
            <button
              aria-label={downloadLabel}
              className="fui-code-block-action"
              onClick={() =>
                typeof download === "function"
                  ? download(code)
                  : downloadText(code, filename ?? codeFilename(language))
              }
              title={downloadLabel}
              type="button"
            >
              <DownloadIcon />
            </button>
          ) : null}
          {copyable ? (
            <button
              aria-label={copied ? copiedLabel : copyLabel}
              className="fui-code-block-action"
              data-copied={copied || undefined}
              onClick={() => void copy(code, onCopy).catch(() => undefined)}
              title={copied ? copiedLabel : copyLabel}
              type="button"
            >
              {copied ? <CheckIcon /> : <CopyIcon />}
            </button>
          ) : null}
        </div>
      </div>
      <div className="fui-code-block-body" role="region" aria-label={`${label} code`} tabIndex={0}>
        <pre>
          <code>
            {children ??
              lines.map((line, index) => (
                <span className="fui-code-line" key={index}>
                  {line}
                </span>
              ))}
          </code>
        </pre>
      </div>
    </div>
  );
}
