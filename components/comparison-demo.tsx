"use client";
import { useState } from "react";
import { Comparison } from "@/registry/components/comparison";
import { Button } from "@fabrials/ui";

/** A minimal, controlled example without a store, cart or agent registration. */
export function ComparisonDemo() {
  const [highlight, setHighlight] = useState(false);
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm text-muted-foreground">Compare two plans</span>
        <Button
          variant="outline"
          size="sm"
          aria-pressed={highlight}
          onClick={() => setHighlight(!highlight)}
        >
          {highlight ? "Clear highlight" : "Highlight differences"}
        </Button>
      </div>
      <Comparison
        caption="Plan features"
        columns={[
          {
            id: "personal",
            title: "Personal",
            subtitle: "For individual projects",
          },
          { id: "team", title: "Team", subtitle: "For shared projects" },
        ]}
        rows={[
          {
            id: "projects",
            label: "Projects",
            values: { personal: "3", team: "Unlimited" },
            highlighted: highlight,
          },
          {
            id: "members",
            label: "Members",
            values: { personal: "1", team: "10" },
            highlighted: highlight,
          },
          {
            id: "export",
            label: "Export data",
            values: { personal: "Included", team: "Included" },
          },
        ]}
      />
      <p role="status" className="text-xs text-muted-foreground">
        {highlight
          ? "Projects and members differ between the plans."
          : "Pass columns and rows. Control highlights from your own state."}
      </p>
    </div>
  );
}
