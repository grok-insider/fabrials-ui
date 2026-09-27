"use client";

import type { ComponentProps } from "react";
import { DitherCanvas, type DitherFieldFactory } from "./dither-canvas";
import type { GemName } from "./brand";
import { gemField, gemRamp, STORM_RAMP, stormBandField, stormField } from "./dither-presets";
import { classes } from "./shared";

export type DitherSceneProps = Omit<ComponentProps<"div">, "children"> & {
  /** `hero`: the front covers the right of the box. `full`: it covers nearly all of it (sign-in). */
  variant?: "hero" | "full";
  seed?: number;
  /** One-time reveal in ms when the scene first paints; 0 turns it off. */
  reveal?: number;
  /** CSS pixels per dither dot. */
  cell?: number;
};

const FRONTS = { hero: [0.12, 0.62], full: [-0.05, 0.7] } as const;

/**
 * The Highstorm storm front behind a landing hero or a sign-in page. It fills
 * its box (position the box, the scene is absolute) and fades into the
 * surface behind it. Keep text off the dense part: put it on the calm side or
 * on a solid surface.
 */
export function DitherScene({ variant = "hero", seed, reveal = 1200, cell = 3, className, ...props }: DitherSceneProps) {
  const front = FRONTS[variant];
  const field: DitherFieldFactory = (_theme, { width, height }, progress) =>
    stormField(width / height, progress, { front: [front[0], front[1]], seed: seed ?? (variant === "hero" ? 7 : 21) });
  return (
    <div aria-hidden data-slot="dither-scene" data-variant={variant} className={classes("fui-dither-scene", className)} {...props}>
      <DitherCanvas ramp={STORM_RAMP} order="ramp" field={field} cell={cell} reveal={reveal || undefined} paintKey={`${variant}:${seed ?? ""}`} />
    </div>
  );
}

export type DitherBandProps = Omit<ComponentProps<"div">, "children"> & {
  seed?: number;
  cell?: number;
};

/** A thin storm band that signs a section or page header. Decorative; put the heading below it. */
export function DitherBand({ seed = 33, cell = 3, className, ...props }: DitherBandProps) {
  const field: DitherFieldFactory = (_theme, { width, height }) => stormBandField(width / height, seed);
  return (
    <div aria-hidden data-slot="dither-band" className={classes("fui-dither-band", className)} {...props}>
      <DitherCanvas ramp={STORM_RAMP} order="ramp" field={field} cell={cell} paintKey={seed} />
    </div>
  );
}

export type DitherGemProps = Omit<ComponentProps<"span">, "children"> & {
  /** The product's gem. */
  gem?: GemName;
  /** Box size in CSS pixels. */
  size?: number;
  /** CSS pixels per dither dot; defaults to one dot per ~10th of the size, at least 2. */
  cell?: number;
  /** One-time fill with light in ms (large marks only). */
  reveal?: number;
};

/**
 * A cut gem filled with dithered light: the product mark in navigation,
 * index rows, empty states and, large, beside a hero. Decorative; pair it
 * with the product name.
 */
export function DitherGem({ gem = "stormlight", size = 20, cell, reveal, className, style, ...props }: DitherGemProps) {
  const field: DitherFieldFactory = (_theme, { width, height }, progress) => gemField(width, height, progress);
  return (
    <span
      aria-hidden
      data-slot="dither-gem"
      data-gem={gem}
      className={classes("fui-dither-gem", className)}
      style={{ width: size, height: size, ...style }}
      {...props}
    >
      <DitherCanvas ramp={gemRamp(gem)} order="ramp" field={field} cell={cell ?? Math.max(2, Math.round(size / 12))} reveal={reveal} paintKey={gem} />
    </span>
  );
}
