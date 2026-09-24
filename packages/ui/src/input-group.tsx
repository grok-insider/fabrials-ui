"use client";
// Origin: shadcn/ui, copied 2026-09-22. Restyled with fui- classes in 0.4 so it renders without Tailwind.

import type * as React from "react";
import { classes as cn } from "./shared";
import { Button, Input, Textarea } from "./controls";

function InputGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-group"
      role="group"
      className={cn("fui-input-group", className)}
      {...props}
    />
  );
}

type AddonAlign = "inline-start" | "inline-end" | "block-start" | "block-end";

function InputGroupAddon({
  className,
  align = "inline-start",
  ...props
}: React.ComponentProps<"div"> & { align?: AddonAlign | null }) {
  return (
    <div
      role="group"
      data-slot="input-group-addon"
      data-align={align ?? "inline-start"}
      className={cn("fui-input-group-addon", className)}
      onClick={(event) => {
        if ((event.target as HTMLElement).closest("button")) return;
        event.currentTarget.parentElement
          ?.querySelector<HTMLElement>("input, textarea")
          ?.focus();
      }}
      {...props}
    />
  );
}

function InputGroupButton({
  className,
  type = "button",
  variant = "ghost",
  size = "xs",
  ...props
}: Omit<React.ComponentProps<typeof Button>, "size" | "type"> & {
  size?: "xs" | "sm" | "icon-xs" | "icon-sm" | null;
  type?: "button" | "submit" | "reset";
}) {
  return (
    <Button
      type={type}
      variant={variant}
      size={size ?? "xs"}
      className={cn("fui-input-group-button", className)}
      {...props}
    />
  );
}

function InputGroupText({ className, ...props }: React.ComponentProps<"span">) {
  return <span className={cn("fui-input-group-text", className)} {...props} />;
}

function InputGroupInput({
  className,
  ...props
}: React.ComponentProps<"input">) {
  return (
    <Input
      data-slot="input-group-control"
      className={cn("fui-input-group-control", className)}
      {...props}
    />
  );
}

function InputGroupTextarea({
  className,
  ...props
}: React.ComponentProps<"textarea">) {
  return (
    <Textarea
      data-slot="input-group-control"
      className={cn("fui-input-group-control", className)}
      {...props}
    />
  );
}

export {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupInput,
  InputGroupTextarea,
};
