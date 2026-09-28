"use client";

import { useEffect, useState, type ReactNode } from "react";

export interface DocsTocItem {
  title: ReactNode;
  url: string;
  depth: number;
}

const HEADER_OFFSET = 132;

export function useActiveHeading(items: DocsTocItem[]) {
  const [active, setActive] = useState<string | undefined>(items[0]?.url);
  useEffect(() => {
    if (items.length === 0) return;
    const update = () => {
      let current = items[0].url;
      for (const item of items) {
        const element = document.getElementById(item.url.slice(1));
        if (element && element.getBoundingClientRect().top <= HEADER_OFFSET) current = item.url;
      }
      const atBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      setActive(atBottom ? items[items.length - 1].url : current);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [items]);
  return active;
}

/** The page index: a hairline rail with the section on screen marked in Stormlight. */
export function DocsTocList({ items, active }: { items: DocsTocItem[]; active?: string }) {
  return (
    <ol className="docs-toc-list">
      {items.map((item) => (
        <li key={item.url}>
          <a href={item.url} data-depth={item.depth} aria-current={item.url === active ? "location" : undefined}>
            {item.title}
          </a>
        </li>
      ))}
    </ol>
  );
}
