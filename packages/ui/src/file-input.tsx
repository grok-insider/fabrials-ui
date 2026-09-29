"use client";
// Origin: Fabrials, 0.8 (promoted from Open Email's ui/file-button.tsx).

import { useId, useRef, useState, type ComponentProps, type ReactNode } from "react";
import { X } from "lucide-react";
import { buttonVariants, type ButtonStyleProps } from "./button-variants";
import { IconButton } from "./icon-button";
import { classes } from "./shared";
import { TruncatedText } from "./truncated-text";

export type FileInputProps = Omit<
  ComponentProps<"input">,
  "type" | "children" | "value" | "defaultValue" | "size" | "className" | "style"
> & {
  /** The visible text of the button, in the interface's language. The browser's own "Choose File" text is never shown. */
  label: ReactNode;
  /** The chosen files (an empty array when the picker was cancelled after a choice). */
  onFilesChange?: (files: File[]) => void;
  /** The text beside the button. Left out, the component shows the names of the files the person chose; pass a node
   * to say something else (an uploaded name, "No file chosen") and `null` to show nothing. */
  fileName?: ReactNode | null;
  /** Adds a clear button after the name while something is shown. The picker is emptied, so choosing the same
   * file again still fires a change, and focus returns to the picker. */
  onClear?: () => void;
  clearLabel?: string;
  description?: ReactNode;
  error?: ReactNode;
  variant?: ButtonStyleProps["variant"];
  size?: ButtonStyleProps["size"];
  /** The wrapper (button, name, description, error). */
  className?: string;
  /** The button itself. */
  buttonClassName?: string;
};

/**
 * A file picker that is a button: a label styled as a `Button` over a visually hidden real input, so the keyboard,
 * the form and the accessibility tree are the browser's and only the look is ours. Focus draws its ring on the
 * button, the file name and the error are read with the input, and a disabled picker looks and acts disabled.
 */
export function FileInput({
  label,
  onFilesChange,
  fileName,
  onClear,
  clearLabel = "Remove file",
  description,
  error,
  variant = "outline",
  size = "default",
  className,
  buttonClassName,
  onChange,
  id,
  disabled,
  ref,
  "aria-describedby": describedBy,
  ...input
}: FileInputProps) {
  const generated = useId();
  const base = id ?? generated;
  const own = useRef<HTMLInputElement | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const shown = fileName !== undefined ? fileName : picked;
  const hasName = shown !== null && shown !== undefined && shown !== false && shown !== "";
  const ids = [
    describedBy,
    hasName ? `${base}-name` : undefined,
    description ? `${base}-description` : undefined,
    error ? `${base}-error` : undefined,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={classes("fui-file-input", className)} data-invalid={error ? "" : undefined} data-disabled={disabled ? "" : undefined}>
      <div className="fui-file-input-row">
        <label
          className={classes(buttonVariants({ variant, size }), "fui-file-input-button", buttonClassName)}
          data-variant={variant}
          data-size={size}
        >
          <input
            {...input}
            id={base}
            type="file"
            disabled={disabled}
            className="fui-sr-only"
            aria-describedby={ids || undefined}
            aria-invalid={error ? true : input["aria-invalid"]}
            ref={(node) => {
              own.current = node;
              if (typeof ref === "function") return ref(node);
              if (ref) ref.current = node;
            }}
            onChange={(event) => {
              onChange?.(event);
              const files = Array.from(event.currentTarget.files ?? []);
              setPicked(files.length ? files.map((file) => file.name).join(", ") : null);
              onFilesChange?.(files);
            }}
          />
          {label}
        </label>
        {hasName ? (
          <span className="fui-file-input-name" id={`${base}-name`} aria-live="polite">
            {typeof shown === "string" ? <TruncatedText>{shown}</TruncatedText> : shown}
          </span>
        ) : null}
        {onClear && hasName ? (
          <IconButton
            type="button"
            size="icon-sm"
            label={clearLabel}
            disabled={disabled}
            onClick={() => {
              if (own.current) own.current.value = "";
              setPicked(null);
              onClear();
              own.current?.focus();
            }}
          >
            <X aria-hidden />
          </IconButton>
        ) : null}
      </div>
      {description ? (
        <p className="fui-description" id={`${base}-description`}>
          {description}
        </p>
      ) : null}
      {error ? (
        <p className="fui-field-error" id={`${base}-error`} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
