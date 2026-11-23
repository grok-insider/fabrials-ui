import type { ComponentProps } from "react";
import type { GemName } from "./brand";
import { classes } from "./shared";

export type RadiantOrder =
  | "windrunner"
  | "skybreaker"
  | "dustbringer"
  | "edgedancer"
  | "truthwatcher"
  | "lightweaver"
  | "elsecaller"
  | "willshaper"
  | "stoneward"
  | "bondsmith";

export type RadiantOrderMeta = {
  /** Double Eye position (1 to 10). */
  number: number;
  order: RadiantOrder;
  /** Singular order name ("Windrunner"). */
  name: string;
  /** Plural order name ("Windrunners"). */
  plural: string;
  /** Canonical polestone from the Ten Essences. */
  gem: Exclude<GemName, "stormlight">;
  /** The two Surges bound by this order, in Double Eye order. */
  surges: readonly [string, string];
  /** Patron Herald. */
  herald: string;
  /** Short geometric description of the canonical order glyph. */
  motif: string;
};

/**
 * The Ten Orders of the Knights Radiant in canonical Double Eye order, each
 * paired with its polestone and Surges.
 */
export const RADIANT_ORDERS: readonly RadiantOrderMeta[] = [
  {
    number: 1,
    order: "windrunner",
    name: "Windrunner",
    plural: "Windrunners",
    gem: "sapphire",
    surges: ["Adhesion", "Gravitation"],
    herald: "Jezrien",
    motif: "Winged spear rising along the central axis",
  },
  {
    number: 2,
    order: "skybreaker",
    name: "Skybreaker",
    plural: "Skybreakers",
    gem: "smokestone",
    surges: ["Gravitation", "Division"],
    herald: "Nale",
    motif: "Downward greatsword flanked by diving wings",
  },
  {
    number: 3,
    order: "dustbringer",
    name: "Dustbringer",
    plural: "Dustbringers",
    gem: "ruby",
    surges: ["Division", "Abrasion"],
    herald: "Chanarach",
    motif: "Split rising flame around a central ember core",
  },
  {
    number: 4,
    order: "edgedancer",
    name: "Edgedancer",
    plural: "Edgedancers",
    gem: "diamond",
    surges: ["Abrasion", "Progression"],
    herald: "Vedel",
    motif: "Unfurling symmetrical vine and lotus bud",
  },
  {
    number: 5,
    order: "truthwatcher",
    name: "Truthwatcher",
    plural: "Truthwatchers",
    gem: "emerald",
    surges: ["Progression", "Illumination"],
    herald: "Pailiah",
    motif: "Illuminated watching eye with radiating arcs",
  },
  {
    number: 6,
    order: "lightweaver",
    name: "Lightweaver",
    plural: "Lightweavers",
    gem: "garnet",
    surges: ["Illumination", "Transformation"],
    herald: "Shalash",
    motif: "Woven Cryptic diamond rosette with cardinal needles",
  },
  {
    number: 7,
    order: "elsecaller",
    name: "Elsecaller",
    plural: "Elsecallers",
    gem: "zircon",
    surges: ["Transformation", "Transportation"],
    herald: "Battar",
    motif: "Pointed Oathgate arch pierced by a central keystone",
  },
  {
    number: 8,
    order: "willshaper",
    name: "Willshaper",
    plural: "Willshapers",
    gem: "amethyst",
    surges: ["Transportation", "Cohesion"],
    herald: "Kalak",
    motif: "Twin-horned keystone crest with open angular wings",
  },
  {
    number: 9,
    order: "stoneward",
    name: "Stoneward",
    plural: "Stonewards",
    gem: "topaz",
    surges: ["Cohesion", "Tension"],
    herald: "Taln",
    motif: "Stepped fortress bastion beneath a peaked lintel",
  },
  {
    number: 10,
    order: "bondsmith",
    name: "Bondsmith",
    plural: "Bondsmiths",
    gem: "heliodor",
    surges: ["Tension", "Adhesion"],
    herald: "Ishar",
    motif: "Interlocking Double Eye rings bound by a three-point crown",
  },
] as const;

