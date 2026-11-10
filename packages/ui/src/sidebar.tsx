"use client";
// Origin: shadcn/ui sidebar, copied 2026-09-22. Restyled with fui- classes in 0.4 so it renders without Tailwind.

import * as React from "react";
import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { PanelLeftIcon, XIcon } from "lucide-react";
import { canonicalSize } from "./canonical-size";
import { classes as cn } from "./shared";
import { Button, Input } from "./controls";
import { Separator, Skeleton } from "./display";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "./dialog";
import { useDirection } from "./direction";
import { IconButton, type IconButtonProps } from "./icon-button";
import { SearchInput, type SearchInputProps } from "./inputs";
import { Tooltip, TooltipContent, TooltipTrigger } from "./menu";
import { sidebarTooltipSide, type SidebarSide } from "./sidebar-side";
import { SidebarInsetContext } from "./sidebar-inset-context";
import { useIsMobile } from "./use-media-query";

const SIDEBAR_COOKIE_NAME = "sidebar_state";
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
const SIDEBAR_KEYBOARD_SHORTCUT = "b";
const defaultSidebarLabels = { title: "Navigation", description: "Primary navigation for this workspace." };
const defaultCloseLabel = "Close navigation";

/** What a `Sidebar` tells its parts: the edge it is on, and whether it is the phone sheet (where `SidebarClose` draws). */
type SidebarPlace = { side: SidebarSide; sheet: boolean; closeLabel: string };
const SidebarPlaceContext = React.createContext<SidebarPlace | null>(null);

type SidebarContextProps = {
  state: "expanded" | "collapsed";
  open: boolean;
  setOpen: (open: boolean) => void;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
};

const SidebarContext = React.createContext<SidebarContextProps | null>(null);

function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.");
  }
  return context;
}

const standalone: Pick<SidebarContextProps, "state" | "isMobile"> = { state: "expanded", isMobile: false };

/** The edge the sidebar is on, for a part drawn by the host that opens away from it (the account row's tooltip). */
function useSidebarSide(): SidebarSide {
  const place = React.useContext(SidebarPlaceContext);
  return place?.side ?? "left";
}

/** The menu parts read only the state, so a list of navigation rows renders without a provider: expanded, not mobile. */
function useSidebarState() {
  return React.useContext(SidebarContext) ?? standalone;
}

/** A field a person types in: the sidebar shortcut leaves the keystroke to it (Ctrl+B is Bold in an editor). */
function isEditable(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || target.closest("input, textarea, select, [contenteditable]:not([contenteditable='false']), [role='textbox']") !== null;
}

function SidebarProvider({
  defaultOpen = true,
  open: openProp,
  onOpenChange: setOpenProp,
  keyboardShortcut = SIDEBAR_KEYBOARD_SHORTCUT,
  persist = true,
  navigationKey,
  className,
  style,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** The key that toggles the sidebar with Ctrl or Command (default `"b"`), or `false` for none. It is ignored while a person types in a field or an editor. */
  keyboardShortcut?: string | false;
  /** Remember the state in the `sidebar_state` cookie (default). `false` writes nothing: use it when the host keeps the state. */
  persist?: boolean;
  /**
   * Any value that changes when the person navigates (the host's pathname): the phone sheet closes when it does, so a
   * row that is a link needs no handler of its own. The library imports no router; the first value closes nothing.
   */
  navigationKey?: unknown;
}) {
  const isMobile = useIsMobile();
  const [openMobile, setOpenMobile] = React.useState(false);
  const [seenNavigationKey, setSeenNavigationKey] = React.useState(navigationKey);
  if (!Object.is(seenNavigationKey, navigationKey)) {
    setSeenNavigationKey(navigationKey);
    setOpenMobile(false);
  }
  const [_open, _setOpen] = React.useState(defaultOpen);
  const open = openProp ?? _open;
  const setOpen = React.useCallback(
    (value: boolean | ((value: boolean) => boolean)) => {
      const openState = typeof value === "function" ? value(open) : value;
      if (setOpenProp) setOpenProp(openState);
      else _setOpen(openState);
      if (persist) document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
    },
    [setOpenProp, open, persist],
  );

  const toggleSidebar = React.useCallback(() => {
    return isMobile ? setOpenMobile((value) => !value) : setOpen((value) => !value);
  }, [isMobile, setOpen, setOpenMobile]);

  React.useEffect(() => {
    if (keyboardShortcut === false) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key.toLowerCase() === keyboardShortcut.toLowerCase() &&
        (event.metaKey || event.ctrlKey) &&
        !event.altKey &&
        !event.defaultPrevented &&
        !isEditable(event.target)
      ) {
        event.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleSidebar, keyboardShortcut]);

  const state = open ? "expanded" : "collapsed";
  const contextValue = React.useMemo<SidebarContextProps>(
    () => ({
      state,
      open,
      setOpen,
      isMobile,
      openMobile,
      setOpenMobile,
      toggleSidebar,
    }),
    [state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar],
  );

  return (
    <SidebarContext.Provider value={contextValue}>
      <div
        data-slot="sidebar-wrapper"
        data-state={state}
        style={style}
        className={cn("fui-sidebar-wrapper", className)}
        {...props}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  );
}

