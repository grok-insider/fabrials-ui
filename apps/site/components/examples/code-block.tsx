"use client";

import { LanguageIcon, languageMark } from "@fabrials/ui";
import { CodeBlock } from "@fabrials/ai-ui";
import type { ExampleSet } from "./types";

const column = { width: "min(100%, 38rem)" } as const;

const RETRY = `export async function syncMailbox(id: string) {
  return withRetry(() => fetchHeaders(id), {
    attempts: 5,
    retryOn: [429, 503],
    backoff: (attempt) => Math.min(8_000, 250 * 2 ** attempt),
  });
}`;

const PYTHON = `@retry(attempts=5)
def sync_mailbox(mailbox_id: str) -> int:
    # Headers only: bodies arrive when a message is opened.
    headers = fetch_headers(mailbox_id, since=None)
    return len(headers)`;

const SQL = `select mailbox, count(*) as messages
from headers
where received_at > now() - interval '7 days'
group by mailbox
order by messages desc;`;

const CONFIG = `sync:
  schedule: "*/15 * * * *"
  mailboxes: [north, relay-staging]
  retry: { attempts: 5, on: [429, 503] }
  # Bodies are fetched when a message is opened.
  bodies: lazy`;

const CHANGE = `const response = await fetch(url);
const response = await withRetry(() => fetch(url), { attempts: 5 });
if (!response.ok) throw new SyncError(response.status);`;

const PATCH = `--- a/sync.ts
+++ b/sync.ts
@@ -12,3 +12,3 @@
-const response = await fetch(url);
+const response = await withRetry(() => fetch(url), { attempts: 5 });
 if (!response.ok) throw new SyncError(response.status);`;

const CARGO = `[package]
name = "relay-sync"
version = "0.4.0"
edition = "2024"

[dependencies]
tokio = { version = "1", features = ["rt", "time"] }`;

const CURL = `curl -X POST https://api.example.test/v1/mailboxes/north/sync --header "Authorization: Bearer $TOKEN" --data '{"since":"2026-11-01","bodies":"lazy"}'`;

const MARKS = ["ts", "js", "py", "rs", "go", "bash", "html", "css", "yaml", "toml", "md", "diff", "c", "cpp", "java", "kt", "swift", "cs", "dart", "ex", "hs", "scala", "jl", "graphql", "dockerfile", "tf", "nix", "sql", "json", "rb"];
const PLAIN: Record<string, string> = { sql: "SQL", json: "JSON", rb: "Ruby" };

function Marks() {
  return (
    <ul
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(10.5rem, 1fr))",
        gap: "var(--fui-space-2) var(--fui-space-4)",
        width: "min(100%, 38rem)",
        margin: 0,
        padding: 0,
        listStyle: "none",
        fontSize: "var(--fui-text-sm)",
      }}
    >
      {MARKS.map((language) => (
        <li key={language} style={{ display: "flex", alignItems: "center", gap: "var(--fui-space-2)" }}>
          <LanguageIcon language={language} style={{ width: "1rem", height: "1rem" }} />
          {languageMark(language)?.name ?? PLAIN[language]}
          <code style={{ color: "var(--muted-foreground)", fontSize: "var(--fui-text-label)", whiteSpace: "nowrap" }}>{language}</code>
        </li>
      ))}
    </ul>
  );
}

function Answer() {
  return (
    <div className="fui-markdown" style={column}>
      <h3>Retry the sync on a timeout</h3>
      <p>
        Wrap the fetch in <code>withRetry</code> and give it a budget: five attempts, on <code>429</code> and <code>503</code>{" "}
        only, each waiting twice as long as the one before.
      </p>
      <CodeBlock code={RETRY} filename="sync.ts" highlightLines={[3, 4]} language="ts" lineNumbers />
      <ul>
        <li>
          <label>
            <input checked disabled readOnly type="checkbox" /> Retry on 429 and 503
          </label>
        </li>
        <li>
          <label>
            <input checked disabled readOnly type="checkbox" /> Back off up to 8 seconds
          </label>
        </li>
        <li>
          <label>
            <input disabled readOnly type="checkbox" /> Log the attempt count
          </label>
        </li>
      </ul>
      <p>
        Press <kbd>Ctrl</kbd> <kbd>Enter</kbd> to run the sync again.
      </p>
    </div>
  );
}

