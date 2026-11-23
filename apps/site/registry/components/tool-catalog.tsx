"use client";
import { useState } from "react";
import { Search, Braces } from "lucide-react";
import { Badge, Button, Input } from "@fabrials/ui";
import { ArgumentsForm } from "@/registry/components/arguments-form";
import type { ToolDefinition } from "@/registry/mcp/types";
import { cn } from "@/lib/utils";

export function ToolCatalog({
  tools,
  selected,
  onSelect,
  className,
}: {
  tools: ToolDefinition[];
  selected?: string;
  onSelect: (tool: ToolDefinition) => void;
  className?: string;
}) {
  const [query, setQuery] = useState("");
  const shown = tools.filter((t) =>
    `${t.name} ${t.title ?? ""} ${t.description ?? ""}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );

  return (
    <div className={cn("grid content-start gap-3", className)}>
      <div className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          aria-label="Search tools"
          placeholder="Search tools…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {shown.length > 0 ? (
        <div className="grid divide-y divide-[var(--fui-separator)] overflow-hidden rounded-[var(--fui-radius-lg)] border bg-background">
          {shown.map((tool) => {
            const isSelected = selected === tool.name;
            return (
              <button
                type="button"
                key={tool.name}
                aria-pressed={isSelected}
                onClick={() => onSelect(tool)}
                className={cn(
                  "relative flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[var(--fui-surface-hover)] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--fui-focus)]",
                  isSelected &&
                    "bg-[color-mix(in_oklab,var(--brand)_var(--fui-tint-strength),var(--background))]",
                )}
              >
                {isSelected && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-y-2 start-0 w-[2.5px] rounded-e bg-[var(--brand-ink)]"
                  />
                )}
                <Braces
                  aria-hidden="true"
                  className={cn(
                    "mt-0.5 size-4 shrink-0",
                    isSelected
                      ? "text-[var(--brand-ink)]"
                      : "text-muted-foreground",
                  )}
                />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-foreground">
                      {tool.title ?? tool.name}
                    </span>
                    {tool.annotations?.readOnlyHint && (
                      <Badge size="sm" tone="neutral">
                        Read-only
                      </Badge>
                    )}
                  </span>
                  {tool.description && (
                    <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                      {tool.description}
                    </span>
                  )}
                  <span className="mt-1.5 block font-mono text-[11px] text-muted-foreground">
                    {tool.name}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <p
          role="status"
          className="rounded-[var(--fui-radius-lg)] border border-[var(--fui-separator)] bg-[var(--fui-surface-inset)] py-6 text-center text-sm text-muted-foreground"
        >
          No matching tools.
        </p>
      )}
    </div>
  );
}

export function ToolDetail({
  tool,
  onRun,
  disabled,
}: {
  tool: ToolDefinition;
  onRun: (args: Record<string, unknown>) => unknown | Promise<unknown>;
  disabled?: boolean;
}) {
  const [showSchema, setShowSchema] = useState(false);
  return (
    <section className="grid gap-4">
      <header className="grid gap-1.5 border-b border-[var(--fui-separator)] pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="m-0 text-sm font-semibold text-foreground">
              {tool.title ?? tool.name}
            </h3>
            {tool.annotations?.readOnlyHint && (
              <Badge size="sm" tone="info">
                Read-only hint
              </Badge>
            )}
          </div>
          <code className="font-mono text-[11px] text-muted-foreground">
            {tool.name}
          </code>
        </div>
        {tool.description && (
          <p className="m-0 text-xs leading-relaxed text-muted-foreground">
            {tool.description}
          </p>
        )}
      </header>
      <ArgumentsForm
        key={tool.name}
        schema={tool.inputSchema}
        onSubmit={onRun}
        disabled={disabled}
      />
      <div className="border-t border-[var(--fui-separator)] pt-3">
        <Button
          variant="ghost"
          size="xs"
          onClick={() => setShowSchema(!showSchema)}
          aria-expanded={showSchema}
        >
          {showSchema ? "Hide" : "View"} input schema
        </Button>
        {showSchema && (
          <pre className="mt-2.5 max-h-64 overflow-auto rounded-[var(--fui-radius-md)] border border-[var(--fui-separator)] bg-[var(--fui-code)] p-3.5 font-mono text-[11px] leading-relaxed">
            {JSON.stringify(tool.inputSchema, null, 2)}
          </pre>
        )}
      </div>
    </section>
  );
}
