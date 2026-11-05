"use client";

// Previews for the components added in 0.10 "Instrument". Synthetic data only.
import { useState, type ReactNode } from "react";
import {
  Field,
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
  Kbd,
  Label,
  NumberField,
  PasswordInput,
  SearchInput,
  Slider,
} from "@fabrials/ui";

function Frame({ children }: { children: ReactNode }) {
  return <div className="fui-preview grid grid-cols-[minmax(0,1fr)] gap-4">{children}</div>;
}

function SearchDemo() {
  const [query, setQuery] = useState("");
  const accounts = ["North workspace", "Harbour lab", "Field office", "Night shift"];
  const shown = accounts.filter((name) => name.toLowerCase().includes(query.trim().toLowerCase()));
  return (
    <Frame>
      <SearchInput aria-label="Search accounts" placeholder="Search accounts" value={query} onValueChange={setQuery} shortcut={<Kbd>/</Kbd>} />
      <p className="fui-description" role="status">
        {shown.length ? shown.join(", ") : "No account matches."}
      </p>
    </Frame>
  );
}

function SliderDemo() {
  const [range, setRange] = useState<number | readonly number[]>([20, 80]);
  return (
    <Frame>
      <div className="grid gap-2">
        <Label>Volume</Label>
        <Slider aria-label="Volume" defaultValue={64} showValue />
      </div>
      <div className="grid gap-2">
        <Label>Price range</Label>
        <Slider value={range} onValueChange={setRange} thumbLabels={["Minimum price", "Maximum price"]} format={{ style: "currency", currency: "EUR", maximumFractionDigits: 0 }} locale="en-GB" showValue />
      </div>
      <div className="grid gap-2">
        <Label>Quality</Label>
        <Slider aria-label="Quality" defaultValue={3} min={1} max={5} marks={[{ value: 1, label: "Draft" }, 2, { value: 3, label: "Good" }, 4, { value: 5, label: "Best" }]} />
      </div>
    </Frame>
  );
}

export const instrumentDemos: Record<string, () => ReactNode> = {
  "search-input": () => <SearchDemo />,
  "password-input": () => (
    <Frame>
      <Field label="Password" description="At least 12 characters.">
        {(control) => <PasswordInput {...control} autoComplete="new-password" defaultValue="correct horse battery" />}
      </Field>
    </Frame>
  ),
  "number-field": () => (
    <Frame>
      <Field label="Seats">{(control) => <NumberField {...control} defaultValue={12} min={1} max={500} />}</Field>
      <Field label="Timeout">{(control) => <NumberField {...control} defaultValue={1500} min={0} step={100} unit="ms" />}</Field>
    </Frame>
  ),
  slider: () => <SliderDemo />,
  "input-otp": () => (
    <Frame>
      <Field label="Verification code" description="Enter the 6-digit code we sent to your phone.">
        {(control) => (
          <InputOTP {...control} length={6}>
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup>
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        )}
      </Field>
    </Frame>
  ),
};
