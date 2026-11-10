import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  ActionBar,
  Alert,
  AlertDescription,
  AlertTitle,
  badgeVariants,
  Button,
  ChartLegend,
  ColorRamp,
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldSeparator,
  FieldTitle,
  Input,
  LabelsProvider,
  LegendItem,
  Slider,
  SliderGroup,
  Swatch,
  Textarea,
  Toggle,
  useField,
} from "@fabrials/ui";
import { GenerationFrame } from "@fabrials/ai-ui";
import { Block, Frame, Page } from "./story-frame";
import { PHOTOS } from "./media-fixtures";

const stack = { display: "grid", gap: "var(--fui-space-3)", gridTemplateColumns: "minmax(0, 1fr)" } as const;
const row = { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "var(--fui-space-3)" } as const;
const nothing = () => {};

const line = (length: number, word = "word") => Array.from({ length }, () => word).join(" ");

/** An alert whose retry takes a moment and whose words change when it settles: the bench's one piece that is not still. */
function RetryAlert({ retrying = false }: { retrying?: boolean }) {
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState(false);
  const retry = () => {
    setBusy(true);
    return new Promise<void>((resolve) => {
      window.setTimeout(() => {
        setAttempt((current) => current + 1);
        setBusy(false);
        resolve();
      }, 700);
    });
  };
  return (
    <Alert
      data-attempt={attempt}
      data-testid="retry-alert"
      onRetry={retry}
      retrying={retrying || busy || undefined}
      variant="warning"
    >
      <AlertTitle>The relay did not answer</AlertTitle>
      <AlertDescription>
        {attempt === 0
          ? "Nothing was lost. The request can be sent again."
          : `Attempt ${attempt + 1} did not reach the relay either. The request is still kept.`}
      </AlertDescription>
    </Alert>
  );
}

/** A legend a host can work: each key toggles its series, and "Only" leaves the rest off. */
function ToggleableLegend() {
  const [shown, setShown] = useState<Record<string, boolean>>({ requests: true, errors: false, p95: true });
  return (
    <ChartLegend data-testid="legend">
      <LegendItem color="var(--chart-1)" hidden={!shown.requests} label="Requests" onToggle={() => setShown({ ...shown, requests: !shown.requests })} />
      <LegendItem
        color="var(--destructive)"
        hidden={!shown.errors}
        label="Errors"
        onOnly={() => setShown({ requests: false, errors: true, p95: false })}
        onToggle={() => setShown({ ...shown, errors: !shown.errors })}
        pattern="dashed"
      />
      <LegendItem
        color="var(--brand)"
        hidden={!shown.p95}
        label="P95"
        onToggle={() => setShown({ ...shown, p95: !shown.p95 })}
        pattern="dither"
      />
    </ChartLegend>
  );
}

/** The parts of a field, wired through the field's own ids. */
function PartsEmail() {
  const field = useField();
  return (
    <>
      <FieldLabel required>Work email</FieldLabel>
      <FieldContent>
        <Input aria-describedby={field.describedBy} aria-invalid={field.invalid || undefined} defaultValue="ops@example.org" id={field.id} />
        <FieldDescription>We only write when a deployment fails.</FieldDescription>
      </FieldContent>
      <FieldError>That address is not reachable.</FieldError>
    </>
  );
}

/** A group of sliders whose names and values line up; every commit is counted, so a drag is one commit and not twenty. */
function SliderPanel() {
  const [commits, setCommits] = useState(0);
  return (
    <div style={stack}>
      <SliderGroup data-testid="slider-group">
        <Slider label="Rows" max={48} min={4} onValueCommitted={() => setCommits((n) => n + 1)} unit="rows" defaultValue={12} />
        <Slider label="Columns" max={12} min={1} onValueCommitted={() => setCommits((n) => n + 1)} unit="cols" defaultValue={4} />
        <Slider label="Gutter" max={32} min={0} onValueCommitted={() => setCommits((n) => n + 1)} step={2} unit="px" defaultValue={8} />
        <Slider disabled label="Radius" max={24} min={0} unit="px" defaultValue={6} />
      </SliderGroup>
      <output className="fui-count" data-testid="slider-commits">
        {commits} committed
      </output>
    </div>
  );
}

