"use client";
// Origin: Fabrials, 0.10, on Base UI's Slider. shadcn's name (`Slider`), so a shim covers it.

import { Slider as BaseSlider } from "@base-ui/react/slider";
import type { CSSProperties, ReactNode } from "react";
import { classes, type StyledProps } from "./shared";

export type SliderMark = number | { value: number; label?: ReactNode };

export type SliderProps = StyledProps<BaseSlider.Root.Props> & {
  /** Names a single thumb when there is no visible label. */
  "aria-label"?: string;
  "aria-labelledby"?: string;
  /** One name per thumb of a range ("Minimum price", "Maximum price"). */
  thumbLabels?: string[];
  /** What a screen reader says for a value ("3 of 5 stars"); the formatted value by default. */
  getAriaValueText?: (formattedValue: string, value: number, index: number) => string;
  /** Ruler ticks under a horizontal track, each optionally labelled in the label voice. A vertical slider draws none. */
  marks?: SliderMark[];
  /** The formatted value at the end of the slider, in the label voice (a range reads "20 – 80"). */
  showValue?: boolean;
};

function thumbCount(value: BaseSlider.Root.Props["value"], defaultValue: BaseSlider.Root.Props["defaultValue"]) {
  const current = value ?? defaultValue;
  return Array.isArray(current) ? Math.max(current.length, 1) : 1;
}

/**
 * A value on a track: a sunken well, a Stormlight fill and a raised fader cap per thumb. The keyboard is Base UI's:
 * arrows step, Shift+arrows and Page Up/Down step by `largeStep`, Home/End go to the ends. Give it a single value or
 * an array for a range.
 */
export function Slider({
  className,
  value,
  defaultValue,
  min = 0,
  max = 100,
  orientation = "horizontal",
  "aria-label": ariaLabel,
  "aria-labelledby": labelledBy,
  thumbLabels,
  getAriaValueText,
  marks,
  showValue = false,
  ...props
}: SliderProps) {
  const count = thumbCount(value, defaultValue);
  const span = max - min || 1;
  const ruler = orientation === "horizontal" && !!marks?.length;
  return (
    <BaseSlider.Root
      {...props}
      value={value}
      defaultValue={defaultValue}
      min={min}
      max={max}
      orientation={orientation}
      className={classes("fui-slider", className)}
      data-marks={ruler ? "" : undefined}
    >
      <BaseSlider.Control className="fui-slider-control">
        <BaseSlider.Track className="fui-slider-track">
          <BaseSlider.Indicator className="fui-slider-indicator" />
          {Array.from({ length: count }, (_, index) => (
            <BaseSlider.Thumb
              key={index}
              index={count > 1 ? index : undefined}
              className="fui-slider-thumb"
              aria-label={count > 1 ? thumbLabels?.[index] : ariaLabel}
              aria-labelledby={count > 1 ? undefined : labelledBy}
              getAriaValueText={getAriaValueText}
            />
          ))}
        </BaseSlider.Track>
        {ruler ? (
          <span className="fui-slider-marks" aria-hidden="true">
            {marks!.map((mark) => {
              const at = typeof mark === "number" ? mark : mark.value;
              const label = typeof mark === "number" ? undefined : mark.label;
              const offset = `${((Math.min(max, Math.max(min, at)) - min) / span) * 100}%`;
              return (
                <span
                  key={at}
                  className="fui-slider-mark"
                  data-labelled={label !== undefined ? "" : undefined}
                  data-edge={at <= min ? "start" : at >= max ? "end" : undefined}
                  style={{ "--fui-slider-mark": offset } as CSSProperties}
                >
                  {label !== undefined ? <span className="fui-slider-mark-label">{label}</span> : null}
                </span>
              );
            })}
          </span>
        ) : null}
      </BaseSlider.Control>
      {showValue ? (
        <BaseSlider.Value className="fui-slider-value">{(formatted) => formatted.join(" – ")}</BaseSlider.Value>
      ) : null}
    </BaseSlider.Root>
  );
}
