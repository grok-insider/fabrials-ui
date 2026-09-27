"use client";

import { Code2, Eye } from "lucide-react";
import {
  StatePanel,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@fabrials/ui";
import { CodeBlock } from "@/components/code-block";
import { externalPreviews } from "@/components/external/previews";

/** Preview of a component from another library, next to the exact source people install. */
export function ExternalPreview({
  slug,
  code,
  credit,
}: {
  slug: string;
  code: string;
  credit: string;
}) {
  const Preview = externalPreviews[slug];
  return (
    <>
      <Tabs
        defaultValue={Preview ? "preview" : "code"}
        className="docs-preview"
      >
        <TabsList className="docs-segmented" aria-label="Example view">
          <TabsTrigger value="preview">
            <Eye aria-hidden="true" /> Preview
          </TabsTrigger>
          <TabsTrigger value="code">
            <Code2 aria-hidden="true" /> Source code
          </TabsTrigger>
        </TabsList>
        <TabsContent value="preview" className="docs-preview-stage">
          {Preview ? (
            <div className="fui-preview docs-external-stage">
              <Preview />
            </div>
          ) : (
            <StatePanel
              state="empty"
              title="No preview yet"
              description="This component has no demo. Read its source or install it."
            />
          )}
        </TabsContent>
        <TabsContent value="code" className="docs-preview-code">
          <CodeBlock code={code} label="Source code" />
        </TabsContent>
      </Tabs>
      <p className="docs-preview-credit">{credit}</p>
    </>
  );
}
