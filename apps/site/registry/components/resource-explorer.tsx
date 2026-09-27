"use client";
import { useState } from "react";
import type {
  Resource,
  ResourceTemplateType,
  Prompt,
} from "@modelcontextprotocol/client";
import { Button } from "@fabrials/ui";
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
    <section className="space-y-4">
      <h3 className="text-sm font-medium">Resources</h3>
      {!resources.length && (
        <p className="text-sm text-muted-foreground">
          No resources advertised.
        </p>
      )}
      {resources.map((resource) => (
        <div
          key={resource.uri}
          className="flex items-center justify-between gap-3 rounded-lg border p-3"
        >
          <div className="min-w-0">
            <p className="text-sm font-medium">
              {resource.title ?? resource.name}
            </p>
            <p className="break-all font-mono text-[10px] text-muted-foreground">
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
      {templates.map((template) => (
        <details key={template.uriTemplate} className="rounded-lg border p-3">
          <summary className="cursor-pointer text-sm">
            {template.name} · template
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
        <p role="alert" className="text-sm text-destructive">
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
    <section className="space-y-4">
      <h3 className="text-sm font-medium">Prompts</h3>
      {!prompts.length && (
        <p className="text-sm text-muted-foreground">No prompts advertised.</p>
      )}
      {prompts.map((prompt) => (
        <details key={prompt.name} className="rounded-lg border p-4">
          <summary className="cursor-pointer text-sm font-medium">
            {prompt.title ?? prompt.name}
          </summary>
          <p className="my-3 text-xs text-muted-foreground">
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
      {result !== undefined && <ResultView result={result} />}
    </section>
  );
}
