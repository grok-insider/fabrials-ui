"use client";
// Origin: Fabrials, 0.10. Written for this system with react-day-picker's prop names (mode, selected, onSelect, month,
// disabled, weekStartsOn, numberOfMonths, today), so code written for shadcn's calendar keeps working through the shim.
// Dates are local calendar days: a Date at midnight in the reader's time zone, never a UTC instant.

import { useEffect, useId, useRef, useState, type ComponentProps, type KeyboardEvent, type ReactNode, type Ref } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
import { IconButton } from "./icon-button";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import {
  addDays,
  addMonths,
  compareDays,
  firstDayOfWeek,
  isSameDay,
  matchesDate,
  monthIndex,
  startOfDay,
  startOfMonth,
  toISODate,
  type DateMatcher,
  type DateRange,
} from "./dates";
import { classes } from "./shared";

export { firstDayOfWeek, isSameDay, matchesDate, parseISODate, toISODate, type DateMatcher, type DateRange } from "./dates";

type CalendarCommon = Omit<ComponentProps<"div">, "onSelect" | "defaultValue" | "children"> & {
  /** The month on show (the first one when several are shown). */
  month?: Date;
  defaultMonth?: Date;
  onMonthChange?: (month: Date) => void;
  /** The first and last months people can navigate to. */
  startMonth?: Date;
  endMonth?: Date;
  /** Days that cannot be chosen: a date, dates, `{ before }`, `{ after }`, `{ from, to }`, `{ dayOfWeek }` or a test. */
  disabled?: DateMatcher | DateMatcher[];
  /** A single date cannot be unselected by choosing it again. */
  required?: boolean;
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  /** A BCP 47 locale for month and weekday names. Pass it when the page is rendered on the server. */
  locale?: string;
  numberOfMonths?: number;
  showOutsideDays?: boolean;
  /** Today, for tests and for a host in another time zone. */
  today?: Date;
  /** Focus the active day when the calendar mounts. */
  autoFocus?: boolean;
  previousMonthLabel?: string;
  nextMonthLabel?: string;
};

type SingleSelection = {
  mode?: "single";
  selected?: Date | undefined;
  defaultSelected?: Date;
  onSelect?: (date: Date | undefined, day: Date) => void;
};
type RangeSelection = {
  mode: "range";
  selected?: DateRange | undefined;
  defaultSelected?: DateRange;
  onSelect?: (range: DateRange | undefined, day: Date) => void;
};

export type CalendarProps = CalendarCommon & (SingleSelection | RangeSelection);

/** One day of the grid. Exported under shadcn's name; the calendar renders it for every day. */
export function CalendarDayButton({ className, ...props }: ComponentProps<"button">) {
  return <button type="button" data-slot="calendar-day" className={classes("fui-calendar-day", className)} {...props} />;
}

function nextRange(range: DateRange | undefined, day: Date): DateRange {
  if (!range?.from || range.to) return { from: day, to: undefined };
  return compareDays(day, range.from) < 0 ? { from: day, to: range.from } : { from: range.from, to: day };
}

/**
 * A month grid for picking a date or a range. Arrows move a day or a week, Home and End go to the week's ends, Page Up
 * and Page Down change the month (with Shift, the year), Enter or Space chooses. Six weeks are always drawn, so the
 * grid never changes height as the months go by.
 */
