import { useState, type CSSProperties, type ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  ActivityDisclosure,
  AttachmentChip,
  Attachments,
  ChatComposer,
  ChatMessage,
  CitationChip,
  CitationProvider,
  CodeBlock,
  ComposerButton,
  ComposerToggle,
  CopyMessageAction,
  MessageAction,
  MessageActions,
  MessageTimestamp,
  ReasoningDisclosure,
  SearchStepsDisclosure,
  Sources,
  VoiceInputButton,
  VoiceInputButtonView,
  type AttachmentItem,
  type CitationSource,
  type SearchStep,
} from "@fabrials/ai-ui";
import "@fabrials/ai-ui/styles.css";

const meta = { title: "AI/Chat", parameters: { layout: "fullscreen" } } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

function Icon({ d }: { d: string }) {
  return (
    <svg aria-hidden fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="16">
      <path d={d} />
    </svg>
  );
}

const pencil = "M12 20h9M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4z";
const retry = "M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5";
const terminal = "m4 17 6-6-6-6M12 19h8";
const globe = "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20";
const clip = "m21 12-9 9a5 5 0 0 1-7-7l9-9a3.5 3.5 0 0 1 5 5l-9 9a2 2 0 0 1-3-3l8-8";

const sources: CitationSource[] = [
  { url: "https://docs.example.org/guides/cascade-layers", title: "Cascade layers in practice" },
  { url: "https://www.example.com/blog/2026/tokens", title: "2" },
  { url: "https://reference.example.net/css/color-mix", title: "color-mix() reference" },
  { url: "https://notes.example.io/", title: "A very long title about composing design tokens across products without leaking product policy into the shared layer" },
  { url: "https://archive.example.dev/posts/field-sizing" },
];

const steps: SearchStep[] = [
  {
    type: "search",
    query: "css cascade layers component libraries",
    sources: [
      "https://developer.example.org/docs/css/cascade-layers",
      "https://blog.example.com/2026/layers-in-design-systems",
      "https://www.example.net/articles/tailwind-v4-layer-order",
    ],
  },
  {
    type: "search",
    query: "color-mix oklab browser support 2026",
    sources: ["https://caniuse.example.com/css-color-mix", "https://developer.example.org/docs/css/color-mix"],
  },
  { type: "open_page", url: "https://docs.example.org/guides/cascade-layers" },
];

const tsCode = `type Theme = "light" | "dark";

export function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  return { theme, appliedAt: Date.now() };
}`;

const longLine = `const endpoint = "https://api.example.test/v1/really/long/path/segment/that/keeps/going/and/going/until/it/scrolls/horizontally?with=query&and=more";`;

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section aria-label={title} className="catalogue-stack" style={{ marginBottom: "2.5rem" }}>
      <h2 style={{ margin: 0, fontSize: "var(--fui-text-md)" }}>{title}</h2>
      {children}
    </section>
  );
}

function Frame({ children }: { children: ReactNode }) {
  return <main className="catalogue" style={{ maxWidth: "48rem" }}>{children}</main>;
}

