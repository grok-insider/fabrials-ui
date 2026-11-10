"use client";

import {
  Children,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type CSSProperties,
  type ReactNode,
} from "react";
import { Checkbox as BaseCheckbox } from "@base-ui/react/checkbox";
import { CheckboxGroup as BaseCheckboxGroup } from "@base-ui/react/checkbox-group";
import { Radio as BaseRadio } from "@base-ui/react/radio";
import { RadioGroup as BaseRadioGroup } from "@base-ui/react/radio-group";
import { Check, CircleCheck, CircleHelp, CircleX, Info } from "lucide-react";
import { choiceKey, choiceMarker, hotkeyAllowed, matchesChoiceKey, outsideDialog, type ChoiceMarkers } from "./choice-keys";
import { Alert, AlertTitle } from "./display";
import { classes } from "./shared";

export type ChoiceResult = "correct" | "incorrect" | "missed";

export type ChoiceGroupLabels = {
  /** After the name of an option that was picked and is right. */
  correct: string;
  /** After the name of an option that was picked and is wrong. */
  incorrect: string;
  /** After the name of the right option that was not picked. */
  missed: string;
  /** After the name of an option a hint took out. */
  ruledOut: string;
};

const LABELS: ChoiceGroupLabels = {
  correct: "Correct",
  incorrect: "Your answer, incorrect",
  missed: "Correct answer",
  ruledOut: "Ruled out",
};

type Shared = Omit<ComponentProps<"div">, "defaultValue" | "onChange"> & {
  /** What each option shows in its keycap: `letters` (A, B, C; default), `numbers` (1, 2, 3) or `none`. */
  markers?: ChoiceMarkers;
  /**
   * The marker's key picks its option from anywhere on the page that is not a text field (1 to 9, or A to Z beside letters):
   * it selects the option, or toggles it in a `multiple` group, and moves focus to it. Off by default; turn it on for the one
   * question a screen is about.
   */
  shortcuts?: boolean;
  /** `vertical` stacks the options (default); `horizontal` puts them in a row that wraps. Arrow keys work either way. */
  orientation?: "vertical" | "horizontal";
  /** At most this many columns, as many as fit: an option is never narrower than `--fui-choice-min` (12rem). */
  columns?: number;
  size?: "sm" | "default" | "lg";
  /**
   * The verdict on what was picked. The group becomes read-only and the picked option is marked with it; give the other
   * options their own `result` (`missed` on the right one that was not picked). In a `multiple` group mark each option yourself.
   */
  result?: "correct" | "incorrect";
  /** Focusable and readable, not changeable. On by itself once the group or one of its options has a `result`. */
  readOnly?: boolean;
  disabled?: boolean;
  /** One answer must be picked before the form submits. A single-answer group only: a group of checkboxes has no such state. */
  required?: boolean;
  /** Submits with the form: one value, or one entry per ticked option in a `multiple` group. */
  name?: string;
  /** The digits of the `numbers` markers. Default: 1, 2, 3. */
  locale?: Intl.LocalesArgument;
  /** The words spoken after an option's name once it is marked. */
  labels?: Partial<ChoiceGroupLabels>;
};

export type ChoiceGroupProps =
  | (Shared & {
      /** Several options can be ticked (checkbox semantics). Default: one (radio semantics). */
      multiple?: false;
      value?: string | null;
      defaultValue?: string | null;
      onValueChange?: (value: string) => void;
    })
  | (Shared & {
      multiple: true;
      value?: readonly string[];
      defaultValue?: readonly string[];
      onValueChange?: (value: string[]) => void;
    });

type ChoiceContext = {
  multiple: boolean;
  markers: ChoiceMarkers;
  locale?: Intl.LocalesArgument;
  shortcuts: boolean;
  readOnly: boolean;
  result?: "correct" | "incorrect";
  selected: readonly string[];
  name?: string;
  labels: ChoiceGroupLabels;
};

const GroupContext = createContext<ChoiceContext | null>(null);
const IndexContext = createContext<number | undefined>(undefined);

/** An option is any element child that carries a `value`; each gets its place, which is its letter or number. */
function indexed(children: ReactNode) {
  let index = 0;
  let marked = false;
  const nodes = Children.map(children, (child) => {
    if (!isValidElement(child)) return child;
    const props = child.props as { value?: unknown; result?: unknown };
    if (props.value === undefined) return child;
    if (props.result != null) marked = true;
    const place = index;
    index += 1;
    return <IndexContext.Provider value={place}>{child}</IndexContext.Provider>;
  });
  return { nodes, marked };
}

