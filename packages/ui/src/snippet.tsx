"use client";

import { useEffect, useRef, useState, type ComponentProps } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "./controls";
import { classes } from "./shared";

export type CopyButtonProps = Omit<
  ComponentProps<typeof Button>,
  "onClick" | "children" | "value"
> & {
  value: string;
  label?: string;
  copiedLabel?: string;
  onCopy?: (value: string) => void;
  onCopyError?: (error: unknown) => void;
};

export function CopyButton({
  value,
  label = "Copy",
  copiedLabel = "Copied",
  onCopy,
  onCopyError,
  className,
  variant = "ghost",
  size = "icon-sm",
  ...props
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      onCopy?.(value);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 1600);
    } catch (error) {
      onCopyError?.(error);
    }
  }
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      aria-label={copied ? copiedLabel : label}
      title={copied ? copiedLabel : label}
      data-copied={copied || undefined}
      className={classes("fui-copy-button", className)}
      onClick={() => void copy()}
      {...props}
    >
      {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
      <span className="fui-sr-only" aria-live="polite">
        {copied ? copiedLabel : ""}
      </span>
    </Button>
  );
}

export function Snippet({
  children,
  prompt = "$",
  copyValue,
  copyLabel = "Copy command",
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
  const lines = (typeof children === "string" ? children.split("\n") : [...children]).filter(
    (line, index, all) => line.length > 0 || (index > 0 && index < all.length - 1),
  );
  const commands = lines.filter((line) => line.trim() && !line.trimStart().startsWith("#"));
  return (
    <div
      data-slot="snippet"
      role="group"
      aria-label={label}
      className={classes("fui-snippet", className)}
      {...props}
    >
      <pre className="fui-snippet-code" tabIndex={0}>
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
        label={copyLabel}
        className="fui-snippet-copy"
      />
    </div>
  );
}