function Sidebar({
  side = "left",
  variant = "sidebar",
  collapsible = "offcanvas",
  labels = defaultSidebarLabels,
  sheetCloseButton = false,
  className,
  children,
  dir,
  ...props
}: React.ComponentProps<"div"> & {
  /**
   * The edge it is on. `"left"` and `"right"` are physical: the same edge in every writing direction. `"start"` and `"end"`
   * follow the direction: the other edge in a right-to-left page.
   */
  side?: SidebarSide;
  variant?: "sidebar" | "floating" | "inset";
  collapsible?: "offcanvas" | "icon" | "none";
  /** The name and description the phone sheet announces, and the name of its close key (English by default). */
  labels?: { title: string; description: string; close?: string };
  /** Put a close key in a row of its own at the top of the phone sheet. Off by default: place a `SidebarClose` in your header instead when it has room for one. */
  sheetCloseButton?: boolean;
}) {
  const { isMobile, state, openMobile, setOpenMobile } = useSidebar();
  const closeLabel = labels.close ?? defaultCloseLabel;

  if (collapsible === "none") {
    return (
      <div
        data-slot="sidebar"
        data-collapsible="none"
        className={cn("fui-sidebar-static", className)}
        {...props}
      >
        {children}
      </div>
    );
  }

  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile} {...props}>
        <SheetContent
          dir={dir}
          data-sidebar="sidebar"
          data-slot="sidebar"
          data-mobile="true"
          className="fui-sidebar-sheet"
          showCloseButton={false}
          side={side}
        >
          <SheetHeader className="fui-sr-only">
            <SheetTitle>{labels.title}</SheetTitle>
            <SheetDescription>{labels.description}</SheetDescription>
          </SheetHeader>
          <SidebarPlaceContext.Provider value={{ side, sheet: true, closeLabel }}>
            <div className="fui-sidebar-inner">
              {sheetCloseButton ? (
                <div className="fui-sidebar-sheet-bar">
                  <SidebarClose />
                </div>
              ) : null}
              {children}
            </div>
          </SidebarPlaceContext.Provider>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div
      className="fui-sidebar group peer"
      data-state={state}
      data-collapsible={state === "collapsed" ? collapsible : ""}
      data-variant={variant}
      data-side={side}
      data-slot="sidebar"
    >
      <div data-slot="sidebar-gap" className="fui-sidebar-gap" />
      <div
        data-slot="sidebar-container"
        data-side={side}
        className={cn("fui-sidebar-container", className)}
        {...props}
      >
        <div
          data-sidebar="sidebar"
          data-slot="sidebar-inner"
          className="fui-sidebar-inner"
        >
          <SidebarPlaceContext.Provider value={{ side, sheet: false, closeLabel }}>{children}</SidebarPlaceContext.Provider>
        </div>
      </div>
    </div>
  );
}

function SidebarTrigger({
  className,
  onClick,
  children,
  label = "Toggle navigation",
  ...props
}: React.ComponentProps<typeof Button> & {
  /** The button's name (screen-reader text). */
  label?: string;
}) {
  const { toggleSidebar, isMobile, openMobile, open } = useSidebar();
  return (
    <Button
      data-sidebar="trigger"
      data-slot="sidebar-trigger"
      variant="ghost"
      size="icon-sm"
      aria-expanded={isMobile ? openMobile : open}
      className={cn("fui-sidebar-trigger", className)}
      onClick={(event) => {
        onClick?.(event);
        toggleSidebar();
      }}
      {...props}
    >
      {children ?? <PanelLeftIcon aria-hidden className="fui-sidebar-trigger-icon" />}
      <span className="fui-sr-only">{label}</span>
    </Button>
  );
}

/**
 * The close key of the phone sheet: 44 px, named by the sidebar's `labels.close` (or its own `label`). Put it in the
 * `SidebarHeader`, beside the brand. It draws nothing while the sidebar is not a sheet, so the same header serves the desktop.
 */
function SidebarClose({
  label,
  className,
  children,
  ...props
}: Omit<IconButtonProps, "label"> & {
  /** The key's name. The sidebar's `labels.close` when not given. */
  label?: string;
}) {
  const place = React.useContext(SidebarPlaceContext);
  if (!place?.sheet) return null;
  return (
    <SheetClose
      render={
        <IconButton
          data-slot="sidebar-close"
          data-sidebar="close"
          label={label ?? place.closeLabel}
          tooltip={false}
          className={cn("fui-sidebar-close", className)}
          {...props}
        />
      }
    >
      {children ?? <XIcon aria-hidden />}
    </SheetClose>
  );
}

