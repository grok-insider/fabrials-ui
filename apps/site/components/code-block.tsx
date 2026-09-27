"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check, Copy, FileCode, Terminal } from "lucide-react";
import { Button } from "@fabrials/ui";
import "./code-block.css";

const TOKEN =
  /(\/\/.*$|\/\*[\s\S]*?\*\/)|("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`)|(<\/?)([A-Za-z][\w.]*)|\b(import|from|export|function|return|const|let|type|interface|default|async|await|new|if|else|true|false|null|undefined)\b|([A-Za-z_][\w-]*)(?==)|(\b\d[\d_.]*\b)/gm;

function highlight(code: string) {
  const parts: ReactNode[] = [];
  let last = 0;
  for (const match of code.matchAll(TOKEN)) {
    const index = match.index ?? 0;
    if (index > last) parts.push(code.slice(last, index));
    const [text, comment, string, bracket, tag, keyword, attribute, number] = match;
    const key = `${index}`;
    if (comment) parts.push(<span key={key} data-token="comment">{comment}</span>);
    else if (string) parts.push(<span key={key} data-token="string">{string}</span>);
    else if (tag) parts.push(bracket, <span key={key} data-token="tag">{tag}</span>);
    else if (keyword) parts.push(<span key={key} data-token="keyword">{keyword}</span>);
    else if (attribute) parts.push(<span key={key} data-token="attribute">{attribute}</span>);
    else if (number) parts.push(<span key={key} data-token="number">{number}</span>);
    last = index + text.length;
  }
  parts.push(code.slice(last));
  return parts;
}

export function CodeBlock({
  code,
  label = "Terminal",
  variant = "code",
}: {
  code: string;
  label?: string;
  variant?: "command" | "code";
}) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const shell = variant === "command" || /^(terminal|sh|bash|shell)$/i.test(label);
  const LabelIcon = shell ? Terminal : FileCode;
  return (
    <figure className="docs-code" data-variant={variant}>
      <figcaption className="docs-code-title">
        <span>
          <LabelIcon aria-hidden="true" />
          {label}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="docs-copy"
          aria-label={`Copy ${label}`}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(code);
              setError("");
              setCopied(true);
              clearTimeout(timer.current);
              timer.current = setTimeout(() => setCopied(false), 1800);
            } catch {
              setCopied(false);
              setError("Select the command to copy it.");
            }
          }}
        >
          {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
          <span>{copied ? "Copied" : "Copy"}</span>
        </Button>
      </figcaption>
      <pre tabIndex={variant === "code" ? 0 : undefined} aria-label={label}>
        <code>{shell ? code : highlight(code)}</code>
      </pre>
      <span role="status" className={error ? "docs-code-error" : "fui-sr-only"}>
        {error || (copied ? "Copied to clipboard" : "")}
      </span>
    </figure>
  );
}
