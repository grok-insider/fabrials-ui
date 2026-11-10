"use client";

import { Children, createContext, isValidElement, useContext, type ComponentProps, type ReactElement, type ReactNode } from "react";
import { Avatar as BaseAvatar } from "@base-ui/react/avatar";
import { avatarTint } from "./avatar-initials";
import { classes, type StyledProps } from "./shared";

export { avatarInitials, avatarTint } from "./avatar-initials";

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

const GroupSize = createContext<AvatarSize | undefined>(undefined);

/** A person or an account. Inside an `AvatarGroup` with a `size`, it takes the group's size unless it has its own. */
export function Avatar({
  className,
  size,
  ...props
}: StyledProps<BaseAvatar.Root.Props> & { size?: AvatarSize }) {
  const groupSize = useContext(GroupSize);
  return (
    <BaseAvatar.Root
      data-slot="avatar"
      data-size={size ?? groupSize ?? "md"}
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

/**
 * What shows until the picture loads, and if it fails: usually `avatarInitials(name)`. Initials sit on a tint of one of the
 * five data hues, picked from the initials themselves, so the people in a group tell apart (0.11); `tint={false}` keeps the
 * neutral surface, and `--fui-avatar-tint` on the avatar sets the hue yourself.
 */
export function AvatarFallback({
  className,
  tint = true,
  children,
  ...props
}: StyledProps<BaseAvatar.Fallback.Props> & { tint?: boolean }) {
  const hue = tint && typeof children === "string" && children.trim() ? avatarTint(children) : undefined;
  return (
    <BaseAvatar.Fallback
      data-slot="avatar-fallback"
      data-tint={hue}
      className={classes("fui-avatar-fallback", className)}
      {...props}
    >
      {children}
    </BaseAvatar.Fallback>
  );
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
 * Avatars that overlap, each ringed in the colour of the surface they sit on (`--fui-avatar-ring`: the page, or a card). With
 * `max`, the rest become a count ("+3", named in full by `countLabel`); a count of one would take a face's place, so that face
 * is shown instead. `size` sizes the avatars inside it. Put the names somewhere readable: a group of faces is not a list of
 * people.
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
  const shown = max !== undefined && all.length > Math.max(1, max) + 1 ? all.slice(0, Math.max(1, max)) : all;
  const hidden = all.length - shown.length;
  return (
    <GroupSize.Provider value={size}>
      <div data-slot="avatar-group" data-size={size} className={classes("fui-avatar-group", className)} {...props}>
        {shown as ReactNode}
        {hidden > 0 ? (
          <AvatarGroupCount data-size={size} aria-label={countLabel(hidden)} role="img">
            +{hidden}
          </AvatarGroupCount>
        ) : null}
      </div>
    </GroupSize.Provider>
  );
}
