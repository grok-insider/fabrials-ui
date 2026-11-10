import type { ComponentProps, ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { classes } from "./shared";
import { diffWords, segmentText, type DiffPart, type TextRange, type TextRangeSeverity } from "./text-ranges";

export type MarkLabels = Record<TextRangeSeverity, (number: string) => string>;

const MARK_LABELS: MarkLabels = {
  error: (number) => `Mistake ${number}`,
  warning: (number) => `Warning ${number}`,
  note: (number) => `Note ${number}`,
};

const digits = (locale: Intl.LocalesArgument) => new Intl.NumberFormat(locale, { useGrouping: false });

export type MarkedTextProps = Omit<ComponentProps<"p">, "children"> & {
  /** The text as it was written. Give it its own `lang` and `dir`: it keeps the language and direction of its writer. */
  text: string;
  /**
   * The passages to mark, as offsets into `text` (UTF-16 code units). A mark's number is its range's place in this list, so it
   * matches the note of the same place in `AnnotationList`. Ranges out of the text are clamped, a range is widened to whole characters,
   * and where two overlap the later one keeps what is left; a range with nothing left draws no mark.
   */
  ranges: readonly TextRange[];
  /** What a screen reader hears before each marked passage, by severity: "Mistake 1", "Warning 2", "Note 3". */
  labels?: Partial<MarkLabels>;
  /** The language and direction of those spoken words, when the text is in another (`lang="ar"` text on an English page). */
  labelLang?: string;
  labelDir?: "ltr" | "rtl";
  /** The digits of the numbers. Default `"en"`. */
  locale?: Intl.LocalesArgument;
};

/**
 * A text with passages marked in place. Each mark carries a small number that matches the note under the text (`AnnotationList`),
 * a spoken prefix before the passage, and a line whose style says how serious it is (solid, dashed, dotted), so it reads
 * without colour. A range with an `id` is described by the element of that id: give the same id to its note in `AnnotationList`.
 */
export function MarkedText({ className, text, ranges, labels, labelLang, labelDir, locale = "en", ...props }: MarkedTextProps) {
  const words = { ...MARK_LABELS, ...labels };
  const number = digits(locale);
  return (
    <p data-slot="marked-text" className={classes("fui-marked-text", className)} {...props}>
      {segmentText(text, ranges).map((segment) => {
        if (segment.index == null) return <span key={segment.start}>{segment.text}</span>;
        const range = ranges[segment.index]!;
        const severity = range.severity ?? "error";
        const shown = number.format(segment.index + 1);
        return (
          <mark aria-describedby={range.id} className="fui-mark" data-severity={severity} key={segment.start}>
            <span className="fui-sr-only" dir={labelDir} lang={labelLang}>
              {`${range.label ?? words[severity](shown)}: `}
            </span>
            {segment.text}
            <sup aria-hidden="true" className="fui-mark-number">
              {shown}
            </sup>
          </mark>
        );
      })}
    </p>
  );
}

export type AnnotationLabels = {
  /** Spoken before the passage as it was written. */
  before: string;
  /** Spoken before what is suggested instead. */
  after: string;
};

const ANNOTATION_LABELS: AnnotationLabels = { before: "Written", after: "Suggested" };

export type Annotation = {
  /** The id its range has, so the mark is described by this note. */
  id?: string;
  /** The number its mark carries. Default: its place in `items`, from 1. */
  number?: number;
  severity?: TextRangeSeverity;
  /** A short name for the kind of problem ("Agreement"). */
  title?: ReactNode;
  /** The passage as it was written. */
  before?: ReactNode;
  /** What to write instead; with `before`, shown as "old, an arrow, new". */
  after?: ReactNode;
  /** The explanation. */
  children?: ReactNode;
};

export type AnnotationListProps = Omit<ComponentProps<"ol">, "children"> & {
  /** One note per mark, in the order of the ranges. */
  items: readonly Annotation[];
  /** The spoken name of each note, by severity (the same words as `MarkedText`), and the words before a quoted passage. */
  labels?: Partial<MarkLabels & AnnotationLabels>;
  /** The language and direction of the quoted passages (`before`, `after`): those of the marked text. */
  textLang?: string;
  textDir?: "ltr" | "rtl";
  /** The digits of the numbers. Default `"en"`. */
  locale?: Intl.LocalesArgument;
  /** More list items after the notes. */
  children?: ReactNode;
};

/**
 * The notes under a `MarkedText`, one per mark, each with the number its mark carries. A passage and its correction are quoted
 * in their own language and direction, with an arrow that follows the page's direction between them.
 */
export function AnnotationList({ className, items, labels, textLang, textDir, locale = "en", children, ...props }: AnnotationListProps) {
  const words = { ...MARK_LABELS, ...ANNOTATION_LABELS, ...labels };
  const number = digits(locale);
  return (
    <ol data-slot="annotation-list" className={classes("fui-annotation-list", className)} {...props}>
      {items.map((item, index) => {
        const severity = item.severity ?? "error";
        const shown = number.format(item.number ?? index + 1);
        return (
          <li className="fui-annotation" data-severity={severity} id={item.id} key={item.id ?? index}>
            <span aria-hidden="true" className="fui-annotation-number">
              {shown}
            </span>
            <div className="fui-annotation-body">
              <span className="fui-sr-only">{`${words[severity](shown)}. `}</span>
              {item.title != null ? <p className="fui-annotation-title">{item.title}</p> : null}
              {item.before != null || item.after != null ? (
                <p className="fui-annotation-change">
                  {item.before != null ? (
                    <>
                      <span className="fui-sr-only">{`${words.before}: `}</span>
                      <bdi className="fui-annotation-fragment" data-kind={item.after != null ? "before" : "flag"} dir={textDir} lang={textLang}>
                        {item.before}
                      </bdi>
                    </>
                  ) : null}
                  {item.before != null && item.after != null ? <ArrowRight aria-hidden="true" className="fui-annotation-arrow" focusable="false" /> : null}
                  {item.after != null ? (
                    <>
                      <span className="fui-sr-only">{`${words.after}: `}</span>
                      <bdi className="fui-annotation-fragment" data-kind="after" dir={textDir} lang={textLang}>
                        {item.after}
                      </bdi>
                    </>
                  ) : null}
                </p>
              ) : null}
              {item.children != null ? <div className="fui-annotation-note">{item.children}</div> : null}
            </div>
          </li>
        );
      })}
      {children}
    </ol>
  );
}

export type TextDiffLabels = {
  /** Spoken before, and shown in the legend for, what the first text had and the second has not. */
  removed: string;
  /** The same for what the second text adds. */
  added: string;
};

const DIFF_LABELS: TextDiffLabels = { removed: "Removed", added: "Added" };

export type TextDiffProps = Omit<ComponentProps<"div">, "children" | "lang" | "dir"> & {
  /** The text as it was. With `after`, the difference is worked out word by word. */
  before?: string;
  /** The text as it should be. */
  after?: string;
  /** The difference, worked out elsewhere (a letter-level diff from a server): it wins over `before` and `after`. */
  parts?: readonly DiffPart[];
  /** A key under the text: how a removal and an addition look. */
  legend?: boolean;
  labels?: Partial<TextDiffLabels>;
  /** The language and direction of the compared text; the legend stays in the page's. */
  lang?: string;
  dir?: "ltr" | "rtl";
  /** Where words end, for the word diff (`Intl.Segmenter`). Default: `lang`. */
  locale?: Intl.LocalesArgument;
};

/**
 * Two texts as one, with what changed marked: a removal is struck through, an addition underlined, and a screen reader hears
 * "Removed" or "Added" before each, so the difference reads without colour.
 */
export function TextDiff({ className, before = "", after = "", parts, legend = false, labels, lang, dir, locale, ...props }: TextDiffProps) {
  const words = { ...DIFF_LABELS, ...labels };
  const changes = parts ?? diffWords(before, after, locale ?? lang);
  let at = 0;
  return (
    <div data-slot="text-diff" className={classes("fui-text-diff", className)} {...props}>
      <p className="fui-text-diff-text" dir={dir} lang={lang}>
        {changes.map((part) => {
          const key = `${at}-${part.type}`;
          at += part.text.length;
          if (part.type === "equal") return <span key={key}>{part.text}</span>;
          const Tag = part.type === "delete" ? "del" : "ins";
          return (
            <Tag key={key}>
              <span className="fui-sr-only">{`${part.type === "delete" ? words.removed : words.added}: `}</span>
              {part.text}
            </Tag>
          );
        })}
      </p>
      {legend ? (
        <p aria-hidden="true" className="fui-text-diff-legend">
          <del>{words.removed}</del>
          <ins>{words.added}</ins>
        </p>
      ) : null}
    </div>
  );
}
