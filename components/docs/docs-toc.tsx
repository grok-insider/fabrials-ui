"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";

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

interface Track {
  path: string;
  height: number;
  top: number;
  bottom: number;
}

export function DocsTocList({ items, active }: { items: DocsTocItem[]; active?: string }) {
  const listRef = useRef<HTMLOListElement>(null);
  const [track, setTrack] = useState<Track>();
  const clipId = `docs-toc-${useId().replace(/[^a-zA-Z0-9-]/g, "")}`;

  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const measure = () => {
      let path = "";
      let top = 0;
      let bottom = 0;
      list.querySelectorAll<HTMLAnchorElement>("a[data-depth]").forEach((link, index) => {
        const x = Number(link.dataset.depth) > 2 ? 11 : 1;
        const start = link.offsetTop + 4;
        const end = link.offsetTop + link.offsetHeight - 4;
        path += `${index === 0 ? "M" : " L"}${x} ${start} L${x} ${end}`;
        if (link.getAttribute("href") === active) {
          top = link.offsetTop;
          bottom = link.offsetTop + link.offsetHeight;
        }
      });
      setTrack({ path, height: list.offsetHeight, top, bottom });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    return () => observer.disconnect();
  }, [items, active]);

  return (
    <div className="docs-toc-track">
      {track && (
        <svg
          aria-hidden="true"
          className="docs-toc-svg"
          width="14"
          height={track.height}
          viewBox={`0 0 14 ${track.height}`}
        >
          <path d={track.path} className="docs-toc-line" />
          <clipPath id={clipId}>
            <rect x="0" y={track.top} width="14" height={track.bottom - track.top} />
          </clipPath>
          <path d={track.path} className="docs-toc-line-active" clipPath={`url(#${clipId})`} />
        </svg>
      )}
      <ol ref={listRef}>
        {items.map((item) => (
          <li key={item.url}>
            <a
              href={item.url}
              data-depth={item.depth}
              aria-current={item.url === active ? "location" : undefined}
            >
              {item.title}
            </a>
          </li>
        ))}
      </ol>
    </div>
  );
}
