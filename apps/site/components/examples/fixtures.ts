// Synthetic pictures for the examples: SVG scenes as data URIs, deterministic, tiny and without network.

type Scene = { width: number; height: number; sky: [string, string]; ground: string; sun: string };

const encode = (svg: string) => `data:image/svg+xml,${encodeURIComponent(svg)}`;

export function scene({ width, height, sky, ground, sun }: Scene): string {
  const horizon = Math.round(height * 0.62);
  const hill = (offset: number, lift: number) =>
    `M0 ${horizon + lift} C ${width * 0.2} ${horizon - 60 + offset} ${width * 0.45} ${horizon + 50} ${width * 0.7} ${horizon - 20 + offset} S ${width} ${horizon + 30} ${width} ${horizon} V ${height} H 0 Z`;
  return encode(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
<defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky[0]}"/><stop offset="1" stop-color="${sky[1]}"/></linearGradient></defs>
<rect width="${width}" height="${height}" fill="url(#s)"/>
<circle cx="${width * 0.7}" cy="${height * 0.32}" r="${Math.min(width, height) * 0.1}" fill="${sun}"/>
<path d="${hill(40, 30)}" fill="${ground}" opacity="0.55"/>
<path d="${hill(0, 90)}" fill="${ground}"/>
</svg>`);
}

export const HARBOUR = scene({ width: 1024, height: 1024, sky: ["#0d1b2e", "#3d6e9c"], ground: "#0a1320", sun: "#e9d8a6" });
export const ORCHARD = scene({ width: 1024, height: 640, sky: ["#1b2a22", "#6f9a7c"], ground: "#0f1a14", sun: "#f1e6c8" });
export const QUARRY = scene({ width: 768, height: 1024, sky: ["#2a1b26", "#9c6f86"], ground: "#170e14", sun: "#f4d8c4" });

/** A small picture attachment. */
export const PHOTO = scene({ width: 320, height: 240, sky: ["#121826", "#5a6b8a"], ground: "#0b0f17", sun: "#dfe6f2" });
