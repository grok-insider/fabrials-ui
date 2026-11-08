// Origin: Vercel AI Elements shimmer (ai-sdk.dev/elements) via Radiant, copied 2026-09-26. Rewritten as a CSS animation without motion.
import type { ComponentPropsWithoutRef, CSSProperties, ElementType } from "react";
import { classes } from "./shared";

export type ShimmerTextProps = Omit<ComponentPropsWithoutRef<"span">, "children"> & {
  children: string;
  as?: ElementType;
  duration?: number;
  spread?: number;
  /** `ink` (default): a band of the foreground crosses the muted text. `light`: the band is the working light, for text that
   * names an agent at work. Both stop under reduced motion, where the text is the muted ink. */
  tone?: "ink" | "light";
  /**
   * `band` (default): a soft band of light crosses the text. `letters`: the light steps a letter at a time with a trail of
   * two, like a cursor reading the line (0.11); `duration` is one pass.
   */
  variant?: "band" | "letters";
};

export function ShimmerText({
  children,
  as: Component = "p",
  className,
  duration = 2,
  spread = 2,
  tone = "ink",
  variant = "band",
  style,
  ...props
}: ShimmerTextProps) {
  if (variant === "letters") {
    const letters = Array.from(children);
    return (
      <Component
        className={classes("fui-shimmer-text", className)}
        data-tone={tone === "light" ? "light" : undefined}
        data-variant="letters"
        style={
          {
            "--fui-shimmer-count": letters.length,
            "--fui-shimmer-steps": letters.length + 3,
            "--fui-shimmer-duration": `${duration}s`,
            ...style,
          } as CSSProperties
        }
        {...props}
      >
        <span className="fui-sr-only">{children}</span>
        <span aria-hidden="true">
          {letters.map((letter, index) => (
            <span key={index} style={{ "--i": index } as CSSProperties}>
              {letter}
            </span>
          ))}
        </span>
      </Component>
    );
  }
  return (
    <Component
      className={classes("fui-shimmer-text", className)}
      data-tone={tone === "light" ? "light" : undefined}
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
