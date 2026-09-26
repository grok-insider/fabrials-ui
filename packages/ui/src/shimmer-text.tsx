// Origin: Vercel AI Elements shimmer (ai-sdk.dev/elements) via Radiant, copied 2026-09-26. Rewritten as a CSS animation without motion.
import type { ComponentPropsWithoutRef, CSSProperties, ElementType } from "react";
import { classes } from "./shared";

export type ShimmerTextProps = Omit<ComponentPropsWithoutRef<"span">, "children"> & {
  children: string;
  as?: ElementType;
  duration?: number;
  spread?: number;
};

export function ShimmerText({
  children,
  as: Component = "p",
  className,
  duration = 2,
  spread = 2,
  style,
  ...props
}: ShimmerTextProps) {
  return (
    <Component
      className={classes("fui-shimmer-text", className)}
      style={
        {
          "--fui-shimmer-spread": `${children.length * spread}px`,
          "--fui-shimmer-duration": `${duration}s`,
          ...style,
        } as CSSProperties
      }
      {...props}
    >
      {children}
    </Component>
  );
}