function MarkdownDemo() {
  return (
    <div className="fui-markdown">
      <h2>Layered styles</h2>
      <p>
        Shared components live in the <code>components</code> layer
        <CitationChip href={sources[0]!.url} number={1} /> and hosts override after them
        <CitationChip href={sources[2]!.url} number={3} />. Read the <a href="https://example.com">design notes</a>.
      </p>
      <ol>
        <li>Import tokens once.</li>
        <li>
          Import component styles.
          <ul>
            <li>Nested items keep their own markers.</li>
          </ul>
        </li>
      </ol>
      <blockquote>
        <p>Color always has a text or symbol companion.</p>
      </blockquote>
      <CodeBlock code={tsCode} download language="ts">
        <span><span className="fui-token-keyword">type</span> <span className="fui-token-type">Theme</span> <span className="fui-token-punctuation">=</span> <span className="fui-token-string">&quot;light&quot;</span> <span className="fui-token-punctuation">|</span> <span className="fui-token-string">&quot;dark&quot;</span><span className="fui-token-punctuation">;</span></span>
        <span />
        <span><span className="fui-token-keyword">export function</span> <span className="fui-token-function">applyTheme</span><span className="fui-token-punctuation">(</span>theme<span className="fui-token-punctuation">:</span> <span className="fui-token-type">Theme</span><span className="fui-token-punctuation">) {"{"}</span></span>
        <span>  <span className="fui-token-comment">{"// toggles the root class"}</span></span>
        <span>  document.documentElement.classList.<span className="fui-token-function">toggle</span>(<span className="fui-token-string">&quot;dark&quot;</span>, theme <span className="fui-token-punctuation">===</span> <span className="fui-token-string">&quot;dark&quot;</span>);</span>
        <span>  <span className="fui-token-keyword">return</span> {"{"} theme, appliedAt: <span className="fui-token-number">0</span> {"}"};</span>
        <span>{"}"}</span>
      </CodeBlock>
      <h3>Numbers</h3>
      <table>
        <thead>
          <tr><th>Surface</th><th>Width</th><th>Controls</th><th>Notes</th></tr>
        </thead>
        <tbody>
          <tr><td>Phone</td><td>390</td><td>44px</td><td>Coarse pointer targets stay large.</td></tr>
          <tr><td>Desktop</td><td>1440</td><td>40px</td><td>Actions reveal on hover and focus.</td></tr>
        </tbody>
      </table>
      <CodeBlock code={longLine} language="js" lineNumbers />
      <pre><code>plain fenced block without a header</code></pre>
    </div>
  );
}

export const MarkdownAndCode: Story = {
  render: () => (
    <Frame>
      <CitationProvider sources={sources}>
        <MarkdownDemo />
      </CitationProvider>
    </Frame>
  ),
};

