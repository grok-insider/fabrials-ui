"use client";
import Link from "next/link";
import { GitHubLink } from "@/components/github-link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Menu } from "lucide-react";
import { useTheme } from "next-themes";
import { catalog, guides } from "@/lib/catalog";
import { uiCatalog } from "@/lib/ui-catalog";
import uiPackage from "../../../packages/ui/package.json";
import {
  Badge,
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
import "@/components/landing/landing.css";

export function Mark() {
  return (
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3z" stroke="currentColor" strokeWidth="1.8" />
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
    mounted && (theme === "light" || theme === "dark" || theme === "system") ? theme : "system";
  const designActive = path === "/docs/design";
  const docsActive = !designActive && guides.some((guide) => path === `/docs/${guide.slug}`);
  const componentsActive =
    path === "/components" ||
    catalog.some((item) => path === `/docs/${item.slug}`) ||
    uiCatalog.some((item) => path === `/docs/${item.slug}`);

  const links = (
    <>
      <Link href="/docs/introduction" aria-current={docsActive ? "page" : undefined}>
        Documentation
      </Link>
      <Link href="/components" aria-current={componentsActive ? "page" : undefined}>
        Components
      </Link>
      <Link href="/docs/design" aria-current={designActive ? "page" : undefined}>
        Design
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
        <div className="flex items-center gap-2.5">
          <Link href="/" className="text-foreground no-underline">
            <ProductLockup product="Fabrials UI" gem="zircon" size="sm" />
          </Link>
          <Badge size="sm" className="hidden font-mono sm:inline-flex">
            v{uiPackage.version}
          </Badge>
        </div>
      }
      navigation={<nav aria-label="Main navigation">{links}</nav>}
      actions={
        <>
          <GitHubLink />
          <ThemeSwitcher value={preference} onValueChange={(value) => setTheme(value)} />
        </>
      }
      mobileMenu={
        <Sheet>
          <SheetTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Open menu" />}>
            <Menu />
          </SheetTrigger>
          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle>Fabrials UI · v{uiPackage.version}</SheetTitle>
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
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-columns">
          <div className="site-footer-brand">
            <ProductLockup product="Fabrials UI" gem="zircon" size="sm" />
            <p>
              The Fabrials design system and shadcn registry. Built on React 19, Base UI and IBM Plex for product
              interfaces and AI workflows.
            </p>
          </div>
          <div className="site-footer-col">
            <h2>System</h2>
            <ul>
              <li>
                <Link href="/docs/introduction">Documentation</Link>
              </li>
              <li>
                <Link href="/components">Components</Link>
              </li>
              <li>
                <Link href="/docs/design">Design principles</Link>
              </li>
              <li>
                <Link href="/docs/shims">shadcn shims</Link>
              </li>
              <li>
                <Link href="/playground">Playground</Link>
              </li>
            </ul>
          </div>
          <div className="site-footer-col">
            <h2>Registry &amp; source</h2>
            <ul>
              <li>
                <a href="/r/registry.json">registry.json</a>
              </li>
              <li>
                <a href="/llms.txt">llms.txt</a>
              </li>
              <li>
                <a href="https://github.com/grok-insider/fabrials-ui">GitHub repository</a>
              </li>
              <li>
                <a href="https://github.com/grok-insider/fabrials-ui/blob/master/LICENSE">MIT license</a>
              </li>
            </ul>
          </div>
        </div>
        <div className="site-footer-base">
          <p className="m-0">
            Made at <a href="https://fabrials.com">Fabrials</a>.
          </p>
          <span>
            @fabrials/ui {uiPackage.version} · React 19 · Base UI
          </span>
        </div>
      </div>
    </footer>
  );
}
