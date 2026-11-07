import type { ReactNode } from "react";
import { CodePanel, PageHeader } from "@fabrials/ui";
import type { Example, ExampleSet } from "../apps/site/components/examples/types";
import { Prose } from "../apps/site/components/examples/prose";

/**
 * A component's page in Storybook: what it is, the component in context, then one section per way of using it, each a live
 * demo over the code that makes it. The examples are the ones ui.fabrials.com shows, from apps/site/components/examples.
 */
export function Showcase({
  eyebrow,
  title,
  description,
  set,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  set: ExampleSet;
  children?: ReactNode;
}) {
  return (
    <main className="sb-showcase">
      <PageHeader eyebrow={eyebrow} title={title} description={description} />
      {set.preview ? (
        <section aria-label="In context" className="sb-preview">
          <div className="sb-preview-stage">{set.preview()}</div>
          {set.previewCode ? <CodePanel code={set.previewCode} language="tsx" title="Code" /> : null}
        </section>
      ) : null}
      {children}
      <div className="sb-examples">
        {set.examples.map((example) => (
          <ExampleBlock example={example} key={example.id} />
        ))}
      </div>
    </main>
  );
}

export function ExampleBlock({ example }: { example: Example }) {
  const titleId = `example-${example.id}`;
  return (
    <section aria-labelledby={titleId} className="sb-example">
      <h2 className="sb-example-title" id={titleId}>
        {example.title}
      </h2>
      <p className="sb-example-description">
        <Prose text={example.description} />
      </p>
      <div className="sb-example-plate">
        <div className="sb-example-stage" data-align={example.align ?? "center"}>
          {example.render()}
        </div>
        <CodePanel code={example.code} language="tsx" title="Example" />
      </div>
    </section>
  );
}
