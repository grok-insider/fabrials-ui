"use client";

import { useCallback, useEffect, useRef, useState, type HTMLAttributes, type ReactNode } from "react";
import { CodeLines, LanguageIcon, useOverflowTabStop } from "@fabrials/ui";
import { CheckIcon, CopyIcon, DownloadIcon } from "./chat-icons";
import { codeFilename } from "./format";
import { useLabels } from "@fabrials/ui";

export { codeFilename } from "./format";

export type CodeBlockLabels = {
  copy: string;
  copied: string;
  download: string;
  /** The name of the scrolling body, given the file's name or the language. */
  region: (name: string) => string;
};

const CODE_BLOCK_LABELS: CodeBlockLabels = {
  copy: "Copy code",
  copied: "Copied",
  download: "Download file",
  region: (name) => `${name} code`,
};

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
  /**
   * The language. TypeScript, JavaScript, JSX, JSON, shell, CSS, HTML, Python, Rust, Go, SQL, YAML, TOML and diffs are
   * highlighted in the same inks as CodePanel; anything else is plain text.
   */
  language?: string;
  /** Code highlighted elsewhere (Shiki, Prism, highlight.js) replaces the built-in highlighter. */
  children?: ReactNode;
  lineNumbers?: boolean;
  /** 1-based lines to draw attention to. */
  highlightLines?: number[];
  /** 1-based lines shown as added or removed, for a change. Copy leaves the removed lines out. */
  addedLines?: number[];
  removedLines?: number[];
  /** Names boxed wherever they stand on their own (never inside a longer word), to point at them. */
  highlightWords?: string[];
  /** Long lines wrap instead of scrolling sideways. */
  wrap?: boolean;
  onCopy?: (code: string) => void | Promise<void>;
  copyable?: boolean;
  /** What Copy puts on the clipboard, when it differs from the code. */
  copyValue?: string;
  download?: boolean | ((code: string) => void);
  /** The file's name: the header shows it, with the language beside it, and a download takes it. */
  filename?: string;
  copyLabel?: string;
  copiedLabel?: string;
  downloadLabel?: string;
  /** The words of the keys and the body's name; the three props above win. A `LabelsProvider` sets them (scope `codeBlock`). */
  labels?: Partial<CodeBlockLabels>;
  actions?: ReactNode;
};

/**
 * A code sample in an answer, highlighted in the same inks as CodePanel and headed by its language's logo and name (or its
 * file's name), with copy and download keys and, when asked, line numbers, marked lines, a change's added and removed lines,
 * boxed words and soft wrapping. The body is a region, and a tab stop while a line is longer than it, so a long line can be
 * scrolled from the keyboard.
 */
export function CodeBlock({
  code,
  language,
  children,
  lineNumbers = false,
  highlightLines,
  addedLines,
  removedLines,
  highlightWords,
  wrap = false,
  onCopy,
  copyable = true,
  copyValue,
  download = false,
  filename,
  copyLabel: ownCopyLabel,
  copiedLabel: ownCopiedLabel,
  downloadLabel: ownDownloadLabel,
  labels: ownLabels,
  actions,
  className,
  ...props
}: CodeBlockProps) {
  const { copied, copy } = useCopyToClipboard();
  const body = useRef<HTMLDivElement | null>(null);
  const tabStop = useOverflowTabStop(body);
  const label = language?.trim() || "text";
  // A change copies and downloads as it ends up: without its removed lines.
  const kept = removedLines?.length ? code.split("\n").filter((_, index) => !removedLines.includes(index + 1)).join("\n") : code;
  const text = copyValue ?? kept;
  const labels = useLabels("codeBlock", CODE_BLOCK_LABELS, ownLabels);
  const copyLabel = ownCopyLabel ?? labels.copy;
  const copiedLabel = ownCopiedLabel ?? labels.copied;
  const downloadLabel = ownDownloadLabel ?? labels.download;
  return (
    <div
      className={["fui-code-block", className].filter(Boolean).join(" ")}
      data-language={label}
      data-line-numbers={lineNumbers || undefined}
      data-wrap={wrap || undefined}
      {...props}
    >
      <div className="fui-code-block-header">
        <LanguageIcon language={language} />
        {filename ? (
          <span className="fui-code-block-title">
            <span className="fui-code-block-filename">{filename}</span>
            <span className="fui-code-block-language">{label}</span>
          </span>
        ) : (
          <span className="fui-code-block-language">{label}</span>
        )}
        <div className="fui-code-block-actions">
          {actions}
          {download ? (
            <button
              aria-label={downloadLabel}
              className="fui-code-block-action"
              onClick={() =>
                typeof download === "function"
                  ? download(kept)
                  : downloadText(kept, filename ?? codeFilename(language))
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
              onClick={() => void copy(text, onCopy).catch(() => undefined)}
              title={copied ? copiedLabel : copyLabel}
              type="button"
            >
              {copied ? <CheckIcon /> : <CopyIcon />}
            </button>
          ) : null}
        </div>
      </div>
      <div ref={body} className="fui-code-block-body" role="region" aria-label={labels.region(filename ?? label)} tabIndex={tabStop}>
        <pre>
          {children ? (
            <code>{children}</code>
          ) : (
            <CodeLines
              addedLines={addedLines}
              code={code}
              highlightLines={highlightLines}
              highlightWords={highlightWords}
              language={label}
              removedLines={removedLines}
            />
          )}
        </pre>
      </div>
    </div>
  );
}
