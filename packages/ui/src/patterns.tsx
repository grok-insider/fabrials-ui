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
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  eyebrow?: ReactNode;
}) {
  return (
    <header className="fui-page-header">
      <div className="fui-page-heading">
        {eyebrow && <p className="fui-eyebrow">{eyebrow}</p>}
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
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="fui-section-header">
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
}: {
  state: keyof typeof stateIcons;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  headingLevel?: 2 | 3 | 4;
  className?: string;
  icon?: ReactNode;
}) {
  const Icon = stateIcons[state];
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";
  return (
    <div
      className={classes("fui-state-panel", className)}
      data-state={state}
      role={state === "error" ? "alert" : "status"}
      aria-busy={state === "loading" || undefined}
    >
      {icon ? <span aria-hidden className="fui-state-icon">{icon}</span> : <Icon
        aria-hidden
        size={22}
        className={state === "loading" ? "fui-spin" : undefined}
      />}
      <div>
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
