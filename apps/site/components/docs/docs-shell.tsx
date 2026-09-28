"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useSearchContext } from "fumadocs-ui/contexts/search";
import { ArrowLeft, ArrowRight, ArrowUp, BookOpen, Bot, Check, ChevronDown, ChevronsUpDown, Library, PanelLeft, Search, TextAlignStart } from "lucide-react";
import {
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DitherGem,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Kbd,
  RepoInfo,
} from "@fabrials/ui";
import { docsNeighbours, docsRoots, rootFor, type DocsRoot } from "@/lib/docs-nav";
import { DocsTocList, useActiveHeadings, type DocsTocItem } from "@/components/docs/docs-toc";
import "./docs.css";

function RootMark({ root }: { root: DocsRoot }) {
  if (root.kind === "fabrials") return <DitherGem gem="zircon" size={18} />;
  const Icon = root.kind === "guides" ? BookOpen : root.kind === "agents" ? Bot : root.kind === "libraries" ? Library : null;
  return (
    <span className="docs-root-mark" aria-hidden="true">
      {Icon ? <Icon size={14} /> : root.title.replace(/[^A-Z]/g, "").slice(0, 2) || root.title.slice(0, 2)}
    </span>
  );
}

/** Switches the sidebar between the guides, Fabrials' components, the agent blocks and each library. */
function RootToggle({ current }: { current: DocsRoot }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="docs-root-trigger" aria-label={`Documentation: ${current.title}. Switch library`}>
        <RootMark root={current} />
        <span className="docs-root-text">
          <span className="docs-root-title">{current.title}</span>
          <span className="docs-root-description">{current.description}</span>
        </span>
        <ChevronsUpDown aria-hidden="true" size={14} className="docs-root-chevron" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="docs-root-menu">
        {docsRoots.map((root) => (
          <DropdownMenuItem key={root.id} render={<Link href={root.href} />} className="docs-root-item">
            <RootMark root={root} />
            <span className="docs-root-text">
              <span className="docs-root-title">{root.title}</span>
              <span className="docs-root-description">{root.description}</span>
            </span>
            {root.id === current.id && <Check aria-hidden="true" size={14} className="docs-root-check" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DocsNav({ path, root }: { path: string; root: DocsRoot }) {
  return (
    <nav aria-label={`${root.title} documentation`} className="docs-nav">
      {root.groups.map((group) => (
        <Collapsible key={group.name} defaultOpen className="docs-nav-group">
          <CollapsibleTrigger className="docs-nav-heading">
            {group.name}
            <ChevronDown aria-hidden="true" size={14} />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <ul>
              {group.pages.map((page) => (
                <li key={page.href}>
                  <Link href={page.href} aria-current={page.href === path ? "page" : undefined}>
                    {page.title}
                  </Link>
                </li>
              ))}
            </ul>
          </CollapsibleContent>
        </Collapsible>
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

/** The repository's stars, from the site's cached GitHub route; unknown until it answers. */
function useRepoStats(repository: string) {
  const [stats, setStats] = useState<{ stars: number | null; forks: number | null }>({ stars: null, forks: null });
  useEffect(() => {
    const controller = new AbortController();
    setStats({ stars: null, forks: null });
    fetch(`/api/github?repo=${encodeURIComponent(repository)}`, { signal: controller.signal })
      .then((response) => response.json())
      .then((data: { stars?: unknown; forks?: unknown }) => {
        const count = (value: unknown) => (typeof value === "number" && Number.isSafeInteger(value) ? value : null);
        setStats({ stars: count(data.stars), forks: count(data.forks) });
      })
      .catch(() => {});
    return () => controller.abort();
  }, [repository]);
  return stats;
}

/**
 * The part of the docs that stays put between pages: the phone bar, the
 * sidebar with the library switcher, and the phone navigation sheet. Pages
 * render DocsShell inside it.
 */
export function DocsFrame({ children }: { children: ReactNode }) {
  const path = usePathname();
  const [navOpen, setNavOpen] = useState(false);
  const root = rootFor(path);
  const repo = useRepoStats(root.repository);
  const sidebar = useRef<HTMLElement>(null);
  useEffect(() => setNavOpen(false), [path]);
  // Keep the current page's link in view inside the sidebar, without moving the page itself.
  useEffect(() => {
    const box = sidebar.current;
    const link = box?.querySelector<HTMLElement>('a[aria-current="page"]');
    if (!box || !link) return;
    const top = link.offsetTop - box.offsetTop;
    if (top < box.scrollTop || top + link.offsetHeight > box.scrollTop + box.clientHeight)
      box.scrollTop = Math.max(0, top - box.clientHeight / 3);
  }, [path]);

  const repoInfo = (
    <RepoInfo
      owner={root.repository.split("/")[0]!}
      repo={root.repository.split("/")[1]!}
      stars={repo.stars}
      forks={repo.forks}
      className="docs-sidebar-repo"
    />
  );

  return (
    <div className="docs">
      <div className="docs-mobile-bar">
        <Button type="button" variant="ghost" size="sm" aria-label="Browse docs" onClick={() => setNavOpen(true)}>
          <PanelLeft aria-hidden="true" /> Browse docs
        </Button>
        <SearchTrigger compact />
      </div>
      <div className="docs-body">
        <div className="docs-sidebar-column">
          <aside ref={sidebar} className="docs-sidebar" aria-label="Documentation sidebar">
            <SearchTrigger />
            <RootToggle current={root} />
            <DocsNav path={path} root={root} />
            {repoInfo}
          </aside>
        </div>
        {children}
      </div>
      <Dialog open={navOpen} onOpenChange={setNavOpen}>
        <DialogContent placement="start" className="docs-sheet" closeLabel="Close navigation">
          <DialogTitle className="docs-sheet-title">Documentation</DialogTitle>
          <DialogDescription className="fui-sr-only">Browse every documentation page.</DialogDescription>
          <RootToggle current={root} />
          <DocsNav path={path} root={root} />
          {repoInfo}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** One documentation page: its article, pager and page index, inside the persistent DocsFrame. */
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
  const items = toc.filter((item) => item.depth >= 2 && item.depth <= 3);
  const active = useActiveHeadings(items);
  const activeTitle = items.find((item) => item.url === active[0])?.title;
  const { previous, next } = docsNeighbours(path);

  return (
    <>
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
    </>
  );
}
