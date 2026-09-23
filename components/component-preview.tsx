"use client";

import { Code2, Eye } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@fabrials/ui";
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
  return (
    <Tabs defaultValue="preview" className="docs-preview">
      <TabsList className="docs-segmented" aria-label="Example view">
        <TabsTrigger value="preview">
          <Eye aria-hidden="true" /> Preview
        </TabsTrigger>
        <TabsTrigger value="code">
          <Code2 aria-hidden="true" /> {codeLabel}
        </TabsTrigger>
      </TabsList>
      <TabsContent value="preview" className="docs-preview-stage">
        <div className="fui-preview">
          <ComponentDemo slug={slug} />
        </div>
      </TabsContent>
      <TabsContent value="code" className="docs-preview-code">
        <CodeBlock code={code} label={codeLabel} />
      </TabsContent>
    </Tabs>
  );
}