function StreamdownFixture() {
  const token = (text: string, light: string, dark: string) => (
    <span style={{ "--sdm-c": light, "--shiki-dark": dark } as CSSProperties}>{text}</span>
  );
  return (
    <div className="fui-markdown">
      <p>
        Streamdown output with <span data-streamdown="strong">data attributes</span> and{" "}
        <code data-streamdown="inline-code">inline code</code>.
      </p>
      <div data-language="py" data-streamdown="code-block">
        <div data-language="py" data-streamdown="code-block-header"><span>py</span></div>
        <div>
          <div data-streamdown="code-block-actions">
            <button aria-label="Download code" type="button"><Icon d="M12 15V3M7 10l5 5 5-5M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /></button>
            <button aria-label="Copy code" type="button"><Icon d="M8 8h14v14H8zM4 16V4h12" /></button>
          </div>
        </div>
        <div data-streamdown="code-block-body">
          <pre><code>
            <span>{token("def", "#8a3ffc", "#c9a2ff")} {token("greet", "#0f62fe", "#78a9ff")}(name): </span>
            <span>    {token("return", "#8a3ffc", "#c9a2ff")} {token('f"hello {name}"', "#198038", "#6fdc8c")}</span>
          </code></pre>
        </div>
      </div>
      <div data-streamdown="table-wrapper">
        <div>
          <button aria-label="Copy table" type="button"><Icon d="M8 8h14v14H8zM4 16V4h12" /></button>
        </div>
        <div>
          <table data-streamdown="table">
            <thead data-streamdown="table-header"><tr data-streamdown="table-row"><th data-streamdown="table-header-cell">Model</th><th data-streamdown="table-header-cell">Latency</th></tr></thead>
            <tbody data-streamdown="table-body"><tr data-streamdown="table-row"><td data-streamdown="table-cell">Example A</td><td data-streamdown="table-cell">120 ms</td></tr><tr data-streamdown="table-row"><td data-streamdown="table-cell">Example B</td><td data-streamdown="table-cell">95 ms</td></tr></tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export const StreamdownOutput: Story = { render: () => <Frame><StreamdownFixture /></Frame> };

export const CitationsAndSources: Story = {
  render: () => (
    <Frame>
      <Section title="Linked chips and cards">
        <CitationProvider sources={sources}>
          <div className="fui-markdown">
            <p>
              Hover a number to preview its source and highlight the matching card
              <CitationChip href={sources[0]!.url} number={1} />
              <CitationChip href={sources[1]!.url} number={2} />
              <CitationChip href={sources[3]!.url} number={4} />.
            </p>
          </div>
          <Sources defaultOpen sources={sources} />
        </CitationProvider>
      </Section>
      <Section title="Collapsed, single source">
        <Sources sources={[sources[2]!]} />
      </Section>
      <Section title="Host favicon resolver">
        <Sources faviconUrl={() => "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Crect width='16' height='16' rx='3' fill='%234f7cc9'/%3E%3C/svg%3E"} sources={sources.slice(0, 3)} />
      </Section>
    </Frame>
  ),
};

export const Activity: Story = {
  render: () => (
    <Frame>
      <Section title="Reasoning">
        <ReasoningDisclosure streaming>
          <div className="fui-markdown">
            <p>Comparing the two layer orders before choosing one.</p>
          </div>
        </ReasoningDisclosure>
        <ReasoningDisclosure durationSeconds={4}>
          <div className="fui-markdown">
            <p>The host imports tokens first, then shared components, then overrides.</p>
          </div>
        </ReasoningDisclosure>
        <ReasoningDisclosure defaultOpen={false} streaming />
      </Section>
      <Section title="Search">
        <SearchStepsDisclosure phase="searching" steps={steps.slice(0, 1)} />
        <SearchStepsDisclosure phase="reading" sourceCount={5} steps={steps} />
        <SearchStepsDisclosure defaultOpen phase="done" sourceCount={5} steps={steps} />
        <SearchStepsDisclosure phase="done" sourceCount={0} />
      </Section>
      <Section title="Generic">
        <ActivityDisclosure icon={<Icon d={terminal} />} label="Working it out…" live />
        <ActivityDisclosure icon={<Icon d={terminal} />} label="Ran a calculation" live={false} />
      </Section>
    </Frame>
  ),
};

const files: AttachmentItem[] = [
  { id: "1", name: "moonlight.png", mediaType: "image/png", size: 248_000, url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 4 3'%3E%3Crect width='4' height='3' fill='%23304a7a'/%3E%3Ccircle cx='3' cy='1' r='.6' fill='%23dfe8ff'/%3E%3C/svg%3E" },
  { id: "2", name: "quarterly-report-with-a-very-long-filename-final-v3.pdf", mediaType: "application/pdf", size: 3_400_000 },
  { id: "3", name: "notes.md", mediaType: "text/markdown", size: 1_200, status: "uploading" },
  { id: "4", name: "interview.mov", mediaType: "video/quicktime", status: "error", error: "Larger than 50 MB" },
];

function AttachmentsDemo() {
  const [items, setItems] = useState(files);
  const remove = (id: string) => setItems((current) => current.filter((item) => item.id !== id));
  return (
    <Frame>
      <Section title="Inline">
        <Attachments empty="No attachments" items={items} onRemove={remove} />
      </Section>
      <Section title="Grid">
        <Attachments items={items} onRemove={remove} variant="grid" />
      </Section>
      <Section title="List">
        <Attachments items={items} onRemove={remove} variant="list" />
      </Section>
      <Section title="Read-only chip">
        <AttachmentChip item={files[1]!} />
      </Section>
    </Frame>
  );
}

export const AttachmentStates: Story = { render: () => <AttachmentsDemo /> };

export const VoiceInput: Story = {
  render: () => (
    <Frame>
      <Section title="States">
        <div className="catalogue-row" style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
          <VoiceInputButtonView status="idle" />
          <VoiceInputButtonView status="requesting" />
          <VoiceInputButtonView elapsedMs={14_000} level={0.6} maxDurationMs={120_000} status="recording" />
          <VoiceInputButtonView status="transcribing" />
          <VoiceInputButtonView error="Microphone access is blocked." status="error" />
          <VoiceInputButtonView disabled status="idle" />
        </div>
      </Section>
      <Section title="Live (uses the browser microphone; the transcript is synthetic)">
        <VoiceInputButton
          maxDurationMs={10_000}
          onRecorded={async (blob) => `Recorded ${Math.round(blob.size / 1024)} KB of audio.`}
          onTranscript={() => {}}
          showLevel
        />
      </Section>
    </Frame>
  ),
};

function Actions({ user, latest, copy }: { user?: boolean; latest?: boolean; copy: string }) {
  return (
    <MessageActions>
      <CopyMessageAction text={copy} />
      {user ? (
        <MessageAction label="Edit">
          <Icon d={pencil} />
        </MessageAction>
      ) : null}
      {latest ? (
        <MessageAction label="Retry">
          <Icon d={retry} />
        </MessageAction>
      ) : null}
      <MessageTimestamp dateTime="2026-09-26T10:42:00Z" detail="Sep 26, 2026, 10:42" label="10:42" />
    </MessageActions>
  );
}

function Transcript() {
  return (
    <CitationProvider sources={sources.slice(0, 2)}>
      <div className="catalogue-stack" style={{ gap: "1.5rem" }}>
        <ChatMessage actions={<Actions copy="How should hosts import the shared styles?" user />} from="user">
          How should hosts import the shared styles?
        </ChatMessage>
        <ChatMessage actions={<Actions copy="Import tokens, fonts and styles once." latest />} from="assistant" pinActions>
          <SearchStepsDisclosure phase="done" sourceCount={2} steps={steps.slice(0, 2)} />
          <ReasoningDisclosure durationSeconds={3}>
            <p>Check the migration notes first.</p>
          </ReasoningDisclosure>
          <div className="fui-markdown">
            <p>
              Import tokens, fonts and styles once, in that order
              <CitationChip href={sources[0]!.url} number={1} />. Tailwind hosts add the bridge last
              <CitationChip href={sources[1]!.url} number={2} />.
            </p>
          </div>
          <Sources sources={sources.slice(0, 2)} />
        </ChatMessage>
        <ChatMessage from="user">
          {"A much longer message that wraps across several lines to show that the bubble caps its width and keeps long unbroken strings like https://example.com/a/really/long/path/that/should/wrap inside."}
        </ChatMessage>
      </div>
    </CitationProvider>
  );
}

export const Messages: Story = { render: () => <Frame><Transcript /></Frame> };

function ComposerDemo({ initialStatus = "ready" as const }: { initialStatus?: "ready" | "submitting" | "streaming" }) {
  const [value, setValue] = useState("");
  const [status, setStatus] = useState<"ready" | "submitting" | "streaming">(initialStatus);
  const [search, setSearch] = useState(true);
  const [items, setItems] = useState(files.slice(0, 2));
  const [sent, setSent] = useState<string[]>([]);
  return (
    <div className="catalogue-stack">
      <ChatComposer
        attachments={items.length ? <Attachments items={items} onRemove={(id) => setItems((c) => c.filter((f) => f.id !== id))} /> : undefined}
        label="Message the assistant"
        onRemoveLastAttachment={() => setItems((c) => c.slice(0, -1))}
        onStop={() => setStatus("ready")}
        onSubmit={(text) => {
          setSent((c) => [...c, text]);
          setValue("");
          setStatus("streaming");
        }}
        onValueChange={setValue}
        placeholder="Ask anything"
        status={status}
        tools={
          <>
            <ComposerButton icon={<Icon d={clip} />} label="Attach files" onClick={() => {}} tooltip="Attach files" />
            <ComposerToggle icon={<Icon d={globe} />} label="Web search" onPressedChange={setSearch} pressed={search} tooltip={search ? "Web search on" : "Web search off"}>
              Search
            </ComposerToggle>
          </>
        }
        trailing={<VoiceInputButtonView status="idle" />}
        value={value}
      />
      {sent.length ? <p className="fb-muted">Sent: {sent.join(" · ")}</p> : null}
    </div>
  );
}

export const Composer: Story = {
  render: () => (
    <Frame>
      <Section title="Ready">
        <ComposerDemo />
      </Section>
      <Section title="Streaming">
        <ComposerDemo initialStatus="streaming" />
      </Section>
      <Section title="Uploading and disabled">
        <ChatComposer onSubmit={() => {}} status="submitting" value="Waiting for uploads" />
        <ChatComposer disabled onSubmit={() => {}} placeholder="Read-only conversation" />
      </Section>
    </Frame>
  ),
};