function SidebarRail({
  className,
  label = "Toggle navigation",
  ...props
}: React.ComponentProps<"button"> & {
  /** The rail's name and tooltip. */
  label?: string;
}) {
  const { toggleSidebar } = useSidebar();
  return (
    <button
      data-sidebar="rail"
      data-slot="sidebar-rail"
      aria-label={label}
      tabIndex={-1}
      onClick={toggleSidebar}
      title={label}
      className={cn("fui-sidebar-rail", className)}
      {...props}
    />
  );
}

function SidebarInset({
  frame = false,
  skipLabel,
  contentId = "main-content",
  className,
  children,
  ...props
}: React.ComponentProps<"main"> & {
  /**
   * A column of the window's height whose content scrolls inside, so a header stays and a composer or an `ActionBar` can
   * dock at the foot. Fills the inner area with `SidebarInsetContent`.
   */
  frame?: boolean;
  /** Words for a link to the content, first in the inset (`"Skip to content"`). Off unless given. */
  skipLabel?: string;
  /** The element the skip link goes to: the id `SidebarInsetContent` takes. */
  contentId?: string;
}) {
  const [actions, setActions] = React.useState<HTMLElement | null>(null);
  return (
    <SidebarInsetContext.Provider value={{ contentId, actions, setActions }}>
      <main
        data-slot="sidebar-inset"
        data-frame={frame || undefined}
        className={cn("fui-sidebar-inset", (frame || skipLabel) && "fui-sidebar-inset-framed", className)}
        {...props}
      >
        {skipLabel ? (
          <a className="fui-skip-link" href={`#${contentId}`}>
            {skipLabel}
          </a>
        ) : null}
        {children}
      </main>
    </SidebarInsetContext.Provider>
  );
}

function SidebarInput({
  className,
  ...props
}: React.ComponentProps<typeof Input>) {
  return (
    <Input
      data-slot="sidebar-input"
      data-sidebar="input"
      className={cn("fui-sidebar-input", className)}
      {...props}
    />
  );
}

/** The sidebar's search: a `SearchInput` at the sidebar's size (magnifier, clear key, Escape). The text takes its own direction (`dir="auto"`), so a query in another script reads right. */
function SidebarSearch({ className, size = "sm", dir = "auto", ...props }: SearchInputProps) {
  return (
    <SearchInput
      data-slot="sidebar-search"
      data-sidebar="search"
      size={size}
      dir={dir}
      className={cn("fui-sidebar-search", className)}
      {...props}
    />
  );
}

function SidebarHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-header"
      data-sidebar="header"
      className={cn("fui-sidebar-header", className)}
      {...props}
    />
  );
}

function SidebarFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-footer"
      data-sidebar="footer"
      className={cn("fui-sidebar-footer", className)}
      {...props}
    />
  );
}

function SidebarSeparator({
  className,
  ...props
}: React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      data-slot="sidebar-separator"
      data-sidebar="separator"
      className={cn("fui-sidebar-separator", className)}
      {...props}
    />
  );
}

function SidebarContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-content"
      data-sidebar="content"
      className={cn("fui-sidebar-content", className)}
      {...props}
    />
  );
}

function SidebarGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-group"
      data-sidebar="group"
      className={cn("fui-sidebar-group", className)}
      {...props}
    />
  );
}

function SidebarGroupLabel({
  className,
  render,
  ...props
}: useRender.ComponentProps<"div"> & React.ComponentProps<"div">) {
  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(
      { className: cn("fui-sidebar-group-label", className) },
      props,
    ),
    render,
    state: { slot: "sidebar-group-label", sidebar: "group-label" },
  });
}

function SidebarGroupAction({
  className,
  render,
  ...props
}: useRender.ComponentProps<"button"> & React.ComponentProps<"button">) {
  return useRender({
    defaultTagName: "button",
    props: mergeProps<"button">(
      { className: cn("fui-sidebar-group-action", className) },
      props,
    ),
    render,
    state: { slot: "sidebar-group-action", sidebar: "group-action" },
  });
}

function SidebarGroupContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-group-content"
      data-sidebar="group-content"
      className={cn("fui-sidebar-group-content", className)}
      {...props}
    />
  );
}

function SidebarMenu({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="sidebar-menu"
      data-sidebar="menu"
      className={cn("fui-sidebar-menu", className)}
      {...props}
    />
  );
}

function SidebarMenuItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="sidebar-menu-item"
      data-sidebar="menu-item"
      className={cn("fui-sidebar-menu-item", className)}
      {...props}
    />
  );
}

