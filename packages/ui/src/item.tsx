"use client";
// Origin: Fabrials, 0.8 (promoted from Open Email's record rows). Part names follow shadcn's Item.

import { createContext, useContext, type ComponentProps } from "react";
import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { classes } from "./shared";

/** Data attributes and class as one loosely typed bag: Base UI's prop types do not list `data-*`. */
const attrs = (value: Record<string, string | boolean | undefined>) => value as never;

const InsideGroup = createContext(false);

/**
 * A list of records: a `ul` with no bullets and no padding. It is the size container the rows answer to
 * (`@container fui-item-group`), so a row in a narrow pane and a row in a wide one use the same markup.
 * `bordered` adds a hairline above the first row; every row carries its own hairline below, so the list is
 * closed at the bottom without doubling.
 */
export function ItemGroup({ className, bordered = false, ...props }: ComponentProps<"ul"> & { bordered?: boolean }) {
  return (
    <InsideGroup.Provider value>
      <ul data-slot="item-group" data-bordered={bordered ? "" : undefined} className={classes("fui-item-group", className)} {...props} />
    </InsideGroup.Provider>
  );
}

export type ItemProps = useRender.ComponentProps<"li"> & {
  /** `default` is a row of a list. `outline` and `muted` are standalone items (a boxed row, a quiet well). */
  variant?: "default" | "outline" | "muted";
  size?: "default" | "sm";
  /** The record that is open in the detail pane: a soft Stormlight fill and a 2 px bar on the inline-start edge. The link inside says the same with `aria-current`. */
  current?: boolean;
  /** Picked for a bulk action: the same fill, no bar. A checked native checkbox inside an `ItemCheck` does it without this prop. */
  selected?: boolean;
  /** Not yet read: the title takes weight 600 (add `ItemUnread` and a screen-reader word inside the link). */
  unread?: boolean;
  /** The whole row is the target of the link or button in its title (`ItemLink` or `ItemTitle` with a link): it stretches over the row, and hover paints the row. */
  stretch?: boolean;
};

/**
 * One record. Inside an `ItemGroup` it is a `li`; alone it is a `div`. The root carries only the row: a 44 px minimum,
 * a hairline below, hover, current and selected fills. With `ItemMedia`, `ItemContent` and `ItemActions` as children
 * it also lays them out in a row; without them (a host that draws its own grid inside) it adds nothing.
 */
export function Item({ className, variant = "default", size = "default", current, selected, unread, stretch, render, ...props }: ItemProps) {
  const inGroup = useContext(InsideGroup);
  return useRender({
    defaultTagName: inGroup ? "li" : "div",
    render,
    props: mergeProps<"li">(
      attrs({
        className: classes("fui-item", className),
        "data-slot": "item",
        "data-variant": variant,
        "data-size": size === "default" ? undefined : size,
        "data-current": current ? "" : undefined,
        "data-selected": selected ? "" : undefined,
        "data-unread": unread ? "" : undefined,
        "data-stretch": stretch ? "" : undefined,
      }),
      props,
    ),
  });
}

export type ItemLinkProps = useRender.ComponentProps<"a"> & {
  /** `true` is `aria-current="true"` (the current item of a set that is not a page); `"page"` is a page of the site. */
  current?: boolean | "page" | "true";
};

/**
 * The link (or, with `render={<button />}`, the button) that is the row's target. Inside an `Item` with `stretch`
 * it covers the whole row; its focus ring is drawn inside the row so a scrolling parent never clips it. Pass the
 * host's router link through `render`.
 */
export function ItemLink({ current, render, className, ...props }: ItemLinkProps) {
  const value = current === true ? "true" : current === false || current === undefined ? undefined : current;
  return useRender({
    defaultTagName: "a",
    render,
    props: mergeProps<"a">(
      attrs({ className: classes("fui-item-link", className), "data-slot": "item-link", "aria-current": value }),
      props,
    ),
  });
}

