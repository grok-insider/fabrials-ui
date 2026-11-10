"use client";

import { useRef, type ComponentProps } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "./controls";
import { CopyStatus } from "./copy-status";
import { useLabels } from "./labels";
import { classes } from "./shared";
import { useCopy } from "./use-copy";
import { useOverflowTabStop } from "./use-overflow";

export type CopyButtonProps = Omit<
  ComponentProps<typeof Button>,
  "onClick" | "children" | "value"
> & {
  value: string;
  /** "Copy" by default; a `LabelsProvider` sets it and `copiedLabel` for every copy button (scope `copyButton`). */
  label?: string;
  copiedLabel?: string;
  /** Told after the text is on the clipboard. It does not replace the copy (`useCopyToClipboard`'s `onCopy` does). */
  onCopy?: (value: string) => void;
  /** Told what the clipboard threw; the key then shows nothing copied. */
  onCopyError?: (error: unknown) => void;
};

export type CopyButtonLabels = { copy: string; copied: string };

const COPY_LABELS: CopyButtonLabels = { copy: "Copy", copied: "Copied" };

export type SnippetLabels = { copy: string };

const SNIPPET_LABELS: SnippetLabels = { copy: "Copy command" };

export function CopyButton({
  value,
  label: ownLabel,
  copiedLabel: ownCopiedLabel,
  onCopy,
  onCopyError,
  className,
  variant = "ghost",
  size = "icon-sm",
  ...props
}: CopyButtonProps) {
  const { copy: label, copied: copiedLabel } = useLabels("copyButton", COPY_LABELS, { copy: ownLabel, copied: ownCopiedLabel });
  const { status, copy } = useCopy({ onCopied: onCopy, onError: onCopyError });
  const copied = status === "copied";
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      aria-label={copied ? copiedLabel : label}
      title={copied ? copiedLabel : label}
      data-copied={copied || undefined}
      className={classes("fui-copy-button", className)}
      onClick={() => void copy(value)}
      {...props}
    >
      {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
      <CopyStatus labels={{ copied: copiedLabel }} live="polite" status={status} />
    </Button>
  );
}

export function Snippet({
  children,
  prompt = "$",
  copyValue,
  copyLabel,
  label,
  className,
  ...props
}: Omit<ComponentProps<"div">, "children"> & {
  /** One command per line. Lines starting with # are shown as comments. */
  children: string | ReadonlyArray<string>;
  prompt?: string | false;
  copyValue?: string;
  copyLabel?: string;
  label?: string;
}) {
  const labels = useLabels("snippet", SNIPPET_LABELS, { copy: copyLabel });
  const lines = (typeof children === "string" ? children.split("\n") : [...children]).filter(
    (line, index, all) => line.length > 0 || (index > 0 && index < all.length - 1),
  );
  const commands = lines.filter((line) => line.trim() && !line.trimStart().startsWith("#"));
  const code = useRef<HTMLPreElement | null>(null);
  const tabStop = useOverflowTabStop(code);
  return (
    <div
      data-slot="snippet"
      role="group"
      aria-label={label}
      className={classes("fui-snippet", className)}
      {...props}
    >
      <pre ref={code} className="fui-snippet-code" tabIndex={tabStop}>
        <code>
          {lines.map((line, index) => {
            const comment = line.trimStart().startsWith("#");
            return (
              <span
                key={`${index}-${line}`}
                className="fui-snippet-line"
                data-comment={comment || undefined}
                data-prompt={!comment && line.trim() && prompt ? prompt : undefined}
              >
                {line || " "}
              </span>
            );
          })}
        </code>
      </pre>
      <CopyButton
        value={copyValue ?? commands.join("\n")}
        label={labels.copy}
        className="fui-snippet-copy"
      />
    </div>
  );
}