function SidebarMenuButton({
  render,
  isActive = false,
  variant = "default",
  size = "default",
  depth = 0,
  tooltip,
  className,
  style,
  ...props
}: useRender.ComponentProps<"button"> &
  React.ComponentProps<"button"> & {
    isActive?: boolean;
    variant?: "default" | "outline";
    /** `touch` is a navigation row: a 44 px target around a 40 px band, a 2 px Stormlight bar when active, the focus ring inside the band. */
    size?: "default" | "sm" | "lg" | "touch";
    /** Indent of a nested row (folders in a tree), 0 to 4 steps of 0.75rem, in `touch` rows. */
    depth?: number;
    tooltip?: string | React.ComponentProps<typeof TooltipContent>;
  }) {
  const { isMobile, state } = useSidebarState();
  const place = React.useContext(SidebarPlaceContext);
  const direction = useDirection();
  const comp = useRender({
    defaultTagName: "button",
    props: mergeProps<"button">(
      {
        className: cn("fui-sidebar-menu-button", className),
        "aria-current": isActive ? "page" : undefined,
        style: depth > 0 ? ({ ...style, "--fui-sidebar-depth": Math.min(depth, 4) } as React.CSSProperties) : style,
      },
      props,
    ),
    render: !tooltip ? render : <TooltipTrigger render={render} />,
    state: {
      slot: "sidebar-menu-button",
      sidebar: "menu-button",
      size,
      variant,
      active: isActive,
    },
  });

  if (!tooltip) return comp;
  const content = typeof tooltip === "string" ? { children: tooltip } : tooltip;
  return (
    <Tooltip>
      {comp}
      <TooltipContent
        side={sidebarTooltipSide(place?.side ?? "left", direction)}
        align="center"
        hidden={state !== "collapsed" || isMobile}
        {...content}
      />
    </Tooltip>
  );
}

function SidebarMenuAction({
  className,
  render,
  showOnHover = false,
  ...props
}: useRender.ComponentProps<"button"> &
  React.ComponentProps<"button"> & {
    showOnHover?: boolean;
  }) {
  return useRender({
    defaultTagName: "button",
    props: mergeProps<"button">(
      { className: cn("fui-sidebar-menu-action", className) },
      props,
    ),
    render,
    state: {
      slot: "sidebar-menu-action",
      sidebar: "menu-action",
      "show-on-hover": showOnHover,
    },
  });
}

/**
 * A count at the end of a row. As a sibling of the menu button it floats over the button's end; INSIDE the button
 * (a `span`, so it is valid in a link or a button) it takes its place in the row and is part of the link's accessible
 * name: a screen reader hears "Inbox 12".
 */
function SidebarMenuBadge({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="sidebar-menu-badge"
      data-sidebar="menu-badge"
      className={cn("fui-sidebar-menu-badge", className)}
      {...props}
    />
  );
}

function SidebarMenuSkeleton({
  className,
  showIcon = false,
  ...props
}: React.ComponentProps<"div"> & {
  showIcon?: boolean;
}) {
  const id = React.useId();
  const width = `${50 + ([...id].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 40)}%`;
  return (
    <div
      data-slot="sidebar-menu-skeleton"
      data-sidebar="menu-skeleton"
      className={cn("fui-sidebar-menu-skeleton", className)}
      {...props}
    >
      {showIcon && (
        <Skeleton
          className="fui-sidebar-menu-skeleton-icon"
          data-sidebar="menu-skeleton-icon"
        />
      )}
      <Skeleton
        className="fui-sidebar-menu-skeleton-text"
        data-sidebar="menu-skeleton-text"
        style={{ maxWidth: width }}
      />
    </div>
  );
}

function SidebarMenuSub({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="sidebar-menu-sub"
      data-sidebar="menu-sub"
      className={cn("fui-sidebar-menu-sub", className)}
      {...props}
    />
  );
}

function SidebarMenuSubItem({
  className,
  ...props
}: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="sidebar-menu-sub-item"
      data-sidebar="menu-sub-item"
      className={cn("fui-sidebar-menu-sub-item", className)}
      {...props}
    />
  );
}

function SidebarMenuSubButton({
  render,
  size = "md",
  isActive = false,
  className,
  ...props
}: useRender.ComponentProps<"a"> &
  React.ComponentProps<"a"> & {
    /** `md` is the middle size; `default` names it too. */
    size?: "sm" | "md" | "default";
    isActive?: boolean;
  }) {
  return useRender({
    defaultTagName: "a",
    props: mergeProps<"a">(
      {
        className: cn("fui-sidebar-menu-sub-button", className),
        "aria-current": isActive ? "page" : undefined,
      },
      props,
    ),
    render,
    state: {
      slot: "sidebar-menu-sub-button",
      sidebar: "menu-sub-button",
      size: canonicalSize(size, "md"),
      active: isActive,
    },
  });
}

export {
  Sidebar,
  SidebarClose,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSearch,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
  useSidebarSide,
};
