import type { ReactNode } from "react";

/**
 * One way of using a component: a live demo and the code that makes it. The same examples are rendered by the docs pages
 * at ui.fabrials.com and by the component pages in Storybook, so they only import from the packages.
 */
export interface Example {
  id: string;
  title: string;
  /** One or two sentences: when to use this, and what the parameters shown do. */
  description: string;
  /** The code a reader copies: short, real, and the same parameters the demo uses. */
  code: string;
  render: () => ReactNode;
  /** How the demo sits on its stage: `center` for a small control, `start` for a panel or a page part. */
  align?: "center" | "start";
}

export interface ExampleSet {
  /** The component in context, the first thing on its page. */
  preview?: () => ReactNode;
  /** The code of the preview, shown under it: what a reader would write to get it (a replayed demo shows its end state). */
  previewCode?: string;
  examples: Example[];
}
