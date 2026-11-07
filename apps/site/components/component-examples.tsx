"use client";

import { exampleSets } from "@/components/examples";
import { Prose } from "@/components/examples/prose";
import { CodeBlock } from "@/components/code-block";

/** One section per way of using a component: what it is for, the live demo, and the code that makes it. */
export function ComponentExamples({ slug }: { slug: string }) {
  const set = exampleSets[slug];
  if (!set) return null;
  return (
    <div className="docs-examples">
      {set.examples.map((example) => (
        <section className="docs-example" aria-labelledby={`example-${example.id}`} key={example.id}>
          <h3 className="docs-heading docs-example-title" id={`example-${example.id}`}>
            <a className="docs-heading-anchor" href={`#example-${example.id}`}>
              {example.title}
            </a>
          </h3>
          <p>
            <Prose text={example.description} />
          </p>
          <div className="docs-example-plate">
            <div className="docs-example-stage" data-align={example.align ?? "center"}>
              {example.render()}
            </div>
            <CodeBlock code={example.code} label="Example" language="tsx" />
          </div>
        </section>
      ))}
    </div>
  );
}
