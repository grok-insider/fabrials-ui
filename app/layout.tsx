import type { Metadata } from "next";
import { SiteFrame } from "@/components/site-shell";
import { TooltipProvider } from "@/components/ui/tooltip";
import "@fabrials/ui/fonts.css";
import "@fabrials/ui/tokens.css";
import "./globals.css";
import "@fabrials/ui/styles.css";
import { RootProvider } from "fumadocs-ui/provider/next";
export const metadata: Metadata = {
  metadataBase: new URL("https://ui.fabrials.com"),
  title: {
    default: "Fabrials UI — Built for people. Ready for agents.",
    template: "%s · Fabrials UI",
  },
  description:
    "Open-source shadcn components for WebMCP and MCP. Build interfaces that people and AI agents can use together.",
  openGraph: {
    title: "Fabrials WebMCP UI",
    description: "Open code. Shared interfaces. Built with shadcn.",
  },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <a
          href="#main-content"
          className="sr-only z-50 rounded bg-background p-3 focus:not-sr-only focus:fixed"
        >
          Skip to content
        </a>
        <RootProvider
          theme={{ storageKey: "fabrials-ui-theme", hotKey: false }}
        >
          <TooltipProvider>
            <SiteFrame>{children}</SiteFrame>
          </TooltipProvider>
        </RootProvider>
      </body>
    </html>
  );
}
