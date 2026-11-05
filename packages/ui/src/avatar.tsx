"use client";

import { Children, isValidElement, type ComponentProps, type ReactElement, type ReactNode } from "react";
import { Avatar as BaseAvatar } from "@base-ui/react/avatar";
import { classes, type StyledProps } from "./shared";

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

export function Avatar({
  className,
  size = "md",
  ...props
}: StyledProps<BaseAvatar.Root.Props> & { size?: AvatarSize }) {
  return (
    <BaseAvatar.Root
      data-slot="avatar"
      data-size={size}
      className={classes("fui-avatar", className)}
      {...props}
    />
  );
}

export function AvatarImage({
  className,
  ...props
}: StyledProps<BaseAvatar.Image.Props>) {
  return (
    <BaseAvatar.Image
      data-slot="avatar-image"
      className={classes("fui-avatar-image", className)}
      {...props}
    />
  );
}

export function AvatarFallback({
  className,
  ...props
}: StyledProps<BaseAvatar.Fallback.Props>) {
  return (
    <BaseAvatar.Fallback
      data-slot="avatar-fallback"
      className={classes("fui-avatar-fallback", className)}
      {...props}
    />
  );
}

const segmenter =
  typeof Intl !== "undefined" && "Segmenter" in Intl ? new Intl.Segmenter(undefined, { granularity: "grapheme" }) : null;

function firstGrapheme(word: string): string {
  if (segmenter) for (const part of segmenter.segment(word)) return part.segment;
  return Array.from(word)[0] ?? "";
}

/**
 * The text of an avatar fallback. A name gives the first letters of its first and last word; an address (no space) gives
 * the first letter of its local part. Grapheme-safe (an emoji or an accented letter is one) and upper-cased in `locale`;
 * `fallback` when there is nothing to show.
 */
export function avatarInitials(value: string, fallback = "?", locale?: string): string {
  const text = value.trim();
  if (!text) return fallback;
  const words = /\s/u.test(text) ? text.split(/\s+/u) : [text.split("@")[0] || text];
  const letters =
    words.length > 1
      ? [firstGrapheme(words[0]), firstGrapheme(words[words.length - 1])]
      : [firstGrapheme(words[0])];
  return letters.join("").toLocaleUpperCase(locale) || fallback;
}

/**
 * A dot on the avatar's edge: presence, or a small count. `tone` picks the status ink; `label` says it to assistive
 * technology (a dot alone is never the only signal: write the status next to the name too).
 */
export function AvatarBadge({
  tone = "success",
  label,
  className,
  children,
  ...props
}: ComponentProps<"span"> & { tone?: "success" | "warning" | "danger" | "neutral" | "info"; label?: string }) {
  return (
    <span
      data-slot="avatar-badge"
      data-tone={tone}
      className={classes("fui-avatar-badge", className)}
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": children ? undefined : true })}
      {...props}
    >
      {children}
    </span>
  );
}

/** "+3" at the end of a group: the people not drawn. */
export function AvatarGroupCount({ className, ...props }: ComponentProps<"span">) {
  return <span data-slot="avatar-group-count" className={classes("fui-avatar", "fui-avatar-group-count", className)} {...props} />;
}

/**
 * Avatars that overlap, each ringed in the page colour. With `max`, the rest become a count ("+3", named in full by
 * `countLabel`). Put the names somewhere readable: a group of faces is not a list of people.
 */
export function AvatarGroup({
  max,
  size,
  countLabel = (hidden) => `${hidden} more`,
  className,
  children,
  ...props
}: ComponentProps<"div"> & { max?: number; size?: AvatarSize; countLabel?: (hidden: number) => string }) {
  const all = Children.toArray(children).filter((child): child is ReactElement => isValidElement(child));
  const shown = max !== undefined && all.length > max ? all.slice(0, Math.max(1, max)) : all;
  const hidden = all.length - shown.length;
  return (
    <div data-slot="avatar-group" data-size={size} className={classes("fui-avatar-group", className)} {...props}>
      {shown as ReactNode}
      {hidden > 0 ? (
        <AvatarGroupCount data-size={size} aria-label={countLabel(hidden)} role="img">
          +{hidden}
        </AvatarGroupCount>
      ) : null}
    </div>
  );
}
