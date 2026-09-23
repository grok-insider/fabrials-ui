"use client";

import type { ComponentProps } from "react";
import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { ChevronLeft, ChevronRight, Ellipsis } from "lucide-react";
import { classes } from "./shared";

export function Breadcrumb({
  className,
  "aria-label": label = "Breadcrumb",
  ...props
}: ComponentProps<"nav">) {
  return (
    <nav
      data-slot="breadcrumb"
      aria-label={label}
      className={classes("fui-breadcrumb", className)}
      {...props}
    />
  );
}

export function BreadcrumbList({ className, ...props }: ComponentProps<"ol">) {
  return <ol className={classes("fui-breadcrumb-list", className)} {...props} />;
}

export function BreadcrumbItem({ className, ...props }: ComponentProps<"li">) {
  return <li className={classes("fui-breadcrumb-item", className)} {...props} />;
}

export function BreadcrumbLink({
  className,
  render,
  ...props
}: useRender.ComponentProps<"a">) {
  return useRender({
    defaultTagName: "a",
    props: mergeProps<"a">({ className: classes("fui-breadcrumb-link", className) }, props),
    render,
  });
}

export function BreadcrumbPage({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      aria-current="page"
      className={classes("fui-breadcrumb-page", className)}
      {...props}
    />
  );
}

export function BreadcrumbSeparator({
  className,
  children,
  ...props
}: ComponentProps<"li">) {
  return (
    <li
      role="presentation"
      aria-hidden="true"
      className={classes("fui-breadcrumb-separator", className)}
      {...props}
    >
      {children ?? <ChevronRight />}
    </li>
  );
}

export function BreadcrumbEllipsis({
  className,
  label = "More pages",
  ...props
}: ComponentProps<"span"> & { label?: string }) {
  return (
    <span className={classes("fui-breadcrumb-ellipsis", className)} {...props}>
      <Ellipsis aria-hidden />
      <span className="fui-sr-only">{label}</span>
    </span>
  );
}

export function Pagination({
  className,
  "aria-label": label = "Pagination",
  ...props
}: ComponentProps<"nav">) {
  return (
    <nav
      data-slot="pagination"
      aria-label={label}
      className={classes("fui-pagination", className)}
      {...props}
    />
  );
}

export function PaginationContent({ className, ...props }: ComponentProps<"ul">) {
  return (
    <ul className={classes("fui-pagination-content", className)} {...props} />
  );
}

export function PaginationItem(props: ComponentProps<"li">) {
  return <li {...props} />;
}

export function PaginationLink({
  className,
  isActive = false,
  render,
  ...props
}: useRender.ComponentProps<"a"> & { isActive?: boolean }) {
  return useRender({
    defaultTagName: "a",
    props: mergeProps<"a">(
      {
        className: classes("fui-pagination-link", className),
        "aria-current": isActive ? "page" : undefined,
      },
      props,
    ),
    render,
  });
}

export function PaginationPrevious({
  className,
  label = "Previous",
  ...props
}: useRender.ComponentProps<"a"> & { label?: string }) {
  return (
    <PaginationLink
      className={classes("fui-pagination-step", className)}
      {...props}
    >
      <ChevronLeft aria-hidden />
      <span>{label}</span>
    </PaginationLink>
  );
}

export function PaginationNext({
  className,
  label = "Next",
  ...props
}: useRender.ComponentProps<"a"> & { label?: string }) {
  return (
    <PaginationLink
      className={classes("fui-pagination-step", className)}
      {...props}
    >
      <span>{label}</span>
      <ChevronRight aria-hidden />
    </PaginationLink>
  );
}

export function PaginationEllipsis({
  className,
  label = "More pages",
  ...props
}: ComponentProps<"span"> & { label?: string }) {
  return (
    <span className={classes("fui-pagination-ellipsis", className)} {...props}>
      <Ellipsis aria-hidden />
      <span className="fui-sr-only">{label}</span>
    </span>
  );
}
