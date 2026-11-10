"use client";
// Origin: Fabrials, 0.10, on Base UI's Slider. shadcn's name (`Slider`), so a shim covers it.

import { Slider as BaseSlider } from "@base-ui/react/slider";
import { useId, type ComponentProps, type CSSProperties, type ReactNode } from "react";
import { useLocale } from "./labels";
import { formatCount } from "./plural";
import { classes, type StyledProps } from "./shared";

export type SliderMark = number | { value: number; label?: ReactNode };

/** A number written by the host, or `Intl.NumberFormat` options (the slider's own `format` since 0.6). */
export type SliderFormat = ((value: number) => string) | Intl.NumberFormatOptions;

export type SliderProps = Omit<StyledProps<BaseSlider.Root.Props>, "format"> & {
  /** Names a single thumb when there is no visible label. */
  "aria-label"?: string;
  "aria-labelledby"?: string;
  /** One name per thumb of a range ("Minimum price", "Maximum price"). */
  thumbLabels?: string[];
  /** What a screen reader says for a value ("3 of 5 stars"); the formatted value, with the unit, by default. */
  getAriaValueText?: (formattedValue: string, value: number, index: number) => string;
  /** Ruler ticks under a horizontal track, each optionally labelled in the label voice. A vertical slider draws none. */
  marks?: SliderMark[];
  /** The formatted value at the end of the slider, in the label voice (a range reads "20 – 80"). */
  showValue?: boolean;
  /** The name in front of the track: with it the slider is a row of label · track · value. */
  label?: ReactNode;
  /** Said and written after the value: "%", "ms", "GB". */
  unit?: string;
  /** How a value is written: a function, or `Intl.NumberFormat` options. By default the digits follow `step` (0.25 → 0.25). */
  format?: SliderFormat;
  /** Called when a drag ends or a key is released: once per change, not once per pixel. */
  onValueCommitted?: BaseSlider.Root.Props["onValueCommitted"];
};

function thumbCount(value: BaseSlider.Root.Props["value"], defaultValue: BaseSlider.Root.Props["defaultValue"]) {
  const current = value ?? defaultValue;
  return Array.isArray(current) ? Math.max(current.length, 1) : 1;
}

/** How many decimals a step needs: 1 → none, 0.1 → one, 0.25 → two. What the value is written with unless `format` says. */
export function sliderDecimals(step: number): number {
  if (!Number.isFinite(step) || step <= 0) return 0;
  let decimals = 0;
  let value = step;
  while (decimals < 6 && Math.abs(Math.round(value) - value) > 1e-9) {
    value *= 10;
    decimals += 1;
  }
  return decimals;
}

/**
 * A value on a track: a sunken well, a Stormlight fill and a raised fader cap per thumb. The keyboard is Base UI's:
 * arrows step, Shift+arrows and Page Up/Down step by `largeStep`, Home/End go to the ends. Give it a single value or
 * an array for a range. A `label` turns it into a row — the name, the track, then the value and its unit in the label
 * voice — and the value a screen reader hears carries the unit too.
 */
export function Slider({
  className,
  value,
  defaultValue,
  min = 0,
  max = 100,
  step,
  orientation = "horizontal",
  "aria-label": ariaLabel,
  "aria-labelledby": labelledBy,
  thumbLabels,
  getAriaValueText,
  marks,
  showValue = false,
  label,
  unit,
  format,
  locale: ownLocale,
  onValueCommitted,
  ...props
}: SliderProps) {
  const count = thumbCount(value, defaultValue);
  const span = max - min || 1;
  const ruler = orientation === "horizontal" && !!marks?.length;
  const locale = useLocale(ownLocale);
  const generated = useId();
  const named = label !== undefined;
  const write = typeof format === "function" ? format : undefined;
  const decimals = sliderDecimals(step ?? 1);
  const formatOptions = typeof format === "object" ? format : named && !write ? { minimumFractionDigits: decimals, maximumFractionDigits: decimals } : undefined;
  const labelId = named ? `${generated}-label` : undefined;
  const spoken =
    getAriaValueText ??
    (write || unit
      ? (formattedValue: string, current: number) => {
          const text = write ? write(current) : formattedValue;
          return unit ? `${text} ${unit}` : text;
        }
      : undefined);
  return (
    <BaseSlider.Root
      {...props}
      value={value}
      defaultValue={defaultValue}
      min={min}
      max={max}
      step={step}
      locale={ownLocale}
      format={formatOptions}
      orientation={orientation}
      onValueCommitted={onValueCommitted}
      className={classes("fui-slider", className)}
      data-marks={ruler ? "" : undefined}
      data-label={named ? "" : undefined}
    >
      {named ? (
        <span className="fui-slider-label" id={labelId}>
          {label}
        </span>
      ) : null}
      <BaseSlider.Control className="fui-slider-control">
        <BaseSlider.Track className="fui-slider-track">
          <BaseSlider.Indicator className="fui-slider-indicator" />
          {Array.from({ length: count }, (_, index) => (
            <BaseSlider.Thumb
              key={index}
              index={count > 1 ? index : undefined}
              className="fui-slider-thumb"
              aria-label={count > 1 ? thumbLabels?.[index] : ariaLabel}
              aria-labelledby={count > 1 ? undefined : (labelledBy ?? labelId)}
              getAriaValueText={spoken}
            />
          ))}
        </BaseSlider.Track>
        {ruler ? (
          <span className="fui-slider-marks" aria-hidden="true">
            {marks!.map((mark) => {
              const at = typeof mark === "number" ? mark : mark.value;
              const markLabel = typeof mark === "number" ? undefined : mark.label;
              const offset = `${((Math.min(max, Math.max(min, at)) - min) / span) * 100}%`;
              return (
                <span
                  key={at}
                  className="fui-slider-mark"
                  data-labelled={markLabel !== undefined ? "" : undefined}
                  data-edge={at <= min ? "start" : at >= max ? "end" : undefined}
                  style={{ "--fui-slider-mark": offset } as CSSProperties}
                >
                  {markLabel !== undefined ? <span className="fui-slider-mark-label">{markLabel}</span> : null}
                </span>
              );
            })}
          </span>
        ) : null}
      </BaseSlider.Control>
      {showValue || named ? (
        // The value is decoration to a screen reader: the thumb already says it, with the unit.
        <BaseSlider.Value className="fui-slider-value" aria-hidden={named || undefined}>
          {(formatted, values) =>
            values
              .map((current, index) => {
                const text = write ? write(current) : (formatted[index] ?? formatCount(current, locale));
                return unit ? `${text} ${unit}` : text;
              })
              .join(" – ")
          }
        </BaseSlider.Value>
      ) : null}
    </BaseSlider.Root>
  );
}

export type SliderGroupProps = Omit<ComponentProps<"div">, "children"> & {
  /** The sliders of the group. Their labels and their values line up, column by column. */
  children?: ReactNode;
  /**
   * `auto` lays the sliders out in as many columns of at least 14rem as fit; the default stacks them in one column. Either
   * way one column of the group's own width under 28rem puts each name above its track.
   */
  columns?: "auto";
};

/**
 * A set of sliders whose names and values line up (one grid, each slider a subgrid row), so a panel of numbers reads as a
 * table. Under 28rem of its own width each row becomes a name with its track under it, and `columns="auto"` fills the room
 * it has.
 */
export function SliderGroup({ children, columns, className, ...props }: SliderGroupProps) {
  return (
    <div className={classes("fui-slider-group-wrap", className)}>
      <div className="fui-slider-group" data-columns={columns} {...props}>
        {children}
      </div>
    </div>
  );
}
