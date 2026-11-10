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
  LinkPreviewCard,
  LinkWithPreview,
} from "../../packages/ai-ui/src/index";
import { aiStyles as aiSheet } from "./read-styles";

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
  // A tab stop only once it is measured to overflow (0.12): the server has no tab stop.
  assert.match(html, /class="fui-code-block-body" role="region" aria-label="ts code">/);
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

const aiStyles = aiSheet();

test("a code block highlights in CodePanel's tokens, heads a file with its name and marks a change", () => {
  const html = renderToStaticMarkup(
    <CodeBlock
      addedLines={[3]}
      code={"const a = 1;\nconst b = 2;\nconst c = 3;\n"}
      filename="sync.ts"
      highlightLines={[1]}
      highlightWords={["c"]}
      language="ts"
      removedLines={[2]}
      wrap
    />,
  );
  // The header leads with the language's logo, then the file's name and the language as a tag.
  assert.match(html, /<div class="fui-code-block-header"><svg aria-hidden="true" class="fui-language-icon" data-language="typescript"[^>]*><path d="[^"]+"><\/path><\/svg><span class="fui-code-block-title"><span class="fui-code-block-filename">sync\.ts<\/span><span class="fui-code-block-language">ts<\/span><\/span>/);
  assert.match(html, /class="fui-code-block-body" role="region" aria-label="sync\.ts code">/);
  assert.match(html, /data-wrap="true"/);
  assert.match(html, /<pre><code data-diff-gutter="true"><span class="fui-code-line" data-highlighted="true"><span class="fui-token-keyword">const<\/span>/);
  // A boxed name stands on its own: the c of const is not boxed.
  assert.match(html, /<span class="fui-token-variable"><mark class="fui-code-word">c<\/mark><\/span>/);
  // Changed lines are inserted and deleted text, so the change is heard as well as seen.
  assert.match(html, /<del class="fui-code-line" data-diff="removed">/);
  assert.match(html, /<ins class="fui-code-line" data-diff="added">/);
  assert.equal(html.match(/<mark class="fui-code-word">/g)?.length, 1);
  // The trailing newline is not an extra line.
  assert.equal(html.match(/class="fui-code-line"/g)?.length, 3);
  // A language it does not know is plain text, still one line per span.
  const plain = renderToStaticMarkup(<CodeBlock code={"PROCEDURE DIVISION.\nSTOP RUN."} language="cobol" />);
  assert.doesNotMatch(plain, /fui-token-/);
  assert.equal(plain.match(/class="fui-code-line"/g)?.length, 2);
  assert.equal(codeFilename("diff"), "snippet.diff");
});

test("code in an answer uses CodePanel's inks and plate; lines it draws carry their own inset, a host's keep the body's", () => {
  // No second set of syntax inks: --fui-syntax-* come from @fabrials/ui's tokens, as in CodePanel.
  assert.doesNotMatch(aiStyles, /--fui-syntax-[a-z]+\s*:/);
  assert.match(aiStyles, /:is\(\.fui-code-block, \.fui-markdown \[data-streamdown="code-block"\]\) \{[^}]*border-radius: var\(--fui-radius-plate\);[^}]*background: var\(--card\);/);
  // Its own lines sit in CodePanel's well; a host's themed lines stay on the card their theme was made for.
  assert.match(aiStyles, /\.fui-code-block-body:has\(> pre > code > \.fui-code-line\) \{\s*padding-inline: 0;\s*background: var\(--fui-code\);/);
  assert.match(aiStyles, /\.fui-code-block\[data-line-numbers\] code > span:not\(\.fui-code-line\)::before \{\s*content: counter\(fui-code-line\);/);
  assert.match(aiStyles, /\.fui-code-block\[data-wrap\] \.fui-code-line \{[^}]*white-space: pre-wrap;/);
  // Code reads left to right in a right-to-left page, in a block and inline.
  assert.match(aiStyles, /:is\(\.fui-code-block-body, \.fui-markdown \[data-streamdown="code-block-body"\]\) \{\s*direction: ltr;/);
  assert.match(aiStyles, /\.fui-markdown :is\(\[data-streamdown="inline-code"\], :not\(pre\) > code\) \{\s*direction: ltr;\s*unicode-bidi: isolate;/);
});

test("markdown styles keys, marks, task lists, footnotes and details, and leave a code block's own marks alone", () => {
  assert.match(aiStyles, /\.fui-markdown kbd \{[^}]*border-bottom-width: 2px;[^}]*font-family: var\(--fui-font-label\);/);
  assert.match(aiStyles, /\.fui-markdown mark:not\(\.fui-code-word\) \{/);
  assert.match(aiStyles, /\.fui-markdown :is\(del, s\):not\(\.fui-code-line\) \{/);
  assert.match(aiStyles, /\.fui-markdown li:is\(\.task-list-item, :has\(> input\[type="checkbox"\]\), :has\(> label > input\[type="checkbox"\]\)\) \{\s*list-style: none;/);
  assert.match(aiStyles, /\.fui-markdown \[data-footnotes\] \{[^}]*border-top: 1px solid var\(--border\);/);
  assert.match(aiStyles, /\.fui-markdown summary:focus-visible \{\s*outline: 2px solid var\(--fui-focus\);/);
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
  assert.match(open, /<ol[^>]*fui-sources-grid/);
  assert.match(open, /<li><a[^>]*fui-source-card/);
});

test("link previews fall back to the host until a loader is provided", () => {
  const plain = renderToStaticMarkup(<LinkWithPreview href="https://news.example/story">story</LinkWithPreview>);
  assert.match(plain, /<a[^>]*href="https:\/\/news.example\/story"[^>]*>story<\/a>/);
  const card = renderToStaticMarkup(
    <LinkPreviewCard meta="Source 2 · news.example" url="https://news.example/story" />,
  );
  assert.match(card, /news.example/);
  assert.match(card, /Source 2 · news.example/);
  assert.doesNotMatch(card, /fui-link-preview-image/);
});