export const RADIANT_ORDER_MAP: Readonly<Record<RadiantOrder, RadiantOrderMeta>> = Object.fromEntries(
  RADIANT_ORDERS.map((entry) => [entry.order, entry]),
) as Readonly<Record<RadiantOrder, RadiantOrderMeta>>;

type GlyphGeometry = {
  /** Paths symmetric along the central axis (x = 32 in a 64x64 box). */
  axis: readonly string[];
  /** Left-side paths (x <= 32), mirrored across x = 32 for exact Vorin symmetry. */
  half: readonly string[];
  /** Optional fillRule for paths with inner cutouts. */
  fillRule?: "evenodd" | "nonzero";
};

/**
 * Canonical bilaterally symmetrical Vorin glyph geometry for the Ten Orders of
 * the Knights Radiant, engineered on a 64×64 grid for crisp rendering from 16 px
 * icons up to large architectural plates.
 */
const GLYPH_GEOMETRY: Readonly<Record<RadiantOrder, GlyphGeometry>> = {
  windrunner: {
    axis: [
      "M32 3C34.7 10.2 35.3 17.5 34.1 26.5L33.5 53.5L32 61L30.5 53.5L29.9 26.5C28.7 17.5 29.3 10.2 32 3Z",
      "M32 42.5L36.8 47.2L32 52L27.2 47.2Z",
    ],
    half: [
      // Great sweeping outer wing
      "M26.8 45.2C14.2 41.2 6.4 29.2 5.4 11.2C9.8 14 14 17.4 17.4 22.4C14.8 28 16.8 34.8 26.2 39.8Z",
      // Secondary inner wing feather
      "M26.2 33.6C18.6 30 14.6 22.8 14.6 12.8C18.2 16.4 21.4 21 26.2 26.6Z",
      // Flanking upper spear plume
      "M27.6 21.2C24 17 21.6 12.4 21.6 6.8C24.8 10.4 27 14.4 28.2 18.2Z",
      // Swept lower tail vane
      "M28 49.6C23 52 18.4 54.2 14.4 57.8C19.6 57.2 24.6 55.4 28.6 52.6Z",
    ],
  },
  skybreaker: {
    axis: [
      // Diamond pommel crest
      "M32 3.2L36.4 8.6L32 13.8L27.6 8.6Z",
      // Severe downward greatsword blade
      "M29.1 15.4L34.9 15.4L34.1 45.2L32 61L29.9 45.2Z",
    ],
    half: [
      // High-shouldered rigid diving wing / crossguard
      "M28.6 15L9.6 15.6C8.8 25.4 10.4 36.8 15.4 46.8C14.9 37.8 14.8 29 16.2 21.6L28.6 19.6Z",
      // Inner parallel dividing scale blade
      "M26.2 24.2L20.4 26.2C19.4 34.8 20.4 43.8 24 52C24.6 43.8 24.9 34.2 26.2 24.2Z",
      // Austere upper brow bar flanking the pommel
      "M25.8 11.4C21.2 10.4 16.4 9.6 11.8 11.4C16.2 6.8 21.4 6.4 26.4 8.4Z",
    ],
  },
  dustbringer: {
    axis: [
      // Central ember diamond floating inside the split flame
      "M32 25.4L35.4 31.6L32 37.8L28.6 31.6Z",
      // Lower central spark drop
      "M32 49.2L35.6 55.2L32 61L28.4 55.2Z",
    ],
    half: [
      // Inner forked flame spire rising around the core
      "M30.2 46.8C22 41.6 19.4 32 21.4 21.4C22.8 14.8 25 9.8 26.6 4.8C29 11.4 28.6 18 26.8 24.6C25 31.6 25.6 38.2 30.6 42.6Z",
      // Outer erupting flame tongue curling inward at the tip
      "M25.4 47.2C12.8 42.6 6.2 33 6.2 22.4C6.2 16.2 9.4 11.8 15.2 9.2C12.6 15.4 12 22 14.6 28.6C17 34.6 20.6 39.6 26.6 43.6Z",
      // Outward-bursting lower Division spark wedge
      "M25 50.6C18.4 50.6 12.2 52.8 7.6 56.8C13.4 56.8 20 56 26 53.6Z",
      // Upper floating flame lick
      "M19.8 18.8C17.2 15.4 16.8 12.2 18.4 8.6C20.6 11.6 21.2 15 19.8 18.8Z",
    ],
  },
  edgedancer: {
    axis: [
      // Top lotus diamond bud
      "M32 4.8C35.2 9.8 36 14.6 32 19.8C28 14.6 28.8 9.8 32 4.8Z",
      // Slender central stem
      "M32 24.2C33.6 32.2 33.9 46.2 32 60C30.1 46.2 30.4 32.2 32 24.2Z",
    ],
    half: [
      // Sweeping upper unfurling frond / petal S-curve
      "M28.6 38.2C16.2 35.6 7.2 28.6 7.2 19.4C7.2 12.2 14 8.2 21.8 9.8C16 12.4 12.8 16 13.4 20.6C14.2 26.8 20.2 31.2 28.6 33.6Z",
      // Flowing lower glide-vine curling smoothly inward
      "M28.2 40.2C18.8 42.2 11.2 46.2 11.2 52.2C11.2 57.8 17 60.2 24.8 58.2C19.2 57.2 16.4 54.6 17 51.6C17.8 47.6 22.6 44.6 28.6 43.6Z",
      // Delicate inner leaf bud
      "M26.6 26.2C21.4 24.2 18.4 20.4 18.8 15.8C22.4 17.8 25.6 21 27.6 24.6Z",
      // Outer teardrop leaf balancing the curve
      "M13.6 37.6C8.8 37 5.8 39.2 5.2 43.4C9.4 42.8 12.6 40.8 13.6 37.6Z",
    ],
  },
  truthwatcher: {
    axis: [
      // Rising illumination beacon spire
      "M32 3.2L35.2 13.4L32 17.8L28.8 13.4Z",
      // Sharp vertical diamond iris
      "M32 24.8L37.2 32L32 39.2L26.8 32Z",
      // Tapered lower prism pendant
      "M32 46.2L35.4 51.6L32 60.8L28.6 51.6Z",
    ],
    half: [
      // Upper vesica eyelid arc
      "M10.4 32C16.2 22.4 23.4 18.8 31.4 18.8L31.4 22.8C24.6 23 19 26.2 14.4 32Z",
      // Lower vesica eyelid arc
      "M10.4 32C16.2 41.6 23.4 45.2 31.4 45.2L31.4 41.2C24.6 41 19 37.8 14.4 32Z",
      // Radiating upper brow arc
      "M11.6 23C15.4 15.8 20.6 11.8 27.4 9.8C23.6 14.4 19.2 18.2 15.6 23Z",
      // Lower reflection cradle arc
      "M11.6 41C15.4 48.2 20.6 52.2 27.4 54.2C23.6 49.6 19.2 45.8 15.6 41Z",
      // Outer diamond light-mote (sized to hold crisp at 16 px)
      "M3 32L6.8 27.8L10.2 32L6.8 36.2Z",
    ],
  },
  lightweaver: {
    fillRule: "evenodd",
    axis: [
      // Faceted hollow Cryptic central diamond
      "M32 21.8L40.6 32L32 42.2L23.4 32ZM32 27.2L27.8 32L32 36.8L36.2 32Z",
      // North cardinal needle
      "M32 3.4L35.8 13.6L32 19.4L28.2 13.6Z",
      // South cardinal needle
      "M32 60.6L35.8 50.4L32 44.6L28.2 50.4Z",
    ],
    half: [
      // West cardinal needle
      "M3.4 32L13.6 28.2L19.4 32L13.6 35.8Z",
      // Upper woven illusion petal loop
      "M28.6 16.4C21.8 13.6 15.6 11.6 9.6 9.8C11.6 15.8 13.8 22 16.4 28.6L20.8 25.8C18.6 21.8 17.2 18.6 16.2 16.2C18.6 17.2 21.8 18.6 25.8 20.8Z",
      // Lower woven illusion petal loop
      "M28.6 47.6C21.8 50.4 15.6 52.4 9.6 54.2C11.6 48.2 13.8 42 16.4 35.4L20.8 38.2C18.6 42.2 17.2 45.4 16.2 47.8C18.6 46.8 21.8 45.4 25.8 43.2Z",
      // Upper outer grace crescent
      "M24 7C19.6 6.4 15.8 7 12.2 9C16.6 9.4 20.4 10.2 24.2 11.6Z",
      // Lower outer grace crescent
      "M24 57C19.6 57.6 15.8 57 12.2 55C16.6 54.6 20.4 53.8 24.2 52.4Z",
    ],
  },
  elsecaller: {
    axis: [
      // Slender central transportation needle
      "M32 15.2L33.9 22.8L33.5 49.2L32 54.6L30.5 49.2L30.1 22.8Z",
      // Floating central diamond keystone
      "M32 24.4L37.4 31L32 37.6L26.6 31Z",
      // Stepped architectural threshold bar
      "M10.2 55.4L53.8 55.4L50.8 59.6L13.2 59.6Z",
    ],
    half: [
      // Pointed gothic Oathgate portal arch
      "M13.8 53.6L13.8 31C13.8 18.8 21 9.8 32 3.8L32 10.4C23.8 15.4 19.2 22.8 19.2 31.6L19.2 53.6Z",
      // Inner portal threshold jamb
      "M22.4 52.2L22.4 39C22.4 35.4 24 32.4 26.6 30.4C25.2 34 25.2 37.6 25.6 41.2L25.6 52.2Z",
      // Outer architectural buttress flare
      "M11.4 28C7.8 32 6.2 37.6 7.2 45.8C9.4 42.6 11.2 39.6 11.4 36Z",
      // Upper portal spire fin
      "M21.2 12.2L15.4 8.6L18 15.6Z",
    ],
  },
  willshaper: {
    axis: [
      // Centered freedom diamond between the twin horns
      "M32 6.4L35.8 12.4L32 18.4L28.2 12.4Z",
      // Sculpted central column tapering to a faceted chisel base
      "M28.4 22.6L35.6 22.6L36 46.8L32 60.8L28 46.8Z",
    ],
    half: [
      // Bold sweeping upper horn crest
      "M28.6 25.4C20.8 22.4 14.6 16 13 5C17.8 9.2 22 14.4 28.6 20.2Z",
      // Dynamic stepped open-wing arm
      "M26.6 28.4L6 27.4C7 37 9.6 44.6 15.6 50.4C15 43.8 15.2 38.4 17.6 34.6L26.6 33.6Z",
      // Inner sculpted bracket anchoring the lower shaft
      "M26 38.4C21.2 40.8 18.6 45.6 20.2 53.8C23.2 50 25 46.2 26.2 42.6Z",
    ],
  },
  stoneward: {
    axis: [
      // Vorin peaked mountain-crown & keystone diamond
      "M32 4.2L36.2 11L32 16.4L27.8 11Z",
      // Broad tapered citadel spine anchored into the stone
      "M27.4 20.4L36.6 20.4L37.8 52.2L32 58.6L26.2 52.2Z",
    ],
    half: [
      // Swept angular bastion brow arching out from the crown
      "M27.2 14.6C21 15.6 15.4 17.8 10.6 21.8C15.8 22 21.2 21.2 26.8 19Z",
      // Tapered megalithic bastion pillar flanking the citadel
      "M23.6 24.4L15 24.4C12.8 33.4 11.4 42.8 11.4 52.2L22.8 52.2C22.4 42.8 22.6 33.6 23.6 24.4Z",
      // Outer carved armor spur
      "M11.6 27.6C7.8 31.6 5.8 38.4 6.2 48.2C8.6 45 10.2 40.8 11 35.6Z",
      // Stepped foundation wedge anchoring the fortress base
      "M8.4 54.4C15.4 54.4 22.4 54.8 28.6 56.6L25.4 60C19.6 59.2 14.2 58.2 10.4 57.6Z",
    ],
  },
  bondsmith: {
    axis: [
      // Central spike of the three-pointed Bondsmith crown
      "M32 3.2L35 11L32 14.4L29 11Z",
      // Uniting vertical scepter threading both rings
      "M30.1 14.4L33.9 14.4L33.9 51.6L32 60.8L30.1 51.6Z",
      // Radiant Double Eye nexus clasp
      "M32 25.2L38.2 32L32 38.8L25.8 32Z",
    ],
    half: [
      // Flanking crown tine (three points for the three Bondsmiths)
      "M26.4 13.2L21 6.2L22.2 14.2Z",
      // Upper Double Eye ring half
      "M31 13.4C23 13.4 17.8 18 17.8 23.8C17.8 28.2 20.8 31.4 25.4 32.6L26.5 29.4C23.4 28.4 21.5 26.4 21.5 23.8C21.5 19.8 25.2 16.8 31 16.8Z",
      // Lower Double Eye ring half
      "M31 50.6C23 50.6 17.8 46 17.8 40.2C17.8 35.8 20.8 32.6 25.4 31.4L26.5 34.6C23.4 35.6 21.5 37.6 21.5 40.2C21.5 44.2 25.2 47.2 31 47.2Z",
      // Sweeping outer binding crescent pulling the emblem into unity
      "M17.8 15.4C9.2 20 6.2 26 6.2 32C6.2 38 9.2 44 17.8 48.6C12.8 43.2 10.6 37.8 10.6 32C10.6 26.2 12.8 20.8 17.8 15.4Z",
      // Calligraphic lower uniting scroll
      "M28.6 52.8C24.2 53.6 20.2 55 17 57.6C21.6 57.4 25.6 56.6 29.2 55.2Z",
    ],
  },
};

