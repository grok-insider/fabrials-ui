"use client";

import { Avatar as BaseAvatar } from "@base-ui/react/avatar";
import { classes, type StyledProps } from "./shared";

export function Avatar({
  className,
  size = "md",
  ...props
}: StyledProps<BaseAvatar.Root.Props> & { size?: "sm" | "md" | "lg" }) {
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
