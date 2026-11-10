"use client";
// Origin: Fabrials, 0.12 (from Radiant's features/core/feature-frame.tsx, its skeleton and its export helpers).

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useReducer,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  CodeLines,
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  ErrorBoundary,
  Skeleton,
  Toolbar,
  ToolbarButton,
  ZoomPan,
  copyText,
  downloadFile,
  fileStem,
  svgToPng,
  useAnnounce,
} from "@fabrials/ui";
import { AlertIcon, CopyIcon, DownloadIcon } from "./chat-icons";

// Lucide's paths (ISC), beside the ones chat-icons carries, which is not this package's file to widen.
function glyph(paths: ReactNode) {
  return function Glyph({ className }: { className?: string }) {
    return (
      <svg
        aria-hidden="true"
        className={className}
        fill="none"
        height="16"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
        width="16"
        xmlns="http://www.w3.org/2000/svg"
      >
        {paths}
      </svg>
    );
  };
}

const CodeIcon = glyph(
  <>
    <path d="m16 18 6-6-6-6" />
    <path d="m8 6-6 6 6 6" />
  </>,
);
const EyeIcon = glyph(
  <>
    <path d="M2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 19.88 0 1 1 0 0 1 0 .7A10.75 10.75 0 0 1 2.06 12.35" />
    <circle cx="12" cy="12" r="3" />
  </>,
);
const MaximizeIcon = glyph(
  <>
    <path d="M8 3H5a2 2 0 0 0-2 2v3" />
    <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
    <path d="M3 16v3a2 2 0 0 0 2 2h3" />
    <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
  </>,
);

/* ------------------------------------------------------------- async render */

export type AsyncRenderStatus = "loading" | "ready" | "error";

export type AsyncRenderState<T> = {
  /** The load whose answer counts; an answer to an older one is dropped. */
  run: number;
  status: AsyncRenderStatus;
  /** The last value that arrived: kept while a new load runs, so a redraw never blanks. */
  value: T | null;
  error: unknown;
};

export type AsyncRenderAction<T> = { type: "start"; run: number } | { type: "done"; run: number; value: T } | { type: "fail"; run: number; error: unknown };

/** The state of one `useAsyncRender`: a new run starts loading, and only the current run's answer is taken. */
export function asyncRenderReducer<T>(state: AsyncRenderState<T>, action: AsyncRenderAction<T>): AsyncRenderState<T> {
  if (action.type === "start") return { ...state, run: action.run, status: "loading", error: null };
  if (action.run !== state.run) return state;
  if (action.type === "done") return { run: state.run, status: "ready", value: action.value, error: null };
  return { ...state, status: "error", error: action.error };
}

export type AsyncRender<T> = {
  status: AsyncRenderStatus;
  value: T | null;
  error: unknown;
  /** Loads again, as if the deps had changed. */
  retry: () => void;
};

const ASYNC_INITIAL = { run: 0, status: "loading", value: null, error: null } as const;

/**
 * Something that has to be fetched or computed, with the cancellation Radiant repeated: a load whose deps changed again
 * before it answered never lands. The value of the previous load stays while the next one runs, so a redraw does not blank.
 */
export function useAsyncRender<T>(loader: () => Promise<T>, deps: readonly unknown[] = []): AsyncRender<T> {
  const [state, dispatch] = useReducer(asyncRenderReducer<T>, ASYNC_INITIAL as AsyncRenderState<T>);
  const [attempt, setAttempt] = useState(0);
  const run = useRef(0);
  const loaderNow = useRef(loader);
  loaderNow.current = loader;
  useEffect(() => {
    const id = ++run.current;
    let live = true;
    dispatch({ type: "start", run: id });
    Promise.resolve()
      .then(() => loaderNow.current())
      .then(
        (value) => {
          if (live) dispatch({ type: "done", run: id, value });
        },
        (error: unknown) => {
          if (live) dispatch({ type: "fail", run: id, error });
        },
      );
    return () => {
      live = false;
    };
    // `deps` is the caller's list plus the retry count, which no linter here follows.
  }, [...deps, attempt]);
  const retry = useCallback(() => setAttempt((count) => count + 1), []);
  return { status: state.status, value: state.value, error: state.error, retry };
}

/* ------------------------------------------------------------------- frame */

export type ArtifactExporters = {
  svg?: () => string | Promise<string>;
  png?: () => Blob | Promise<Blob>;
};

