import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import {
  CitationChip,
  CitationProvider,
  CodeBlock,
  SourceCard,
  SourceFavicon,
  Sources,
  codeFilename,
  hostnameFromUrl,
  sourceLabel,
  sourcePath,
  sourcesLabel,
} from "../../packages/ai-ui/src/index";

test("code block renders language, one line per span and accessible actions", () => {
  const html = renderToStaticMarkup(
    <CodeBlock code={"const a = 1;\nconsole.log(a);\n"} download language="ts" lineNumbers />,
  );
  assert.match(html, /class="fui-code-block"/);
  assert.match(html, /data-language="ts"/);
  assert.match(html, /data-line-numbers="true"/);
  assert.match(html, /fui-code-block-language">ts</);
  assert.equal(html.match(/class="fui-code-line"/g)?.length, 2);
  assert.match(html, /aria-label="Copy code"/);
  assert.match(html, /aria-label="Download file"/);
  assert.match(html, /role="region" aria-label="ts code" tabindex="0"/);
});

test("code block accepts highlighted children and hides optional actions", () => {
  const html = renderToStaticMarkup(
    <CodeBlock code="x" copyable={false}>
      <span>
        <span className="fui-token-keyword">let</span>
      </span>
    </CodeBlock>,
  );
  assert.match(html, /fui-token-keyword/);
  assert.doesNotMatch(html, /Copy code/);
  assert.doesNotMatch(html, /Download file/);
  assert.match(html, /fui-code-block-language">text</);
  assert.equal(codeFilename("TypeScript"), "snippet.ts");
  assert.equal(codeFilename(undefined, "answer"), "answer.txt");
});

test("source helpers fall back to the host for numeric titles", () => {
  assert.equal(hostnameFromUrl("https://www.example.com/a"), "example.com");
  assert.equal(hostnameFromUrl("not a url"), "not a url");
  assert.equal(sourceLabel({ url: "https://example.com/x", title: "3" }), "example.com");
  assert.equal(sourceLabel({ url: "https://example.com/x", title: " Docs " }), "Docs");
  assert.equal(sourcePath("https://example.com/guide/%C3%A9t%C3%A9/"), "/guide/été");
  assert.equal(sourcesLabel(1), "1 source");
  assert.equal(sourcesLabel(4), "4 sources");
});

test("favicons are opt-in and fall back to a letter tile", () => {
  const letter = renderToStaticMarkup(<SourceFavicon url="https://docs.example.org/page" />);
  assert.match(letter, /fui-source-favicon-letter/);
  assert.match(letter, />D</);
  assert.doesNotMatch(letter, /google/);
  const image = renderToStaticMarkup(
    <SourceFavicon faviconUrl={(url) => `/icons?u=${encodeURIComponent(url)}`} url="https://a.test" />,
  );
  assert.match(image, /<img[^>]+src="\/icons\?u=https%3A%2F%2Fa.test"/);
});

test("citation chip names its source and reads provider data", () => {
  const html = renderToStaticMarkup(
    <CitationProvider sources={[{ url: "https://example.com/a", title: "Example guide" }]}>
      <p>
        Claim
        <CitationChip href="https://example.com/a" number={1} />
      </p>
    </CitationProvider>,
  );
  assert.match(html, /aria-label="Source 1: Example guide"/);
  assert.match(html, /data-citation="1"/);
  assert.match(html, /class="fui-citation-chip"/);
  assert.match(html, /rel="noreferrer"/);
});

test("source card shows number, label and secondary line; active is reflected", () => {
  const html = renderToStaticMarkup(
    <SourceCard active number={2} url="https://example.com/docs/start" />,
  );
  assert.match(html, /data-active="true"/);
  assert.match(html, /aria-label="Source 2"/);
  assert.match(html, /fui-source-title">example.com</);
  assert.match(html, /fui-source-meta">\/docs\/start</);
});

test("sources render a collapsed count trigger and nothing when empty", () => {
  assert.equal(renderToStaticMarkup(<Sources sources={[]} />), "");
  const html = renderToStaticMarkup(
    <Sources
      sources={[
        { url: "https://a.test/1", title: "First" },
        { url: "https://b.test/2" },
      ]}
    />,
  );
  assert.match(html, /2 sources/);
  assert.match(html, /aria-expanded="false"/);
  assert.equal(html.match(/fui-sources-preview-item/g)?.length, 2);
  const open = renderToStaticMarkup(
    <Sources defaultOpen sources={[{ url: "https://a.test/1", title: "First" }]} />,
  );
  assert.match(open, /aria-expanded="true"/);
  assert.match(open, /fui-source-card/);
  assert.match(open, /First/);
});
