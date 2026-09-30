"use client";
// Origin: Fabrials, 0.8 (promoted from Open Email's ui/command-palette.tsx and app/styles/command.css).

import { Search } from "lucide-react";
import { Fragment, type ComponentProps, type ReactNode } from "react";
import { Button } from "./controls";
import { Kbd, KbdGroup } from "./kbd";
import { classes } from "./shared";

/** `"mod"` prints the main modifier of this device ("Ctrl", or "⌘" on Apple after hydration); anything else is a key cap. */
export type CommandTriggerKey = "mod" | (string & {});

function shortcutOf(keys: readonly CommandTriggerKey[]) {
  const last = keys[keys.length - 1];
  if (!last || last === "mod") return undefined;
  const chord = keys.slice(0, -1);
  if (chord.length === 1 && chord[0] === "mod") return `Control+${last} Meta+${last}`;
  return keys.map((key) => (key === "mod" ? "Control" : key)).join("+");
}

/**
 * The launcher of a command palette: a button that looks like the field it opens, with the shortcut beside its label. It is
 * icon-only when it sits in a container named `command` narrower than 12rem (the command slot of `AppHeader`), or with
 * `compact`; the label then stays as the accessible name. The key hint hides on coarse pointers, where nobody has a
 * keyboard shortcut to learn. `keys` are key caps, `"mod"` being the main modifier resolved after hydration, so the
 * server markup is exact; `aria-keyshortcuts` is derived from them (`Control+K Meta+K`) and stays constant.
 */
export function CommandTrigger({
  icon,
  label,
  name,
  keys,
  sequence = false,
  separator = "then",
  shortcut,
  compact = false,
  variant = "secondary",
  className,
  ...props
}: Omit<ComponentProps<typeof Button>, "size" | "children" | "aria-label"> & {
  /** Defaults to a magnifier. Decorative: it is hidden from assistive technology. */
  icon?: ReactNode;
  /** The visible text ("Search or run a command"). */
  label: ReactNode;
  /** The accessible name when it must say more than the visible label; it should contain it (WCAG 2.5.3). Defaults to `label` when that is a string. */
  name?: string;
  keys?: readonly CommandTriggerKey[];
  /** The keys are pressed one after the other ("g then k"), not together. `aria-keyshortcuts` cannot express steps, so none is derived. */
  sequence?: boolean;
  /** The word between the keys of a sequence (copy a product translates). */
  separator?: ReactNode;
  /** `aria-keyshortcuts`; `false` omits it (the shortcut is switched off). Derived from `keys` by default. */
  shortcut?: string | false;
  /** Icon only, whatever the container's width. */
  compact?: boolean;
  /** The button's look (`secondary`, a grey fill, by default). `outline` is the card fill and hairline of a launcher that looks like a field. */
  variant?: ComponentProps<typeof Button>["variant"];
}) {
  const derived = shortcut === false ? undefined : (shortcut ?? (keys && !sequence ? shortcutOf(keys) : undefined));
  return (
    <Button
      variant={variant}
      size="lg"
      className={classes("fui-command-trigger", className)}
      data-compact={compact || undefined}
      aria-label={name ?? (typeof label === "string" ? label : undefined)}
      aria-keyshortcuts={derived}
      {...props}
    >
      {icon ?? <Search aria-hidden />}
      <span className="fui-command-trigger-label">{label}</span>
      {keys && keys.length > 0 && (
        <KbdGroup className="fui-command-trigger-keys" sequence={sequence} separator={separator} aria-hidden>
          {keys.map((key, index) => (
            <Fragment key={index}>{key === "mod" ? <Kbd mod /> : <Kbd>{key}</Kbd>}</Fragment>
          ))}
        </KbdGroup>
      )}
    </Button>
  );
}

/**
 * A listbox for a palette that is not cmdk (a list your product filters and moves through with `aria-activedescendant`).
 * It is a size container named `fui-command-options`, so a row can lay itself out by the list's width. Give it an `aria-label`.
 */
export function CommandOptionList({ className, ...props }: ComponentProps<"ul">) {
  // tabIndex -1: it scrolls, its rows are reached by the virtual focus of the input that drives it, and a scroll container must be focusable.
  return <ul role="listbox" tabIndex={-1} className={classes("fui-command-options", className)} {...props} />;
}

/**
 * A row of that listbox, with the look of `CommandItem`. `active` is the virtual focus (the row `aria-activedescendant`
 * names): the accent fill and the 2 px Stormlight bar. `disabled` sets `aria-disabled` and mutes the label but keeps the row
 * selectable, so activating it can say why (`reason`); it is not `pointer-events: none`. Slots: `icon`, `label`, `detail`
 * (after the label), `group` (the category, at the end of the line), `reason` and `keys` (`Kbd`s, at the inline end).
 * Below 32rem of list width the label takes its own line, then detail and group, then the reason.
 */
export function CommandOption({
  icon,
  label,
  detail,
  group,
  reason,
  keys,
  active = false,
  disabled = false,
  className,
  ...props
}: Omit<ComponentProps<"li">, "children"> & {
  icon?: ReactNode;
  label: ReactNode;
  detail?: ReactNode;
  group?: ReactNode;
  reason?: ReactNode;
  keys?: ReactNode;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <li
      role="option"
      aria-selected={active && !disabled}
      aria-disabled={disabled}
      data-active={active || undefined}
      data-icon={icon ? "" : undefined}
      className={classes("fui-command-item", "fui-command-option", className)}
      {...props}
    >
      {icon}
      <span className="fui-command-option-text">
        <span className="fui-command-option-main">
          <span className="fui-command-option-label" dir="auto">
            {label}
          </span>
          {detail ? (
            <span className="fui-command-detail" dir="auto">
              {detail}
            </span>
          ) : null}
        </span>
        {group ? (
          <span className="fui-command-option-group" dir="auto">
            {group}
          </span>
        ) : null}
        {reason ? (
          <span className="fui-command-reason" dir="auto">
            {reason}
          </span>
        ) : null}
      </span>
      {keys ? <span className="fui-command-option-keys">{keys}</span> : null}
    </li>
  );
}
