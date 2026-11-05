"use client";
// Origin: Base UI (MIT), re-exported under shadcn's names so a shim covers it.

/**
 * A right-to-left interface sets `dir="rtl"` on its root and wraps it in `<DirectionProvider direction="rtl">`. The
 * attribute turns the layout (the components use logical CSS); the provider turns Base UI's behaviour: slider thumbs and
 * their arrow keys, menus, tabs, toolbars and composite lists. Set both, from the same value.
 */
export { DirectionProvider, useDirection, type DirectionProviderProps, type TextDirection } from "@base-ui/react/direction-provider";
