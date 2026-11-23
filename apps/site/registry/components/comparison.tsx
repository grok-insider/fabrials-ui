"use client";
import type { ReactNode } from "react";
import { Badge } from "@fabrials/ui";

export interface ComparisonColumn {
  id: string;
  title: string;
  subtitle?: string;
  visual?: ReactNode;
  action?: ReactNode;
  /** Marks the option the evidence points to; its column gets a Stormlight edge and a "Best fit" label. */
  recommended?: boolean;
}

export interface ComparisonRow {
  id: string;
  label: string;
  values: Record<string, ReactNode>;
  highlighted?: boolean;
}

const RECOMMENDED_BODY =
  "bg-[color-mix(in_oklab,var(--brand)_5%,transparent)] shadow-[inset_1px_0_0_color-mix(in_oklab,var(--brand)_34%,transparent),inset_-1px_0_0_color-mix(in_oklab,var(--brand)_34%,transparent)]";

/** Controlled presentation: application tools decide which evidence and option to highlight. */
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
          className="mb-4 rounded-[var(--fui-radius-md)] border border-[color-mix(in_oklab,var(--brand)_var(--fui-tint-edge),transparent)] border-s-2 border-s-[var(--brand-ink)] bg-[color-mix(in_oklab,var(--brand)_var(--fui-tint-strength),var(--card))] px-4 py-3 text-sm leading-6 text-foreground"
          role="status"
        >
          {note}
        </div>
      )}

      <div className="comparison-mobile grid gap-3 sm:hidden">
        {columns.map((column) => (
          <article
            key={column.id}
            data-recommended={column.recommended || undefined}
            className={`overflow-hidden rounded-[var(--fui-radius-plate)] border bg-card ${
              column.recommended
                ? "border-[var(--brand-ink)] shadow-[var(--fui-shadow-xs)]"
                : "border-border"
            }`}
          >
            <div className="flex items-center gap-4 bg-[var(--fui-surface-inset)] p-4">
              {column.visual && (
                <div className="w-24 shrink-0">{column.visual}</div>
              )}
              <div className="min-w-0">
                {column.recommended && (
                  <div className="mb-1.5">
                    <Badge tone="info" dot size="sm">
                      Best fit
                    </Badge>
                  </div>
                )}
                <h4 className="text-base font-medium tracking-tight text-foreground">
                  {column.title}
                </h4>
                {column.subtitle && (
                  <p className="mt-0.5 font-mono text-xs tabular-nums text-muted-foreground">
                    {column.subtitle}
                  </p>
                )}
              </div>
            </div>
            <dl className="m-0">
              {rows.map((row) => (
                <div
                  key={row.id}
                  className={`flex items-center justify-between gap-3 border-t border-[var(--fui-separator)] px-4 py-2.5 text-sm ${
                    row.highlighted
                      ? "bg-[color-mix(in_oklab,var(--brand)_var(--fui-tint-strength),var(--card))] text-foreground"
                      : ""
                  }`}
                >
                  <dt className="font-mono text-[11px] text-muted-foreground">
                    {row.label}
                  </dt>
                  <dd className="m-0 text-right tabular-nums">
                    {row.values[column.id] ?? "—"}
                  </dd>
                </div>
              ))}
            </dl>
            {column.action && (
              <div className="border-t border-[var(--fui-separator)] p-3.5">
                {column.action}
              </div>
            )}
          </article>
        ))}
      </div>

      <div className="comparison-table hidden overflow-x-auto rounded-[var(--fui-radius-plate)] border bg-card sm:block">
        <table className="w-full min-w-[570px] table-fixed border-collapse text-left text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="bg-[var(--fui-surface-inset)]">
              <th className="w-[22%] px-4 py-4 align-bottom font-mono text-[11px] font-normal text-muted-foreground">
                {caption}
              </th>
              {columns.map((c) => (
                <th
                  key={c.id}
                  scope="col"
                  data-recommended={c.recommended || undefined}
                  className={`px-4 py-4 align-top font-normal ${
                    c.recommended
                      ? "bg-[color-mix(in_oklab,var(--brand)_7%,var(--fui-surface-inset))] shadow-[inset_1px_0_0_color-mix(in_oklab,var(--brand)_34%,transparent),inset_-1px_0_0_color-mix(in_oklab,var(--brand)_34%,transparent),inset_0_2px_0_var(--brand-ink)]"
                      : ""
                  }`}
                >
                  <div className="mb-2 min-h-[1.25rem]">
                    {c.recommended ? (
                      <Badge tone="info" dot size="sm">
                        Best fit
                      </Badge>
                    ) : null}
                  </div>
                  {c.visual}
                  <div className="mt-3 text-base font-medium tracking-tight text-foreground">
                    {c.title}
                  </div>
                  {c.subtitle && (
                    <div className="mt-0.5 font-mono text-xs tabular-nums text-muted-foreground">
                      {c.subtitle}
                    </div>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                data-highlighted={row.highlighted || undefined}
                className={`border-t border-[var(--fui-separator)] transition-colors duration-200 motion-reduce:transition-none ${
                  row.highlighted
                    ? "bg-[color-mix(in_oklab,var(--brand)_var(--fui-tint-strength),transparent)] text-foreground"
                    : ""
                }`}
              >
                <th
                  scope="row"
                  className="px-4 py-3.5 font-mono text-[11px] font-normal text-muted-foreground"
                >
                  {row.label}
                  {row.highlighted && (
                    <span className="sr-only"> — highlighted evidence</span>
                  )}
                </th>
                {columns.map((c) => (
                  <td
                    key={c.id}
                    className={`px-4 py-3.5 align-top tabular-nums ${
                      c.recommended ? RECOMMENDED_BODY : ""
                    }`}
                  >
                    {row.values[c.id] ?? "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          {columns.some((c) => c.action) && (
            <tfoot>
              <tr className="border-t border-[var(--fui-separator)] bg-[var(--fui-surface-inset)]">
                <td className="px-4 py-3.5 font-mono text-[11px] text-muted-foreground">
                  Your choice
                </td>
                {columns.map((c) => (
                  <td
                    key={c.id}
                    className={`px-4 py-3.5 ${
                      c.recommended
                        ? "bg-[color-mix(in_oklab,var(--brand)_7%,var(--fui-surface-inset))] shadow-[inset_1px_0_0_color-mix(in_oklab,var(--brand)_34%,transparent),inset_-1px_0_0_color-mix(in_oklab,var(--brand)_34%,transparent),inset_0_-2px_0_var(--brand-ink)]"
                        : ""
                    }`}
                  >
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
