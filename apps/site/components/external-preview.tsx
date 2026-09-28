"use client";

import { Code2, Eye } from "lucide-react";
import {
  CodePanel,
  CodeTabs,
  StatePanel,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@fabrials/ui";
import { externalPreviews } from "@/components/external/previews";

/** Preview of a component from another library, next to the exact source people install. */
export function ExternalPreview({
  slug,
  files,
  credit,
}: {
  slug: string;
  /** Each file as it lands in the app: its path there and its content. */
  files: { path: string; code: string }[];
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
          {files.length === 1 ? (
            <CodePanel code={files[0]!.code} title={files[0]!.path} language={extension(files[0]!.path)} lineNumbers />
          ) : (
            <CodeTabs
              label="Files"
              items={files.map((file) => ({
                value: file.path,
                label: file.path.split("/").pop(),
                code: file.code,
                language: extension(file.path),
                lineNumbers: true,
              }))}
            />
          )}
        </TabsContent>
      </Tabs>
      <p className="docs-preview-credit">{credit}</p>
    </>
  );
}

const extension = (path: string) => path.split(".").pop();
