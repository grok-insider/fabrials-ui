"use client";
import { Fragment, useState, type ReactNode } from "react";
import { RotateCcw } from "lucide-react";
import { Button, StatusDot } from "@fabrials/ui";

export function PlaygroundSandbox({
  children,
  bleed = false,
}: {
  children: ReactNode;
  bleed?: boolean;
}) {
  const [revision, setRevision] = useState(0);
  return (
    <div className="playground-plate">
      <div className="playground-sandbox-bar">
        <p className="playground-sandbox-status" role="status">
          <StatusDot
            tone="info"
            label={
              revision
                ? "Scenario reset · ready to experiment again"
                : "Live local sandbox · synthetic state only"
            }
          />
        </p>
        <Button variant="outline" size="xs" onClick={() => setRevision((r) => r + 1)}>
          <RotateCcw />
          Reset scenario
        </Button>
      </div>
      <div className="playground-sandbox-body" data-bleed={bleed || undefined}>
        <Fragment key={revision}>{children}</Fragment>
      </div>
    </div>
  );
}
