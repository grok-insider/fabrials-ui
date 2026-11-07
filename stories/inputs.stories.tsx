import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Button,
  Field,
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
  Kbd,
  Label,
  Loading,
  NumberField,
  PasswordInput,
  SearchInput,
  Slider,
  Textarea,
} from "@fabrials/ui";
import { Block, Frame, Page } from "./story-frame";

const meta = {
  title: "Tests/Inputs",
  parameters: { layout: "fullscreen" },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const grid = { display: "grid", alignItems: "start", gap: "var(--fui-space-4)", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 16rem), 1fr))" } as const;

function TextFieldsPage() {
  const [query, setQuery] = useState("quarterly report");
  return (
    <Page
      title="Text fields"
      description="Search, password and a textarea that grows. The browser's own controls stay underneath, so autofill, forms and assistive technology keep working."
    >
      <Block title="Search" description="A clear button appears with text; Escape clears it first and is left to the page when the field is empty.">
        <div style={grid}>
          <SearchInput aria-label="Search messages" placeholder="Search messages" shortcut={<Kbd>/</Kbd>} />
          <SearchInput aria-label="Search files" value={query} onValueChange={setQuery} placeholder="Search files" />
          <SearchInput aria-label="Search accounts" defaultValue="north" loading placeholder="Search accounts" />
          <SearchInput aria-label="Search, small" size="sm" placeholder="Filter" />
          <SearchInput aria-label="Search, disabled" disabled defaultValue="archived" />
        </div>
      </Block>
      <Block title="Password" description="The eye is a toggle with a fixed name. The password hides again when its form is submitted; Caps Lock is said under the field.">
        <div style={grid}>
          <Field label="Password" description="At least 12 characters.">
            {(control) => (
              <PasswordInput {...control} defaultValue="correct horse battery staple" />
            )}
          </Field>
          <Field label="New password" error="Use at least 12 characters.">
            {(control) => (
              <PasswordInput {...control} autoComplete="new-password" defaultValue="short" aria-invalid />
            )}
          </Field>
          <Field label="API key">
            {(control) => (
              <PasswordInput {...control} size="sm" placeholder="sk-…" autoComplete="off" />
            )}
          </Field>
          <Field label="Disabled">
            {(control) => (
              <PasswordInput {...control} disabled defaultValue="locked" />
            )}
          </Field>
        </div>
      </Block>
      <Block title="In a form" description="Submitting hides a revealed password again.">
        <form
          aria-label="Sign in"
          className="catalogue-row"
          style={{ alignItems: "end" }}
          onSubmit={(event) => event.preventDefault()}
        >
          <div style={{ flex: "1 1 16rem" }}>
            <Field label="Account password">{(control) => <PasswordInput {...control} defaultValue="hunter2-hunter2" />}</Field>
          </div>
          <Button type="submit">Sign in</Button>
        </form>
      </Block>
      <Block title="A textarea that grows" description="Two to six lines here, then it scrolls. CSS field-sizing where the browser has it, a measured height elsewhere.">
        <div style={grid}>
          <Field label="Reply">
            {(control) => (
              <Textarea {...control} autoResize minRows={2} maxRows={6} placeholder="Write a reply" />
            )}
          </Field>
          <Field label="Notes">
            {(control) => (
              <Textarea {...control}
                autoResize
                minRows={2}
                maxRows={6}
                defaultValue={"The renewal moved to the first of next month.\nNorth asked for the invoice in euros.\nThe usage export is attached.\nCall back on Thursday."}
              />
            )}
          </Field>
        </div>
      </Block>
      <Block title="Right to left">
        <Frame width={420} dir="rtl">
          <div className="catalogue-stack">
            <SearchInput aria-label="بحث" placeholder="ابحث في الرسائل" defaultValue="تقرير" clearLabel="مسح البحث" />
            <PasswordInput aria-label="كلمة المرور" defaultValue="كلمة سرية" showLabel="إظهار كلمة المرور" />
          </div>
        </Frame>
      </Block>
      <Block title="Loading">
        <Loading when label="Loading the form">
          <div style={grid}>
            <SearchInput aria-label="Search the archive" placeholder="Search the archive" />
            <PasswordInput aria-label="Archive password" defaultValue="secret" />
          </div>
        </Loading>
      </Block>
    </Page>
  );
}

