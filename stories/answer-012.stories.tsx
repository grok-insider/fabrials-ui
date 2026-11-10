import { useEffect, useRef, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { Button, DirectionProvider, LabelsProvider } from "@fabrials/ui";
import {
  ChatMessage,
  CopyMessageAction,
  EditableMessage,
  EditMessageAction,
  MarkdownCallout,
  MessageActions,
  MessageTimestamp,
} from "@fabrials/ai-ui";
import { Block, Frame, Page } from "./story-frame";

// The pieces of 0.12 that an answer is made of, in fixed states: the callouts of a markdown answer, the same markup written
// by a host, a sent message edited in place, and a time in the reader's zone. The visual suite fixes the clock, so the
// stamps read the same on every run.

const KINDS = ["note", "tip", "important", "warning", "caution", "example", "definition", "summary", "question"] as const;

const BODY: Record<(typeof KINDS)[number], string> = {
  note: "The cache is warm, so the next import reads from disk.",
  tip: "Start from the units: multiply after converting, never before.",
  important: "This release renames the environment variable. Update the deployment before the next build.",
  warning: "Two of the four jobs failed, and the run continues with the rest.",
  caution: "Deleting the workspace removes its history as well. There is no undo.",
  example: "For a shipment of 12 crates: 12 × 4 h = 48 working hours.",
  definition: "A worker is the process that runs one job at a time.",
  summary: "Three things to take away: read the tokens first, then the layout, then the motion.",
  question: "What happens to a draft when the connection drops?",
};

function Stamp({ date, format }: { date: string; format?: "message" | "time" | "dateTime" }) {
  // A zone the picture fixes, and a language it names, so the same image comes out of every machine.
  return <MessageTimestamp date={date} format={format} locale="en-GB" timeZone="Europe/Madrid" />;
}

/** A sent message that is edited where it stands, and the two outcomes a host can meet: a slow send and a refused one. */
function LiveEditing() {
  const [sent, setSent] = useState(["Move the call to 15:00."]);
  const [editing, setEditing] = useState(false);
  const [calls, setCalls] = useState(0);
  const edit = useRef<HTMLButtonElement | null>(null);
  const message = sent[sent.length - 1]!;
  return (
    <div style={{ display: "grid", gap: "var(--fui-space-4)" }} data-testid="live-editing">
      {sent.map((text, index) => (
        <ChatMessage
          actions={
            <MessageActions>
              <CopyMessageAction text={text} />
              {index === sent.length - 1 ? (
                <EditMessageAction onClick={() => setEditing(true)} ref={edit} />
              ) : null}
            </MessageActions>
          }
          from="user"
          key={`${index}-${text}`}
          pinActions
        >
          <p style={{ margin: 0 }}>{text}</p>
        </ChatMessage>
      ))}
      {editing ? (
        <EditableMessage
          hint="Sending this replaces what came after it."
          onCancel={() => setEditing(false)}
          onSubmit={(next) => {
            setCalls((count) => count + 1);
            // Slow on purpose: a second key press while it waits must not send again.
            return new Promise<void>((resolve) => {
              window.setTimeout(() => {
                setSent((list) => [...list, next]);
                setEditing(false);
                resolve();
              }, 700);
            });
          }}
          returnFocusRef={edit}
          value={message}
        />
      ) : null}
      <p className="fui-sr-only" data-testid="editing-calls">
        {calls}
      </p>
    </div>
  );
}

function Bench() {
  const now = Date.now();
  return (
    <Page
      description="The callouts of an answer in every kind, the same classes written by a host's renderer, a sent message edited in place and a time in the reader's zone."
      title="Answers 0.12"
    >
      <Block description="Each kind is a tint of its tone with the title and the mark in that tone's ink, and no side bar." title="Each kind of note">
        <Frame width={620}>
          <div style={{ display: "grid", gap: "var(--fui-space-1)" }}>
            {KINDS.map((kind) => (
              <MarkdownCallout key={kind} kind={kind}>
                <p>{BODY[kind]}</p>
              </MarkdownCallout>
            ))}
          </div>
        </Frame>
      </Block>
      <Block description="A title of your own names the callout for a screen reader too; a list, an inline command and a code block inside keep the answer's own styles." title="Titles, and what goes inside">
        <Frame width={620}>
          <div style={{ display: "grid", gap: "var(--fui-space-1)" }}>
            <MarkdownCallout kind="tip" title="Start from the units">
              <p>Convert once, at the end, or the rounding climbs.</p>
            </MarkdownCallout>
            <MarkdownCallout kind="warning" title="Check the deployment first">
              <p>Three steps, in this order:</p>
              <ol>
                <li>Set the environment variable.</li>
                <li>Restart the worker, then the web process.</li>
                <li>Run <code>spanreed doctor</code> and read the last line.</li>
              </ol>
              <pre>{`SPANREED_MODE=vps\nSPANREED_DB=postgres://…`}</pre>
            </MarkdownCallout>
            <MarkdownCallout kind="question">
              <ul>
                <li>What does a draft keep when the connection drops?</li>
                <li>And what does the thread show meanwhile?</li>
              </ul>
            </MarkdownCallout>
          </div>
        </Frame>
      </Block>
      <Block description="What a host's own renderer writes: the same classes and kind, inside the markdown of an answer." title="Written by a host">
        <Frame width={620}>
          <div className="fui-markdown">
            <p>
              Import the pieces once, then trust the cascade. The order matters more than the version: tokens, fonts, the
              library's styles, then the AI pieces.
            </p>
            <aside aria-label="Warning" className="fui-callout" data-kind="warning" role="note">
              <p className="fui-callout-title" dir="auto">
                <span aria-hidden="true" className="fui-callout-icon">
                  <svg aria-hidden="true" fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="16">
                    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
                    <path d="M12 9v4" />
                    <path d="M12 17h.01" />
                  </svg>
                </span>
                Warning
              </p>
              <div className="fui-callout-body">
                <p>A stylesheet imported after the library wins every tie, even the ones you did not mean.</p>
              </div>
            </aside>
            <p>
              A quote stays a quote: only a blockquote whose first line opens with a kind becomes a callout.
            </p>
            <aside aria-label="Tip" className="fui-callout" data-kind="tip" role="note">
              <p className="fui-callout-title" dir="auto">
                <span aria-hidden="true" className="fui-callout-icon">
                  <svg aria-hidden="true" fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="16">
                    <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
                    <path d="M9 18h6" />
                    <path d="M10 22h4" />
                  </svg>
                </span>
                Tip
              </p>
              <div className="fui-callout-body">
                <p>Run the class list through your own renderer's test: the markup is the whole contract.</p>
              </div>
            </aside>
          </div>
        </Frame>
      </Block>
      <Block description="The bubble's own size, the hint in the host's words, a key that waits and a failure that keeps the draft." title="Editing a message">
        <Frame width={640}>
        <div style={{ display: "grid", gap: "var(--fui-space-5)" }}>
          <ChatMessage
            actions={
              <MessageActions>
                <CopyMessageAction text="Send the invoice to Ana before noon." />
                <EditMessageAction />
              </MessageActions>
            }
            from="user"
            pinActions
          >
            <p style={{ margin: 0 }}>Send the invoice to Ana before noon.</p>
          </ChatMessage>
          <div data-testid="edit-idle">
            <EditableMessage
              autoFocus={false}
              onCancel={() => undefined}
              onSubmit={() => Promise.reject(new Error("The thread is read only until the sync ends."))}
              value="Send the invoice to Ana before noon."
            />
          </div>
          <div data-testid="edit-hint">
            <EditableMessage
              autoFocus={false}
              hint="Sending this replaces what came after it."
              onCancel={() => undefined}
              onSubmit={() => undefined}
              value="Send the invoice to Ana before noon, and copy billing."
            />
          </div>
          <div data-testid="edit-pending">
            <EditableMessage autoFocus={false} onCancel={() => undefined} onSubmit={() => undefined} pending value="Send the invoice to Ana before noon." />
          </div>
          <div data-testid="edit-error">
            <EditableMessage autoFocus={false} error="The message was not saved: the thread is read only until the sync ends." onCancel={() => undefined} onSubmit={() => undefined} value="Send the invoice to Ana before noon." />
          </div>
          <div data-testid="edit-live">
            <LiveEditing />
          </div>
        </div>
        </Frame>
      </Block>
      <Block description="A fixed zone so the picture is the same everywhere: today, another day, and the whole stamp." title="When it was sent">
        <Frame width={420}>
          <div style={{ display: "grid", gap: "var(--fui-space-2)" }}>
            <Stamp date={new Date(now - 40 * 60_000).toISOString()} />
            <Stamp date={new Date(now - 3 * 24 * 60 * 60_000).toISOString()} />
            <Stamp date={new Date(now - 40 * 60_000).toISOString()} format="dateTime" />
            <Stamp date={new Date(now - 40 * 60_000).toISOString()} format="time" />
          </div>
        </Frame>
      </Block>
      <Block description="An Arabic callout mirrors: the mark sits on the right of its title, the words run from the right." title="Right to left">
        <Frame dir="rtl" width={560}>
          <div dir="rtl" style={{ display: "grid", gap: "var(--fui-space-1)" }}>
            <MarkdownCallout kind="tip" title="ابدأ من الوحدات">
              <p>حوّل في النهاية مرة واحدة، وإلا تراكم التقريب.</p>
            </MarkdownCallout>
            <MarkdownCallout kind="warning">
              <p>تعذّر تشغيل مهمتين من أصل أربع، وأكمل التشغيل الباقي.</p>
            </MarkdownCallout>
          </div>
        </Frame>
      </Block>
    </Page>
  );
}

// --- a stamp rendered on the server, then hydrated in the reader's zone --------------------------------------------------

const SENT = "2026-11-10T02:00:00Z";

function ReaderStamp() {
  return (
    <div style={{ display: "grid", gap: "var(--fui-space-2)" }}>
      <p style={{ margin: 0 }} data-testid="stamp-row">
        <MessageTimestamp date={SENT} locale="ja-JP" />
      </p>
      <p style={{ margin: 0 }} data-testid="after-row">
        Sent by the reader
      </p>
    </div>
  );
}

type Box = { text: string; width: number; height: number; hidden: boolean; title: string | null; ariaHidden: boolean };
type Report = { before: Box; after: Box; afterTop: [number, number]; errors: string[] };

function Hydration() {
  const host = useRef<HTMLDivElement | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  useEffect(() => {
    const container = host.current!;
    const read = (): Box => {
      const stamp = container.querySelector("time")!;
      const box = stamp.getBoundingClientRect();
      return {
        text: stamp.textContent ?? "",
        width: box.width,
        height: box.height,
        hidden: getComputedStyle(stamp).visibility === "hidden",
        title: stamp.getAttribute("title"),
        ariaHidden: stamp.getAttribute("aria-hidden") === "true",
      };
    };
    const top = () => container.querySelector<HTMLElement>('[data-testid="after-row"]')!.getBoundingClientRect().top;
    let root: ReturnType<typeof hydrateRoot> | null = null;
    let timer = 0;
    let cancelled = false;
    // Measured once the page's own font has arrived, so what is compared is the text and not the fallback's metrics.
    void document.fonts.ready.then(() => {
      if (cancelled) return;
      container.innerHTML = renderToString(<ReaderStamp />);
      const before = read();
      const beforeTop = top();
      const errors: string[] = [];
      root = hydrateRoot(container, <ReaderStamp />, { onRecoverableError: (error) => errors.push(String(error)) });
      timer = window.setTimeout(() => setReport({ before, after: read(), afterTop: [beforeTop, top()], errors }), 300);
    });
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      root?.unmount();
    };
  }, []);
  return (
    <Page description="The server's markup, measured, then hydrated in this browser's zone and language." title="A stamp, hydrated">
      <Block title="Server render, then hydration">
        <Frame width={420}>
          <div ref={host} />
        </Frame>
        <pre data-testid="stamp-hydration" style={{ margin: 0, fontFamily: "var(--fui-font-mono)", fontSize: "var(--fui-text-xs)", whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
          {report ? JSON.stringify(report, null, 1) : "measuring"}
        </pre>
      </Block>
    </Page>
  );
}

const meta = {
  title: "Tests/Answer 0.12",
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <LabelsProvider labels={{ markdownCallout: { question: "Check yourself" } }}>
        <DirectionProvider direction="ltr">
          <Story />
        </DirectionProvider>
      </LabelsProvider>
    ),
  ],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Pieces: Story = { render: () => <Bench /> };
export const StampHydration: Story = { render: () => <Hydration /> };

// A key of its own so the pictures and the behaviour both read the same component.
export const EditKey: Story = {
  render: () => (
    <Page description="The key that opens the editor, in a message's action row." title="Edit key">
      <Block title="In an action row">
        <Frame width={420}>
          <ChatMessage actions={<MessageActions><EditMessageAction /><CopyMessageAction text="Move the call to 15:00." /></MessageActions>} from="user" pinActions>
            <p style={{ margin: 0 }}>Move the call to 15:00.</p>
          </ChatMessage>
          <Button onClick={() => undefined} size="sm" variant="ghost">
            Nothing
          </Button>
        </Frame>
      </Block>
    </Page>
  ),
};