export type ArtifactSlot = {
  /** The frame's full-screen view renders the children again with room to spare. */
  expanded: boolean;
  /** A renderer that failed says why; the frame shows the reason and the source instead of a blank box. */
  onError(reason: string | Error): void;
  /** What a download can offer, once the rendering knows: an SVG string, a PNG blob, or both. */
  onExport(exporters: ArtifactExporters | null): void;
  /** The rendering is there and worth showing. Without it a `pending` frame stays loading. */
  onReady(): void;
};

export type ArtifactStatus = "loading" | "ready" | "error";
export type ArtifactView = "render" | "source";
export type DownloadFormat = "svg" | "png" | "source";

export type ArtifactLabels = {
  /** The toolbar's name. */
  actions: string;
  showSource: string;
  showRendering: string;
  copy: string;
  copied: string;
  download: string;
  downloadSvg: string;
  downloadPng: string;
  downloadSource: (extension: string) => string;
  fullScreen: string;
  close: string;
  retry: string;
  /** What the polite status says while the rendering is on its way. */
  loading: (kind?: string) => string;
  /** The same while the source is still streaming in. */
  drawing: (kind?: string) => string;
  /** The failure, in a sentence: the reason is appended. */
  error: (kind?: string) => string;
  source: string;
  copiedMessage: string;
  copyFailed: string;
  downloadFailed: string;
  more: string;
};

const LABELS: ArtifactLabels = {
  actions: "Drawing actions",
  showSource: "Show source",
  showRendering: "Show rendering",
  copy: "Copy source",
  copied: "Copied",
  download: "Download",
  downloadSvg: "SVG image",
  downloadPng: "PNG image",
  downloadSource: (extension) => `Source (.${extension})`,
  fullScreen: "Full screen",
  close: "Close",
  retry: "Try again",
  loading: (kind) => (kind ? `Loading the ${kind.toLowerCase()}…` : "Loading…"),
  drawing: (kind) => (kind ? `Drawing the ${kind.toLowerCase()}…` : "Drawing…"),
  error: (kind) => (kind ? `Couldn’t draw this ${kind.toLowerCase()}:` : "Couldn’t draw this:"),
  source: "Source",
  copiedMessage: "Copied",
  copyFailed: "Could not copy",
  downloadFailed: "Could not download",
  more: "More actions",
};

const SOURCE_EXTENSIONS: Record<string, string> = {
  svg: "svg",
  xml: "xml",
  html: "html",
  mermaid: "mmd",
  json: "json",
  yaml: "yaml",
  yml: "yml",
  toml: "toml",
  typescript: "ts",
  ts: "ts",
  tsx: "tsx",
  javascript: "js",
  js: "js",
  jsx: "jsx",
  css: "css",
  python: "py",
  py: "py",
  rust: "rs",
  go: "go",
  sql: "sql",
  shell: "sh",
  bash: "sh",
  sh: "sh",
  diff: "diff",
  markdown: "md",
  md: "md",
};

/** The extension a downloaded source takes from its language, when the host did not name one. */
export function sourceExtensionFor(language: string | undefined, fallback = "txt"): string {
  return SOURCE_EXTENSIONS[(language ?? "").trim().toLowerCase()] ?? fallback;
}

/** The reason as a sentence, whatever a renderer threw or said. */
export function reasonText(reason: unknown): string {
  if (reason instanceof Error && reason.message) return reason.message;
  if (typeof reason === "string" && reason.trim()) return reason.trim();
  return "It failed without a reason.";
}

/**
 * The formats a download can offer: the image ones only while the drawing is there (an SVG can be rasterised to a PNG when
 * only the SVG was offered), and the source when there is one.
 */
export function downloadFormats(input: { exporters: ArtifactExporters | null; source?: string | null; failed?: boolean }): DownloadFormat[] {
  const formats: DownloadFormat[] = [];
  if (!input.failed && input.exporters?.svg) formats.push("svg");
  if (!input.failed && (input.exporters?.svg || input.exporters?.png)) formats.push("png");
  if (input.source) formats.push("source");
  return formats;
}

/**
 * The status shown: the host's own when it passes one, else from what the children said. A failure counts only once the
 * source has stopped arriving, so a drawing that throws halfway through its source is still drawing.
 */
export function deriveArtifactStatus(input: { status?: ArtifactStatus; ready: boolean; failed: boolean; pending: boolean; streaming: boolean }): ArtifactStatus {
  if (input.status) return input.status;
  if (input.failed) return "error";
  if (!input.ready && (input.pending || input.streaming)) return "loading";
  return "ready";
}