export function Calendar(props: CalendarProps) {
  const {
    mode = "single",
    selected,
    defaultSelected,
    onSelect,
    month,
    defaultMonth,
    onMonthChange,
    startMonth,
    endMonth,
    disabled,
    required = false,
    weekStartsOn,
    locale,
    numberOfMonths = 1,
    showOutsideDays = true,
    today: todayProp,
    autoFocus = false,
    previousMonthLabel = "Previous month",
    nextMonthLabel = "Next month",
    className,
    ref,
    ...rest
  } = props;
  const range = mode === "range";
  const today = startOfDay(todayProp ?? new Date());
  const [ownSelection, setOwnSelection] = useState<Date | DateRange | undefined>(defaultSelected);
  const selection = selected !== undefined || "selected" in props ? selected : ownSelection;
  const single = !range ? (selection as Date | undefined) : undefined;
  const span = range ? (selection as DateRange | undefined) : undefined;
  const anchor = single ?? span?.from ?? today;
  const [ownMonth, setOwnMonth] = useState(() => startOfMonth(defaultMonth ?? anchor));
  const shown = startOfMonth(month ?? ownMonth);
  const [focused, setFocused] = useState<Date>(() => startOfDay(anchor));
  const [hovered, setHovered] = useState<Date | undefined>();
  const moved = useRef(autoFocus);
  const root = useRef<HTMLDivElement | null>(null);
  const id = useId();
  const firstWeekday = weekStartsOn ?? firstDayOfWeek(locale);

  const lastShown = addMonths(shown, numberOfMonths - 1);
  const canGoBack = !startMonth || monthIndex(shown) > monthIndex(startMonth);
  const canGoForward = !endMonth || monthIndex(lastShown) < monthIndex(endMonth);
  const setMonth = (next: Date) => {
    let target = startOfMonth(next);
    if (startMonth && monthIndex(target) < monthIndex(startMonth)) target = startOfMonth(startMonth);
    if (endMonth && monthIndex(target) + numberOfMonths - 1 > monthIndex(endMonth)) target = addMonths(startOfMonth(endMonth), -(numberOfMonths - 1));
    if (month === undefined) setOwnMonth(target);
    if (monthIndex(target) !== monthIndex(shown)) onMonthChange?.(target);
  };
  const isDisabled = (date: Date) =>
    matchesDate(date, disabled) ||
    (!!startMonth && monthIndex(date) < monthIndex(startMonth)) ||
    (!!endMonth && monthIndex(date) > monthIndex(endMonth));

  // The day that holds the tab stop: the focused day while it is on show, else the selection, today or the 1st.
  const visible = (date: Date) => monthIndex(date) >= monthIndex(shown) && monthIndex(date) <= monthIndex(lastShown);
  const tabStop = visible(focused) ? focused : [single, span?.from, today].find((date) => date && visible(date)) ?? shown;

  useEffect(() => {
    if (!moved.current) return;
    moved.current = false;
    root.current?.querySelector<HTMLButtonElement>(`[data-day="${toISODate(tabStop)}"]:not([data-outside])`)?.focus();
  });

  const choose = (day: Date) => {
    if (isDisabled(day)) return;
    setFocused(day);
    if (!visible(day)) setMonth(monthIndex(day) < monthIndex(shown) ? day : addMonths(day, -(numberOfMonths - 1)));
    if (range) {
      const next = nextRange(span, day);
      if (selected === undefined && !("selected" in props)) setOwnSelection(next);
      (onSelect as RangeSelection["onSelect"])?.(next, day);
    } else {
      const next = isSameDay(single, day) && !required ? undefined : day;
      if (selected === undefined && !("selected" in props)) setOwnSelection(next);
      (onSelect as SingleSelection["onSelect"])?.(next, day);
    }
  };

  const move = (event: KeyboardEvent<HTMLElement>) => {
    const from = tabStop;
    const weekday = (from.getDay() - firstWeekday + 7) % 7;
    const steps: Record<string, () => Date> = {
      ArrowLeft: () => addDays(from, getComputedStyle(event.currentTarget).direction === "rtl" ? 1 : -1),
      ArrowRight: () => addDays(from, getComputedStyle(event.currentTarget).direction === "rtl" ? -1 : 1),
      ArrowUp: () => addDays(from, -7),
      ArrowDown: () => addDays(from, 7),
      Home: () => addDays(from, -weekday),
      End: () => addDays(from, 6 - weekday),
      PageUp: () => addMonths(from, event.shiftKey ? -12 : -1),
      PageDown: () => addMonths(from, event.shiftKey ? 12 : 1),
    };
    const step = steps[event.key];
    if (!step) return;
    event.preventDefault();
    let next = step();
    if (startMonth && monthIndex(next) < monthIndex(startMonth)) next = startOfMonth(startMonth);
    if (endMonth && monthIndex(next) > monthIndex(endMonth)) next = new Date(endMonth.getFullYear(), endMonth.getMonth() + 1, 0);
    moved.current = true;
    setFocused(next);
    if (!visible(next)) setMonth(monthIndex(next) < monthIndex(shown) ? next : addMonths(next, -(numberOfMonths - 1)));
  };

  const caption = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" });
  const full = new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  // Short names unless the locale's are long words (Arabic, Hebrew): then the narrow letter, with the full name as abbr.
  const short = new Intl.DateTimeFormat(locale, { weekday: "short" });
  const weekdayShort = [0, 1, 2, 3, 4, 5, 6].some((day) => short.format(new Date(2023, 0, 1 + day)).length > 4)
    ? new Intl.DateTimeFormat(locale, { weekday: "narrow" })
    : short;
  const weekdayLong = new Intl.DateTimeFormat(locale, { weekday: "long" });
  const dayNumber = new Intl.DateTimeFormat(locale, { day: "numeric" });
  // 2023-01-01 is a Sunday: day i of that week is weekday i.
  const weekdays = Array.from({ length: 7 }, (_, index) => new Date(2023, 0, 1 + ((firstWeekday + index) % 7)));
  const preview = range && span?.from && !span.to && hovered && !isSameDay(hovered, span.from) ? nextRange(span, hovered) : undefined;
  const shownRange = preview ?? span;

  return (
    <div
      {...rest}
      ref={(node) => {
        root.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      }}
      data-slot="calendar"
      data-mode={mode}
      data-range={range && shownRange?.from ? (shownRange.to ? "complete" : "partial") : undefined}
      data-preview={preview ? "" : undefined}
      className={classes("fui-calendar", className)}
      onMouseLeave={() => setHovered(undefined)}
    >
      <div className="fui-calendar-nav">
        <IconButton size="icon-sm" label={previousMonthLabel} tooltip={false} disabled={!canGoBack} onClick={() => setMonth(addMonths(shown, -1))}>
          <ChevronLeft aria-hidden="true" className="fui-calendar-chevron" />
        </IconButton>
        <IconButton size="icon-sm" label={nextMonthLabel} tooltip={false} disabled={!canGoForward} onClick={() => setMonth(addMonths(shown, 1))}>
          <ChevronRight aria-hidden="true" className="fui-calendar-chevron" />
        </IconButton>
      </div>
      <div className="fui-calendar-months">
        {Array.from({ length: numberOfMonths }, (_, offset) => {
          const current = addMonths(shown, offset);
          const first = startOfMonth(current);
          const lead = (first.getDay() - firstWeekday + 7) % 7;
          const days = Array.from({ length: 42 }, (_, index) => addDays(first, index - lead));
          const captionId = `${id}-caption-${offset}`;
          return (
            <div key={offset} className="fui-calendar-month">
              <div className="fui-calendar-caption" id={captionId} aria-live="polite">
                {caption.format(first)}
              </div>
              <table role="grid" aria-labelledby={captionId} className="fui-calendar-grid" onKeyDown={move}>
                <thead>
                  <tr>
                    {weekdays.map((weekday) => (
                      <th key={weekday.getDay()} scope="col" abbr={weekdayLong.format(weekday)}>
                        {weekdayShort.format(weekday)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 6 }, (_, week) => (
                    <tr key={week}>
                      {days.slice(week * 7, week * 7 + 7).map((day) => {
                        const outside = day.getMonth() !== first.getMonth();
                        if (outside && !showOutsideDays) return <td key={day.getTime()} role="presentation" />;
                        const off = isDisabled(day);
                        // With several months the neighbours' days appear twice: only their own month marks the range.
                        const marked = !outside || numberOfMonths === 1 ? shownRange : undefined;
                        const start = !!marked?.from && isSameDay(day, marked.from);
                        const end = !!marked?.to && isSameDay(day, marked.to);
                        const between = !!marked?.from && !!marked.to && compareDays(day, marked.from) > 0 && compareDays(day, marked.to) < 0;
                        const own = !outside || numberOfMonths === 1;
                        const endpoint = own && (range ? isSameDay(day, span?.from) || isSameDay(day, span?.to) : isSameDay(day, single));
                        const chosen =
                          endpoint || (own && range && !!span?.from && !!span.to && compareDays(day, span.from) > 0 && compareDays(day, span.to) < 0);
                        const stop = !outside && isSameDay(day, tabStop);
                        return (
                          <td key={day.getTime()} aria-selected={chosen || undefined} data-outside={outside ? "" : undefined}>
                            <CalendarDayButton
                              data-day={toISODate(day)}
                              data-outside={outside ? "" : undefined}
                              data-today={isSameDay(day, today) ? "" : undefined}
                              data-selected={endpoint ? "" : undefined}
                              data-range-start={range && start ? "" : undefined}
                              data-range-end={range && end ? "" : undefined}
                              data-range-middle={range && between ? "" : undefined}
                              data-disabled={off ? "" : undefined}
                              aria-disabled={off || undefined}
                              aria-current={isSameDay(day, today) ? "date" : undefined}
                              aria-label={full.format(day)}
                              tabIndex={stop ? 0 : -1}
                              onClick={() => choose(day)}
                              onFocus={() => {
                                if (!outside) setFocused(day);
                                if (range) setHovered(day);
                              }}
                              onMouseEnter={() => range && setHovered(day)}
                            >
                              {dayNumber.format(day)}
                            </CalendarDayButton>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    </div>
  );
}

type PickerCalendarProps = Pick<CalendarCommon, "startMonth" | "endMonth" | "weekStartsOn" | "today" | "numberOfMonths" | "showOutsideDays">;

type PickerBase = PickerCalendarProps & {
  /** Days that cannot be chosen (the calendar's `disabled` matcher). */
  disabledDates?: DateMatcher | DateMatcher[];
  placeholder?: string;
  locale?: string;
  /** How the chosen date is written on the trigger. */
  format?: Intl.DateTimeFormatOptions;
  /** Posts the value as `yyyy-mm-dd` (a range posts `name` and `name` + "End"). */
  name?: string;
  id?: string;
  disabled?: boolean;
  /** Adds a clear button while something is chosen. */
  clearable?: boolean;
  clearLabel?: string;
  className?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
  /** Marks the field invalid (a hairline in the danger ink); say why with `aria-describedby`. */
  "aria-invalid"?: boolean | "true" | "false";
  ref?: Ref<HTMLButtonElement>;
};

function PickerShell({
  text,
  empty,
  onClear,
  clearable,
  clearLabel,
  disabled,
  invalid,
  id,
  className,
  calendar,
  open,
  setOpen,
  hidden,
  trigger,
}: {
  text: ReactNode;
  empty: boolean;
  onClear: () => void;
  clearable: boolean;
  clearLabel: string;
  disabled?: boolean;
  invalid?: boolean | "true" | "false";
  id?: string;
  className?: string;
  calendar: (close: () => void, root: Ref<HTMLDivElement>) => ReactNode;
  open: boolean;
  setOpen: (open: boolean) => void;
  hidden: ReactNode;
  trigger: Omit<ComponentProps<"button">, "children">;
}) {
  const calendarRoot = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  return (
    <div
      className={classes("fui-date-picker", className)}
      data-empty={empty ? "" : undefined}
      data-disabled={disabled ? "" : undefined}
      data-invalid={invalid === true || invalid === "true" ? "" : undefined}
    >
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <button
              {...trigger}
              ref={(node) => {
                triggerRef.current = node;
                const ref = trigger.ref;
                if (typeof ref === "function") ref(node);
                else if (ref) ref.current = node;
              }}
              type="button"
              id={id}
              disabled={disabled}
              className="fui-input fui-date-picker-trigger"
            />
          }
        >
          <CalendarDays aria-hidden="true" className="fui-date-picker-icon" />
          <span className="fui-date-picker-value">{text}</span>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="fui-date-picker-popover"
          initialFocus={() => calendarRoot.current?.querySelector<HTMLElement>('[data-slot="calendar-day"][tabindex="0"]') ?? true}
        >
          {calendar(() => setOpen(false), calendarRoot)}
        </PopoverContent>
      </Popover>
      {clearable && !empty && !disabled ? (
        <IconButton
          type="button"
          size="icon-sm"
          label={clearLabel}
          tooltip={false}
          data-hit="end"
          className="fui-date-picker-clear"
          onClick={() => {
            onClear();
            triggerRef.current?.focus();
          }}
        >
          <X aria-hidden="true" />
        </IconButton>
      ) : null}
      {hidden}
    </div>
  );
}

export type DatePickerProps = PickerBase & {
  value?: Date | null;
  defaultValue?: Date | null;
  onValueChange?: (date: Date | null) => void;
};

/**
 * A date field that opens a calendar. The trigger is a button that reads the date (or the placeholder); choosing a
 * day closes the calendar and returns focus to it. With `name`, the date posts as `yyyy-mm-dd`.
 */
export function DatePicker({
  value,
  defaultValue = null,
  onValueChange,
  placeholder = "Pick a date",
  locale,
  format = { dateStyle: "medium" },
  name,
  id,
  disabled,
  clearable = false,
  clearLabel = "Clear date",
  className,
  disabledDates,
  ref,
  startMonth,
  endMonth,
  weekStartsOn,
  today,
  numberOfMonths,
  showOutsideDays,
  "aria-invalid": invalid,
  ...aria
}: DatePickerProps) {
  const [own, setOwn] = useState<Date | null>(defaultValue);
  const [open, setOpen] = useState(false);
  const date = value !== undefined ? value : own;
  const set = (next: Date | null) => {
    if (value === undefined) setOwn(next);
    onValueChange?.(next);
  };
  return (
    <PickerShell
      text={date ? new Intl.DateTimeFormat(locale, format).format(date) : placeholder}
      empty={!date}
      onClear={() => set(null)}
      clearable={clearable}
      clearLabel={clearLabel}
      disabled={disabled}
      invalid={invalid}
      id={id}
      className={className}
      open={open}
      setOpen={setOpen}
      trigger={{ ...aria, ref }}
      hidden={name ? <input type="hidden" name={name} value={date ? toISODate(date) : ""} /> : null}
      calendar={(close, root) => (
        <Calendar
          ref={root}
          mode="single"
          selected={date ?? undefined}
          required
          onSelect={(next) => {
            if (!next) return;
            set(next);
            close();
          }}
          disabled={disabledDates}
          locale={locale}
          startMonth={startMonth}
          endMonth={endMonth}
          weekStartsOn={weekStartsOn}
          today={today}
          numberOfMonths={numberOfMonths}
          showOutsideDays={showOutsideDays}
        />
      )}
    />
  );
}

export type DateRangePickerProps = PickerBase & {
  value?: DateRange | null;
  defaultValue?: DateRange | null;
  onValueChange?: (range: DateRange | null) => void;
};

/** Two dates in one field: the first choice starts the range, the second ends it and closes the calendar. */
export function DateRangePicker({
  value,
  defaultValue = null,
  onValueChange,
  placeholder = "Pick dates",
  locale,
  format = { dateStyle: "medium" },
  name,
  id,
  disabled,
  clearable = false,
  clearLabel = "Clear dates",
  className,
  disabledDates,
  ref,
  numberOfMonths = 2,
  startMonth,
  endMonth,
  weekStartsOn,
  today,
  showOutsideDays,
  "aria-invalid": invalid,
  ...aria
}: DateRangePickerProps) {
  const [own, setOwn] = useState<DateRange | null>(defaultValue);
  const [open, setOpen] = useState(false);
  const range = value !== undefined ? value : own;
  const set = (next: DateRange | null) => {
    if (value === undefined) setOwn(next);
    onValueChange?.(next);
  };
  const formatter = new Intl.DateTimeFormat(locale, format);
  const text = range?.from ? (range.to ? formatter.formatRange(range.from, range.to) : `${formatter.format(range.from)} –`) : placeholder;
  return (
    <PickerShell
      text={text}
      empty={!range?.from}
      onClear={() => set(null)}
      clearable={clearable}
      clearLabel={clearLabel}
      disabled={disabled}
      invalid={invalid}
      id={id}
      className={className}
      open={open}
      setOpen={setOpen}
      trigger={{ ...aria, ref }}
      hidden={
        name ? (
          <>
            <input type="hidden" name={name} value={range?.from ? toISODate(range.from) : ""} />
            <input type="hidden" name={`${name}End`} value={range?.to ? toISODate(range.to) : ""} />
          </>
        ) : null
      }
      calendar={(close, root) => (
        <Calendar
          ref={root}
          mode="range"
          selected={range ?? undefined}
          onSelect={(next) => {
            set(next ?? null);
            if (next?.from && next.to) close();
          }}
          disabled={disabledDates}
          locale={locale}
          numberOfMonths={numberOfMonths}
          startMonth={startMonth}
          endMonth={endMonth}
          weekStartsOn={weekStartsOn}
          today={today}
          showOutsideDays={showOutsideDays}
        />
      )}
    />
  );
}
