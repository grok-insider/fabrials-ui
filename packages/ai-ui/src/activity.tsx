"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger, ShimmerText } from "@fabrials/ui";
import {
  BrainIcon,
  ChevronDownIcon,
  ExternalLinkIcon,
  FileTextIcon,
  GlobeIcon,
  SearchIcon,
} from "./chat-icons";
import { SourceFavicon, hostnameFromUrl, sourcePath, type FaviconResolver } from "./citations";

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
  className?: string;
};

export function ActivityDisclosure({
  icon,
  live,
  label,
  children,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  toggleLabel,
  className,
}: ActivityDisclosureProps) {
  const [open, setOpen] = useControllable(openProp, defaultOpen, onOpenChange);
  const text = (
    <span className="fui-activity-label" key={label}>
      {live ? <ShimmerText as="span" duration={1.6}>{label}</ShimmerText> : label}
    </span>
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
        <ChevronDownIcon className="fui-disclosure-chevron" />
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

export function reasoningLabel(streaming: boolean, seconds: number | undefined, labels: ReasoningLabels = {}): string {
  if (streaming || seconds === 0) return labels.thinking ?? "Thinking…";
  if (seconds === undefined) return labels.brief ?? "Thought for a few seconds";
  return labels.thoughtFor?.(seconds) ?? `Thought for ${seconds}s`;
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
  labels?: ReasoningLabels;
  icon?: ReactNode;
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
  labels,
  icon = <BrainIcon />,
  className,
}: ReasoningDisclosureProps) {
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

export function searchDoneLabel(sourceCount: number, searchCount = 0): string {
  const bits = ["Searched the web"];
  if (searchCount > 0) bits.push(`${searchCount} ${searchCount === 1 ? "search" : "searches"}`);
  if (sourceCount > 0) bits.push(`${sourceCount} ${sourceCount === 1 ? "source" : "sources"}`);
  return bits.join(" · ");
}

export function searchLabel(phase: SearchPhase, sourceCount: number, searchCount = 0): string {
  if (phase === "searching") return "Searching the web…";
  if (phase === "reading") return "Reading results…";
  return searchDoneLabel(sourceCount, searchCount);
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

export function searchStepLabel(step: SearchStep): string {
  return step.type === "search" ? step.query : step.title?.trim() || `Opened ${stepHost(step.url)}`;
}

function uniqueUrls(urls: readonly string[] | undefined) {
  return [...new Set((urls ?? []).map((url) => url.trim()).filter(Boolean))];
}

export function searchStepKindLabel(step: SearchStep): string {
  return step.type === "search" ? "Searched web" : "Read page";
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
}: {
  step: SearchStep;
  last: boolean;
  live: boolean;
  titleFor?: SearchResultTitle;
  faviconUrl?: FaviconResolver;
  id: string;
}) {
  const [open, setOpen] = useState(false);
  const results = step.type === "search" ? uniqueUrls(step.sources) : [];
  const pageTitle = step.type === "open_page" ? step.title?.trim() || titleFor?.(step.url)?.trim() : undefined;
  const label = step.type === "open_page" && pageTitle ? pageTitle : searchStepLabel(step);
  const kind = searchStepKindLabel(step);
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
  const count = results.length > 0 ? <span className="fui-search-step-count">{results.length}</span> : null;

  return (
    <li className="fui-search-step" data-last={last || undefined} data-live={live || undefined} data-open={open || undefined}>
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
};

export function SearchStepList({ steps, live = false, titleFor, faviconUrl }: SearchStepListProps) {
  const uid = useId().replace(/:/g, "");
  return (
    <ol className="fui-search-steps">
      {steps.map((step, index) => (
        <SearchStepItem
          faviconUrl={faviconUrl}
          id={`fui-search-${uid}-${index}`}
          key={`${step.type}-${step.type === "search" ? step.query : step.url}-${index}`}
          last={index === steps.length - 1}
          live={live && index === steps.length - 1}
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
}: SearchStepsDisclosureProps) {
  const text = label ?? searchLabel(phase, sourceCount, countSearches(steps));
  return (
    <ActivityDisclosure
      className={join("fui-search-activity", className)}
      defaultOpen={defaultOpen}
      icon={icon}
      label={text}
      live={phase !== "done"}
      toggleLabel={(open) => `${open ? "Hide" : "Show"} search queries`}
    >
      {steps.length > 0 ? (
        <SearchStepList faviconUrl={faviconUrl} live={phase !== "done"} steps={steps} titleFor={titleFor} />
      ) : null}
    </ActivityDisclosure>
  );
}
