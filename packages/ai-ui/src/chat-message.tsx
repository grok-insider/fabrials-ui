"use client";

import { useLayoutEffect, useRef, type ComponentProps, type HTMLAttributes, type ReactNode } from "react";
import { Button, LocalTime, Tooltip, TooltipContent, TooltipTrigger } from "@fabrials/ui";
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
  /**
   * The answer is still arriving: a block caret of the working light sits at the end of its text, solid while the text
   * flows and blinking when it pauses, and the message is `aria-busy`. Turn it off when the stream ends.
   */
  streaming?: boolean;
};

/** Where the caret goes: just after the last character of the last text in `body`, in its line; at the start without text. */
function caretPlace(body: HTMLElement, caret: HTMLElement): { x: number; y: number; height: number } {
  const frame = body.getBoundingClientRect();
  const walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) =>
      !node.textContent?.trim() || caret.contains(node) || node.parentElement?.closest("[aria-hidden='true'], .fui-sr-only")
        ? NodeFilter.FILTER_REJECT
        : NodeFilter.FILTER_ACCEPT,
  });
  let last: Text | null = null;
  for (let node = walker.nextNode(); node; node = walker.nextNode()) last = node as Text;
  const style = getComputedStyle(body);
  const line = Number.parseFloat(style.lineHeight) || Number.parseFloat(style.fontSize) * 1.5 || 20;
  if (!last) return { x: style.direction === "rtl" ? frame.width - caret.offsetWidth : 0, y: 0, height: line };
  const text = last.textContent ?? "";
  const end = text.trimEnd().length;
  const range = document.createRange();
  // A document without layout (a test's DOM) cannot measure text: the caret stays at the start.
  if (typeof range.getClientRects !== "function") return { x: 0, y: 0, height: line };
  range.setStart(last, Math.max(0, end - 1));
  range.setEnd(last, end);
  const rects = range.getClientRects();
  const box = rects[rects.length - 1] ?? range.getBoundingClientRect();
  const rtl = getComputedStyle(last.parentElement ?? body).direction === "rtl";
  return {
    x: (rtl ? box.left - caret.offsetWidth - 2 : box.right + 2) - frame.left,
    y: box.top - frame.top,
    height: box.height || line,
  };
}

/**
 * Keeps the streaming caret at the end of the text as it grows (on every change of the body and of its size) and marks it
 * stalled when nothing has arrived for 700 ms, so it blinks only while the stream waits.
 */
function useStreamCaret(streaming: boolean) {
  const body = useRef<HTMLDivElement | null>(null);
  const caret = useRef<HTMLSpanElement | null>(null);
  useLayoutEffect(() => {
    const node = body.current;
    const mark = caret.current;
    if (!streaming || !node || !mark) return;
    let frame = 0;
    let stall = 0;
    const place = () => {
      frame = 0;
      const { x, y, height } = caretPlace(node, mark);
      mark.style.translate = `${Math.round(x)}px ${Math.round(y + height * 0.12)}px`;
      mark.style.height = `${Math.round(height * 0.76)}px`;
    };
    const update = () => {
      if (!frame) frame = requestAnimationFrame(place);
      mark.removeAttribute("data-stalled");
      window.clearTimeout(stall);
      stall = window.setTimeout(() => mark.setAttribute("data-stalled", ""), 700);
    };
    place();
    update();
    const mutations = new MutationObserver(update);
    mutations.observe(node, { childList: true, subtree: true, characterData: true });
    const sizes = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(update);
    sizes?.observe(node);
    return () => {
      mutations.disconnect();
      sizes?.disconnect();
      cancelAnimationFrame(frame);
      window.clearTimeout(stall);
    };
  }, [streaming]);
  return { body, caret };
}

export function ChatMessage({
  from,
  actions,
  pinActions = false,
  streaming = false,
  className,
  bodyClassName,
  children,
  ...props
}: ChatMessageProps) {
  const { body, caret } = useStreamCaret(streaming);
  return (
    <div
      aria-busy={streaming || undefined}
      className={join("fui-chat-message", className)}
      data-pin-actions={pinActions || undefined}
      data-role={from}
      data-streaming={streaming || undefined}
      {...props}
    >
      <div className={join("fui-chat-message-body", bodyClassName)} ref={body}>
        {children}
        {streaming ? <span aria-hidden="true" className="fui-stream-caret" ref={caret} /> : null}
      </div>
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

export type MessageTimestampProps = {
  /** The instant as text ("2026-09-27T09:31:00Z"). Kept for a host that already formatted its own label. */
  dateTime?: string;
  /** The words of a ready-made label. */
  label?: string;
  /** A tooltip of your own for the ready-made label. */
  detail?: ReactNode;
  /**
   * When the message was sent. Rendered in the reader's zone and locale, with the server's text hidden until the page has
   * hydrated, so nothing moves and no server time is ever shown. It wins over `dateTime` and `label`.
   */
  date?: Date | string | number | null;
  /** The reader's language for `date`: the provider's, else the browser's. */
  locale?: Intl.LocalesArgument;
  /** Fixes the zone of `date` (a screenshot, a transcript). Default: the reader's own. */
  timeZone?: string;
  /** What `date` shows: "09:31" today and "Sep 26, 09:31" another day (the default), the time, or the whole date and time. */
  format?: "message" | "time" | "dateTime";
  className?: string;
};

export function MessageTimestamp({ dateTime, label, detail, date, locale, timeZone, format = "message", className }: MessageTimestampProps) {
  if (date !== undefined && date !== null) {
    return <LocalTime className={join("fui-message-time", className)} format={format} locale={locale} timeZone={timeZone} titleFormat="dateTime" value={date} />;
  }
  if (dateTime === undefined || label === undefined) return null;
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
