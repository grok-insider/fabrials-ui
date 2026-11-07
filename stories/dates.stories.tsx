import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Calendar, DatePicker, DateRangePicker, Field, type DateRange } from "@fabrials/ui";
import { Block, Frame, Page } from "./story-frame";

const meta = {
  title: "Tests/Dates",
  parameters: { layout: "fullscreen" },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const TODAY = new Date(2026, 10, 5);
const grid = { display: "grid", alignItems: "start", gap: "var(--fui-space-4)", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 16rem), 1fr))" } as const;

function CalendarsPage() {
  const [day, setDay] = useState<Date | undefined>(new Date(2026, 10, 12));
  const [stay, setStay] = useState<DateRange | undefined>({ from: new Date(2026, 10, 9), to: new Date(2026, 10, 18) });
  return (
    <Page
      title="Calendars"
      description="Six weeks in mono numerals. Today is a Stormlight tick, the chosen day a Stormlight key, a range a light band between two keys. Arrows, Page Up and Page Down move; Enter chooses."
    >
      <Block title="One date" description="Weekends are off in the second one; the arrows still pass over them.">
        <div className="catalogue-row" style={{ alignItems: "start" }}>
          <Frame width={312}>
            <Calendar mode="single" selected={day} onSelect={setDay} today={TODAY} weekStartsOn={1} locale="en-GB" />
          </Frame>
          <Frame width={312}>
            <Calendar mode="single" defaultSelected={new Date(2026, 10, 20)} disabled={[{ dayOfWeek: [0, 6] }, { before: TODAY }]} today={TODAY} weekStartsOn={1} locale="en-GB" />
          </Frame>
        </div>
      </Block>
      <Block title="A range over two months">
        <Frame width={640}>
          <Calendar mode="range" selected={stay} onSelect={setStay} numberOfMonths={2} today={TODAY} weekStartsOn={1} locale="en-GB" />
        </Frame>
      </Block>
      <Block title="Sunday first, and right to left">
        <div className="catalogue-row" style={{ alignItems: "start" }}>
          <Frame width={312}>
            <Calendar mode="single" defaultSelected={new Date(2026, 10, 26)} today={TODAY} weekStartsOn={0} locale="en-US" />
          </Frame>
          <Frame width={312} dir="rtl">
            <Calendar
              mode="single"
              defaultSelected={new Date(2026, 10, 12)}
              today={TODAY}
              weekStartsOn={6}
              locale="ar-u-nu-latn"
              previousMonthLabel="الشهر السابق"
              nextMonthLabel="الشهر التالي"
            />
          </Frame>
        </div>
      </Block>
    </Page>
  );
}

function PickersPage() {
  const [due, setDue] = useState<Date | null>(new Date(2026, 10, 12));
  const [trip, setTrip] = useState<DateRange | null>({ from: new Date(2026, 11, 21), to: new Date(2027, 0, 4) });
  return (
    <Page
      title="Date pickers"
      description="A field that opens a calendar. The trigger reads the date; choosing a day closes the calendar and returns focus to it. With a name, the date posts as yyyy-mm-dd."
    >
      <Block title="One date">
        <div style={grid}>
          <Field label="Due date">
            {(control) => <DatePicker {...control} value={due} onValueChange={setDue} today={TODAY} weekStartsOn={1} locale="en-GB" name="due" clearable />}
          </Field>
          <Field label="Start date" description="Weekdays from today.">
            {(control) => <DatePicker {...control} today={TODAY} weekStartsOn={1} locale="en-GB" disabledDates={[{ dayOfWeek: [0, 6] }, { before: TODAY }]} />}
          </Field>
          <Field label="Renewal" error="Choose a date after the first payment.">
            {(control) => <DatePicker {...control} defaultValue={new Date(2026, 9, 1)} today={TODAY} locale="en-GB" />}
          </Field>
          <Field label="Locked">
            {(control) => <DatePicker {...control} defaultValue={TODAY} locale="en-GB" disabled />}
          </Field>
        </div>
      </Block>
      <Block title="A range">
        <div style={grid}>
          <Field label="Trip">
            {(control) => <DateRangePicker {...control} value={trip} onValueChange={setTrip} today={TODAY} weekStartsOn={1} locale="en-GB" clearable name="trip" />}
          </Field>
          <Field label="Report period">
            {(control) => <DateRangePicker {...control} today={TODAY} weekStartsOn={1} locale="en-GB" />}
          </Field>
        </div>
      </Block>
      <Block title="In a 358 px pane">
        <Frame width={358}>
          <Field label="Due date">{(control) => <DatePicker {...control} defaultValue={new Date(2026, 10, 30)} locale="en-GB" format={{ dateStyle: "full" }} clearable />}</Field>
        </Frame>
      </Block>
    </Page>
  );
}

export const Calendars: Story = { render: () => <CalendarsPage /> };
export const Pickers: Story = { render: () => <PickersPage /> };
