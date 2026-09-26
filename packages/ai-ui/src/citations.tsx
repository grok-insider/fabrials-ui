"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@fabrials/ui";
import { ChevronDownIcon } from "./chat-icons";

export type CitationSource = {
  url: string;
  title?: string;
  number?: number;
};

export type FaviconResolver = (url: string) => string | null | undefined;

export type LinkPreview = {
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
};

export type LinkPreviewLoader = (url: string) => Promise<LinkPreview | null>;

const previewCache = new Map<string, Promise<LinkPreview | null>>();

function loadPreview(loader: LinkPreviewLoader, url: string) {
  let pending = previewCache.get(url);
  if (!pending) {
    pending = loader(url).catch(() => null);
    previewCache.set(url, pending);
  }
  return pending;
}

export function useLinkPreview(url: string | undefined, loader: LinkPreviewLoader | undefined, enabled = true) {
  const [state, setState] = useState<{ url?: string; preview: LinkPreview | null; loading: boolean }>({
    preview: null,
    loading: false,
  });
  useEffect(() => {
    if (!url || !loader || !enabled) return;
    let alive = true;
    setState({ url, preview: null, loading: true });
    void loadPreview(loader, url).then((preview) => {
      if (alive) setState({ url, preview, loading: false });
    });
    return () => {
      alive = false;
    };
  }, [url, loader, enabled]);
  if (state.url !== url) return { preview: null, loading: Boolean(url && loader && enabled) };
  return state;
}

export function hostnameFromUrl(value: string): string {
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return value;
  }
}

export function sourcePath(value: string): string {
  try {
    const { pathname, search } = new URL(value);
    const path = (pathname + search).replace(/\/+$/, "");
    if (!path) return "";
    try {
      return decodeURIComponent(path);
    } catch {
      return path;
    }
  } catch {
    return "";
  }
}

export function sourceLabel(source: { url: string; title?: string }): string {
  const title = source.title?.trim();
  return title && !/^\d+$/.test(title) ? title : hostnameFromUrl(source.url);
}

type CitationState = {
  sources: ReadonlyMap<number, CitationSource>;
  active: number | null;
  faviconUrl?: FaviconResolver;
  previewLoader?: LinkPreviewLoader;
  setActive: (n: number) => void;
  clearActive: (n: number) => void;
};

const CitationContext = createContext<CitationState | null>(null);

function numbered(sources: readonly CitationSource[] | ReadonlyMap<number, CitationSource> | undefined) {
  if (!sources) return new Map<number, CitationSource>();
  if (sources instanceof Map) return sources as ReadonlyMap<number, CitationSource>;
  const map = new Map<number, CitationSource>();
  (sources as readonly CitationSource[]).forEach((source, index) =>
    map.set(source.number ?? index + 1, source),
  );
  return map;
}

export function CitationProvider({
  sources,
  faviconUrl,
  previewLoader,
  children,
}: {
  sources?: readonly CitationSource[] | ReadonlyMap<number, CitationSource>;
  faviconUrl?: FaviconResolver;
  previewLoader?: LinkPreviewLoader;
  children: ReactNode;
}) {
  const [active, setActiveState] = useState<number | null>(null);
  const setActive = useCallback((n: number) => setActiveState(n), []);
  const clearActive = useCallback(
    (n: number) => setActiveState((current) => (current === n ? null : current)),
    [],
  );
  const map = useMemo(() => numbered(sources), [sources]);
  const value = useMemo(
    () => ({ sources: map, active, faviconUrl, previewLoader, setActive, clearActive }),
    [map, active, faviconUrl, previewLoader, setActive, clearActive],
  );
  return <CitationContext.Provider value={value}>{children}</CitationContext.Provider>;
}

export type CitationHandlers = {
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onFocus: () => void;
  onBlur: () => void;
};

const NOOP: CitationHandlers = {
  onMouseEnter: () => {},
  onMouseLeave: () => {},
  onFocus: () => {},
  onBlur: () => {},
};

export function useCitation(n: number | null | undefined) {
  const ctx = useContext(CitationContext);
  const setActive = ctx?.setActive;
  const clearActive = ctx?.clearActive;
  useEffect(() => {
    if (n == null || !clearActive) return;
    return () => clearActive(n);
  }, [n, clearActive]);
  const handlers = useMemo<CitationHandlers>(() => {
    if (n == null || !setActive || !clearActive) return NOOP;
    const enter = () => setActive(n);
    const leave = () => clearActive(n);
    return { onMouseEnter: enter, onMouseLeave: leave, onFocus: enter, onBlur: leave };
  }, [n, setActive, clearActive]);
  return {
    active: n != null && ctx?.active === n,
    handlers,
    source: n == null ? undefined : ctx?.sources.get(n),
    faviconUrl: ctx?.faviconUrl,
    previewLoader: ctx?.previewLoader,
  };
}

