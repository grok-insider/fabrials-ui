// Origin: Fabrials, 0.12. Where a sidebar is, as a physical edge, from its side and the writing direction.

export type SidebarSide = "left" | "right" | "start" | "end";

/** `"left"` and `"right"` are physical; `"start"` and `"end"` follow the direction. */
export function sidebarEdge(side: SidebarSide, direction: "ltr" | "rtl" = "ltr"): "left" | "right" {
  if (side === "start") return direction === "rtl" ? "right" : "left";
  if (side === "end") return direction === "rtl" ? "left" : "right";
  return side;
}

/** The side a collapsed row's tooltip opens on: away from the sidebar. */
export function sidebarTooltipSide(side: SidebarSide, direction: "ltr" | "rtl" = "ltr"): "left" | "right" {
  return sidebarEdge(side, direction) === "left" ? "right" : "left";
}
