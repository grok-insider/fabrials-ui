"use client";

import { useDeferredValue, useEffect, useId, useRef, useState, type ComponentProps, type CSSProperties, type ReactNode, type Ref } from "react";
import { Button as BaseButton } from "@base-ui/react/button";
import { Checkbox as BaseCheckbox } from "@base-ui/react/checkbox";
import { Switch as BaseSwitch } from "@base-ui/react/switch";
import { Check, Minus } from "lucide-react";
import { FieldCount, countId, countLimit, mergeDescribedBy, type CountProps } from "./field-count";
import { PixelSpinner } from "./pixel-spinner";
import { classes, type StyledProps } from "./shared";

export { buttonVariants } from "./button-variants";
import type { ButtonStyleProps } from "./button-variants";

export type ButtonProps = StyledProps<BaseButton.Props> &
  ButtonStyleProps & {
    /** Keeps the label, adds a spinner and blocks repeated activation. */
    loading?: boolean;
    /** What the button says while `loading` ("Saving"), in place of its children. The width follows the text. */
    loadingLabel?: ReactNode;
  };

export function Button({
  className,
  variant = "default",
  size = "default",
  loading = false,
  loadingLabel,
  disabled,
  focusableWhenDisabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <BaseButton
      data-slot="button"
      className={classes("fui-button", className)}
      data-variant={variant}
      data-size={size}
      data-loading={loading || undefined}
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      focusableWhenDisabled={focusableWhenDisabled ?? loading}
      {...props}
    >
      {loading ? (
        <PixelSpinner aria-hidden className="fui-button-spinner" />
      ) : null}
      {loading && loadingLabel != null ? loadingLabel : children}
    </BaseButton>
  );
}

export type InputProps = ComponentProps<"input"> & {
  /**
   * The counter under the field: `count={true}` shows how much it holds, `{ max, unit, soft }` adds the limit. A soft limit
   * (the default) never truncates and says when the text is past it.
   */
  count?: CountProps;
};

/** Without `count` this is the plain field it has always been: the same element, attributes in the caller's order, no state. */
export function Input({ count, ...props }: InputProps) {
  if (count) return <CountedInput count={count} {...props} />;
  const { className, ...rest } = props;
  return <input className={classes("fui-input", className)} {...rest} />;
}

function CountedInput({ className, count, id, value, defaultValue, onChange, "aria-describedby": describedBy, maxLength, ...props }: InputProps & { count: CountProps }) {
  const counted = useCountedValue(value, defaultValue);
  const generated = useId();
  const { maxLength: hardMax } = countLimit(count);
  const input = (
    <input
      className={classes("fui-input", className)}
      id={id}
      value={value}
      defaultValue={defaultValue}
      maxLength={hardMax ?? maxLength}
      aria-describedby={count ? mergeDescribedBy(describedBy, countId(id, generated)) : describedBy}
      onChange={(event) => {
        counted.track(event.currentTarget.value);
        onChange?.(event);
      }}
      {...props}
    />
  );
  return (
    <div className="fui-count-field">
      {input}
      <FieldCount count={count} id={countId(id, generated)} value={counted.shown} />
    </div>
  );
}

export type TextareaProps = ComponentProps<"textarea"> & {
  /** Grow with the text, between `minRows` and `maxRows`, then scroll. CSS \`field-sizing\` where the browser has it; a
   * measured height elsewhere. */
  autoResize?: boolean;
  minRows?: number;
  maxRows?: number;
  /**
   * The counter under the field: `count={true}` shows how much it holds, `{ max, unit, soft }` adds the limit. A soft limit
   * (the default) never truncates and says when the text is past it.
   */
  count?: CountProps;
};

const fieldSizing = typeof CSS !== "undefined" && typeof CSS.supports === "function" && CSS.supports("field-sizing", "content");

/** What a field holds, whether the host holds it or the field does, and the value the counter reads a frame later. */
function useCountedValue(value: string | number | readonly string[] | undefined, defaultValue: string | number | readonly string[] | undefined) {
  const [typed, setTyped] = useState(() => (defaultValue == null ? "" : String(defaultValue)));
  const text = value === undefined ? typed : String(value ?? "");
  const shown = useDeferredValue(text);
  return { shown, track: (next: string) => setTyped(next) };
}

/** Without `count` this is the textarea of 0.11, unchanged; with it, the same field over its counter. */
export function Textarea({ count, ...props }: TextareaProps) {
  return count ? <CountedTextarea count={count} {...props} /> : <PlainTextarea {...props} />;
}

function PlainTextarea({ className, autoResize = false, minRows, maxRows, style, ref, onInput, ...props }: Omit<TextareaProps, "count">) {
  const own = useRef<HTMLTextAreaElement | null>(null);
  const measure = () => {
    const node = own.current;
    if (!autoResize || fieldSizing || !node) return;
    node.style.height = "auto";
    node.style.height = `${node.scrollHeight + node.offsetHeight - node.clientHeight}px`;
  };
  useEffect(measure);
  return (
    <textarea
      className={classes("fui-input", "fui-textarea", className)}
      data-autoresize={autoResize ? "" : undefined}
      style={
        autoResize
          ? ({ ...style, "--fui-textarea-min-rows": minRows ?? 2, "--fui-textarea-max-rows": maxRows ?? 12 } as CSSProperties)
          : style
      }
      ref={(node) => {
        own.current = node;
        if (typeof ref === "function") return ref(node);
        if (ref) ref.current = node;
      }}
      onInput={(event) => {
        measure();
        onInput?.(event);
      }}
      {...props}
    />
  );
}

