import type { ComponentProps } from "react";
import { classes } from "./shared";

/**
 * The working light: a band of light that turns along the edge of the surface it sits in, with a soft bloom outside it. It is
 * the only light in the system and it is shown only while an agent works or something loads; render it only then. It is
 * decorative: say the state in words as well (a status, a label). Put it last inside a positioned surface; it takes the
 * surface's corners. Under reduced motion it is a still edge, and forced colors hide it.
 */
export function WorkingLight({ className, ...props }: Omit<ComponentProps<"span">, "children">) {
  return (
    <span aria-hidden="true" data-slot="working-light" className={classes("fui-working-light", className)} {...props}>
      <span className="fui-working-light-bloom" />
    </span>
  );
}
