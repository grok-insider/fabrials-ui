"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type CSSProperties, type ReactNode } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger, Readout, ShimmerText, formatCount, plural, useLabels, useLocale, useScramble } from "@fabrials/ui";
import {
  BrainIcon,
  ChevronDownIcon,
  ExternalLinkIcon,
  FileTextIcon,
  GlobeIcon,
  SearchIcon,
} from "./chat-icons";
import { SourceFavicon, hostnameFromUrl, sourcePath, type FaviconResolver } from "./citations";
import { WorkLabel, formatWorkTime, useArrivals, useWorkTime } from "./agent";

function join(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function ActivityIcon({ icon, live, className }: { icon: ReactNode; live: boolean; className?: string }) {
  return (
    <span className={join("fui-activity-icon", className)} data-live={live || undefined}>
      {icon}
      <span aria-hidden className="fui-activity-dot" />
    </span>
  );
}

function useControllable<T>(prop: T | undefined, initial: T, onChange?: (value: T) => void) {
  const [state, setState] = useState(initial);
  const value = prop === undefined ? state : prop;
  const set = (next: T) => {
    setState(next);
    if (next !== value) onChange?.(next);
  };
  return [value, set] as const;
}

export type ActivityDisclosureProps = {
  icon: ReactNode;
  live: boolean;
  label: string;
  children?: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  toggleLabel?: (open: boolean) => string;
  /** While live, the time the work has taken beside the label ("3.3s"). Never read out on every tick. */
  timer?: boolean;
  /** When the work began; defaults to when the row first went live. */
  startedAt?: number | Date;
  className?: string;
};

function WorkTime({ startedAt }: { startedAt?: number | Date }) {
  const elapsed = useWorkTime(startedAt);
  return (
    <span aria-hidden="true" className="fui-activity-time">
      {elapsed === null ? "" : formatWorkTime(elapsed)}
    </span>
  );
}

export function ActivityDisclosure({
  icon,
  live,
  label,
  children,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  toggleLabel,
  timer = false,
  startedAt,
  className,
}: ActivityDisclosureProps) {
  const [open, setOpen] = useControllable(openProp, defaultOpen, onOpenChange);
  const frame = useScramble(label);
  const text = (
    <>
      <WorkLabel className="fui-activity-label" duration={1.6} frame={frame} shimmer={live}>
        {label}
      </WorkLabel>
      {live && timer ? <WorkTime startedAt={startedAt} /> : null}
    </>
  );
  if (children == null || children === false) {
    return (
      <div aria-live="polite" className={join("fui-activity", className)} data-live={live || undefined} role="status">
        <div className="fui-activity-row">
          <ActivityIcon icon={icon} live={live} />
          {text}
        </div>
      </div>
    );
  }
  return (
    <Collapsible
      aria-live="polite"
      className={join("fui-activity", className)}
      data-live={live || undefined}
      onOpenChange={setOpen}
      open={open}
      role="status"
    >
      <CollapsibleTrigger
        aria-label={toggleLabel ? `${label}. ${toggleLabel(open)}` : undefined}
        className="fui-activity-row fui-activity-trigger"
      >
        <ActivityIcon icon={icon} live={live} />
        {text}
        <ChevronDownIcon className="fui-activity-chevron" />
      </CollapsibleTrigger>
      <CollapsibleContent className="fui-activity-body">{children}</CollapsibleContent>
    </Collapsible>
  );
}

export type ReasoningLabels = {
  thinking?: string;
  brief?: string;
  thoughtFor?: (seconds: number) => string;
};

const REASONING_LABELS: Required<ReasoningLabels> = {
  thinking: "Thinking…",
  brief: "Thought for a few seconds",
  thoughtFor: (seconds) => `Thought for ${seconds}s`,
};

export function reasoningLabel(streaming: boolean, seconds: number | undefined, labels: ReasoningLabels = {}): string {
  if (streaming || seconds === 0) return labels.thinking ?? REASONING_LABELS.thinking;
  if (seconds === undefined) return labels.brief ?? REASONING_LABELS.brief;
  return (labels.thoughtFor ?? REASONING_LABELS.thoughtFor)(seconds);
}

const AUTO_CLOSE_MS = 1000;

export type ReasoningDisclosureProps = {
  streaming?: boolean;
  durationSeconds?: number;
  children?: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  autoClose?: boolean;
  /** The words of the row. A `LabelsProvider` sets them for every reasoning row (scope `reasoning`). */
  labels?: ReasoningLabels;
  icon?: ReactNode;
  /** The time spent thinking ticks beside the label while it streams (default on). */
  timer?: boolean;
  className?: string;
};

export function ReasoningDisclosure({
  streaming = false,
  durationSeconds,
  children,
  open: openProp,
  defaultOpen,
  onOpenChange,
  autoClose = true,
  labels: ownLabels,
  icon = <BrainIcon />,
  timer = true,
  className,
}: ReasoningDisclosureProps) {
  const labels = useLabels("reasoning", REASONING_LABELS, ownLabels);
  const explicitlyClosed = defaultOpen === false;
  const [open, setOpen] = useControllable(openProp, defaultOpen ?? streaming, onOpenChange);
  const [measured, setMeasured] = useState<number | undefined>(undefined);
  const startedAt = useRef<number | null>(null);
  const everStreamed = useRef(streaming);
  const [autoClosed, setAutoClosed] = useState(false);

  useEffect(() => {
    if (streaming) {
      everStreamed.current = true;
      if (startedAt.current === null) startedAt.current = Date.now();
    } else if (startedAt.current !== null) {
      setMeasured(Math.ceil((Date.now() - startedAt.current) / 1000));
      startedAt.current = null;
    }
  }, [streaming]);

  const openRef = useRef(setOpen);
  useEffect(() => {
    openRef.current = setOpen;
  });

  useEffect(() => {
    if (streaming && !open && !explicitlyClosed) openRef.current(true);
  }, [streaming, open, explicitlyClosed]);

  useEffect(() => {
    if (!autoClose || !everStreamed.current || streaming || !open || autoClosed) return;
    const timer = setTimeout(() => {
      openRef.current(false);
      setAutoClosed(true);
    }, AUTO_CLOSE_MS);
    return () => clearTimeout(timer);
  }, [autoClose, streaming, open, autoClosed]);

  const seconds = durationSeconds ?? measured;
  return (
    <ActivityDisclosure
      className={join("fui-reasoning", className)}
      icon={icon}
      label={reasoningLabel(streaming, seconds, labels)}
      live={streaming}
      onOpenChange={setOpen}
      open={open}
      timer={timer}
    >
      {children}
    </ActivityDisclosure>
  );
}

export type SearchStep =
  | { type: "search"; query: string; sources?: readonly string[] }
  | { type: "open_page"; url: string; title?: string; sources?: readonly string[] };

export type SearchResultTitle = (url: string) => string | null | undefined;

export type SearchPhase = "searching" | "reading" | "done";

export function searchPhase(input: { pending: boolean; streaming: boolean; isLast: boolean }): SearchPhase {
  if (!input.streaming) return "done";
  if (input.pending) return "searching";
  return input.isLast ? "reading" : "done";
}

export type SearchLabels = {
  /** The row while the search runs, while its results are read, and once it is done. */
  searching: string;
  reading: string;
  searched: string;
  /** The counts after "Searched the web": "2 searches", "5 sources". */
  searches: (count: number, locale: Intl.LocalesArgument) => string;
  sources: (count: number, locale: Intl.LocalesArgument) => string;
  /** What kind of step each one is. */
  searchedWeb: string;
  readPage: string;
  /** A page that was opened and has no title, by its host. */
  opened: (host: string) => string;
  /** What the row's key does, said after its label. */
  showQueries: string;
  hideQueries: string;
  /** The words of `SourceTally` while sources arrive. */
  reviewing: string;
};

const SEARCH_LABELS: SearchLabels = {
  searching: "Searching the web…",
  reading: "Reading results…",
  searched: "Searched the web",
  searches: (count, locale) => plural(count, { one: "{count} search", other: "{count} searches" }, locale),
  sources: (count, locale) => plural(count, { one: "{count} source", other: "{count} sources" }, locale),
  searchedWeb: "Searched web",
  readPage: "Read page",
  opened: (host) => `Opened ${host}`,
  showQueries: "Show search queries",
  hideQueries: "Hide search queries",
  reviewing: "Reviewing sources",
};

export function searchDoneLabel(sourceCount: number, searchCount = 0, labels: Partial<SearchLabels> = {}, locale: Intl.LocalesArgument = "en"): string {
  const text = { ...SEARCH_LABELS, ...labels };
  const bits = [text.searched];
  if (searchCount > 0) bits.push(text.searches(searchCount, locale));
  if (sourceCount > 0) bits.push(text.sources(sourceCount, locale));
  return bits.join(" · ");
}

export function searchLabel(
  phase: SearchPhase,
  sourceCount: number,
  searchCount = 0,
  labels: Partial<SearchLabels> = {},
  locale: Intl.LocalesArgument = "en",
): string {
  if (phase === "searching") return labels.searching ?? SEARCH_LABELS.searching;
  if (phase === "reading") return labels.reading ?? SEARCH_LABELS.reading;
  return searchDoneLabel(sourceCount, searchCount, labels, locale);
}

export function countSearches(steps: readonly SearchStep[]): number {
  return steps.filter((step) => step.type === "search").length;
}

function stepHost(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function searchStepLabel(step: SearchStep, labels: Partial<SearchLabels> = {}): string {
  return step.type === "search" ? step.query : step.title?.trim() || (labels.opened ?? SEARCH_LABELS.opened)(stepHost(step.url));
}

function uniqueUrls(urls: readonly string[] | undefined) {
  return [...new Set((urls ?? []).map((url) => url.trim()).filter(Boolean))];
}

export function searchStepKindLabel(step: SearchStep, labels: Partial<SearchLabels> = {}): string {
  return step.type === "search" ? (labels.searchedWeb ?? SEARCH_LABELS.searchedWeb) : (labels.readPage ?? SEARCH_LABELS.readPage);
}

function SearchResults({
  id,
  urls,
  titleFor,
  faviconUrl,
}: {
  id: string;
  urls: readonly string[];
  titleFor?: SearchResultTitle;
  faviconUrl?: FaviconResolver;
}) {
  return (
    <ul className="fui-search-results" id={id}>
      {urls.map((url) => {
        const host = hostnameFromUrl(url);
        const title = titleFor?.(url)?.trim();
        const path = sourcePath(url);
        return (
          <li key={url}>
            <a className="fui-search-result" href={url} rel="noreferrer" target="_blank">
              <span className="fui-search-result-title">{title || host}</span>
              <span className="fui-search-result-meta">
                <SourceFavicon faviconUrl={faviconUrl} url={url} />
                <span className="fui-search-result-host">{host}</span>
                {path && !title ? <span className="fui-search-result-path">{path}</span> : null}
              </span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}

function SearchStepItem({
  step,
  last,
  live,
  titleFor,
  faviconUrl,
  id,
  stagger,
  labels,
}: {
  labels: SearchLabels;
  step: SearchStep;
  last: boolean;
  live: boolean;
  titleFor?: SearchResultTitle;
  faviconUrl?: FaviconResolver;
  id: string;
  stagger?: number;
}) {
  const [open, setOpen] = useState(false);
  const results = step.type === "search" ? uniqueUrls(step.sources) : [];
  const pageTitle = step.type === "open_page" ? step.title?.trim() || titleFor?.(step.url)?.trim() : undefined;
  const label = step.type === "open_page" && pageTitle ? pageTitle : searchStepLabel(step, labels);
  const kind = searchStepKindLabel(step, labels);
  const icon = step.type === "search" ? <SearchIcon /> : <FileTextIcon />;
  const text = (
    <span className="fui-search-step-text">
      <span className="fui-search-step-kind">{kind}</span>
      {live ? (
        <ShimmerText as="span" className="fui-search-step-query">
          {label}
        </ShimmerText>
      ) : (
        <span className="fui-search-step-query" title={label}>
          {label}
        </span>
      )}
    </span>
  );
  const count =
    results.length > 0 ? (
      <span className="fui-search-step-sources">
        <span aria-hidden="true" className="fui-search-step-stack">
          {results.slice(0, 4).map((url) => (
            <SourceFavicon faviconUrl={faviconUrl} key={url} url={url} />
          ))}
        </span>
        <span className="fui-search-step-count">{results.length}</span>
      </span>
    ) : null;

  return (
    <li
      className={stagger === undefined ? "fui-search-step" : "fui-search-step fui-rise"}
      data-last={last || undefined}
      data-live={live || undefined}
      data-open={open || undefined}
      style={stagger === undefined ? undefined : ({ "--fui-stagger": stagger } as CSSProperties)}
    >
      <span aria-hidden className="fui-search-step-rail">
        <span className="fui-search-step-badge">
          <span className="fui-search-step-icon">{icon}</span>
          {results.length > 0 ? (
            <span className="fui-search-step-chevron">
              <ChevronDownIcon />
            </span>
          ) : null}
        </span>
      </span>
      <div className="fui-search-step-main">
        {results.length > 0 ? (
          <button
            aria-controls={`${id}-results`}
            aria-expanded={open}
            className="fui-search-step-head"
            onClick={() => setOpen((value) => !value)}
            type="button"
          >
            {text}
            {count}
          </button>
        ) : step.type === "open_page" ? (
          <a className="fui-search-step-head" href={step.url} rel="noreferrer" target="_blank" title={step.url}>
            {text}
            <span className="fui-search-step-open">
              <ExternalLinkIcon />
            </span>
          </a>
        ) : (
          <div className="fui-search-step-head">{text}</div>
        )}
        {open && results.length > 0 ? (
          <SearchResults faviconUrl={faviconUrl} id={`${id}-results`} titleFor={titleFor} urls={results} />
        ) : null}
      </div>
    </li>
  );
}

export type SearchStepListProps = {
  steps: readonly SearchStep[];
  live?: boolean;
  titleFor?: SearchResultTitle;
  faviconUrl?: FaviconResolver;
  /** The words of each step. A `LabelsProvider` sets them for every search (scope `search`). */
  labels?: Partial<SearchLabels>;
};

function stepKey(step: SearchStep, index: number) {
  return `${step.type}-${step.type === "search" ? step.query : step.url}-${index}`;
}

export function SearchStepList({ steps, live = false, titleFor, faviconUrl, labels: ownLabels }: SearchStepListProps) {
  const labels = useLabels("search", SEARCH_LABELS, ownLabels);
  const uid = useId().replace(/:/g, "");
  const keys = steps.map(stepKey);
  const stagger = useArrivals(keys);
  return (
    <ol className="fui-search-steps">
      {steps.map((step, index) => (
        <SearchStepItem
          faviconUrl={faviconUrl}
          id={`fui-search-${uid}-${index}`}
          key={keys[index]}
          labels={labels}
          last={index === steps.length - 1}
          live={live && index === steps.length - 1}
          stagger={stagger.get(keys[index]!)}
          step={step}
          titleFor={titleFor}
        />
      ))}
    </ol>
  );
}

export type SearchStepsDisclosureProps = {
  phase: SearchPhase;
  steps?: readonly SearchStep[];
  sourceCount?: number;
  label?: string;
  icon?: ReactNode;
  defaultOpen?: boolean;
  className?: string;
  titleFor?: SearchResultTitle;
  faviconUrl?: FaviconResolver;
  /** While searching, the time it has taken beside the label (default on). */
  timer?: boolean;
  startedAt?: number | Date;
  /** The words of the row and its steps. A `LabelsProvider` sets them for every search (scope `search`). */
  labels?: Partial<SearchLabels>;
  /** The locale of the counts; "en" unless a `LabelsProvider` says otherwise. */
  locale?: Intl.LocalesArgument;
};

export function SearchStepsDisclosure({
  phase,
  steps = [],
  sourceCount = 0,
  label,
  icon = <GlobeIcon />,
  defaultOpen,
  className,
  titleFor,
  faviconUrl,
  timer = true,
  startedAt,
  labels: ownLabels,
  locale: ownLocale,
}: SearchStepsDisclosureProps) {
  const labels = useLabels("search", SEARCH_LABELS, ownLabels);
  const locale = useLocale(ownLocale);
  const text = label ?? searchLabel(phase, sourceCount, countSearches(steps), labels, locale);
  return (
    <ActivityDisclosure
      className={join("fui-search-activity", className)}
      defaultOpen={defaultOpen}
      icon={icon}
      label={text}
      live={phase !== "done"}
      startedAt={startedAt}
      timer={timer}
      toggleLabel={(open) => (open ? labels.hideQueries : labels.showQueries)}
    >
      {steps.length > 0 ? (
        <SearchStepList faviconUrl={faviconUrl} labels={ownLabels} live={phase !== "done"} steps={steps} titleFor={titleFor} />
      ) : null}
    </ActivityDisclosure>
  );
}

export type SourceTallyProps = Omit<ComponentProps<"div">, "children"> & {
  /** The sources found so far, as URLs, in the order they arrived: each is a tile, and the count says how many. */
  sources: readonly string[];
  /** What the agent is doing with them: "Reviewing sources" while it searches, "Read" once it has. */
  label?: string;
  /** The locale of the count. */
  locale?: Intl.LocalesArgument;
  /** How many tiles to draw; the count covers the rest. 8 by default. */
  max?: number;
  faviconUrl?: FaviconResolver;
};

/**
 * The sources a search has found so far, as Perplexity shows them: what the agent is doing with them, how many (a reading
 * whose digits settle when it changes) and a tile for each, its site's mark or initial. A tile that arrives after the line is
 * shown rises into place; nothing moves between arrivals. Not a live region: say the state in an `AgentThinking` beside it.
 */
export function SourceTally({ sources, label, locale: ownLocale, max = 8, faviconUrl, className, ...props }: SourceTallyProps) {
  const labels = useLabels("search", SEARCH_LABELS);
  const locale = useLocale(ownLocale);
  const unique = uniqueUrls(sources);
  const stagger = useArrivals(unique);
  return (
    <div className={join("fui-source-tally", className)} {...props}>
      <span className="fui-source-tally-label">{label ?? labels.reviewing}</span>
      <Readout className="fui-source-tally-count" value={formatCount(unique.length, locale)} />
      {unique.length > 0 ? (
        <span aria-hidden="true" className="fui-source-tally-tiles">
          {unique.slice(0, Math.max(0, max)).map((url) => (
            <span
              className={stagger.has(url) ? "fui-source-tally-tile fui-rise" : "fui-source-tally-tile"}
              key={url}
              style={stagger.has(url) ? ({ "--fui-stagger": stagger.get(url) } as CSSProperties) : undefined}
            >
              <SourceFavicon faviconUrl={faviconUrl} url={url} />
            </span>
          ))}
        </span>
      ) : null}
    </div>
  );
}
