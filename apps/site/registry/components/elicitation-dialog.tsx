"use client";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@fabrials/ui";
import { ArgumentsForm } from "@/registry/components/arguments-form";
import { safeUrl } from "@/registry/components/result-view";
import type { Elicitation } from "@/registry/mcp/provider";
export function ElicitationDialog({ request }: { request?: Elicitation }) {
  if (!request) return null;
  const params = request.params;
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) request.respond({ action: "cancel" });
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Additional information</DialogTitle>
          <DialogDescription>{params.message}</DialogDescription>
        </DialogHeader>
        {params.mode === "url" ? (
          <div className="space-y-4">
            {safeUrl(params.url) ? (
              <a
                className="text-sm underline"
                href={safeUrl(params.url)}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open authorization page ↗
              </a>
            ) : (
              <p role="alert">This URL cannot be opened safely.</p>
            )}
            <p className="text-xs text-muted-foreground">
              Complete the external step, then continue.
            </p>
            <Button onClick={() => request.respond({ action: "accept" })}>
              I have completed this step
            </Button>
          </div>
        ) : (
          <ArgumentsForm
            schema={params.requestedSchema}
            submitLabel="Send response"
            onSubmit={(args) =>
              request.respond({
                action: "accept",
                content: args as Record<
                  string,
                  string | number | boolean | string[]
                >,
              })
            }
          />
        )}
        <Button
          variant="outline"
          onClick={() => request.respond({ action: "decline" })}
        >
          Decline
        </Button>
      </DialogContent>
    </Dialog>
  );
}
