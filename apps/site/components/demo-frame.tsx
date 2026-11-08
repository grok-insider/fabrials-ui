import type { ReactNode } from "react";

/** How wide a preview is: a control at the size it is used at, centred on the stage, or the whole stage. */
export type FrameWidth = "fit" | "field" | "form" | "wide";

/**
 * The layout a preview's code gives its box: scripts/generate-demo-code.ts writes these classes into the code under Code, so
 * the code builds the box the stage shows. The stage's own centring is not part of it.
 */
export const frameLayout = {
  inline: "flex flex-wrap items-center gap-3",
  stack: "grid gap-4",
  widths: {
    fit: "",
    field: "w-full max-w-sm",
    form: "w-full max-w-lg",
    wide: "w-full max-w-2xl",
  } satisfies Record<FrameWidth, string>,
};

const stageWidths: Record<FrameWidth, string> = {
  fit: "mx-auto w-fit max-w-full",
  field: "mx-auto w-full max-w-sm",
  form: "mx-auto w-full max-w-lg",
  wide: "mx-auto w-full max-w-2xl",
};

/**
 * The preview box on a docs page. Stacked and as wide as the stage by default. `width` keeps a control at the width it is
 * used at: `field` for one field (24rem), `form` for a few side by side (32rem), `wide` for a pane (42rem), `fit` for
 * controls that size themselves. `inline` lays controls out in a centred row at their own width.
 */
export function Frame({ children, inline = false, width }: { children: ReactNode; inline?: boolean; width?: FrameWidth }) {
  if (inline) return <div className="fui-preview flex flex-wrap items-center justify-center gap-3">{children}</div>;
  return (
    <div className={`fui-preview grid grid-cols-[minmax(0,1fr)] gap-4${width ? ` ${stageWidths[width]}` : ""}`} data-width={width}>
      {children}
    </div>
  );
}
