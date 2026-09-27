/**
 * Design conformance for third-party components: a static reading of their
 * source and CSS against DESIGN.md. It informs, it does not block; the
 * `fabrials` tier needs a clean report, `community` shows it on the page.
 */

export type ConformanceCheck =
  | "literal-colours"
  | "continuous-motion"
  | "ignores-reduced-motion"
  | "gradients"
  | "glow"
  | "overrides-theme";

export type ConformanceFinding = { check: ConformanceCheck; message: string; evidence: string };

export type ConformanceInput = {
  sources: string[];
  css?: unknown;
  cssVars?: { theme?: Record<string, string>; light?: Record<string, string>; dark?: Record<string, string> };
};

const PALETTE =
  "red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|stone";
const UTILITY = "bg|text|border|from|to|via|fill|stroke|ring|shadow|outline|decoration|divide|placeholder|caret|accent";

/** shadcn semantic token names a component must not redefine. */
const THEME_TOKENS = new Set([
  "background", "foreground", "card", "card-foreground", "popover", "popover-foreground", "primary",
  "primary-foreground", "secondary", "secondary-foreground", "muted", "muted-foreground", "accent",
  "accent-foreground", "destructive", "border", "input", "ring", "radius",
]);

function firstMatch(text: string, pattern: RegExp): string | null {
  const match = pattern.exec(text);
  return match ? match[0].slice(0, 80) : null;
}

export function checkConformance({ sources, css, cssVars }: ConformanceInput): ConformanceFinding[] {
  const code = sources.join("\n");
  const styles = JSON.stringify(css ?? {}) + JSON.stringify(cssVars?.theme ?? {});
  const all = `${code}\n${styles}`;
  const findings: ConformanceFinding[] = [];
  const add = (check: ConformanceCheck, message: string, evidence: string | null) => {
    if (evidence) findings.push({ check, message, evidence });
  };

  add(
    "literal-colours",
    "Uses literal colours instead of theme tokens, so it will not follow the Fabrials palette or dark mode on its own.",
    firstMatch(code, new RegExp(`\\b(?:${UTILITY})-(?:${PALETTE})-\\d{2,3}\\b`)) ??
      firstMatch(code, /#[0-9a-fA-F]{3,8}\b(?![\w-])|\b(?:rgb|rgba|hsl|hsla)\(\s*\d/),
  );
  const continuous =
    firstMatch(all, /\binfinite\b/) ?? firstMatch(code, /repeat:\s*Infinity|repeatType:\s*["']loop/);
  add("continuous-motion", "Runs a continuous animation. DESIGN.md reserves continuous motion for loading indicators.", continuous);
  const animates = continuous ?? firstMatch(all, /@keyframes [\w-]+|\banimate-[\w-]+|from ["']motion[^"']*["']|from ["']framer-motion["']|transition=\{/);
  const respectsReducedMotion = /prefers-reduced-motion|motion-reduce:|motion-safe:|useReducedMotion|reducedMotion/.test(all);
  if (animates && !respectsReducedMotion)
    add("ignores-reduced-motion", "Animates without checking reduced motion; people who ask the system for less motion still get it.", animates);
  add(
    "gradients",
    "Draws decorative gradients; Fabrials keeps surfaces flat and lets dithering carry the light.",
    firstMatch(all, /\b(?:bg-gradient-to-\w+|bg-linear-\w+|bg-radial|bg-conic|linear-gradient\(|radial-gradient\(|conic-gradient\()/),
  );
  add(
    "glow",
    "Adds glow or blur effects, which Fabrials avoids.",
    firstMatch(all, /shadow-\[0_0_|drop-shadow-\[|\bblur-(?:sm|md|lg|xl|2xl|3xl)\b|blur\(\d|box-shadow:\s*0 0 \d+px/),
  );
  const overridden = [...Object.keys(cssVars?.light ?? {}), ...Object.keys(cssVars?.dark ?? {})].filter((name) =>
    THEME_TOKENS.has(name),
  );
  if (overridden.length)
    add("overrides-theme", "Redefines theme tokens, which would change the palette of the whole app.", overridden.join(", "));
  return findings;
}
