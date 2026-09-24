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
