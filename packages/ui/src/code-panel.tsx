"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type ComponentProps, type ReactNode } from "react";
import { Tabs as BaseTabs } from "@base-ui/react/tabs";
import { LanguageIcon } from "./language-icon";
import { CopyButton } from "./snippet";
import { classes } from "./shared";
import { highlightCode, packageCommand, PACKAGE_MANAGERS, type PackageManager } from "./syntax";
import { useOverflowTabStop } from "./use-overflow";

/** The scrolling body of a code sample: a tab stop only while a line or the sample is longer than the box. */
function CodeBody({ children }: { children: ReactNode }) {
  const body = useRef<HTMLPreElement | null>(null);
  return (
    <pre ref={body} className="fui-code-panel-body" tabIndex={useOverflowTabStop(body)}>
      {children}
    </pre>
  );
}

/** Copy with a spoken result: "Copied", or how to copy by hand when the clipboard refuses. */
function useCopyStatus() {
  const [status, setStatus] = useState("");
  return {
    status,
    onCopy: () => setStatus("Copied to clipboard"),
    onCopyError: () => setStatus("Couldn't copy. Select the code and copy it."),
  };
}

function CopyStatus({ status }: { status: string }) {
  return (
    <span role="status" className={status.startsWith("Couldn't") ? "fui-code-panel-status" : "fui-sr-only"}>
      {status}
    </span>
  );
}

export type CodePanelProps = Omit<ComponentProps<"figure">, "title" | "children"> & {
  code: string;
  /** ts, tsx, js, json, bash, css, html, py, rs, go, sql, yaml, toml, diff… Other languages render as plain text. */
  language?: string;
  /** Usually the file name. Without it the bar shows the language. */
  title?: ReactNode;
  /** Replaces the language's logo at the start of the bar (LanguageIcon). */
  icon?: ReactNode;
  lineNumbers?: boolean;
  /** 1-based lines to draw attention to. */
  highlightLines?: number[];
  /** 1-based lines shown as added or removed, for diffs. */
  addedLines?: number[];
  removedLines?: number[];
  /** Names boxed wherever they stand on their own (never inside a longer word), to point at them. */
  highlightWords?: string[];
  /** What Copy puts on the clipboard, when it differs from the code (e.g. without removed lines). */
  copyValue?: string;
  /** Pre-highlighted code (from Shiki, for instance) replaces the built-in highlighter. */
  children?: ReactNode;
  /** Hide the bar for inline snippets; the copy button floats instead. */
  bare?: boolean;
};

