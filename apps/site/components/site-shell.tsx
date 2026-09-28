"use client";
import Link from "next/link";
import { GitHubLink } from "@/components/github-link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Menu } from "lucide-react";
import { useTheme } from "next-themes";
import { catalog, guides } from "@/lib/catalog";
import { externalIndex } from "@/lib/external-index.generated";
import { uiCatalog } from "@/lib/ui-catalog";
import uiPackage from "../../../packages/ui/package.json";
import {
  Button,
  ProductLockup,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SiteHeader as FuiSiteHeader,
  ThemeSwitcher,
} from "@fabrials/ui";
export function Mark() {
  return (
    <svg
      width="23"
      height="23"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path d="m15 14 6 6m0-6-6 6" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}
export function SiteHeader() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const path = usePathname();
  useEffect(() => setMounted(true), []);
  const preference =
    mounted && (theme === "light" || theme === "dark" || theme === "system")
      ? theme
      : "system";
  const docsActive = guides.some((guide) => path === `/docs/${guide.slug}`);
  const componentsActive =
    path === "/components" ||
    catalog.some((item) => path === `/docs/${item.slug}`) ||
    uiCatalog.some((item) => path === `/docs/${item.slug}`);
  const librariesActive =
    path === "/libraries" ||
    externalIndex.some((library) => library.items.some((item) => path === `/docs/${item.slug}`));
  const links = (
    <>
      <Link href="/docs/introduction" aria-current={docsActive ? "page" : undefined}>
        Documentation
      </Link>
      <Link href="/components" aria-current={componentsActive ? "page" : undefined}>
        Components
      </Link>
      <Link href="/libraries" aria-current={librariesActive ? "page" : undefined}>
        Libraries
      </Link>
      <Link href="/playground" aria-current={path.startsWith("/playground") ? "page" : undefined}>
        Playground
      </Link>
    </>
  );
  return (
    <FuiSiteHeader
      data-site-header
      brand={
        <Link href="/" className="text-foreground no-underline">
          <ProductLockup product="Fabrials UI" gem="zircon" size="sm" />
        </Link>
      }
      navigation={<nav aria-label="Main navigation">{links}</nav>}
      actions={
        <>
          <GitHubLink />
          <ThemeSwitcher
            value={preference}
            onValueChange={(value) => setTheme(value)}
          />
        </>
      }
      mobileMenu={
        <Sheet>
          <SheetTrigger
            render={<Button variant="ghost" size="icon-sm" aria-label="Open menu" />}
          >
            <Menu />
          </SheetTrigger>
          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle>Fabrials UI</SheetTitle>
            </SheetHeader>
            <nav aria-label="Mobile navigation" className="flex flex-col gap-1 px-4 pb-6">
              {links}
            </nav>
          </SheetContent>
        </Sheet>
      }
    />
  );
}
export function SiteFrame({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      {children}
      <SiteFooter />
    </>
  );
}
export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="flex w-full flex-wrap items-center justify-between gap-4 px-(--fui-page-padding) py-8 text-xs text-muted-foreground">
        <p>
          Made at{" "}
          <a
            href="https://fabrials.com"
            className="text-foreground underline underline-offset-4"
          >
            Fabrials
          </a>
          . Components from other libraries keep their own licenses.
        </p>
        <div className="flex flex-wrap gap-5">
          <a href="https://github.com/grok-insider/fabrials-ui">Source</a>
          <a href="https://github.com/grok-insider/fabrials-ui/blob/master/LICENSE">MIT license</a>
          <a href="/r/registry.json">registry.json</a>
          <a href="/llms.txt">llms.txt</a>
          <span>@fabrials/ui {uiPackage.version}</span>
        </div>
      </div>
    </footer>
  );
}
