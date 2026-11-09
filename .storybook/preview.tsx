import { useEffect, type ReactNode } from "react";
import type { Preview } from "@storybook/react-vite";
import { fabrialsTheme } from "./theme";
import "../stories/reset.css";
import "@fabrials/ui/tokens.css";
import "@fabrials/ui/fonts.css";
import "@fabrials/ui/styles.css";
import "@fabrials/ai-ui/styles.css";
import "../stories/catalogue.css";
import "../stories/showcase.css";

function PreviewFrame({
  theme,
  density,
  children,
}: {
  theme: string;
  density: string;
  children: ReactNode;
}) {
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.lang = "en";
  }, [theme]);
  return <div data-density={density}>{children}</div>;
}

const preview: Preview = {
  globalTypes: {
    theme: {
      description: "Theme",
      toolbar: {
        icon: "circlehollow",
        items: ["light", "dark"],
        dynamicTitle: true,
      },
    },
    density: {
      description: "Density",
      toolbar: {
        icon: "component",
        items: ["standard", "compact"],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { theme: "light", density: "standard" },
  parameters: {
    layout: "fullscreen",
    a11y: { test: "error" },
    docs: { theme: fabrialsTheme },
    options: {
      storySort: {
        order: ["Overview", "Foundations", "Components", "Agents", "Patterns", "Tests", "Archive"],
      },
    },
  },
  decorators: [
    (Story, context) => (
      <PreviewFrame
        theme={context.globals.theme}
        density={context.globals.density}
      >
        <Story />
      </PreviewFrame>
    ),
  ],
};

export default preview;