function NumbersPage() {
  const [budget, setBudget] = useState<number | readonly number[]>([20, 80]);
  return (
    <Page
      title="Numbers and ranges"
      description="A number with steppers and a slider with fader caps. Arrows step, Shift steps large, Home and End go to the ends; the values are tabular so the digits never jump."
    >
      <Block title="Number field">
        <div style={grid}>
          <Field label="Seats">
            {(control) => (
              <NumberField {...control} defaultValue={12} min={1} max={500} />
            )}
          </Field>
          <Field label="Timeout">
            {(control) => (
              <NumberField {...control} defaultValue={1500} min={0} step={100} unit="ms" />
            )}
          </Field>
          <Field label="Monthly budget">
            {(control) => (
              <NumberField {...control} defaultValue={240} min={0} format={{ style: "currency", currency: "EUR", maximumFractionDigits: 0 }} locale="en-GB" />
            )}
          </Field>
          <Field label="Retries" description="At the minimum: the decrease key is off.">
            {(control) => (
              <NumberField {...control} defaultValue={0} min={0} max={5} />
            )}
          </Field>
          <Field label="Concurrency" error="Use a number between 1 and 32.">
            {(control) => (
              <NumberField {...control} defaultValue={64} min={1} max={32} allowOutOfRange aria-invalid />
            )}
          </Field>
          <Field label="Small, disabled">
            {(control) => (
              <NumberField {...control} defaultValue={3} size="sm" disabled />
            )}
          </Field>
        </div>
      </Block>
      <Block title="Slider" description="A sunken track, a Stormlight fill and a raised cap. Ruler marks are labelled in the label voice.">
        <div style={{ ...grid, rowGap: "var(--fui-space-6)" }}>
          <div className="catalogue-stack">
            <Label>Volume</Label>
            <Slider aria-label="Volume" defaultValue={64} showValue />
          </div>
          <div className="catalogue-stack">
            <Label>Price range</Label>
            <Slider
              value={budget}
              onValueChange={setBudget}
              thumbLabels={["Minimum price", "Maximum price"]}
              format={{ style: "currency", currency: "EUR", maximumFractionDigits: 0 }}
              locale="en-GB"
              showValue
            />
          </div>
          <div className="catalogue-stack">
            <Label>Quality</Label>
            <Slider
              aria-label="Quality"
              defaultValue={3}
              min={1}
              max={5}
              step={1}
              marks={[
                { value: 1, label: "Draft" },
                2,
                { value: 3, label: "Good" },
                4,
                { value: 5, label: "Best" },
              ]}
            />
          </div>
          <div className="catalogue-stack">
            <Label>Disabled</Label>
            <Slider aria-label="Disabled" defaultValue={30} disabled />
          </div>
        </div>
      </Block>
      <Block title="Vertical, and right to left">
        <div className="catalogue-row" style={{ alignItems: "stretch" }}>
          <Slider aria-label="Gain" orientation="vertical" defaultValue={70} />
          <Slider aria-label="Treble" orientation="vertical" defaultValue={35} />
          <Frame width={358} dir="rtl">
            <Slider aria-label="مستوى الصوت" defaultValue={40} showValue />
          </Frame>
        </div>
      </Block>
    </Page>
  );
}

function CodesPage() {
  return (
    <Page
      title="One-time codes"
      description="Separate slots over Base UI's OTP field: typing moves on, Backspace moves back, and a pasted or autofilled code fills every slot."
    >
      <Block title="Six digits">
        <Field label="Verification code" description="Enter the 6-digit code we sent to your phone.">
          {(control) => (
            <InputOTP {...control} length={6} />
          )}
        </Field>
      </Block>
      <Block title="Grouped" description="Groups share their hairlines; the separator is decoration.">
        <div className="catalogue-row">
          <InputOTP maxLength={6} aria-label="Code" defaultValue="472">
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
        </div>
      </Block>
      <Block title="Letters and digits, invalid, disabled">
        <div className="catalogue-stack">
          <Field label="Recovery code">
            {(control) => (
              <InputOTP {...control} length={8} validationType="alphanumeric" defaultValue="K7PX" />
            )}
          </Field>
          <Field label="Code" error="That code has expired. Ask for a new one.">
            {(control) => (
              <InputOTP {...control} length={6} defaultValue="381904" aria-invalid />
            )}
          </Field>
          <Field label="Code, disabled">
            {(control) => (
              <InputOTP {...control} length={4} defaultValue="12" disabled />
            )}
          </Field>
        </div>
      </Block>
    </Page>
  );
}

export const TextFields: Story = { render: () => <TextFieldsPage /> };
export const Numbers: Story = { render: () => <NumbersPage /> };
export const Codes: Story = { render: () => <CodesPage /> };