function Bench() {
  return (
    <Page
      description="A notice that can ask again, a count under a field, the parts of a field, sliders in a panel, a legend of the host's own, a key that stays on, and what a finished picture offers."
      title="Controls 0.12"
    >
      <Block title="A notice that can ask again" description="Idle and busy. A promise from the retry keeps the key busy until it settles; the notice's own live region reads the new words.">
        <Frame width={520}>
          <div style={stack}>
            <RetryAlert />
            <RetryAlert retrying />
            <Alert tone="danger">
              <AlertTitle>The daily allowance is spent</AlertTitle>
              <AlertDescription>Nothing was sent again: it cannot help today. Your work is kept, and the allowance returns at midnight.</AlertDescription>
            </Alert>
          </div>
        </Frame>
      </Block>
      <Block title="Tone beside variant" description="The same five looks under the names 0.12 uses for status: each pair is one notice drawn twice.">
        <Frame width={520}>
          <div style={stack}>
            {(["info", "success", "warning"] as const).map((look) => (
              <div key={look} style={{ display: "grid", gap: "var(--fui-space-2)" }} data-pair={look}>
                <div data-kind="variant">
                  <Alert variant={look}>
                    <AlertTitle>{look}</AlertTitle>
                    <AlertDescription>Drawn with `variant`, as it has been since 0.4.</AlertDescription>
                  </Alert>
                </div>
                <div data-kind="tone">
                  <Alert tone={look}>
                    <AlertTitle>{look}</AlertTitle>
                    <AlertDescription>Drawn with `tone`, which says the same thing.</AlertDescription>
                  </Alert>
                </div>
              </div>
            ))}
            <div data-pair="danger" style={{ display: "grid", gap: "var(--fui-space-2)" }}>
              <div data-kind="variant">
                <Alert variant="destructive">
                  <AlertTitle>destructive</AlertTitle>
                  <AlertDescription>An alert region, as a failure is.</AlertDescription>
                </Alert>
              </div>
              <div data-kind="tone">
                <Alert tone="danger">
                  <AlertTitle>danger</AlertTitle>
                  <AlertDescription>An alert region, as a failure is.</AlertDescription>
                </Alert>
              </div>
            </div>
          </div>
        </Frame>
      </Block>
      <Block title="Counting what a field holds" description="Under, near, at and past a soft limit; words; and a field that is Arabic, right to left, in Arabic digits.">
        <Frame width={520}>
          <div style={stack}>
            <Field label="Run name" optional>
              {(props) => <Input {...props} count={{ max: 24 }} defaultValue="nightly" />}
            </Field>
            <Field label="Commit message">
              {(props) => <Input {...props} count={{ max: 40 }} defaultValue="rename the nightly job to run-nightly-for-the-relay" />}
            </Field>
            <Field label="Release note">
              {(props) => <Textarea {...props} count={{ max: 40 }} defaultValue="Rename the nightly job to the relay's own name." rows={2} />}
            </Field>
            <Field label="Changelog line">
              {(props) => <Textarea {...props} count={{ max: 40 }} defaultValue={`${"Rename the nightly job. "}${"A longer line that goes past the limit. "}`} rows={2} />}
            </Field>
            <Field label="Summary" description="Twenty words at most.">
              {(props) => <Textarea {...props} count={{ max: 20, unit: "words" }} defaultValue={line(23, "kept")} rows={2} />}
            </Field>
            <Field label="Typing here" description="The count follows the keyboard.">
              {(props) => <Textarea {...props} count={{ max: 20 }} data-testid="typing" rows={2} />}
            </Field>
            <Field label="Short code" description="Twelve characters, and not one more.">
              {(props) => <Input {...props} count={{ max: 12, soft: false }} data-testid="hard" />}
            </Field>
            <Frame dir="rtl">
              <LabelsProvider locale="ar-EG">
                <Field label="عنوان التشغيل">
                  {(props) => <Input {...props} count={{ max: 30 }} defaultValue="تشغيل ليلي للرالي" />}
                </Field>
              </LabelsProvider>
            </Frame>
            <Field label="Chinese note" description="Counted in words, which its own script does not space.">
              {(props) => <Textarea {...props} count={{ unit: "words" }} defaultValue="今天的部署没有失败，所有人都可以回家了。" data-testid="chinese" rows={1} />}
            </Field>
          </div>
        </Frame>
      </Block>
      <Block title="A field's parts, and the render prop beside them" description="The same plate, label, description and error: one drawn by a function child, one assembled from parts.">
        <Frame width={520}>
          <div style={stack}>
            <Field error="That address is not reachable." label="Work email" required>
              {(props) => <Input {...props} defaultValue="ops@example" />}
            </Field>
            <Field optional label="Deploy key">
              {(props) => <Input {...props} defaultValue="key_2f9c" />}
            </Field>
            <div data-testid="parts-email">
              <Field id="parts-field">
                <PartsEmail />
              </Field>
            </div>
            <FieldSeparator>or</FieldSeparator>
            <div data-testid="parts-title">
              <Field id="parts-name">
                <PartsTitle />
              </Field>
            </div>
          </div>
        </Frame>
      </Block>
      <Block title="Sliders in a panel" description="A row with its name and its value, a step that decides the decimals, a disabled row, and a panel whose columns line up.">
        <Frame width={520}>
          <div style={stack}>
            <Slider defaultValue={40} label="Batch size" marks={[0, 50, 100]} max={100} min={0} step={5} unit="rows" />
            <Slider defaultValue={0.35} label="Opacity" max={1} min={0} step={0.05} />
            <Slider defaultValue={120} label="Timeout" max={600} min={0} step={10} unit="ms" />
            <SliderPanel />
            <Frame dir="rtl">
              <Slider defaultValue={30} label="الحجم" max={100} min={0} unit="صفوف" />
            </Frame>
          </div>
        </Frame>
      </Block>
      <Block title="A legend of the host's own" description="The chart's own rows, static or as toggles, each key painted solid, dashed or in the dither; and a continuous ramp in cells.">
        <Frame width={520}>
          <div style={stack}>
            <ChartLegend data-testid="static-legend">
              <LegendItem color="var(--chart-1)" label="Requests" />
              <LegendItem color="var(--destructive)" label="Errors" pattern="dashed" />
              <LegendItem color="var(--brand)" label="P95" pattern="dither" />
            </ChartLegend>
            <ToggleableLegend />
            <div style={row}>
              <Swatch color="var(--chart-1)" />
              <Swatch color="var(--chart-2)" pattern="dashed" />
              <Swatch color="var(--brand)" pattern="dither" />
            </div>
            <ColorRamp
              format={(value) => `${value}`}
              label="Requests per minute"
              marks={[{ value: 25, label: "25" }, { value: 50, label: "50" }, { value: 75, label: "75" }]}
              max={100}
              min={0}
              stops={["var(--chart-1)", "var(--chart-3)", "var(--destructive)"]}
            />
          </div>
        </Frame>
      </Block>
      <Block title="One key that stays on" description="Each size, off and pressed, a disabled key, and a tag that is a link painted by badgeVariants.">
        <Frame width={520}>
          <div style={stack}>
            <div style={row} data-testid="toggles">
              <Toggle aria-label="Bold" variant="outline">
                Default
              </Toggle>
              <Toggle aria-label="Italic" defaultPressed variant="outline">
                Default
              </Toggle>
              <Toggle aria-label="Underline" size="sm" variant="outline">
                Small
              </Toggle>
              <Toggle aria-label="Strike" defaultPressed size="sm" variant="outline">
                Small
              </Toggle>
              <Toggle aria-label="Code" size="lg" variant="outline">
                Large
              </Toggle>
              <Toggle aria-label="Mark" defaultPressed size="lg" variant="outline">
                Large
              </Toggle>
            </div>
            <div style={row} data-testid="toggles-look">
              <Toggle defaultPressed variant="default">
                Inbox
              </Toggle>
              <Toggle variant="default">Inbox</Toggle>
              <Toggle variant="outline">Outline</Toggle>
              <Toggle defaultPressed variant="outline">
                Outline
              </Toggle>
              <Toggle disabled variant="outline">
                Off limits
              </Toggle>
            </div>
            <div style={row}>
              <a className={badgeVariants({ tone: "info" })} href="#release">
                New
              </a>
              <a className={badgeVariants({ tone: "warning", variant: "outline" })} href="#release">
                Outline
              </a>
              <a className={badgeVariants({ size: "lg", variant: "solid" })} href="#release">
                Solid
              </a>
            </div>
          </div>
        </Frame>
      </Block>
      <Block title="What a finished picture offers" description="Saved under a name and copied, on hover and on keyboard focus; a video with its own controls; and the prompt while it is made.">
        <Frame width={520}>
          <div style={{ display: "grid", gap: "var(--fui-space-3)", gridTemplateColumns: "repeat(auto-fit, minmax(10rem, 1fr))" }}>
            <GenerationFrame actions={["download", "copy"]} alt="A harbour at dusk" downloadName="harbour.png" src={PHOTOS[0]!.src} status="done" />
            <GenerationFrame
              actions={["download"]}
              alt="A short film of the harbour"
              downloadName="harbour.mp4"
              kind="video"
              poster={PHOTOS[1]!.src}
              src={PHOTOS[1]!.src}
              status="done"
            />
            <GenerationFrame actions={["download"]} alt="A harbour at dusk" onOpen={nothing} src={PHOTOS[2]!.src} status="done" />
            <GenerationFrame
              alt="A harbour at dusk"
              prompt="a harbour at dusk, seen from the quay, long exposure"
              progress={0.42}
              showPrompt
              status="generating"
            />
          </div>
        </Frame>
      </Block>
    </Page>
  );
}

