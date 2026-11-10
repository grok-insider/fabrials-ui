"use client";
// A product's words and locale, set once. A component reads its own scope with `useLabels` and its locale with `useLocale`;
// what it is given as props always wins. `@fabrials/ai-ui` adds its scopes to `FabrialsLabels` by declaration merging.

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { CalendarLabels, DatePickerLabels } from "./calendar";
import type { SeriesChartLabels } from "./chart";
import type { CodePanelLabels } from "./code-panel";
import type { TableLabels } from "./display";
import type { ErrorBoundaryLabels } from "./error-boundary";
import type { RepoInfoLabels } from "./files";
import type { FilterChipLabels } from "./filter-chip";
import type { ViewerLabels } from "./image-viewer";
import type { MultiSelectLabels } from "./multi-select";
import type { CopyButtonLabels, SnippetLabels } from "./snippet";
import type { SpreadsheetLabels } from "./spreadsheet";
import type { ThemePreference } from "./toggle-group";

/**
 * The words of each component a `LabelsProvider` can set, one optional key per scope. Another package adds its own:
 * `declare module "@fabrials/ui" { interface FabrialsLabels { myScope?: Partial<MyLabels> } }`.
 */
export interface FabrialsLabels {
  calendar?: Partial<CalendarLabels>;
  chart?: Partial<SeriesChartLabels>;
  codePanel?: Partial<CodePanelLabels>;
  copyButton?: Partial<CopyButtonLabels>;
  datePicker?: Partial<DatePickerLabels>;
  errorBoundary?: Partial<ErrorBoundaryLabels>;
  filterChip?: Partial<FilterChipLabels>;
  imageViewer?: Partial<ViewerLabels>;
  multiSelect?: Partial<MultiSelectLabels>;
  repoInfo?: Partial<RepoInfoLabels>;
  snippet?: Partial<SnippetLabels>;
  spreadsheet?: Partial<SpreadsheetLabels>;
  table?: Partial<TableLabels>;
  themeSwitcher?: Partial<Record<ThemePreference, ReactNode>>;
}

type Locale = NonNullable<Intl.LocalesArgument>;

type LabelsValue = { labels: FabrialsLabels; locale?: Locale };

const LabelsContext = createContext<LabelsValue>({ labels: {} });

// A key set to undefined means "not given": it never hides the layer below.
function layer<T extends object>(...layers: Array<Partial<T> | undefined>): T {
  const merged: Record<string, unknown> = {};
  for (const item of layers) {
    if (!item) continue;
    for (const [key, value] of Object.entries(item)) if (value !== undefined) merged[key] = value;
  }
  return merged as T;
}

export type LabelsProviderProps = {
  /** The words, by component scope. A scope given here is merged over the same scope of a provider further out. */
  labels?: FabrialsLabels;
  /** The locale for numbers, dates and plurals of every component inside that is not given its own. */
  locale?: Locale;
  children?: ReactNode;
};

/**
 * Sets the words and the locale of every component inside it. It is a client component, and label functions cannot cross
 * from a Server Component: render it from a client module of the product, next to its other providers.
 */
export function LabelsProvider({ labels, locale, children }: LabelsProviderProps) {
  const parent = useContext(LabelsContext);
  const value = useMemo<LabelsValue>(() => {
    const merged: Record<string, object | undefined> = { ...parent.labels };
    for (const [scope, own] of Object.entries(labels ?? {})) {
      if (own) merged[scope] = merged[scope] ? layer(merged[scope], own) : own;
    }
    return { labels: merged as FabrialsLabels, locale: locale ?? parent.locale };
  }, [parent, labels, locale]);
  return <LabelsContext.Provider value={value}>{children}</LabelsContext.Provider>;
}

/**
 * A component's words: its defaults, then the provider's for its scope, then its own `labels` prop. The result keeps its
 * identity while the three inputs keep theirs, so pass `defaults` as a module constant.
 */
export function useLabels<T extends object>(scope: keyof FabrialsLabels, defaults: T, own?: Partial<T>): T {
  const provided = useContext(LabelsContext).labels[scope] as Partial<T> | undefined;
  return useMemo(() => (provided || own ? layer(defaults, provided, own) : defaults), [defaults, provided, own]);
}

/** The locale somebody chose: the component's own, else the provider's, else none. For a default that is not a locale's. */
export function useProvidedLocale(own?: Intl.LocalesArgument): Locale | undefined {
  const provided = useContext(LabelsContext).locale;
  return own ?? provided;
}

/** The locale a component formats with: its own `locale` prop, else the provider's, else "en". */
export function useLocale(own?: Intl.LocalesArgument): Locale {
  return useProvidedLocale(own) ?? "en";
}
