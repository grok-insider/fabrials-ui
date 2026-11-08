// Synthetic pictures for the examples: SVG scenes as data URIs, deterministic, tiny and without network.

type Scene = { width: number; height: number; sky: [string, string]; ground: string; sun: string; /** Makes a new picture of the same scene: a browser has not cached it. */ copy?: number };

const encode = (svg: string) => `data:image/svg+xml,${encodeURIComponent(svg)}`;

export function scene({ width, height, sky, ground, sun, copy }: Scene): string {
  const horizon = Math.round(height * 0.62);
  const hill = (offset: number, lift: number) =>
    `M0 ${horizon + lift} C ${width * 0.2} ${horizon - 60 + offset} ${width * 0.45} ${horizon + 50} ${width * 0.7} ${horizon - 20 + offset} S ${width} ${horizon + 30} ${width} ${horizon} V ${height} H 0 Z`;
  return encode(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
<defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky[0]}"/><stop offset="1" stop-color="${sky[1]}"/></linearGradient></defs>
${copy === undefined ? "" : `<desc>copy ${copy}</desc>`}<rect width="${width}" height="${height}" fill="url(#s)"/>
<circle cx="${width * 0.7}" cy="${height * 0.32}" r="${Math.min(width, height) * 0.1}" fill="${sun}"/>
<path d="${hill(40, 30)}" fill="${ground}" opacity="0.55"/>
<path d="${hill(0, 90)}" fill="${ground}"/>
</svg>`);
}

export const HARBOUR = scene({ width: 1024, height: 1024, sky: ["#0d1b2e", "#3d6e9c"], ground: "#0a1320", sun: "#e9d8a6" });
export const ORCHARD_SCENE: Scene = { width: 1024, height: 640, sky: ["#1b2a22", "#6f9a7c"], ground: "#0f1a14", sun: "#f1e6c8" };
export const ORCHARD = scene(ORCHARD_SCENE);
export const QUARRY = scene({ width: 768, height: 1024, sky: ["#2a1b26", "#9c6f86"], ground: "#170e14", sun: "#f4d8c4" });

/** A small picture attachment. */
export const PHOTO = scene({ width: 320, height: 240, sky: ["#121826", "#5a6b8a"], ground: "#0b0f17", sun: "#dfe6f2" });

type Sitter = { background: string; skin: string; hair: string; shirt: string };

/** A synthetic portrait for an avatar: a head and shoulders on a soft ground. Drawn, not a person. */
export function portrait({ background, skin, hair, shirt }: Sitter): string {
  return encode(`<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
<rect width="96" height="96" fill="${background}"/>
<path d="M12 96c3-21 17-31 36-31s33 10 36 31z" fill="${shirt}"/>
<rect x="41" y="52" width="14" height="14" rx="6" fill="${skin}"/>
<ellipse cx="48" cy="40" rx="16" ry="18" fill="${skin}"/>
<path d="M31 40c-2-15 6-25 17-25s20 9 17 25c-3-8-9-12-17-12s-14 4-17 12z" fill="${hair}"/>
</svg>`);
}

export const PORTRAITS = {
  ana: portrait({ background: "#c9d8e8", skin: "#d9a37f", hair: "#3a2a22", shirt: "#3d5a80" }),
  rafael: portrait({ background: "#dbe7d4", skin: "#8d5b3e", hair: "#1d1a17", shirt: "#4f6d4a" }),
  lena: portrait({ background: "#efe0cf", skin: "#f0c7a6", hair: "#b8863b", shirt: "#7a4b6e" }),
};
