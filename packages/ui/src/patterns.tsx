"use client";

import { useId, type ComponentProps, type ReactNode } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Inbox,
  LoaderCircle,
  WifiOff,
} from "lucide-react";
import { classes } from "./shared";

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  /** Context above the title, e.g. a Breadcrumb. Sentence case, not a tracked label. */
  eyebrow?: ReactNode;
  className?: string;
}) {
  return (
    <header className={classes("fui-page-header", className)}>
      <div className="fui-page-heading">
        {eyebrow && <div className="fui-eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
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
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header className={classes("fui-section-header", className)}>
      <div>
        <h2>{title}</h2>
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
}: {
  count: number;
  children: ReactNode;
  label?: ReactNode;
  regionLabel?: string;
}) {
  if (count < 1) return null;
  return (
    <div className="fui-bulk-actions" role="group" aria-label={regionLabel}>
      <span role="status">{label ?? `${count} selected`}</span>
      <div className="fui-actions">{children}</div>
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

export function StatePanel({
  state,
  title,
  description,
  actions,
  headingLevel = 2,
  className,
  icon,
  align = "start",
}: {
  state: keyof typeof stateIcons;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  headingLevel?: 2 | 3 | 4;
  className?: string;
  icon?: ReactNode;
  align?: "start" | "center";
}) {
  const Icon = stateIcons[state];
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";
  return (
    <div
      className={classes("fui-state-panel", className)}
      data-state={state}
      data-align={align}
      role={state === "error" ? "alert" : "status"}
      aria-busy={state === "loading" || undefined}
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
  headingLevel = 1,
  className,
}: {
  brand?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  /** A short note about what the session can and cannot do. */
  footer?: ReactNode;
  /** Optional editorial panel shown beside the card on wide screens. */
  aside?: ReactNode;
  headingLevel?: 1 | 2;
  className?: string;
}) {
  const Heading = `h${headingLevel}` as "h1" | "h2";
  return (
    <div
      data-slot="auth-layout"
      data-aside={aside ? "" : undefined}
      className={classes("fui-auth", className)}
    >
      {aside ? <aside className="fui-auth-aside">{aside}</aside> : null}
      <div className="fui-auth-main">
        {brand ? <div className="fui-auth-brand">{brand}</div> : null}
        <section className="fui-auth-card">
          <header className="fui-auth-header">
            <Heading className="fui-auth-title">{title}</Heading>
            {description ? <p className="fui-description">{description}</p> : null}
          </header>
          {children}
        </section>
        {footer ? <p className="fui-auth-footer">{footer}</p> : null}
      </div>
    </div>
  );
}