/** A title over a field whose name is not a form label. */
function PartsTitle() {
  return (
    <>
      <FieldTitle>Deploy key</FieldTitle>
      <FieldContent>
        <FieldDescription>A key is a name for a machine, not a secret.</FieldDescription>
      </FieldContent>
    </>
  );
}

const meta = {
  title: "Tests/Controls 0.12",
  parameters: { layout: "fullscreen" },
  render: () => <Bench />,
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Pieces: Story = {};

/** A notice that arrives after the first paint, under a sticky header and above a bar: it brings itself into view. */
function RevealBench() {
  const [sent, setSent] = useState(false);
  return (
    <div data-testid="reveal-page" style={{ minBlockSize: "100vh" }}>
      <header
        style={{
          position: "sticky",
          insetBlockStart: 0,
          zIndex: 2,
          display: "flex",
          alignItems: "center",
          blockSize: "var(--fui-header-height)",
          padding: "0 var(--fui-space-4)",
          borderBlockEnd: "1px solid var(--border)",
          background: "var(--card)",
        }}
      >
        Relay console
      </header>
      <div style={{ display: "grid", gap: "var(--fui-space-4)", padding: "var(--fui-space-4)" }}>
        <div style={{ blockSize: "80vh", border: "1px dashed var(--border)" }}>The form above, taller than the screen.</div>
        <Button data-testid="reveal-send" onClick={() => setSent(true)}>
          Send the request
        </Button>
        {sent ? (
          <Alert data-testid="late-alert" revealOnMount variant="warning">
            <AlertTitle>The relay did not answer</AlertTitle>
            <AlertDescription>Nothing was lost. The request can be sent again.</AlertDescription>
          </Alert>
        ) : null}
        <div style={{ blockSize: "60vh", border: "1px dashed var(--border)" }}>The notes below.</div>
      </div>
      <ActionBar aria-label="Session actions" end={<Button>Continue</Button>} />
    </div>
  );
}

export const Reveal: Story = {
  render: () => <RevealBench />,
};