export type ArtifactFrameProps = {
  /** A short word naming the notation, in sentence case ("Diagram", "Chart", "Preview"). */
  kind?: string;
  title?: string;
  /** The text the rendering was made from: shown when asked, copied, and downloaded. */
  source?: string;
  /** The language of `source` for its highlighting (default plain text). */
  sourceLanguage?: string;
  /** The extension of a downloaded source, without the dot. Default: from `sourceLanguage`, else `txt`. */
  sourceExtension?: string;
  /** A file name for downloads, in place of one made from the title. */
  fileName?: string;
  /** Controlled status; without it, the status follows `pending`, `streaming` and the children's slot. */
  status?: ArtifactStatus;
  /** The rendering has not arrived yet, and will say so through `slot.onReady`. */
  pending?: boolean;
  /** The source is still arriving: a failure is held back and the label says it is drawing. */
  streaming?: boolean;
  /** The reason of a failure the host already knows about. */
  error?: string | null;
  onRetry?: () => void;
  /** The height the body keeps while it loads and once the rendering is there. Default 10rem. */
  minHeight?: number | string;
  /** The shape of the body, as width / height, instead of a height. */
  ratio?: number;
  /** The direction of the rendering area: drawings and code are laid out left to right whatever the answer's language. */
  contentDir?: "ltr" | "rtl";
  /** Full screen, which renders the children again with `slot.expanded`. Default on. */
  fullScreen?: boolean;
  /** Full screen makes the drawing zoomable (default on). */
  zoomable?: boolean;
  zoomableLabel?: string;
  view?: ArtifactView;
  defaultView?: ArtifactView;
  onViewChange?: (view: ArtifactView) => void;
  /** The host's own keys, at the end of the toolbar. */
  actions?: ReactNode;
  labels?: Partial<ArtifactLabels>;
  /** The rendering, given the slot; plain children are allowed too, with no exports and no ready state. */
  children?: ReactNode | ((slot: ArtifactSlot) => ReactNode);
};

/**
 * The frame around a thing drawn inside an answer: a title bar with the source, a copy, the downloads the rendering offers
 * and a full-screen view; a body of reserved height that says it is loading instead of shifting; and a failure that shows
 * the reason and the source rather than an empty box.
 */
