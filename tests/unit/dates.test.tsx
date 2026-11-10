import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { Calendar, DatePicker, DateRangePicker, firstDayOfWeek, matchesDate, parseISODate, toISODate } from "@fabrials/ui";

const TODAY = new Date(2026, 10, 5);

test("dates are local calendar days: yyyy-mm-dd both ways, and an impossible date is refused", () => {
  assert.equal(toISODate(new Date(2026, 0, 9)), "2026-01-09");
  assert.equal(parseISODate("2026-11-05")?.getTime(), new Date(2026, 10, 5).getTime());
  assert.equal(parseISODate("2026-02-30"), undefined);
  assert.equal(parseISODate("05/11/2026"), undefined);
});

test("matchers: a date, a list, before, after, an interval, weekdays and a test", () => {
  const day = new Date(2026, 10, 14);
  assert.equal(matchesDate(day, new Date(2026, 10, 14, 18)), true);
  assert.equal(matchesDate(day, [new Date(2026, 10, 1), day]), true);
  assert.equal(matchesDate(day, { before: new Date(2026, 10, 15) }), true);
  assert.equal(matchesDate(day, { before: day }), false);
  assert.equal(matchesDate(day, { after: new Date(2026, 10, 13) }), true);
  assert.equal(matchesDate(day, { from: new Date(2026, 10, 10), to: new Date(2026, 10, 14) }), true);
  assert.equal(matchesDate(day, { dayOfWeek: [0, 6] }), true);
  assert.equal(matchesDate(day, (date) => date.getDate() === 14), true);
  assert.equal(matchesDate(day, undefined), false);
});

test("the week starts where the locale says, English's Sunday without one, Monday when Intl has no data", () => {
  assert.equal(firstDayOfWeek("en-GB"), 1);
  assert.equal(firstDayOfWeek("en-US"), 0);
  // No locale is English's week, whatever the runtime's locale is: a server and a browser draw the same grid.
  assert.equal(firstDayOfWeek(), 0);
  assert.equal(firstDayOfWeek("xx-not-a-locale"), 1);
});

test("a calendar draws six weeks, one tab stop, today as aria-current and the choice as aria-selected", () => {
  const html = renderToStaticMarkup(<Calendar mode="single" selected={new Date(2026, 10, 12)} today={TODAY} weekStartsOn={1} locale="en-GB" />);
  assert.equal(html.match(/data-slot="calendar-day"/g)?.length, 42);
  assert.equal(html.match(/<button[^>]*data-day="[^"]+"[^>]*tabindex="0"/gi)?.length, 1);
  assert.match(html, /<td aria-selected="true"><button[^>]*data-day="2026-11-12"/);
  assert.match(html, /data-day="2026-11-05"[^>]*data-today=""[^>]*aria-current="date"/);
  assert.match(html, /role="grid" aria-labelledby="[^"]+-caption-0"/);
  assert.match(html, /<th scope="col" abbr="Monday">Mon<\/th>/);
  const hidden = renderToStaticMarkup(<Calendar today={TODAY} weekStartsOn={1} showOutsideDays={false} locale="en-GB" />);
  assert.equal(hidden.match(/data-slot="calendar-day"/g)?.length, 30);
});

test("a range marks its ends and the days between; disabled days are aria-disabled", () => {
  const html = renderToStaticMarkup(
    <Calendar
      mode="range"
      selected={{ from: new Date(2026, 10, 9), to: new Date(2026, 10, 12) }}
      disabled={{ dayOfWeek: [0] }}
      today={TODAY}
      weekStartsOn={1}
      locale="en-GB"
    />,
  );
  assert.match(html, /data-range="complete"/);
  assert.match(html, /data-day="2026-11-09"[^>]*data-selected=""[^>]*data-range-start=""/);
  assert.match(html, /data-day="2026-11-12"[^>]*data-selected=""[^>]*data-range-end=""/);
  assert.equal(html.match(/data-range-middle=""/g)?.length, 2);
  assert.match(html, /data-day="2026-11-15"[^>]*data-disabled=""[^>]*aria-disabled="true"/);
});

test("pickers: a field-like trigger, the placeholder while empty, a hidden yyyy-mm-dd for forms", () => {
  const empty = renderToStaticMarkup(<DatePicker aria-label="Due" name="due" />);
  assert.match(empty, /class="fui-input fui-date-picker-trigger"/);
  assert.match(empty, /Pick a date/);
  assert.match(empty, /<input type="hidden" name="due" value=""\/>/);
  assert.match(empty, /data-empty=""/);
  const chosen = renderToStaticMarkup(<DatePicker aria-label="Due" name="due" defaultValue={new Date(2026, 10, 12)} locale="en-GB" clearable aria-invalid />);
  assert.match(chosen, /12 Nov 2026/);
  assert.match(chosen, /value="2026-11-12"/);
  assert.match(chosen, /aria-label="Clear date"/);
  assert.match(chosen, /data-invalid=""/);
  assert.doesNotMatch(chosen, /<button[^>]*aria-invalid/);
  const range = renderToStaticMarkup(<DateRangePicker aria-label="Trip" name="trip" defaultValue={{ from: new Date(2026, 11, 21), to: new Date(2027, 0, 4) }} locale="en-GB" />);
  assert.match(range, /name="trip" value="2026-12-21"/);
  assert.match(range, /name="tripEnd" value="2027-01-04"/);
});
