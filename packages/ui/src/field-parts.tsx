"use client";
// The parts of a field, for the places that compose one instead of describing it (0.12). `Field` in `patterns.tsx` keeps
// its render prop; these are the same markup, one piece at a time, wired by the ids of the field they sit in.

import { createContext, useCallback, useContext, useEffect, useId, useMemo, useState, type ComponentProps, type ReactNode } from "react";
import { useLabels } from "./labels";
import { classes } from "./shared";

export type FieldLabels = {
  /** Read after the asterisk of a required field, and only by a screen reader. */
  required: string;
  /** The word after the label of a field that may be left empty. */
  optional: string;
};

export const FIELD_LABELS: FieldLabels = {
  required: "required",
  optional: "optional",
};

type Claim = "description" | "error";

type FieldContextValue = {
  id: string;
  descriptionId: string;
  errorId: string;
  /** The ids of the parts that are in the field, for the control's `aria-describedby`. */
  describedBy: string | undefined;
  /** Whether the field says what went wrong: put it on the control as `aria-invalid`. */
  invalid: boolean;
  labels: FieldLabels;
  claim: (kind: Claim) => () => void;
};

const FieldContext = createContext<FieldContextValue | null>(null);
const NONE: ReadonlySet<Claim> = new Set();

/**
 * The ids of the field it is called in, and which parts of it are there: `aria-describedby={describedBy}` and
 * `aria-invalid={invalid}` on the control inside `<Field>` name its description and its error, and nothing it does not
 * have. A part registers itself once, after the first paint.
 */
export function useField() {
  const field = useContext(FieldContext);
  if (!field) throw new Error("useField must be called inside a Field.");
  return field;
}

export type FieldRootProps = ComponentProps<"div"> & {
  /** The id of the control inside; one is generated when it is not given. */
  id?: string;
  labels?: Partial<FieldLabels>;
};

/** The frame of a field whose parts are written out: the same `fui-field` plate the render-prop `Field` draws. */
export function FieldRoot({ className, id: providedId, labels: ownLabels, children, ...props }: FieldRootProps) {
  const labels = useLabels("field", FIELD_LABELS, ownLabels);
  const generated = useId();
  const id = providedId ?? generated;
  const [claimed, setClaimed] = useState<ReadonlySet<Claim>>(NONE);
  const claim = useCallback((kind: Claim) => {
    setClaimed((current) => new Set(current).add(kind));
    return () => setClaimed((current) => {
      if (!current.has(kind)) return current;
      const next = new Set(current);
      next.delete(kind);
      return next;
    });
  }, []);
  const descriptionId = `${id}-description`;
  const errorId = `${id}-error`;
  const value = useMemo<FieldContextValue>(
    () => ({
      id,
      descriptionId,
      errorId,
      describedBy: [claimed.has("description") ? descriptionId : undefined, claimed.has("error") ? errorId : undefined].filter(Boolean).join(" ") || undefined,
      invalid: claimed.has("error"),
      labels,
      claim,
    }),
    [id, descriptionId, errorId, claimed, labels, claim],
  );
  return (
    <FieldContext value={value}>
      <div className={classes("fui-field", className)} data-slot="field" {...props}>
        {children}
      </div>
    </FieldContext>
  );
}

/** Registers a part for as long as it is rendered, so the control is described by what is really there. */
function useClaim(kind: Claim, custom: string | undefined) {
  const claim = useContext(FieldContext)?.claim;
  useEffect(() => {
    if (!claim || custom) return;
    return claim(kind);
  }, [claim, kind, custom]);
}

export type FieldLabelProps = ComponentProps<"label"> & {
  required?: boolean;
  /** The word "optional", after the label. `required` wins when both are given. */
  optional?: boolean;
  labels?: Partial<FieldLabels>;
};

/** The name of a field, pointing at the control's `id`; a required one carries an asterisk and the word for a reader. */
export function FieldLabel({ className, required, optional, labels: ownLabels, children, ...props }: FieldLabelProps) {
  const field = useContext(FieldContext);
  const own = useMemo(() => (field ? { ...field.labels, ...ownLabels } : ownLabels), [field, ownLabels]);
  const labels = useLabels("field", FIELD_LABELS, own);
  const htmlFor = props.htmlFor ?? field?.id;
  return (
    <label className={classes("fui-label", "fui-field-label", className)} htmlFor={htmlFor} {...props}>
      {children}
      {required ? <FieldRequired label={labels.required} /> : optional ? <FieldOptional label={labels.optional} /> : null}
    </label>
  );
}

/** The mark of a required field on its own, when the label is drawn elsewhere. */
export function FieldRequiredMark({ label }: { label?: string }) {
  const labels = useLabels("field", FIELD_LABELS);
  return <FieldRequired label={label ?? labels.required} />;
}

/** The word of an optional field on its own, when the label is drawn elsewhere. */
export function FieldOptionalMark({ label }: { label?: string }) {
  const labels = useLabels("field", FIELD_LABELS);
  return <FieldOptional label={label ?? labels.optional} />;
}

function FieldRequired({ label }: { label: string }) {
  return (
    <>
      <span aria-hidden="true" className="fui-field-required">
        *
      </span>
      <span className="fui-sr-only">{label}</span>
    </>
  );
}

function FieldOptional({ label }: { label: string }) {
  return <span className="fui-field-optional">{label}</span>;
}

/** Holds the control and what belongs with it, so a field can put a description between two pieces. */
export function FieldContent({ className, ...props }: ComponentProps<"div">) {
  return <div className={classes("fui-field-content", className)} {...props} />;
}

/** A title over a group of fields, or a field whose name is not a form label. */
export function FieldTitle({ className, ...props }: ComponentProps<"div">) {
  return <div className={classes("fui-label", "fui-field-title", className)} {...props} />;
}

export function FieldDescription({ className, id, ...props }: ComponentProps<"p">) {
  const field = useContext(FieldContext);
  const ownId = id ?? (field ? field.descriptionId : undefined);
  useClaim("description", id);
  return <p className={classes("fui-description", "fui-field-description", className)} id={ownId} {...props} />;
}

/** What went wrong, said at once: an error is a live region of its own. */
export function FieldError({ className, id, ...props }: ComponentProps<"p">) {
  const field = useContext(FieldContext);
  const ownId = id ?? (field ? field.errorId : undefined);
  useClaim("error", id);
  return <p className={classes("fui-field-error", className)} id={ownId} role="alert" {...props} />;
}

/** A rule between two groups of fields, optionally with a word in the middle of it. */
export function FieldSeparator({ className, children, ...props }: ComponentProps<"div">) {
  return (
    <div className={classes("fui-field-separator", className)} data-slot="field-separator" role="none" {...props}>
      {children != null ? <span className="fui-field-separator-word">{children as ReactNode}</span> : null}
    </div>
  );
}
