// Origin: Fabrials, 2026-09-22. A flat shortcut hint, not the Spectrum 3D keycap.
import { Children, Fragment, type ComponentProps, type ReactNode } from "react";
import { classes } from "./shared";
import { ModifierKeyText } from "./use-modifier-key";

export function Kbd({
  className,
  mod = false,
  children,
  ...props
}: ComponentProps<"kbd"> & {
  /** Print the main modifier of this device ("Ctrl", or "⌘" on Apple after hydration) instead of `children`. */
  mod?: boolean;
}) {
  return (
    <kbd className={classes("fui-kbd", className)} {...props}>
      {mod ? <ModifierKeyText /> : children}
    </kbd>
  );
}

/**
 * Keys pressed together, e.g. Ctrl + K. With `sequence` the keys are pressed one after the other: the group puts the
 * `separator` word between them, muted ("G then I"). The word is a prop because it is copy a product translates.
 */
export function KbdGroup({
  className,
  sequence = false,
  separator = "then",
  children,
  ...props
}: ComponentProps<"kbd"> & {
  sequence?: boolean;
  separator?: ReactNode;
}) {
  const keys = sequence ? Children.toArray(children) : null;
  return (
    <kbd className={classes("fui-kbd-group", className)} data-sequence={sequence || undefined} {...props}>
      {keys
        ? keys.map((key, index) => (
            <Fragment key={index}>
              {index > 0 ? <span className="fui-kbd-separator">{separator}</span> : null}
              {key}
            </Fragment>
          ))
        : children}
    </kbd>
  );
}
