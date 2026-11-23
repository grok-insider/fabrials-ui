"use client";
import { useState } from "react";
import type {
  Resource,
  ResourceTemplateType,
  Prompt,
} from "@modelcontextprotocol/client";
import { Badge, Button } from "@fabrials/ui";
import { ArgumentsForm } from "@/registry/components/arguments-form";
import { ResultView } from "@/registry/components/result-view";
import { errorMessage } from "@/registry/mcp/types";

export function ResourceExplorer({
  resources,
  templates = [],
  onRead,
}: {
  resources: Resource[];
  templates?: ResourceTemplateType[];
  onRead: (uri: string) => Promise<unknown>;
}) {
  const [result, setResult] = useState<unknown>();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function read(uri: string) {
    setError("");
    setPending(true);
    try {
      setResult(await onRead(uri));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="grid gap-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="m-0 text-sm font-medium text-foreground">Resources</h3>
        <Badge size="sm" tone="neutral">
          {resources.length}
        </Badge>
      </div>
      {!resources.length && (
        <p className="m-0 rounded-[var(--fui-radius-md)] border border-[var(--fui-separator)] bg-[var(--fui-surface-inset)] px-4 py-5 text-sm text-muted-foreground">
          No resources advertised.
        </p>
      )}
      {resources.length > 0 && (
        <div className="grid divide-y divide-[var(--fui-separator)] overflow-hidden rounded-[var(--fui-radius-lg)] border bg-background">
          {resources.map((resource) => (
            <div
              key={resource.uri}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="m-0 text-sm font-medium text-foreground">
                  {resource.title ?? resource.name}
                </p>
                <p className="m-0 mt-0.5 break-all font-mono text-[11px] text-muted-foreground">
                  {resource.uri}
                </p>
              </div>
              <Button
                size="xs"
                variant="outline"
                disabled={pending}
                onClick={() => void read(resource.uri)}
              >
                Read
              </Button>
            </div>
          ))}
        </div>
      )}
      {templates.map((template) => (
        <details
          key={template.uriTemplate}
          className="rounded-[var(--fui-radius-lg)] border bg-background p-4"
        >
          <summary className="cursor-pointer text-sm font-medium text-foreground">
            {template.name}{" "}
            <span className="font-mono text-[11px] font-normal text-muted-foreground">
              · template
            </span>
          </summary>
          <p className="my-3 break-all font-mono text-xs text-muted-foreground">
            {template.uriTemplate}
          </p>
          <ArgumentsForm
            schema={{
              type: "object",
              properties: {
                uri: {
                  type: "string",
                  description:
                    "Enter a complete resource URI matching this template.",
                },
              },
              required: ["uri"],
            }}
            submitLabel="Read resource"
            onSubmit={(args) => read(String(args.uri))}
          />
        </details>
      ))}
      {error && (
        <p role="alert" className="m-0 text-sm text-[var(--fui-danger-ink)]">
          {error}
        </p>
      )}
      {result !== undefined && <ResultView result={result} />}
    </section>
  );
}

export function PromptCatalog({
  prompts,
  onGet,
}: {
  prompts: Prompt[];
  onGet: (name: string, args: Record<string, string>) => Promise<unknown>;
}) {
  const [result, setResult] = useState<unknown>();
  return (
    <section className="grid gap-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="m-0 text-sm font-medium text-foreground">Prompts</h3>
        <Badge size="sm" tone="neutral">
          {prompts.length}
        </Badge>
      </div>
      {!prompts.length && (
        <p className="m-0 rounded-[var(--fui-radius-md)] border border-[var(--fui-separator)] bg-[var(--fui-surface-inset)] px-4 py-5 text-sm text-muted-foreground">
          No prompts advertised.
        </p>
      )}
      {prompts.length > 0 && (
        <div className="grid divide-y divide-[var(--fui-separator)] overflow-hidden rounded-[var(--fui-radius-lg)] border bg-background">
          {prompts.map((prompt) => (
            <details key={prompt.name} className="p-4">
              <summary className="cursor-pointer text-sm font-medium text-foreground">
                {prompt.title ?? prompt.name}
              </summary>
              <p className="my-3 text-xs leading-relaxed text-muted-foreground">
                {prompt.description}
              </p>
              <ArgumentsForm
                schema={{
                  type: "object",
                  properties: Object.fromEntries(
                    (prompt.arguments ?? []).map((arg) => [
                      arg.name,
                      { type: "string", description: arg.description },
                    ]),
                  ),
                  required: (prompt.arguments ?? [])
                    .filter((a) => a.required)
                    .map((a) => a.name),
                }}
                submitLabel="Get prompt"
                onSubmit={async (args) =>
                  setResult(
                    await onGet(prompt.name, args as Record<string, string>),
                  )
                }
              />
            </details>
          ))}
        </div>
      )}
      {result !== undefined && <ResultView result={result} />}
    </section>
  );
}