function join(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function SourceFavicon({
  url,
  faviconUrl,
  className,
}: {
  url: string;
  faviconUrl?: FaviconResolver;
  className?: string;
}) {
  const ctx = useContext(CitationContext);
  const resolve = faviconUrl ?? ctx?.faviconUrl;
  const src = resolve?.(url) ?? null;
  const [failed, setFailed] = useState<string | null>(null);
  if (!src || failed === src) {
    const letter = hostnameFromUrl(url).replace(/[^\p{L}\p{N}]/gu, "").charAt(0).toUpperCase() || "?";
    return (
      <span aria-hidden className={join("fui-source-favicon", "fui-source-favicon-letter", className)}>
        {letter}
      </span>
    );
  }
  return (
    <img
      alt=""
      aria-hidden
      className={join("fui-source-favicon", className)}
      height={16}
      loading="lazy"
      onError={() => setFailed(src)}
      src={src}
      width={16}
    />
  );
}

export type CitationChipProps = Omit<ComponentProps<"a">, "href" | "children"> & {
  number: number;
  href: string;
  source?: { url: string; title?: string };
  active?: boolean;
  faviconUrl?: FaviconResolver;
  previewLoader?: LinkPreviewLoader;
  delay?: number;
};

export function CitationChip({
  number,
  href,
  source,
  active,
  faviconUrl,
  previewLoader,
  delay = 200,
  className,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  ...rest
}: CitationChipProps) {
  const citation = useCitation(number);
  const resolved = source ?? citation.source ?? { url: href };
  const label = sourceLabel({ url: href, title: resolved.title });
  const host = hostnameFromUrl(href);
  const isActive = active ?? citation.active;
  const icon = faviconUrl ?? citation.faviconUrl;
  return (
    <HoverCard>
      <HoverCardTrigger
        delay={delay}
        render={
          <a
            {...rest}
            aria-label={`Source ${number}: ${label}`}
            className={join("fui-citation-chip", className)}
            data-active={isActive || undefined}
            data-citation={number}
            href={href}
            onBlur={(event) => {
              citation.handlers.onBlur();
              onBlur?.(event);
            }}
            onFocus={(event) => {
              citation.handlers.onFocus();
              onFocus?.(event);
            }}
            onMouseEnter={(event) => {
              citation.handlers.onMouseEnter();
              onMouseEnter?.(event);
            }}
            onMouseLeave={(event) => {
              citation.handlers.onMouseLeave();
              onMouseLeave?.(event);
            }}
            rel="noreferrer"
            target="_blank"
          />
        }
      >
        {number}
      </HoverCardTrigger>
      <HoverCardContent align="start" className="fui-citation-card" side="top">
        <LinkPreviewCard
          faviconUrl={icon}
          label={label}
          meta={number != null ? `Source ${number} · ${host}` : host}
          previewLoader={previewLoader ?? citation.previewLoader}
          url={href}
        />
      </HoverCardContent>
    </HoverCard>
  );
}

export function LinkPreviewCard({
  url,
  label,
  meta,
  faviconUrl,
  previewLoader,
}: {
  url: string;
  label?: string;
  meta?: string;
  faviconUrl?: FaviconResolver;
  previewLoader?: LinkPreviewLoader;
}) {
  const { preview, loading } = useLinkPreview(url, previewLoader);
  const [brokenImage, setBrokenImage] = useState<string | null>(null);
  const host = hostnameFromUrl(url);
  const title = preview?.title?.trim() || label || host;
  const image = preview?.image && brokenImage !== preview.image ? preview.image : null;
  return (
    <a className="fui-citation-card-link" data-loading={loading || undefined} href={url} rel="noreferrer" target="_blank">
      {image ? (
        <img
          alt=""
          className="fui-link-preview-image"
          loading="lazy"
          onError={() => setBrokenImage(image)}
          referrerPolicy="no-referrer"
          src={image}
        />
      ) : null}
      <span className="fui-link-preview-body">
        <span className="fui-link-preview-site">
          <SourceFavicon faviconUrl={faviconUrl} url={url} />
          <span>{preview?.siteName?.trim() || meta || host}</span>
        </span>
        <span className="fui-citation-card-title">{title}</span>
        {preview?.description ? (
          <span className="fui-link-preview-description">{preview.description}</span>
        ) : loading ? (
          <span aria-hidden className="fui-link-preview-skeleton" />
        ) : null}
        {preview?.siteName && meta ? <span className="fui-citation-card-meta">{meta}</span> : null}
      </span>
    </a>
  );
}

export type LinkWithPreviewProps = ComponentProps<"a"> & {
  href: string;
  previewLoader?: LinkPreviewLoader;
  faviconUrl?: FaviconResolver;
  delay?: number;
};

export function LinkWithPreview({ href, previewLoader, faviconUrl, delay = 300, children, ...props }: LinkWithPreviewProps) {
  const ctx = useContext(CitationContext);
  const loader = previewLoader ?? ctx?.previewLoader;
  const icon = faviconUrl ?? ctx?.faviconUrl;
  if (!loader || !/^https?:/i.test(href)) {
    return (
      <a {...props} href={href} rel="noreferrer" target="_blank">
        {children}
      </a>
    );
  }
  return (
    <HoverCard>
      <HoverCardTrigger delay={delay} render={<a {...props} href={href} rel="noreferrer" target="_blank" />}>
        {children}
      </HoverCardTrigger>
      <HoverCardContent align="start" className="fui-citation-card" side="top">
        <LinkPreviewCard faviconUrl={icon} previewLoader={loader} url={href} />
      </HoverCardContent>
    </HoverCard>
  );
}

export type SourceCardProps = Omit<ComponentProps<"a">, "title" | "href"> & {
  url: string;
  title?: string;
  number?: number;
  active?: boolean;
  faviconUrl?: FaviconResolver;
  previewLoader?: LinkPreviewLoader;
};

export function SourceCard({
  url,
  title,
  number,
  active,
  faviconUrl,
  previewLoader,
  className,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  ...props
}: SourceCardProps) {
  const citation = useCitation(number);
  const isActive = active ?? citation.active;
  const host = hostnameFromUrl(url);
  const { preview } = useLinkPreview(url, previewLoader ?? citation.previewLoader);
  const label = preview?.title?.trim() || sourceLabel({ url, title });
  const secondary = label === host ? sourcePath(url) : host;
  return (
    <a
      {...props}
      className={join("fui-source-card", className)}
      data-active={isActive || undefined}
      data-citation={number}
      href={url}
      onBlur={(event) => {
        citation.handlers.onBlur();
        onBlur?.(event);
      }}
      onFocus={(event) => {
        citation.handlers.onFocus();
        onFocus?.(event);
      }}
      onMouseEnter={(event) => {
        citation.handlers.onMouseEnter();
        onMouseEnter?.(event);
      }}
      onMouseLeave={(event) => {
        citation.handlers.onMouseLeave();
        onMouseLeave?.(event);
      }}
      rel="noreferrer"
      target="_blank"
      title={`${label} — ${url}`}
    >
      {typeof number === "number" ? (
        <span aria-label={`Source ${number}`} className="fui-source-number">
          {number}
        </span>
      ) : null}
      <SourceFavicon faviconUrl={faviconUrl ?? citation.faviconUrl} url={url} />
      <span className="fui-source-title">{label}</span>
      {secondary ? <span className="fui-source-meta">{secondary}</span> : null}
    </a>
  );
}

export type SourcesProps = {
  sources: readonly CitationSource[];
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  faviconUrl?: FaviconResolver;
  label?: (count: number) => ReactNode;
  previewCount?: number;
  className?: string;
};

export function sourcesLabel(count: number): string {
  return `${count} ${count === 1 ? "source" : "sources"}`;
}

export function Sources({
  sources,
  defaultOpen = false,
  open: openProp,
  onOpenChange,
  faviconUrl,
  label = sourcesLabel,
  previewCount = 4,
  className,
}: SourcesProps) {
  const [openState, setOpenState] = useState(defaultOpen);
  const open = openProp ?? openState;
  if (sources.length === 0) return null;
  const preview = sources.slice(0, previewCount);
  return (
    <Collapsible
      className={join("fui-sources", className)}
      onOpenChange={(next) => {
        setOpenState(next);
        onOpenChange?.(next);
      }}
      open={open}
    >
      <CollapsibleTrigger className="fui-sources-trigger">
        {preview.length > 0 ? (
          <span className="fui-sources-preview">
            {preview.map((source, index) => (
              <span className="fui-sources-preview-item" key={`${source.url}-${index}`}>
                <SourceFavicon faviconUrl={faviconUrl} url={source.url} />
              </span>
            ))}
          </span>
        ) : null}
        <span>{label(sources.length)}</span>
        <ChevronDownIcon className="fui-disclosure-chevron" />
      </CollapsibleTrigger>
      <CollapsibleContent className="fui-sources-grid" render={<ol />}>
        {sources.map((source, index) => (
          <li key={`${source.url}-${index}`}>
            <SourceCard
              faviconUrl={faviconUrl}
              number={source.number ?? index + 1}
              title={source.title}
              url={source.url}
            />
          </li>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
