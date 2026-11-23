import type { Metadata } from "next";
import { SiteFrame } from "@/components/site-shell";
import { DocsSearchDialog } from "@/components/docs/docs-search-dialog";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";
import { RootProvider } from "fumadocs-ui/provider/next";
export const metadata: Metadata = {
  metadataBase: new URL("https://ui.fabrials.com"),
  title: {
    default: "Fabrials UI",
    template: "%s · Fabrials UI",
  },
  description:
    "The Fabrials design system and shadcn registry: calibrated React 19 + Base UI components, agent UI primitives, shims and canonical Stormlight marks.",
  openGraph: {
    title: "Fabrials UI",
    description: "Calibrated interfaces for products and agents — @fabrials/ui, @fabrials/ai-ui and shadcn registry.",
  },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-gem="zircon" suppressHydrationWarning>
      <body>
        <a
          href="#main-content"
          className="sr-only z-50 rounded bg-background p-3 focus:not-sr-only focus:fixed"
        >
          Skip to content
        </a>
        <RootProvider
          theme={{ storageKey: "fabrials-ui-theme", hotKey: false }}
          search={{ SearchDialog: DocsSearchDialog }}
        >
          <TooltipProvider>
            <SiteFrame>{children}</SiteFrame>
          </TooltipProvider>
        </RootProvider>
      </body>
    </html>
  );
}
