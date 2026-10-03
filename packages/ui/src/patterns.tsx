"use client";

import { createContext, useContext, useId, type ComponentProps, type ReactNode, type Ref } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Inbox,
  LoaderCircle,
  WifiOff,
} from "lucide-react";
import { classes } from "./shared";

export type HeadingLevel = 1 | 2 | 3 | 4;
/** What a caller may set on the heading element itself: `tabIndex={-1}` so code can focus it, an `id`, a `data-*`. */
export type HeadingProps = Omit<ComponentProps<"h1">, "children" | "className" | "ref">;

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
  headingLevel = 1,
  headingRef,
  headingProps,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  /** Context above the title, e.g. a Breadcrumb. Sentence case, not a tracked label. */
  eyebrow?: ReactNode;
  /** The heading element (default 1). The look is the page title's at every level. */
  headingLevel?: HeadingLevel;
  /** The heading element, for code that moves focus to it (give it `headingProps={{ tabIndex: -1 }}`). */
  headingRef?: Ref<HTMLHeadingElement>;
  headingProps?: HeadingProps;
  className?: string;
}) {
  const Heading = `h${headingLevel}` as "h1";
  return (
    <header className={classes("fui-page-header", className)}>
      <div className="fui-page-heading">
        {eyebrow && <div className="fui-eyebrow">{eyebrow}</div>}
        <Heading {...headingProps} ref={headingRef} className="fui-page-title">
          {title}
        </Heading>
        {description && <p className="fui-description">{description}</p>}
      </div>
      {actions && <div className="fui-actions">{actions}</div>}
    </header>
  );
}

export function SectionHeader({
  title,
  description,
  actions,
  aside,
  headingLevel = 2,
  headingRef,
  headingProps,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  /**
   * A tag beside the title (a count, a status: "Connected mailboxes" `3 of 10`), outside the heading element so the
   * heading's accessible name stays the title. It sits on the title's line and wraps below it when the header is
   * narrow. Nothing changes without it (`false`, `null` and `""` mean no aside; a count of `0` is a tag).
   */
  aside?: ReactNode;
  /** The heading element (default 2). The look is the section title's at every level. */
  headingLevel?: HeadingLevel;
  /** The heading element, for code that moves focus to it (give it `headingProps={{ tabIndex: -1 }}`). */
  headingRef?: Ref<HTMLHeadingElement>;
  headingProps?: HeadingProps;
  className?: string;
}) {
  const Heading = `h${headingLevel}` as "h2";
  return (
    <header className={classes("fui-section-header", className)}>
      <div>
        {aside || aside === 0 ? (
          <div className="fui-section-heading-row">
            <Heading {...headingProps} ref={headingRef} className="fui-section-title">
              {title}
            </Heading>
            <span className="fui-section-aside">{aside}</span>
          </div>
        ) : (
          <Heading {...headingProps} ref={headingRef} className="fui-section-title">
            {title}
          </Heading>
        )}
        {description && <p className="fui-description">{description}</p>}
      </div>
      {actions && <div className="fui-actions">{actions}</div>}
    </header>
  );
}

export function CollectionToolbar({
  search,
  filters,
  actions,
  label = "Collection controls",
}: {
  search?: ReactNode;
  filters?: ReactNode;
  actions?: ReactNode;
  label?: string;
}) {
  return (
    <div className="fui-collection-toolbar" role="group" aria-label={label}>
      {search && <div className="fui-search">{search}</div>}
      {filters && <div className="fui-filters">{filters}</div>}
      {actions && <div className="fui-actions">{actions}</div>}
    </div>
  );
}

export function BulkActions({
  count,
  children,
  label,
  regionLabel = "Selection actions",
  keepMounted = false,
}: {
  count: number;
  children: ReactNode;
  label?: ReactNode;
  regionLabel?: string;
  /**
   * Keep the region in the DOM at a count of 0: the actions are `hidden` (they stay mounted, so a controller or a focus
   * handoff that relies on them keeps working) and the `role="status"` span is always there, visually hidden, so that
   * the change from 0 to 1 is announced. Without it the component renders nothing at 0.
   */
  keepMounted?: boolean;
}) {
  const empty = count < 1;
  if (empty && !keepMounted) return null;
  return (
    <div
      className="fui-bulk-actions"
      role="group"
      aria-label={regionLabel}
      data-empty={empty || undefined}
    >
      <span role="status">{label ?? `${count} selected`}</span>
      <div className="fui-actions" hidden={empty}>
        {children}
      </div>
    </div>
  );
}

type BulkState = { count: number; empty: boolean; keepMounted: boolean; regionLabel: string };
const BulkContext = createContext<BulkState | null>(null);
function useBulk(part: string) {
  const state = useContext(BulkContext);
  if (!state) throw new Error(`${part} must be inside BulkActionsRoot.`);
  return state;
}