/**
 * The answers to a question, as tiles. One answer is a radio group (the arrow keys move the pick, Tab enters at it); `multiple`
 * is a group of checkboxes (Tab moves between them, Space ticks). Name the group with `aria-labelledby` (the question) or
 * `aria-label`. Each option's name is its own content, so an answer in another language keeps its `lang`.
 */
export function ChoiceGroup(props: ChoiceGroupProps) {
  const {
    className,
    children,
    multiple = false,
    value,
    defaultValue,
    onValueChange,
    markers = "letters",
    shortcuts = false,
    orientation = "vertical",
    columns,
    size = "default",
    result,
    readOnly: readOnlyProp = false,
    disabled = false,
    required,
    name,
    locale,
    labels: ownLabels,
    style,
    ...rest
  } = props;
  const root = useRef<HTMLDivElement | null>(null);
  const [inner, setInner] = useState<readonly string[]>(() => (defaultValue == null ? [] : typeof defaultValue === "string" ? [defaultValue] : defaultValue));
  const selected = useMemo<readonly string[]>(
    () => (value === undefined ? inner : value === null ? [] : typeof value === "string" ? [value] : value),
    [inner, value],
  );
  const { nodes, marked } = indexed(children);
  const readOnly = readOnlyProp || result != null || marked;
  const labels = useMemo(() => ({ ...LABELS, ...ownLabels }), [ownLabels]);
  const context = useMemo<ChoiceContext>(
    () => ({ multiple, markers, locale, shortcuts: shortcuts && !readOnly && !disabled, readOnly, result, selected, name, labels }),
    [multiple, markers, locale, shortcuts, readOnly, disabled, result, selected, name, labels],
  );
  const live = shortcuts && !readOnly && !disabled;

  useEffect(() => {
    if (!live) return;
    const onKey = (event: KeyboardEvent) => {
      const group = root.current;
      if (!group || !hotkeyAllowed(event) || outsideDialog(event.target, group)) return;
      for (const option of group.querySelectorAll<HTMLElement>("[data-choice-key]")) {
        if (option.closest('[data-slot="choice-group"]') !== group) continue;
        if (!matchesChoiceKey(event.key, option.dataset.choiceKey, option.dataset.choiceMarker)) continue;
        event.preventDefault();
        if (option.getAttribute("aria-disabled") === "true") return;
        option.focus();
        option.click();
        return;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [live]);

  const shared = {
    "data-slot": "choice-group",
    "data-orientation": orientation,
    "data-size": size === "default" ? undefined : size,
    "data-columns": columns != null && columns > 1 ? "" : undefined,
    "data-readonly": readOnly ? "" : undefined,
    className: classes("fui-choice-group", className),
    style: columns != null && columns > 1 ? ({ ...style, "--fui-choice-columns": Math.round(columns) } as CSSProperties) : style,
    disabled,
    ref: root,
    ...rest,
  };
  return (
    <GroupContext.Provider value={context}>
      {multiple ? (
        <BaseCheckboxGroup
          {...shared}
          value={selected as string[]}
          onValueChange={(next) => {
            if (readOnly) return;
            setInner(next);
            (onValueChange as ((value: string[]) => void) | undefined)?.(next);
          }}
        >
          {nodes}
        </BaseCheckboxGroup>
      ) : (
        <BaseRadioGroup
          {...shared}
          name={name}
          readOnly={readOnly}
          required={required}
          value={selected[0] ?? null}
          onValueChange={(next: string) => {
            setInner([next]);
            (onValueChange as ((value: string) => void) | undefined)?.(next);
          }}
        >
          {nodes}
        </BaseRadioGroup>
      )}
    </GroupContext.Provider>
  );
}

export type ChoiceOptionProps = Omit<ComponentProps<"span">, "value"> & {
  /** What the group's value holds when this option is picked. */
  value: string;
  /** A second line under the answer; it describes the option, it is not part of its name. */
  description?: ReactNode;
  /** A hint took this option out: it stays where it was, struck through, and the arrow keys and its shortcut pass over it. */
  ruledOut?: boolean;
  /** Marks the option once the question is answered: an icon, a tint, and a word after its name for a screen reader. */
  result?: ChoiceResult;
  disabled?: boolean;
  /** The option's place, when it is not a direct child of the group (the group counts its direct children). */
  index?: number;
};

const RESULT_ICON = { correct: CircleCheck, incorrect: CircleX, missed: Check } as const;

/** One answer of a `ChoiceGroup`: a keycap with its letter or number, the answer, and what became of it. */
export function ChoiceOption({ className, value, description, ruledOut = false, result: own, disabled = false, index: ownIndex, children, ...props }: ChoiceOptionProps) {
  const group = useContext(GroupContext);
  const place = useContext(IndexContext);
  const id = useId();
  if (!group) throw new Error("ChoiceOption must be used inside a ChoiceGroup");
  const index = ownIndex ?? place;
  const checked = group.selected.includes(value);
  const result = own ?? (checked ? group.result : undefined);
  const marker = index == null ? "" : choiceMarker(index, group.markers, group.locale);
  const key = index == null || ruledOut || disabled ? undefined : choiceKey(index, group.markers);
  const word = result ? group.labels[result] : ruledOut ? group.labels.ruledOut : undefined;
  const Icon = result ? RESULT_ICON[result] : checked ? Check : null;
  const shared = {
    "data-slot": "choice-option",
    "data-result": result,
    "data-ruled-out": ruledOut ? "" : undefined,
    "data-choice-key": group.shortcuts ? key : undefined,
    "data-choice-marker": group.shortcuts && key && marker ? marker : undefined,
    "aria-keyshortcuts": group.shortcuts && key ? key.toUpperCase() : undefined,
    "aria-labelledby": description != null ? `${id}-label${word ? ` ${id}-word` : ""}` : undefined,
    "aria-describedby": description != null ? `${id}-description` : undefined,
    className: classes("fui-choice-option", className),
    disabled: disabled || ruledOut,
    value,
    ...props,
  };
  const content = (
    <>
      {marker ? (
        <span aria-hidden="true" className="fui-choice-marker">
          {marker}
        </span>
      ) : null}
      <span className="fui-choice-body">
        <span className="fui-choice-label" id={`${id}-label`}>
          {children}
        </span>
        {description != null ? (
          <span className="fui-choice-description" id={`${id}-description`}>
            {description}
          </span>
        ) : null}
      </span>
      <span className="fui-choice-state">
        {Icon ? <Icon aria-hidden="true" focusable="false" /> : null}
        {word ? (
          <span className="fui-sr-only" id={`${id}-word`}>
            {`, ${word}`}
          </span>
        ) : null}
      </span>
    </>
  );
  return group.multiple ? (
    <BaseCheckbox.Root {...shared} name={group.name} readOnly={group.readOnly}>
      {content}
    </BaseCheckbox.Root>
  ) : (
    <BaseRadio.Root {...shared}>{content}</BaseRadio.Root>
  );
}

export type ChoiceFeedbackTone = "correct" | "incorrect" | "partial" | "neutral";

const FEEDBACK = {
  correct: { variant: "success", icon: CircleCheck, title: "Correct" },
  incorrect: { variant: "destructive", icon: CircleX, title: "Not quite" },
  partial: { variant: "warning", icon: CircleHelp, title: "Partly right" },
  neutral: { variant: "default", icon: Info, title: undefined },
} as const;

export type ChoiceFeedbackProps = Omit<ComponentProps<"div">, "title"> & {
  /** `correct`, `incorrect`, `partial` (some of it right) or `neutral` (a model answer to compare with). */
  tone?: ChoiceFeedbackTone;
  /** The verdict in words. Default: "Correct", "Not quite", "Partly right"; none for `neutral`. `null` leaves it out. */
  title?: ReactNode;
  /** Replaces the tone's icon. */
  icon?: ReactNode;
};

/**
 * What became of an answer, under its `ChoiceGroup`: an `Alert` in the tone of the verdict, with its icon and its word. It is
 * always a polite status, never an alert: a wrong answer is not an emergency. Mount it when the answer is checked.
 */
export function ChoiceFeedback({ className, tone = "neutral", title, icon, children, ...props }: ChoiceFeedbackProps) {
  const { variant, icon: Icon, title: word } = FEEDBACK[tone];
  const heading = title === undefined ? word : title;
  return (
    <Alert role="status" variant={variant} {...props} data-slot="choice-feedback" data-tone={tone} className={classes("fui-choice-feedback", className)}>
      {icon ?? <Icon aria-hidden="true" focusable="false" />}
      {heading != null ? <AlertTitle>{heading}</AlertTitle> : null}
      {children != null ? <div className="fui-choice-feedback-body">{children}</div> : null}
    </Alert>
  );
}
