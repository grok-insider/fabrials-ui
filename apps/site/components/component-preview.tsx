"use client";

import { useState } from "react";
import { Code2, Eye } from "lucide-react";
import { Loading, Tabs, TabsContent, TabsList, TabsTrigger } from "@fabrials/ui";
import { LoadingToggle } from "@/components/loading-toggle";
import { ComponentDemo } from "@/components/demos";
import { CodeBlock } from "@/components/code-block";
import { exampleSets } from "@/components/examples";

/**
 * A component's preview and, under its second tab, the code that makes it: the preview of an example set brings its own code,
 * every other preview the code the server read from its demo (lib/demo-code.generated.ts).
 */
export function ComponentPreview({
  slug,
  code,
  codeLabel,
  codeTitle,
}: {
  slug: string;
  code: string;
  codeLabel: string;
  codeTitle: string;
}) {
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("preview");
  const set = exampleSets[slug];
  const shown = set?.preview && set.previewCode ? set.previewCode : code;
  return (
    <Tabs value={tab} onValueChange={(next) => setTab(next as string)} className="docs-preview">
      <div className="docs-preview-bar">
        <TabsList variant="segmented" className="docs-segmented" aria-label="Example view">
          <TabsTrigger value="preview">
            <Eye aria-hidden="true" /> Preview
          </TabsTrigger>
          <TabsTrigger value="code">
            <Code2 aria-hidden="true" /> {codeLabel}
          </TabsTrigger>
        </TabsList>
        {tab === "preview" && <LoadingToggle checked={loading} onCheckedChange={setLoading} />}
      </div>
      <TabsContent value="preview" className="docs-preview-stage">
        <Loading when={loading} label="Loading the example">
          <div className="fui-preview">
            <ComponentDemo slug={slug} />
          </div>
        </Loading>
      </TabsContent>
      <TabsContent value="code" className="docs-preview-code">
        <CodeBlock code={shown} label={codeTitle} language="tsx" />
      </TabsContent>
    </Tabs>
  );
}