/**
 * The parts of `BulkActions` for a layout the bar does not fit: the status in a title row (beside select-all and the folder
 * name), the actions in a form under it. `BulkActionsRoot` shares ONE count, ONE empty state and ONE `keepMounted` with
 * `BulkActionsStatus` and `BulkActionsContent`, and renders a plain `div` (no role, no bar look) that the consumer lays out
 * with `className` and puts the parts anywhere inside. `BulkActions` itself is unchanged.
 *
 * Labelling: the group is the actions (`BulkActionsContent`, `role="group"`, named by `regionLabel`); the status is a live
 * region beside it, not inside a group, so a title row that also holds select-all and a heading is not "Selection actions".
 *
 * At a count of 0 the parts render nothing unless `keepMounted`: then the status is always in the DOM (visually hidden at
 * 0, so the change to 1 is announced) and the actions are `hidden` but mounted (a controller or a focus handoff that relies
 * on them keeps working). The rest of what is inside the root (select-all, the heading) is never affected.
 */
export function BulkActionsRoot({
  count,
  regionLabel = "Selection actions",
  keepMounted = false,
  className,
  children,
  ...props
}: Omit<ComponentProps<"div">, "role"> & {
  count: number;
  /** The accessible name of the actions group. */
  regionLabel?: string;
  keepMounted?: boolean;
}) {
  const empty = count < 1;
  return (
    <BulkContext.Provider value={{ count, empty, keepMounted, regionLabel }}>
      <div {...props} className={classes("fui-bulk-actions-root", className)} data-empty={empty || undefined}>
        {children}
      </div>
    </BulkContext.Provider>
  );
}

/** The live status: `role="status"`, "N selected" unless it has children. Visually hidden (and still announced) at a count of 0 with `keepMounted`. */
export function BulkActionsStatus({ className, children, ...props }: ComponentProps<"span">) {
  const { count, empty, keepMounted } = useBulk("BulkActionsStatus");
  if (empty && !keepMounted) return null;
  return (
    <span role="status" {...props} className={classes("fui-bulk-actions-status", className)} data-empty={empty || undefined}>
      {children ?? `${count} selected`}
    </span>
  );
}

/**
 * The actions, a `role="group"` named by the root's `regionLabel` (`aria-label` overrides it). `hidden` is combined with the
 * empty state: a layout that keeps the actions closed until asked for (a phone) passes it, and they stay mounted. It takes a `ref`.
 */
export function BulkActionsContent({ className, children, hidden = false, ...props }: ComponentProps<"div">) {
  const { empty, keepMounted, regionLabel } = useBulk("BulkActionsContent");
  if (empty && !keepMounted) return null;
  return (
    <div role="group" aria-label={regionLabel} {...props} className={classes("fui-bulk-actions-content", className)} hidden={empty || hidden}>
      {children}
    </div>
  );
}

const stateIcons = {
  loading: LoaderCircle,
  empty: Inbox,
  error: AlertCircle,
  stale: Clock3,
  offline: WifiOff,
  success: CheckCircle2,
};

export type StatePanelProps = Omit<ComponentProps<"div">, "title" | "children"> & {
  state: keyof typeof stateIcons;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  headingLevel?: 2 | 3 | 4;
  icon?: ReactNode;
  align?: "start" | "center";
  /** `sm` is 16 px of padding, for a drawer, a popover, a sidebar or a list slot; the icon and text stay the same. */
  size?: "md" | "sm";
  /** `inline` has no border and no tint (an overlay, a palette, a region that already sits in a panel); the icon still carries the state. */
  variant?: "panel" | "inline";
  /** Fill the height of the region and centre the content in it (an empty reader pane). */
  fill?: boolean;
};

export function StatePanel({
  state,
  title,
  description,
  actions,
  headingLevel = 2,
  className,
  icon,
  align = "start",
  size = "md",
  variant = "panel",
  fill = false,
  ...props
}: StatePanelProps) {
  const Icon = stateIcons[state];
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";
  return (
    <div
      role={state === "error" ? "alert" : "status"}
      aria-busy={state === "loading" || undefined}
      {...props}
      className={classes("fui-state-panel", className)}
      data-state={state}
      data-align={align}
      data-size={size === "sm" ? "sm" : undefined}
      data-variant={variant === "inline" ? "inline" : undefined}
      data-fill={fill || undefined}
    >
      {icon ? (
        <span aria-hidden className="fui-state-icon">
          {icon}
        </span>
      ) : (
        <Icon
          aria-hidden
          size={20}
          className={classes("fui-state-icon", state === "loading" && "fui-spin")}
        />
      )}
      <div className="fui-state-text">
        <Heading>{title}</Heading>
        {description && <p className="fui-description">{description}</p>}
      </div>
      {actions && <div className="fui-actions">{actions}</div>}
    </div>
  );
}

