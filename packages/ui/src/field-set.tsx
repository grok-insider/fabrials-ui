// Origin: Fabrials, 0.8. Grouped form fields on native fieldsets (shadcn's Field family names).
import type { ComponentProps, ReactNode } from "react";
import { classes } from "./shared";

/**
 * A group of related fields: a real `fieldset`, so a screen reader announces the legend and `disabled`
 * disables every native control inside it (Base UI checkboxes, switches and radios are spans and are not
 * covered: disable those yourself). It never overflows its column: `min-inline-size` is 0, where a bare
 * fieldset sizes to its widest child.
 */
export function FieldSet({ className, ...props }: ComponentProps<"fieldset">) {
  return <fieldset data-slot="field-set" className={classes("fui-fieldset", className)} {...props} />;
}

/**
 * The name of a `FieldSet`. `variant="title"` is a subsection title (16 px, semibold), `"label"` a small group
 * name (14 px, medium). The hairline above (`divider`, on by default) is drawn on the legend itself, because a
 * fieldset's own border would run through the legend's text, and it is left out when the fieldset is the first
 * child of its container. Hide a legend the design does not show with `className="fui-sr-only"`, never `hidden`.
 */
export function FieldLegend({
  className,
  variant = "title",
  divider = true,
  ...props
}: ComponentProps<"legend"> & { variant?: "title" | "label"; divider?: boolean }) {
  return (
    <legend
      data-slot="field-legend"
      data-variant={variant}
      data-divider={divider ? "" : undefined}
      className={classes("fui-field-legend", className)}
      {...props}
    />
  );
}

/**
 * Fields laid out with the house gap. `layout="columns"` flows them into as many columns of at least 15rem as
 * the container has room for (a container, not the window: it works in a narrow pane and a wide dialog alike).
 */
export function FieldGroup({
  className,
  layout = "stack",
  ...props
}: ComponentProps<"div"> & { layout?: "stack" | "columns" }) {
  return <div data-slot="field-group" data-layout={layout} className={classes("fui-field-group", className)} {...props} />;
}

/**
 * A group of native radios sharing one `name`: a fieldset with its legend, mirroring `NativeSelect` and
 * `NativeCheckbox`. A disabled fieldset disables every radio. The arrow keys move within the group natively.
 * `layout="grid"` flows the options into columns of at least `--fui-native-radio-min` (9rem unless you set it on the group,
 * radio and gap included) and never wider than the group, so a narrow pane gets fewer columns instead of crushed labels.
 * Long names: `style={{ "--fui-native-radio-min": "12rem" }}` (swatch and colour pickers).
 */
export function NativeRadioGroup({
  legend,
  hideLegend = false,
  layout = "stack",
  className,
  children,
  ...props
}: Omit<ComponentProps<"fieldset">, "children"> & {
  legend: ReactNode;
  hideLegend?: boolean;
  layout?: "stack" | "grid";
  children: ReactNode;
}) {
  return (
    <FieldSet data-slot="native-radio-group" className={classes("fui-native-radio-group", className)} {...props}>
      <FieldLegend variant="label" divider={false} className={hideLegend ? "fui-sr-only" : undefined}>
        {legend}
      </FieldLegend>
      <div className="fui-native-radio-options" data-layout={layout}>
        {children}
      </div>
    </FieldSet>
  );
}