export type RadiantGlyphProps = Omit<ComponentProps<"svg">, "children"> & {
  /** Which of the ten Knights Radiant orders to draw. */
  order: RadiantOrder;
  /** Width and height in CSS pixels. Crisp from 16 px up to plate scale. */
  size?: number;
  /** When true, paints the glyph in its order's canonical polestone token (`--gem`). */
  colored?: boolean;
  /** Accessible name. Without it the glyph is decorative (`aria-hidden`). */
  title?: string;
};

/**
 * Canonical bilaterally symmetrical glyph for one of the ten Orders of the
 * Knights Radiant. Inherits `currentColor` by default; pass `colored` to paint
 * it in the order's polestone (`--gem-*`).
 */
export function RadiantGlyph({
  order,
  size = 24,
  colored = false,
  className,
  title,
  ...props
}: RadiantGlyphProps) {
  const meta = RADIANT_ORDER_MAP[order];
  const geom = GLYPH_GEOMETRY[order];
  const fillRule = geom.fillRule;
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      data-slot="radiant-glyph"
      data-order={order}
      data-gem={meta.gem}
      data-colored={colored || undefined}
      className={classes("fui-radiant-glyph", className)}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      focusable="false"
      {...props}
    >
      <g fill="currentColor" fillRule={fillRule}>
        {geom.axis.map((d, index) => (
          <path key={`a${index}`} d={d} />
        ))}
        {geom.half.map((d, index) => (
          <path key={`l${index}`} d={d} />
        ))}
        <g transform="translate(64 0) scale(-1 1)">
          {geom.half.map((d, index) => (
            <path key={`r${index}`} d={d} />
          ))}
        </g>
      </g>
    </svg>
  );
}
