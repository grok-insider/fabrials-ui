import type { ComponentProps, ReactNode } from "react";
import { classes } from "./shared";

export type GemName =
  | "stormlight"
  | "heliodor"
  | "sapphire"
  | "ruby"
  | "emerald"
  | "zircon"
  | "smokestone"
  | "amethyst";

/** The faceted gem at the heart of every Fabrials mark. Colored by `--gem`. */
export function FabrialsGem({
  size = 20,
  gem,
  className,
  title,
  ...props
}: Omit<ComponentProps<"svg">, "children"> & {
  size?: number;
  gem?: GemName;
  /** Accessible name. Without it the gem is decorative. */
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      data-gem={gem}
      className={classes("fui-gem", className)}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      focusable="false"
      {...props}
    >
      <path className="fui-gem-crown-left" d="M3.5 9 7.6 3.5h2.9L8.4 9Z" />
      <path className="fui-gem-table" d="M10.5 3.5h3l2.1 5.5H8.4Z" />
      <path className="fui-gem-crown-right" d="M13.5 3.5h2.9L20.5 9h-4.9Z" />
      <path className="fui-gem-pavilion-left" d="M3.5 9h4.9L12 21Z" />
      <path className="fui-gem-pavilion" d="M8.4 9h7.2L12 21Z" />
      <path className="fui-gem-pavilion-right" d="M15.6 9h4.9L12 21Z" />
      <path
        className="fui-gem-edge"
        d="M7.6 3.5h8.8L20.5 9 12 21 3.5 9Z"
        fill="none"
      />
    </svg>
  );
}

export type ProductLockupProps = Omit<ComponentProps<"span">, "children"> & {
  product: ReactNode;
  tagline?: ReactNode;
  gem?: GemName;
  /** Replaces the gem, for example with a product illustration in marketing. */
  mark?: ReactNode;
  size?: "sm" | "md" | "lg";
};

export function ProductLockup({
  product,
  tagline,
  gem,
  mark,
  size = "md",
  className,
  ...props
}: ProductLockupProps) {
  const gemSize = size === "lg" ? 28 : size === "sm" ? 18 : 22;
  return (
    <span
      data-slot="product-lockup"
      data-size={size}
      data-gem={gem}
      className={classes("fui-lockup", className)}
      {...props}
    >
      <span className="fui-lockup-mark">
        {mark ?? <FabrialsGem size={gemSize} />}
      </span>
      <span className="fui-lockup-text">
        <span className="fui-lockup-product">{product}</span>
        {tagline ? <span className="fui-lockup-tagline">{tagline}</span> : null}
      </span>
    </span>
  );
}
