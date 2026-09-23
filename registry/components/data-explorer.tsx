"use client";
import { useId, useMemo, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, Search } from "lucide-react";
import {
  Button,
  Checkbox,
  Input,
  NativeSelect,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@fabrials/ui";
export interface DataColumn<T> {
  key: keyof T & string;
  label: string;
  render?: (row: T) => ReactNode;
}
export function SearchFilter({
  query,
  onQueryChange,
  options = [],
  filter = "",
  onFilterChange,
  placeholder = "Search records…",
}: {
  query: string;
  onQueryChange: (query: string) => void;
  options?: { value: string; label: string }[];
  filter?: string;
  onFilterChange?: (value: string) => void;
  placeholder?: string;
}) {
  const id = useId();
  return (
    <div className="flex flex-wrap gap-3">
      <div className="relative min-w-48 flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          aria-label={placeholder}
          value={query}
          placeholder={placeholder}
          onChange={(e) => onQueryChange(e.target.value)}
          className="pl-9"
        />
      </div>
      {options.length > 0 && (
        <>
          <label className="sr-only" htmlFor={id}>
            Filter records
          </label>
          <NativeSelect
            id={id}
            className="w-auto"
            value={filter}
            onChange={(e) => onFilterChange?.(e.target.value)}
          >
            <option value="">All categories</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </NativeSelect>
        </>
      )}
    </div>
  );
}
export function DataTable<T extends { id: string }>({
  rows,
  columns,
  pageSize = 5,
  selected = [],
  onSelectionChange,
}: {
  rows: T[];
  columns: DataColumn<T>[];
  pageSize?: number;
  selected?: string[];
  onSelectionChange?: (ids: string[]) => void;
}) {
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState<{
    key: keyof T & string;
    direction: 1 | -1;
  } | null>(null);
  const sorted = useMemo(
    () =>
      sort
        ? [...rows].sort(
            (a, b) =>
              (typeof a[sort.key] === "number" &&
              typeof b[sort.key] === "number"
                ? Number(a[sort.key]) - Number(b[sort.key])
                : String(a[sort.key]).localeCompare(String(b[sort.key]))) *
              sort.direction,
          )
        : rows,
    [rows, sort],
  );
  const size = Math.max(1, pageSize);
  const pages = Math.max(1, Math.ceil(rows.length / size));
  const current = Math.min(page, pages - 1);
  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              {onSelectionChange && (
                <TableHead className="w-10">
                  <span className="sr-only">Select row</span>
                </TableHead>
              )}
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  aria-sort={
                    sort?.key === column.key
                      ? sort.direction === 1
                        ? "ascending"
                        : "descending"
                      : "none"
                  }
                >
                  <button
                    type="button"
                    onClick={() => {
                      setSort({
                        key: column.key,
                        direction:
                          sort?.key === column.key && sort.direction === 1
                            ? -1
                            : 1,
                      });
                      setPage(0);
                    }}
                    className="flex items-center gap-2 py-3"
                  >
                    {column.label}
                    {sort?.key === column.key &&
                      (sort.direction === 1 ? (
                        <ArrowUp className="size-3" />
                      ) : (
                        <ArrowDown className="size-3" />
                      ))}
                  </button>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.slice(current * size, (current + 1) * size).map((row) => (
              <TableRow
                key={row.id}
                data-state={selected.includes(row.id) ? "selected" : undefined}
              >
                {onSelectionChange && (
                  <TableCell>
                    <Checkbox
                      aria-label={`Select ${row.id}`}
                      checked={selected.includes(row.id)}
                      onCheckedChange={(checked) =>
                        onSelectionChange(
                          checked
                            ? [...selected, row.id]
                            : selected.filter((id) => id !== row.id),
                        )
                      }
                    />
                  </TableCell>
                )}
                {columns.map((column) => (
                  <TableCell key={column.key}>
                    {column.render?.(row) ?? String(row[column.key] ?? "")}
                  </TableCell>
                ))}
              </TableRow>
            ))}
            {!rows.length && (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (onSelectionChange ? 1 : 0)}
                  className="h-24 text-center text-muted-foreground"
                >
                  No matching records.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span role="status">
          {rows.length === 0
            ? "0"
            : `${current * size + 1}–${Math.min((current + 1) * size, rows.length)}`}{" "}
          of {rows.length} records
          {selected.length > 0 ? ` · ${selected.length} selected` : ""}
        </span>
        <div className="flex items-center gap-3">
          <Button
            size="xs"
            variant="outline"
            disabled={current === 0}
            onClick={() => setPage(current - 1)}
          >
            Previous
          </Button>
          <span>
            {current + 1} / {pages}
          </span>
          <Button
            size="xs"
            variant="outline"
            disabled={current + 1 === pages}
            onClick={() => setPage(current + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