export function ArtifactFrame({
  kind,
  title,
  source,
  sourceLanguage = "text",
  sourceExtension,
  fileName,
  status: statusProp,
  pending = false,
  streaming = false,
  error,
  onRetry,
  minHeight = "10rem",
  ratio,
  contentDir = "ltr",
  fullScreen = true,
  zoomable = true,
  zoomableLabel,
  view: viewProp,
  defaultView = "render",
  onViewChange,
  actions,
  labels,
  children,
  className,
  ...props
}: ArtifactFrameProps & Omit<React.ComponentProps<"figure">, "children" | "onError">) {
  const text = { ...LABELS, ...labels };
  const announce = useAnnounce();
  const [ownView, setOwnView] = useState<ArtifactView>(defaultView);
  const view = viewProp ?? ownView;
  const [ready, setReady] = useState(!pending && !streaming);
  const [exporters, setExporters] = useState<ArtifactExporters | null>(null);
  const [failure, setFailure] = useState<{ message: string } | null>(error ? { message: error } : null);
  const [expanded, setExpanded] = useState(false);
  const [attempt, setAttempt] = useState(0);
  // A new source is a new attempt; a failure the host passed in counts as one too.
  const [lastSource, setLastSource] = useState(source);
  const [lastError, setLastError] = useState(error ?? null);
  const [lastPending, setLastPending] = useState(pending);
  if (source !== lastSource) {
    setLastSource(source);
    setFailure(null);
    setExporters(null);
    setReady(!pending && !streaming);
  } else if ((error ?? null) !== lastError) {
    setLastError(error ?? null);
    setFailure(error ? { message: error } : null);
  }
  if (pending !== lastPending) {
    setLastPending(pending);
    if (pending) setReady(false);
  }
  const failed = failure !== null;
  const status = deriveArtifactStatus({ status: statusProp, ready, failed, pending, streaming });
  const showing = status === "error" || view === "source";
  const titleId = useId();
  const bodyId = useId();
  const stem = fileName ?? fileStem(title ?? kind, "drawing");
  const formats = downloadFormats({ exporters, source, failed: status === "error" });
  const kindName = kind?.trim() || undefined;
  const extension = sourceExtension ?? sourceExtensionFor(sourceLanguage);

  const onError = useCallback((reason: string | Error) => setFailure((before) => before ?? { message: reasonText(reason) }), []);
  const onExport = useCallback((next: ArtifactExporters | null) => setExporters((before) => (before === next ? before : next)), []);
  const onReady = useCallback(() => setReady(true), []);
  // The slot keeps its identity between renders, so a child that registers in an effect does it once.
  const slot = useMemo<ArtifactSlot>(() => ({ expanded: false, onError, onExport, onReady }), [onError, onExport, onReady]);
  const expandedSlot = useMemo<ArtifactSlot>(
    () => ({ expanded: true, onError: () => undefined, onExport: () => undefined, onReady: () => undefined }),
    [],
  );
  const changeView = (next: ArtifactView) => {
    if (viewProp === undefined) setOwnView(next);
    onViewChange?.(next);
  };
  const retry = () => {
    setFailure(null);
    setExporters(null);
    setReady(false);
    setAttempt((count) => count + 1);
    onRetry?.();
  };
  const copy = async () => {
    if (!source) return;
    try {
      await copyText(source);
      announce(text.copiedMessage);
    } catch {
      announce(text.copyFailed, { assertive: true });
    }
  };
  const download = async (format: DownloadFormat) => {
    try {
      if (format === "source") {
        if (source) downloadFile(`${stem}.${extension}`, source);
        return;
      }
      if (format === "svg") {
        if (exporters?.svg) downloadFile(`${stem}.svg`, await exporters.svg(), "image/svg+xml");
        return;
      }
      const png = exporters?.png ? await exporters.png() : exporters?.svg ? await svgToPng(await exporters.svg()) : null;
      if (png) downloadFile(`${stem}.png`, png, "image/png");
    } catch {
      announce(text.downloadFailed, { assertive: true });
    }
  };

  const render = (given: ArtifactSlot) =>
    typeof children === "function" ? children(given) : children === undefined || children === null ? null : children;

  const bodyStyle: CSSProperties = { minHeight, aspectRatio: ratio ? String(ratio) : undefined };
  const placeholder = status === "loading";
  const sourceToggle = source ? (
    <ToolbarButton
      aria-pressed={view === "source"}
      label={view === "source" ? text.showRendering : text.showSource}
      onClick={() => changeView(view === "source" ? "render" : "source")}
      size="icon-sm"
    >
      {view === "source" ? <EyeIcon /> : <CodeIcon />}
    </ToolbarButton>
  ) : null;
  const copyKey = source ? (
    <ToolbarButton label={text.copy} onClick={() => void copy()} size="icon-sm" tier="low">
      <CopyIcon />
    </ToolbarButton>
  ) : null;
  const downloadKey = formats.length ? (
    <DropdownMenu>
      <DropdownMenuTrigger render={<ToolbarButton label={text.download} size="icon-sm" tier="low"><DownloadIcon /></ToolbarButton>} />
      <DropdownMenuContent align="end" aria-label={text.download}>
        {formats.includes("svg") ? <DropdownMenuItem onClick={() => void download("svg")}>{text.downloadSvg}</DropdownMenuItem> : null}
        {formats.includes("png") ? <DropdownMenuItem onClick={() => void download("png")}>{text.downloadPng}</DropdownMenuItem> : null}
        {formats.includes("source") ? <DropdownMenuItem onClick={() => void download("source")}>{text.downloadSource(extension)}</DropdownMenuItem> : null}
      </DropdownMenuContent>
    </DropdownMenu>
  ) : null;
  const fullScreenKey = fullScreen && status !== "error" ? (
    <ToolbarButton label={text.fullScreen} onClick={() => setExpanded(true)} size="icon-sm">
      <MaximizeIcon />
    </ToolbarButton>
  ) : null;
  const overflowItems = [
    ...(copyKey ? [{ id: "copy", label: text.copy, icon: <CopyIcon />, onSelect: () => void copy() }] : []),
    ...formats.map((format) => ({
      id: format,
      label: format === "svg" ? text.downloadSvg : format === "png" ? text.downloadPng : text.downloadSource(extension),
      icon: <DownloadIcon />,
      onSelect: () => void download(format),
    })),
  ];
  return (
    <figure
      {...props}
      className={["fui-artifact", className].filter(Boolean).join(" ")}
      data-slot="artifact-frame"
      data-status={status}
      data-view={showing ? "source" : "render"}
      data-streaming={streaming || undefined}
      data-zoomed={expanded || undefined}
      aria-busy={placeholder || undefined}
    >
      <figcaption className="fui-artifact-header">
        {kindName ? <span className="fui-artifact-kind">{kindName}</span> : null}
        {title ? (
          <span className="fui-artifact-title" id={titleId}>
            <bdi>{title}</bdi>
          </span>
        ) : null}
        <Toolbar aria-label={title ? `${text.actions}: ${title}` : text.actions} className="fui-artifact-toolbar">
          {sourceToggle}
          {copyKey}
          {downloadKey}
          {fullScreenKey}
          {actions}
          {overflowItems.length ? (
            <DropdownMenu>
              <DropdownMenuTrigger render={<ToolbarButton label={text.more} size="icon-sm" tier="overflow"><MoreIcon /></ToolbarButton>} />
              <DropdownMenuContent align="end" aria-label={text.more}>
                {overflowItems.map((item) => (
                  <DropdownMenuItem key={item.id} onClick={item.onSelect}>
                    {item.icon}
                    {item.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </Toolbar>
      </figcaption>
      {status === "error" && failure ? (
        <p className="fui-artifact-error" role="status">
          <AlertIcon aria-hidden="true" className="fui-artifact-error-icon" />
          <span className="fui-artifact-error-text">
            {text.error(kindName)} {failure.message}
          </span>
          {onRetry ? (
            <button className="fui-artifact-retry" onClick={retry} type="button">
              {text.retry}
            </button>
          ) : null}
        </p>
      ) : null}
      <div
        className="fui-artifact-body"
        data-slot="artifact-body"
        hidden={status === "error" || view === "source"}
        id={bodyId}
        style={bodyStyle}
      >
        <div className="fui-artifact-render" dir={contentDir} hidden={placeholder}>
          {status === "error" || status === "loading" ? null : (
            <ErrorBoundary fallback={null} onError={(thrown) => onError(reasonText(thrown))} resetKey={`${source ?? ""}:${attempt}`}>
              {render(slot)}
            </ErrorBoundary>
          )}
        </div>
        {placeholder ? (
          <div className="fui-artifact-placeholder">
            <div aria-hidden="true" className="fui-artifact-placeholder-frame">
              <Skeleton className="fui-artifact-placeholder-block" />
              <Skeleton className="fui-artifact-placeholder-line" />
              <Skeleton className="fui-artifact-placeholder-line" style={{ inlineSize: "62%" }} />
            </div>
            <p className="fui-artifact-placeholder-label" role="status">
              {streaming ? text.drawing(kindName) : text.loading(kindName)}
            </p>
          </div>
        ) : null}
      </div>
      {showing && source ? (
        <pre
          aria-label={text.source}
          className="fui-artifact-source fui-code-panel-body"
          data-slot="artifact-source"
          tabIndex={0}
        >
          <CodeLines code={source} language={sourceLanguage} />
        </pre>
      ) : null}
      {fullScreen ? (
        <Dialog onOpenChange={setExpanded} open={expanded}>
          <DialogContent className="fui-artifact-dialog" closeLabel={text.close} padding="none">
            <DialogHeader className="fui-artifact-dialog-header">
              {kindName ? <span className="fui-artifact-kind">{kindName}</span> : null}
              <DialogTitle className="fui-artifact-dialog-title">
                <bdi>{title ?? kindName ?? text.actions}</bdi>
              </DialogTitle>
            </DialogHeader>
            <DialogBody className="fui-artifact-dialog-body" padding="none" scroll={false}>
              {expanded ? (
                <ZoomPan
                  className="fui-artifact-zoom"
                  controls
                  interactive={zoomable}
                  label={zoomableLabel ?? title ?? kindName ?? text.actions}
                  maxScale={6}
                  wheel="zoom"
                >
                  <ErrorBoundary fallback={null} onError={(thrown) => onError(reasonText(thrown))} resetKey={`${source ?? ""}:${attempt}:full`}>
                    {render(expandedSlot)}
                  </ErrorBoundary>
                </ZoomPan>
              ) : null}
            </DialogBody>
          </DialogContent>
        </Dialog>
      ) : null}
    </figure>
  );
}

function MoreIcon() {
  return (
    <svg aria-hidden="true" fill="currentColor" height="16" viewBox="0 0 24 24" width="16">
      <circle cx="5" cy="12" r="1.7" />
      <circle cx="12" cy="12" r="1.7" />
      <circle cx="19" cy="12" r="1.7" />
    </svg>
  );
}

