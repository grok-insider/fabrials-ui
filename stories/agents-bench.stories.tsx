import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, Progress, ScrambleText, ShimmerText, Spinner, WorkingLight } from "@fabrials/ui";
import {
  AgentMark,
  AgentThinking,
  Attachments,
  ChatComposer,
  ChatMessage,
  ContextMeter,
  GenerationFrame,
  SearchStepsDisclosure,
  SourceTally,
  TaskList,
} from "@fabrials/ai-ui";
import { Block, Frame, Page } from "./story-frame";
import { PHOTOS } from "./media-fixtures";

// Every agent piece in fixed states, for the visual suite: no replay, and the times count from a clock the test fixes.
function Bench() {
  const started = Date.now() - 2_800;
  return (
    <Page description="Every agent piece in fixed states: marks, the plan, research, the composer at work, uploads, a picture being made and the context window." title="Agents">
      <Block title="Thinking" description="Three marks in the working light, the ink tone, a still label without time, and the mark alone.">
        <Frame>
          <div style={{ display: "grid", gap: "var(--fui-space-2)" }}>
            <AgentThinking startedAt={started} variant="wave" />
            <AgentThinking label="Searching the docs" startedAt={started} variant="orbit" />
            <AgentThinking label="Rendering" startedAt={started} variant="dither" />
            <AgentThinking label="Indexing the mailbox" startedAt={started - 72_000} tone="ink" />
            <AgentThinking label="Queued" shimmer={false} timer={false} />
            <span style={{ display: "inline-flex", alignItems: "center", gap: "var(--fui-space-2)" }}>
              <AgentMark variant="orbit" /> Release notes
            </span>
          </div>
        </Frame>
      </Block>
      <Block title="Each kind of work" description="The mark of each activity in its still frame, then a line settled on a tick and one on a cross, and a plan whose running step is a search.">
        <Frame width={480}>
          <div style={{ display: "grid", gap: "var(--fui-space-2)" }}>
            {(["thinking", "searching", "reading", "writing", "running", "rendering", "uploading"] as const).map((activity) => (
              <AgentThinking activity={activity} key={activity} startedAt={started} />
            ))}
            <AgentThinking activity="searching" endedAt={started + 12_000} label="Searched 12 sources" startedAt={started} status="done" />
            <AgentThinking activity="running" endedAt={started + 41_000} label="The tests failed" startedAt={started} status="failed" />
            <span style={{ display: "inline-flex", alignItems: "center", gap: "var(--fui-space-3)" }}>
              <AgentMark outcome="done" /> <AgentMark outcome="failed" /> <AgentMark tone="ink" variant="type" />
            </span>
            <TaskList
              label="Research plan"
              tasks={[
                { id: "a", title: "Read the issue", status: "done", activity: "reading" },
                { id: "b", title: "Search the changelog", status: "running", activity: "searching" },
                { id: "c", title: "Write the answer", status: "pending", activity: "writing" },
              ]}
            />
          </div>
        </Frame>
      </Block>
      <Block title="A plan" description="Every state, a detail and a reading, and the header's count and bar.">
        <Frame width={480}>
          <TaskList
            tasks={[
              { id: "a", title: "Read the billing schema", status: "done", meta: "0.9s" },
              { id: "b", title: "Copy 48,210 invoices", status: "running", detail: "Batch 7 of 12" },
              { id: "c", title: "Upload the coverage", status: "failed", detail: "The token expired. Sign in again." },
              { id: "d", title: "Update the changelog", status: "skipped" },
              { id: "e", title: "Tag the release", status: "pending" },
            ]}
            title="Release 0.11"
          />
        </Frame>
      </Block>
      <Block title="Research" description="Done and open, with the sources of each search stacked beside its count.">
        <Frame width={520}>
          <SearchStepsDisclosure
            defaultOpen
            phase="done"
            sourceCount={4}
            steps={[
              { type: "search", query: "pg_repack locks during swap", sources: ["https://reorg.github.io/pg_repack/", "https://github.com/reorg/pg_repack/issues"] },
              { type: "search", query: "postgres lock queue", sources: ["https://www.postgresql.org/docs/current/explicit-locking.html", "https://wiki.postgresql.org/wiki/Lock_Monitoring"] },
              { type: "open_page", url: "https://www.postgresql.org/docs/current/sql-altertable.html", title: "ALTER TABLE" },
            ]}
          />
        </Frame>
      </Block>
      <Block title="The composer at work" description="Streaming with the working light, and files uploading in 56 px tiles.">
        <Frame width={560}>
          <div style={{ display: "grid", gap: "var(--fui-space-6)", padding: "var(--fui-space-3)" }}>
            <ChatComposer onStop={() => {}} onSubmit={() => {}} placeholder="Ask a follow-up" status="streaming" />
            <ChatComposer
              attachments={
                <Attachments
                  items={[
                    { id: "p", name: "harbour.png", mediaType: "image/png", size: 248_000, url: PHOTOS[0]!.src, status: "ready", progress: 1 },
                    { id: "s", name: "invoices-q3.xlsx", mediaType: "application/vnd.ms-excel", size: 1_240_000, status: "uploading", progress: 0.64 },
                    { id: "n", name: "notes.pdf", mediaType: "application/pdf", size: 96_000, status: "uploading", progress: 0.18 },
                  ]}
                  onRemove={() => {}}
                  size="sm"
                  variant="grid"
                />
              }
              onSubmit={() => {}}
              value="Compare these with last quarter"
            />
          </div>
        </Frame>
      </Block>
      <Block title="Uploads" description="Tiles, chips and rows: counting, ready and failed.">
        <Frame>
          <div style={{ display: "grid", gap: "var(--fui-space-4)" }}>
            <Attachments
              items={[
                { id: "a", name: "invoices-q3.xlsx", mediaType: "application/vnd.ms-excel", size: 1_240_000, status: "uploading", progress: 0.36 },
                { id: "b", name: "notes.pdf", mediaType: "application/pdf", size: 96_000, status: "ready" },
                { id: "c", name: "scan.tiff", mediaType: "image/tiff", status: "error", error: "Too large: the limit is 20 MB" },
              ]}
              onRemove={() => {}}
              variant="grid"
            />
            <Attachments items={[{ id: "d", name: "invoices-q3.xlsx", mediaType: "application/vnd.ms-excel", size: 1_240_000, status: "uploading", progress: 0.36 }]} onRemove={() => {}} />
          </div>
        </Frame>
      </Block>
      <Block title="A picture being made" description="Generating with a known percentage, done, and failed with what to do.">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 14rem), 1fr))", gap: "var(--fui-space-6)" }}>
          <GenerationFrame alt="A harbour at dusk" progress={0.42} status="generating" />
          <GenerationFrame alt="Orchard terraces" caption="orchard, north side" src={PHOTOS[1]!.src} status="done" />
          <GenerationFrame alt="A portrait" error={<Button size="sm" variant="outline">Edit the prompt</Button>} status="failed" />
        </div>
      </Block>
      <Block title="Context" description="A quarter full with its legend, then past the warning and the danger thresholds.">
        <Frame width={420}>
          <div style={{ display: "grid", gap: "var(--fui-space-5)" }}>
            <ContextMeter
              limit={200_000}
              parts={[
                { label: "System prompt", value: 3_200 },
                { label: "Tools", value: 11_800 },
                { label: "Files", value: 18_400 },
                { label: "Conversation", value: 8_700 },
              ]}
            />
            <ContextMeter legend={false} limit={200_000} parts={[{ label: "Files", value: 98_000 }, { label: "Conversation", value: 69_000 }]} />
            <ContextMeter label="Almost full" legend={false} limit={200_000} parts={[{ label: "Files", value: 121_000 }, { label: "Conversation", value: 72_400 }]} />
          </div>
        </Frame>
      </Block>
      <Block title="Busy, searching and words at work" description="The five busy marks, a search's strip and its sources, a label read letter by letter, a scramble at rest and an answer arriving with its caret.">
        <Frame width={520}>
          <div style={{ display: "grid", gap: "var(--fui-space-4)" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "var(--fui-space-5)" }}>
              {(["ring", "dots", "bars", "grid", "line"] as const).map((variant) => (
                <Spinner key={variant} label={`Loading (${variant})`} variant={variant} />
              ))}
            </span>
            <Progress aria-label="Searching the docs" variant="scan" />
            <SourceTally
              sources={[
                "https://www.postgresql.org/docs/current/sql-altertable.html",
                "https://wiki.postgresql.org/wiki/Lock_Monitoring",
                "https://reorg.github.io/pg_repack/",
                "https://docs.example.org/guides/zero-downtime",
              ]}
            />
            <ShimmerText as="span" tone="light" variant="letters">
              Reading the release notes
            </ShimmerText>
            <ScrambleText>Comparing the two migrations</ScrambleText>
            <ChatMessage from="assistant" streaming>
              <div className="fui-markdown">
                <p>Import the tokens, the fonts and the styles once, in that order</p>
              </div>
            </ChatMessage>
          </div>
        </Frame>
      </Block>
      <Block title="Pictures and pages being made" description="Refine and scan at rest, and a page half written, with a known progress and without one.">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 12rem), 1fr))", gap: "var(--fui-space-6)" }}>
          <GenerationFrame alt="A harbour at dusk" effect="refine" startedAt={started} status="generating" />
          <GenerationFrame alt="A harbour at dusk" effect="scan" progress={0.62} status="generating" />
          <GenerationFrame alt="Release notes" aspectRatio="3 / 4" kind="document" startedAt={started} status="generating" />
          <GenerationFrame alt="Release notes" aspectRatio="3 / 4" kind="document" progress={0.35} status="generating" />
        </div>
      </Block>
      <Block title="Working light" description="On a plate and in a label; still under reduced motion.">
        <Frame width={420}>
          <div style={{ position: "relative", padding: "var(--fui-space-5)", border: "1px solid var(--border)", borderRadius: "var(--fui-radius-plate)", background: "var(--card)" }}>
            <ShimmerText tone="light">Summarising 14 messages</ShimmerText>
            <WorkingLight />
          </div>
        </Frame>
      </Block>
    </Page>
  );
}

const meta = {
  title: "Tests/Agents",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Pieces: Story = { render: () => <Bench /> };
