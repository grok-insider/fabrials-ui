import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useRef, useState } from "react";
import { ZoomPan } from "@fabrials/ui";
import { ArtifactFrame, SuggestionChips, ToolCall, type ArtifactSlot, type ToolCallState } from "@fabrials/ai-ui";
import { Block, Frame, Page } from "./story-frame";

// A synthetic drawing and its source, written once: the frame shows the markup and offers it as a download.
const CHART_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="270" viewBox="0 0 480 270" style="max-width:100%;height:auto" role="img" aria-label="Sign-ups each month">
  <rect width="480" height="270" fill="none"/>
  <g stroke="#8b93a0" stroke-width="1" opacity="0.35">
    <line x1="40" y1="30" x2="460" y2="30"/>
    <line x1="40" y1="90" x2="460" y2="90"/>
    <line x1="40" y1="150" x2="460" y2="150"/>
    <line x1="40" y1="210" x2="460" y2="210"/>
  </g>
  <g fill="#2a63c4">
    <rect x="62" y="150" width="34" height="60" rx="3"/>
    <rect x="122" y="120" width="34" height="90" rx="3"/>
    <rect x="182" y="132" width="34" height="78" rx="3"/>
    <rect x="242" y="84" width="34" height="126" rx="3"/>
    <rect x="302" y="66" width="34" height="144" rx="3"/>
    <rect x="362" y="42" width="34" height="168" rx="3"/>
  </g>
  <g fill="#565d68" font-family="IBM Plex Mono, monospace" font-size="11">
    <text x="62" y="230">Jan</text>
    <text x="122" y="230">Feb</text>
    <text x="182" y="230">Mar</text>
    <text x="242" y="230">Apr</text>
    <text x="302" y="230">May</text>
    <text x="362" y="230">Jun</text>
  </g>
</svg>`;

const WIDE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="600" viewBox="0 0 1600 600" style="max-width:100%;height:auto" role="img" aria-label="A wide plan of six rooms">
  <rect width="1600" height="600" fill="none"/>
  <g fill="none" stroke="#8b93a0" stroke-width="2">
    <rect x="20" y="20" width="1560" height="560" rx="8"/>
    <line x1="540" y1="20" x2="540" y2="580"/>
    <line x1="1060" y1="20" x2="1060" y2="580"/>
    <line x1="540" y1="300" x2="1600" y2="300"/>
  </g>
  <g fill="#565d68" font-family="IBM Plex Mono, monospace" font-size="20">
    <text x="60" y="70">Hall</text>
    <text x="580" y="70">Kitchen</text>
    <text x="1100" y="70">Study</text>
    <text x="580" y="350">Store</text>
    <text x="1100" y="350">Garage</text>
  </g>
  <circle cx="270" cy="420" r="9" fill="#2a63c4"/>
  <circle cx="800" cy="180" r="9" fill="#2a63c4"/>
  <circle cx="1320" cy="180" r="9" fill="#2a63c4"/>
</svg>`;

/** The frame's child: draws the markup, offers it, and says when it is there. Renders `slot.expanded` for the suite. */
function Chart({ slot, source = CHART_SVG, testId, width }: { slot: ArtifactSlot; source?: string; testId?: string; width?: string }) {
  const ready = useRef(slot.onReady);
  const exportIt = useRef(slot.onExport);
  useEffect(() => {
    exportIt.current({ svg: () => source });
    ready.current();
  }, [source]);
  return <div dangerouslySetInnerHTML={{ __html: source }} data-expanded={slot.expanded} data-testid={testId} style={width ? { maxInlineSize: width } : undefined} />;
}

function Boom({ slot }: { slot: ArtifactSlot }): never {
  useEffect(() => slot.onReady(), [slot]);
  throw new Error("The drawing came back empty: the generator stopped after 12 tokens.");
}

function Recovery() {
  const [broken, setBroken] = useState(true);
  const source = broken ? "svg: <rect width=\"10\" height=\"10\"" : CHART_SVG;
  return (
    <div data-testid="artifact-recovery" style={{ display: "grid", gap: "var(--fui-space-3)" }}>
      <ArtifactFrame
        kind="Diagram"
        source={source}
        sourceLanguage="xml"
        title="Sign-ups"
      >
        {(slot) => (broken ? <Boom slot={slot} /> : <Chart slot={slot} />)}
      </ArtifactFrame>
      <button onClick={() => setBroken(false)} type="button">
        Change the source
      </button>
    </div>
  );
}

