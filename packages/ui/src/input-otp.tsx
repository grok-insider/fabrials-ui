"use client";
// Origin: Fabrials, 0.10, on Base UI's OTP Field, under shadcn's names (InputOTP, InputOTPGroup, InputOTPSlot,
// InputOTPSeparator) so a shim covers them.

import { OTPField } from "@base-ui/react/otp-field";
import { createContext, useContext, useId, type ComponentProps } from "react";
import { classes, type StyledProps } from "./shared";

type SlotLabel = (position: number, length: number) => string;

const OTPContext = createContext<{ length: number; slotLabel: SlotLabel; labelledBy?: string }>({
  length: 6,
  slotLabel: (position, length) => `Character ${position} of ${length}`,
});

export type InputOTPProps = Omit<StyledProps<OTPField.Root.Props>, "length"> & {
  /** How many characters the code has. `maxLength` is shadcn's name for the same thing. */
  length?: number;
  maxLength?: number;
  /** The name of every slot after the first (the first takes the field's label). */
  slotLabel?: SlotLabel;
  /** Without a `<label for>`, names the code. Base UI ignores `aria-label` on the first slot, so the name is a visually
   * hidden text that the group and the first slot point at. */
  "aria-label"?: string;
  "aria-labelledby"?: string;
};

/**
 * A one-time code in separate slots. Typing moves to the next slot, Backspace to the previous one, a pasted or
 * autofilled code (`autocomplete="one-time-code"`) fills every slot, and the value is submitted as one field.
 * `validationType` is numeric unless you say otherwise.
 */
export function InputOTP({
  length,
  maxLength,
  slotLabel = (position, total) => `Character ${position} of ${total}`,
  "aria-label": label,
  "aria-labelledby": labelledBy,
  className,
  children,
  ...props
}: InputOTPProps) {
  const total = length ?? maxLength ?? 6;
  const invalid = props["aria-invalid"] === true || props["aria-invalid"] === "true";
  const nameId = useId();
  const named = [label ? nameId : undefined, labelledBy].filter(Boolean).join(" ") || undefined;
  return (
    <OTPContext.Provider value={{ length: total, slotLabel, labelledBy: named }}>
      <OTPField.Root
        {...props}
        length={total}
        aria-labelledby={named}
        className={classes("fui-input-otp", className)}
        data-invalid={invalid ? "" : undefined}
      >
        {label ? (
          <span id={nameId} className="fui-sr-only">
            {label}
          </span>
        ) : null}
        {children ??
          Array.from({ length: total }, (_, index) => <InputOTPSlot key={index} index={index} />)}
      </OTPField.Root>
    </OTPContext.Provider>
  );
}

/** Slots shown together; separate groups with `InputOTPSeparator`. */
export function InputOTPGroup({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="input-otp-group" className={classes("fui-input-otp-group", className)} {...props} />;
}

/** One character. `index` counts from 0 in reading order; it names the slot for assistive technology. */
export function InputOTPSlot({
  index,
  className,
  "aria-label": ariaLabel,
  ...props
}: StyledProps<OTPField.Input.Props> & { index?: number }) {
  const { length, slotLabel, labelledBy } = useContext(OTPContext);
  const first = index === undefined || index === 0;
  return (
    <OTPField.Input
      {...props}
      aria-label={first ? undefined : (ariaLabel ?? slotLabel(index + 1, length))}
      aria-labelledby={first ? labelledBy : undefined}
      className={classes("fui-input-otp-slot", className)}
    />
  );
}

export function InputOTPSeparator({ className, ...props }: StyledProps<OTPField.Separator.Props>) {
  return <OTPField.Separator {...props} className={classes("fui-input-otp-separator", className)} />;
}
