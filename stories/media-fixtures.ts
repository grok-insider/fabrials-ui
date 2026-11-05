// Synthetic pictures for the media stories: SVG scenes as data URIs, so they are deterministic, tiny and need no network.
// Their width and height are their natural size, which is what the viewer zooms to.

type Scene = { width: number; height: number; sky: [string, string]; ground: string; sun: string; label: string };

const encode = (svg: string) => `data:image/svg+xml,${encodeURIComponent(svg)}`;

export function scene({ width, height, sky, ground, sun, label }: Scene): string {
  const horizon = Math.round(height * 0.62);
  const hill = (offset: number, lift: number) =>
    `M0 ${horizon + lift} C ${width * 0.2} ${horizon - 60 + offset} ${width * 0.45} ${horizon + 50} ${width * 0.7} ${horizon - 20 + offset} S ${width} ${horizon + 30} ${width} ${horizon} V ${height} H 0 Z`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
<defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky[0]}"/><stop offset="1" stop-color="${sky[1]}"/></linearGradient></defs>
<rect width="${width}" height="${height}" fill="url(#s)"/>
<circle cx="${width * 0.72}" cy="${height * 0.3}" r="${Math.min(width, height) * 0.09}" fill="${sun}"/>
<path d="${hill(40, 30)}" fill="${ground}" opacity="0.55"/>
<path d="${hill(0, 90)}" fill="${ground}"/>
<g fill="${sky[0]}" opacity="0.5">${Array.from({ length: 24 }, (_, i) => `<rect x="${(i * 97) % width}" y="${horizon + 120 + ((i * 53) % Math.max(1, height - horizon - 140))}" width="${12 + (i % 5) * 6}" height="4"/>`).join("")}</g>
<text x="${width * 0.04}" y="${height * 0.08}" font-family="monospace" font-size="${Math.round(height * 0.03)}" fill="${sun}" opacity="0.8">${label}</text>
</svg>`;
  return encode(svg);
}

export const PHOTOS = [
  { src: scene({ width: 2400, height: 1500, sky: ["#0d1b2e", "#3d6e9c"], ground: "#0a1320", sun: "#e9d8a6", label: "Harbour at dusk" }), alt: "A harbour at dusk under a pale sun" },
  { src: scene({ width: 1200, height: 1800, sky: ["#1b2a22", "#6f9a7c"], ground: "#0f1a14", sun: "#f1e6c8", label: "Orchard, north side" }), alt: "Orchard terraces on the north side" },
  { src: scene({ width: 1600, height: 1600, sky: ["#2a1b26", "#9c6f86"], ground: "#170e14", sun: "#f4d8c4", label: "Quarry lake" }), alt: "A quarry lake at sunset" },
  { src: scene({ width: 3000, height: 1000, sky: ["#121826", "#5a6b8a"], ground: "#0b0f17", sun: "#dfe6f2", label: "Field office panorama" }), alt: "A panorama of the field office" },
  { src: scene({ width: 2000, height: 1300, sky: ["#1e1a12", "#a08a5a"], ground: "#12100a", sun: "#f6ecd2", label: "Night shift, first light" }), alt: "The yard at first light" },
  { src: scene({ width: 1800, height: 1200, sky: ["#101c1c", "#4f8a86"], ground: "#081212", sun: "#e3f1ef", label: "Verdigris roofs" }), alt: "Green copper roofs over the old town" },
];

export const PORTRAIT = scene({ width: 160, height: 160, sky: ["#22314a", "#5d7fa8"], ground: "#141c2a", sun: "#f2e3c2", label: "" });
