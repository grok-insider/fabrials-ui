"use client";
import type { ReactNode } from "react";
export interface ComparisonColumn {
  id: string;
  title: string;
  subtitle?: string;
  visual?: ReactNode;
  action?: ReactNode;
}
export interface ComparisonRow {
  id: string;
  label: string;
  values: Record<string, ReactNode>;
  highlighted?: boolean;
}
/** Controlled presentation: application tools decide which evidence to highlight. */
export function Comparison({
  columns,
  rows,
  caption,
  note,
}: {
  columns: ComparisonColumn[];
  rows: ComparisonRow[];
  caption: string;
  note?: ReactNode;
}) {
  return (
    <div className="comparison-view">
      {note && (
        <div
          className="mb-5 rounded-xl border border-[color-mix(in_oklab,var(--brand)_28%,transparent)] bg-[var(--brand-soft)] px-5 py-4 text-sm leading-6 text-foreground"
          role="status"
        >
          {note}
        </div>
      )}
      <div className="comparison-mobile grid gap-4 sm:hidden">
        {columns.map((column) => (
          <article
            key={column.id}
            className="overflow-hidden rounded-xl border bg-card"
          >
            <div className="flex items-center gap-4 p-4">
              {column.visual && (
                <div className="w-28 shrink-0">{column.visual}</div>
              )}
              <div>
                <h4 className="text-lg font-medium">{column.title}</h4>
                <p className="text-sm text-muted-foreground">
                  {column.subtitle}
                </p>
              </div>
            </div>
            <dl>
              {rows.map((row) => (
                <div
                  key={row.id}
                  className={`flex items-center justify-between gap-3 border-t px-4 py-3 text-sm ${row.highlighted ? "bg-[var(--brand-soft)] text-foreground" : ""}`}
                >
                  <dt>{row.label}</dt>
                  <dd className="text-right">{row.values[column.id] ?? "—"}</dd>
                </div>
              ))}
            </dl>
            {column.action && (
              <div className="border-t p-4">{column.action}</div>
            )}
          </article>
        ))}
      </div>
      <div className="comparison-table hidden overflow-x-auto rounded-[var(--fui-radius-lg)] border bg-card sm:block">
        <table className="w-full min-w-[570px] table-fixed text-left text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr>
              <th className="w-[24%] px-5 py-6 align-bottom text-xs font-normal text-muted-foreground">
                {caption}
              </th>
              {columns.map((c) => (
                <th
                  key={c.id}
                  scope="col"
                  className="px-5 py-6 align-top font-normal"
                >
                  {c.visual}
                  <div className="mt-4 text-lg font-medium tracking-tight">
                    {c.title}
                  </div>
                  <div className="mt-1 text-muted-foreground">{c.subtitle}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                data-highlighted={row.highlighted || undefined}
                className={`border-t transition-colors duration-300 motion-reduce:transition-none ${row.highlighted ? "bg-[var(--brand-soft)] text-foreground" : ""}`}
              >
                <th scope="row" className="px-5 py-4 font-normal">
                  {row.label}
                  {row.highlighted && (
                    <span className="sr-only"> — highlighted evidence</span>
                  )}
                </th>
                {columns.map((c) => (
                  <td key={c.id} className="px-5 py-4">
                    {row.values[c.id] ?? "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          {columns.some((c) => c.action) && (
            <tfoot>
              <tr className="border-t">
                <td className="px-5 py-5 text-xs text-muted-foreground">
                  Your choice
                </td>
                {columns.map((c) => (
                  <td key={c.id} className="px-5 py-5">
                    {c.action}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
