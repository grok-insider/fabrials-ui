// Origin: Fabrials, 0.12. Pure rules of the carousel's keyboard, kept out of the client module so they can be tested alone.

export type CarouselMove = "previous" | "next" | "first" | "last";

/**
 * What a key asks of a carousel. A horizontal one answers Left and Right, the other way round when the page reads right
 * to left; a vertical one answers Up and Down. Home and End go to the first and the last slide in both.
 */
export function carouselKeyMove(
  key: string,
  orientation: "horizontal" | "vertical",
  direction: "ltr" | "rtl" = "ltr",
): CarouselMove | null {
  if (key === "Home") return "first";
  if (key === "End") return "last";
  if (orientation === "vertical") {
    if (key === "ArrowUp") return "previous";
    if (key === "ArrowDown") return "next";
    return null;
  }
  const back = direction === "rtl" ? "ArrowRight" : "ArrowLeft";
  const forward = direction === "rtl" ? "ArrowLeft" : "ArrowRight";
  if (key === back) return "previous";
  if (key === forward) return "next";
  return null;
}

/**
 * Whether a key pressed on `target` belongs to the carousel at `root`: only when focus is on the region itself or on one
 * of its own previous and next keys. A field, a slider, tabs or a link inside a slide keep their keys, and so does a
 * carousel nested in a slide.
 */
export function carouselOwnsKey(target: EventTarget | null, root: Element): boolean {
  if (target === root) return true;
  if (typeof Element === "undefined" || !(target instanceof Element)) return false;
  const control = target.closest('[data-slot="carousel-previous"], [data-slot="carousel-next"]');
  return control !== null && control.closest('[data-slot="carousel"]') === root;
}

/**
 * Whether `target` is one of the two keys while it is off. An off key keeps focus (so the arrows are still heard at the
 * ends), and Base UI cancels every key pressed on it but Tab so that it cannot be activated: on it, a cancelled event is
 * not a host saying no.
 */
export function carouselOffKey(target: EventTarget | null): boolean {
  if (typeof Element === "undefined" || !(target instanceof Element)) return false;
  return target.closest('[data-slot="carousel-previous"][aria-disabled="true"], [data-slot="carousel-next"][aria-disabled="true"]') !== null;
}

/** The development warning for a carousel region nobody named, or `null` when it has a name. */
export function carouselNameProblem(props: { "aria-label"?: string; "aria-labelledby"?: string }): string | null {
  if (props["aria-label"] || props["aria-labelledby"]) return null;
  return "[fabrials-ui] Carousel: the region has no name. Pass aria-label or aria-labelledby, so a screen reader can tell it from the page's other regions.";
}
