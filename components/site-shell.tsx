"use client";
import Link from "next/link";
import { GitHubLink } from "@/components/github-link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Moon, Sun, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { catalog, guides } from "@/lib/catalog";
import { uiCatalog } from "@/lib/ui-catalog";
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
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const dark = mounted && resolvedTheme === "dark";
  const [menu, setMenu] = useState(false);
  const path = usePathname();
  useEffect(() => setMounted(true), []);
  useEffect(() => setMenu(false), [path]);
  return (
    <header
      data-site-header
      className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur-sm"
    >
      <div className="flex h-17 w-full items-center justify-between gap-5 px-6 lg:px-10">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-medium tracking-tight"
        >
          <Mark />
          <span>
            fabrials
            <span className="ml-1.5 font-normal text-muted-foreground">
              / ui
            </span>
          </span>
        </Link>
        <nav
          className="hidden items-center gap-7 text-[13px] [&>a]:inline-flex [&>a]:min-h-8 [&>a]:items-center md:flex"
          aria-label="Main navigation"
        >
          <Link
            href="/docs/introduction"
            className={
              guides.some((guide) => path === `/docs/${guide.slug}`)
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }
          >
            Documentation
          </Link>
          <Link
            href="/components"
            aria-current={path === "/components" ? "page" : undefined}
            className={
              path === "/components" ||
              catalog.some((item) => path === `/docs/${item.slug}`) ||
              uiCatalog.some((item) => path === `/docs/${item.slug}`)
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }
          >
            Components
          </Link>
          <Link
            href="/playground"
            className={
              path.startsWith("/playground")
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }
          >
            Playground
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <GitHubLink />
          <span className="hidden h-4 border-l sm:block" />
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label={dark ? "Use light theme" : "Use dark theme"}
            onClick={() => {
              setTheme(dark ? "light" : "dark");
            }}
          >
            {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="md:hidden"
            aria-label="Toggle navigation"
            aria-expanded={menu}
            onClick={() => setMenu(!menu)}
          >
            {menu ? <X /> : <Menu />}
          </Button>
        </div>
      </div>
      {menu && (
        <nav
          aria-label="Mobile navigation"
          className="flex flex-col gap-4 border-t px-6 py-5 text-sm md:hidden"
        >
          <Link href="/docs/introduction">Documentation</Link>
          <Link href="/components">Components</Link>
          <Link href="/playground">Playground</Link>
        </nav>
      )}
    </header>
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
      <div className="flex w-full flex-wrap items-center justify-between gap-4 px-6 py-8 text-xs text-muted-foreground lg:px-10">
        <p>
          Made at{" "}
          <a
            href="https://fabrials.com"
            className="text-foreground underline underline-offset-4"
          >
            Fabrials
          </a>
          . Open source, by design.
        </p>
        <div className="flex gap-5">
          <a href="https://github.com/grok-insider/fabrials-webmcp/blob/master/LICENSE">
            MIT license
          </a>
          <a href="/llms.txt">llms.txt</a>
          <span>v0.1.0</span>
        </div>
      </div>
    </footer>
  );
}
