"use client";
// Origin: Fabrials, 0.10 (SearchInput and PasswordInput replace the hand-made fields of eight products; NumberField is Base UI's).

import { useEffect, useId, useRef, useState, type ComponentProps, type KeyboardEvent, type ReactNode, type Ref } from "react";
import { NumberField as BaseNumberField } from "@base-ui/react/number-field";
import { Eye, EyeOff, Minus, Plus, Search, TriangleAlert, X } from "lucide-react";
import { IconButton } from "./icon-button";
import { PixelSpinner } from "./pixel-spinner";
import { canonicalSize } from "./canonical-size";
import { classes, type StyledProps } from "./shared";

type FieldSize = "sm" | "default" | "md";

function assignRef<T>(ref: Ref<T> | undefined, node: T | null) {
  if (typeof ref === "function") ref(node);
  else if (ref) (ref as { current: T | null }).current = node;
}

/** Sets a field's value the way typing would, so React's onChange runs for controlled and uncontrolled fields alike. */
function setNativeValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

export type SearchInputProps = Omit<ComponentProps<"input">, "type" | "size" | "className"> & {
  /** Every change, as text (the input's `onChange` still runs). */
  onValueChange?: (value: string) => void;
  /** After the clear button (or Escape) empties the field. */
  onClear?: () => void;
  clearLabel?: string;
  /** A key hint shown while the field is empty, such as `<Kbd>/</Kbd>`. The host binds the key. */
  shortcut?: ReactNode;
  /** Results are on their way: the magnifier becomes the pixel spinner and the field is `aria-busy`. */
  loading?: boolean;
  size?: FieldSize;
  /** The wrapper. */
  className?: string;
  /** The input itself. */
  inputClassName?: string;
};

/**
 * A search field: a magnifier, the browser's `type="search"` input, and a clear button while there is text. Escape
 * clears a field that has text and is left to the page (a dialog closes) when it is empty.
 */
export function SearchInput({
  onValueChange,
  onClear,
  clearLabel = "Clear search",
  shortcut,
  loading = false,
  size = "default",
  className,
  inputClassName,
  value,
  defaultValue,
  onChange,
  onKeyDown,
  disabled,
  readOnly,
  ref,
  ...props
}: SearchInputProps) {
  const own = useRef<HTMLInputElement | null>(null);
  const scale = canonicalSize(size, "default") ?? "default";
  const [typed, setTyped] = useState(String(defaultValue ?? ""));
  const text = value !== undefined ? String(value ?? "") : typed;
  const clearable = text.length > 0 && !disabled && !readOnly;
  const clear = () => {
    const input = own.current;
    if (!input) return;
    setNativeValue(input, "");
    input.focus();
    onClear?.();
  };
  return (
    <div
      className={classes("fui-search-input", className)}
      data-size={scale}
      data-loading={loading ? "" : undefined}
      data-disabled={disabled ? "" : undefined}
    >
      <span className="fui-search-input-icon" aria-hidden="true">
        {loading ? <PixelSpinner /> : <Search />}
      </span>
      <input
        {...props}
        ref={(node) => {
          own.current = node;
          assignRef(ref, node);
        }}
        type="search"
        value={value}
        defaultValue={defaultValue}
        disabled={disabled}
        readOnly={readOnly}
        aria-busy={loading || undefined}
        className={classes("fui-input", "fui-search-input-control", inputClassName)}
        onChange={(event) => {
          setTyped(event.currentTarget.value);
          onChange?.(event);
          onValueChange?.(event.currentTarget.value);
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.defaultPrevented || event.key !== "Escape" || !clearable) return;
          event.preventDefault();
          event.stopPropagation();
          clear();
        }}
      />
      {shortcut && !text ? (
        <span className="fui-search-input-shortcut" aria-hidden="true">
          {shortcut}
        </span>
      ) : null}
      {clearable ? (
        <IconButton type="button" size="icon-sm" label={clearLabel} tooltip={false} data-hit="end" className="fui-search-input-clear" onClick={clear}>
          <X aria-hidden="true" />
        </IconButton>
      ) : null}
    </div>
  );
}

export type PasswordInputProps = Omit<ComponentProps<"input">, "type" | "size" | "className"> & {
  /** The reveal button's name; it is a toggle (`aria-pressed`), so the name does not change. */
  showLabel?: string;
  /** Said under the field while Caps Lock is on and the field has focus. `null` turns the warning off. */
  capsLockLabel?: ReactNode | null;
  size?: FieldSize;
  className?: string;
  inputClassName?: string;
};

/**
 * A password field with a reveal toggle and a Caps Lock warning. The password is hidden again when its form is
 * submitted, so a browser or password manager never stores the revealed field as plain text.
 */