function Notes() {
  return (
    <div className="fui-markdown" style={column}>
      <h3>Before you ship</h3>
      <p>
        Run <code>bun run check</code>, then search the logs for <mark>retry</mark>. The <del>--legacy</del> flag is gone
        <sup>
          <a aria-describedby="code-block-notes-label" data-footnote-ref href="#code-block-note-1" id="code-block-ref-1">
            1
          </a>
        </sup>
        .
      </p>
      <blockquote>
        <p>A retry is a budget, not a loop.</p>
      </blockquote>
      <table>
        <thead>
          <tr>
            <th>Status</th>
            <th>Retried</th>
            <th>Why</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>429</td>
            <td>Yes</td>
            <td>The server asked us to wait.</td>
          </tr>
          <tr>
            <td>401</td>
            <td>No</td>
            <td>Another try will not fix a key.</td>
          </tr>
        </tbody>
      </table>
      <details>
        <summary>Why bodies are lazy</summary>
        <p>Headers are enough to list and sort a mailbox; a body is fetched when a message is opened.</p>
      </details>
      <section data-footnotes>
        <h2 className="sr-only" id="code-block-notes-label">
          Footnotes
        </h2>
        <ol>
          <li id="code-block-note-1">
            <p>
              Removed in 0.4.{" "}
              <a aria-label="Back to reference 1" data-footnote-backref href="#code-block-ref-1">
                ↩
              </a>
            </p>
          </li>
        </ol>
      </section>
    </div>
  );
}

