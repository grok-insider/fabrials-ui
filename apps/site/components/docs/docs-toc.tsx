"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";

export interface DocsTocItem {
  title: ReactNode;
  url: string;
  depth: number;
}

const HEADER_OFFSET = 96;

/**
 * The headings whose sections are on screen. A section runs from its heading
 * to the next one; every section that overlaps the viewport counts, so the
 * index can mark a range, not a single line.
 */
export function useActiveHeadings(items: DocsTocItem[]) {
  const [active, setActive] = useState<string[]>(items[0] ? [items[0].url] : []);
  useEffect(() => {
    if (items.length === 0) return;
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const tops = items.map((item) => document.getElementById(item.url.slice(1))?.getBoundingClientRect().top ?? Infinity);
        const viewTop = HEADER_OFFSET;
        const viewBottom = window.innerHeight;
        const end = document.documentElement.scrollHeight - window.scrollY;
        const visible = items
          .filter((_, i) => {
            const top = tops[i]!;
            const bottom = i + 1 < tops.length ? tops[i + 1]! : end;
            return bottom > viewTop + 8 && top < viewBottom - 8;
          })
          .map((item) => item.url);
        // Above the first heading, the first section is the one being read.
        setActive(visible.length ? visible : [items[0]!.url]);
      });
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [items]);
  return active;
}

/** The single heading being read (the first visible one), for compact places like the phone bar. */
export function useActiveHeading(items: DocsTocItem[]) {
  return useActiveHeadings(items)[0];
}

type Track = { path: string; height: number; from: number; to: number; dotX: number };

const x = (depth: number) => (depth > 2 ? 11 : 1);

/**
 * The page index as a thread: the line steps in for subsections and back out,
 * and the part covering the sections on screen is drawn in Stormlight, ending
 * in a dot.
 */
export function DocsTocList({ items, active }: { items: DocsTocItem[]; active: string[] | string | undefined }) {
  const list = useRef<HTMLOListElement>(null);
  const [track, setTrack] = useState<Track>();
  const current = Array.isArray(active) ? active : active ? [active] : [];

  useLayoutEffect(() => {
    const element = list.current;
    if (!element) return;
    const measure = () => {
      const links = [...element.querySelectorAll<HTMLAnchorElement>("a[data-depth]")];
      let path = "";
      let from = -1;
      let to = -1;
      let dotX = 1;
      links.forEach((link, index) => {
        const lx = x(Number(link.dataset.depth));
        const top = link.offsetTop + 6;
        const bottom = link.offsetTop + link.offsetHeight - 6;
        // From the previous item's end the line runs to this item's start: straight
        // at the same depth, a short diagonal when it steps in or out.
        path += `${index === 0 ? "M" : " L"}${lx} ${top} L${lx} ${bottom}`;
        if (current.includes(link.getAttribute("href") ?? "")) {
          if (from < 0) from = link.offsetTop;
          to = link.offsetTop + link.offsetHeight;
          dotX = lx;
        }
      });
      setTrack({ path, height: element.offsetHeight, from, to, dotX });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
    // current is compared by value through its joined key.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, current.join("|")]);

  return (
    <div className="docs-toc-thread">
      {track && (
        <svg aria-hidden className="docs-toc-svg" width="14" height={track.height} viewBox={`0 0 14 ${track.height}`}>
          <path d={track.path} className="docs-toc-line" />
          {track.from >= 0 && (
            <>
              <clipPath id="docs-toc-clip">
                <rect x="0" y={track.from} width="14" height={Math.max(0, track.to - track.from)} />
              </clipPath>
              <path d={track.path} className="docs-toc-line-active" clipPath="url(#docs-toc-clip)" />
              <circle cx={track.dotX} cy={track.to - 6} r="3" className="docs-toc-dot" />
            </>
          )}
        </svg>
      )}
      <ol ref={list} className="docs-toc-list">
        {items.map((item) => (
          <li key={item.url}>
            <a href={item.url} data-depth={item.depth} aria-current={current.includes(item.url) ? "location" : undefined}>
              {item.title}
            </a>
          </li>
        ))}
      </ol>
    </div>
  );
}
