"use client";
// Origin: Radiant's account menu at the foot of its sidebar (the behaviour only). 0.12.

import type { ReactNode } from "react";
import { ChevronsUpDown, Monitor, Moon, Sun } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { avatarInitials } from "./avatar-initials";
import { useDirection } from "./direction";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "./menu";
import { useSidebar, useSidebarSide } from "./sidebar";
import { sidebarTooltipSide } from "./sidebar-side";
import { classes } from "./shared";
import type { ThemePreference } from "./toggle-group";

export type SidebarAccountLabels = {
  /** The trigger's name. `name` is the person's name, or the email when there is none. */
  trigger?: (name: string) => string;
  /** What the row says when nobody is signed in. */
  account?: string;
  /** The theme choice's group label, and its three words. */
  theme?: string;
  system?: string;
  light?: string;
  dark?: string;
};

const defaultLabels = {
  trigger: (name: string) => `Account menu for ${name}`,
  account: "Account",
  theme: "Theme",
  system: "System",
  light: "Light",
  dark: "Dark",
};

const THEMES: Array<{ value: ThemePreference; icon: typeof Sun; key: "system" | "light" | "dark" }> = [
  { value: "system", icon: Monitor, key: "system" },
  { value: "light", icon: Sun, key: "light" },
  { value: "dark", icon: Moon, key: "dark" },
];

export type SidebarAccountProps = {
  name?: string;
  email?: string;
  /** The picture; the initials of `name` stand in until it loads, and when it fails. */
  image?: string;
  /** The row is the page a person is on (their settings, say): it takes the current row's plate. */
  active?: boolean;
  /** The theme choice, for a host that has a `ThemeProvider`: the menu gains a labelled group of three. */
  theme?: ThemePreference;
  onThemeChange?: (theme: ThemePreference) => void;
  /** The menu's items: the host's links, and its "Sign out" as a `DropdownMenuItem`. */
  children?: ReactNode;
  labels?: SidebarAccountLabels;
  /** Where the menu opens from the row. Above it by default, as it sits at the foot of the sidebar. */
  menuSide?: "top" | "bottom";
  menuAlign?: "start" | "center" | "end";
  className?: string;
  menuClassName?: string;
};

/**
 * The account row at the foot of a sidebar: a picture, a name and a second line, and a menu above it. Folded to icons,
 * only the picture shows and the tooltip says whose it is. Inside the menu: who you are, your items, and, when `theme` and
 * `onThemeChange` are given, the choice of theme.
 */
export function SidebarAccount({
  name,
  email,
  image,
  active = false,
  theme,
  onThemeChange,
  children,
  labels,
  menuSide = "top",
  menuAlign = "start",
  className,
  menuClassName,
}: SidebarAccountProps) {
  const words = { ...defaultLabels, ...labels };
  const { state, isMobile } = useSidebar();
  const side = useSidebarSide();
  const direction = useDirection();
  const displayName = name?.trim() || email?.trim() || words.account;
  const trigger = (
    <button
      type="button"
      data-slot="sidebar-account-trigger"
      data-active={active || undefined}
      aria-label={words.trigger(displayName)}
      className={classes("fui-sidebar-account-trigger", className)}
    >
      <Avatar size="sm">
        {image ? <AvatarImage alt="" src={image} /> : null}
        <AvatarFallback>{avatarInitials(name?.trim() || email || "")}</AvatarFallback>
      </Avatar>
      <span className="fui-sidebar-account-text">
        <span className="fui-sidebar-account-name" dir="auto" title={displayName}>
          {displayName}
        </span>
        {email && email.trim() !== displayName ? (
          <span className="fui-sidebar-account-email" dir="auto" title={email}>
            {email}
          </span>
        ) : null}
      </span>
      <ChevronsUpDown aria-hidden className="fui-sidebar-account-chevron" size={16} />
    </button>
  );

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger
          render={<DropdownMenuTrigger render={trigger} />}
        />
        <TooltipContent side={sidebarTooltipSide(side, direction)} hidden={state !== "collapsed" || isMobile}>
          {displayName}
        </TooltipContent>
      </Tooltip>
      <DropdownMenuContent align={menuAlign} className={classes("fui-sidebar-account-menu", menuClassName)} side={menuSide} sideOffset={6}>
        <DropdownMenuGroup>
          <DropdownMenuLabel className="fui-sidebar-account-identity">
            <span className="fui-sidebar-account-identity-name" dir="auto">
              {displayName}
            </span>
            {email ? (
              <span className="fui-sidebar-account-identity-email" dir="auto">
                {email}
              </span>
            ) : null}
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        {children ? (
          <>
            <DropdownMenuSeparator />
            {children}
          </>
        ) : null}
        {theme !== undefined && onThemeChange ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup value={theme} onValueChange={(value) => onThemeChange(value as ThemePreference)}>
              <DropdownMenuLabel>{words.theme}</DropdownMenuLabel>
              {THEMES.map(({ value, icon: Icon, key }) => (
                <DropdownMenuRadioItem key={value} value={value}>
                  <Icon aria-hidden size={16} />
                  {words[key]}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