// A name is boxed where it stands on its own: never the c inside const, nor a name inside a longer one.
function Words({ text, words, type }: { text: string; words?: string[]; type?: string }) {
  if (!words?.length) return <span className={type ? `fui-token-${type}` : undefined}>{text}</span>;
  const names = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  const pattern = new RegExp(`(?<![\\w$])(${names})(?![\\w$])`, "g");
  return (
    <span className={type ? `fui-token-${type}` : undefined}>
      {text.split(pattern).map((part, index) =>
        // split puts each match at an odd index, between the text around it.
        index % 2 === 1 ? (
          <mark key={index} className="fui-code-word">
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </span>
  );
}

export type CodeLinesProps = Pick<CodePanelProps, "code" | "language" | "highlightLines" | "addedLines" | "removedLines" | "highlightWords">;

/**
 * The highlighted lines of a code sample, as `CodePanel` draws them: a `code` element of line spans with classified tokens
 * (`fui-token-*`), marked lines, diff lines as `ins` and `del`, and boxed words. Put it in your own `pre` (CodeBlock in
 * `@fabrials/ai-ui` does) to share the highlighter and the inks.
 */
export function CodeLines({ code, language, highlightLines, addedLines, removedLines, highlightWords }: CodeLinesProps) {
  const lines = highlightCode(code.replace(/\n$/, ""), language);
  const diff = Boolean(addedLines?.length || removedLines?.length);
  return (
    <code data-diff-gutter={diff || undefined}>
      {lines.map((tokens, index) => {
        const n = index + 1;
        const mark = addedLines?.includes(n) ? "added" : removedLines?.includes(n) ? "removed" : undefined;
        // Changed lines are <ins> and <del>, so assistive technology hears the change, not just a colour.
        const Line = mark === "added" ? "ins" : mark === "removed" ? "del" : "span";
        return (
          <Line
            key={index}
            className="fui-code-line"
            data-highlighted={highlightLines?.includes(n) || undefined}
            data-diff={mark}
          >
            {tokens.length ? (
              tokens.map((token, t) => <Words key={t} text={token.text} words={highlightWords} type={token.type} />)
            ) : (
              // A plain space keeps an empty line's height; a zero-width space would paste into code as an invalid character.
              " "
            )}
          </Line>
        );
      })}
    </code>
  );
}

/**
 * A code sample with its file name, a copy button and optional line numbers,
 * highlighted lines, boxed words and diff marks. Highlights TypeScript, JSON,
 * shell, CSS, HTML, Python, Rust, Go, SQL, YAML, TOML and diffs itself; pass
 * Shiki output as children to use it.
 */
export function CodePanel({
  code,
  language,
  title,
  icon,
  lineNumbers = false,
  highlightLines,
  addedLines,
  removedLines,
  highlightWords,
  copyValue,
  children,
  bare = false,
  className,
  ...props
}: CodePanelProps) {
  const copy = copyValue ?? (removedLines?.length ? code.split("\n").filter((_, i) => !removedLines.includes(i + 1)).join("\n") : code);
  const copied = useCopyStatus();
  return (
    <figure
      data-slot="code-panel"
      data-bare={bare || undefined}
      data-line-numbers={lineNumbers || undefined}
      className={classes("fui-code-panel", className)}
      {...props}
    >
      {bare ? null : (
        <figcaption className="fui-code-panel-bar">
          <span className="fui-code-panel-title">
            {icon ?? <LanguageIcon language={language} />}
            <span>{title ?? language ?? "Code"}</span>
          </span>
          <CopyButton value={copy} label="Copy code" onCopy={copied.onCopy} onCopyError={copied.onCopyError} />
        </figcaption>
      )}
      <CodeBody>
        {children ?? (
          <CodeLines
            code={code}
            language={language}
            highlightLines={highlightLines}
            addedLines={addedLines}
            removedLines={removedLines}
            highlightWords={highlightWords}
          />
        )}
      </CodeBody>
      {bare ? (
        <CopyButton value={copy} label="Copy code" className="fui-code-panel-float" onCopy={copied.onCopy} onCopyError={copied.onCopyError} />
      ) : null}
      <CopyStatus status={copied.status} />
    </figure>
  );
}

export type CodeTab = Omit<CodePanelProps, "title" | "bare"> & { value: string; label: ReactNode };

/** Several versions of one sample (languages, frameworks, files) in one frame. */
export function CodeTabs({
  items,
  defaultValue,
  value,
  onValueChange,
  label = "Code examples",
  className,
}: {
  items: CodeTab[];
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  label?: string;
  className?: string;
}) {
  const [internal, setInternal] = useState(defaultValue ?? items[0]?.value);
  const copied = useCopyStatus();
  const current = value ?? internal;
  const active = items.find((item) => item.value === current) ?? items[0];
  // Samples in different languages (or with an icon of their own) carry their logo on their tab; samples in one language
  // show it once, before the tabs.
  const languages = new Set(items.map((item) => (item.language ?? "").trim().toLowerCase()));
  const mixed = languages.size > 1 || items.some((item) => item.icon);
  const shared = !mixed && items[0]?.language ? items[0].language : undefined;
  return (
    <BaseTabs.Root
      value={current}
      onValueChange={(next) => {
        setInternal(next as string);
        onValueChange?.(next as string);
      }}
      data-slot="code-tabs"
      className={classes("fui-code-panel", "fui-code-tabs", className)}
    >
      <div className="fui-code-panel-bar">
        {shared ? <LanguageIcon className="fui-code-tabs-language" language={shared} /> : null}
        <BaseTabs.List aria-label={label} className="fui-code-tabs-list">
          {items.map((item) => (
            <BaseTabs.Tab key={item.value} value={item.value} className="fui-code-tab">
              {mixed ? (item.icon ?? <LanguageIcon language={item.language} />) : null}
              {item.label}
            </BaseTabs.Tab>
          ))}
        </BaseTabs.List>
        {active && (
          <CopyButton
            value={
              active.copyValue ??
              (active.removedLines?.length ? active.code.split("\n").filter((_, i) => !active.removedLines!.includes(i + 1)).join("\n") : active.code)
            }
            label="Copy code"
            onCopy={copied.onCopy}
            onCopyError={copied.onCopyError}
          />
        )}
      </div>
      {items.map(({ value: tab, label: _label, code, language, lineNumbers, highlightLines, addedLines, removedLines, highlightWords, children }) => (
        <BaseTabs.Panel key={tab} value={tab} className="fui-code-tabs-panel" data-line-numbers={lineNumbers || undefined}>
          <CodeBody>
            {children ?? (
              <CodeLines
                code={code}
                language={language}
                highlightLines={highlightLines}
                addedLines={addedLines}
                removedLines={removedLines}
                highlightWords={highlightWords}
              />
            )}
          </CodeBody>
        </BaseTabs.Panel>
      ))}
      <CopyStatus status={copied.status} />
    </BaseTabs.Root>
  );
}

// One choice of package manager for every PackageInstall on the page.
let chosen: PackageManager = "npm";
const listeners = new Set<() => void>();
const managerStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  get: () => chosen,
  set(next: PackageManager) {
    chosen = next;
    listeners.forEach((listener) => listener());
  },
};

/**
 * A command in npm, pnpm, yarn and bun. Picking one switches every
 * PackageInstall on the page; with `persistKey`, the choice is remembered in
 * this browser (read after hydration, never during render).
 */
export function PackageInstall({
  command,
  kind = "run",
  persistKey = "fui-package-manager",
  className,
}: {
  /** Without the runner: "shadcn@latest add @fabrials/button", or "@fabrials/ui" for kind="install". */
  command: string;
  kind?: "run" | "install";
  persistKey?: string | null;
  className?: string;
}) {
  const manager = useSyncExternalStore(managerStore.subscribe, managerStore.get, () => "npm" as PackageManager);
  useEffect(() => {
    if (!persistKey) return;
    try {
      const saved = window.localStorage.getItem(persistKey);
      if (saved && saved in PACKAGE_MANAGERS && saved !== managerStore.get()) managerStore.set(saved as PackageManager);
    } catch {
      // Storage can be unavailable (private windows); the default stays.
    }
  }, [persistKey]);
  return (
    <CodeTabs
      className={classes("fui-package-install", className)}
      label="Package manager"
      value={manager}
      onValueChange={(next) => {
        managerStore.set(next as PackageManager);
        if (persistKey)
          try {
            window.localStorage.setItem(persistKey, next);
          } catch {
            // Remembering is a convenience; ignore storage errors.
          }
      }}
      items={(Object.keys(PACKAGE_MANAGERS) as PackageManager[]).map((name) => ({
        value: name,
        label: name,
        code: packageCommand(name, command, kind),
        language: "bash",
      }))}
    />
  );
}
