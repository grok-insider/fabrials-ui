"use client";
import { useState } from "react";
import { Search, ArrowUpRight, Braces } from "lucide-react";
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
    `${t.name} ${t.description ?? ""}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <div className={cn("space-y-4", className)}>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          aria-label="Search tools"
          placeholder="Search tools…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>
      <div className="grid gap-2">
        {shown.map((tool) => (
          <button
            type="button"
            key={tool.name}
            aria-pressed={selected === tool.name}
            onClick={() => onSelect(tool)}
            className={cn(
              "group flex w-full items-start gap-3 rounded-lg border p-4 text-left transition-colors hover:bg-muted/60 focus-visible:outline-2 focus-visible:outline-ring",
              selected === tool.name &&
                "border-[var(--brand)] bg-[var(--brand-soft)]",
            )}
          >
            <Braces className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium">
                {tool.title ?? tool.name}
              </span>
              <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                {tool.description}
              </span>
              <span className="mt-2 block font-mono text-[10px] text-muted-foreground">
                {tool.name}
              </span>
            </span>
            <ArrowUpRight className="size-3.5 text-muted-foreground" />
          </button>
        ))}
      </div>
      {!shown.length && (
        <p
          role="status"
          className="py-6 text-center text-sm text-muted-foreground"
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
    <section className="space-y-5">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-medium">{tool.title ?? tool.name}</h3>
          {tool.annotations?.readOnlyHint && (
            <Badge variant="soft">Read-only hint</Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{tool.description}</p>
      </header>
      <ArgumentsForm
        key={tool.name}
        schema={tool.inputSchema}
        onSubmit={onRun}
        disabled={disabled}
      />
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowSchema(!showSchema)}
        aria-expanded={showSchema}
      >
        {showSchema ? "Hide" : "View"} input schema
      </Button>
      {showSchema && (
        <pre className="max-h-64 overflow-auto rounded-md bg-muted p-4 text-xs">
          {JSON.stringify(tool.inputSchema, null, 2)}
        </pre>
      )}
    </section>
  );
}
