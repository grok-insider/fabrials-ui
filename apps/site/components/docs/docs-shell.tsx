"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useSearchContext } from "fumadocs-ui/contexts/search";
import { ArrowLeft, ArrowRight, ArrowUp, ChevronDown, PanelLeft, Search, TextAlignStart } from "lucide-react";
import {
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Kbd,
} from "@fabrials/ui";
import { docsNav, docsNeighbours } from "@/lib/docs-nav";
import { DocsTocList, useActiveHeading, type DocsTocItem } from "@/components/docs/docs-toc";
import "./docs.css";

const sections = ["Guides", "Components", "Agents", "Libraries"] as const;

function DocsNav({ path }: { path: string }) {
  return (
    <nav aria-label="Documentation" className="docs-nav">
      {sections.map((section) => (
        <div key={section} className="docs-nav-section">
          <p className="docs-nav-section-label">{section}</p>
          {docsNav
            .filter((group) => group.section === section)
            .map((group) => (
              <Collapsible key={group.name} defaultOpen className="docs-nav-group">
                <CollapsibleTrigger className="docs-nav-heading">
                  {group.name}
                  <ChevronDown aria-hidden="true" size={14} />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <ul>
                    {group.pages.map((page) => (
                      <li key={page.href}>
                        <Link
                          href={page.href}
                          aria-current={page.href === path ? "page" : undefined}
                        >
                          {page.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </CollapsibleContent>
              </Collapsible>
            ))}
        </div>
      ))}
    </nav>
  );
}

function SearchTrigger({ compact = false }: { compact?: boolean }) {
  const { enabled, setOpenSearch } = useSearchContext();
  if (!enabled) return null;
  return (
    <Button
      type="button"
      variant="outline"
      size={compact ? "icon-sm" : "sm"}
      className={compact ? "docs-search-icon" : "docs-search-trigger"}
      aria-label="Search documentation"
      onClick={() => setOpenSearch(true)}
    >
      <Search aria-hidden="true" />
      {!compact && (
        <>
          <span>Search</span>
          <span className="docs-search-keys" aria-hidden="true">
            <Kbd>Ctrl</Kbd>
            <Kbd>K</Kbd>
          </span>
        </>
      )}
    </Button>
  );
}

export function DocsShell({
  header,
  toc = [],
  children,
}: {
  header: ReactNode;
  toc?: DocsTocItem[];
  children: ReactNode;
}) {
  const path = usePathname();
  const [navOpen, setNavOpen] = useState(false);
  const items = toc.filter((item) => item.depth >= 2 && item.depth <= 3);
  const active = useActiveHeading(items);
  const activeTitle = items.find((item) => item.url === active)?.title;
  const { previous, next } = docsNeighbours(path);
  useEffect(() => setNavOpen(false), [path]);

  return (
    <div className="docs">
      <div className="docs-mobile-bar">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label="Browse docs"
          onClick={() => setNavOpen(true)}
        >
          <PanelLeft aria-hidden="true" /> Browse docs
        </Button>
        <SearchTrigger compact />
      </div>
      <div className="docs-body">
        <aside className="docs-sidebar" aria-label="Documentation sidebar">
          <SearchTrigger />
          <DocsNav path={path} />
        </aside>
        <main id="main-content" className="docs-main" tabIndex={-1}>
          <article className="docs-article">
            {header}
            {items.length > 1 && (
              <Collapsible className="docs-toc-inline">
                <CollapsibleTrigger className="docs-toc-inline-trigger">
                  <TextAlignStart aria-hidden="true" size={16} />
                  <span>On this page</span>
                  {activeTitle && <span className="docs-toc-inline-current">{activeTitle}</span>}
                  <ChevronDown aria-hidden="true" size={16} className="docs-toc-inline-chevron" />
                </CollapsibleTrigger>
                <CollapsibleContent className="docs-toc-inline-panel">
                  <DocsTocList items={items} active={active} />
                </CollapsibleContent>
              </Collapsible>
            )}
            <div className="docs-content">{children}</div>
            {(previous || next) && (
              <nav className="docs-pager" aria-label="Previous and next page">
                {previous ? (
                  <Link href={previous.href}>
                    <span className="docs-pager-label">
                      <ArrowLeft aria-hidden="true" size={14} /> Previous
                    </span>
                    <span className="docs-pager-title">{previous.title}</span>
                  </Link>
                ) : (
                  <span />
                )}
                {next && (
                  <Link href={next.href} data-direction="next">
                    <span className="docs-pager-label">
                      Next <ArrowRight aria-hidden="true" size={14} />
                    </span>
                    <span className="docs-pager-title">{next.title}</span>
                  </Link>
                )}
              </nav>
            )}
          </article>
        </main>
        <aside className="docs-toc" aria-label="On this page">
          {items.length > 1 && (
            <>
              <p className="docs-toc-title">On this page</p>
              <DocsTocList items={items} active={active} />
              <a href="#main-content" className="docs-toc-top">
                <ArrowUp aria-hidden="true" size={12} /> Back to top
              </a>
            </>
          )}
        </aside>
      </div>
      <Dialog open={navOpen} onOpenChange={setNavOpen}>
        <DialogContent placement="start" className="docs-sheet" closeLabel="Close navigation">
          <DialogTitle className="docs-sheet-title">Documentation</DialogTitle>
          <DialogDescription className="fui-sr-only">Browse every documentation page.</DialogDescription>
          <DocsNav path={path} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
