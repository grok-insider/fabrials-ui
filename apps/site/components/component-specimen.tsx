"use client";

import { memo, type ReactNode } from "react";
import { Layers } from "lucide-react";
import { brandAndControlsSpecimens } from "@/components/specimens/brand-and-controls";
import { collectionsAndOverlaysSpecimens } from "@/components/specimens/collections-and-overlays";
import { navigationAndCompositionSpecimens } from "@/components/specimens/navigation-and-composition";
import { metricsAndPatternsSpecimens } from "@/components/specimens/metrics-and-patterns";
import { foundationsAiRegistrySpecimens } from "@/components/specimens/foundations-ai-registry";

const SPECIMENS: Record<string, () => ReactNode> = {
  ...brandAndControlsSpecimens,
  ...collectionsAndOverlaysSpecimens,
  ...navigationAndCompositionSpecimens,
  ...metricsAndPatternsSpecimens,
  ...foundationsAiRegistrySpecimens,
};

export const SPECIMEN_SLUGS = Object.keys(SPECIMENS);

function renderSpecimen(slug: string, title?: string): ReactNode {
  const render = SPECIMENS[slug];
  if (render) return render();
  return (
    <div className="flex items-center gap-2 rounded-lg bg-card px-3 py-2 text-xs text-foreground">
      <Layers size={13} className="shrink-0 text-muted-foreground" />
      <span className="truncate font-medium">{title ?? slug}</span>
    </div>
  );
}

export const ComponentSpecimen = memo(function ComponentSpecimen({
  slug,
  title,
}: {
  slug: string;
  category?: string;
  title?: string;
}) {
  return <div className="docs-specimen">{renderSpecimen(slug, title)}</div>;
});