export function PasswordInput({
  showLabel = "Show password",
  capsLockLabel = "Caps Lock is on",
  size = "default",
  className,
  inputClassName,
  autoComplete = "current-password",
  disabled,
  onKeyDown,
  onKeyUp,
  onBlur,
  ref,
  id,
  "aria-describedby": describedBy,
  ...props
}: PasswordInputProps) {
  const generated = useId();
  const base = id ?? generated;
  const own = useRef<HTMLInputElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  useEffect(() => {
    const form = own.current?.form;
    if (!form) return;
    const hide = () => setVisible(false);
    form.addEventListener("submit", hide);
    return () => form.removeEventListener("submit", hide);
  }, []);
  const warn = capsLock && capsLockLabel !== null;
  const ids = [describedBy, warn ? `${base}-caps` : undefined].filter(Boolean).join(" ");
  const readCaps = (event: KeyboardEvent<HTMLInputElement>) => {
    if (typeof event.getModifierState === "function") setCapsLock(event.getModifierState("CapsLock"));
  };
  return (
    <div className={classes("fui-password-input", className)} data-size={canonicalSize(size, "default") ?? "default"} data-disabled={disabled ? "" : undefined}>
      <div className="fui-password-input-row">
        <input
          {...props}
          id={base}
          ref={(node) => {
            own.current = node;
            assignRef(ref, node);
          }}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          disabled={disabled}
          aria-describedby={ids || undefined}
          className={classes("fui-input", "fui-password-input-control", inputClassName)}
          onKeyDown={(event) => {
            readCaps(event);
            onKeyDown?.(event);
          }}
          onKeyUp={(event) => {
            readCaps(event);
            onKeyUp?.(event);
          }}
          onBlur={(event) => {
            setCapsLock(false);
            onBlur?.(event);
          }}
        />
        <IconButton
          type="button"
          size="icon-sm"
          label={showLabel}
          tooltip={false}
          aria-pressed={visible}
          aria-controls={base}
          disabled={disabled}
          data-hit="end"
          className="fui-password-input-toggle"
          onClick={() => setVisible((shown) => !shown)}
        >
          {visible ? <EyeOff /> : <Eye />}
        </IconButton>
      </div>
      {warn ? (
        <p className="fui-password-input-caps" id={`${base}-caps`} aria-live="polite">
          <TriangleAlert aria-hidden="true" />
          {capsLockLabel}
        </p>
      ) : null}
    </div>
  );
}

export type NumberFieldProps = StyledProps<BaseNumberField.Root.Props> & {
  decrementLabel?: string;
  incrementLabel?: string;
  /** A unit after the value ("ms", "credits"). It is read with the field; prefer `format` when Intl has the unit. */
  unit?: ReactNode;
  placeholder?: string;
  size?: FieldSize;
  inputClassName?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean | "true" | "false";
};

/**
 * A number with steppers. The keyboard is Base UI's: arrows step, Shift steps by `largeStep`, Alt by `smallStep`,
 * Page Up/Down step large, Home/End go to `min`/`max`; held buttons repeat. The value is tabular mono, so digits do
 * not jump while it changes.
 */
export function NumberField({
  className,
  decrementLabel = "Decrease",
  incrementLabel = "Increase",
  unit,
  placeholder,
  size = "default",
  inputClassName,
  id,
  "aria-label": ariaLabel,
  "aria-labelledby": labelledBy,
  "aria-describedby": describedBy,
  "aria-invalid": invalid,
  ...props
}: NumberFieldProps) {
  const generated = useId();
  const base = id ?? generated;
  const ids = [describedBy, unit ? `${base}-unit` : undefined].filter(Boolean).join(" ");
  return (
    <BaseNumberField.Root {...props} id={base} className={classes("fui-number-field", className)} data-size={canonicalSize(size, "default") ?? "default"}>
      <BaseNumberField.Group className="fui-number-field-group" data-invalid={invalid === true || invalid === "true" ? "" : undefined}>
        <BaseNumberField.Input
          className={classes("fui-number-field-input", inputClassName)}
          placeholder={placeholder}
          aria-label={ariaLabel}
          aria-labelledby={labelledBy}
          aria-describedby={ids || undefined}
          aria-invalid={invalid}
        />
        {unit ? (
          <span className="fui-number-field-unit" id={`${base}-unit`}>
            {unit}
          </span>
        ) : null}
        <BaseNumberField.Decrement className="fui-number-field-step" aria-label={decrementLabel}>
          <Minus aria-hidden="true" />
        </BaseNumberField.Decrement>
        <BaseNumberField.Increment className="fui-number-field-step" aria-label={incrementLabel}>
          <Plus aria-hidden="true" />
        </BaseNumberField.Increment>
      </BaseNumberField.Group>
    </BaseNumberField.Root>
  );
}
