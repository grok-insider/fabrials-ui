"use client";
import { useState } from "react";
import { Button } from "@fabrials/ui";
import { cn } from "@/lib/utils";

export function safeUrl(value: unknown): string | undefined {
  if (typeof value !== "string") return;
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? url.href : undefined;
  } catch {
    return;
  }
}

function Json({ value }: { value: unknown }) {
  return (
    <pre className="m-0 max-h-96 overflow-auto whitespace-pre-wrap break-words rounded-[var(--fui-radius-md)] border border-[var(--fui-separator)] bg-[var(--fui-code)] p-3.5 font-mono text-xs leading-relaxed">
      {JSON.stringify(value, null, 2) ?? String(value)}
    </pre>
  );
}

function Content({ value }: { value: unknown }) {
  if (!value || typeof value !== "object") return <Json value={value} />;
  const block = value as Record<string, unknown>;
  if (block.type === "text" && typeof block.text === "string")
    return (
      <p className="m-0 whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground">
        {block.text}
      </p>
    );
  if (block.type === "resource_link" && safeUrl(block.uri))
    return (
      <a
        className="text-sm text-[var(--brand-ink)] underline underline-offset-4"
        href={safeUrl(block.uri)}
        target="_blank"
        rel="noopener noreferrer"
      >
        {String(block.name ?? block.uri)}
      </a>
    );
  if (
    block.type === "resource" &&
    block.resource &&
    typeof block.resource === "object"
  ) {
    const resource = block.resource as Record<string, unknown>;
    return typeof resource.text === "string" ? (
      <pre className="m-0 max-h-80 overflow-auto whitespace-pre-wrap rounded-[var(--fui-radius-md)] border border-[var(--fui-separator)] bg-[var(--fui-code)] p-3.5 font-mono text-xs">
        {resource.text}
      </pre>
    ) : (
      <Json value={resource} />
    );
  }
  if (
    typeof block.data === "string" &&
    block.data.length <= 8_000_000 &&
    typeof block.mimeType === "string"
  ) {
    const src = `data:${block.mimeType};base64,${block.data}`;
    // Only inert raster formats are embedded; remote URLs and SVG are never executed.
    if (
      block.type === "image" &&
      /^image\/(png|jpeg|webp|gif)$/.test(block.mimeType)
    )
      return (
        <picture>
          <img
            src={src}
            alt="Tool result"
            className="max-h-80 max-w-full rounded-[var(--fui-radius-md)] object-contain"
          />
        </picture>
      );
    if (
      block.type === "audio" &&
      /^audio\/(mpeg|mp3|wav|ogg|webm)$/.test(block.mimeType)
    )
      return <audio controls src={src} aria-label="Tool audio result" />;
  }
  return <Json value={value} />;
}

export function ResultView({
  result,
  className,
}: {
  result: unknown;
  className?: string;
}) {
  const [raw, setRaw] = useState(false);
  const object =
    result && typeof result === "object"
      ? (result as Record<string, unknown>)
      : undefined;
  const content = Array.isArray(object?.content)
    ? object.content
    : Array.isArray(object?.contents)
      ? object.contents
      : null;

  return (
    <div className={cn("grid gap-2.5", className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[11px] text-muted-foreground">
          Result
        </span>
        <Button
          variant="ghost"
          size="xs"
          onClick={() => setRaw(!raw)}
          aria-pressed={raw}
        >
          {raw ? "Preview" : "Raw JSON"}
        </Button>
      </div>
      {raw ? (
        <Json value={result} />
      ) : (
        <>
          {content?.map((block, index) => (
            <Content key={index} value={block} />
          ))}
          {object && "structuredContent" in object ? (
            <Json value={object.structuredContent} />
          ) : (
            !content && <Json value={result} />
          )}
        </>
      )}
    </div>
  );
}
