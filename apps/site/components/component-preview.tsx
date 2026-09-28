"use client";

import { useState } from "react";
import { Code2, Eye } from "lucide-react";
import { Loading, Tabs, TabsContent, TabsList, TabsTrigger } from "@fabrials/ui";
import { LoadingToggle } from "@/components/loading-toggle";
import { ComponentDemo } from "@/components/demos";
import { CodeBlock } from "@/components/code-block";

export function ComponentPreview({
  slug,
  code,
  codeLabel,
}: {
  slug: string;
  code: string;
  codeLabel: string;
}) {
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("preview");
  return (
    <Tabs value={tab} onValueChange={(next) => setTab(next as string)} className="docs-preview">
      <div className="docs-preview-bar">
        <TabsList className="docs-segmented" aria-label="Example view">
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
        <CodeBlock code={code} label={codeLabel} />
      </TabsContent>
    </Tabs>
  );
}
