import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { StorybookConfig } from "@storybook/react-vite";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// Every public Base UI entry point (`@base-ui/react/<name>` in its exports map), pre-bundled in one pass. Found one at a
// time, Vite's optimizer bundles each later entry separately, with its own copy of Base UI's shared contexts: a
// DirectionProvider then never reached a slider, and context-menu parts once missed their menu.
const baseUi = resolve(root, "node_modules/@base-ui/react/package.json");
const baseUiEntries = Object.keys((JSON.parse(readFileSync(baseUi, "utf8")) as { exports: Record<string, unknown> }).exports)
  .filter((key) => /^\.\/[a-z-]+$/.test(key))
  .map((key) => `@base-ui/react/${key.slice(2)}`);

// Stories read the packages' sources, not their builds: a change shows at once, and the props tables and controls are read
// from the TypeScript types and their comments. The fonts stay on the build, which carries the font files.
const sources = [
  { find: /^@fabrials\/ui$/, replacement: resolve(root, "packages/ui/src/index.ts") },
  { find: /^@fabrials\/ui\/dither$/, replacement: resolve(root, "packages/ui/src/dither.ts") },
  { find: /^@fabrials\/ui\/moon$/, replacement: resolve(root, "packages/ui/src/moon-math.ts") },
  { find: /^@fabrials\/ui\/spreadsheet$/, replacement: resolve(root, "packages/ui/src/spreadsheet-read.ts") },
  { find: /^@fabrials\/ui\/export$/, replacement: resolve(root, "packages/ui/src/export.ts") },
  { find: /^@fabrials\/ui\/button-variants$/, replacement: resolve(root, "packages/ui/src/button-variants.ts") },
  { find: /^@fabrials\/ui\/(tokens|styles)\.css$/, replacement: resolve(root, "packages/ui/src/$1.css") },
  { find: /^@fabrials\/ai-ui$/, replacement: resolve(root, "packages/ai-ui/src/index.tsx") },
  { find: /^@fabrials\/ai-ui\/styles\.css$/, replacement: resolve(root, "packages/ai-ui/src/styles.css") },
];

const config: StorybookConfig = {
  stories: ["../stories/**/*.mdx", "../stories/**/*.stories.tsx"],
  addons: ["@storybook/addon-a11y", "@storybook/addon-docs"],
  framework: "@storybook/react-vite",
  core: { disableTelemetry: true, disableWhatsNewNotifications: true },
  // The onboarding checklist is Storybook's own tour; this catalogue starts at Overview instead.
  features: { sidebarOnboardingChecklist: false } as StorybookConfig["features"],
  typescript: {
    reactDocgen: "react-docgen-typescript",
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      shouldRemoveUndefinedFromOptional: true,
      // A component's own props, not the hundreds of HTML and Base UI attributes it passes through.
      propFilter: (prop) => !prop.parent || !/node_modules/.test(prop.parent.fileName),
    },
  },
  async viteFinal(config) {
    const alias = config.resolve?.alias;
    const existing = Array.isArray(alias) ? alias : Object.entries(alias ?? {}).map(([find, replacement]) => ({ find, replacement }));
    config.resolve = { ...config.resolve, dedupe: ["react", "react-dom"], alias: [...sources, ...existing] };
    config.optimizeDeps = { ...config.optimizeDeps, include: [...(config.optimizeDeps?.include ?? []), ...baseUiEntries] };
    return config;
  },
};

export default config;
