// Origin: shadcn/ui (Base UI render helpers), copied 2026-09-22. Restyled with fui- classes in 0.4 so it renders without Tailwind.
import type * as React from "react";
import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { classes as cn } from "./shared";
import { Separator } from "./display";

type ButtonGroupOrientation = "horizontal" | "vertical";

function buttonGroupVariants({
  orientation = "horizontal",
  className,
}: { orientation?: ButtonGroupOrientation | null; className?: string } = {}) {
  return cn("fui-button-group", `fui-button-group-${orientation ?? "horizontal"}`, className);
}

function ButtonGroup({
  className,
  orientation = "horizontal",
  ...props
}: React.ComponentProps<"div"> & { orientation?: ButtonGroupOrientation | null }) {
  return (
    <div
      role="group"
      data-slot="button-group"
      data-orientation={orientation ?? "horizontal"}
      className={buttonGroupVariants({ orientation, className })}
      {...props}
    />
  );
}

function ButtonGroupText({
  className,
  render,
  ...props
}: useRender.ComponentProps<"div">) {
  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(
      { className: cn("fui-button-group-text", className) },
      props,
    ),
    render,
    state: { slot: "button-group-text" },
  });
}

function ButtonGroupSeparator({
  className,
  orientation = "vertical",
  ...props
}: React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      data-slot="button-group-separator"
      orientation={orientation}
      className={cn("fui-button-group-separator", className)}
      {...props}
    />
  );
}

export {
  ButtonGroup,
  ButtonGroupSeparator,
  ButtonGroupText,
  buttonGroupVariants,
};