function InsideButton() {
  const [clicks, setClicks] = useState(0);
  return (
    <p style={{ margin: 0 }}>
      <button data-testid="inside-button" onClick={() => setClicks((count) => count + 1)} type="button">
        A control inside the drawing
      </button>{" "}
      <span data-testid="inside-clicks" style={{ fontFamily: "var(--fui-font-label)", fontSize: "var(--fui-text-label)" }}>
        {clicks}
      </span>
    </p>
  );
}

function ChipDemo({ disabled = false, items, dir }: { disabled?: boolean; items: { id: string; label: string; value?: string; lang?: string }[]; dir?: "rtl" }) {
  const [chosen, setChosen] = useState<string[]>([]);
  return (
    <div dir={dir} style={{ display: "grid", gap: "var(--fui-space-2)", inlineSize: "min(100%, 34rem)" }}>
      <SuggestionChips disabled={disabled} items={items} onSelect={(item) => setChosen((list) => [...list, item.value ?? item.label])} />
      <p data-testid="chip-log" style={{ margin: 0, color: "var(--muted-foreground)", fontFamily: "var(--fui-font-label)", fontSize: "var(--fui-text-label)" }}>
        Chosen: {chosen.length ? chosen.join(", ") : "none"}
      </p>
    </div>
  );
}

const FOLLOW_UPS = [
  { id: "quiz", label: "Quiz me", value: "quiz" },
  { id: "visual", label: "Show it visually", value: "visual" },
  { id: "simpler", label: "Simpler", value: "simpler" },
];

const TOOL_STATES: { state: ToolCallState; name: string; duration?: number }[] = [
  { state: "pending", name: "search_docs" },
  { state: "running", name: "search_docs" },
  { state: "done", name: "search_docs", duration: 1_240 },
  { state: "error", name: "read_file" },
  { state: "denied", name: "run_tests" },
];

