"use client";
// Origin: Fabrials, 0.12 (from Radiant's components/ai-elements/callout.tsx). The behaviour is Radiant's — a GitHub alert
// known by its kind, with a title and an icon — and the look is the house's: a tint of the kind's tone, never a side bar.
// The icon paths are Lucide's (ISC, lucide.dev), copied as chat-icons.tsx does so @fabrials/ai-ui carries no icon dependency.

import { useId, type ComponentProps, type ReactNode } from "react";
import { useLabels } from "@fabrials/ui";
import { calloutKind, type CalloutKind } from "./markdown";

type IconProps = ComponentProps<"svg">;

function join(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function icon(paths: ReactNode) {
  return function Icon(props: IconProps) {
    return (
      <svg aria-hidden="true" fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="16" xmlns="http://www.w3.org/2000/svg" {...props}>
        {paths}
      </svg>
    );
  };
}

const NoteIcon = icon(
  <>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4" />
    <path d="M12 8h.01" />
  </>,
);
const TipIcon = icon(
  <>
    <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
    <path d="M9 18h6" />
    <path d="M10 22h4" />
  </>,
);
const ImportantIcon = icon(
  <>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" x2="12" y1="8" y2="12" />
    <line x1="12" x2="12.01" y1="16" y2="16" />
  </>,
);
const WarningIcon = icon(
  <>
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
  </>,
);
const CautionIcon = icon(
  <>
    <path d="M12 16h.01" />
    <path d="M12 8v4" />
    <path d="M15.312 2a2 2 0 0 1 1.414.586l4.688 4.688A2 2 0 0 1 22 8.688v6.624a2 2 0 0 1-.586 1.414l-4.688 4.688a2 2 0 0 1-1.414.586H8.688a2 2 0 0 1-1.414-.586l-4.688-4.688A2 2 0 0 1 2 15.312V8.688a2 2 0 0 1 .586-1.414l4.688-4.688A2 2 0 0 1 8.688 2z" />
  </>,
);
const ExampleIcon = icon(
  <>
    <path d="M13 7 8.7 2.7a2.41 2.41 0 0 0-3.4 0L2.7 5.3a2.41 2.41 0 0 0 0 3.4L7 13" />
    <path d="m8 6 2-2" />
    <path d="m18 16 2-2" />
    <path d="m17 11 4.3 4.3c.94.94.94 2.46 0 3.4l-2.6 2.6c-.94.94-2.46.94-3.4 0L11 17" />
    <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
    <path d="m15 5 4 4" />
  </>,
);
const DefinitionIcon = icon(
  <>
    <path d="M12 5v16" />
    <path d="M20.001 19A2 2 0 0022 17V5a2 2 0 00-1.999-2L16 3.002A5 5 0 0012 5a5 5 0 00-4-2H4a2 2 0 00-2 2v12a2 2 0 001.999 2H8a5 5 0 014 2 5 5 0 014-2z" />
  </>,
);
const SummaryIcon = icon(
  <>
    <path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z" />
    <circle cx="16.5" cy="7.5" fill="currentColor" r=".5" />
  </>,
);
const QuestionIcon = icon(
  <>
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <path d="M12 17h.01" />
  </>,
);

const ICONS: Record<CalloutKind, (props: IconProps) => ReactNode> = {
  note: NoteIcon,
  tip: TipIcon,
  important: ImportantIcon,
  warning: WarningIcon,
  caution: CautionIcon,
  example: ExampleIcon,
  definition: DefinitionIcon,
  summary: SummaryIcon,
  question: QuestionIcon,
};

/** The title a kind carries when the document gives none. */
export type MarkdownCalloutLabels = Record<CalloutKind, string>;

const LABELS: MarkdownCalloutLabels = {
  note: "Note",
  tip: "Tip",
  important: "Important",
  warning: "Warning",
  caution: "Caution",
  example: "Example",
  definition: "Definition",
  summary: "Summary",
  question: "Question",
};

export type MarkdownCalloutProps = Omit<ComponentProps<"aside">, "title"> & {
  /** What the quote announces, from GitHub's five kinds and the four a lesson adds. An alias ("info", "key-idea") is accepted. */
  kind: CalloutKind;
  /** In place of the kind's own title. Its words name the callout for a screen reader too. */
  title?: ReactNode;
  /** A mark of your own; `false` for none. */
  icon?: ReactNode | false;
  /** The words of every title, over the provider's and under `title`. */
  labels?: Partial<MarkdownCalloutLabels>;
};

/**
 * A note, a tip or a warning in an answer: a tinted plate of its kind's tone with the title and the icon in that tone's
 * ink, read as a note (`role="note"`) named by its title, with the words inside in the markdown's own typography. A host
 * that renders markdown itself writes the same markup with `.fui-callout` (see the migration note). Always a plate, never
 * a coloured side bar.
 */
export function MarkdownCallout({ kind, title, icon: own, labels, className, children, role = "note", ...props }: MarkdownCalloutProps) {
  const resolved = calloutKind(kind) ?? "note";
  const text = useLabels("markdownCallout", LABELS, labels);
  const id = useId();
  const Icon = ICONS[resolved];
  return (
    <aside
      {...props}
      aria-labelledby={props["aria-labelledby"] ?? id}
      className={join("fui-callout", className)}
      data-kind={resolved}
      role={role}
    >
      <p className="fui-callout-title" dir="auto" id={id}>
        {own === false ? null : <span aria-hidden="true" className="fui-callout-icon">{own ?? <Icon />}</span>}
        {title ?? text[resolved]}
      </p>
      {children == null ? null : <div className="fui-callout-body">{children}</div>}
    </aside>
  );
}