function CountedTextarea({
  className,
  autoResize = false,
  minRows,
  maxRows,
  style,
  ref,
  onInput,
  count,
  id,
  value,
  defaultValue,
  "aria-describedby": describedBy,
  maxLength,
  ...props
}: TextareaProps & { count: CountProps }) {
  const own = useRef<HTMLTextAreaElement | null>(null);
  const counted = useCountedValue(value, defaultValue);
  const generated = useId();
  const { maxLength: hardMax } = countLimit(count);
  const measure = () => {
    const node = own.current;
    if (!autoResize || fieldSizing || !node) return;
    node.style.height = "auto";
    node.style.height = `${node.scrollHeight + node.offsetHeight - node.clientHeight}px`;
  };
  useEffect(measure);
  const area = (
    <textarea
      className={classes("fui-input", "fui-textarea", className)}
      data-autoresize={autoResize ? "" : undefined}
      style={
        autoResize
          ? ({ ...style, "--fui-textarea-min-rows": minRows ?? 2, "--fui-textarea-max-rows": maxRows ?? 12 } as CSSProperties)
          : style
      }
      id={id}
      value={value}
      defaultValue={defaultValue}
      maxLength={hardMax ?? maxLength}
      aria-describedby={count ? mergeDescribedBy(describedBy, countId(id, generated)) : describedBy}
      ref={(node) => {
        own.current = node;
        if (typeof ref === "function") return ref(node);
        if (ref) ref.current = node;
      }}
      onInput={(event) => {
        counted.track(event.currentTarget.value);
        measure();
        onInput?.(event);
      }}
      {...props}
    />
  );
  return (
    <div className="fui-count-field">
      {area}
      <FieldCount count={count} id={countId(id, generated)} value={counted.shown} />
    </div>
  );
}

export function NativeSelect({
  className,
  ...props
}: ComponentProps<"select">) {
  return (
    <select
      className={classes("fui-input", "fui-native-select", className)}
      {...props}
    />
  );
}

/** shadcn's names for the native select's options. */
export function NativeSelectOption(props: ComponentProps<"option">) {
  return <option {...props} />;
}

export function NativeSelectOptGroup(props: ComponentProps<"optgroup">) {
  return <optgroup {...props} />;
}

type NativeChoiceProps = Omit<ComponentProps<"input">, "type"> & {
  /** Puts the input in a whole-row label, a 44 px target; the text is the input's name. */
  label?: ReactNode;
  labelClassName?: string;
};

function NativeChoice({
  className,
  label,
  labelClassName,
  type,
  ...props
}: NativeChoiceProps & { type: "checkbox" | "radio" }) {
  const input = (
    <input
      className={classes(type === "radio" ? "fui-native-radio" : "fui-native-checkbox", className)}
      {...props}
      type={type}
    />
  );
  if (label == null) return input;
  return (
    <label className={classes("fui-native-choice", labelClassName)}>
      {input}
      <span>{label}</span>
    </label>
  );
}

function setRef<T>(ref: Ref<T> | undefined, node: T | null) {
  if (typeof ref === "function") return ref(node);
  if (ref) ref.current = node;
}

export type NativeCheckboxProps = NativeChoiceProps & {
  type?: "checkbox";
  /** Mixed state (some of a group are ticked). It is a property of the element, never an attribute, so
   * it is applied after mount and again after every render and change: a click clears it in the browser
   * even when the host's state does not change. */
  indeterminate?: boolean;
};

export function NativeCheckbox({
  indeterminate,
  onChange,
  ref,
  ...props
}: NativeCheckboxProps) {
  const own = useRef<HTMLInputElement | null>(null);
  const wanted = useRef(indeterminate);
  useEffect(() => {
    wanted.current = indeterminate;
    if (own.current && indeterminate !== undefined) own.current.indeterminate = indeterminate;
  });
  return (
    <NativeChoice
      {...props}
      type="checkbox"
      data-indeterminate={indeterminate ? "" : undefined}
      ref={(node) => {
        own.current = node;
        return setRef(ref, node);
      }}
      onChange={(event) => {
        onChange?.(event);
        if (indeterminate === undefined) return;
        // The browser cleared the mixed state on the click; the host's state decides after it has rendered.
        queueMicrotask(() => {
          if (own.current) own.current.indeterminate = !!wanted.current;
        });
      }}
    />
  );
}

/** The browser's own radio: submits with the form, keeps the arrow keys of its name group and is disabled by a
 * disabled fieldset (a Base UI radio is a span that a fieldset does not disable). Use `NativeRadioGroup`. */
export function NativeRadio(props: NativeChoiceProps) {
  return <NativeChoice {...props} type="radio" />;
}

export function Label({ className, ...props }: ComponentProps<"label">) {
  return <label className={classes("fui-label", className)} {...props} />;
}

export function Checkbox({
  className,
  indeterminate,
  ...props
}: StyledProps<BaseCheckbox.Root.Props>) {
  return (
    <BaseCheckbox.Root
      className={classes("fui-checkbox", className)}
      indeterminate={indeterminate}
      {...props}
    >
      <BaseCheckbox.Indicator className="fui-control-indicator">
        {indeterminate ? (
          <Minus aria-hidden size={12} strokeWidth={3} />
        ) : (
          <Check aria-hidden size={12} strokeWidth={3} />
        )}
      </BaseCheckbox.Indicator>
    </BaseCheckbox.Root>
  );
}

export function Switch({
  className,
  ...props
}: StyledProps<BaseSwitch.Root.Props>) {
  return (
    <BaseSwitch.Root className={classes("fui-switch", className)} {...props}>
      <BaseSwitch.Thumb className="fui-switch-thumb" />
    </BaseSwitch.Root>
  );
}
