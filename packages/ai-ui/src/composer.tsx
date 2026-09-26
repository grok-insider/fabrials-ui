"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
  type Ref,
  type TextareaHTMLAttributes,
} from "react";
import { Button, Spinner, Tooltip, TooltipContent, TooltipTrigger } from "@fabrials/ui";
import { ArrowUpIcon, SquareIcon } from "./chat-icons";

const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export type ChatComposerStatus = "ready" | "submitting" | "streaming";

export type ChatComposerProps = {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  onSubmit: (value: string) => void;
  onStop?: () => void;
  status?: ChatComposerStatus;
  queueWhileBusy?: boolean;
  disabled?: boolean;
  submitDisabled?: boolean;
  allowEmptySubmit?: boolean;
  placeholder?: string;
  label?: string;
  sendLabel?: string;
  queueLabel?: string;
  stopLabel?: string;
  attachments?: ReactNode;
  tools?: ReactNode;
  trailing?: ReactNode;
  footer?: ReactNode;
  onPasteFiles?: (files: File[]) => void;
  onRemoveLastAttachment?: () => void;
  textareaRef?: Ref<HTMLTextAreaElement>;
  textareaProps?: Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "value" | "defaultValue" | "onChange" | "placeholder" | "disabled">;
  maxHeight?: string;
  className?: string;
};

function assignRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (typeof ref === "function") ref(value);
  else if (ref) (ref as { current: T | null }).current = value;
}

export function ChatComposer({
  value: valueProp,
  defaultValue = "",
  onValueChange,
  onSubmit,
  onStop,
  status = "ready",
  queueWhileBusy = false,
  disabled = false,
  submitDisabled = false,
  allowEmptySubmit = false,
  placeholder = "Message",
  label = "Message",
  sendLabel = "Send message",
  queueLabel = "Queue message",
  stopLabel = "Stop",
  attachments,
  tools,
  trailing,
  footer,
  onPasteFiles,
  onRemoveLastAttachment,
  textareaRef,
  textareaProps,
  maxHeight = "min(40vh, 16rem)",
  className,
}: ChatComposerProps) {
  const [inner, setInner] = useState(defaultValue);
  const value = valueProp ?? inner;
  const local = useRef<HTMLTextAreaElement | null>(null);
  const composing = useRef(false);
  const busy = status === "submitting" || status === "streaming";
  const empty = value.trim().length === 0;
  const blocked = disabled || submitDisabled || (empty && !allowEmptySubmit) || (busy && !queueWhileBusy);

  const setValue = useCallback(
    (next: string) => {
      if (valueProp === undefined) setInner(next);
      onValueChange?.(next);
    },
    [valueProp, onValueChange],
  );

  useIsomorphicLayoutEffect(() => {
    const node = local.current;
    if (!node || typeof CSS === "undefined" || CSS.supports?.("field-sizing", "content")) return;
    node.style.height = "auto";
    node.style.height = `${node.scrollHeight}px`;
  }, [value]);

  const submit = (event?: FormEvent) => {
    event?.preventDefault();
    if (blocked) return;
    onSubmit(value);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    textareaProps?.onKeyDown?.(event);
    if (event.defaultPrevented) return;
    if (event.key === "Enter" && !event.shiftKey) {
      if (composing.current || event.nativeEvent.isComposing) return;
      event.preventDefault();
      submit();
      return;
    }
    if (event.key === "Backspace" && event.currentTarget.value === "" && onRemoveLastAttachment) {
      event.preventDefault();
      onRemoveLastAttachment();
    }
  };

  const onPaste = (event: ClipboardEvent<HTMLTextAreaElement>) => {
    textareaProps?.onPaste?.(event);
    if (event.defaultPrevented || !onPasteFiles) return;
    const files: File[] = [];
    for (const item of Array.from(event.clipboardData?.items ?? [])) {
      if (item.kind !== "file") continue;
      const file = item.getAsFile();
      if (file) files.push(file);
    }
    if (files.length > 0) {
      event.preventDefault();
      onPasteFiles(files);
    }
  };

  const sendButton = (
    <Button
      aria-label={busy ? queueLabel : sendLabel}
      className="fui-composer-send"
      data-busy={busy || undefined}
      disabled={blocked}
      size="icon-sm"
      type="submit"
      variant="default"
    >
      {status === "submitting" && !onStop ? <Spinner aria-hidden label="" role="presentation" /> : <ArrowUpIcon />}
    </Button>
  );

  return (
    <form
      aria-busy={busy || undefined}
      className={["fui-composer", className].filter(Boolean).join(" ")}
      data-disabled={disabled || undefined}
      data-status={status}
      onSubmit={submit}
    >
      {attachments ? <div className="fui-composer-attachments">{attachments}</div> : null}
      <textarea
        {...textareaProps}
        aria-label={label}
        className="fui-composer-input"
        disabled={disabled}
        name={textareaProps?.name ?? "message"}
        onChange={(event) => setValue(event.currentTarget.value)}
        onCompositionEnd={(event) => {
          composing.current = false;
          textareaProps?.onCompositionEnd?.(event);
        }}
        onCompositionStart={(event) => {
          composing.current = true;
          textareaProps?.onCompositionStart?.(event);
        }}
        onKeyDown={onKeyDown}
        onPaste={onPaste}
        placeholder={placeholder}
        ref={(node) => {
          local.current = node;
          assignRef(textareaRef, node);
        }}
        rows={textareaProps?.rows ?? 1}
        style={{ maxHeight, ...textareaProps?.style }}
        value={value}
      />
      <div className="fui-composer-toolbar">
        <div className="fui-composer-tools">{tools}</div>
        <div className="fui-composer-actions">
          {trailing}
          {busy && onStop ? (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button aria-label={stopLabel} className="fui-composer-stop" onClick={onStop} size="icon-sm" type="button" variant="outline">
                    <SquareIcon />
                  </Button>
                }
              />
              <TooltipContent>{stopLabel}</TooltipContent>
            </Tooltip>
          ) : null}
          {busy && onStop && !queueWhileBusy ? null : sendButton}
        </div>
      </div>
      {footer ? <div className="fui-composer-footer">{footer}</div> : null}
    </form>
  );
}

export function ComposerToggle({
  pressed,
  onPressedChange,
  icon,
  children,
  label,
  tooltip,
  disabled,
}: {
  pressed: boolean;
  onPressedChange: (pressed: boolean) => void;
  icon?: ReactNode;
  children?: ReactNode;
  label: string;
  tooltip?: ReactNode;
  disabled?: boolean;
}) {
  const button = (
    <button
      aria-label={label}
      aria-pressed={pressed}
      className="fui-composer-pill"
      data-icon-only={children ? undefined : true}
      data-state={pressed ? "on" : "off"}
      disabled={disabled}
      onClick={() => onPressedChange(!pressed)}
      type="button"
    >
      {icon}
      {children ? <span>{children}</span> : null}
    </button>
  );
  if (!tooltip) return button;
  return (
    <Tooltip>
      <TooltipTrigger render={button} />
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}

export function ComposerButton({
  icon,
  children,
  label,
  tooltip,
  disabled,
  onClick,
}: {
  icon?: ReactNode;
  children?: ReactNode;
  label: string;
  tooltip?: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
}) {
  const button = (
    <button
      aria-label={label}
      className="fui-composer-pill"
      data-icon-only={children ? undefined : true}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {icon}
      {children ? <span>{children}</span> : null}
    </button>
  );
  if (!tooltip) return button;
  return (
    <Tooltip>
      <TooltipTrigger render={button} />
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}