export const codeBlockExamples: ExampleSet = {
  preview: () => <Answer />,
  previewCode: `import { CodeBlock } from "@fabrials/ai-ui";

const retry = \`export async function syncMailbox(id: string) {
  return withRetry(() => fetchHeaders(id), {
    attempts: 5,
    retryOn: [429, 503],
    backoff: (attempt) => Math.min(8_000, 250 * 2 ** attempt),
  });
}\`;

// The markup a markdown renderer gives you, with CodeBlock for its code.
export function Answer() {
  return (
    <div className="fui-markdown">
      <h3>Retry the sync on a timeout</h3>
      <p>
        Wrap the fetch in <code>withRetry</code> and give it a budget: five
        attempts, on <code>429</code> and <code>503</code> only, each waiting
        twice as long as the one before.
      </p>
      <CodeBlock
        code={retry}
        filename="sync.ts"
        language="ts"
        lineNumbers
        highlightLines={[3, 4]}
      />
      <ul>
        <li>
          <label>
            <input type="checkbox" checked disabled readOnly /> Retry on 429 and
            503
          </label>
        </li>
        <li>
          <label>
            <input type="checkbox" checked disabled readOnly /> Back off up to 8
            seconds
          </label>
        </li>
        <li>
          <label>
            <input type="checkbox" disabled readOnly /> Log the attempt count
          </label>
        </li>
      </ul>
      <p>
        Press <kbd>Ctrl</kbd> <kbd>Enter</kbd> to run the sync again.
      </p>
    </div>
  );
}`,
  examples: [
    {
      id: "languages",
      title: "Highlighted like the docs",
      description:
        "`language` picks the grammar. TypeScript, JavaScript and JSX, JSON, shell, CSS, HTML, Python, Rust, Go, SQL, YAML, TOML and diffs are highlighted in the syntax inks CodePanel uses, in both themes; anything else is plain text.",
      code: `<CodeBlock code={python} language="py" />
<CodeBlock code={query} language="sql" />`,
      render: () => (
        <div style={column}>
          <CodeBlock code={PYTHON} language="py" />
          <CodeBlock code={SQL} language="sql" />
        </div>
      ),
      align: "start",
    },
    {
      id: "marks",
      title: "Every language's mark",
      description:
        "The header starts with the language's logo in its own colour, as an editor's tab shows it; CodePanel and CodeTabs show the same marks. `LanguageIcon` draws one anywhere, beside a file's name; it is decorative, so the name always goes with it. SQL and JSON have no logo of their own and get a plain glyph, as do languages whose logo cannot be shared here (Ruby, PHP). In the dark theme a black logo (Rust, Markdown, Java) takes the text's ink.",
      code: `<span className="row">
  <LanguageIcon language="py" />
  Python
</span>`,
      render: () => <Marks />,
      align: "start",
    },
    {
      id: "lines",
      title: "Point at lines and names",
      description:
        "`lineNumbers` numbers the lines, `highlightLines` tints the ones the answer talks about and `highlightWords` boxes a name wherever it stands on its own.",
      code: `<CodeBlock
  code={config}
  language="yaml"
  lineNumbers
  highlightLines={[4]}
  highlightWords={["retry"]}
/>`,
      render: () => (
        <div style={column}>
          <CodeBlock code={CONFIG} highlightLines={[4]} highlightWords={["retry"]} language="yaml" lineNumbers />
        </div>
      ),
      align: "start",
    },
    {
      id: "change",
      title: "A change",
      description:
        "`addedLines` and `removedLines` mark a change in place: the lines are inserted and deleted text, tinted, with a + or − in their own gutter. Copy and download leave the removed lines out, so what you take is the code as it ends up. A patch as the model wrote it reads as `language=\"diff\"`.",
      code: `<CodeBlock code={change} language="ts" removedLines={[1]} addedLines={[2]} />
<CodeBlock code={patch} language="diff" />`,
      render: () => (
        <div style={column}>
          <CodeBlock addedLines={[2]} code={CHANGE} language="ts" removedLines={[1]} />
          <CodeBlock code={PATCH} language="diff" />
        </div>
      ),
      align: "start",
    },
    {
      id: "file",
      title: "A file to keep",
      description:
        "`filename` heads the block with the file's name and the language as a quiet tag, names the code region for assistive technology and is the name `download` saves under. `actions` adds your own keys beside copy.",
      code: `<CodeBlock code={manifest} filename="Cargo.toml" language="toml" download />`,
      render: () => (
        <div style={column}>
          <CodeBlock code={CARGO} download filename="Cargo.toml" language="toml" />
        </div>
      ),
      align: "start",
    },
    {
      id: "wrap",
      title: "Long lines",
      description:
        "A long line scrolls sideways by default; the code is a region you can reach with Tab and scroll with the arrow keys. `wrap` folds long lines instead, each continuing under its own start, past the number.",
      code: `<CodeBlock code={command} language="bash" />
<CodeBlock code={command} language="bash" wrap lineNumbers />`,
      render: () => (
        <div style={column}>
          <CodeBlock code={CURL} language="bash" />
          <CodeBlock code={CURL} language="bash" lineNumbers wrap />
        </div>
      ),
      align: "start",
    },
    {
      id: "highlighter",
      title: "Your own highlighter",
      description:
        "Lines highlighted by Shiki, Prism or highlight.js go in as `children`, one element per line. They sit on the card, the background those themes are made for; the block keeps its frame, and copy and download still take `code`.",
      code: `<CodeBlock code={code} language="ts">
  {lines.map((line, index) => (
    <span key={index} dangerouslySetInnerHTML={{ __html: line }} />
  ))}
</CodeBlock>`,
      render: () => (
        <div style={column}>
          <CodeBlock code={'const mailbox = "north";\nawait sync(mailbox);'} language="ts">
            <span>
              <span className="fui-token-keyword">const</span> mailbox <span className="fui-token-punctuation">=</span>{" "}
              <span className="fui-token-string">&quot;north&quot;</span>
              <span className="fui-token-punctuation">;</span>
            </span>
            <span>
              <span className="fui-token-keyword">await</span> <span className="fui-token-function">sync</span>
              <span className="fui-token-punctuation">(</span>mailbox<span className="fui-token-punctuation">);</span>
            </span>
          </CodeBlock>
        </div>
      ),
      align: "start",
    },
    {
      id: "markdown",
      title: "The rest of an answer",
      description:
        "`fui-markdown` on the element that holds rendered markdown styles headings, lists and task lists, quotes, tables, inline code, keys, marked and struck text, details and footnotes, and Streamdown's output too. With react-markdown, hand its fenced code to CodeBlock. A task's box needs a name: wrap the box and the item's text in a label, as the preview above does.",
      code: `<div className="fui-markdown">
  <Markdown remarkPlugins={[remarkGfm]} components={{ pre: CodeFromMarkdown }}>
    {answer}
  </Markdown>
</div>

function CodeFromMarkdown({ children }: { children?: ReactNode }) {
  const code = children as ReactElement<{ className?: string; children: string }>;
  const language = code.props.className?.replace("language-", "");
  return <CodeBlock code={String(code.props.children)} language={language} />;
}`,
      render: () => <Notes />,
      align: "start",
    },
  ],
};