/** Leading visual: an icon in a small box (`variant="icon"`), an image or avatar (`variant="image"`), or bare. */
export function ItemMedia({ variant = "default", className, render, ...props }: useRender.ComponentProps<"div"> & { variant?: "default" | "icon" | "image" }) {
  return useRender({
    defaultTagName: "div",
    render,
    props: mergeProps<"div">(attrs({ className: classes("fui-item-media", className), "data-slot": "item-media", "data-variant": variant }), props),
  });
}

/** The text column. It never takes `position`, `transform` or `contain`, so the row's stretched link keeps the row as its containing block. */
export function ItemContent({ className, render, ...props }: useRender.ComponentProps<"div">) {
  return useRender({ defaultTagName: "div", render, props: mergeProps<"div">(attrs({ className: classes("fui-item-content", className), "data-slot": "item-content" }), props) });
}
/** The record's name. Give it a heading with `render={<h3 />}`; a link inside it becomes the stretched target. */
export function ItemTitle({ className, render, ...props }: useRender.ComponentProps<"div">) {
  return useRender({ defaultTagName: "div", render, props: mergeProps<"div">(attrs({ className: classes("fui-item-title", className), "data-slot": "item-title" }), props) });
}
/** A second line, muted. Two lines at most, then an ellipsis. */
export function ItemDescription({ className, render, ...props }: useRender.ComponentProps<"p">) {
  return useRender({ defaultTagName: "p", render, props: mergeProps<"p">(attrs({ className: classes("fui-item-description", className), "data-slot": "item-description" }), props) });
}
/** Controls of the row (a star, a menu): they sit above the stretched target, so they stay separate targets. */
export function ItemActions({ className, render, ...props }: useRender.ComponentProps<"div">) {
  return useRender({ defaultTagName: "div", render, props: mergeProps<"div">(attrs({ className: classes("fui-item-actions", className), "data-slot": "item-actions" }), props) });
}
/** A bare control that must stay a target of its own, above the stretched one (a star inside a row that lays itself out): `position` and `z-index` and nothing else. `ItemActions` is the same with a layout. */
export function ItemControl({ className, render, ...props }: useRender.ComponentProps<"span">) {
  return useRender({ defaultTagName: "span", render, props: mergeProps<"span">(attrs({ className: classes("fui-item-control", className), "data-slot": "item-control" }), props) });
}
/** A full-width line above the content (shadcn name). */
export function ItemHeader({ className, render, ...props }: useRender.ComponentProps<"div">) {
  return useRender({ defaultTagName: "div", render, props: mergeProps<"div">(attrs({ className: classes("fui-item-header", className), "data-slot": "item-header" }), props) });
}
/** A full-width line below the content (shadcn name). */
export function ItemFooter({ className, render, ...props }: useRender.ComponentProps<"div">) {
  return useRender({ defaultTagName: "div", render, props: mergeProps<"div">(attrs({ className: classes("fui-item-footer", className), "data-slot": "item-footer" }), props) });
}
/** The 44 by 44 label of a row's checkbox: the whole square is the target and the native box stays 16 px. Above the stretched target. */
export function ItemCheck({ className, render, ...props }: useRender.ComponentProps<"label">) {
  return useRender({ defaultTagName: "label", render, props: mergeProps<"label">(attrs({ className: classes("fui-item-check", className), "data-slot": "item-check" }), props) });
}
/** The unread marker: a 6 px square in ink (never Stormlight). Decorative: say "unread" in the link's text for screen readers. */
export function ItemUnread({ className, render, ...props }: useRender.ComponentProps<"span">) {
  return useRender({ defaultTagName: "span", render, props: mergeProps<"span">(attrs({ className: classes("fui-item-unread", className), "data-slot": "item-unread", "aria-hidden": true }), props) });
}

/**
 * A hairline between items where they should not each carry their own (shadcn name). Inside a group it is an empty,
 * hidden `li` (a `role="separator"` child is not allowed in a list); alone it is a separator.
 */
export function ItemSeparator({ className, ...props }: ComponentProps<"li">) {
  const inGroup = useContext(InsideGroup);
  const hook = classes("fui-item-separator", className);
  return inGroup ? (
    <li aria-hidden="true" data-slot="item-separator" className={hook} {...props} />
  ) : (
    <div role="separator" data-slot="item-separator" className={hook} {...(props as ComponentProps<"div">)} />
  );
}
