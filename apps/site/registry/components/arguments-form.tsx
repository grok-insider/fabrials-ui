"use client";
import { useId, useState } from "react";
import {
  Button,
  Input,
  Label,
  NativeCheckbox,
  NativeSelect,
  Textarea,
} from "@fabrials/ui";
import { simpleFields, validateArguments } from "@/registry/mcp/schema";
import { errorMessage, type JsonSchema } from "@/registry/mcp/types";
export function ArgumentsForm({
  schema,
  onSubmit,
  submitLabel = "Run tool",
  disabled = false,
  initialValues = {},
}: {
  schema: JsonSchema;
  onSubmit: (args: Record<string, unknown>) => unknown | Promise<unknown>;
  submitLabel?: string;
  disabled?: boolean;
  initialValues?: Record<string, unknown>;
}) {
  const id = useId();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const fields = simpleFields(schema) ? (schema.properties ?? {}) : null;
  const [json, setJson] = useState(JSON.stringify(initialValues, null, 2));
  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        if (pending || disabled) return;
        const data = new FormData(event.currentTarget);
        setError("");
        try {
          let args: Record<string, unknown>;
          if (!fields) args = JSON.parse(json);
          else {
            args = {};
            for (const [name, field] of Object.entries(fields)) {
              if (typeof field === "boolean") continue;
              const raw = data.get(name);
              const required =
                typeof schema !== "boolean" && schema.required?.includes(name);
              if (field.type === "boolean") {
                args[name] = field.enum ? raw === "true" : raw === "on";
                continue;
              }
              if (raw === "" && !required) continue;
              args[name] =
                field.type === "number" || field.type === "integer"
                  ? Number(raw)
                  : String(raw ?? "");
            }
          }
          if (!args || typeof args !== "object" || Array.isArray(args))
            throw new Error("Arguments must be a JSON object.");
          const invalid = validateArguments(schema, args);
          if (invalid) throw new Error(invalid);
          setPending(true);
          await onSubmit(args);
        } catch (e) {
          setError(errorMessage(e));
        } finally {
          setPending(false);
        }
      }}
    >
      {fields ? (
        Object.entries(fields).map(([name, field]) => {
          if (typeof field === "boolean") return null;
          const required =
            typeof schema !== "boolean" && schema.required?.includes(name);
          const fieldId = `${id}-${name}`;
          return (
            <div className="space-y-1.5" key={name}>
              <Label htmlFor={fieldId}>
                {field.title ?? name}
                {required && (
                  <span aria-label="required" className="text-muted-foreground">
                    *
                  </span>
                )}
              </Label>
              {field.enum ? (
                <NativeSelect
                  id={fieldId}
                  name={name}
                  required={required}
                  defaultValue={String(
                    initialValues[name] ?? field.default ?? "",
                  )}
                  disabled={pending || disabled}
                >
                  <option value="">Select…</option>
                  {field.enum.map((value, index) => (
                    <option key={index} value={String(value)}>
                      {String(value)}
                    </option>
                  ))}
                </NativeSelect>
              ) : field.type === "boolean" ? (
                <NativeCheckbox
                  id={fieldId}
                  name={name}
                  defaultChecked={Boolean(initialValues[name] ?? field.default)}
                  disabled={pending || disabled}
                />
              ) : (
                <Input
                  id={fieldId}
                  name={name}
                  type={
                    ["integer", "number"].includes(String(field.type))
                      ? "number"
                      : field.format === "date"
                        ? "date"
                        : field.format === "email"
                          ? "email"
                          : "text"
                  }
                  step={field.type === "integer" ? 1 : "any"}
                  min={
                    typeof field.minimum === "number"
                      ? field.minimum
                      : undefined
                  }
                  max={
                    typeof field.maximum === "number"
                      ? field.maximum
                      : undefined
                  }
                  required={required}
                  defaultValue={String(
                    initialValues[name] ?? field.default ?? "",
                  )}
                  disabled={pending || disabled}
                  aria-describedby={
                    field.description ? `${fieldId}-help` : undefined
                  }
                />
              )}
              {field.description && (
                <p
                  id={`${fieldId}-help`}
                  className="text-xs text-muted-foreground"
                >
                  {field.description}
                </p>
              )}
            </div>
          );
        })
      ) : (
        <div className="space-y-2">
          <Label htmlFor={id}>Arguments · JSON</Label>
          <Textarea
            id={id}
            value={json}
            onChange={(e) => setJson(e.target.value)}
            rows={8}
            spellCheck={false}
            className="font-mono text-xs"
            disabled={pending || disabled}
          />
          <p className="text-xs text-muted-foreground">
            This schema uses advanced JSON Schema features. Edit its arguments
            directly.
          </p>
        </div>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" disabled={disabled || pending} aria-busy={pending}>
        {pending ? "Running…" : submitLabel}
      </Button>
    </form>
  );
}
