"use client";
import { Fragment, useState, type ReactNode } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@fabrials/ui";
export function PlaygroundSandbox({ children }: { children: ReactNode }) {
  const [revision, setRevision] = useState(0);
  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground" role="status">
          {revision
            ? "Scenario reset. Ready to experiment again."
            : "A live sandbox. Changes stay in this page."}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setRevision((r) => r + 1)}
        >
          <RotateCcw />
          Reset scenario
        </Button>
      </div>
      <Fragment key={revision}>{children}</Fragment>
    </div>
  );
}
