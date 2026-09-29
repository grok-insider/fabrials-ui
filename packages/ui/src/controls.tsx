"use client";

import { useEffect, useRef, type ComponentProps, type ReactNode, type Ref } from "react";
import { Button as BaseButton } from "@base-ui/react/button";
import { Checkbox as BaseCheckbox } from "@base-ui/react/checkbox";
import { Switch as BaseSwitch } from "@base-ui/react/switch";
import { Check, LoaderCircle, Minus } from "lucide-react";
import { classes, type StyledProps } from "./shared";

export { buttonVariants } from "./button-variants";
import type { ButtonStyleProps } from "./button-variants";

export type ButtonProps = StyledProps<BaseButton.Props> &
  ButtonStyleProps & {
    /** Keeps the label, adds a spinner and blocks repeated activation. */
    loading?: boolean;
  };

export function Button({
  className,
  variant = "default",
  size = "default",
  loading = false,
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
        <LoaderCircle aria-hidden className="fui-button-spinner fui-spin" />
      ) : null}
      {children}
    </BaseButton>
  );
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={classes("fui-input", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      className={classes("fui-input", "fui-textarea", className)}
      {...props}
    />
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
