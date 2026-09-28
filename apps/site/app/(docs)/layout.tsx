import type { ReactNode } from "react";
import { DocsFrame } from "@/components/docs/docs-shell";

/**
 * The documentation frame (sidebar, library switcher, phone bar) stays mounted
 * while people move between pages, so the sidebar keeps its scroll and open
 * groups; each page renders only its article and index.
 */
export default function DocsLayout({ children }: { children: ReactNode }) {
  return <DocsFrame>{children}</DocsFrame>;
}
