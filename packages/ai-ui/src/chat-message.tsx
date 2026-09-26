"use client";

import type { ComponentProps, HTMLAttributes, ReactNode } from "react";
import { Button, Tooltip, TooltipContent, TooltipTrigger } from "@fabrials/ui";
import { useCopyToClipboard } from "./code-block";
import { CheckIcon, CopyIcon } from "./chat-icons";

export type ChatRole = "user" | "assistant" | "system";

function join(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export type ChatMessageProps = HTMLAttributes<HTMLDivElement> & {
  from: ChatRole;
  actions?: ReactNode;
  pinActions?: boolean;
  bodyClassName?: string;
};

export function ChatMessage({
  from,
  actions,
  pinActions = false,
  className,
  bodyClassName,
  children,
  ...props
}: ChatMessageProps) {
  return (
    <div
      className={join("fui-chat-message", className)}
      data-pin-actions={pinActions || undefined}
      data-role={from}
      {...props}
    >
      <div className={join("fui-chat-message-body", bodyClassName)}>{children}</div>
      {actions}
    </div>
  );
}

export function MessageActions({ className, ...props }: ComponentProps<"div">) {
  return <div className={join("fui-message-actions", className)} {...props} />;
}

export type MessageActionProps = Omit<ComponentProps<typeof Button>, "children"> & {
  label: string;
  tooltip?: ReactNode;
  children: ReactNode;
};

export function MessageAction({ label, tooltip, children, className, ...props }: MessageActionProps) {
  const button = (
    <Button
      aria-label={label}
      className={join("fui-message-action", className)}
      size="icon-sm"
      type="button"
      variant="ghost"
      {...props}
    >
      {children}
    </Button>
  );
  return (
    <Tooltip>
      <TooltipTrigger render={button} />
      <TooltipContent>{tooltip ?? label}</TooltipContent>
    </Tooltip>
  );
}

export function CopyMessageAction({
  text,
  onCopy,
  label = "Copy",
  copiedLabel = "Copied",
  ...props
}: Omit<MessageActionProps, "label" | "children" | "onClick" | "onCopy"> & {
  text: string | (() => string);
  onCopy?: (text: string) => void | Promise<void>;
  label?: string;
  copiedLabel?: string;
}) {
  const { copied, copy } = useCopyToClipboard();
  return (
    <MessageAction
      {...props}
      data-copied={copied || undefined}
      label={copied ? copiedLabel : label}
      onClick={() => void copy(typeof text === "function" ? text() : text, onCopy).catch(() => undefined)}
    >
      {copied ? <CheckIcon /> : <CopyIcon />}
    </MessageAction>
  );
}

export function MessageTimestamp({
  dateTime,
  label,
  detail,
  className,
}: {
  dateTime: string;
  label: string;
  detail?: ReactNode;
  className?: string;
}) {
  const time = <time className={join("fui-message-time", className)} dateTime={dateTime} />;
  if (!detail) {
    return (
      <time className={join("fui-message-time", className)} dateTime={dateTime}>
        {label}
      </time>
    );
  }
  return (
    <Tooltip>
      <TooltipTrigger render={time}>{label}</TooltipTrigger>
      <TooltipContent>{detail}</TooltipContent>
    </Tooltip>
  );
}
