"use client";

import { Tab, Tabs } from "fumadocs-ui/components/tabs";
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
    <Tabs items={["Preview", codeLabel]}>
      <Tab value="Preview">
        <ComponentDemo slug={slug} />
      </Tab>
      <Tab value={codeLabel}>
        <CodeBlock code={code} label={codeLabel} />
      </Tab>
    </Tabs>
  );
}