function Bench() {
  return (
    <Page
      description="The frame of a drawing inside an answer, the viewport that zooms and pans it, a tool call in each state and the follow-up chips: fixed states for the visual suite."
      title="Artifacts"
    >
      <Block description="A plate with its title bar, the source toggle, the downloads the drawing offers and a full-screen view. Then the same frame showing its source, one that is loading with its height reserved, one still streaming, and two that failed." title="The frame">
        <Frame width={720}>
          <ArtifactFrame data-testid="artifact-ready" kind="Chart" source={CHART_SVG} sourceLanguage="xml" title="Sign-ups each month">
            {(slot) => <Chart slot={slot} testId="chart-ready" />}
          </ArtifactFrame>
          <ArtifactFrame data-testid="artifact-source" defaultView="source" kind="Diagram" source={CHART_SVG} sourceLanguage="xml" title="Room plan">
            {(slot) => <Chart slot={slot} />}
          </ArtifactFrame>
          <ArtifactFrame data-testid="artifact-loading" kind="Chart" minHeight={220} pending source={CHART_SVG} title="Retention by cohort">
            {() => null}
          </ArtifactFrame>
          <ArtifactFrame data-testid="artifact-streaming" kind="Diagram" pending source={"svg: <circle cx=\"10\""} streaming title="Drawing as it arrives">
            {() => null}
          </ArtifactFrame>
          <ArtifactFrame data-testid="artifact-error" error="Unexpected token '<' at line 3." kind="Diagram" source={"svg: <rect width=\"10\" height=\"10\""} sourceLanguage="xml" title="Floor plan">
            {() => null}
          </ArtifactFrame>
          <ArtifactFrame data-testid="artifact-throws" kind="Chart" source={CHART_SVG} sourceLanguage="xml" title="A drawing that throws">
            {(slot) => <Boom slot={slot} />}
          </ArtifactFrame>
        </Frame>
      </Block>
      <Block description="A drawing of the same size in both frames: the place is kept while it arrives, so nothing moves when it does." title="A height kept">
        <Frame width={358}>
          <ArtifactFrame data-testid="artifact-height-loading" kind="Chart" minHeight={220} pending source={CHART_SVG} title="Retention">
            {() => null}
          </ArtifactFrame>
          <ArtifactFrame data-testid="artifact-height-ready" kind="Chart" minHeight={220} source={CHART_SVG} sourceLanguage="xml" title="Retention">
            {(slot) => <Chart slot={slot} width="18rem" />}
          </ArtifactFrame>
        </Frame>
      </Block>
      <Block description="A title in Arabic, and the same frame in a 358 px pane where the lesser keys fold into one menu." title="Languages and narrow panes">
        <Frame width={720}>
          <ArtifactFrame data-testid="artifact-arabic" kind="Diagram" lang="ar" source={CHART_SVG} sourceLanguage="xml" title="خريطة الشبكة">
            {(slot) => <Chart slot={slot} />}
          </ArtifactFrame>
        </Frame>
        <Frame width={358}>
          <ArtifactFrame data-testid="artifact-narrow" kind="Chart" source={CHART_SVG} sourceLanguage="xml" title="Sign-ups in a narrow column">
            {(slot) => <Chart slot={slot} />}
          </ArtifactFrame>
        </Frame>
      </Block>
      <Block description="A failure that clears when the source changes, and the full-screen view of the same drawing." title="Recovery">
        <Frame width={480}>
          <Recovery />
        </Frame>
      </Block>
      <Block description="The same wide drawing in a plain box, which leaves the page's scroll alone, and in the interactive viewport at 100 %." title="Zoom and pan">
        <Frame width={640}>
          <ZoomPan data-testid="zoom-static" interactive={false}>
            <div dangerouslySetInnerHTML={{ __html: WIDE_SVG }} />
          </ZoomPan>
          <ZoomPan data-testid="zoom-interactive" id="zoom-interactive" label="Room plan, zoomable">
            <div style={{ position: "relative", paddingBlockEnd: "var(--fui-space-4)" }}>
              <div dangerouslySetInnerHTML={{ __html: WIDE_SVG }} />
              <div
                data-testid="zoom-marker"
                style={{ position: "absolute", insetBlockStart: "40%", insetInlineStart: "25%", inlineSize: "12px", blockSize: "12px", borderRadius: "50%", background: "var(--fui-brand, var(--brand))" }}
              />
              <InsideButton />
            </div>
          </ZoomPan>
          <ZoomPan maxScale={6} minScale={0.5} wheel="zoom">
            <div dangerouslySetInnerHTML={{ __html: CHART_SVG }} />
          </ZoomPan>
        </Frame>
      </Block>
      <Block description="Each state in words with its mark: waiting, running with its time, done with input and output, failed, and not allowed." title="Tool calls">
        <Frame width={560}>
          {TOOL_STATES.map(({ state, name, duration }) => (
            <ToolCall
              data-testid={`tool-${state}`}
              duration={duration}
              input={{ query: "refund policy", limit: 5 }}
              key={state}
              name={name}
              output={state === "done" ? { matches: 3, sources: ["billing.md", "returns.md"] } : undefined}
              error={state === "error" ? "The file was not found in the workspace." : undefined}
              state={state}
            />
          ))}
          <ToolCall defaultOpen duration={2_400} input={{ command: "bun test" }} name="run_tests" output={"18 tests passed\n0 failed"} state="done" />
        </Frame>
      </Block>
      <Block description="Follow-ups under an answer: soft tags that are buttons, one tab stop, and their long labels wrapping." title="Follow-ups">
        <Frame width={480}>
          <ChipDemo items={FOLLOW_UPS} />
          <ChipDemo disabled items={FOLLOW_UPS} />
          <ChipDemo
            items={[
              { id: "long", label: "Turn the whole explanation into a five-question quiz with the answers at the end" },
              { id: "long2", label: "Show the same thing as a diagram, with the numbers in the same order" },
              { id: "short", label: "Simpler" },
            ]}
          />
        </Frame>
        <Frame dir="rtl" width={480}>
          <ChipDemo dir="rtl" items={[{ id: "a", label: "اختبرني", value: "quiz" }, { id: "b", label: "أرنيه بصريًا", value: "visual" }, { id: "c", label: "أبسط", value: "simpler" }]} />
        </Frame>
      </Block>
    </Page>
  );
}

const meta = {
  title: "Tests/Artifacts",
  component: ArtifactFrame,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof ArtifactFrame>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Pieces: Story = { render: () => <Bench /> };
