import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { StorybookConfig } from "@storybook/react-vite";

// Every public Base UI entry point (`@base-ui/react/<name>` in its exports map), pre-bundled in one pass. Found one at a
// time, Vite's optimizer bundles each later entry separately, with its own copy of Base UI's shared contexts: a
// DirectionProvider then never reached a slider, and context-menu parts once missed their menu.
const baseUi = resolve(dirname(fileURLToPath(import.meta.url)), "../node_modules/@base-ui/react/package.json");
const baseUiEntries = Object.keys((JSON.parse(readFileSync(baseUi, "utf8")) as { exports: Record<string, unknown> }).exports)
  .filter((key) => /^\.\/[a-z-]+$/.test(key))
  .map((key) => `@base-ui/react/${key.slice(2)}`);

const config: StorybookConfig = {
  stories: ["../stories/**/*.stories.tsx"],
  addons: ["@storybook/addon-a11y"],
  framework: "@storybook/react-vite",
  core: { disableTelemetry: true },
  async viteFinal(config) {
    config.resolve = { ...config.resolve, dedupe: ["react", "react-dom"] };
    config.optimizeDeps = { ...config.optimizeDeps, include: [...(config.optimizeDeps?.include ?? []), ...baseUiEntries] };
    return config;
  },
};

export default config;