export function Field({
  label,
  description,
  error,
  children,
  id: providedId,
}: {
  label: ReactNode;
  description?: ReactNode;
  error?: ReactNode;
  id?: string;
  children: (props: {
    id: string;
    "aria-describedby"?: string;
    "aria-invalid"?: true;
  }) => ReactNode;
}) {
  const generatedId = useId();
  const id = providedId ?? generatedId;
  const descriptionId = `${id}-description`;
  const errorId = `${id}-error`;
  return (
    <div className="fui-field">
      <label className="fui-label" htmlFor={id}>
        {label}
      </label>
      {children({
        id,
        "aria-describedby":
          [description && descriptionId, error && errorId]
            .filter(Boolean)
            .join(" ") || undefined,
        "aria-invalid": error ? true : undefined,
      })}
      {description && (
        <p className="fui-description" id={descriptionId}>
          {description}
        </p>
      )}
      {error && (
        <p className="fui-field-error" id={errorId} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function WorkspaceShell({
  navigation,
  header,
  children,
  contentId = "main-content",
  skipLabel = "Skip to content",
  className,
  ...props
}: ComponentProps<"div"> & {
  navigation?: ReactNode;
  header?: ReactNode;
  contentId?: string;
  skipLabel?: string;
}) {
  return (
    <div className={classes("fui-workspace", className)} {...props}>
      <a className="fui-skip-link" href={`#${contentId}`}>
        {skipLabel}
      </a>
      {navigation}
      <div className="fui-workspace-body">
        {header && <header className="fui-workspace-header">{header}</header>}
        <main className="fui-workspace-content" id={contentId} tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}

export function SiteHeader({
  brand,
  navigation,
  actions,
  mobileMenu,
  sticky = true,
  className,
  ...props
}: Omit<ComponentProps<"header">, "children"> & {
  brand: ReactNode;
  navigation?: ReactNode;
  actions?: ReactNode;
  /** Shown instead of the navigation below 768px, e.g. a Sheet trigger. */
  mobileMenu?: ReactNode;
  sticky?: boolean;
}) {
  return (
    <header
      data-slot="site-header"
      data-sticky={sticky || undefined}
      className={classes("fui-site-header", className)}
      {...props}
    >
      <div className="fui-site-header-inner">
        <div className="fui-site-brand">{brand}</div>
        {navigation ? <div className="fui-site-nav">{navigation}</div> : null}
        <div className="fui-site-actions">
          {actions}
          {mobileMenu ? <div className="fui-site-mobile-menu">{mobileMenu}</div> : null}
        </div>
      </div>
    </header>
  );
}

export function AuthLayout({
  brand,
  title,
  description,
  children,
  footer,
  aside,
  actions,
  align = "auto",
  headingLevel = 1,
  as: Landmark = "main",
  className,
  ...props
}: Omit<ComponentProps<"main">, "title" | "children" | "className" | "ref"> & {
  brand?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  /** A short note about what the session can and cannot do. */
  footer?: ReactNode;
  /** Optional editorial panel shown beside the card on wide screens. */
  aside?: ReactNode;
  /**
   * A corner control for the page (an appearance and language menu). It sits at the inline end of the top edge, above the aside,
   * and comes AFTER the card in the DOM, so the first tab stop is the sign-in action, not the menu. It is part of the page's
   * column (inside the landmark), positioned against the whole layout.
   */
  actions?: ReactNode;
  /**
   * Where the card sits in its column. `auto` (default) follows DESIGN.md: with an `aside` the card anchors to the inline start
   * of its column, next to the storm (from 1024 px; below it the aside is gone and the card centres), without one it centres.
   * `start` anchors it at every width, `center` centres it even beside an aside.
   */
  align?: "auto" | "start" | "center";
  headingLevel?: 1 | 2;
  /**
   * The element of the page's column. A sign-in page is a `<main>` landmark, so that is the default, and the aside sits outside it
   * (a complementary landmark must be top level). Pass `"div"` where the host already renders its own `<main>` around the layout:
   * two of them are invalid and axe reports them.
   */
  as?: "main" | "div";
  /** The class of the layout's root, not of the landmark. */
  className?: string;
}) {
  const Heading = `h${headingLevel}` as "h1" | "h2";
  return (
    <div
      data-slot="auth-layout"
      data-aside={aside ? "" : undefined}
      data-align={align === "auto" ? undefined : align}
      className={classes("fui-auth", className)}
    >
      {aside ? <aside className="fui-auth-aside">{aside}</aside> : null}
      {/* The rest of the props (id for a skip link, aria-label, tabIndex) go to the landmark. */}
      <Landmark {...props} className="fui-auth-main">
        {brand ? <div className="fui-auth-brand">{brand}</div> : null}
        <section className="fui-auth-card">
          <header className="fui-auth-header">
            <Heading className="fui-auth-title">{title}</Heading>
            {description ? <p className="fui-description">{description}</p> : null}
          </header>
          {children}
        </section>
        {footer ? <p className="fui-auth-footer">{footer}</p> : null}
        {actions ? <div className="fui-auth-actions">{actions}</div> : null}
      </Landmark>
    </div>
  );
}
