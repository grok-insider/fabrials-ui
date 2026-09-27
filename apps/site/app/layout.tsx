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
    "The Fabrials design system as a shadcn registry: Fabrials components, shims and license-checked components from other open-source libraries.",
  openGraph: {
    title: "Fabrials UI",
    description: "The Fabrials design system, ready to install with shadcn.",
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
