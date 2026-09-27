"use client";
import { useRef, useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@fabrials/ui";
import { errorMessage } from "@/registry/mcp/types";
export function ActionButton({
  action,
  children,
  disabled = false,
}: {
  action: () => unknown | Promise<unknown>;
  children: ReactNode;
  disabled?: boolean;
}) {
  const busy = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  return (
    <div className="space-y-2">
      <Button
        disabled={disabled || pending}
        aria-busy={pending}
        onClick={async () => {
          if (busy.current) return;
          busy.current = true;
          setPending(true);
          setError("");
          try {
            await action();
          } catch (e) {
            setError(errorMessage(e));
          } finally {
            setPending(false);
            busy.current = false;
          }
        }}
      >
        {pending && (
          <Loader2 className="size-4 animate-spin motion-reduce:animate-none" />
        )}
        {children}
      </Button>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
