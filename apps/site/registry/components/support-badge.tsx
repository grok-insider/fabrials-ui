import { Badge } from "@fabrials/ui";
import type { Support } from "@/registry/mcp/types";
export function SupportBadge({
  support,
  error,
}: {
  support: Support;
  error?: string;
}) {
  const labels: Record<Support, string> = {
    checking: "Checking browser…",
    native: "WebMCP available",
    legacy: "WebMCP · legacy API",
    unsupported: "Native WebMCP unavailable",
  };
  const tone =
    support === "native" || support === "legacy"
      ? "success"
      : support === "unsupported"
        ? "warning"
        : "neutral";
  return (
    <div className="space-y-2">
      <Badge variant="outline" tone={tone} dot role="status">
        {labels[support]}
      </Badge>
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
