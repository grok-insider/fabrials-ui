"use client";
// Origin: Fabrials, 0.12 (from Radiant's LightboxProvider). The link between `ImageViewerProvider` and what opens its
// viewer (`ZoomableImage`, `MediaGrid openWith="viewer"`, a host through `useImageViewer`), in a module of its own so the
// image and the viewer modules do not import each other.

import { createContext, useContext, useMemo } from "react";
import type { ViewerItem } from "./image-viewer";

export type ImageViewerOpenOptions = {
  /** Where focus goes when the viewer closes. Give the control that opened it: Safari does not focus a button on a click. */
  returnFocus?: HTMLElement | null;
};

export type ImageViewerApi = {
  /** Opens the viewer on `items` at `index` (the first one by default). Nothing happens with no items. */
  open: (items: readonly ViewerItem[], index?: number, options?: ImageViewerOpenOptions) => void;
  close: () => void;
  isOpen: boolean;
};

export type ImageViewerMember = { node: () => HTMLElement | null; item: () => ViewerItem };

export type ImageViewerControl = Pick<ImageViewerApi, "open" | "close"> & {
  /** The name of a control that opens the viewer on a picture, from the provider's labels. */
  openLabel: (alt: string) => string;
  /** A picture joins a group; the function it gets back takes it out again. */
  join: (group: string, member: ImageViewerMember) => () => void;
  /** The pictures of a group, in the order of the document. */
  members: (group: string) => ImageViewerMember[];
};

export const ImageViewerControlContext = createContext<ImageViewerControl | null>(null);
export const ImageViewerOpenContext = createContext(false);
export const ImageViewerGroupContext = createContext<string | null>(null);

/**
 * The viewer of the nearest `ImageViewerProvider`: `open(items, index)`, `close()` and `isOpen`. Null outside a provider,
 * so a piece can fall back to a plain picture instead of drawing a control that does nothing.
 */
export function useImageViewer(): ImageViewerApi | null {
  const control = useContext(ImageViewerControlContext);
  const isOpen = useContext(ImageViewerOpenContext);
  return useMemo(() => (control ? { open: control.open, close: control.close, isOpen } : null), [control, isOpen]);
}
